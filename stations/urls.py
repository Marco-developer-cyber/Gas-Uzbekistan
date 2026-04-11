from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('map/', views.map_page, name='map_page'),
    path('api/stations/', views.api_stations, name='api_stations'),
]
