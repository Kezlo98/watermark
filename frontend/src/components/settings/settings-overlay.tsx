import { useState } from "react";
import { useSettingsStore } from "@/store/settings";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { ClusterList } from "./cluster-list";
import { AppearanceForm } from "./appearance-form";
import { DataSystemForm } from "./data-system-form";
import { AnnotationSettingsPanel } from "@/components/annotations/annotation-settings-panel";
import { TemplateSettingsPanel } from "@/components/templates/template-settings-panel";
import { AlertsForm } from "./alerts-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const SETTINGS_TABS = [
  { id: "clusters", label: "🌐 Clusters" },
  { id: "appearance", label: "🎨 Appearance" },
  { id: "annotations", label: "🏷️ Annotations" },
  { id: "templates", label: "📋 Templates" },
  { id: "system", label: "💻 System" },
  { id: "alerts", label: "🔔 Alerts" },
];

export function SettingsOverlay() {
  const { isSettingsOpen, closeSettings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState("clusters");

  return (
    <Sheet open={isSettingsOpen} onOpenChange={(open) => !open && closeSettings()}>
      <SheetContent side="right" className="w-full max-w-4xl">
        {/* Header */}
        <SheetHeader>
          <SheetTitle>⚙️ Preferences</SheetTitle>
        </SheetHeader>

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
            {activeTab === "templates" && <TemplateSettingsPanel />}
            {activeTab === "system" && <DataSystemForm />}
            {activeTab === "alerts" && <AlertsForm />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
