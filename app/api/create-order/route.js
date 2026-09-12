import { NextResponse } from "next/server";
import { razorpayInstance } from "@/lib/razorpay";

// Strict server-side enforced price in paise (1900 paise = ₹19)
const WORKSHOP_PRICE_PAISE = 1900;
const CURRENCY = "INR";

export async function POST(request) {
  try {
    // Check if server-side Razorpay credentials are set
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway is not configured on the server. Please check environment variables.",
        },
        { status: 500 }
      );
    }

    // Generate safe unique receipt ID (max 40 characters for Razorpay)
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Validate minimum Razorpay amount
    if (WORKSHOP_PRICE_PAISE < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order amount. Minimum allowed is 100 paise.",
        },
        { status: 400 }
      );
    }

    // Optional user metadata for internal receipt note (sanitized)
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional; proceed if empty
    }

    const { name, email, phone } = body || {};

    const options = {
      amount: WORKSHOP_PRICE_PAISE,
      currency: CURRENCY,
      receipt: receiptId,
      notes: {
        workshop: "Bandhas & Nauli Kriya Workshop",
        registrant_name: name ? String(name).slice(0, 50) : "Registrant",
        registrant_email: email ? String(email).slice(0, 50) : "",
        registrant_phone: phone ? String(phone).slice(0, 20) : "",
      },
    };

    const order = await razorpayInstance.orders.create(options);

    if (!order || !order.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to initialize order with payment provider.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error?.message || error);

    // Handle authentication error specifically
    if (error?.statusCode === 401 || error?.error?.code === "BAD_REQUEST_ERROR") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway authorization failed. Please verify API keys.",
        },
        { status: 401 }
      );
    }

    // Return sanitized 500 without leaking stack traces or credentials
    return NextResponse.json(
      {
        success: false,
        error: "Unable to create payment order. Please try again.",
      },
      { status: 500 }
    );
  }
}
