import { useState } from "react";
import { X } from "lucide-react";

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTopicModal({ isOpen, onClose }: CreateTopicModalProps) {
  const [form, setForm] = useState({
    name: "",
    partitions: 6,
    replicationFactor: 3,
    retentionMs: 604800000,
    cleanupPolicy: "delete",
  });

  if (!isOpen) return null;

  const retentionLabel = `(${Math.round(form.retentionMs / 86400000)}d)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">
            Create New Topic
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Topic Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="my.new.topic"
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

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

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors">
            Create Topic
          </button>
        </div>
      </div>
    </div>
  );
}
