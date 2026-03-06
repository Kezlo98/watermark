import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { SaveCluster, TestConnection, GetCluster } from "@/lib/wails-client";
import { config } from "../../../wailsjs/go/models";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ClusterFormFields } from "./cluster-form-fields";

type TestStatus = "idle" | "testing" | "success" | "error";

interface ClusterFormProps {
  /** Cluster ID — pass "new" for creating a new cluster */
  clusterId: string;
  /** Pre-filled name (from list or empty for new) */
  clusterName: string;
  onClose: () => void;
}

export function ClusterForm({ clusterId, clusterName, onClose }: ClusterFormProps) {
  const queryClient = useQueryClient();
  const isNew = clusterId === "new";

  const [form, setForm] = useState({
    name: clusterName || "",
    bootstrapServers: "",
    labelColor: "green",
    securityProtocol: "NONE",
    saslMechanism: "PLAIN",
    username: "",
    password: "",
    readOnly: false,
    schemaRegistryUrl: "",
    schemaRegistryPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loaded, setLoaded] = useState(isNew);

  // Load existing cluster data for edit mode
  if (!isNew && !loaded) {
    GetCluster(clusterId)
      .then((cluster) => {
        setForm({
          name: cluster.name,
          bootstrapServers: cluster.bootstrapServers,
          labelColor: cluster.color || "green",
          securityProtocol: cluster.securityProtocol || "NONE",
          saslMechanism: cluster.saslMechanism || "PLAIN",
          username: cluster.username || "",
          password: "",
          readOnly: cluster.readOnly,
          schemaRegistryUrl: cluster.schemaRegistryUrl || "",
          schemaRegistryPassword: "",
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }

  const handleTestConnection = async () => {
    if (!form.bootstrapServers.trim()) {
      setTestStatus("error");
      setTestMessage("Bootstrap servers required");
      return;
    }
    setTestStatus("testing");
    setTestMessage("");
    try {
      await TestConnection(form.bootstrapServers);
      setTestStatus("success");
      setTestMessage("Connection successful!");
    } catch (err) {
      setTestStatus("error");
      setTestMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveError("Cluster name is required"); return; }
    if (!form.bootstrapServers.trim()) { setSaveError("Bootstrap servers required"); return; }

    setSaving(true);
    setSaveError("");
    try {
      const profile = new config.ClusterProfile({
        id: isNew ? "" : clusterId,
        name: form.name.trim(),
        bootstrapServers: form.bootstrapServers.trim(),
        color: form.labelColor,
        readOnly: form.readOnly,
        securityProtocol: form.securityProtocol,
        saslMechanism: form.securityProtocol !== "NONE" ? form.saslMechanism : "",
        username: form.securityProtocol !== "NONE" ? form.username : "",
        password: form.password || undefined,
        schemaRegistryUrl: form.schemaRegistryUrl || undefined,
        schemaRegistryPassword: form.schemaRegistryPassword || undefined,
      });
      await SaveCluster(profile);
      await queryClient.invalidateQueries({ queryKey: ["clusters"] });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (updates: Partial<typeof form>) => setForm({ ...form, ...updates });

  return (
    <div className="glass-panel p-5 space-y-4">
      <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider">
        {isNew ? "✨ New Cluster" : `Edit Cluster: ${form.name}`}
      </h4>

      <ClusterFormFields
        form={form}
        onChange={handleFormChange}
        clusterId={clusterId}
        isNew={isNew}
      />

      {/* Test Connection feedback */}
      {testStatus !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono",
            testStatus === "testing" && "bg-primary/10 text-primary",
            testStatus === "success" && "bg-status-healthy/10 text-status-healthy",
            testStatus === "error" && "bg-semantic-red/10 text-semantic-red",
          )}
        >
          {testStatus === "testing" && <Loader2 className="size-3.5 animate-spin" />}
          {testStatus === "success" && <CheckCircle2 className="size-3.5" />}
          {testStatus === "error" && <XCircle className="size-3.5" />}
          <span>{testStatus === "testing" ? "Testing connection..." : testMessage}</span>
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono bg-semantic-red/10 text-semantic-red">
          <XCircle className="size-3.5" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <button
          onClick={handleTestConnection}
          disabled={testStatus === "testing"}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {testStatus === "testing" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Zap className="size-3.5" />
          )}
          Test Connection
        </button>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
