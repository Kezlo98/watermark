import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx conditional support */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format bytes to human-readable string (e.g. 1024 → "1.0 KB") */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Format large numbers with commas (e.g. 1234567 → "1,234,567") */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/** Format a number as compact (e.g. 1200 → "1.2K") */
export function formatCompact(num: number): string {
  if (num < 1000) return num.toString();
  const units = ["", "K", "M", "B"];
  const i = Math.floor(Math.log10(num) / 3);
  const val = num / Math.pow(1000, i);
  return `${val.toFixed(1).replace(/\.0$/, "")}${units[i]}`;
}
