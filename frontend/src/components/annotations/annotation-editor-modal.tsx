import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAnnotations } from "@/hooks/use-annotations";
import { ServiceNameInput } from "./service-name-input";
import { annotations } from "../../../wailsjs/go/models";

interface AnnotationEditorModalProps {
  topicName: string;
  open: boolean;
  onClose: () => void;
}

export function AnnotationEditorModal({
  topicName,
  open,
  onClose,
}: AnnotationEditorModalProps) {
  const {
    annotations: allAnnotations,
    serviceNames,
    setAnnotation,
    deleteAnnotation,
  } = useAnnotations();

  const existing = allAnnotations[topicName];

  const [producers, setProducers] = useState<string[]>([]);
  const [consumers, setConsumers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Sync form state when modal opens or annotation data changes
  useEffect(() => {
    if (open) {
      setProducers(existing?.producers ?? []);
      setConsumers(existing?.consumers ?? []);
      setNotes(existing?.notes ?? "");
    }
  }, [open, existing?.producers, existing?.consumers, existing?.notes]);

  if (!open) return null;

  const handleSave = () => {
    const ann = new annotations.TopicAnnotation({
      producers,
      consumers,
      notes: notes.trim(),
      updatedAt: "",
    });
    setAnnotation.mutate(
      { topicName, annotation: ann },
      { onSuccess: onClose }
    );
  };

  const handleDelete = () => {
    deleteAnnotation.mutate(topicName, { onSuccess: onClose });
  };

  const hasAnnotation = existing && (
    (existing.producers?.length > 0) ||
    (existing.consumers?.length > 0) ||
    existing.notes
  );

  const isSaving = setAnnotation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-display font-bold text-white">
            Edit Annotations:{" "}
            <span className="text-primary font-mono">{topicName}</span>
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

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional description..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 font-mono placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <div>
            {hasAnnotation && (
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs text-semantic-red hover:text-semantic-red/80 transition-colors"
                disabled={isSaving}
              >
                Remove Annotations
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
