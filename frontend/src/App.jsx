import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState(null);
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ configured: false, offline: true }));
  }, []);

  async function handleSend() {
    setError("");
    setResults([]);
    setSending(true);
    try {
      const list = recipients.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: list, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else setResults(data.results);
    } catch {
      setError("Can't reach the backend. Is it running on port 5000?");
    }
    setSending(false);
  }

  const sentCount = results.filter((r) => r.ok).length;

  return (
    <main className="page">
      <h1>Send emails</h1>

      {status && status.offline && (
        <p className="note bad">Backend is not running. Start it with <code>python app.py</code>.</p>
      )}
      {status && !status.offline && !status.configured && (
        <p className="note bad">Fill in <code>backend/.env</code> with your email and app password, then restart the backend.</p>
      )}
      {status && status.configured && <p className="note">Sending from {status.sender}</p>}

      <label>
        To (one per line, or separated by commas)
        <textarea rows={4} value={recipients} onChange={(e) => setRecipients(e.target.value)} />
      </label>
      <label>
        Subject
        <input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label>
        Message
        <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>

      <button onClick={handleSend} disabled={sending}>
        {sending ? "Sending…" : "Send emails"}
      </button>

      {error && <p className="note bad">{error}</p>}

      {results.length > 0 && (
        <section className="results">
          <p>{sentCount} of {results.length} sent</p>
          <ul>
            {results.map((r) => (
              <li key={r.to} className={r.ok ? "ok" : "bad"}>
                {r.to} — {r.ok ? "sent" : r.error}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
