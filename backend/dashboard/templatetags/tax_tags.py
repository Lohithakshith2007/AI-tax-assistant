from django import template

register = template.Library()

@register.filter
def currency_symbol(country_name):
    if not country_name:
        return "$"
        
    country = country_name.lower().strip()
    
    mapping = {
        'india': '₹',
        'us': '$',
        'usa': '$',
        'usd': '$',
        'united states': '$',
        'uk': '£',
        'united kingdom': '£',
        'canada': 'C$',
        'australia': 'A$',
    }
    
    return mapping.get(country, "$")

@register.filter
def country_display(value):
    mapping = {
        "india": "India",
        "us": "United States",
        "usa": "United States",
        "usd": "United States",
        "uk": "United Kingdom",
        "canada": "Canada",
        "australia": "Australia",
    }
    return mapping.get(value.lower().strip(), value.title())