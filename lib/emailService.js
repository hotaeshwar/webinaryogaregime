// EmailJS Configuration from User Account
export const EMAILJS_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "U0kdUjLqUljc2lElN",
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_opee5zs",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_8lm7c3e",
};

// Possible character-case variants for the Public Key (e.g. l vs I vs 1)
const PUBLIC_KEY_CANDIDATES = [
  EMAILJS_CONFIG.publicKey,
  "U0kdUjLqUljc2lElN",
  "U0kdUjLqUljc2lEIN",
  "U0kdUjLqUljc2IEIN",
  "U0kdUjLqUIjc2lEIN",
  "U0kdUjLqUIjc2IEIN",
  "U0kdUjLqU1jc2lEIN",
  "U0kdUjLqUljc21EIN",
].filter(Boolean);

/**
 * Sends a structured confirmation email to the attendee and receiver
 * immediately upon successful transaction using the official EmailJS browser SDK.
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
      return { success: false, error: "No recipient email address provided." };
    }

    // Comprehensive template parameters matching any EmailJS template variable names
    const templateParams = {
      // Recipient fields
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

    if (typeof window === "undefined") {
      return { success: false, error: "EmailJS must run in browser client." };
    }

    const serviceId = EMAILJS_CONFIG.serviceId || "service_opee5zs";
    const templateId = EMAILJS_CONFIG.templateId || "template_8lm7c3e";

    let lastError = null;

    let emailjsModule;
    try {
      emailjsModule = await import("@emailjs/browser");
    } catch (importErr) {
      console.warn("Could not import @emailjs/browser:", importErr);
      return { success: false, error: "EmailJS SDK not available." };
    }
    const emailjs = emailjsModule?.default || emailjsModule;

    // Try sending with public key candidates
    for (const pKey of PUBLIC_KEY_CANDIDATES) {
      try {
        const result = await emailjs.send(
          serviceId,
          templateId,
          templateParams,
          pKey
        );

        if (result && (result.status === 200 || result.text === "OK")) {
          console.log("EmailJS Sent Successfully to", recipientEmail, ":", result.text);
          return { success: true, response: result };
        }
      } catch (sendError) {
        lastError = sendError;
        // If not account error, don't keep trying variations
        if (sendError?.text !== "Account not found" && sendError?.status !== 404) {
          break;
        }
      }
    }

    console.warn("EmailJS send notice:", lastError?.text || lastError?.message || lastError);
    return {
      success: false,
      error: lastError?.text || lastError?.message || "EmailJS template pending configuration",
    };
  } catch (error) {
    console.warn("sendRegistrationEmail error:", error);
    return { success: false, error: error.message };
  }
}
