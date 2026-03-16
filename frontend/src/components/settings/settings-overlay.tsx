import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { ClusterList } from "./cluster-list";
import { AppearanceForm } from "./appearance-form";
import { DataSystemForm } from "./data-system-form";
import { AnnotationSettingsPanel } from "@/components/annotations/annotation-settings-panel";
import { AlertsForm } from "./alerts-form";

const SETTINGS_TABS = [
  { id: "clusters", label: "🌐 Clusters" },
  { id: "appearance", label: "🎨 Appearance" },
  { id: "annotations", label: "🏷️ Annotations" },
  { id: "system", label: "💻 System" },
  { id: "alerts", label: "🔔 Alerts" },
];

export function SettingsOverlay() {
  const { isSettingsOpen, closeSettings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState("clusters");

  /* Escape key to close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSettings();
    };
    if (isSettingsOpen) {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-display font-bold text-white">
            ⚙️ Preferences
          </h2>
          <button
            onClick={closeSettings}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body: left tabs + content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r border-white/5 p-3">
            <TabNavigation
              tabs={SETTINGS_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="vertical"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "clusters" && <ClusterList />}
            {activeTab === "appearance" && <AppearanceForm />}
            {activeTab === "annotations" && <AnnotationSettingsPanel />}
            {activeTab === "system" && <DataSystemForm />}
            {activeTab === "alerts" && <AlertsForm />}
          </div>
        </div>
      </div>
    </div>
  );
}

