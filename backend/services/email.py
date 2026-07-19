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

_LOGO_URL = "https://www.teamstoa.com/apple-touch-icon.png"


def _branded_email(body_html: str, footer_note: str) -> str:
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
          <tr><td align="center" style="padding-bottom:20px">
            <img src="{_LOGO_URL}" width="48" height="48" alt="TeamStoa"
                 style="border-radius:12px;display:block">
            <div style="margin-top:10px;font-family:sans-serif;font-size:18px;font-weight:700;color:#1e1b4b">
              Team<span style="color:#6d28d9">Stoa</span>
            </div>
          </td></tr>
          <tr><td style="background:#ffffff;border-radius:16px;padding:32px 28px;font-family:sans-serif">
            {body_html}
          </td></tr>
          <tr><td align="center" style="padding-top:20px;font-family:sans-serif;font-size:12px;color:#6b7280">
            {footer_note}
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


def _cta_button(url: str, label: str) -> str:
    return f"""
    <a href="{url}"
       style="display:inline-block;margin:16px 0;padding:10px 20px;background:#6d28d9;color:#fff;
              border-radius:8px;text-decoration:none;font-weight:600;font-family:sans-serif">
      {label}
    </a>
    """


async def send_password_reset_email(email: str, token: str, cfg: AppConfig) -> None:
    reset_url = f"{cfg.app_url}/reset-password?token={token}"
    subject = "Reset your TeamStoa password"
    body = f"""
      <p style="margin:0 0 8px;color:#374151">You requested a password reset. Click the button below to choose a new password.</p>
      {_cta_button(reset_url, "Reset password")}
      <p style="color:#6b7280;font-size:13px">
        Or copy this link:<br>
        <span style="word-break:break-all">{reset_url}</span>
      </p>
      <p style="color:#6b7280;font-size:12px;margin-bottom:0">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    """
    html = _branded_email(body, "TeamStoa — Your AI decision council")
    text = f"Reset your TeamStoa password: {reset_url}\n\nThis link expires in 1 hour."
    await _dispatch(email, subject, html, text, cfg)


async def send_verification_email(email: str, token: str, cfg: AppConfig) -> None:
    verify_url = f"{cfg.app_url}/verify-email?token={token}"
    subject = "Verify your TeamStoa account"
    body = f"""
      <p style="margin:0 0 8px;color:#374151">Welcome! Please verify your email address to activate your account.</p>
      {_cta_button(verify_url, "Verify email")}
      <p style="color:#6b7280;font-size:13px;margin-bottom:0">
        Or copy this link:<br>
        <span style="word-break:break-all">{verify_url}</span>
      </p>
    """
    html = _branded_email(body, "TeamStoa — Your AI decision council")
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
