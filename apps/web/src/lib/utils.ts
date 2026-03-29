import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function getStatusColor(status: string) {
  switch (status) {
    case "SCHEDULED": return "badge-status-scheduled";
    case "CONFIRMED": return "badge-status-confirmed";
    case "CANCELLED": return "badge-status-cancelled";
    case "COMPLETED": return "badge-status-completed";
    case "NO_SHOW": return "badge-status-no_show";
    default: return "badge";
  }
}

export function getUrgencyBadge(urgency: string) {
  switch (urgency) {
    case "URGENT": return "badge-urgent";
    case "FOLLOW_UP": return "badge-follow-up";
    case "ROUTINE": return "badge-routine";
    default: return "badge-routine";
  }
}
