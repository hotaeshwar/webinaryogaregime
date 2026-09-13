import { jsPDF } from "jspdf";

/**
 * Loads an image from a URL and converts it to a base64 DataURL
 */
function getImageDataUrl(url) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(null);
    }, 1500);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      } catch (err) {
        console.warn("Could not convert logo to DataURL:", err);
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      console.warn("Could not load logo from URL:", url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Generates and downloads a branded PDF pass for the workshop registration.
 * Also saves the record to localStorage.
 */
export async function generateAndSaveWorkshopPDF(registrationData, paymentData) {
  try {
    // 1. Save record to localStorage
    const bookingRecord = {
      fullName: registrationData.fullName,
      email: registrationData.email,
      phone: `${registrationData.countryCode || "+91"} ${registrationData.whatsappNumber || ""}`.trim(),
      paymentId: paymentData.razorpay_payment_id || "N/A",
      orderId: paymentData.razorpay_order_id || "N/A",
      amountPaid: "Rs. 19",
      workshop: "Bandhas & Nauli Kriya Workshop",
      date: "Saturday, 19 September",
      time: "8:00 AM IST",
      savedAt: new Date().toISOString(),
      status: "CONFIRMED & VERIFIED",
    };

    try {
      localStorage.setItem("workshop_last_booking", JSON.stringify(bookingRecord));
      
      const existingBookings = JSON.parse(localStorage.getItem("workshop_all_bookings") || "[]");
      existingBookings.push(bookingRecord);
      localStorage.setItem("workshop_all_bookings", JSON.stringify(existingBookings));
    } catch (lsErr) {
      console.warn("Failed to write booking to localStorage:", lsErr);
    }

    // 2. Create PDF instance (A4 format)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Brand Colors
    const primaryDark = [26, 77, 62]; // #1A4D3E
    const goldAccent = [197, 155, 39]; // #C59B27
    const bgCream = [250, 248, 244]; // #FAF8F4
    const textDark = [24, 33, 29]; // #18211D
    const textMuted = [100, 116, 107]; // #64746B

    // Background Fill
    doc.setFillColor(...bgCream);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Top Header Banner (Deep Forest Green)
    doc.setFillColor(...primaryDark);
    doc.rect(0, 0, pageWidth, 48, "F");

    // Gold decorative accent line under header
    doc.setFillColor(...goldAccent);
    doc.rect(0, 48, pageWidth, 2.5, "F");

    // Load and render logo
    try {
      const logoBase64 = await getImageDataUrl("/logo1.png");
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 14, 8, 32, 32);
      }
    } catch (e) {
      console.warn("Logo rendering skipped:", e);
    }

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("BANDHAS & NAULI KRIYA", 52, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(243, 230, 186); // Light Gold
    doc.text("Live Online Masterclass • Official Booking Pass", 52, 27);

    doc.setFontSize(9);
    doc.setTextColor(200, 220, 210);
    doc.text("Saturday, 19 September • 8:00 AM IST (90 Minutes)", 52, 34);

    // Verified Stamp / Badge in top right
    doc.setFillColor(34, 139, 34);
    doc.roundedRect(pageWidth - 56, 12, 42, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT VERIFIED", pageWidth - 53, 18);
    doc.setFontSize(7.5);
    doc.text("SEAT CONFIRMED", pageWidth - 50, 23);

    // Main Ticket Card
    const cardX = 14;
    const cardY = 58;
    const cardWidth = pageWidth - 28;
    const cardHeight = 135;

    // Card White Container
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 225, 220);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, "FD");

    // Section 1: Participant Details
    doc.setFillColor(...primaryDark);
    doc.rect(cardX, cardY, cardWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("PARTICIPANT & REGISTRATION DETAILS", cardX + 6, cardY + 5.5);

    doc.setTextColor(...textDark);
    doc.setFontSize(10);

    // Row 1: Name
    doc.setFont("helvetica", "bold");
    doc.text("Full Name:", cardX + 8, cardY + 18);
    doc.setFont("helvetica", "normal");
    doc.text(String(registrationData.fullName || "Attendee"), cardX + 45, cardY + 18);

    // Row 2: Email
    doc.setFont("helvetica", "bold");
    doc.text("Email Address:", cardX + 8, cardY + 26);
    doc.setFont("helvetica", "normal");
    doc.text(String(registrationData.email || "N/A"), cardX + 45, cardY + 26);

    // Row 3: WhatsApp
    doc.setFont("helvetica", "bold");
    doc.text("WhatsApp No:", cardX + 8, cardY + 34);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${registrationData.countryCode || "+91"} ${registrationData.whatsappNumber || ""}`.trim(),
      cardX + 45,
      cardY + 34
    );

    // Divider
    doc.setDrawColor(230, 235, 230);
    doc.line(cardX + 6, cardY + 41, cardX + cardWidth - 6, cardY + 41);

    // Section 2: Session & Payment Details
    doc.setFillColor(...primaryDark);
    doc.rect(cardX, cardY + 44, cardWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("SESSION & PAYMENT RECEIPT", cardX + 6, cardY + 49.5);

    doc.setTextColor(...textDark);

    // Column Left: Session info
    doc.setFont("helvetica", "bold");
    doc.text("Workshop:", cardX + 8, cardY + 60);
    doc.setFont("helvetica", "normal");
    doc.text("Lock Your Energies, Unlock Your Strength", cardX + 45, cardY + 60);

    doc.setFont("helvetica", "bold");
    doc.text("Date & Time:", cardX + 8, cardY + 68);
    doc.setFont("helvetica", "normal");
    doc.text("Saturday, 19 Sept • 8:00 AM IST", cardX + 45, cardY + 68);

    doc.setFont("helvetica", "bold");
    doc.text("Format:", cardX + 8, cardY + 76);
    doc.setFont("helvetica", "normal");
    doc.text("Live Interactive Masterclass (90 Mins)", cardX + 45, cardY + 76);

    // Column Right / Payment Info Box
    const payBoxX = cardX + 8;
    const payBoxY = cardY + 84;
    const payBoxWidth = cardWidth - 16;
    const payBoxHeight = 42;

    doc.setFillColor(245, 248, 245);
    doc.setDrawColor(...goldAccent);
    doc.roundedRect(payBoxX, payBoxY, payBoxWidth, payBoxHeight, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryDark);
    doc.text("Payment Amount:", payBoxX + 6, payBoxY + 10);
    doc.setFontSize(13);
    doc.setTextColor(...goldAccent);
    doc.text("Rs. 19 (INR)", payBoxX + 50, payBoxY + 10);

    doc.setFontSize(9.5);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text("Payment ID:", payBoxX + 6, payBoxY + 19);
    doc.setFont("helvetica", "normal");
    doc.text(String(paymentData.razorpay_payment_id || "Direct Verified"), payBoxX + 50, payBoxY + 19);

    doc.setFont("helvetica", "bold");
    doc.text("Order ID:", payBoxX + 6, payBoxY + 27);
    doc.setFont("helvetica", "normal");
    doc.text(String(paymentData.razorpay_order_id || "Direct Pass"), payBoxX + 50, payBoxY + 27);

    doc.setFont("helvetica", "bold");
    doc.text("Payment Status:", payBoxX + 6, payBoxY + 35);
    doc.setTextColor(34, 139, 34);
    doc.text("SUCCESSFUL & VERIFIED ✓", payBoxX + 50, payBoxY + 35);

    // Section 3: Preparation & Guidelines Box
    const noteY = cardY + cardHeight + 8;
    const noteHeight = 52;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 225, 220);
    doc.roundedRect(cardX, noteY, cardWidth, noteHeight, 4, 4, "FD");

    doc.setFillColor(...goldAccent);
    doc.rect(cardX, noteY, cardWidth, 6.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("IMPORTANT WORKSHOP GUIDELINES", cardX + 6, noteY + 4.5);

    doc.setTextColor(...textDark);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");

    const guidelines = [
      "1. The live interactive session joining link will be shared to your WhatsApp & Email prior to the masterclass.",
      "2. Please join with an empty stomach (or at least 3-4 hours after a meal) for optimal Bandha and Nauli practice.",
      "3. Wear comfortable yoga attire and keep a yoga mat, water, and an open space ready.",
      "4. Helpline & Support: WhatsApp +91 98769 63204 for any coordination or questions.",
    ];

    let gY = noteY + 13;
    guidelines.forEach((g) => {
      doc.text(g, cardX + 6, gY);
      gY += 9;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(
      `Generated on: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST • Keep this PDF safe for admission`,
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );

    // Save/Download PDF to attendee device
    const fileName = `Workshop_Pass_${(registrationData.fullName || "Attendee").replace(/\s+/g, "_")}_${Date.now().toString().slice(-4)}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return { success: false, error };
  }
}
