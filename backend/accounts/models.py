from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    pan_no = models.CharField(max_length=20, blank=True, null=True)
    tax_id = models.CharField(max_length=30, blank=True, null=True)
    preferred_country = models.CharField(max_length=50, default='india')
    timezone = models.CharField(max_length=50, default='UTC')
    
    role = models.CharField(
        max_length=10,
        choices=[('user', 'User'), ('admin', 'Admin')],
        default='user',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


def is_admin(user):
    if hasattr(user, 'profile'):
        if user.username == "lohithakshith" and user.profile.role != "admin":
            user.profile.role = "admin"
            user.profile.save()

        return user.profile.role == "admin"

    return False

# Promote a user to analytics/admin access like this:
# user.profile.role = 'admin'
# user.profile.save()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        Profile.objects.create(user=instance)
