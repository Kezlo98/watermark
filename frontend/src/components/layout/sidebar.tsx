import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Layers,
  Users,
  FileCode2,
} from "lucide-react";
import logoImg from "@/assets/images/logo-universal.png";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: typeof BarChart3;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: BarChart3, path: "/" },
  { id: "topics", label: "Topics", icon: Layers, path: "/topics" },
  { id: "consumers", label: "Consumers", icon: Users, path: "/consumers" },
  { id: "schemas", label: "Schemas", icon: FileCode2, path: "/schemas" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="glass-sidebar w-[264px] h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
        <div className="flex items-center justify-center shrink-0">
          <img src={logoImg} alt="Watermark" className="size-10 object-contain rounded-lg" />
        </div>
        <div>
          <h1 className="text-base font-display font-bold text-white tracking-tight">
            Watermark
          </h1>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Dev Infra
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <span className="px-3 mb-2 block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
          Menu
        </span>
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate({ to: item.path })}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                <item.icon className={cn("size-4", active && "text-primary")} />
                {item.label}
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Version footer */}
      <div className="px-6 py-4 border-t border-white/5">
        <span className="text-[10px] font-mono text-slate-600">v0.1.0</span>
      </div>
    </aside>
  );
}
