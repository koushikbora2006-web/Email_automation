# ⚡ KIET Smart City Lab — Email Automation Platform

A modern full-stack email automation system designed for mass and personalized internship notifications with dual sender account routing, responsive HTML email templates, and real-time live preview.

---

## ✨ Features

- 🔀 **Dual Sender Support & Quick Toggle**:
  - Configure two sender accounts (`Sender 1` and `Sender 2`) in `.env`.
  - Switch senders on the fly directly from the UI header.
  - Safe credential handling: passwords are used strictly for authenticated SMTP handshakes and are never logged or exposed in API responses.
- 🧪 **"Send Test Email to Myself"**:
  - One-click testing to verify email formatting and deliverability directly to your own inbox.
- 🎨 **Premium Responsive HTML Template**:
  - Compatible across **Gmail**, **Outlook** (MSO conditional rendering), and **Apple Mail**.
  - 600px max-width container, table-based layout with inline CSS styles.
  - Centered brand logo & festive "Congratulations!" hero section.
  - Light-gray details card with left accent border and icon rows (📌 Round, 📅 Date, ⏰ Time, 📍 Venue/Mode).
  - Bulletproof Call-To-Action (CTA) button.
  - Lower middle GIF fallback for email clients with an interactive **DotLottie** animation in the web preview (`@lottiefiles/dotlottie-react`).
  - Strict placeholder validation (`{{name}}`, `{{round}}`, `{{date}}`, `{{time}}`, `{{venue}}`, `{{email}}`, etc.) that flags unknown tokens before sending.
  - Plain-text multipart alternative (`multipart/alternative`) generation.
- 👥 **Flexible Recipient Input & CSV Parser**:
  - Paste comma or newline separated email lists.
  - Drag-and-drop CSV upload (powered by `PapaParse`) with auto-column matching (`name`, `email`, `round`, `date`, `time`, `venue`).
  - Sample CSV template download built right into the UI.
- ⏱️ **Anti-Spam Rate Limiting**:
  - Configurable dispatch delay (0.5s – 2.0s per email) to comply with SMTP rate limits and avoid spam flags.
- 📊 **Real-Time Execution Summary**:
  - Live progress bar, success/failure metrics, detailed recipient status log, and one-click retry for failed dispatches.

---

## 🚀 Quick Start (Single Command)

### 1. Install All Dependencies

Run from the project root:
```bash
npm run install:all
```
*(This installs root packages, frontend npm dependencies, and backend Python requirements.)*

### 2. Configure Environment (`.env`)

Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```

Fill in your sender details:
```env
# Sender 1 (Primary)
SENDER_1_NAME="KIET Smart City Lab Team"
SENDER_1_EMAIL="your_primary_email@gmail.com"
SENDER_1_PASS="your_16_char_google_app_password"

# Sender 2 (Secondary / Alternate)
SENDER_2_NAME="KIET Smart City Lab Coordinator"
SENDER_2_EMAIL="your_secondary_email@gmail.com"
SENDER_2_PASS="your_16_char_google_app_password"

# SMTP Server Details
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465

# Brand Assets (Optional custom URLs)
LOGO_URL="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/graduation-cap.png"
GIF_URL="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdW1uNzRzYXZjN3VvdTV4NGYxdWZqZ3FzaDdtcjB0eHRoc3hpeHEzMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1F4020tX1eWwMhPqL/giphy.gif"
```

### 3. Run Everything Together

```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both Python Flask backend and React Vite frontend concurrently with labeled, color-coded output. |
| `npm run dev:backend` | Starts only the Python Flask backend server on port 5000. |
| `npm run dev:frontend` | Starts only the Vite frontend dev server on port 5173. |
| `npm run install:all` | Installs dependencies across root, `frontend/`, and `backend/`. |

---

## 🔑 How to Generate a Gmail App Password

If you are using a Gmail or Google Workspace account:

1. Visit your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. Go to [Google App Passwords](https://myaccount.google.com/apppasswords).
4. Enter an app name (e.g. `Email Automation App`) and click **Create**.
5. Copy the generated **16-character password** (e.g., `abcd efgh ijkl mnop`).
6. Paste it into `SENDER_1_PASS` or `SENDER_2_PASS` in your `.env` file (spaces are automatically handled).

---

## 🖼️ Hosting Custom Logos and GIFs

- **Logo**: Host a square or horizontal transparent PNG (e.g., GitHub Raw, Imgur, Cloudinary, or AWS S3) and paste the public HTTPS link into `LOGO_URL`.
- **Celebration GIF**: Host an animated GIF on Giphy, Cloudinary, or S3 and paste into `GIF_URL`.
  > **Note**: In the live web preview inside the app, the interface renders an interactive vector Lottie animation (`@lottiefiles/dotlottie-react`). In actual sent emails, the responsive template uses the static/GIF fallback so Outlook and desktop clients render smoothly without script execution blockers.

---

## 📄 CSV Format for Bulk Personalized Sending

When uploading a `.csv` file in the Compose panel, make sure your header row includes:
```csv
name,email,round,date,time,venue
Alex Smith,alex.smith@example.com,Round 2,October 10 2026,10:00 AM IST,KIET Smart City Lab / Online
Priya Sharma,priya.sharma@example.com,Round 2,October 10 2026,11:30 AM IST,KIET Smart City Lab (Room 204)
```

The system will automatically parse and personalize each recipient's email template and subject line individually.

---

## ⚓ Note on Git Hooks & Husky

If configuring Git hooks (e.g. via Husky or `.git/hooks`):
- **Best Practice**: Git hooks (such as `pre-commit` or `pre-push`) should run fast validation steps like format checks, linters (`npm run lint`), or unit tests.
- **Never trigger long-running servers inside git hooks**: Git hooks are intended for pre-commit sanity checks. To run the full application, use `npm run dev`.
