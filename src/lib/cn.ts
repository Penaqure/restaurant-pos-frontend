import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// twMerge (not just clsx) matters here: plain concatenation doesn't
// guarantee a later same-property utility (e.g. a caller's "w-28"
// overriding a component's default "w-full") actually wins -- Tailwind's
// generated CSS order isn't the same as className argument order, so a
// component's own base classes could silently beat a caller's override.
// twMerge resolves same-property conflicts correctly regardless of order.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
