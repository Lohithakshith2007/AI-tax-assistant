from django.urls import path
from .views import calculate_tax

urlpatterns = [
    path('api/calculate-tax/', calculate_tax, name='calculate_tax'),
]