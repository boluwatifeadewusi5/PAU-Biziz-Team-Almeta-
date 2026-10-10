from urllib.parse import quote
from fastapi import HTTPException
from .database import query

def wa_link(number, message):
    # Opens a WhatsApp chat with a ready-typed message
    return f"https://wa.me/{number}?text={quote(message)}"


POST_SELECT = (
    "SELECT p.*, b.name AS business_name, b.whatsapp_number AS whatsapp_number, "
    "b.website_url AS business_website_url, "
    "(SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes, "
    "(SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count "
    "FROM posts p JOIN businesses b ON b.id = p.business_id "
)


def shape_post(row, client_id=None):
    p = dict(row)
    client_id = client_id.strip() if isinstance(client_id, str) else None

    if p["price_mode"] == "contact":
        p["price_label"] = "Contact for price"
    elif p["price_amount"] == 0:
        p["price_label"] = "Free"
    else:
        p["price_label"] = f"₦{p['price_amount']:,.0f}"

    # Contact buttons. Unavailable posts cannot start an inquiry, so no links.
    p["whatsapp_link"] = None
    p["website_link"] = None
    if p["availability"] == "available":
        if p["whatsapp_number"]:
            msg = f"Hi, I saw '{p['title']}' on PAU biziz. Is it still available?"
            p["whatsapp_link"] = wa_link(p["whatsapp_number"], msg)
        # The post's own website link, otherwise the business's website
        p["website_link"] = p["website_url"] or p["business_website_url"]

    # Did THIS browser already like the post? (frontend uses it to fill the heart)
    p["liked_by_me"] = False
    if client_id:
        p["liked_by_me"] = query(
            "SELECT 1 AS x FROM likes WHERE post_id = ? AND client_id = ?", (p["id"], client_id), one=True
        ) is not None
    return p


def shape_business(row):
    b = dict(row)
    b["whatsapp_link"] = None
    if b["whatsapp_number"]:
        msg = f"Hi {b['name']}, I found you on PAU biziz and I have an inquiry."
        b["whatsapp_link"] = wa_link(b["whatsapp_number"], msg)
    b["website_link"] = b["website_url"]
    return b


def published_post_or_404(post_id):
    post = query("SELECT id FROM posts WHERE id = ? AND publication_status = 'published'", (post_id,), one=True)
    if not post:
        raise HTTPException(404, "Post not found")
