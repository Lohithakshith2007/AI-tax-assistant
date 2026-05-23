from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.contrib.auth import authenticate, login
from accounts.models import Profile

# temporary
from django.contrib.auth import logout

def signup(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        confirm_password = request.POST.get("confirm_password")
        timezone = request.POST.get("timezone", "UTC")

        if password != confirm_password:
            messages.error(request, "Passwords do not match")
            return redirect("signup")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
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

        # Redirect to dashboard
        return redirect("dashboard")

    return render(request, "accounts/signup.html")

def signin(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect("dashboard")
        else:
            messages.error(request, "Invalid username or password")
            return redirect("signin")

    return render(request, "accounts/signin.html")

# temporary logout
def logout_view(request):
    logout(request)
    return redirect("signin")