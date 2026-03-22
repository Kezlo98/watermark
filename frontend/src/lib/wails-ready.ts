/**
 * Wails runtime readiness utilities.
 *
 * In dev mode, the Vite dev server may load the frontend before the Wails
 * runtime has injected `window.go`. Any call to the auto-generated bindings
 * (e.g. `window['go']['updater']`) will throw a TypeError if `window.go`
 * is still undefined.
 *
 * These helpers let call-sites wait until the runtime is ready.
 */

declare global {
  interface Window {
    go?: Record<string, unknown>;
  }
}

/** Returns true if the Wails Go bindings are available on `window`. */
export function isWailsReady(): boolean {
  return typeof window !== "undefined" && window.go != null;
}

/**
 * Returns a promise that resolves once `window.go` is populated.
 * Resolves immediately if already ready. Times out after `timeoutMs`
 * (default 10 s) and rejects.
 */
export function waitForWails(timeoutMs = 10_000): Promise<void> {
  if (isWailsReady()) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (isWailsReady()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error("Wails runtime did not become ready in time"));
      }
    }, 50);
  });
}
