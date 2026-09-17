from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from accounts.models import Profile

def signup(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        confirm_password = request.POST.get("confirm_password")
        timezone = request.POST.get("timezone", "UTC")

        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

        if password != confirm_password:
            error_msg = "Passwords do not match"
            if is_ajax:
                return JsonResponse({"success": False, "error": error_msg}, status=400)
            messages.error(request, error_msg)
            return redirect("signup")

        if User.objects.filter(username=username).exists():
            error_msg = "Username already exists"
            if is_ajax:
                return JsonResponse({"success": False, "error": error_msg}, status=400)
            messages.error(request, error_msg)
            return redirect("signup")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        profile, created = Profile.objects.get_or_create(user=user)
        profile.timezone = timezone
        profile.save()

        login(request, user)

        if is_ajax:
            return JsonResponse({"success": True, "redirect_url": "/dashboard/"})

        return redirect("dashboard")

    return render(request, "accounts/signup.html")

def signin(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            if is_ajax:
                return JsonResponse({"success": True, "redirect_url": "/dashboard/"})
            return redirect("dashboard")
        else:
            error_msg = "Invalid username or password"
            if is_ajax:
                return JsonResponse({"success": False, "error": error_msg}, status=400)
            messages.error(request, error_msg)
            return redirect("signin")

    return render(request, "accounts/signin.html")

# temporary logout
def logout_view(request):
    logout(request)
    return redirect("signin")