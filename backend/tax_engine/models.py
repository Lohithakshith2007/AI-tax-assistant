from django.db import models
from django.contrib.auth.models import User


class TaxCalculation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    country = models.CharField(max_length=50)
    income = models.FloatField()
    deductions = models.FloatField()
    taxable_income = models.FloatField()
    estimated_tax = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.country} - {self.estimated_tax}"