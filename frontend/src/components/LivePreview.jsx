import { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Eye, Code, FileText, ExternalLink, HelpCircle } from "lucide-react";

export default function LivePreview({
  templateData,
  renderedHtml,
  plainText,
  senderName,
}) {
  const [viewMode, setViewMode] = useState("web"); // "web" | "html" | "plain"

  const LOTTIE_URL =
    "https://lottie.host/9e2c6c40-3b61-4a51-b274-7bbe973bdaff/vldJEzOHPK.lottie";

  const roundName = templateData.round || "Round 2";
  const studentName = templateData.name || "Alex Doe";
  const eventDate = templateData.date || "October 10, 2026";
  const eventTime = templateData.time || "10:00 AM - 1:00 PM IST";
  const eventVenue =
    templateData.venue || "KIET Smart City Lab (Room 204) / Google Meet";
  const ctaUrl = templateData.cta_url || "https://kiet.edu";
  const showCta = templateData.show_cta !== false;
  const ctaText = templateData.cta_text || "View Round 2 Details";
  const contactNote =
    templateData.contact_note ||
    "If you have any doubts or questions, feel free to reply directly to this email or contact the lab coordinators.";

  return (
    <div className="cloud-preview-panel">
      {/* Preview Header & Tab Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-title-area">
          <Eye size={16} className="text-primary" />
          <span className="toolbar-heading">Live Email Preview</span>
        </div>

        <div className="cloud-seg-tabs">
          <button
            type="button"
            className={`cloud-tab ${viewMode === "web" ? "active" : ""}`}
            onClick={() => setViewMode("web")}
            title="Interactive preview with native animation"
          >
            Interactive
          </button>
          <button
            type="button"
            className={`cloud-tab ${viewMode === "html" ? "active" : ""}`}
            onClick={() => setViewMode("html")}
            title="Raw HTML email layout"
          >
            <Code size={13} />
            <span>HTML</span>
          </button>
          <button
            type="button"
            className={`cloud-tab ${viewMode === "plain" ? "active" : ""}`}
            onClick={() => setViewMode("plain")}
            title="Plain text fallback version"
          >
            <FileText size={13} />
            <span>Plain</span>
          </button>
        </div>
      </div>

      {/* Viewport Area */}
      <div className="preview-canvas">
        {viewMode === "web" && (
          <div className="email-client-shell">
            <div className="email-doc">
              {/* Logo Header */}
              <div className="doc-logo-header">
                <img
                  src="/kiet-logo.png"
                  alt="KIET Smart City Lab"
                  className="doc-logo-img"
                />
              </div>

              {/* Congratulations Hero */}
              <div className="doc-hero-banner">
                <span className="hero-popper">🎉</span>
                <h2 className="hero-main-title">Congratulations!</h2>
                <p className="hero-sub-title">
                  Shortlisted for Selection Process
                </p>
              </div>

              {/* Main Content */}
              <div className="doc-body">
                <p className="doc-greeting">
                  Dear <span className="text-highlight">{studentName}</span>,
                </p>

                <p className="doc-text">
                  We are pleased to inform you that you have successfully cleared{" "}
                  <strong className="text-blue-accent">Round 1</strong> of the{" "}
                  <strong className="text-dark-bold">
                    KIET Smart City Lab Selection Process
                  </strong>{" "}
                  and have been shortlisted for{" "}
                  <strong className="text-blue-accent">{roundName}</strong>.
                </p>

                <p className="doc-text text-muted-sub">
                  Your performance in Round 1 demonstrated your interest and
                  potential, and we look forward to seeing you in the next stage.
                </p>

                {/* Details Table */}
                <div className="doc-details-card">
                  <div className="card-item">
                    <span className="item-icon">📌</span>
                    <span className="item-label">Round:</span>
                    <span className="item-value">{roundName}</span>
                  </div>
                  <div className="card-item">
                    <span className="item-icon">📅</span>
                    <span className="item-label">Date:</span>
                    <span className="item-value">{eventDate}</span>
                  </div>
                  <div className="card-item">
                    <span className="item-icon">⏰</span>
                    <span className="item-label">Time:</span>
                    <span className="item-value">{eventTime}</span>
                  </div>
                  <div className="card-item">
                    <span className="item-icon">📍</span>
                    <span className="item-label">Venue / Mode:</span>
                    <span className="item-value">{eventVenue}</span>
                  </div>
                </div>

                <p className="doc-text text-sm-note">
                  Further details and instructions regarding {roundName} will be
                  shared accordingly. Please ensure you are prepared on time.
                </p>

                {/* Action Button (Optional based on toggle) */}
                {showCta && (
                  <div className="doc-action-center">
                    <a
                      href={ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="doc-primary-btn"
                    >
                      <span>{ctaText}</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* Contact doubts note (clean inline box) */}
                {contactNote && (
                  <div className="doc-contact-box">
                    <div className="contact-box-title">
                      <HelpCircle size={14} />
                      <span>Have a doubt or question?</span>
                    </div>
                    <p className="contact-box-text">{contactNote}</p>
                  </div>
                )}

                <p className="doc-closing-msg">
                  Once again, congratulations, and all the best for {roundName}! 🚀
                </p>

                {/* Clean, Seamless Lottie Animation (High Definition) */}
                <div className="clean-lottie-wrapper">
                  <DotLottieReact
                    src={LOTTIE_URL}
                    loop
                    autoplay
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>

              {/* Email Footer */}
              <div className="doc-footer">
                <p className="footer-sign">
                  Regards,<br />
                  <strong>{senderName || "KIET Smart City Lab Team"}</strong>
                </p>
                <p className="footer-inst">
                  KIET Smart City Lab • KIET Group of Institutions
                </p>
                <div className="footer-line" />
                <p className="footer-disclaim">
                  This automated notification was sent regarding your selection process status.
                </p>
              </div>
            </div>
          </div>
        )}

        {viewMode === "html" && (
          <div className="html-preview-frame">
            <iframe
              title="Raw Client Email View"
              srcDoc={renderedHtml}
              className="iframe-view"
            />
          </div>
        )}

        {viewMode === "plain" && (
          <div className="plain-preview-box">
            <pre className="plain-text-block">{plainText}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
