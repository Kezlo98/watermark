import { useState, useEffect } from "react";

/**
 * Debounces a value by delayMs (default 300ms).
 * Returns the debounced value that updates after the delay.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
