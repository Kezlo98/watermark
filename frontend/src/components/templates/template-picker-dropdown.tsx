import { useState, useEffect } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { useTemplates } from "@/hooks/use-templates";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { findBestTemplate } from "@/lib/glob-match";
import type { TopicTemplate } from "@/types/templates";

interface TemplatePickerDropdownProps {
  topicName: string;
  onTemplateSelect: (template: TopicTemplate | null) => void;
}

export function TemplatePickerDropdown({
  topicName,
  onTemplateSelect,
}: TemplatePickerDropdownProps) {
  const { templateList, isLoading } = useTemplates();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TopicTemplate | null>(
    null,
  );

  // Debounced auto-match (suggest-only, not auto-apply)
  const debouncedTopicName = useDebouncedValue(topicName, 300);
  const suggestedTemplate = findBestTemplate(debouncedTopicName, templateList);

  useEffect(() => {
    // Clear selection if topic name changes significantly
    if (selectedTemplate && topicName !== selectedTemplate.pattern) {
      setSelectedTemplate(null);
    }
  }, [topicName, selectedTemplate]);

  const handleSelect = (template: TopicTemplate | null) => {
    setSelectedTemplate(template);
    onTemplateSelect(template);
    setIsOpen(false);
  };

  if (isLoading || templateList.length === 0) return null;

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-slate-300">
        Template (optional)
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white transition-colors hover:border-slate-600"
      >
        <div className="flex items-center gap-2">
          {suggestedTemplate && !selectedTemplate && (
            <Sparkles className="size-3.5 text-yellow-400" />
          )}
          <span className={!selectedTemplate ? "text-slate-400" : ""}>
            {selectedTemplate
              ? selectedTemplate.name
              : suggestedTemplate
                ? `Suggested: ${suggestedTemplate.name}`
                : "Select a template"}
          </span>
        </div>
        <ChevronDown
          className={`size-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
            {/* None option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full px-4 py-2 text-left text-sm text-slate-400 transition-colors hover:bg-slate-700/50"
            >
              No template
            </button>

            {/* Suggested template (if exists) */}
            {suggestedTemplate && (
              <button
                type="button"
                onClick={() => handleSelect(suggestedTemplate)}
                className="flex w-full items-center gap-2 border-t border-slate-700/50 bg-yellow-400/5 px-4 py-2 text-left text-sm transition-colors hover:bg-yellow-400/10"
              >
                <Sparkles className="size-3.5 text-yellow-400" />
                <div className="flex-1">
                  <div className="font-medium text-white">
                    {suggestedTemplate.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Matches: {suggestedTemplate.pattern}
                  </div>
                </div>
              </button>
            )}

            {/* All templates */}
            <div className="border-t border-slate-700/50">
              {templateList
                .filter((t) => t.id !== suggestedTemplate?.id)
                .map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelect(template)}
                    className="w-full px-4 py-2 text-left transition-colors hover:bg-slate-700/50"
                  >
                    <div className="font-medium text-white">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-slate-400">
                        {template.description}
                      </div>
                    )}
                    {template.pattern && (
                      <div className="mt-0.5 font-mono text-xs text-slate-500">
                        {template.pattern}
                      </div>
                    )}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
