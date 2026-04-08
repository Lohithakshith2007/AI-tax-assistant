from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('dashboard/calculator/', views.calculator_view, name='calculator'),
    path('dashboard/history/', views.history_view, name='history'),
    path('dashboard/profile/', views.profile_view, name='profile'),
    path('dashboard/profile/insights/', views.profile_insights_api, name='profile_insights_api'),
    path('dashboard/settings/', views.settings_view, name='settings'),
]
