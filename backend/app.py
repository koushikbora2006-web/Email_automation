import os
import smtplib
import ssl
from email.message import EmailMessage

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)
load_dotenv(override=True)


def get_config():
    """Helper to dynamically read config and support runtime .env changes."""
    load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)
    load_dotenv(override=True)
    email = os.getenv("EMAIL_ADDRESS", "").strip()
    password = os.getenv("EMAIL_APP_PASSWORD", "").replace(" ", "")
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "465"))
    return email, password, host, port


EMAIL_ADDRESS, APP_PASSWORD, SMTP_HOST, SMTP_PORT = get_config()

app = Flask(__name__)
CORS(app)


@app.get("/api/health")
def health():
    """Tells the frontend whether the .env file is filled in."""
    email_address, _, _, _ = get_config()
    return jsonify(configured=True, sender=email_address or EMAIL_ADDRESS)


@app.post("/api/send")
def send():
    data = request.get_json(silent=True) or {}
    recipients = [r.strip() for r in data.get("recipients", []) if r.strip()]
    subject = (data.get("subject") or "").strip()
    body = (data.get("body") or "").strip()

    email_address, app_password, smtp_host, smtp_port = get_config()

    if not (email_address and app_password):
        return jsonify(error="Add EMAIL_ADDRESS and EMAIL_APP_PASSWORD to backend/.env"), 500
    if not recipients or not subject or not body:
        return jsonify(error="Recipients, subject and message are all required."), 400

    results = []
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
            server.login(email_address, app_password)
            for to in recipients:
                msg = EmailMessage()
                msg["From"] = email_address
                msg["To"] = to
                msg["Subject"] = subject
                msg.set_content(body)
                try:
                    server.send_message(msg)
                    results.append({"to": to, "ok": True})
                except Exception as e:  # one bad address shouldn't stop the rest
                    results.append({"to": to, "ok": False, "error": str(e)})
    except smtplib.SMTPAuthenticationError:
        return jsonify(error="Login failed. Check your email and app password."), 401
    except Exception as e:
        return jsonify(error=f"Could not connect: {e}"), 500

    return jsonify(results=results)


if __name__ == "__main__":
    app.run(port=5000, debug=True)