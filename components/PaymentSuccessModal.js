import React, { useEffect, useState, useRef } from "react";
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  Send,
  UserCheck,
  Download,
  FileText,
  Save,
} from "lucide-react";
import { generateAndSaveWorkshopPDF } from "./pdfGenerator";
import { saveTransaction } from "@/lib/transactionService";

export default function PaymentSuccessModal({
  registrationData,
  paymentData,
  onReset,
}) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const pdfTriggeredRef = useRef(false);

  // Organizer WhatsApp number (919876963204)
  const organizerNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876963204";

  // Attendee phone number
  const attendeeRawPhone = `${registrationData.countryCode || "+91"}${registrationData.whatsappNumber || ""}`;
  const attendeePhone = attendeeRawPhone.replace(/\D/g, "");

  // Handler to manually download / regenerate PDF
  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    try {
      await generateAndSaveWorkshopPDF(registrationData, paymentData);
      setPdfDownloaded(true);
    } catch (err) {
      console.error("Manual PDF download failed:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Auto-generate & save PDF to customer device + save transaction to Firebase Firestore
  useEffect(() => {
    if (!pdfTriggeredRef.current) {
      pdfTriggeredRef.current = true;
      handleDownloadPDF();
      saveTransaction(registrationData, paymentData);
    }
  }, []);

  // Registration details & confirmation ticket message for the Receiver / Organizer (+91 98769 63204)
  const organizerNotificationMessage = `🎫 *WORKSHOP REGISTRATION TICKET & PAYMENT CONFIRMATION* ॐ

Hello ${registrationData.fullName},
You have successfully registered and completed the payment of ₹1 for the Bandhas & Nauli Kriya Workshop.

👤 *ATTENDEE DETAILS:*
• Name: ${registrationData.fullName}
• Email: ${registrationData.email}
• WhatsApp: ${registrationData.countryCode} ${registrationData.whatsappNumber}

🧘 *WORKSHOP DETAILS:*
• Workshop: Lock Your Energies, Unlock Your Strength
• Topic: Bandhas & Nauli Kriya Live Masterclass
• Date: Saturday, 19 September
• Time: 8:00 AM IST
• Mode: Online (Live Interactive)
• Duration: 90 Minutes

💳 *PAYMENT VERIFICATION:*
• Amount Paid: ₹1
• Payment ID: ${paymentData.razorpay_payment_id}
• Order ID: ${paymentData.razorpay_order_id}
• Status: Verified & Confirmed ✓
• PDF Ticket: Generated & downloaded to attendee device

Organizer Support: +91 98769 63204
Keep this ticket message saved. See you in the session!`;

  // Attendee personal booking ticket pass message
  const attendeePassMessage = `🎫 *OFFICIAL WORKSHOP ADMISSION PASS* ॐ
*Bandhas & Nauli Kriya Masterclass*

Hello ${registrationData.fullName},
You have successfully registered and completed the payment of ₹1 for the Bandhas & Nauli Kriya Workshop.

📋 *TICKET DETAILS:*
• Attendee: ${registrationData.fullName}
• WhatsApp: ${registrationData.countryCode} ${registrationData.whatsappNumber}
• Email: ${registrationData.email}
• Workshop: Lock Your Energies, Unlock Your Strength
• Date: Saturday, 19 September at 8:00 AM IST
• Amount Paid: ₹1
• Payment ID: ${paymentData.razorpay_payment_id}
• Status: Confirmed ✓

📞 Organizer / Receiver Support: +91 98769 63204
Keep this ticket message saved. See you in the session!`;

  // WhatsApp URLs
  const organizerWhatsAppUrl = `https://wa.me/${organizerNumber}?text=${encodeURIComponent(
    organizerNotificationMessage
  )}`;

  const attendeeWhatsAppUrl = `https://wa.me/${attendeePhone || organizerNumber}?text=${encodeURIComponent(
    attendeePassMessage
  )}`;

  // Auto-redirect to WhatsApp receiver after ticket download
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !redirectAttempted) {
      setRedirectAttempted(true);
      window.location.href = organizerWhatsAppUrl;
    }
  }, [countdown, redirectAttempted, organizerWhatsAppUrl]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(organizerNotificationMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-wellness-dark/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg my-6 bg-white rounded-3xl shadow-2xl border border-wellness-border overflow-hidden animate-fade-up">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-wellness-primaryDark via-wellness-primary to-wellness-primaryLight p-5 sm:p-6 text-center text-white relative">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center mb-3 border-2 border-wellness-goldLight/40 shadow-glow-green">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 animate-pulse-subtle" />
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 uppercase tracking-widest mb-1">
            Payment Verified ✓
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif leading-tight">
            Registration Confirmed!
          </h2>
          <p className="text-xs sm:text-sm text-gray-200 mt-1">
            Bandhas & Nauli Kriya Workshop • Sat, 19 Sept (8:00 AM)
          </p>
        </div>

        {/* Card Content */}
        <div className="p-5 sm:p-7 space-y-5">
          {/* Summary Box */}
          <div className="bg-wellness-surface/75 rounded-2xl p-4 border border-wellness-border/80 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-0.5 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">Registrant:</span>
              <span className="text-wellness-dark font-bold">
                {registrationData.fullName}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">Email:</span>
              <span className="text-wellness-dark font-bold break-all">
                {registrationData.email}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">WhatsApp:</span>
              <span className="text-wellness-dark font-bold font-mono">
                {registrationData.countryCode} {registrationData.whatsappNumber}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">Amount Paid:</span>
              <span className="text-wellness-primary font-extrabold text-sm sm:text-base">
                ₹1
              </span>
            </div>
            <div className="flex justify-between items-start py-0.5 border-b border-wellness-border/50 text-[11px] sm:text-xs">
              <span className="text-wellness-muted font-medium shrink-0 mr-2">
                Payment ID:
              </span>
              <span className="text-wellness-dark font-mono font-semibold break-all text-right">
                {paymentData.razorpay_payment_id}
              </span>
            </div>
            <div className="flex justify-between items-start py-0.5 text-[11px] sm:text-xs">
              <span className="text-wellness-muted font-medium shrink-0 mr-2">
                Order ID:
              </span>
              <span className="text-wellness-dark font-mono font-semibold break-all text-right">
                {paymentData.razorpay_order_id}
              </span>
            </div>
          </div>

          {/* Auto Transfer Banner */}
          <div className="text-center space-y-1 bg-emerald-50/90 p-3.5 rounded-2xl border border-emerald-200">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Ticket Downloaded & Confirmation Ready
            </p>
            <p className="text-xs sm:text-sm font-medium text-wellness-dark">
              {countdown > 0 ? (
                <>
                  Opening WhatsApp in{" "}
                  <span className="font-extrabold text-wellness-primary font-mono text-base">
                    {countdown}s
                  </span>{" "}
                  to send confirmation ticket to receiver...
                </>
              ) : (
                "Opening WhatsApp with confirmation ticket for receiver..."
              )}
            </p>
          </div>

          {/* WhatsApp Action Buttons */}
          <div className="space-y-2.5">
            {/* 1. Send to Coordinator / Receiver */}
            <a
              href={organizerWhatsAppUrl}
              className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Send Confirmation Ticket to Receiver (+91 98769 63204)</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>

            {/* 2. Send to Attendee's Own WhatsApp */}
            <a
              href={attendeeWhatsAppUrl}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-wellness-surface hover:bg-wellness-border/60 text-wellness-dark text-xs sm:text-sm font-semibold border border-wellness-border transition-colors text-center"
            >
              <Send className="w-3.5 h-3.5 text-wellness-primary" />
              <span>Save Pass to My WhatsApp ({registrationData.countryCode} {registrationData.whatsappNumber})</span>
            </a>

            {/* 3. Automatic PDF Ticket Pass & Local Storage Record */}
            <div className="bg-wellness-cream/80 p-3.5 rounded-2xl border border-wellness-gold/40 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-wellness-dark flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-wellness-gold" />
                  Official PDF Admission Pass
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/60 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved locally
                </span>
              </div>
              <p className="text-[11px] text-wellness-muted leading-relaxed">
                A branded PDF receipt with logo, payment ID & workshop guidelines has been generated and saved to your device.
              </p>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-wellness-primary hover:bg-wellness-primaryDark text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>
                  {pdfGenerating
                    ? "Generating PDF Ticket..."
                    : pdfDownloaded
                    ? "Download PDF Ticket Again"
                    : "Download PDF Admission Pass"}
                </span>
              </button>
            </div>

            {/* Utility buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-wellness-dark text-xs font-semibold border border-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Booking Pass Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-wellness-muted" />
                    <span>Copy Confirmation</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-wellness-muted font-medium pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-wellness-primary" />
            <span>Registration verified via Razorpay payment gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}
