from .database import query, execute, now
from .security import hash_password

def seed():
    if query("SELECT id FROM owners LIMIT 1", one=True):
        return
    demo = [
        ("demo_cakes", "Sweet Crumbs (demo)", "Food", "Fictional demo bakery for cakes and cupcakes.", "2348000000001", None, [
            ("Vanilla birthday cake", "Soft vanilla sponge, buttercream frosting.", "Food", "amount", 12000, "available"),
            ("Cupcake box of 6", "Mixed flavours, ready same day.", "Food", "amount", 4500, "available"),
            ("Custom cake design", "Tell us your theme and size.", "Food", "contact", None, "available"),
            ("Chocolate fudge cake", "Rich chocolate. Sold out for now.", "Food", "amount", 15000, "unavailable"),
        ]),
        ("demo_style", "Thread & Co (demo)", "Fashion", "Fictional demo fashion stall on campus.", "2348000000002", None, [
            ("Custom PAU hoodie", "Choose colour and print.", "Fashion", "amount", 9500, "available"),
            ("Canvas tote bag", "Strong bag for books and laptops.", "Fashion", "amount", 3000, "available"),
            ("Tailoring and alterations", "Fix, resize, restyle.", "Fashion", "contact", None, "available"),
            ("Thrift denim jacket", "Pre-loved, cleaned, one size.", "Fashion", "amount", 7000, "available"),
        ]),
        ("demo_tech", "Campus Tech Fix (demo)", "Tech", "Fictional demo tech and tutoring service.", "2348000000003", "https://example.com", [
            ("Phone screen repair", "Price depends on the phone model.", "Tech", "contact", None, "available"),
            ("Laptop cleaning and tune-up", "Dust cleaning and software check.", "Services", "amount", 5000, "available"),
            ("Python tutoring", "One hour, beginner friendly.", "Academics", "amount", 2500, "available"),
            ("CV and resume design", "Clean one-page CV.", "Academics", "amount", 3500, "available"),
        ]),
        # Website-only business: no WhatsApp, students are sent to the website instead
        ("demo_web", "StudyHub (demo)", "Academics", "Fictional demo online study platform.", None, "https://example.org", [
            ("Free past questions library", "Browse past exam questions by course.", "Academics", "amount", 0, "available"),
            ("Study planner app", "Plan your week and track assignments.", "Tech", "contact", None, "available"),
        ]),
    ]
    for username, name, cat, desc, number, site, posts in demo:
        owner_id = execute("INSERT INTO owners (username, password_hash) VALUES (?, ?)", (username, hash_password("pass123")))
        biz_id = execute(
            "INSERT INTO businesses (owner_id, name, category, description, whatsapp_number, website_url, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (owner_id, name, cat, desc, number, site, now()),
        )
        for title, pdesc, pcat, mode, amount, avail in posts:
            execute(
                "INSERT INTO posts (business_id, title, description, category, price_mode, price_amount, "
                "availability, publication_status, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)",
                (biz_id, title, pdesc, pcat, mode, amount, avail, now(), now()),
            )



