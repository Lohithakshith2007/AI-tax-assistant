from .models import Conversation

def recent_conversations(request):
    if request.user.is_authenticated:
        return {
            'recent_conversations': Conversation.objects.filter(user=request.user).order_by('-updated_at')[:10]
        }
    return {'recent_conversations': []}
