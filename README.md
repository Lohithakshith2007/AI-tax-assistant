# AI Tax Assistant

AI Tax Assistant is a full-stack web application that combines a rule-based tax calculation engine with an AI-powered advisory system. The platform allows users to calculate their tax liability accurately and receive intelligent suggestions to optimize their tax savings.

## Features

* User authentication (signup, login, logout)
* SaaS-style dashboard interface
* Tax calculation engine with structured logic
* AI-powered tax saving suggestions
* Clean and simple user interface using Django templates
* Modular backend architecture using multiple Django apps

## Project Structure

backend/

* accounts: Handles authentication and user management
* tax_engine: Core tax calculation logic
* ai_advisor: AI integration for suggestions
* dashboard: Dashboard views and user summary
* config: Main project configuration

templates/

* accounts: Authentication pages
* tax_engine: Calculator, result, and dashboard pages
* ai_advisor: Chat interface

## How It Works

1. The user enters income and deduction details.
2. The tax_engine processes the data and calculates tax using predefined rules.
3. The result is sent to the ai_advisor module.
4. The AI generates personalized tax-saving suggestions.
5. The dashboard displays the final output to the user.

## Tech Stack

* Backend: Django (Python)
* Frontend: HTML, CSS (Django Templates)
* AI Integration: Groq / LLM API
* Database: SQLite (default)

## Setup Instructions

1. Clone the repository:
   git clone <your-repo-url>

2. Navigate to the project directory:
   cd backend

3. Create and activate a virtual environment:
   python -m venv env
   env\Scripts\activate   (Windows)

4. Install dependencies:
   pip install -r requirements.txt

5. Add your API key in .env file:
   GROQ_API_KEY=your_api_key_here

6. Apply migrations:
   python manage.py migrate

7. Run the server:
   python manage.py runserver

## Future Improvements

* Implement real-world tax slab calculations
* Add user tax history and analytics
* Upgrade UI with modern frameworks
* Convert frontend to React with Django REST API
* Enhance AI advisor with contextual memory

## License

This project is for educational and demonstration purposes.
