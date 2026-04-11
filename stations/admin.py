from django.contrib import admin

from .models import FuelType, Station


@admin.register(FuelType)
class FuelTypeAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "city", "rating", "is_open_now")
    list_filter = ("region", "city", "is_open_now", "has_wifi", "has_coffee", "has_fast_food", "has_shop", "fuels")
    search_fields = ("name", "address", "region", "city")
    filter_horizontal = ("fuels",)

    fieldsets = (
        (
            "Main",
            {
                "fields": (
                    "name",
                    "rating",
                    "address",
                    "city",
                    "region",
                    "longitude",
                    "latitude",
                    "description",
                    "open_time",
                    "is_open_now",
                    "fuels",
                )
            },
        ),
        (
            "Services",
            {
                "fields": (
                    "has_wifi",
                    "has_coffee",
                    "has_fast_food",
                    "has_shop",
                )
            },
        ),
        (
            "Photo Source",
            {
                "description": "Use one option: upload from PC or provide Internet URL.",
                "fields": ("image", "image_url"),
            },
        ),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields["longitude"].label = "Longitude (Y)"
        form.base_fields["latitude"].label = "Latitude (X)"
        return form
