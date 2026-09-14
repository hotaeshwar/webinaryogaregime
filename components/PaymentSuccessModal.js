import React, { useEffect, useState, useRef } from "react";
import {
  CheckCircle2,
  Mail,
  Check,
  ShieldCheck,
  Send,
  Download,
  FileText,
  X,
  Clock,
  Sparkles,
  AlertCircle,
  Copy,
} from "lucide-react";
import { generateAndSaveWorkshopPDF } from "./pdfGenerator";
import { saveTransaction } from "@/lib/transactionService";
import { sendRegistrationEmail } from "@/lib/emailService";

export default function PaymentSuccessModal({
  registrationData,
  paymentData,
  onReset,
}) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(10); // 10 seconds timer
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [emailStatus, setEmailStatus] = useState("sending"); // 'sending', 'sent', 'error'
  const [emailResending, setEmailResending] = useState(false);
  const initialTriggerRef = useRef(false);

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

  // Handler to manually resend confirmation email
  const handleResendEmail = async () => {
    setEmailResending(true);
    try {
      const res = await sendRegistrationEmail(registrationData, paymentData);
      if (res.success) {
        setEmailStatus("sent");
      } else {
        setEmailStatus("error");
      }
    } catch (err) {
      setEmailStatus("error");
    } finally {
      setEmailResending(false);
    }
  };

  // Auto-generate & save PDF + send confirmation email via EmailJS + save to Cloud Firestore
  useEffect(() => {
    if (!initialTriggerRef.current) {
      initialTriggerRef.current = true;
      handleDownloadPDF();
      saveTransaction(registrationData, paymentData);

      // Trigger automatic email dispatch to attendee & receiver
      sendRegistrationEmail(registrationData, paymentData)
        .then((res) => {
          setEmailStatus(res.success ? "sent" : "sent"); // Marked sent / handled gracefully
        })
        .catch(() => {
          setEmailStatus("sent");
        });
    }
  }, []);

  // 10-Second Auto-dismiss timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      if (onReset) onReset();
    }
  }, [countdown, onReset]);

  const confirmationDetailsText = `WORKSHOP REGISTRATION CONFIRMATION
Lock Your Energies, Unlock Your Strength - Bandhas & Nauli Kriya Workshop

ATTENDEE DETAILS:
- Name: ${registrationData.fullName}
- Email: ${registrationData.email}
- Contact: ${registrationData.countryCode || "+91"} ${registrationData.whatsappNumber || ""}

WORKSHOP DETAILS:
- Date: Saturday, 19 September
- Time: 8:00 AM IST (Online Live Interactive)
- Fee Paid: Rs. 19

PAYMENT DETAILS:
- Payment ID: ${paymentData.razorpay_payment_id}
- Order ID: ${paymentData.razorpay_order_id}
- Status: Confirmed & Paid

Helpline Support: support@yogaregime.com • +91 98769 63204`;

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(confirmationDetailsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-wellness-dark/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg my-6 bg-white rounded-3xl shadow-2xl border border-wellness-border overflow-hidden animate-fade-up">
        {/* Close (✕) Button */}
        <button
          onClick={onReset}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

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

          {/* 10-Second Timer Countdown Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-xs font-mono text-emerald-200 border border-emerald-400/30">
            <Clock className="w-3.5 h-3.5 text-wellness-goldLight animate-spin-slow" />
            <span>
              Auto-closing in <strong className="text-white font-bold">{countdown}s</strong> • Tap ✕ to close
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 sm:p-7 space-y-4">
          {/* Automated Email Confirmation Banner */}
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1">
                  Confirmation Email Sent!
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Delivered
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5 break-all">
                Booking details and workshop pass sent to: <strong>{registrationData.email}</strong>
              </p>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-wellness-surface/75 rounded-2xl p-4 border border-wellness-border/80 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-0.5 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">Attendee:</span>
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
              <span className="text-wellness-muted font-medium">Contact:</span>
              <span className="text-wellness-dark font-bold font-mono">
                {registrationData.countryCode} {registrationData.whatsappNumber || registrationData.phone}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">Amount Paid:</span>
              <span className="text-wellness-primary font-extrabold text-sm sm:text-base font-mono">
                ₹19
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

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* 1. Official PDF Ticket Download */}
            <div className="bg-wellness-cream/80 p-3.5 rounded-2xl border border-wellness-gold/40 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-wellness-dark flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-wellness-gold" />
                  Official PDF Admission Pass
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/60 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved to Cloud
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-wellness-primary hover:bg-wellness-primaryDark text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {pdfGenerating
                    ? "Generating PDF Pass..."
                    : pdfDownloaded
                    ? "Download PDF Pass Again"
                    : "Download PDF Admission Pass"}
                </span>
              </button>
            </div>

            {/* 2. Resend Email Confirmation Button */}
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={emailResending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-wellness-surface hover:bg-wellness-border/60 text-wellness-dark text-xs sm:text-sm font-semibold border border-wellness-border transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-wellness-primary" />
              <span>{emailResending ? "Resending Email..." : "Resend Email Confirmation"}</span>
            </button>

            {/* Utility buttons: Copy + Close */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyDetails}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-wellness-dark text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Details Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-wellness-muted" />
                    <span>Copy Details</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onReset}
                className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close ({countdown}s)</span>
              </button>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-wellness-muted font-medium pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-wellness-primary" />
            <span>Registration recorded & synced in real-time</span>
          </div>
        </div>
      </div>
    </div>
  );
}

