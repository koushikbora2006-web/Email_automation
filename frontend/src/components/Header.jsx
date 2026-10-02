import { Mail, Send, CheckCircle, RefreshCw, Radio } from "lucide-react";

export default function Header({
  healthData,
  selectedSenderId,
  onSelectSender,
  onSendTestEmail,
  isSendingTest,
}) {
  const senders = healthData?.senders || [];
  const currentSender = senders.find((s) => s.id === selectedSenderId) || {
    id: selectedSenderId,
    name: `Sender ${selectedSenderId}`,
    email: "Not configured",
    configured: false,
  };

  return (
    <header className="cloud-header">
      <div className="header-left">
        <div className="cloud-brand-container">
          <img
            src="/kiet-logo.png"
            alt="KIET Smart City Lab"
            className="brand-logo-img"
          />
          <div className="brand-text-block">
            <div className="brand-badge-row">
              <span className="cloud-pill">Cloud Dispatch Console</span>
              <span className="status-live-dot">
                <span className="pulse-circle" />
                Live
              </span>
            </div>
            <h1 className="cloud-title">Email Automation Platform</h1>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Cloud Sender Identity Switcher */}
        <div className="sender-switcher-panel">
          <div className="switcher-label">
            <Radio size={13} className="text-primary" />
            <span>Active Sender</span>
          </div>

          <div className="sender-pill-group">
            {senders.map((sender) => {
              const isSelected = selectedSenderId === sender.id;
              return (
                <button
                  key={sender.id}
                  type="button"
                  className={`sender-pill-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelectSender(sender.id)}
                >
                  <div className="sender-pill-top">
                    <span className="sender-tag">Sender {sender.id}</span>
                    {sender.configured && (
                      <span className="check-dot">
                        <CheckCircle size={12} />
                      </span>
                    )}
                  </div>
                  <span className="sender-pill-email">
                    {sender.rawEmail || sender.email || "Unconfigured (.env)"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action: Send Test Email */}
        <div className="test-action-wrap">
          <button
            type="button"
            className="btn-cloud-secondary test-btn"
            onClick={onSendTestEmail}
            disabled={isSendingTest || !currentSender.configured}
            title={
              currentSender.configured
                ? `Sends an immediate test email to ${currentSender.rawEmail || "yourself"}`
                : "Configure this sender in .env first"
            }
          >
            {isSendingTest ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Sending Test...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Send Test to Myself</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
