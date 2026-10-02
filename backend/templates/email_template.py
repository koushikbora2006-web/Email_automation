import re
from typing import Any, Dict, Tuple

DEFAULT_LOGO_URL = "cid:lab_logo"
DEFAULT_GIF_URL = "cid:celebrate_anim"
DEFAULT_CTA_URL = "https://kiet.edu"

ALLOWED_PLACEHOLDERS = {
    "name",
    "email",
    "tag",
    "round",
    "date",
    "time",
    "venue",
    "cta_url",
    "cta_text",
    "show_cta",
    "contact_note",
    "logo_url",
    "gif_url",
    "sender_name",
}


def extract_and_validate_placeholders(text: str, context: Dict[str, Any]) -> None:
    """Finds all {{placeholder}} tags in text and ensures they are valid and present in context."""
    found_tags = set(re.findall(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}", text))
    unknown_tags = found_tags - ALLOWED_PLACEHOLDERS
    if unknown_tags:
        raise ValueError(
            f"Unknown placeholder keyword(s): {', '.join(sorted(unknown_tags))}. "
            f"Allowed keywords are: {', '.join(sorted(ALLOWED_PLACEHOLDERS))}"
        )


def substitute_placeholders(text: str, context: Dict[str, Any]) -> str:
    """Substitutes {{placeholder}} with corresponding values from context."""

    def replace_match(match):
        key = match.group(1).strip()
        val = context.get(key)
        if val is None or str(val).strip() == "":
            raise ValueError(f"Missing required value for keyword '{{{{{key}}}}}'")
        return str(val)

    return re.sub(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}", replace_match, text)


def render_email(params: Dict[str, Any]) -> Tuple[str, str]:
    """Renders both responsive HTML email (compatible with Gmail, Outlook, Apple Mail)

    and a clean plain-text alternative.
    """
    show_cta = params.get("show_cta", True)
    if isinstance(show_cta, str):
        show_cta = show_cta.lower() in ("true", "1", "yes")

    logo_url = params.get("logo_url") or DEFAULT_LOGO_URL
    gif_url = params.get("gif_url") or DEFAULT_GIF_URL

    context = {
        "name": params.get("name", "").strip(),
        "email": params.get("email", "").strip(),
        "tag": params.get("tag", "").strip() or "Applicant",
        "round": params.get("round", "Round 2").strip(),
        "date": params.get("date", "To be announced").strip(),
        "time": params.get("time", "10:00 AM IST").strip(),
        "venue": params.get("venue", "KIET Smart City Lab / Online").strip(),
        "show_cta": show_cta,
        "cta_text": params.get("cta_text", "View Round 2 Details").strip() or "View Round 2 Details",
        "cta_url": params.get("cta_url", DEFAULT_CTA_URL).strip() or DEFAULT_CTA_URL,
        "contact_note": params.get(
            "contact_note",
            "If you have any doubts or questions, feel free to reply directly to this email or contact the lab coordinators.",
        ).strip(),
        "logo_url": logo_url,
        "gif_url": gif_url,
        "sender_name": params.get("sender_name", "KIET Smart City Lab Team").strip(),
    }

    if not context["name"]:
        raise ValueError("Recipient 'name' is required for the email template.")

    # Plain text version
    cta_plain = f"\nAction Link: {context['cta_url']} ({context['cta_text']})\n" if context["show_cta"] else ""
    contact_plain = f"\n{context['contact_note']}\n" if context["contact_note"] else ""

    plain_text = f"""Dear {context['name']},

Congratulations! We are pleased to inform you that you have successfully cleared Round 1 of the KIET Smart City Lab Selection Process and have been shortlisted for {context['round']}.

Your performance in Round 1 demonstrated your interest and potential, and we look forward to seeing you in the next stage.

==================================================
SELECTION PROCESS DETAILS:
* Round: {context['round']}
* Date: {context['date']}
* Time: {context['time']}
* Venue / Mode: {context['venue']}
=================================================={cta_plain}
Further details and instructions regarding {context['round']} will be shared accordingly.{contact_plain}
Once again, congratulations, and all the best for {context['round']}! 🚀

Regards,
{context['sender_name']}
KIET Smart City Lab • KIET Group of Institutions
"""

    # Button or Contact box HTML
    if context["show_cta"]:
        action_html = f"""
              <!-- Bulletproof Call-To-Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 24px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{context['cta_url']}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="16%" strokecolor="#1d4ed8" fillcolor="#2563eb">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">{context['cta_text']}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="{context['cta_url']}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); background-color: #2563eb; border: 1px solid #1d4ed8; border-radius: 8px; color: #ffffff; display: inline-block; font-size: 14px; font-weight: 600; line-height: 44px; text-align: center; text-decoration: none; width: auto; min-width: 220px; padding: 0 24px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">
                      {context['cta_text']} &rarr;
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
        """
    else:
        action_html = ""

    contact_html = ""
    if context["contact_note"]:
        contact_html = f"""
              <!-- Contact / Doubts Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0 20px 0; background-color: #f1f5f9; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; line-height: 18px; color: #475569; text-align: center;">
                    💬 <strong>Have a doubt or question?</strong><br/>
                    {context['contact_note']}
                  </td>
                </tr>
              </table>
        """

    # Responsive HTML template
    html_content = f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--<![endif]-->
  <title>KIET Smart City Lab - Shortlist Notification</title>
  <style type="text/css">
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }}
    body {{ height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; }}
    @media screen and (max-width: 600px) {{
      .email-container {{ width: 100% !important; max-width: 100% !important; }}
      .content-padding {{ padding: 20px 16px !important; }}
      .hero-title {{ font-size: 22px !important; line-height: 28px !important; }}
      .details-table td {{ display: block !important; width: 100% !important; padding-bottom: 6px !important; }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        
        <!-- Main Email Container (Max 600px) -->
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Top Header / Logo -->
          <tr>
            <td align="center" style="padding: 24px 20px 16px 20px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <img src="{context['logo_url']}" alt="KIET Smart City Lab Logo" width="200" style="display: block; max-width: 220px; height: auto; margin: 0 auto;" />
            </td>
          </tr>

          <!-- Hero Strip -->
          <tr>
            <td style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px 24px; text-align: center; border-bottom: 1px solid #bfdbfe;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; line-height: 1; display: inline-block; margin-bottom: 4px;">🎉</span>
                    <h1 class="hero-title" style="margin: 0; font-size: 22px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.3px;">
                      Congratulations!
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #2563eb;">
                      Shortlisted for Selection Process
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="content-padding" style="padding: 28px 24px 16px 24px; color: #334155; font-size: 15px; line-height: 24px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">
                Dear <span style="color: #2563eb;">{context['name']}</span>,
              </p>

              <!-- Announcement Paragraph with Highlights -->
              <p style="margin: 0 0 16px 0; color: #334155;">
                We are pleased to inform you that you have successfully cleared <strong style="color: #2563eb; font-weight: 700;">Round 1</strong> of the <strong style="color: #0f172a; font-weight: 700;">KIET Smart City Lab Selection Process</strong> and have been shortlisted for <strong style="color: #2563eb; font-weight: 700;">{context['round']}</strong>.
              </p>

              <p style="margin: 0 0 20px 0; color: #475569;">
                Your performance in Round 1 demonstrated your interest and potential, and we look forward to seeing you in the next stage.
              </p>

              <!-- Details Card with Left Accent Border & Icon Rows -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px 0; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 8px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <table role="presentation" class="details-table" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="28" valign="top" style="padding: 5px 0; font-size: 15px;">📌</td>
                        <td style="padding: 5px 6px; font-size: 13.5px; font-weight: 600; color: #64748b;" width="110">Round:</td>
                        <td style="padding: 5px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">{context['round']}</td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="padding: 5px 0; font-size: 15px;">📅</td>
                        <td style="padding: 5px 6px; font-size: 13.5px; font-weight: 600; color: #64748b;">Date:</td>
                        <td style="padding: 5px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">{context['date']}</td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="padding: 5px 0; font-size: 15px;">⏰</td>
                        <td style="padding: 5px 6px; font-size: 13.5px; font-weight: 600; color: #64748b;">Time:</td>
                        <td style="padding: 5px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">{context['time']}</td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style="padding: 5px 0; font-size: 15px;">📍</td>
                        <td style="padding: 5px 6px; font-size: 13.5px; font-weight: 600; color: #64748b;">Venue / Mode:</td>
                        <td style="padding: 5px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">{context['venue']}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Further instructions info -->
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;">
                Further details and instructions regarding {context['round']} will be shared accordingly. Please ensure you are prepared on time.
              </p>

              {action_html}
              {contact_html}

              <!-- Closing line -->
              <p style="margin: 16px 0 16px 0; font-size: 14.5px; font-weight: 600; color: #0f172a; text-align: center;">
                Once again, congratulations, and all the best for {context['round']}! 🚀
              </p>

              <!-- Inline Celebration Animation -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 12px 0 18px 0;">
                <tr>
                  <td align="center">
                    <img src="{context['gif_url']}" alt="Party Celebration" width="160" height="160" style="display: block; width: 160px; max-width: 160px; height: auto;" />
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">
                Regards,<br/>
                <span style="color: #2563eb;">{context['sender_name']}</span>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                KIET Smart City Lab • KIET Group of Institutions
              </p>
              <div style="height: 1px; background-color: #e2e8f0; width: 60px; margin: 8px auto;"></div>
              <p style="margin: 0; font-size: 11px; line-height: 15px; color: #94a3b8;">
                This automated email was sent regarding your selection process status.
              </p>
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
        
      </td>
    </tr>
  </table>
</body>
</html>"""

    return html_content, plain_text
