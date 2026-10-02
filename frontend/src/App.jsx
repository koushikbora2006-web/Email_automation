import { useEffect, useState, useCallback } from "react";
import Header from "./components/Header";
import ComposeForm from "./components/ComposeForm";
import LivePreview from "./components/LivePreview";
import ResultsTable from "./components/ResultsTable";
import Toast from "./components/Toast";
import "./App.css";

const INITIAL_TEMPLATE = {
  round: "Round 2",
  name: "Alex Doe",
  date: "October 10, 2026",
  time: "10:00 AM - 1:00 PM IST",
  venue: "KIET Smart City Lab (Room 204) / Google Meet",
  cta_url: "https://kiet.edu",
  subject: "Shortlisted for {{round}} - KIET Smart City Lab",
};

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [selectedSenderId, setSelectedSenderId] = useState(1);
  const [templateData, setTemplateData] = useState(INITIAL_TEMPLATE);
  const [recipientsList, setRecipientsList] = useState([]);
  const [renderedHtml, setRenderedHtml] = useState("");
  const [plainText, setPlainText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message, title = "") => {
    setToast({ type, message, title });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  // Fetch backend health and sender configs
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealthData(data);
      if (data.senders && data.senders.length > 0) {
        // If sender 1 is not configured but sender 2 is, select sender 2 automatically
        const s1 = data.senders.find((s) => s.id === 1);
        const s2 = data.senders.find((s) => s.id === 2);
        if (s2?.configured && !s1?.configured) {
          setSelectedSenderId(2);
        }
      }
    } catch {
      setHealthData({
        configured: false,
        offline: true,
        senders: [
          { id: 1, name: "Sender 1", email: "", configured: false },
          { id: 2, name: "Sender 2", email: "", configured: false },
        ],
      });
      showToast(
        "error",
        "Cannot reach backend server. Make sure Python Flask is running on port 5000.",
        "Backend Offline"
      );
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Active sender object
  const activeSender =
    healthData?.senders?.find((s) => s.id === selectedSenderId) || {
      id: selectedSenderId,
      name: `Sender ${selectedSenderId}`,
      email: "",
      configured: false,
    };

  // Generate live template preview
  const fetchPreview = useCallback(async () => {
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...templateData,
          sender_name: activeSender.name,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setRenderedHtml(data.html);
        setPlainText(data.plainText);
      } else {
        showToast("error", data.error || "Preview compilation error", "Template Error");
      }
    } catch {
      // Offline fallback
    }
  }, [templateData, activeSender.name]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  // Handler: Send Test Email to Self
  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: selectedSenderId,
          ...templateData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.message, "Test Email Delivered");
      } else {
        showToast(
          "error",
          data.error || "Could not send test email. Check .env credentials.",
          "Test Dispatch Failed"
        );
      }
    } catch {
      showToast("error", "Backend communication failed.", "Connection Error");
    }
    setIsSendingTest(false);
  };

  // Handler: Send Campaign
  const handleSendEmails = async (batchDelay = 1.0) => {
    if (recipientsList.length === 0) {
      showToast("error", "Please add at least one valid recipient email address.", "No Recipients");
      return;
    }

    setIsSending(true);
    setResultsData(null);

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: selectedSenderId,
          recipients: recipientsList,
          templateData,
          subject: templateData.subject,
          batchDelay,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned status ${res.status}`);
      }

      if (res.ok) {
        setResultsData(data);
        if (data.failed === 0) {
          showToast(
            "success",
            `Successfully dispatched all ${data.sent} email(s) via Sender ${selectedSenderId}!`,
            "Email Dispatched"
          );
        } else {
          showToast(
            "error",
            `Dispatched ${data.sent} email(s), but ${data.failed} encountered errors. Check summary table below.`,
            "Delivery Report"
          );
        }
      } else {
        showToast("error", data.error || `Error ${res.status}: Failed to dispatch emails.`, "Dispatch Error");
      }
    } catch (err) {
      showToast("error", err.message || "Could not reach backend server. Please verify Flask is running on port 5000.", "Connection Notice");
    }

    setIsSending(false);
  };

  // Handler: Retry Failed emails
  const handleRetryFailed = async () => {
    if (!resultsData) return;
    const failedItems = resultsData.results
      .filter((r) => !r.ok)
      .map((r) => ({
        email: r.to,
        name: r.name,
        round: r.round,
        date: templateData.date,
        time: templateData.time,
        venue: templateData.venue,
        cta_url: templateData.cta_url,
      }));

    if (failedItems.length === 0) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: selectedSenderId,
          recipients: failedItems,
          templateData,
          subject: templateData.subject,
          batchDelay: 1.0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Merge results
        const merged = resultsData.results.map((existing) => {
          const retried = data.results.find((r) => r.to === existing.to);
          return retried || existing;
        });
        const newResultsData = {
          ...resultsData,
          sent: merged.filter((r) => r.ok).length,
          failed: merged.filter((r) => !r.ok).length,
          results: merged,
        };
        setResultsData(newResultsData);
        showToast("success", `Retried ${data.sent} failed email(s) successfully!`, "Retry Complete");
      }
    } catch {
      showToast("error", "Failed to connect to backend during retry.", "Retry Error");
    }
    setIsSending(false);
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header Bar */}
      <Header
        healthData={healthData}
        selectedSenderId={selectedSenderId}
        onSelectSender={setSelectedSenderId}
        onSendTestEmail={handleSendTestEmail}
        isSendingTest={isSendingTest}
        onRefreshHealth={fetchHealth}
      />

      {/* Main Workspace: 2-Column Split */}
      <main className="app-workspace">
        <div className="workspace-column left-col">
          <ComposeForm
            templateData={templateData}
            onChangeTemplateData={setTemplateData}
            recipientsList={recipientsList}
            onChangeRecipientsList={setRecipientsList}
            onSendEmails={handleSendEmails}
            isSending={isSending}
            currentSender={activeSender}
          />
        </div>

        <div className="workspace-column right-col">
          <LivePreview
            templateData={templateData}
            renderedHtml={renderedHtml}
            plainText={plainText}
            senderName={activeSender?.name}
          />
        </div>
      </main>

      {/* Execution Results Summary */}
      {resultsData && (
        <ResultsTable
          resultsData={resultsData}
          onRetryFailed={handleRetryFailed}
          isRetrying={isSending}
        />
      )}
    </div>
  );
}
