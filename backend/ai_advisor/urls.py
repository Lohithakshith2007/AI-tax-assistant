from django.urls import path
from . import views

urlpatterns = [
    path("chat/", views.chat, name="chat"),
    path("chatbot/", views.chatbot, name="chatbot"),
    path("history/<int:conversation_id>/", views.get_history, name="chat_history"),
    path("delete/<int:conversation_id>/", views.delete_conversation, name="delete_conversation"),
]