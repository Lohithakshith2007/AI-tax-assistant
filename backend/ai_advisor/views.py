from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from groq import Groq
import os

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

        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b", 
            messages=[
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
},
        {"role": "user", "content": message}
    ],
    temperature=0.4,
    max_completion_tokens=8192,
        )

        reply = completion.choices[0].message.content

        return JsonResponse({"reply": reply})
    
    return JsonResponse(
        {"error": "Only POST method allowed"},
        status=405
    )