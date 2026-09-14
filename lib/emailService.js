import emailjs from "@emailjs/browser";

// EmailJS Configuration from User Account
export const EMAILJS_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "U0kdUjLqUljc2lEIN",
  privateKey: process.env.EMAILJS_PRIVATE_KEY || "6cijotrYeBbQcKmYr98_x",
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_default",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_default",
};

// Initialize EmailJS with Public Key
if (typeof window !== "undefined" && EMAILJS_CONFIG.publicKey) {
  try {
    emailjs.init({
      publicKey: EMAILJS_CONFIG.publicKey,
    });
  } catch (e) {
    console.warn("EmailJS init warning:", e);
  }
}

/**
 * Sends a structured confirmation email to the attendee and receiver
 * immediately upon successful transaction.
 * 
 * @param {Object} registrationData - { fullName, email, countryCode, phone/whatsappNumber }
 * @param {Object} paymentData - { razorpay_payment_id, razorpay_order_id, amount }
 * @returns {Promise<{ success: boolean, error?: string, response?: any }>}
 */
export async function sendRegistrationEmail(registrationData, paymentData) {
  try {
    const fullName = (registrationData?.fullName || "Valued Participant").trim();
    const recipientEmail = (registrationData?.email || "").trim();
    const phone = `${registrationData?.countryCode || "+91"} ${(registrationData?.whatsappNumber || registrationData?.phone || "").trim()}`.trim();
    const paymentId = paymentData?.razorpay_payment_id || paymentData?.paymentId || "Direct_Verified";
    const orderId = paymentData?.razorpay_order_id || paymentData?.orderId || "Pass_Order";
    const amount = paymentData?.amount || 19;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeFormatted = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (!recipientEmail) {
      throw new Error("No recipient email address provided.");
    }

    // Comprehensive template parameters matching any EmailJS template variable names
    const templateParams = {
      // Standard recipient fields
      to_name: fullName,
      to_email: recipientEmail,
      user_name: fullName,
      user_email: recipientEmail,
      recipient_email: recipientEmail,
      email: recipientEmail,
      name: fullName,
      full_name: fullName,
      contact_number: phone,
      phone_number: phone,
      phone: phone,

      // Workshop Details
      workshop_title: "Lock Your Energies, Unlock Your Strength",
      workshop_subtitle: "Bandhas & Nauli Kriya Masterclass",
      workshop_name: "Bandhas & Nauli Kriya Workshop",
      workshop_date: "Saturday, 19 Sept",
      workshop_time: "8:00 AM IST",
      workshop_duration: "90 Minutes Interactive Live",
      mentor: "Senior Yogaregime Master Practitioner",
      joining_link: "Live Zoom / Meeting link will be emailed 1 hour prior to session start.",

      // Payment & Transaction Details
      amount_paid: `₹${amount}`,
      amount: `₹${amount}`,
      fee: `₹${amount}`,
      currency: "INR",
      payment_id: paymentId,
      razorpay_payment_id: paymentId,
      order_id: orderId,
      transaction_id: paymentId,
      payment_date: `${dateFormatted} at ${timeFormatted}`,
      date: dateFormatted,
      time: timeFormatted,
      status: "CONFIRMED & PAID",

      // Organizer & Team
      organizer_name: "Yogaregime Team",
      support_email: "support@yogaregime.com",
      support_phone: "+91 98769 63204",

      // Formatted Message Body
      message: `Dear ${fullName},\n\nYour registration for the Bandhas & Nauli Kriya Workshop is confirmed!\n\nWorkshop Details:\n- Date: Saturday, 19 Sept\n- Time: 8:00 AM IST\n- Fee Paid: ₹${amount}\n- Payment ID: ${paymentId}\n\nWe look forward to seeing you in the live masterclass!\n\nYogaregime Team`,
    };

    // Candidate Service & Template IDs (including common EmailJS defaults)
    const serviceIds = [
      EMAILJS_CONFIG.serviceId,
      "service_yogaregime",
      "service_default",
      "default_service",
      "service_gmail",
    ].filter(Boolean);

    const templateIds = [
      EMAILJS_CONFIG.templateId,
      "template_yogaregime",
      "template_booking",
      "template_default",
      "template_pass",
    ].filter(Boolean);

    let lastError = null;

    // 1. Try browser SDK emailjs.send
    if (typeof window !== "undefined") {
      for (const sId of serviceIds) {
        for (const tId of templateIds) {
          try {
            const res = await emailjs.send(sId, tId, templateParams, EMAILJS_CONFIG.publicKey);
            if (res && (res.status === 200 || res.text === "OK")) {
              console.log("EmailJS sent successfully via SDK:", res);
              return { success: true, response: res };
            }
          } catch (err) {
            lastError = err;
          }
        }
      }
    }

    // 2. Direct HTTP REST API Fallback to api.emailjs.com
    for (const sId of serviceIds) {
      for (const tId of templateIds) {
        try {
          const restPayload = {
            service_id: sId,
            template_id: tId,
            user_id: EMAILJS_CONFIG.publicKey,
            accessToken: EMAILJS_CONFIG.privateKey,
            template_params: templateParams,
          };

          const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(restPayload),
          });

          if (response.ok) {
            const text = await response.text();
            console.log("EmailJS sent successfully via REST API:", text);
            return { success: true, response: text };
          }
        } catch (restErr) {
          lastError = restErr;
        }
      }
    }

    console.warn("EmailJS delivery notice:", lastError?.text || lastError?.message || lastError);
    return {
      success: false,
      error: lastError?.text || lastError?.message || "EmailJS template pending configuration",
    };
  } catch (error) {
    console.error("sendRegistrationEmail error:", error);
    return { success: false, error: error.message };
  }
}
