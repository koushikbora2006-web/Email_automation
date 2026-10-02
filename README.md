# Email Automation

A full-stack application for automated email dispatching built with React (Vite) and Flask.

## Features

- **Bulk Email Sending**: Send personalized or batch emails to multiple recipients.
- **Modern UI**: Clean and intuitive interface built with React & Vite.
- **Python Backend**: Lightweight Flask API using Python's native `smtplib` and SSL.

---

## Getting Started

### 1. Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your `.env` in the root or `backend/` folder (refer to `.env.example`):
   ```env
   EMAIL_ADDRESS="your_email@gmail.com"
   EMAIL_APP_PASSWORD="your_google_app_password"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=465
   ```
5. Run the Flask backend:
   ```bash
   python app.py
   ```

### 2. Frontend Setup

1. Open a terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## Security

- Do **not** commit your `.env` file containing credentials.
- Use an [App Password](https://myaccount.google.com/apppasswords) if using Gmail SMTP with 2-Factor Authentication enabled.
