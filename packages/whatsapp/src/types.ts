// ─── Outgoing Message Types ─────────────────────────

export interface WelcomeMessage {
  to: string; // patient phone (with country code)
  patientName: string;
  clinicName: string;
}

export interface SlotOfferMessage {
  to: string; // patient phone (with country code)
  patientName: string;
  doctorName: string;
  slotTime: string; // formatted time, e.g. "10:30 AM"
  slotDate: string; // formatted date, e.g. "23 Mar 2026"
  clinicName: string;
}

export interface ReminderMessage {
  to: string;
  patientName: string;
  doctorName: string;
  slotTime: string;
  slotDate: string;
  clinicName: string;
  clinicAddress: string;
  mapsLink?: string;
  type: "T_24H" | "T_2H" | "T_30M";
}

export interface ConfirmationMessage {
  to: string;
  patientName: string;
  doctorName: string;
  slotTime: string;
  slotDate: string;
  clinicName: string;
  clinicAddress: string;
  mapsLink?: string;
}

export interface SlotTakenMessage {
  to: string;
  patientName: string;
}

// ─── Incoming Webhook Types (Meta Cloud API) ────────

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Array<{
      profile: { name: string };
      wa_id: string;
    }>;
    messages?: WhatsAppIncomingMessage[];
    statuses?: WhatsAppStatus[];
  };
  field: string;
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
}

export interface WhatsAppStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
}

// ─── API Response ───────────────────────────────────

export interface WhatsAppSendResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}
