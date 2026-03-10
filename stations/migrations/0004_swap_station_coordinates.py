from django.db import migrations


def swap_station_coordinates(apps, schema_editor):
    Station = apps.get_model("stations", "Station")

    for station in Station.objects.all():
        station.latitude, station.longitude = station.longitude, station.latitude
        station.save(update_fields=["latitude", "longitude"])


class Migration(migrations.Migration):
    dependencies = [
        ("stations", "0003_fueltype_remove_station_fuel_types_station_fuels"),
    ]

    operations = [
        migrations.RunPython(
            swap_station_coordinates,
            migrations.RunPython.noop,
        ),
    ]
