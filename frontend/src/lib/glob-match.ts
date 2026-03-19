/**
 * Simple glob pattern matcher for topic name auto-matching.
 * Supports: * (any characters), ? (single character)
 * Case-insensitive matching.
 */
export function globMatch(text: string, pattern: string): boolean {
  // Convert glob to regex
  const regexStr = pattern
    .split("")
    .map((char) => {
      switch (char) {
        case "*":
          return ".*";
        case "?":
          return ".";
        case ".":
          return "\\.";
        default:
          return char.replace(/[\\^$+{}[\]|()]/g, "\\$&");
      }
    })
    .join("");

  return new RegExp(`^${regexStr}$`, "i").test(text);
}

/**
 * Find the best matching template for a topic name.
 * Picks the most specific match (longest pattern).
 */
export function findBestTemplate<T extends { pattern?: string }>(
  topicName: string,
  templates: T[],
): T | null {
  if (!topicName) return null;

  return (
    templates
      .filter((t) => t.pattern && globMatch(topicName, t.pattern))
      .sort((a, b) => (b.pattern?.length ?? 0) - (a.pattern?.length ?? 0))[0] ??
    null
  );
}
