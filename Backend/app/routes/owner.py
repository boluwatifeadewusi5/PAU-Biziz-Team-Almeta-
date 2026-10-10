from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from ..database import query, execute, now
from ..schemas import BusinessIn, PostIn, LoginIn, CommentIn
from ..presentation import POST_SELECT, shape_post, shape_business, published_post_or_404
from ..security import current_owner, my_business, own_post
from ..constants import CATEGORIES

router = APIRouter()

@router.get("/owner/business")
def get_my_business(authorization: Optional[str] = Header(None)):
    return shape_business(my_business(current_owner(authorization)))


@router.put("/owner/business")
def save_my_business(b: BusinessIn, authorization: Optional[str] = Header(None)):
    """Create the business if none exists, otherwise update it."""
    owner_id = current_owner(authorization)
    existing = query("SELECT id FROM businesses WHERE owner_id = ?", (owner_id,), one=True)
    if existing:
        execute(
            "UPDATE businesses SET name=?, category=?, description=?, whatsapp_number=?, "
            "website_url=?, fulfillment_info=? WHERE id=?",
            (b.name, b.category, b.description, b.whatsapp_number, b.website_url, b.fulfillment_info, existing["id"]),
        )
    else:
        execute(
            "INSERT INTO businesses (owner_id, name, category, description, whatsapp_number, "
            "website_url, fulfillment_info, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (owner_id, b.name, b.category, b.description, b.whatsapp_number, b.website_url, b.fulfillment_info, now()),
        )
    return shape_business(my_business(owner_id))


@router.get("/owner/posts")
def my_posts(authorization: Optional[str] = Header(None)):
    """Dashboard list: ALL of this owner's posts (drafts and unavailable too)."""
    biz = my_business(current_owner(authorization))
    rows = query(POST_SELECT + "WHERE p.business_id = ? ORDER BY p.created_at DESC, p.id DESC", (biz["id"],))
    return [shape_post(r) for r in rows]


@router.post("/owner/posts")
def create_post(post: PostIn, authorization: Optional[str] = Header(None)):
    biz = my_business(current_owner(authorization))
    post_id = execute(
        "INSERT INTO posts (business_id, title, description, category, image_url, video_url, website_url, "
        "price_mode, price_amount, publication_status, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (biz["id"], post.title, post.description, post.category, post.image_url, post.video_url,
         post.website_url, post.price_mode, post.price_amount, post.publication_status, now(), now()),
    )
    return shape_post(query(POST_SELECT + "WHERE p.id = ?", (post_id,), one=True))


@router.put("/owner/posts/{post_id}")
def edit_post(post_id: int, post: PostIn, authorization: Optional[str] = Header(None)):
    own_post(current_owner(authorization), post_id)
    execute(
        "UPDATE posts SET title=?, description=?, category=?, image_url=?, video_url=?, website_url=?, "
        "price_mode=?, price_amount=?, publication_status=?, updated_at=? WHERE id=?",
        (post.title, post.description, post.category, post.image_url, post.video_url, post.website_url,
         post.price_mode, post.price_amount, post.publication_status, now(), post_id),
    )
    return shape_post(query(POST_SELECT + "WHERE p.id = ?", (post_id,), one=True))


@router.patch("/owner/posts/{post_id}/availability")
def toggle_availability(post_id: int, authorization: Optional[str] = Header(None)):
    """Flips available <-> unavailable. Unavailable posts leave the feed."""
    post = own_post(current_owner(authorization), post_id)
    new_state = "unavailable" if post["availability"] == "available" else "available"
    execute("UPDATE posts SET availability=?, updated_at=? WHERE id=?", (new_state, now(), post_id))
    return shape_post(query(POST_SELECT + "WHERE p.id = ?", (post_id,), one=True))


@router.delete("/owner/comments/{comment_id}")
def delete_comment(comment_id: int, authorization: Optional[str] = Header(None)):
    """Owners can remove comments (e.g. spam) on THEIR OWN posts only."""
    owner_id = current_owner(authorization)
    comment = query("SELECT * FROM comments WHERE id = ?", (comment_id,), one=True)
    if not comment:
        raise HTTPException(404, "Comment not found")
    own_post(owner_id, comment["post_id"])  # 403 if the post is not theirs
    execute("DELETE FROM comments WHERE id = ?", (comment_id,))
    return {"deleted": comment_id}
