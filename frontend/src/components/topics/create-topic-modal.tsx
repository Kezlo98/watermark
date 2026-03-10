import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { CreateTopic } from "@/lib/wails-client";

/* ---------- Kafka topic name validation ---------- */

const TOPIC_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;
const MAX_TOPIC_NAME_LENGTH = 249;

function validateTopicName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Topic name is required";
  if (trimmed === "." || trimmed === "..") return "Topic name cannot be '.' or '..'";
  if (trimmed.length > MAX_TOPIC_NAME_LENGTH)
    return `Topic name cannot exceed ${MAX_TOPIC_NAME_LENGTH} characters`;
  if (!TOPIC_NAME_REGEX.test(trimmed))
    return "Only letters, numbers, dots, hyphens, and underscores allowed";
  return null;
}

/* ---------- Default form values ---------- */

const DEFAULT_FORM = {
  name: "",
  partitions: 6,
  replicationFactor: 3,
  retentionMs: 604800000,
  cleanupPolicy: "delete",
};

/* ---------- Component ---------- */

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTopicModal({ isOpen, onClose }: CreateTopicModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setForm({ ...DEFAULT_FORM });
    setError(null);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: () =>
      CreateTopic(form.name.trim(), form.partitions, form.replicationFactor, {
        "retention.ms": String(form.retentionMs),
        "cleanup.policy": form.cleanupPolicy,
      }),
    onSuccess: () => {
      toast.success(`Topic "${form.name.trim()}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      handleClose();
    },
    onError: (err: Error) => {
      toast.error(`Failed to create topic: ${err.message}`);
    },
  });

  const handleSubmit = () => {
    const validationError = validateTopicName(form.name);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    mutation.mutate();
  };

  if (!isOpen) return null;

  const retentionLabel = `(${Math.round(form.retentionMs / 86400000)}d)`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={mutation.isPending ? undefined : handleClose}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="glass-panel w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">
            Create New Topic
          </h2>
          <button onClick={handleClose} disabled={mutation.isPending} className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Topic Name */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Topic Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (error) setError(null);
              }}
              placeholder="my.new.topic"
              className={`w-full h-9 px-3 bg-white/5 border rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                error ? "border-semantic-red/50" : "border-white/10"
              }`}
            />
            {error && (
              <p className="text-xs text-semantic-red mt-1">{error}</p>
            )}
          </div>

          {/* Partitions + Replication Factor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Partitions
              </label>
              <select
                value={form.partitions}
                onChange={(e) => setForm({ ...form, partitions: Number(e.target.value) })}
                className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {[1, 3, 6, 12, 24, 48].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Replication Factor
              </label>
              <select
                value={form.replicationFactor}
                onChange={(e) => setForm({ ...form, replicationFactor: Number(e.target.value) })}
                className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Retention */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Retention (ms) {retentionLabel}
            </label>
            <input
              type="number"
              value={form.retentionMs}
              onChange={(e) => setForm({ ...form, retentionMs: Number(e.target.value) })}
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Cleanup Policy */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Cleanup Policy
            </label>
            <select
              value={form.cleanupPolicy}
              onChange={(e) => setForm({ ...form, cleanupPolicy: e.target.value })}
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="delete">delete</option>
              <option value="compact">compact</option>
              <option value="compact,delete">compact,delete</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
          <button
            onClick={handleClose}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
            {mutation.isPending ? "Creating..." : "Create Topic"}
          </button>
        </div>
      </div>
    </div>
  );
}
