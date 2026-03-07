import { useState } from "react";
import { X } from "lucide-react";
import { useAnnotations } from "@/hooks/use-annotations";
import { ServiceNameInput } from "./service-name-input";
import { useAnnotationUIStore } from "@/store/annotations";
import { annotations } from "../../../wailsjs/go/models";

interface BatchTagModalProps {
  topicNames: string[];
  open: boolean;
  onClose: () => void;
}

export function BatchTagModal({ topicNames, open, onClose }: BatchTagModalProps) {
  const { serviceNames, batchSetAnnotation } = useAnnotations();
  const clearSelectedTopics = useAnnotationUIStore((s) => s.clearSelectedTopics);

  const [producers, setProducers] = useState<string[]>([]);
  const [consumers, setConsumers] = useState<string[]>([]);
  const [mode, setMode] = useState<"merge" | "replace">("merge");

  if (!open) return null;

  const handleApply = () => {
    const ann = new annotations.TopicAnnotation({
      producers,
      consumers,
      notes: "",
      updatedAt: "",
    });
    batchSetAnnotation.mutate(
      { topicNames, annotation: ann },
      {
        onSuccess: () => {
          clearSelectedTopics();
          setProducers([]);
          setConsumers([]);
          onClose();
        },
      }
    );
  };

  const isSaving = batchSetAnnotation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-display font-bold text-white">
            Tag{" "}
            <span className="text-primary">{topicNames.length}</span>{" "}
            Topic{topicNames.length > 1 ? "s" : ""}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Selected topics preview */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Selected
            </span>
            <p className="text-xs text-slate-500 font-mono truncate">
              {topicNames.slice(0, 5).join(", ")}
              {topicNames.length > 5 && ` +${topicNames.length - 5} more`}
            </p>
          </div>

          {/* Mode selector */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="batch-mode"
                checked={mode === "merge"}
                onChange={() => setMode("merge")}
                className="text-primary focus:ring-primary/50"
              />
              Merge (keep existing)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="batch-mode"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
                className="text-primary focus:ring-primary/50"
              />
              Replace (overwrite)
            </label>
          </div>

          {/* Producers */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Producers
            </label>
            <ServiceNameInput
              value={producers}
              onChange={setProducers}
              suggestions={serviceNames}
              placeholder="Type to add producer..."
              variant="producer"
            />
          </div>

          {/* Consumers */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Consumers
            </label>
            <ServiceNameInput
              value={consumers}
              onChange={setConsumers}
              suggestions={serviceNames}
              placeholder="Type to add consumer..."
              variant="consumer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isSaving || (producers.length === 0 && consumers.length === 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
