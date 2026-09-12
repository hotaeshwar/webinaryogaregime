import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body || {};

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing payment verification parameters (payment_id, order_id, or signature).",
        },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("Payment verification failed: RAZORPAY_KEY_SECRET is not configured on server.");
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error: payment secret is missing.",
        },
        { status: 500 }
      );
    }

    // Generate expected HMAC SHA256 signature
    const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(dataToSign)
      .digest("hex");

    // Perform timing-safe comparison to prevent timing attacks
    const generatedBuffer = Buffer.from(generatedSignature, "utf8");
    const providedBuffer = Buffer.from(razorpay_signature, "utf8");

    let isMatch = false;
    if (generatedBuffer.length === providedBuffer.length) {
      isMatch = crypto.timingSafeEqual(generatedBuffer, providedBuffer);
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

    // Payment successfully verified
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
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
