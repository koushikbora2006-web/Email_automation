import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Users,
  Send,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function ResultsTable({
  resultsData,
  onRetryFailed,
  isRetrying,
}) {
  const [filter, setFilter] = useState("all"); // "all" | "ok" | "failed"

  if (!resultsData || !resultsData.results || resultsData.results.length === 0) {
    return null;
  }

  const { total, sent, failed, results, senderUsed } = resultsData;

  const filteredResults = results.filter((item) => {
    if (filter === "ok") return item.ok;
    if (filter === "failed") return !item.ok;
    return true;
  });

  const successPercent = total > 0 ? Math.round((sent / total) * 100) : 0;

  return (
    <section className="cloud-card audit-summary-card">
      {/* Header Row */}
      <div className="card-header-row">
        <div className="card-title-group">
          <ShieldCheck size={18} className="text-primary" />
          <div>
            <h2 className="card-heading">Dispatch Execution Summary</h2>
            {senderUsed && (
              <p className="cloud-subtext" style={{ marginTop: "2px" }}>
                Dispatched via <strong>Sender {senderUsed.id}</strong> ({senderUsed.name} • {senderUsed.email})
              </p>
            )}
          </div>
        </div>

        {failed > 0 && onRetryFailed && (
          <button
            type="button"
            className="btn-cloud-secondary"
            onClick={onRetryFailed}
            disabled={isRetrying}
          >
            <RefreshCw size={13} className={isRetrying ? "spin-icon" : ""} />
            <span>Retry Failed ({failed})</span>
          </button>
        )}
      </div>

      {/* 4-Metric Grid */}
      <div className="audit-metrics-grid">
        <div className="audit-metric-box">
          <span className="metric-box-label">
            <Users size={13} /> Total Recipients
          </span>
          <span className="metric-box-value">{total}</span>
        </div>

        <div className="audit-metric-box good">
          <span className="metric-box-label text-good">
            <CheckCircle2 size={13} /> Delivered Successfully
          </span>
          <span className="metric-box-value text-good">{sent}</span>
        </div>

        <div className="audit-metric-box bad">
          <span className="metric-box-label text-bad">
            <AlertTriangle size={13} /> Failed
          </span>
          <span className="metric-box-value text-bad">{failed}</span>
        </div>

        <div className="audit-metric-box rate">
          <span className="metric-box-label text-primary">
            <Send size={13} /> Delivery Rate
          </span>
          <span className="metric-box-value text-primary">{successPercent}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="audit-progress-container">
        <div className="audit-progress-bar">
          <div
            className="audit-progress-fill"
            style={{ width: `${successPercent}%` }}
          />
        </div>
        <span className="progress-percent-label">{sent} of {total} delivered</span>
      </div>

      {/* Filter Tabs */}
      <div className="audit-filter-row">
        <div className="mode-segmented-bar" style={{ maxWidth: "340px" }}>
          <button
            type="button"
            className={`mode-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({total})
          </button>
          <button
            type="button"
            className={`mode-btn ${filter === "ok" ? "active" : ""}`}
            onClick={() => setFilter("ok")}
          >
            Delivered ({sent})
          </button>
          <button
            type="button"
            className={`mode-btn ${filter === "failed" ? "active" : ""}`}
            onClick={() => setFilter("failed")}
          >
            Failed ({failed})
          </button>
        </div>
      </div>

      {/* Modern Table */}
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th style={{ width: "130px" }}>Status</th>
              <th>Candidate Email</th>
              <th>Candidate Name</th>
              <th>Round</th>
              <th>Delivery Details</th>
              <th style={{ width: "160px" }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((row, idx) => (
              <tr key={`${row.to}-${idx}`} className={row.ok ? "tr-success" : "tr-failed"}>
                <td>
                  {row.ok ? (
                    <span className="audit-badge ok">
                      <CheckCircle2 size={13} />
                      <span>Delivered</span>
                    </span>
                  ) : (
                    <span className="audit-badge bad">
                      <XCircle size={13} />
                      <span>Failed</span>
                    </span>
                  )}
                </td>
                <td className="font-mono-email">{row.to}</td>
                <td className="font-name-cell">{row.name || "—"}</td>
                <td>
                  <span className="round-badge-pill">{row.round || "Round 2"}</span>
                </td>
                <td className="details-log-cell">
                  {row.ok ? (
                    <span className="log-ok-text">Dispatched via Google SMTP (SSL 465)</span>
                  ) : (
                    <span className="log-bad-text">{row.error || "Delivery error"}</span>
                  )}
                </td>
                <td className="timestamp-cell">
                  <Clock size={12} />
                  <span>{row.timestamp || "Just now"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
