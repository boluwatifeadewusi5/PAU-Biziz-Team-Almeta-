from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from ..database import query, execute, now, connect
from ..schemas import CommentIn
from ..presentation import published_post_or_404

router = APIRouter()

@router.post("/posts/{post_id}/like")
def toggle_like(post_id: int, x_client_id: Optional[str] = Header(None)):
    client_id = (x_client_id or "").strip()
    if not 1 <= len(client_id) <= 128:
        raise HTTPException(400, "Supply x-client-id with 1–128 characters")
    published_post_or_404(post_id)
    conn = connect()
    try:
        conn.execute("BEGIN IMMEDIATE")
        already = conn.execute("SELECT 1 FROM likes WHERE post_id=? AND client_id=?", (post_id, client_id)).fetchone()
        if already:
            conn.execute("DELETE FROM likes WHERE post_id=? AND client_id=?", (post_id, client_id))
        else:
            conn.execute("INSERT INTO likes (post_id, client_id) VALUES (?, ?)", (post_id, client_id))
        total = conn.execute("SELECT COUNT(*) FROM likes WHERE post_id=?", (post_id,)).fetchone()[0]
        conn.commit()
    finally:
        conn.close()
    return {"liked": not already, "likes": total}

@router.get("/posts/{post_id}/comments")
def get_comments(post_id: int):
    published_post_or_404(post_id)
    return query(
        "SELECT id, author, text, created_at FROM comments WHERE post_id = ? ORDER BY id DESC", (post_id,)
    )


@router.post("/posts/{post_id}/comments")
def add_comment(post_id: int, comment: CommentIn):
    published_post_or_404(post_id)
    new_id = execute(
        "INSERT INTO comments (post_id, author, text, created_at) VALUES (?, ?, ?, ?)",
        (post_id, comment.author, comment.text, now()),
    )
    return query("SELECT id, author, text, created_at FROM comments WHERE id = ?", (new_id,), one=True)
