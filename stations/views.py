from django.shortcuts import render
from django.http import JsonResponse
from .models import Station, FuelType

def index(request):
    regions = Station.objects.values_list('region', flat=True).distinct().order_by('region')
    cities = Station.objects.values_list('city', flat=True).distinct().order_by('city')
    fuel_types = FuelType.objects.all().order_by('name')
    return render(request, 'index.html', {
        'regions': regions,
        'cities': cities,
        'fuel_types': fuel_types
    })

def api_stations(request):
    # Use select_related/prefetch_related for performance
    stations = Station.objects.prefetch_related('fuels').all()
    
    # Filtering
    search = request.GET.get('search', '')
    region = request.GET.get('region', '')
    fuel_type_id = request.GET.get('fuel_type', '')
    
    if search:
        stations = stations.filter(name__icontains=search) | stations.filter(address__icontains=search)
    if region:
        stations = stations.filter(region=region)
    if fuel_type_id:
        stations = stations.filter(fuels__id=fuel_type_id)

    data = []
    for s in stations:
        data.append({
            'id': s.id,
            'name': s.name,
            'rating': s.rating,
            'address': s.address,
            'city': s.city,
            'region': s.region,
            'lat': s.latitude,
            'lng': s.longitude,
            'is_open_now': s.is_open_now,
            'fuel_types': [f.name for f in s.fuels.all()],
            'description': s.description or '',
            'open_time': s.open_time or '',
            'image_url': s.image.url if s.image else ''
        })
        
    return JsonResponse({'stations': data})
