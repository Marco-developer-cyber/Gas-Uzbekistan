from django.db import models

class FuelType(models.Model):
    name = models.CharField(max_length=50, unique=True, help_text="e.g. AI-91, AI-95, CNG")
    
    def __str__(self):
        return self.name

class Station(models.Model):
    name = models.CharField(max_length=200)
    rating = models.FloatField(default=0.0)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    longitude = models.FloatField(verbose_name="Longitude (X)")
    latitude = models.FloatField(verbose_name="Latitude (Y)")
    
    description = models.TextField(blank=True, null=True)
    open_time = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. 08:00 - 22:00 or 24/7")
    image = models.ImageField(upload_to='stations/', blank=True, null=True)
    
    is_open_now = models.BooleanField(default=True)
    
    # Using ManyToMany for better admin selection
    fuels = models.ManyToManyField(FuelType, blank=True, related_name='stations')

    def __str__(self):
        return f"{self.name} ({self.city})"
