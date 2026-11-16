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

// Track recently dispatched emails to strictly prevent duplicates
const recentlySentCache = new Map();

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
    const paymentId = paymentData?.registrationId || paymentData?.paymentId || paymentData?.razorpay_payment_id || `REG_${Date.now().toString(36).toUpperCase()}`;
    const orderId = paymentData?.orderId || paymentData?.razorpay_order_id || `PASS_${Date.now().toString(36).toUpperCase()}`;

    // Prevent duplicate dispatches within 5 minutes for the same registration / recipient
    const dedupeKey = `${paymentId}_${recipientEmail}`;
    const nowMs = Date.now();
    if (recentlySentCache.has(dedupeKey)) {
      const sentTime = recentlySentCache.get(dedupeKey);
      if (nowMs - sentTime < 5 * 60 * 1000) {
        console.log("Duplicate email prevented for key:", dedupeKey);
        return { success: true, message: "Confirmation email already dispatched." };
      }
    }
    recentlySentCache.set(dedupeKey, nowMs);
    const amount = paymentData?.amount !== undefined && paymentData?.amount !== null ? paymentData.amount : 1500;
    const amountDisplay = `₹${amount}`;

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
      // Sender & Reply fields (overriding any account defaults like hotaeshwar)
      reply_to: "yogawithharpreet@gmail.com",
      replyTo: "yogawithharpreet@gmail.com",
      from_name: "Yoga Regime",
      from_email: "yogawithharpreet@gmail.com",
      sender_name: "Yoga Regime",
      sender_email: "yogawithharpreet@gmail.com",
      author_name: "Harpreet Kaur - Yoga Regime",

      // Email Subjects (overriding any saved template subject)
      subject: `Registration Confirmed: Sampoorna Yoga Program - ${fullName}`,
      email_subject: `Registration Confirmed: Sampoorna Yoga Program - ${fullName}`,
      mail_subject: `Registration Confirmed: Sampoorna Yoga Program - ${fullName}`,
      title: "Sampoorna Yoga – A Complete Yogic Journey",

      // Recipient fields
      to_name: fullName,
      to_email: recipientEmail,
      user_name: fullName,
      user_email: recipientEmail,
      recipient_email: recipientEmail,
      email: recipientEmail,
      name: fullName,
      full_name: fullName,
      attendee_name: fullName,
      contact_number: phone,
      phone_number: phone,
      phone: phone,

      // Workshop Details
      workshop_title: "Sampoorna Yoga",
      workshop_subtitle: "Sampoorna Yoga – A Complete Yogic Journey",
      workshop_name: "Sampoorna Yoga Program",
      workshop_date: "1 Month (Mon, Wed, Fri)",
      workshop_time: "07:00 AM – 08:00 AM IST",
      workshop_duration: "1 Month",
      workshop_mode: "Online classes (Recordings Included)",
      mentor: "Harpreet Kaur",
      instructor: "Harpreet Kaur",
      instructor_name: "Harpreet Kaur",
      teacher_name: "Harpreet Kaur",
      host: "Harpreet Kaur, Yoga Regime 🧘‍♀️",
      host_name: "Harpreet Kaur, Yoga Regime",
      speaker: "Harpreet Kaur",
      joining_link: "Live online class joining links and access details will be shared prior to classes. Recording available for self practice.",

      // Registration & Pass Details
      amount_paid: amountDisplay,
      amount: amountDisplay,
      fee: amountDisplay,
      price: amountDisplay,
      cost: amountDisplay,
      currency: "INR",
      registration_id: paymentId,
      payment_id: paymentId,
      razorpay_payment_id: paymentId,
      order_id: orderId,
      transaction_id: paymentId,
      pass_reference: orderId,
      payment_date: `${dateFormatted} at ${timeFormatted}`,
      date: dateFormatted,
      time: timeFormatted,
      status: "CONFIRMED & REGISTERED",

      // Organizer & Team
      organizer_name: "Harpreet Kaur, Yoga Regime 🧘‍♀️",
      organizer_email: "yogawithharpreet@gmail.com",
      support_email: "yogawithharpreet@gmail.com",
      support_phone: "+91 98769 63204",

      // Formatted Message Body
      message: `Dear ${fullName},\n\nThank you for showing interest in our Sampoorna Yoga Program. Your registration is confirmed!\n\nThis is a one-month online yoga program designed to help you explore yoga beyond just physical postures and experience its different dimensions.\n\n✨ What will you learn?\n1. Shatkarma: Traditional yogic cleansing practices and their importance.\n2. Asana: Improve flexibility, strength, mobility, balance and body alignment through systematic practice.\n3. Pranayama: Understand the science of breathing and learn different pranayama techniques.\n4. Mudra: Explore yogic gestures and their role in regulating energy.\n5. Bandha: Learn the three major bandhas and understand how to engage and apply them correctly.\n6. Meditation: Understand and practise traditional yogic techniques for holistic development.\n\n🌸 Program Details:\n📅 Duration: 1 Month\n🗓️ Days: Monday, Wednesday & Friday\n⏰ Timing: 7:00 AM – 8:00 AM IST\n💻 Mode: Online classes\n💰 Program Fee: ₹1,500\n\nRECORDING AVAILABLE FOR SELF PRACTICE.\n\nWhether you are a beginner or have been practising yoga for some time, this program will help you develop a deeper understanding of yoga through proper techniques, guidance and consistent practice.\n\nOur intention is to help you experience Sampoorna Yoga – where the body, breath and mind work together.\n\nRegistration ID: ${paymentId}\n\nRegards,\nHarpreet Kaur\nYoga Regime 🧘‍♀️`,
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
