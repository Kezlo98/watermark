import type { ReactNode } from "react";

/** Render inline markdown: **bold** and `code` */
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="text-primary/90 bg-white/5 px-1 rounded text-[10px] font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

/**
 * Renders a limited markdown subset used in Keep a Changelog entries.
 * Handles: ### headers, - bullet items, **bold**, `code`
 */
export function renderChangelogMarkdown(md: string): ReactNode {
  const lines = md.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      nodes.push(<ul key={`ul-${nodes.length}`} className="space-y-0.5 mb-2">{listItems}</ul>);
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <h4 key={i} className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mt-2 mb-1">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(
        <li key={i} className="flex gap-1.5 text-[11px] text-slate-300">
          <span className="text-slate-500 mt-0.5 shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </li>
      );
    } else if (line.trim() !== "") {
      flushList();
      nodes.push(<p key={i} className="text-[11px] text-slate-300">{renderInline(line)}</p>);
    }
  });

  flushList();
  return <>{nodes}</>;
}
