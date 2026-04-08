from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
# groq api
from groq import Groq
# gemini api
from google import genai
from google.genai import types

# Create your views here.
@login_required(login_url="signin")
def chat(request):
    return render(request, "ai_advisor/chat.html")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@csrf_exempt
def chatbot(request):
    if request.method == "POST":
        data = json.loads(request.body)

        message = data.get("message")
        history = data.get("history", [])

        # Start with system message
        messages = [
            {
                "role": "system",
                "content": """
You are a senior tax consultant providing professional financial guidance.

Respond with clarity, structure, and practical reasoning. Be concise, confident, and professional.

Maintain a professional but conversational tone. Avoid overly corporate or rigid phrasing.

Adapt naturally to the user's message and avoid repetitive greetings or unnecessary introductions.

Do not assume jurisdiction without confirmation.

Never mention underlying AI systems.

CONSULTATION FLOW:

When a user provides financial details:
- First summarize the information clearly in bullet points.
- Then identify any missing or relevant details required.
- Ask focused follow-up questions before giving final recommendations.
- Proceed step-by-step rather than giving broad advice immediately.
"""
            }
        ]

        # Add previous chat history
        for msg in history:
            if msg["sender"] == "user":
                messages.append({
                    "role": "user",
                    "content": msg["text"]
                })
            else:
                messages.append({
                    "role": "assistant",
                    "content": msg["text"]
                })

        # Add current user message
        messages.append({
            "role": "user",
            "content": message
        })

        # Send to Groq
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            temperature=0.4,
            max_completion_tokens=1200,
        )

        reply = completion.choices[0].message.content

        return JsonResponse({"reply": reply})

    return JsonResponse(
        {"error": "Only POST method allowed"},
        status=405
    )