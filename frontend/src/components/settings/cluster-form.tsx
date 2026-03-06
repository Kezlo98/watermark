import { useState } from "react";

interface ClusterFormProps {
  clusterId: string;
  clusterName: string;
  onClose: () => void;
}

export function ClusterForm({ clusterId, clusterName, onClose }: ClusterFormProps) {
  // TODO: load initial values from cluster store by clusterId once persisted state is wired
  // e.g. const cluster = useClusterStore(state => state.clusters.find(c => c.id === clusterId))
  void clusterId;

  const [form, setForm] = useState({
    name: clusterName,
    bootstrapServers: "",
    labelColor: "green",
    securityProtocol: "NONE",
    saslMechanism: "PLAIN",
    username: "",
    password: "",
    readOnly: false,
    schemaRegistryUrl: "",
  });

  return (
    <div className="glass-panel p-5 space-y-4">
      <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider">
        Edit Cluster: {form.name}
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Label Color</label>
          <select
            value={form.labelColor}
            onChange={(e) => setForm({ ...form, labelColor: e.target.value })}
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
          onChange={(e) => setForm({ ...form, bootstrapServers: e.target.value })}
          className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Security Protocol</label>
          <select
            value={form.securityProtocol}
            onChange={(e) => setForm({ ...form, securityProtocol: e.target.value })}
            className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="NONE">None</option>
            <option value="SASL_PLAIN">SASL_PLAIN</option>
            <option value="SASL_SCRAM">SASL_SCRAM</option>
            <option value="SASL_SSL">SASL_SSL</option>
            <option value="SSL">SSL</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">SASL Mechanism</label>
          <select
            value={form.saslMechanism}
            onChange={(e) => setForm({ ...form, saslMechanism: e.target.value })}
            className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="PLAIN">PLAIN</option>
            <option value="SCRAM-SHA-256">SCRAM-SHA-256</option>
            <option value="SCRAM-SHA-512">SCRAM-SHA-512</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="read-only-toggle"
          checked={form.readOnly}
          onChange={(e) => setForm({ ...form, readOnly: e.target.checked })}
          className="size-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
        />
        <label htmlFor="read-only-toggle" className="text-sm text-slate-300">
          Enable Read-Only Mode (Disable write operations)
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
        <button className="px-4 py-2 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
          Test Connection
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors">
          Save
        </button>
      </div>
    </div>
  );
}
