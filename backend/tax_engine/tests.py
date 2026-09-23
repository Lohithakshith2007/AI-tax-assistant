import json
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase, Client

from .models import TaxCalculation
from .services.tax_service import calculate_tax_by_country


class TaxCalculationServiceTests(TestCase):

    def test_india_tax_calculation(self):
        tax, breakdown = calculate_tax_by_country("india", 2_000_000)

        self.assertEqual(tax, 300_000)
        self.assertGreater(len(breakdown), 0)

    def test_country_name_is_case_insensitive(self):
        tax_lower, _ = calculate_tax_by_country("india", 2_000_000)
        tax_upper, _ = calculate_tax_by_country("INDIA", 2_000_000)

        self.assertEqual(tax_lower, tax_upper)

    def test_zero_income_has_zero_tax(self):
        tax, breakdown = calculate_tax_by_country("india", 0)

        self.assertEqual(tax, 0)
        self.assertEqual(breakdown, [])

    def test_unsupported_country_raises_error(self):
        with self.assertRaises(ValueError):
            calculate_tax_by_country("germany", 1_000_000)

    def test_us_tax_calculation(self):
        tax, breakdown = calculate_tax_by_country("us", 50_000)

        self.assertGreater(tax, 0)
        self.assertGreater(len(breakdown), 0)

    def test_uk_tax_calculation(self):
        tax, breakdown = calculate_tax_by_country("uk", 60_000)

        self.assertGreater(tax, 0)
        self.assertGreater(len(breakdown), 0)

    def test_canada_tax_calculation(self):
        tax, breakdown = calculate_tax_by_country("canada", 100_000)

        self.assertGreater(tax, 0)
        self.assertGreater(len(breakdown), 0)

    def test_australia_tax_calculation(self):
        tax, breakdown = calculate_tax_by_country("australia", 100_000)

        self.assertGreater(tax, 0)
        self.assertGreater(len(breakdown), 0)


class TaxCalculationAPITests(TestCase):

    def setUp(self):
        self.client = Client()

        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword123"
        )

    @patch("tax_engine.views.get_ai_suggestions")
    def test_authenticated_calculation_returns_result(self, mock_ai):
        mock_ai.return_value = "Test AI explanation"

        self.client.login(
            username="testuser",
            password="testpassword123"
        )

        response = self.client.post(
            "/calculate/",
            data=json.dumps({
                "country": "india",
                "income": 5_000_000,
                "deductions": 3_000_000,
                "age": 38
            }),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(data["country"], "india")
        self.assertEqual(data["taxable_income"], 2_000_000)
        self.assertEqual(data["estimated_tax"], 300_000)

        self.assertEqual(TaxCalculation.objects.count(), 1)

        calculation = TaxCalculation.objects.first()

        self.assertEqual(calculation.user, self.user)
        self.assertEqual(calculation.taxable_income, 2_000_000)
        self.assertEqual(calculation.estimated_tax, 300_000)
        self.assertEqual(
            calculation.ai_explanation,
            "Test AI explanation"
        )

    @patch("tax_engine.views.get_ai_suggestions")
    def test_unauthenticated_calculation_does_not_save_history(
        self,
        mock_ai
    ):
        mock_ai.return_value = "Test AI explanation"

        response = self.client.post(
            "/calculate/",
            data=json.dumps({
                "country": "india",
                "income": 5_000_000,
                "deductions": 3_000_000,
                "age": 38
            }),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(TaxCalculation.objects.count(), 0)

    @patch("tax_engine.views.get_ai_suggestions")
    def test_ai_service_is_called(self, mock_ai):
        mock_ai.return_value = "Test AI explanation"

        self.client.login(
            username="testuser",
            password="testpassword123"
        )

        response = self.client.post(
            "/calculate/",
            data=json.dumps({
                "country": "india",
                "income": 5_000_000,
                "deductions": 3_000_000,
                "age": 38
            }),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        mock_ai.assert_called_once()

    def test_invalid_json_returns_error(self):
        response = self.client.post(
            "/calculate/",
            data="not valid json",
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 500)
        self.assertIn("error", response.json())

    @patch("tax_engine.views.get_ai_suggestions")
    def test_tax_calculation_creates_one_history_record(
        self,
        mock_ai
    ):
        mock_ai.return_value = "Test AI explanation"

        self.client.login(
            username="testuser",
            password="testpassword123"
        )

        payload = {
            "country": "india",
            "income": 1_000_000,
            "deductions": 100_000,
            "age": 30
        }

        response = self.client.post(
            "/calculate/",
            data=json.dumps(payload),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            TaxCalculation.objects.filter(
                user=self.user
            ).count(),
            1
        )


class TaxCalculationModelTests(TestCase):

    def test_tax_calculation_string_representation(self):
        user = User.objects.create_user(
            username="modeltest",
            password="password123"
        )

        calculation = TaxCalculation.objects.create(
            user=user,
            country="india",
            income=1_000_000,
            deductions=100_000,
            taxable_income=900_000,
            estimated_tax=60_000,
            ai_explanation="Test explanation"
        )

        self.assertEqual(
            str(calculation),
            "modeltest - india - 60000"
        )