from django.contrib import admin

# Register your models here.
from .models import TaxCalculation

admin.site.register(TaxCalculation)