from typing import Literal, Optional
from urllib.parse import urlsplit
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator
from .constants import CATEGORIES

def clean_url(v):
    if v is None or not v.strip():
        return None
    v = v.strip()
    if "://" not in v:
        v = "https://" + v
    if "\\" in v or any(ord(c) < 32 or ord(c) == 127 for c in v):
        raise ValueError("Enter a valid HTTP or HTTPS URL")
    # Validate the hostname and port as well as the scheme before storing links.
    HttpUrl(v)
    parsed = urlsplit(v)
    if parsed.scheme not in ("http", "https") or not parsed.hostname or "." not in parsed.hostname.strip(".") or parsed.username or parsed.password or any(c.isspace() for c in v):
        raise ValueError("Enter a valid HTTP or HTTPS URL")
    try:
        parsed.port
    except ValueError:
        raise ValueError("Invalid URL port")
    return v


class BusinessIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid", allow_inf_nan=False)
    name: str = Field(min_length=1, max_length=2000)
    category: str
    description: str = Field(min_length=1, max_length=2000)
    whatsapp_number: Optional[str] = None   # optional now
    website_url: Optional[str] = None       # optional, but need this OR WhatsApp
    fulfillment_info: Optional[str] = None  # e.g. "Pickup at student centre"
    logo_url: Optional[str] = None

    @field_validator("category")
    @classmethod
    def check_category(cls, v):
        if v not in CATEGORIES:
            raise ValueError("Category must be one of: " + ", ".join(CATEGORIES))
        return v

    @field_validator("whatsapp_number")
    @classmethod
    def check_number(cls, v):
        if not v:
            return None
        v = v.replace(" ", "").replace("-", "").lstrip("+")
        if not v.isascii() or not v.isdigit() or not 10 <= len(v) <= 15:
            raise ValueError("Use digits with country code, e.g. 2348012345678")
        return v

    @field_validator("website_url", "logo_url")
    @classmethod
    def check_site(cls, v):
        return clean_url(v)

    @model_validator(mode="after")
    def need_a_contact(self):
        if not self.whatsapp_number and not self.website_url:
            raise ValueError("Add a WhatsApp number or a website link (or both)")
        return self


class PostIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid", allow_inf_nan=False)
    title: str = Field(min_length=1, max_length=2000)
    description: str = Field(min_length=1, max_length=2000)
    category: str
    image_url: Optional[str] = None      # empty = frontend shows a placeholder
    video_url: Optional[str] = None      # optional video link
    website_url: Optional[str] = None    # optional "visit website" link for this post
    price_mode: Literal["amount", "contact"]
    price_amount: Optional[float] = Field(default=None, ge=0)
    publication_status: Literal["draft", "published"] = "published"

    @field_validator("category")
    @classmethod
    def check_category(cls, v):
        if v not in CATEGORIES:
            raise ValueError("Category must be one of: " + ", ".join(CATEGORIES))
        return v

    @field_validator("website_url", "image_url", "video_url")
    @classmethod
    def check_site(cls, v):
        return clean_url(v)

    @model_validator(mode="after")
    def check_price(self):
        if self.price_mode == "amount" and self.price_amount is None:
            raise ValueError("price_amount is required when price_mode is 'amount'")
        if self.price_mode == "contact":
            self.price_amount = None
        return self


class LoginIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=256)


class CommentIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid", allow_inf_nan=False)
    author: str = Field(min_length=1, max_length=40)   # name typed by the student
    text: str = Field(min_length=1, max_length=500)
