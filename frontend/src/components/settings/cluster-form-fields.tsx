import { cn } from "@/lib/utils";

interface ClusterFormFieldsProps {
  form: {
    name: string;
    bootstrapServers: string;
    labelColor: string;
    securityProtocol: string;
    saslMechanism: string;
    username: string;
    password: string;
    readOnly: boolean;
    schemaRegistryUrl: string;
    schemaRegistryPassword: string;
  };
  onChange: (updates: Partial<ClusterFormFieldsProps["form"]>) => void;
  clusterId: string;
  isNew: boolean;
}

export function ClusterFormFields({ form, onChange, clusterId, isNew }: ClusterFormFieldsProps) {
  const showSaslFields = form.securityProtocol !== "NONE" && form.securityProtocol !== "SSL";

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Dev Cluster"
            className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Label Color</label>
          <select
            value={form.labelColor}
            onChange={(e) => onChange({ labelColor: e.target.value })}
            className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="red">🔴 Red (Production)</option>
            <option value="orange">🟡 Yellow (Staging)</option>
            <option value="green">🟢 Green (Dev)</option>
            <option value="purple">🟣 Purple (Default)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Bootstrap Servers</label>
        <input
          type="text"
          value={form.bootstrapServers}
          onChange={(e) => onChange({ bootstrapServers: e.target.value })}
          placeholder="localhost:9092, broker2:9092"
          className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className={cn("grid gap-4", showSaslFields ? "grid-cols-2" : "grid-cols-1")}>
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Security Protocol</label>
          <select
            value={form.securityProtocol}
            onChange={(e) => onChange({ securityProtocol: e.target.value })}
            className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="NONE">None</option>
            <option value="SASL_PLAIN">SASL_PLAIN</option>
            <option value="SASL_SCRAM">SASL_SCRAM</option>
            <option value="SASL_SSL">SASL_SSL</option>
            <option value="SSL">SSL</option>
          </select>
        </div>
        {showSaslFields && (
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">SASL Mechanism</label>
            <select
              value={form.saslMechanism}
              onChange={(e) => onChange({ saslMechanism: e.target.value })}
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="PLAIN">PLAIN</option>
              <option value="SCRAM-SHA-256">SCRAM-SHA-256</option>
              <option value="SCRAM-SHA-512">SCRAM-SHA-512</option>
            </select>
          </div>
        )}
      </div>

      {showSaslFields && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => onChange({ username: e.target.value })}
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => onChange({ password: e.target.value })}
              placeholder={isNew ? "" : "••••••••  (leave blank to keep)"}
              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      {/* Schema Registry */}
      <div>
        <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
          Schema Registry URL <span className="text-slate-500">(optional)</span>
        </label>
        <input
          type="text"
          value={form.schemaRegistryUrl}
          onChange={(e) => onChange({ schemaRegistryUrl: e.target.value })}
          placeholder="http://localhost:8081"
          className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`read-only-toggle-${clusterId}`}
          checked={form.readOnly}
          onChange={(e) => onChange({ readOnly: e.target.checked })}
          className="size-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
        />
        <label htmlFor={`read-only-toggle-${clusterId}`} className="text-sm text-slate-300">
          Enable Read-Only Mode (Disable write operations)
        </label>
      </div>
    </>
  );
}
