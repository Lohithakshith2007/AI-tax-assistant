from django.urls import path
from . import views

urlpatterns = [
    path("", views.landing, name="landing"),
    path("features/", views.features, name="features"),
    path("about/", views.about, name="about"),
]   