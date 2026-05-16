import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import requests
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from groq import Groq
import os
from dotenv import load_dotenv

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .services.tax_service import calculate_tax_by_country
from .services.ai_service import get_ai_suggestions

from .models import TaxCalculation

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@csrf_exempt
def calculate_tax(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            country = data.get("country")
            income = float(data.get("income", 0))
            deductions = float(data.get("deductions", 0))
            age = int(data.get("age", 0))

            taxable_income = income - deductions

            tax , breakdown = calculate_tax_by_country(country, taxable_income)

            prompt = f"""
            A {age}-year-old individual in {country} has a taxable income of {taxable_income}.
            Estimated tax is {tax}.
            Suggest legal and practical ways to reduce tax liability.
            Provide concise actionable advice.
            """

            ai_response = get_ai_suggestions(prompt)
            
            if request.user.is_authenticated:
                TaxCalculation.objects.create(
                    user=request.user,
                    country=country,
                    income=income,
                    deductions=deductions,
                    taxable_income=taxable_income,
                    estimated_tax=tax,
                    ai_explanation=ai_response
                )

            return JsonResponse({
                "country": country,
                "taxable_income": taxable_income,
                "estimated_tax": tax,
                "tax_breakdown": breakdown,
                "ai_suggestions": ai_response
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        

@csrf_exempt
def delete_calculation(request, calc_id):
    if request.method == "POST":
        try:
            calculation = TaxCalculation.objects.get(id=calc_id, user=request.user)
            calculation.delete()
            return JsonResponse({"status": "success"})
        except TaxCalculation.DoesNotExist:
            return JsonResponse({"error": "Calculation not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)


def landing(request):
    return render(request, "tax_engine/landing.html")

def features(request):
    return render(request, "tax_engine/features.html")

def about(request):
    return render(request, "tax_engine/about.html")