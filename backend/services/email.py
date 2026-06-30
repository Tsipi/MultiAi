"""Email sending service with pluggable provider.

Set EMAIL_PROVIDER in .env:
  log    — (default) prints the link to the server log; no email is sent.
            Use this during development or before you have an email provider.
  resend — requires RESEND_API_KEY. Sign up at resend.com.
  smtp   — requires SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD.
"""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

from backend.config import AppConfig

_log = logging.getLogger(__name__)


async def send_password_reset_email(email: str, token: str, cfg: AppConfig) -> None:
    reset_url = f"{cfg.app_url}/reset-password?token={token}"
    subject = "Reset your TeamStoa password"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 8px;color:#6d28d9">TeamStoa</h2>
      <p style="color:#374151">You requested a password reset. Click the link below to choose a new password.</p>
      <a href="{reset_url}"
         style="display:inline-block;margin:16px 0;padding:10px 20px;background:#7c3aed;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:600">
        Reset password
      </a>
      <p style="color:#6b7280;font-size:13px">
        Or copy this link:<br>
        <span style="word-break:break-all">{reset_url}</span>
      </p>
      <p style="color:#6b7280;font-size:12px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
    """
    text = f"Reset your TeamStoa password: {reset_url}\n\nThis link expires in 1 hour."
    await _dispatch(email, subject, html, text, cfg)


async def send_verification_email(email: str, token: str, cfg: AppConfig) -> None:
    verify_url = f"{cfg.app_url}/verify-email?token={token}"
    subject = "Verify your TeamStoa account"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 8px;color:#6d28d9">TeamStoa</h2>
      <p style="color:#374151">Welcome! Please verify your email address to activate your account.</p>
      <a href="{verify_url}"
         style="display:inline-block;margin:16px 0;padding:10px 20px;background:#7c3aed;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:600">
        Verify email
      </a>
      <p style="color:#6b7280;font-size:13px">
        Or copy this link:<br>
        <span style="word-break:break-all">{verify_url}</span>
      </p>
    </div>
    """
    text = f"Verify your TeamStoa account: {verify_url}"
    await _dispatch(email, subject, html, text, cfg)


async def _dispatch(to: str, subject: str, html: str, text: str, cfg: AppConfig) -> None:
    if cfg.email_provider == "resend":
        await _send_resend(to, subject, html, cfg)
    elif cfg.email_provider == "smtp":
        _send_smtp(to, subject, html, text, cfg)
    else:
        _log.info("EMAIL [log mode] to=%s  subject=%r", to, subject)
        _log.info("EMAIL link: %s", text)


async def _send_resend(to: str, subject: str, html: str, cfg: AppConfig) -> None:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {cfg.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={"from": cfg.email_from, "to": [to], "subject": subject, "html": html},
        )
    if resp.status_code not in (200, 201):
        _log.error("Resend error %s: %s", resp.status_code, resp.text)
        raise RuntimeError(f"Resend returned {resp.status_code}")
    _log.info("Email sent via Resend to %s", to)


def _send_smtp(to: str, subject: str, html: str, text: str, cfg: AppConfig) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = cfg.email_from
    msg["To"] = to
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(cfg.smtp_host, cfg.smtp_port) as server:
        server.ehlo()
        server.starttls()
        if cfg.smtp_username:
            server.login(cfg.smtp_username, cfg.smtp_password)
        server.sendmail(cfg.email_from, [to], msg.as_string())
    _log.info("Email sent via SMTP to %s", to)
