const isDev = process.env.NODE_ENV !== "production";

export async function sendSms(to: string, text: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || "CAREQ";

  if (isDev || !authKey) {
    console.log(`\n💬 [MSG91 SMS Mock] To: ${to}`);
    console.log(`   Message: ${text}`);
    console.log(`   ─────────────────────────\n`);
    return { success: true, mocked: true };
  }

  const payload = {
    sender: senderId,
    route: "4",
    country: "91",
    sms: [{ message: text, to: [to] }],
  };

  const response = await fetch("https://api.msg91.com/api/v2/sendsms", {
    method: "POST",
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`MSG91 API error: ${await response.text()}`);
  }
  return response.json();
}
