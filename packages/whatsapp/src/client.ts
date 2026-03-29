import type {
  SlotOfferMessage,
  ReminderMessage,
  ConfirmationMessage,
  SlotTakenMessage,
  WhatsAppSendResponse,
} from "./types.js";

// ─── Config ─────────────────────────────────────────

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

function getConfig(): TwilioConfig {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || "",
  };
}

const isDev = process.env.NODE_ENV !== "production";

// ─── Core Send ──────────────────────────────────────

async function sendMessage(
  to: string,
  text: string
): Promise<any> {
  const config = getConfig();

  if (isDev) {
    console.log(`\n📱 [Twilio Mock] To: ${to}`);
    console.log(`   Message: ${text}`);
    console.log(`   ─────────────────────────\n`);
    return { sid: "mock_sid" };
  }

  // Twilio expects the "whatsapp:" prefix
  const twilioTo = to.startsWith("whatsapp:") 
    ? to 
    : `whatsapp:${to.startsWith("+") ? to : `+${to}`}`;

  const payload = new URLSearchParams({
    To: twilioTo,
    From: config.fromNumber,
    Body: text,
  });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`
    },
    body: payload.toString()
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Twilio API error (${response.status}): ${errorBody}`
    );
  }

  return response.json();
}

// ─── Public API ─────────────────────────────────────

export async function sendSlotOffer(msg: SlotOfferMessage) {
  const text =
    `Hi ${msg.patientName}, a slot just opened with ${msg.doctorName} ` +
    `at ${msg.slotTime} on ${msg.slotDate} at ${msg.clinicName}.\n\n` +
    `Reply YES to confirm. First reply gets the slot. 🏥`;

  return sendMessage(msg.to, text);
}

export async function sendReminder(msg: ReminderMessage) {
  let text: string;

  switch (msg.type) {
    case "T_24H":
      text =
        `Hi ${msg.patientName}, this is a reminder for your appointment ` +
        `with ${msg.doctorName} tomorrow at ${msg.slotTime} at ${msg.clinicName}.\n\n` +
        `Reply CONFIRM or CANCEL.`;
      break;
    case "T_2H":
      text =
        `Reminder: Your appointment with ${msg.doctorName} is in 2 hours ` +
        `at ${msg.slotTime}. ${msg.clinicName}, ${msg.clinicAddress}.`;
      break;
    case "T_30M":
      text =
        `Your appointment with ${msg.doctorName} is in 30 minutes! ` +
        `${msg.clinicName}, ${msg.clinicAddress}.` +
        (msg.mapsLink ? `\n\n📍 ${msg.mapsLink}` : "");
      break;
  }

  return sendMessage(msg.to, text);
}

export async function sendConfirmation(msg: ConfirmationMessage) {
  const text =
    `✅ Confirmed! Your appointment with ${msg.doctorName} ` +
    `at ${msg.slotTime} on ${msg.slotDate} at ${msg.clinicName} is booked.\n\n` +
    `📍 ${msg.clinicAddress}` +
    (msg.mapsLink ? `\n🗺️ ${msg.mapsLink}` : "");

  return sendMessage(msg.to, text);
}

export async function sendSlotTaken(msg: SlotTakenMessage) {
  const text =
    `Hi ${msg.patientName}, the slot we offered has been taken by another patient. ` +
    `Don't worry — you're still on the waitlist and we'll notify you when the next slot opens! 🙏`;

  return sendMessage(msg.to, text);
}
