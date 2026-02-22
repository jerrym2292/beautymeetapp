import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

export async function sendSMS(to: string, body: string) {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("SMS: Twilio credentials missing. Skipping SMS.");
    return null;
  }

  const client = twilio(accountSid, authToken);
  
  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    console.log(`SMS sent: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error("SMS: Failed to send SMS", error);
    return null;
  }
}
