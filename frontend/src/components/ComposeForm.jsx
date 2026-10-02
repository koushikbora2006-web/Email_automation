import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import {
  User,
  Users,
  FileSpreadsheet,
  Calendar,
  Clock,
  MapPin,
  Award,
  Link2,
  Mail,
  Send,
  Upload,
  Download,
  CheckCircle2,
  Trash2,
  Sliders,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";

export default function ComposeForm({
  templateData,
  onChangeTemplateData,
  recipientsList,
  onChangeRecipientsList,
  onSendEmails,
  isSending,
  currentSender,
}) {
  const [inputMode, setInputMode] = useState("single"); // "single" | "manual" | "csv"
  const [singleEmail, setSingleEmail] = useState("");
  const [singleName, setSingleName] = useState(templateData.name || "Alex Doe");
  const [manualText, setManualText] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [batchDelay, setBatchDelay] = useState(1.0);
  const fileInputRef = useRef(null);

  // Sync single mode recipient to recipientsList whenever single email/name or template data changes
  useEffect(() => {
    if (inputMode === "single") {
      const cleanEmail = singleEmail.trim();
      if (cleanEmail && cleanEmail.includes("@")) {
        onChangeRecipientsList([
          {
            email: cleanEmail,
            name: singleName.trim() || templateData.name || "Candidate",
            round: templateData.round,
            date: templateData.date,
            time: templateData.time,
            venue: templateData.venue,
            cta_url: templateData.cta_url,
            show_cta: templateData.show_cta !== false,
            cta_text: templateData.cta_text,
            contact_note: templateData.contact_note,
          },
        ]);
      } else {
        onChangeRecipientsList([]);
      }
    }
  }, [inputMode, singleEmail, singleName, templateData]);

  // Handle single candidate name change
  const handleSingleNameChange = (e) => {
    const val = e.target.value;
    setSingleName(val);
    onChangeTemplateData({ ...templateData, name: val });
  };

  // Toggle CTA Button
  const handleToggleCta = () => {
    const current = templateData.show_cta !== false;
    onChangeTemplateData({ ...templateData, show_cta: !current });
  };

  // Parse manual text whenever it changes
  const handleManualTextChange = (e) => {
    const text = e.target.value;
    setManualText(text);
    const emails = text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s && s.includes("@"));

    onChangeRecipientsList(
      emails.map((email) => ({
        email,
        name: templateData.name || email.split("@")[0].replace(".", " "),
        round: templateData.round,
        date: templateData.date,
        time: templateData.time,
        venue: templateData.venue,
        cta_url: templateData.cta_url,
        show_cta: templateData.show_cta !== false,
        cta_text: templateData.cta_text,
        contact_note: templateData.contact_note,
      }))
    );
  };

  // CSV File upload handler with PapaParse
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const parsed = rows
          .map((row) => {
            const emailKey = Object.keys(row).find((k) =>
              /email|mail|recipient/i.test(k)
            );
            const nameKey = Object.keys(row).find((k) =>
              /name|student|candidate/i.test(k)
            );
            const roundKey = Object.keys(row).find((k) => /round/i.test(k));
            const dateKey = Object.keys(row).find((k) => /date/i.test(k));
            const timeKey = Object.keys(row).find((k) => /time/i.test(k));
            const venueKey = Object.keys(row).find((k) =>
              /venue|mode|location/i.test(k)
            );
            const tagKey = Object.keys(row).find((k) =>
              /tag|id|roll/i.test(k)
            );

            const email = emailKey ? String(row[emailKey] || "").trim() : "";
            if (!email || !email.includes("@")) return null;

            return {
              email,
              name: nameKey && row[nameKey] ? String(row[nameKey]).trim() : templateData.name,
              round: roundKey && row[roundKey] ? String(row[roundKey]).trim() : templateData.round,
              date: dateKey && row[dateKey] ? String(row[dateKey]).trim() : templateData.date,
              time: timeKey && row[timeKey] ? String(row[timeKey]).trim() : templateData.time,
              venue: venueKey && row[venueKey] ? String(row[venueKey]).trim() : templateData.venue,
              tag: tagKey && row[tagKey] ? String(row[tagKey]).trim() : "",
              cta_url: templateData.cta_url,
              show_cta: templateData.show_cta !== false,
              cta_text: templateData.cta_text,
              contact_note: templateData.contact_note,
            };
          })
          .filter(Boolean);

        onChangeRecipientsList(parsed);
      },
      error: (err) => {
        alert(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "name,email,round,date,time,venue\n" +
      "Alex Smith,alex.smith@example.com,Round 2,October 10 2026,10:00 AM IST,KIET Smart City Lab / Online\n" +
      "Priya Sharma,priya.sharma@example.com,Round 2,October 10 2026,11:30 AM IST,KIET Smart City Lab (Room 204)\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "candidates_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearRecipients = () => {
    setManualText("");
    setCsvFileName("");
    onChangeRecipientsList([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const count = recipientsList.length;
  const showCta = templateData.show_cta !== false;

  return (
    <div className="cloud-form-stack">
      {/* Target Recipient Card */}
      <section className="cloud-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <Users size={17} className="text-primary" />
            <span className="card-heading">Target Recipient</span>
          </div>
          <span className="count-pill">
            {count} {count === 1 ? "candidate ready" : "candidates ready"}
          </span>
        </div>

        {/* Cloud Segmented Mode Switcher */}
        <div className="mode-segmented-bar">
          <button
            type="button"
            className={`mode-btn ${inputMode === "single" ? "active" : ""}`}
            onClick={() => setInputMode("single")}
          >
            <User size={14} />
            <span>Single Mail</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === "manual" ? "active" : ""}`}
            onClick={() => {
              setInputMode("manual");
              const emails = manualText
                .split(/[\n,;]+/)
                .map((s) => s.trim())
                .filter((s) => s && s.includes("@"));
              onChangeRecipientsList(
                emails.map((email) => ({
                  email,
                  name: templateData.name || email.split("@")[0].replace(".", " "),
                  round: templateData.round,
                  date: templateData.date,
                  time: templateData.time,
                  venue: templateData.venue,
                  cta_url: templateData.cta_url,
                  show_cta: templateData.show_cta !== false,
                  cta_text: templateData.cta_text,
                  contact_note: templateData.contact_note,
                }))
              );
            }}
          >
            <Mail size={14} />
            <span>Bulk List</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === "csv" ? "active" : ""}`}
            onClick={() => setInputMode("csv")}
          >
            <FileSpreadsheet size={14} />
            <span>CSV Upload</span>
          </button>
        </div>

        {/* 1. Single Mode */}
        {inputMode === "single" && (
          <div className="form-inner-stack">
            <div className="cloud-grid-2">
              <div className="cloud-input-group">
                <label htmlFor="single-recipient-name">
                  <User size={13} /> Candidate Name
                </label>
                <input
                  id="single-recipient-name"
                  type="text"
                  placeholder="e.g. Abhishek Sharma"
                  value={singleName}
                  onChange={handleSingleNameChange}
                />
              </div>

              <div className="cloud-input-group">
                <label htmlFor="single-recipient-email">
                  <Mail size={13} /> Candidate Email Address
                </label>
                <input
                  id="single-recipient-email"
                  type="email"
                  placeholder="e.g. abhishek@example.com"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                />
              </div>
            </div>

            {singleEmail && singleEmail.includes("@") ? (
              <div className="success-banner">
                <CheckCircle2 size={15} />
                <span>
                  Ready to send to <strong>{singleName || "Candidate"}</strong> ({singleEmail})
                </span>
              </div>
            ) : (
              <p className="cloud-subtext">
                Enter the candidate&apos;s name and email above to personalize and dispatch an individual mail.
              </p>
            )}
          </div>
        )}

        {/* 2. Manual Bulk Mode */}
        {inputMode === "manual" && (
          <div className="cloud-input-group">
            <label htmlFor="manual-emails">
              Paste Email Addresses (comma or line separated)
            </label>
            <textarea
              id="manual-emails"
              rows={4}
              placeholder="candidate1@example.com&#10;candidate2@example.com, candidate3@example.com"
              value={manualText}
              onChange={handleManualTextChange}
            />
          </div>
        )}

        {/* 3. CSV Mode */}
        {inputMode === "csv" && (
          <div className="csv-drop-area">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden-file-input"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cloud-dropzone">
              <Upload size={22} className="text-primary" />
              <div className="dropzone-info">
                <strong>{csvFileName || "Upload CSV Candidate List"}</strong>
                <span>Auto-maps columns: name, email, round, date, time, venue</span>
              </div>
            </label>

            <div className="dropzone-actions">
              <button
                type="button"
                className="btn-text-link"
                onClick={handleDownloadSampleCsv}
              >
                <Download size={13} />
                <span>Download Sample CSV Template</span>
              </button>
              {csvFileName && (
                <button
                  type="button"
                  className="btn-text-link text-danger"
                  onClick={handleClearRecipients}
                >
                  <Trash2 size={13} />
                  <span>Remove File</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Selection & Event Details Card */}
      <section className="cloud-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <Award size={17} className="text-primary" />
            <span className="card-heading">Selection & Schedule</span>
          </div>
        </div>

        <div className="cloud-grid-2">
          <div className="cloud-input-group">
            <label htmlFor="field-round">
              <Award size={13} /> Round Name
            </label>
            <input
              id="field-round"
              value={templateData.round || ""}
              onChange={(e) =>
                onChangeTemplateData({ ...templateData, round: e.target.value })
              }
              placeholder="e.g. Round 2"
            />
          </div>

          <div className="cloud-input-group">
            <label htmlFor="field-name">
              <User size={13} /> Default Candidate Name
            </label>
            <input
              id="field-name"
              value={templateData.name || ""}
              onChange={(e) => {
                const val = e.target.value;
                onChangeTemplateData({ ...templateData, name: val });
                if (inputMode === "single") setSingleName(val);
              }}
              placeholder="e.g. Alex Doe"
            />
          </div>
        </div>

        <div className="cloud-grid-2">
          <div className="cloud-input-group">
            <label htmlFor="field-date">
              <Calendar size={13} /> Date
            </label>
            <input
              id="field-date"
              value={templateData.date || ""}
              onChange={(e) =>
                onChangeTemplateData({ ...templateData, date: e.target.value })
              }
              placeholder="e.g. October 10, 2026"
            />
          </div>

          <div className="cloud-input-group">
            <label htmlFor="field-time">
              <Clock size={13} /> Time
            </label>
            <input
              id="field-time"
              value={templateData.time || ""}
              onChange={(e) =>
                onChangeTemplateData({ ...templateData, time: e.target.value })
              }
              placeholder="e.g. 10:00 AM - 1:00 PM IST"
            />
          </div>
        </div>

        <div className="cloud-input-group">
          <label htmlFor="field-venue">
            <MapPin size={13} /> Venue / Mode
          </label>
          <input
            id="field-venue"
            value={templateData.venue || ""}
            onChange={(e) =>
              onChangeTemplateData({ ...templateData, venue: e.target.value })
            }
            placeholder="e.g. KIET Smart City Lab (Room 204) / Google Meet"
          />
        </div>

        {/* Action Button (CTA) & Contact Toggle Section */}
        <div className="cta-toggle-box">
          <div className="cta-toggle-header">
            <div className="cta-toggle-title">
              <Sparkles size={14} className="text-primary" />
              <span>Include Action Button (CTA)</span>
            </div>
            <button
              type="button"
              className={`toggle-switch-btn ${showCta ? "on" : "off"}`}
              onClick={handleToggleCta}
            >
              {showCta ? <ToggleRight size={26} className="text-primary" /> : <ToggleLeft size={26} className="text-muted" />}
              <span className="toggle-state-text">{showCta ? "Enabled" : "Disabled (Removed)"}</span>
            </button>
          </div>

          {showCta ? (
            <div className="cloud-grid-2 cta-fields-row">
              <div className="cloud-input-group">
                <label htmlFor="field-cta-text">Button Label</label>
                <input
                  id="field-cta-text"
                  value={templateData.cta_text || "View Round 2 Details"}
                  onChange={(e) =>
                    onChangeTemplateData({ ...templateData, cta_text: e.target.value })
                  }
                  placeholder="e.g. View Round 2 Details"
                />
              </div>
              <div className="cloud-input-group">
                <label htmlFor="field-cta-url">
                  <Link2 size={13} /> Button Link (URL)
                </label>
                <input
                  id="field-cta-url"
                  value={templateData.cta_url || ""}
                  onChange={(e) =>
                    onChangeTemplateData({ ...templateData, cta_url: e.target.value })
                  }
                  placeholder="https://kiet.edu"
                />
              </div>
            </div>
          ) : (
            <div className="cloud-input-group" style={{ marginTop: "10px" }}>
              <label htmlFor="field-contact-note">
                <HelpCircle size={13} /> Contact Note (Instead of Button)
              </label>
              <textarea
                id="field-contact-note"
                rows={2}
                value={
                  templateData.contact_note !== undefined
                    ? templateData.contact_note
                    : "If you have any doubts or questions, feel free to reply directly to this email or contact the lab coordinators."
                }
                onChange={(e) =>
                  onChangeTemplateData({ ...templateData, contact_note: e.target.value })
                }
                placeholder="Message for students if they have queries..."
              />
            </div>
          )}
        </div>

        {/* Subject Line */}
        <div className="cloud-input-group">
          <label htmlFor="field-subject">
            <Mail size={13} /> Subject Line
          </label>
          <input
            id="field-subject"
            value={templateData.subject || ""}
            onChange={(e) =>
              onChangeTemplateData({ ...templateData, subject: e.target.value })
            }
            placeholder="Shortlisted for {{round}} - KIET Smart City Lab"
          />
        </div>

        {/* Anti-Spam Rate Limit (Bulk modes) */}
        {inputMode !== "single" && (
          <div className="rate-limit-row">
            <div className="rate-limit-lbl">
              <Sliders size={13} />
              <span>Dispatch Delay:</span>
            </div>
            <div className="rate-chips">
              {[0.5, 1.0, 1.5, 2.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`rate-chip ${batchDelay === val ? "active" : ""}`}
                  onClick={() => setBatchDelay(val)}
                >
                  {val}s
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Cloud Send Action */}
      <div className="action-row">
        <button
          type="button"
          className="btn-cloud-primary"
          onClick={() => onSendEmails(inputMode === "single" ? 0 : batchDelay)}
          disabled={isSending || count === 0 || !currentSender?.configured}
        >
          {isSending ? (
            <>
              <span className="cloud-spinner" />
              <span>
                {inputMode === "single" ? "Sending Single Email..." : `Dispatching (${count})...`}
              </span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>
                {inputMode === "single"
                  ? count === 1
                    ? `Send Email to ${singleName || singleEmail}`
                    : "Enter candidate email to send"
                  : `Dispatch Campaign to ${count} ${count === 1 ? "Recipient" : "Recipients"}`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
