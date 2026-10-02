import os
import smtplib
import ssl
import sys
import time
from email.message import EmailMessage
from email.utils import formataddr
from typing import Any, Dict, List, Optional, Tuple

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

try:
    from templates.email_template import (
        DEFAULT_GIF_URL,
        DEFAULT_LOGO_URL,
        render_email,
    )
except ImportError:
    from backend.templates.email_template import (
        DEFAULT_GIF_URL,
        DEFAULT_LOGO_URL,
        render_email,
    )

load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)
load_dotenv(os.path.join(BASE_DIR, "..", ".env"), override=True)
load_dotenv(override=True)


def mask_email(email: str) -> str:
    """Safely masks an email address for public responses (e.g. j***e@example.com)."""
    if not email or "@" not in email:
        return ""
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"


def get_sender_config(sender_id: int = 1) -> Tuple[Optional[str], Optional[str], str]:
    """Retrieves email, sanitized password, and display name for sender 1 or 2."""
    load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)
    load_dotenv(os.path.join(BASE_DIR, "..", ".env"), override=True)
    load_dotenv(override=True)

    if sender_id == 2:
        email = os.getenv("SENDER_2_EMAIL", "").strip()
        raw_pass = os.getenv("SENDER_2_PASS", "") or os.getenv("SENDER_2_PASSWORD", "")
        name = os.getenv("SENDER_2_NAME", "KIET Smart City Lab Coordinator").strip()
    else:
        email = os.getenv("SENDER_1_EMAIL", "").strip() or os.getenv("EMAIL_ADDRESS", "").strip()
        raw_pass = (
            os.getenv("SENDER_1_PASS", "")
            or os.getenv("SENDER_1_PASSWORD", "")
            or os.getenv("EMAIL_APP_PASSWORD", "")
        )
        name = os.getenv("SENDER_1_NAME", "KIET Smart City Lab Team").strip()

    password = raw_pass.replace(" ", "") if raw_pass else ""
    return email or None, password or None, name


def get_smtp_config() -> Tuple[str, int]:
    """Retrieves global SMTP server config."""
    host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    try:
        port = int(os.getenv("SMTP_PORT", "465"))
    except ValueError:
        port = 465
    return host, port


app = Flask(__name__, static_folder="static")
CORS(app)


@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)


@app.get("/api/health")
def health():
    """Returns dual sender availability status without exposing secrets."""
    s1_email, s1_pass, s1_name = get_sender_config(1)
    s2_email, s2_pass, s2_name = get_sender_config(2)
    host, port = get_smtp_config()

    senders = [
        {
            "id": 1,
            "name": s1_name,
            "email": mask_email(s1_email) if s1_email else "",
            "rawEmail": s1_email or "",
            "configured": bool(s1_email and s1_pass),
        },
        {
            "id": 2,
            "name": s2_name,
            "email": mask_email(s2_email) if s2_email else "",
            "rawEmail": s2_email or "",
            "configured": bool(s2_email and s2_pass),
        },
    ]

    is_any_configured = any(s["configured"] for s in senders)

    return jsonify(
        configured=is_any_configured,
        senders=senders,
        smtp={"host": host, "port": port},
        assets={"logoUrl": "/kiet-logo.png", "gifUrl": "/celebration.gif"},
    )


@app.post("/api/preview")
def preview():
    """Generates rendered HTML and plaintext template for live UI preview."""
    data = request.get_json(silent=True) or {}

    params = {
        "name": data.get("name") or "Alex Doe",
        "round": data.get("round") or "Round 2",
        "date": data.get("date") or "October 10, 2026",
        "time": data.get("time") or "10:00 AM - 1:00 PM IST",
        "venue": data.get("venue") or "KIET Smart City Lab (Lab 204) / Google Meet",
        "show_cta": data.get("show_cta", True),
        "cta_text": data.get("cta_text") or "View Round 2 Details",
        "cta_url": data.get("cta_url") or "https://kiet.edu",
        "contact_note": data.get("contact_note")
        or "If you have any doubts or questions, feel free to reply directly to this email or contact the lab coordinators.",
        "logo_url": "/kiet-logo.png",
        "gif_url": "/celebration.gif",
        "sender_name": data.get("sender_name") or "KIET Smart City Lab Team",
    }

    try:
        html, plain_text = render_email(params)
        return jsonify(ok=True, html=html, plainText=plain_text)
    except ValueError as err:
        return jsonify(ok=False, error=str(err)), 400
    except Exception as err:
        return jsonify(ok=False, error=f"Template render error: {err}"), 500


def send_single_email(
    sender_email: str,
    sender_pass: str,
    sender_name: str,
    smtp_host: str,
    smtp_port: int,
    recipient_email: str,
    subject: str,
    html_content: str,
    plain_content: str,
) -> Tuple[bool, Optional[str]]:
    """Connects via SMTP_SSL, authenticates, attaches inline CID assets, and dispatches email."""
    try:
        msg = EmailMessage()
        msg["From"] = formataddr((sender_name, sender_email))
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.set_content(plain_content)
        msg.add_alternative(html_content, subtype="html")

        # Attach inline images to the HTML alternative part
        html_part = msg.get_payload()[-1]

        logo_path = os.path.join(BASE_DIR, "static", "kiet-logo.png")
        gif_path = os.path.join(BASE_DIR, "static", "celebration.gif")

        if os.path.exists(logo_path):
            with open(logo_path, "rb") as f:
                html_part.add_related(f.read(), maintype="image", subtype="png", cid="<lab_logo>")

        if os.path.exists(gif_path):
            with open(gif_path, "rb") as f:
                html_part.add_related(f.read(), maintype="image", subtype="gif", cid="<celebrate_anim>")

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=25) as server:
            server.login(sender_email, sender_pass)
            server.send_message(msg)
        return True, None
    except smtplib.SMTPAuthenticationError:
        return False, "Authentication failed. Check your email address and Google App Password."
    except smtplib.SMTPRecipientsRefused:
        return False, "Recipient address was refused by the mail server."
    except Exception as exc:
        return False, str(exc)


@app.post("/api/test-email")
def test_email():
    """Sends a test email to the selected sender's own email address with inline CID assets."""
    data = request.get_json(silent=True) or {}
    sender_id = int(data.get("senderId", 1))

    email_address, app_password, sender_name = get_sender_config(sender_id)
    smtp_host, smtp_port = get_smtp_config()

    if not (email_address and app_password):
        return jsonify(
            error=f"Sender {sender_id} is not configured in .env. Please set SENDER_{sender_id}_EMAIL and SENDER_{sender_id}_PASS."
        ), 400

    template_params = {
        "name": data.get("name") or "Tester",
        "round": data.get("round") or "Round 2",
        "date": data.get("date") or "October 10, 2026",
        "time": data.get("time") or "10:00 AM - 1:00 PM IST",
        "venue": data.get("venue") or "KIET Smart City Lab / Online",
        "show_cta": data.get("show_cta", True),
        "cta_text": data.get("cta_text") or "View Round 2 Details",
        "cta_url": data.get("cta_url") or "https://kiet.edu",
        "contact_note": data.get("contact_note")
        or "If you have any doubts or questions, feel free to reply directly to this email.",
        "logo_url": "cid:lab_logo",
        "gif_url": "cid:celebrate_anim",
        "sender_name": sender_name,
    }

    try:
        html, plain = render_email(template_params)
    except ValueError as e:
        return jsonify(error=f"Template error: {e}"), 400

    subject = data.get("subject") or f"[TEST] KIET Smart City Lab - Shortlist Notification ({template_params['round']})"

    ok, err = send_single_email(
        sender_email=email_address,
        sender_pass=app_password,
        sender_name=sender_name,
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        recipient_email=email_address,
        subject=subject,
        html_content=html,
        plain_content=plain,
    )

    if ok:
        return jsonify(
            success=True,
            message=f"Test email successfully sent to {email_address} using Sender {sender_id} ({sender_name})",
        )
    return jsonify(error=f"Failed to send test email: {err}"), 500


@app.post("/api/send")
def send():
    """Sends batch or personalized emails with selected sender account, inline CID assets, and rate-limiting."""
    data = request.get_json(silent=True) or {}
    sender_id = int(data.get("senderId", 1))
    raw_recipients = data.get("recipients", [])
    default_template = data.get("templateData", {})
    subject_template = (data.get("subject") or "Shortlisted for {{round}} - KIET Smart City Lab").strip()
    batch_delay = float(data.get("batchDelay", 1.0))

    email_address, app_password, sender_name = get_sender_config(sender_id)
    smtp_host, smtp_port = get_smtp_config()

    if not (email_address and app_password):
        return jsonify(
            error=f"Sender {sender_id} is not configured. Please check your .env settings for SENDER_{sender_id}_EMAIL and SENDER_{sender_id}_PASS."
        ), 400

    if not raw_recipients:
        return jsonify(error="At least one recipient is required."), 400

    normalized_list = []
    for item in raw_recipients:
        if isinstance(item, str):
            clean_email = item.strip()
            if clean_email:
                fallback_name = clean_email.split("@")[0].replace(".", " ").title()
                normalized_list.append({
                    "email": clean_email,
                    "name": default_template.get("name") or fallback_name,
                    "round": default_template.get("round", "Round 2"),
                    "date": default_template.get("date", "To be announced"),
                    "time": default_template.get("time", "10:00 AM IST"),
                    "venue": default_template.get("venue", "KIET Smart City Lab / Online"),
                    "cta_url": default_template.get("cta_url", "https://kiet.edu"),
                    "show_cta": default_template.get("show_cta", True),
                    "cta_text": default_template.get("cta_text", "View Round 2 Details"),
                    "contact_note": default_template.get("contact_note", ""),
                })
        elif isinstance(item, dict):
            clean_email = (item.get("email") or "").strip()
            if clean_email:
                normalized_list.append({
                    "email": clean_email,
                    "name": (item.get("name") or default_template.get("name") or clean_email.split("@")[0].title()).strip(),
                    "round": (item.get("round") or default_template.get("round") or "Round 2").strip(),
                    "date": (item.get("date") or default_template.get("date") or "To be announced").strip(),
                    "time": (item.get("time") or default_template.get("time") or "10:00 AM IST").strip(),
                    "venue": (item.get("venue") or default_template.get("venue") or "KIET Smart City Lab / Online").strip(),
                    "cta_url": (item.get("cta_url") or default_template.get("cta_url") or "https://kiet.edu").strip(),
                    "show_cta": item.get("show_cta", default_template.get("show_cta", True)),
                    "cta_text": item.get("cta_text", default_template.get("cta_text", "View Round 2 Details")),
                    "contact_note": item.get("contact_note", default_template.get("contact_note", "")),
                    "tag": (item.get("tag") or "").strip(),
                })

    if not normalized_list:
        return jsonify(error="No valid recipient email addresses found."), 400

    results = []

    for index, recipient in enumerate(normalized_list):
        recip_email = recipient["email"]
        recip_name = recipient["name"]
        recip_round = recipient["round"]

        rendered_subject = subject_template.replace("{{name}}", recip_name).replace("{{round}}", recip_round)

        context = {
            "name": recip_name,
            "email": recip_email,
            "tag": recipient.get("tag", ""),
            "round": recip_round,
            "date": recipient["date"],
            "time": recipient["time"],
            "venue": recipient["venue"],
            "show_cta": recipient.get("show_cta", True),
            "cta_text": recipient.get("cta_text", "View Round 2 Details"),
            "cta_url": recipient.get("cta_url", "https://kiet.edu"),
            "contact_note": recipient.get("contact_note", ""),
            "logo_url": "cid:lab_logo",
            "gif_url": "cid:celebrate_anim",
            "sender_name": sender_name,
        }

        try:
            html_body, plain_body = render_email(context)
            ok, err = send_single_email(
                sender_email=email_address,
                sender_pass=app_password,
                sender_name=sender_name,
                smtp_host=smtp_host,
                smtp_port=smtp_port,
                recipient_email=recip_email,
                subject=rendered_subject,
                html_content=html_body,
                plain_content=plain_body,
            )
            results.append({
                "to": recip_email,
                "name": recip_name,
                "round": recip_round,
                "ok": ok,
                "error": err if not ok else None,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            })
        except Exception as exc:
            results.append({
                "to": recip_email,
                "name": recip_name,
                "round": recip_round,
                "ok": False,
                "error": str(exc),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            })

        if index < len(normalized_list) - 1 and batch_delay > 0:
            time.sleep(batch_delay)

    return jsonify(
        senderUsed={"id": sender_id, "name": sender_name, "email": mask_email(email_address)},
        total=len(normalized_list),
        sent=len([r for r in results if r["ok"]]),
        failed=len([r for r in results if not r["ok"]]),
        results=results,
    )


if __name__ == "__main__":
    app.run(port=5000, debug=True)