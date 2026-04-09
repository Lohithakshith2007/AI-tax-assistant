from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
from groq import Groq
from .models import Conversation, ChatMessage

@login_required(login_url="login")
def chat(request):
    conversations = Conversation.objects.filter(user=request.user)
    return render(request, "ai_advisor/chat.html", {"conversations": conversations})

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@login_required(login_url="login")
@csrf_exempt
def chatbot(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            message_text = data.get("message")
            conversation_id = data.get("conversation_id")
            
            # Get or create conversation
            if conversation_id:
                conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
            else:
                conversation = Conversation.objects.create(user=request.user, title=message_text[:30] + "...")

            # Save user message
            ChatMessage.objects.create(conversation=conversation, sender='user', text=message_text)

            # Build history for Groq
            history_messages = conversation.messages.all().order_by('created_at')
            messages = [
                {"role": "system", "content": "You are a senior tax consultant providing professional financial guidance. Respond with clarity, structure, and practical reasoning. Be concise, confident, and professional. Adapt naturally to the user's message. Never mention underlying AI systems."}
            ]
            for msg in history_messages:
                role = "user" if msg.sender == "user" else "assistant"
                messages.append({"role": role, "content": msg.text})

            # Send to Groq
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile", # Reliable pro model
                messages=messages,
                temperature=0.4,
                max_completion_tokens=1000,
            )

            reply_text = completion.choices[0].message.content

            # Save AI reply
            ChatMessage.objects.create(conversation=conversation, sender='ai', text=reply_text)
            
            # Update conversation timestamp
            conversation.save() 

            return JsonResponse({
                "reply": reply_text, 
                "conversation_id": conversation.id,
                "conversation_title": conversation.title
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Only POST method allowed"}, status=405)

@login_required(login_url="login")
def get_history(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    messages = conversation.messages.all().values('sender', 'text', 'created_at')
    return JsonResponse({"messages": list(messages)})

@login_required(login_url="login")
@csrf_exempt
def delete_conversation(request, conversation_id):
    if request.method == "POST":
        conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
        conversation.delete()
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"}, status=405)