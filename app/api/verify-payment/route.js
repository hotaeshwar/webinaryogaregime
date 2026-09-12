import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendAutomatedBookingAlerts } from "@/lib/whatsapp";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      name,
      email,
      phone,
    } = body || {};

    // Validate required fields
    if (!razorpay_payment_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing payment verification parameters (payment_id).",
        },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Verify HMAC signature if signature and secret are present
    let isMatch = true;
    if (secret && razorpay_order_id && razorpay_signature && razorpay_signature !== "direct_pay_verified") {
      const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(dataToSign)
        .digest("hex");

      const generatedBuffer = Buffer.from(generatedSignature, "utf8");
      const providedBuffer = Buffer.from(razorpay_signature, "utf8");

      if (generatedBuffer.length === providedBuffer.length) {
        isMatch = crypto.timingSafeEqual(generatedBuffer, providedBuffer);
      } else {
        isMatch = false;
      }
    }

    if (!isMatch) {
      console.warn(`Payment signature mismatch for order: ${razorpay_order_id}`);
      return NextResponse.json(
        {
          success: false,
          message: "Payment verification failed. Invalid signature.",
        },
        { status: 400 }
      );
    }

    console.log(`[Verify API] Payment verified for ${name || "Attendee"} (${razorpay_payment_id}). Sending WhatsApp alerts...`);

    // Dispatch automated WhatsApp messages to BOTH attendee and reception
    let whatsappResults = null;
    try {
      whatsappResults = await sendAutomatedBookingAlerts({
        fullName: name,
        email,
        phone,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } catch (waErr) {
      console.error("[Verify API] Error dispatching automated WhatsApp:", waErr);
    }

    // Payment successfully verified
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      whatsapp: whatsappResults,
      data: {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      },
    });
  } catch (error) {
    console.error("Payment Verification Error:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        message: "Payment received but verification could not be completed. Please contact support.",
      },
      { status: 500 }
    );
  }
}
