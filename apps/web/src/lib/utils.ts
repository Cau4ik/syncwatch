import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = (minutes % 60).toString().padStart(hours ? 2 : 1, "0");

  if (hours) {
    return `${hours}:${remainingMinutes}:${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

