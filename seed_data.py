import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gas_uzbekistan.settings')
django.setup()

from stations.models import Station, FuelType

def create_dummy_data():
    Station.objects.all().delete()
    FuelType.objects.all().delete()
    
    # Pre-create all fuel types
    fuel_names = ["PETROL AI-80", "PETROL AI-92", "PETROL AI-95", "PETROL AI-98", "DIESEL", "CNG", "LPG"]
    fuel_objects = {}
    for name in fuel_names:
        fuel, _ = FuelType.objects.get_or_create(name=name)
        fuel_objects[name] = fuel

    stations_data = [
        {
            "name": "Lukoil - Amir Temur Ave",
            "rating": 4.8,
            "address": "123 Amir Temur Ave",
            "city": "Tashkent",
            "region": "Tashkent",
            "latitude": 41.3400,
            "longitude": 69.2800,
            "is_open_now": True,
            "open_time": "24/7",
            "fuel_types": ["PETROL AI-95", "DIESEL", "CNG"]
        },
        {
            "name": "UNG Petrol Station",
            "rating": 4.2,
            "address": "67 Buyuk Ipak Yo'li",
            "city": "Tashkent",
            "region": "Tashkent",
            "latitude": 41.3200,
            "longitude": 69.3000,
            "is_open_now": True,
            "open_time": "08:00 - 23:00",
            "fuel_types": ["PETROL AI-92", "PETROL AI-80"]
        },
        {
            "name": "Jizzakh Petroleum",
            "rating": 4.5,
            "address": "Samarkand Road",
            "city": "Navoi",
            "region": "Navoi",
            "latitude": 40.1000,
            "longitude": 65.3700,
            "is_open_now": True,
            "open_time": "06:00 - 00:00",
            "fuel_types": ["PETROL AI-98", "LPG"]
        },
        {
            "name": "Mustaqillik Station",
            "rating": 3.9,
            "address": "Kukcha Darvoza",
            "city": "Tashkent",
            "region": "Tashkent",
            "latitude": 41.3100,
            "longitude": 69.2200,
            "is_open_now": False,
            "open_time": "09:00 - 18:00",
            "fuel_types": ["CNG", "DIESEL"]
        },
        {
            "name": "Bukhara Gas Hub",
            "rating": 4.7,
            "address": "B. Naqshbandi St",
            "city": "Bukhara",
            "region": "Bukhara",
            "latitude": 39.7700,
            "longitude": 64.4200,
            "is_open_now": True,
            "open_time": "24/7",
            "fuel_types": ["PETROL AI-95", "LPG"]
        },
         {
            "name": "Samarqand Eco-Fuel",
            "rating": 4.6,
            "address": "Registan Square Route",
            "city": "Samarkand",
            "region": "Samarkand",
            "latitude": 39.6500,
            "longitude": 66.9700,
            "is_open_now": True,
            "open_time": "24/7",
            "fuel_types": ["PETROL AI-92", "CNG"]
        }
    ]

    for data in stations_data:
        fuels = data.pop('fuel_types')
        station = Station.objects.create(**data)
        for f_name in fuels:
            station.fuels.add(fuel_objects[f_name])
        
    print(f"Successfully added {len(stations_data)} dummy stations.")

if __name__ == '__main__':
    create_dummy_data()
