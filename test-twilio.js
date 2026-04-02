// Using native fetch in Node 18+

async function testTwilio() {
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  };

  const to = 'whatsapp:+11234567890'; // Dummy number
  const text = 'Hello from testing';

  const payload = new URLSearchParams({
    To: to,
    From: config.fromNumber,
    Body: text,
  });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  
  console.log("Config:", { sid: config.accountSid ? "OK" : "MISSING", token: config.authToken ? "OK" : "MISSING", from: config.fromNumber });
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`
    },
    body: payload.toString()
  });

  const body = await response.text();
  console.log("Twilio Status:", response.status);
  console.log("Twilio Body:", body);
}

testTwilio().catch(console.error);
