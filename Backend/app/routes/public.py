from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from ..database import query, execute, now
from ..schemas import BusinessIn, PostIn, LoginIn, CommentIn
from ..presentation import POST_SELECT, shape_post, shape_business, published_post_or_404
from ..security import current_owner, my_business, own_post
from ..constants import CATEGORIES

router = APIRouter()

@router.get("/categories")
def categories():
    return CATEGORIES


@router.get("/posts")
def feed(category: Optional[str] = None, x_client_id: Optional[str] = Header(None)):
    """Discover feed: published + available posts, newest first."""
    sql = POST_SELECT + "WHERE p.publication_status = 'published' AND p.availability = 'available' "
    params = []
    if category and category != "All":
        sql += "AND p.category = ? "
        params.append(category)
    sql += "ORDER BY p.created_at DESC, p.id DESC"
    return [shape_post(r, x_client_id) for r in query(sql, params)]


@router.get("/search")
def search(q: str = "", category: Optional[str] = None, x_client_id: Optional[str] = Header(None)):
    """Keyword search (case-insensitive). Posts and businesses come back separately.
    Empty q = just browse. Works together with category."""
    q = q.strip()
    post_where = ["p.publication_status = 'published'", "p.availability = 'available'"]
    post_params = []
    biz_where, biz_params = [], []

    if category and category != "All":
        post_where.append("p.category = ?")
        post_params.append(category)
        biz_where.append("b.category = ?")
        biz_params.append(category)

    if q:
        like = f"%{q}%"
        post_where.append("(p.title LIKE ? OR p.description LIKE ? OR b.name LIKE ? OR b.description LIKE ?)")
        post_params += [like] * 4
        biz_where.append("(b.name LIKE ? OR b.description LIKE ?)")
        biz_params += [like] * 2

    posts = query(
        POST_SELECT + "WHERE " + " AND ".join(post_where) + " ORDER BY p.created_at DESC, p.id DESC",
        post_params,
    )
    biz_sql = "SELECT * FROM businesses b"
    if biz_where:
        biz_sql += " WHERE " + " AND ".join(biz_where)
    businesses = query(biz_sql + " ORDER BY b.name", biz_params)

    return {
        "query": q,
        "category": category or "All",
        "posts": [shape_post(p, x_client_id) for p in posts],
        "businesses": [shape_business(b) for b in businesses],
    }


@router.get("/posts/{post_id}")
def post_details(post_id: int, x_client_id: Optional[str] = Header(None)):
    row = query(POST_SELECT + "WHERE p.id = ? AND p.publication_status = 'published'", (post_id,), one=True)
    if not row:
        raise HTTPException(404, "Post not found")
    return shape_post(row, x_client_id)


@router.get("/businesses")
def list_businesses(category: Optional[str] = None):
    sql, params = "SELECT * FROM businesses", []
    if category and category != "All":
        sql += " WHERE category = ?"
        params.append(category)
    return [shape_business(b) for b in query(sql + " ORDER BY name", params)]


@router.get("/businesses/{business_id}")
def business_profile(business_id: int, x_client_id: Optional[str] = Header(None)):
    biz = query("SELECT * FROM businesses WHERE id = ?", (business_id,), one=True)
    if not biz:
        raise HTTPException(404, "Business not found")
    posts = query(
        POST_SELECT + "WHERE p.business_id = ? AND p.publication_status = 'published' "
        "ORDER BY p.created_at DESC, p.id DESC",
        (business_id,),
    )
    result = shape_business(biz)
    result["posts"] = [shape_post(p, x_client_id) for p in posts]  # unavailable ones are labeled
    return result
