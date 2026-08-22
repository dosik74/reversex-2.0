import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 🔹 функция cn для объединения классов
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
