import mimetypes
from pathlib import Path
from urllib.parse import unquote, urlparse
from uuid import uuid4

import requests
from django import forms
from django.contrib import admin, messages
from django.core.files.base import ContentFile
from django.utils.text import get_valid_filename

from .models import FuelType, Station


class StationAdminForm(forms.ModelForm):
    image_url = forms.URLField(
        required=False,
        label="Image URL (Internet)",
        help_text="Можно вставить прямую ссылку на картинку (http/https).",
    )

    class Meta:
        model = Station
        fields = "__all__"

    def clean_image_url(self):
        value = (self.cleaned_data.get("image_url") or "").strip()
        if not value:
            return ""

        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"}:
            raise forms.ValidationError("Используйте ссылку, которая начинается с http:// или https://")
        return value

@admin.register(FuelType)
class FuelTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    form = StationAdminForm
    list_display = ('name', 'region', 'city', 'rating', 'is_open_now')
    list_filter = ('region', 'city', 'is_open_now', 'fuels')
    search_fields = ('name', 'address', 'region', 'city')
    filter_horizontal = ('fuels',)  # Multi-select widget with arrows
    fields = (
        'name',
        'rating',
        'address',
        'city',
        'region',
        'longitude',
        'latitude',
        'description',
        'open_time',
        'image',
        'image_url',
        'is_open_now',
        'fuels',
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['longitude'].label = 'Longitude (Y)'
        form.base_fields['latitude'].label = 'Latitude (X)'
        return form

    @staticmethod
    def _build_filename(image_url: str, content_type: str) -> str:
        raw_name = Path(unquote(urlparse(image_url).path)).name
        stem = get_valid_filename(Path(raw_name).stem) if raw_name else "station"
        if not stem:
            stem = "station"

        ext = Path(raw_name).suffix.lower()
        if not ext:
            guessed = mimetypes.guess_extension((content_type or "").split(";")[0].strip())
            ext = ".jpg" if guessed in {None, ".jpe"} else guessed

        return f"{stem}-{uuid4().hex[:8]}{ext}"

    def _download_image(self, image_url: str) -> tuple[ContentFile, str]:
        response = requests.get(image_url, timeout=20)
        response.raise_for_status()

        content_type = (response.headers.get("Content-Type") or "").lower()
        if content_type and not content_type.startswith("image/"):
            raise ValueError("ссылка не ведет на изображение")
        if not response.content:
            raise ValueError("изображение пустое")

        filename = self._build_filename(image_url, content_type)
        return ContentFile(response.content), filename

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

        image_url = form.cleaned_data.get("image_url")
        if not image_url:
            return

        try:
            content, filename = self._download_image(image_url)
            obj.image.save(filename, content, save=True)
            self.message_user(request, "Изображение по ссылке успешно загружено.", level=messages.SUCCESS)
        except Exception as exc:
            self.message_user(
                request,
                f"Не удалось загрузить изображение по ссылке: {exc}",
                level=messages.ERROR,
            )
