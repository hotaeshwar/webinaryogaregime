import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/send-whatsapp
 * Dispatches an automated WhatsApp message to an attendee without requiring manual button presses.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      to, // phone number with country code (e.g. "919876543210" or "+91 9876543210")
      message, // plain text message body
      provider = process.env.WHATSAPP_PROVIDER || "ultramsg",
      instanceId = process.env.WHATSAPP_INSTANCE_ID,
      apiToken = process.env.WHATSAPP_API_TOKEN,
      recipientName = "Attendee",
    } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Recipient phone number ('to') is required." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message text is required." },
        { status: 400 }
      );
    }

    // Clean phone number: digits only
    const cleanPhone = to.replace(/\D/g, "");

    // 1. If UltraMsg is configured (or default)
    if (instanceId && apiToken && (provider === "ultramsg" || provider === "default")) {
      const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: apiToken,
          to: cleanPhone,
          body: message,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.sent === "true" || data.sent === true || data.id)) {
        return NextResponse.json({
          success: true,
          provider: "ultramsg",
          id: data.id,
          message: `Automated WhatsApp pass sent successfully to +${cleanPhone}!`,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: data.error || data.message || "Failed to deliver via UltraMsg gateway.",
          details: data,
        });
      }
    }

    // 2. If Green API is configured
    if (instanceId && apiToken && provider === "greenapi") {
      const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: `${cleanPhone}@c.us`,
          message: message,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.idMessage) {
        return NextResponse.json({
          success: true,
          provider: "greenapi",
          id: data.idMessage,
          message: `Automated WhatsApp pass sent successfully to +${cleanPhone}!`,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: data.error || data.message || "Failed to deliver via Green API.",
          details: data,
        });
      }
    }

    // 3. If Meta WhatsApp Cloud API is configured
    if (apiToken && process.env.WHATSAPP_PHONE_NUMBER_ID && provider === "meta") {
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.messages) {
        return NextResponse.json({
          success: true,
          provider: "meta",
          message: `Automated WhatsApp pass sent successfully to +${cleanPhone}!`,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: data.error?.message || "Meta WhatsApp Cloud API error",
          details: data,
        });
      }
    }

    // 4. If no API key configured yet, return clear prompt for gateway configuration
    return NextResponse.json({
      success: false,
      isUnconfigured: true,
      cleanPhone: cleanPhone,
      messagePreview: message,
      error: "WhatsApp API Gateway is not configured yet. Please configure your WhatsApp API token in Admin Settings or .env file.",
    });
  } catch (error) {
    console.error("API send-whatsapp error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
