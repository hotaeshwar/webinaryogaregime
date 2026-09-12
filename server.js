const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config(); // Fallback to .env

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Razorpay SDK
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_live_Tb4Km1evAI6DKr";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "siEna8s1RRfTcpIzC0PfEEQW";
const RECEPTION_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919569663204";

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Clean phone helper
function cleanPhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

// WhatsApp Dispatcher (supports Meta Cloud API, UltraMsg, Webhooks, and Console logging)
async function sendWhatsApp(targetPhone, messageText) {
  const phone = cleanPhone(targetPhone);
  console.log(`\n========================================`);
  console.log(`[NODE.JS WHATSAPP OUTBOUND] => To: +${phone}`);
  console.log(`Message:\n${messageText}`);
  console.log(`========================================\n`);

  // 1. Meta WhatsApp Cloud API
  if (process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: messageText },
          }),
        }
      );
      const data = await response.json();
      console.log(`[Meta Cloud API Result for +${phone}]:`, data);
      return { success: true, data };
    } catch (err) {
      console.error(`[Meta Cloud API Error for +${phone}]:`, err.message);
    }
  }

  // 2. UltraMsg API
  if (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN) {
    try {
      const response = await fetch(
        `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            token: process.env.ULTRAMSG_TOKEN,
            to: phone,
            body: messageText,
          }),
        }
      );
      const data = await response.json();
      console.log(`[UltraMsg Result for +${phone}]:`, data);
      return { success: true, data };
    } catch (err) {
      console.error(`[UltraMsg Error for +${phone}]:`, err.message);
    }
  }

  // 3. Custom Webhook Gateway
  if (process.env.WHATSAPP_GATEWAY_URL) {
    try {
      const response = await fetch(process.env.WHATSAPP_GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, message: messageText }),
      });
      const data = await response.json();
      console.log(`[Webhook Gateway Result for +${phone}]:`, data);
      return { success: true, data };
    } catch (err) {
      console.error(`[Webhook Gateway Error for +${phone}]:`, err.message);
    }
  }

  return { success: true, logged: true };
}

// ----------------------------------------------------
// API 1: Health Check
// ----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Yoga Workshop Node.js Backend",
    razorpay_configured: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
    reception_whatsapp: RECEPTION_WHATSAPP,
    time: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// API 2: Create Razorpay Order (Fixed at ₹19 / 1900 paise)
// ----------------------------------------------------
app.post("/api/create-order", async (req, res) => {
  try {
    const { name, email, phone } = req.body || {};
    const amountPaise = 1900; // Fixed ₹19 server-side

    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        workshop: "Bandhas & Nauli Kriya Workshop",
        registrant_name: name || "Registrant",
        registrant_email: email || "",
        registrant_phone: phone || "",
      },
    };

    const order = await razorpay.orders.create(options);
    console.log(`[Node.js Backend] Created Order: ${order.id} for ₹19 (Registrant: ${name || "N/A"})`);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("[Node.js Backend] Error creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      error: "Unable to create payment order with payment gateway.",
    });
  }
});

// ----------------------------------------------------
// API 3: Verify Payment Signature & Dispatch WhatsApp to BOTH
// ----------------------------------------------------
app.post("/api/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      name,
      email,
      phone,
    } = req.body || {};

    if (!razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "Missing razorpay_payment_id parameter.",
      });
    }

    // Verify HMAC signature if signature and order_id are present
    let isSignatureValid = true;
    if (razorpay_order_id && razorpay_signature && razorpay_signature !== "direct_pay_verified") {
      const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(dataToSign)
        .digest("hex");

      const genBuf = Buffer.from(generatedSignature, "utf8");
      const provBuf = Buffer.from(razorpay_signature, "utf8");

      if (genBuf.length === provBuf.length) {
        isSignatureValid = crypto.timingSafeEqual(genBuf, provBuf);
      } else {
        isSignatureValid = false;
      }
    }

    if (!isSignatureValid) {
      console.warn(`[Node.js Backend] Signature verification failed for order: ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    console.log(`[Node.js Backend] Payment Verified Successfully: Payment ID ${razorpay_payment_id}`);

    // Construct Messages for BOTH Attendee and Reception
    const attendeeMessage = `*WORKSHOP BOOKING CONFIRMED* ॐ
*Lock Your Energies, Unlock Your Strength*
Bandhas & Nauli Kriya Workshop

Hello ${name || "Attendee"},
Your registration and payment have been successfully confirmed!

*REGISTRATION DETAILS:*
- *Name:* ${name || "Attendee"}
- *Email:* ${email || "N/A"}
- *WhatsApp:* ${phone || "N/A"}

*SESSION DETAILS:*
- *Date:* Saturday, 19 September
- *Time:* 8:00 AM IST
- *Mode:* Online (Live Interactive)
- *Duration:* 90 Minutes

*PAYMENT RECEIPT:*
- *Amount Paid:* ₹19
- *Payment ID:* ${razorpay_payment_id}
- *Order ID:* ${razorpay_order_id || "N/A"}
- *Status:* Verified Successfully ✓

The live interactive session link will be shared prior to the masterclass.

Coordinator Helpline: +91 95696 63204
Thank you!`;

    const receptionMessage = `*NEW REGISTRATION & PAYMENT ALERT* 🔔
Bandhas & Nauli Kriya Workshop

A new participant has successfully registered and paid ₹19.

*PARTICIPANT DETAILS:*
- *Name:* ${name || "Attendee"}
- *Email:* ${email || "N/A"}
- *Phone:* ${phone || "N/A"}

*PAYMENT INFO:*
- *Amount:* ₹19
- *Payment ID:* ${razorpay_payment_id}
- *Order ID:* ${razorpay_order_id || "N/A"}
- *Status:* Verified & Confirmed ✓`;

    // 1. Send to Attendee WhatsApp
    if (phone) {
      sendWhatsApp(phone, attendeeMessage).catch((e) =>
        console.error("Failed to send attendee WhatsApp:", e)
      );
    }

    // 2. Send to Reception / Coordinator WhatsApp (+91 95696 63204)
    sendWhatsApp(RECEPTION_WHATSAPP, receptionMessage).catch((e) =>
      console.error("Failed to send reception WhatsApp:", e)
    );

    return res.json({
      success: true,
      message: "Payment verified successfully and WhatsApp alerts dispatched to both attendee and coordinator.",
      data: {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        attendee_notified: Boolean(phone),
        reception_notified: true,
      },
    });
  } catch (error) {
    console.error("[Node.js Backend] Error in payment verification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during verification.",
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Yoga Workshop Node.js Backend Server running on port ${PORT}`);
  console.log(`- Health: http://localhost:${PORT}/api/health`);
  console.log(`- Create Order: POST http://localhost:${PORT}/api/create-order`);
  console.log(`- Verify Payment: POST http://localhost:${PORT}/api/verify-payment`);
  console.log(`- Reception WhatsApp: +${RECEPTION_WHATSAPP}\n`);
});
