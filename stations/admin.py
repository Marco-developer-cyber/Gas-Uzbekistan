from django.contrib import admin
from .models import Station, FuelType

@admin.register(FuelType)
class FuelTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ('name', 'region', 'city', 'rating', 'is_open_now')
    list_filter = ('region', 'city', 'is_open_now', 'fuels')
    search_fields = ('name', 'address', 'region', 'city')
    filter_horizontal = ('fuels',) # Multi-select widget with arrows
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
        'is_open_now',
        'fuels',
    )
