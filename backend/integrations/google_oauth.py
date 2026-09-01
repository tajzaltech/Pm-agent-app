from __future__ import annotations

from dataclasses import dataclass

import httpx

from core.config import settings
from core.errors import service_unavailable, unauthorized

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


@dataclass(frozen=True)
class GoogleIdentity:
    sub: str
    email: str
    email_verified: bool
    name: str


async def exchange_auth_code(code: str) -> GoogleIdentity:
    if not settings.google_client_id or not settings.google_client_secret:
        raise service_unavailable("Gmail sign-in is not configured")

    async with httpx.AsyncClient(timeout=20.0) as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code >= 400:
            error = ""
            try:
                error = str(token_res.json().get("error") or "")
            except Exception:
                error = ""
            if error == "redirect_uri_mismatch":
                raise unauthorized(
                    "Google redirect URI mismatch. Add http://localhost:3000/auth/google/callback in Google Cloud."
                )
            raise unauthorized("Google sign-in failed")
        tokens = token_res.json()
        id_token = tokens.get("id_token")
        if not isinstance(id_token, str) or not id_token:
            raise unauthorized("Google did not return an identity token")

        info_res = await client.get(GOOGLE_TOKENINFO_URL, params={"id_token": id_token})
        if info_res.status_code >= 400:
            raise unauthorized("Google identity token could not be verified")
        claims = info_res.json()

    if claims.get("aud") != settings.google_client_id:
        raise unauthorized("Google identity token audience mismatch")
    if claims.get("iss") not in GOOGLE_ISSUERS:
        raise unauthorized("Google identity token issuer mismatch")

    email = str(claims.get("email") or "").strip().lower()
    sub = str(claims.get("sub") or "").strip()
    if not email or not sub:
        raise unauthorized("Google account is missing an email")

    verified = str(claims.get("email_verified") or "").lower() in {"true", "1"}
    name = str(claims.get("name") or "").strip() or email.split("@")[0]
    return GoogleIdentity(sub=sub, email=email, email_verified=verified, name=name)
