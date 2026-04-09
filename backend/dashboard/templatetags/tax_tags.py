from django import template

register = template.Library()

@register.filter
def currency_symbol(country_name):
    """Returns the currency symbol for a given country identifier."""
    if not country_name:
        return "₹"  # Default to INR as per user preference
        
    country = str(country_name).lower().strip()
    
    mapping = {
        'india': '₹',
        'in': '₹',
        'inr': '₹',
        'us': '$',
        'usa': '$',
        'usd': '$',
        'united states': '$',
        'uk': '£',
        'gbp': '£',
        'united kingdom': '£',
        'gb': '£',
        'canada': 'C$',
        'cad': 'C$',
        'ca': 'C$',
        'australia': 'A$',
        'aud': 'A$',
        'au': 'A$',
        'europe': '€',
        'eu': '€',
        'euro': '€',
        'eur': '€',
    }
    
    return mapping.get(country, '₹')  # Default fallback to INR


@register.filter
def country_display(value):
    """Returns a human-readable country name from a country identifier."""
    if not value:
        return "India"
    mapping = {
        'india': 'India',
        'in': 'India',
        'inr': 'India',
        'us': 'USA',
        'usa': 'USA',
        'usd': 'USA',
        'united states': 'USA',
        'uk': 'UK',
        'gbp': 'UK',
        'united kingdom': 'UK',
        'canada': 'Canada',
        'cad': 'Canada',
        'australia': 'Australia',
        'aud': 'Australia',
        'europe': 'European Union',
        'eu': 'European Union',
        'eur': 'European Union',
        'euro': 'European Union',
    }
    return mapping.get(str(value).lower().strip(), str(value).title())