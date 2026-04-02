// Usage: node --env-file=.env test-whatsapp.js "+919876543210"
const targetPhone = process.argv[2];

if (!targetPhone) {
  console.log("❌ Please provide a phone number to test! Example: node --env-file=.env test-whatsapp.js +919876543210");
  process.exit(1);
}

const fetch = globalThis.fetch;

async function testTwilio(to) {
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  };

  const text = '✅ Twilio WhatsApp API is actively working in your CareQueue app!';
  
  // Format exactly how your integration formats it
  const twilioTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to.startsWith("+") ? to : `+${to}`}`;

  const payload = new URLSearchParams({
    To: twilioTo,
    From: config.fromNumber,
    Body: text,
  });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  
  console.log(`\n📡 Sending test message to: ${twilioTo}...`);
  console.log(`Using Twilio Sandbox Number: ${config.fromNumber}\n`);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`
    },
    body: payload.toString()
  });

  // Parse the JSON directly instead of raw text
  let body;
  try {
     body = await response.json();
  } catch(e) {
     body = await response.text();
  }
  
  if (response.ok) {
     console.log("🎉 SUCCESS! Twilio accepted the message.");
     console.log("Message SID:", body.sid);
     console.log("\nIf you don't instantly see it on your phone:");
     console.log("1. Double check you texted the Sandbox join code to +14155238886 from that exact number.");
     console.log("2. Make sure your WhatsApp isn't blocking unknown numbers.");
  } else {
     console.log("❌ TWILIO ERROR (" + response.status + "):");
     console.log(body.message || body);
     if (body.code === 63015 || body.code === 47036) {
        console.log("\n💡 THIS ERROR MEANS: This number hasn't joined the Sandbox yet, or the 72-hour session expired.");
        console.log("Send the join code to +1 415 523 8886 on WhatsApp and try again.");
     }
  }
}

testTwilio(targetPhone).catch(console.error);
