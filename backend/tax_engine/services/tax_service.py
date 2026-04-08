def calculate_tax_with_breakdown(income, slabs):
    tax = 0
    breakdown = []
    previous_limit = 0

    for limit, rate in slabs:
        if income > previous_limit:
            taxable_amount = min(income, limit) - previous_limit
            slab_tax = taxable_amount * rate

            breakdown.append({
                "lower_limit": previous_limit,
                "upper_limit": limit if limit != float("inf") else None,
                "rate": rate,
                "tax_for_this_slab": round(slab_tax, 2)
            })

            tax += slab_tax
            previous_limit = limit
        else:
            break

    return round(tax, 2), breakdown


def calculate_tax_by_country(country, taxable_income):
    country = country.lower()

    if country == "india":
        slabs = [
            (300000, 0.0),
            (600000, 0.05),
            (900000, 0.10),
            (1200000, 0.15),
            (1500000, 0.20),
            (float("inf"), 0.30),
        ]

    elif country == "us":
        slabs = [
            (11000, 0.10),
            (44725, 0.12),
            (95375, 0.22),
            (float("inf"), 0.24),
        ]
        
    elif country == "uk":
        # Approximate UK slabs
        slabs = [
            (12570, 0.0),
            (50270, 0.20),
            (125140, 0.40),
            (float("inf"), 0.45),
        ]
        
    elif country == "canada":
        # Approximate Canada Federal slabs
        slabs = [
            (53359, 0.15),
            (106717, 0.205),
            (165430, 0.26),
            (235675, 0.29),
            (float("inf"), 0.33),
        ]
        
    elif country == "australia":
        # Approximate Australia slabs
        slabs = [
            (18200, 0.0),
            (45000, 0.19),
            (120000, 0.325),
            (180000, 0.37),
            (float("inf"), 0.45),
        ]

    else:
        raise ValueError("Unsupported country")

    return calculate_tax_with_breakdown(taxable_income, slabs)