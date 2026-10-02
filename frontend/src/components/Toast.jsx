import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === "error";
  const isSuccess = toast.type === "success";

  return (
    <div className={`toast-banner ${toast.type}`}>
      <div className="toast-icon">
        {isSuccess && <CheckCircle2 size={20} className="text-good" />}
        {isError && <AlertCircle size={20} className="text-bad" />}
        {!isSuccess && !isError && <Info size={20} className="text-accent" />}
      </div>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
