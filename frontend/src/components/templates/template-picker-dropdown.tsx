import { useState, useEffect } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/hooks/use-templates";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { findBestTemplate, globMatch } from "@/lib/glob-match";
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
    // Clear selection if topic name no longer matches the template's glob pattern
    if (
      selectedTemplate &&
      selectedTemplate.pattern &&
      !globMatch(topicName, selectedTemplate.pattern)
    ) {
      setSelectedTemplate(null);
      onTemplateSelect(null);
    }
  }, [topicName, selectedTemplate, onTemplateSelect]);

  const handleSelect = (template: TopicTemplate | null) => {
    setSelectedTemplate(template);
    onTemplateSelect(template);
    setIsOpen(false);
  };

  if (isLoading || templateList.length === 0) return null;

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-foreground">
        Template (optional)
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-border min-w-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          {suggestedTemplate && !selectedTemplate && (
            <Sparkles className="size-3.5 shrink-0 text-yellow-400" />
          )}
          <span className={cn("truncate", !selectedTemplate ? "text-muted-foreground" : "")}>
            {selectedTemplate
              ? selectedTemplate.name
              : suggestedTemplate
                ? `Suggested: ${suggestedTemplate.name}`
                : "Select a template"}
          </span>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
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
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
            {/* None option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full px-4 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary"
            >
              No template
            </button>

            {/* Suggested template (if exists) */}
            {suggestedTemplate && (
              <button
                type="button"
                onClick={() => handleSelect(suggestedTemplate)}
                className="flex w-full items-center gap-2 border-t border-border/50 bg-yellow-400/5 px-4 py-2 text-left text-sm transition-colors hover:bg-yellow-400/10 min-w-0"
              >
                <Sparkles className="size-3.5 shrink-0 text-yellow-400" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {suggestedTemplate.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    Matches: {suggestedTemplate.pattern}
                  </div>
                </div>
              </button>
            )}

            {/* All templates */}
            <div className="border-t border-border/50">
              {templateList
                .filter((t) => t.id !== suggestedTemplate?.id)
                .map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelect(template)}
                    className="w-full px-4 py-2 text-left transition-colors hover:bg-secondary min-w-0"
                  >
                    <div className="font-medium text-foreground truncate">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </div>
                    )}
                    {template.pattern && (
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground truncate">
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
