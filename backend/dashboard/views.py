from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tax_engine.models import TaxCalculation


@login_required
def dashboard_view(request):
    calculations = TaxCalculation.objects.filter(user=request.user).order_by('-created_at')

    return render(request, 'dashboard.html', {
        'calculations': calculations
    })