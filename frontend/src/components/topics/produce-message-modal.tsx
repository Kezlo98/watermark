import { useState, useRef, useEffect } from "react";
import { X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ProduceMessage } from "@/lib/wails-client";

interface ProduceMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
}

type DeliveryStatus = "idle" | "sending" | "success" | "error";

export function ProduceMessageModal({ isOpen, onClose, topicName }: ProduceMessageModalProps) {
  const [form, setForm] = useState({
    partition: -1,
    key: "",
    value: "",
    headers: "",
  });

  const [status, setStatus] = useState<DeliveryStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleSend = async () => {
    setStatus("sending");
    setStatusMessage("");

    try {
      let headers: Record<string, string> = {};
      
      if (form.headers.trim()) {
        try {
          headers = JSON.parse(form.headers);
        } catch (e) {
          throw new Error("Headers must be valid JSON");
        }
      }

      await ProduceMessage(
        topicName,
        form.partition,
        form.key,
        form.value,
        headers
      );

      setStatus("success");
      setStatusMessage("Message sent successfully!");
      
      successTimerRef.current = setTimeout(() => {
        setStatus("idle");
        setStatusMessage("");
        setForm(prev => ({ ...prev, key: "", value: "" }));
      }, 3000);
    } catch (err) {
      setStatus("error");
      setStatusMessage(err instanceof Error ? err.message : String(err));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">
            Produce Message
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 font-mono mb-4">
          Topic: {topicName}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Partition (-1 for auto)
            </label>
            <input
              type="number"
              value={form.partition}
              onChange={(e) => setForm({ ...form, partition: Number(e.target.value) })}
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Key (optional)
            </label>
            <input
              type="text"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="message-key"
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Value
            </label>
            <textarea
              value={form.value}
              onChange={(e) => {
                setForm({ ...form, value: e.target.value });
                if (status === "error") { setStatus("idle"); setStatusMessage(""); }
              }}
              placeholder='{"key": "value"}'
              rows={6}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Headers (optional, JSON)
            </label>
            <input
              type="text"
              value={form.headers}
              onChange={(e) => setForm({ ...form, headers: e.target.value })}
              placeholder='{"Content-Type": "application/json"}'
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        {status !== "idle" && (
          <div
            className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${
              status === "sending" ? "bg-primary/10 text-primary" :
              status === "success" ? "bg-status-healthy/10 text-status-healthy" :
              "bg-semantic-red/10 text-semantic-red"
            }`}
          >
            {status === "sending" && <Loader2 className="size-3.5 animate-spin" />}
            {status === "success" && <CheckCircle2 className="size-3.5" />}
            {status === "error" && <XCircle className="size-3.5" />}
            <span>{status === "sending" ? "Sending message..." : statusMessage}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={status === "sending" || !form.value.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {status === "sending" && <Loader2 className="size-3.5 animate-spin" />}
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
