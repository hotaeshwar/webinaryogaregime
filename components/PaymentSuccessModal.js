"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  Send,
  UserCheck,
} from "lucide-react";

export default function PaymentSuccessModal({
  registrationData,
  paymentData,
  onReset,
}) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  // Organizer WhatsApp number
  const organizerNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919569663204";

  // Attendee's own phone number (cleaned of non-digits)
  const attendeeRawPhone = `${registrationData.countryCode || "+91"}${registrationData.whatsappNumber || ""}`;
  const attendeePhone = attendeeRawPhone.replace(/\D/g, "");

  // Official Booking Confirmation Message
  const attendeeConfirmationMessage = `*BOOKING CONFIRMED: Bandhas & Nauli Kriya Workshop* ॐ

Hello ${registrationData.fullName},
Your seat for the upcoming online masterclass has been confirmed.

*REGISTRATION DETAILS*
- Name: ${registrationData.fullName}
- Email: ${registrationData.email}
- WhatsApp: ${registrationData.countryCode} ${registrationData.whatsappNumber}

*WORKSHOP DETAILS*
- Workshop: Lock Your Energies, Unlock Your Strength
- Subtitle: Bandhas & Nauli Kriya Workshop
- Date: Saturday, 19 September
- Time: 8:00 AM IST
- Mode: Online (Live Interactive)
- Duration: 90 Minutes

*PAYMENT RECEIPT*
- Amount Paid: ₹19
- Payment ID: ${paymentData.razorpay_payment_id}
- Order ID: ${paymentData.razorpay_order_id}
- Status: Payment Verified Successfully ✓

Please keep this confirmation handy. The live interactive session joining link will be shared prior to the masterclass.

Thank you!`;

  // Message for Coordinator / Organizer
  const organizerNotificationMessage = `Hello,
I have successfully registered and paid ₹19 for the Bandhas & Nauli Kriya Workshop.

REGISTRATION DETAILS
Name: ${registrationData.fullName}
Email: ${registrationData.email}
WhatsApp: ${registrationData.countryCode}${registrationData.whatsappNumber}

WORKSHOP DETAILS
Workshop: Lock Your Energies, Unlock Your Strength
Date: Saturday, 19 September
Time: 8:00 AM
Mode: Online
Duration: 90 Minutes

PAYMENT DETAILS
Amount Paid: ₹19
Payment ID: ${paymentData.razorpay_payment_id}
Order ID: ${paymentData.razorpay_order_id}
Payment Status: Verified Successfully

Please confirm my workshop registration.
Thank you.`;

  // URL to deliver confirmation directly to the attendee's WhatsApp
  const attendeeWhatsAppUrl = `https://wa.me/${attendeePhone || organizerNumber}?text=${encodeURIComponent(
    attendeeConfirmationMessage
  )}`;

  // URL to notify the organizer
  const organizerWhatsAppUrl = `https://wa.me/${organizerNumber}?text=${encodeURIComponent(
    organizerNotificationMessage
  )}`;

  // Auto-redirect to attendee WhatsApp
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !redirectAttempted) {
      setRedirectAttempted(true);
      window.location.href = attendeeWhatsAppUrl;
    }
  }, [countdown, redirectAttempted, attendeeWhatsAppUrl]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(attendeeConfirmationMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-wellness-dark/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-white rounded-3xl shadow-2xl border border-wellness-border overflow-hidden animate-fade-up">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-wellness-primaryDark via-wellness-primary to-wellness-primaryLight p-6 text-center text-white relative">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center mb-3.5 border-2 border-wellness-goldLight/40 shadow-glow-green">
            <CheckCircle2 className="w-10 h-10 text-emerald-300 animate-pulse-subtle" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 uppercase tracking-widest mb-1.5">
            Verified Successfully
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">
            Booking Confirmed!
          </h2>
          <p className="text-sm text-gray-200 mt-1">
            Bandhas & Nauli Kriya Workshop • Saturday, 19 Sept (8:00 AM)
          </p>
        </div>

        {/* Card Content */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Summary Box */}
          <div className="bg-wellness-surface/70 rounded-2xl p-4.5 border border-wellness-border/80 space-y-3">
            <div className="flex justify-between items-center text-sm py-1 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">Registrant:</span>
              <span className="text-wellness-dark font-bold">
                {registrationData.fullName}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">Email:</span>
              <span className="text-wellness-dark font-bold break-all">
                {registrationData.email}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">WhatsApp:</span>
              <span className="text-wellness-dark font-bold font-mono">
                {registrationData.countryCode} {registrationData.whatsappNumber}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium">Amount Paid:</span>
              <span className="text-wellness-primary font-extrabold text-base">
                ₹19
              </span>
            </div>
            <div className="flex justify-between items-start text-xs py-1 border-b border-wellness-border/50">
              <span className="text-wellness-muted font-medium shrink-0 mr-2">
                Payment ID:
              </span>
              <span className="text-wellness-dark font-mono font-semibold break-all text-right">
                {paymentData.razorpay_payment_id}
              </span>
            </div>
            <div className="flex justify-between items-start text-xs py-1">
              <span className="text-wellness-muted font-medium shrink-0 mr-2">
                Order ID:
              </span>
              <span className="text-wellness-dark font-mono font-semibold break-all text-right">
                {paymentData.razorpay_order_id}
              </span>
            </div>
          </div>

          {/* WhatsApp Status Alert */}
          <div className="text-center space-y-1.5 bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              Confirmation Sent to WhatsApp
            </p>
            <p className="text-xs sm:text-sm font-medium text-wellness-dark">
              {countdown > 0 ? (
                <>
                  Opening your WhatsApp in{" "}
                  <span className="font-extrabold text-wellness-primary font-mono text-base">
                    {countdown}s
                  </span>{" "}
                  with your official booking pass...
                </>
              ) : (
                "Opening WhatsApp with your booking details..."
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary: Get Confirmation in Attendee's WhatsApp */}
            <a
              href={attendeeWhatsAppUrl}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all text-center"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Get Confirmation on My WhatsApp</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>

            {/* Secondary: Notify Organizer */}
            <a
              href={organizerWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-wellness-surface hover:bg-wellness-border/60 text-wellness-dark text-xs font-semibold border border-wellness-border transition-colors text-center"
            >
              <Send className="w-3.5 h-3.5 text-wellness-primary" />
              <span>Notify Workshop Coordinator (+91 95696 63204)</span>
            </a>

            {/* Utility Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-wellness-dark text-xs font-semibold border border-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Booking Pass Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-wellness-muted" />
                    <span>Copy Booking Pass</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Trust Footer */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-wellness-muted font-medium pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-wellness-primary" />
            <span>Registration verified via Razorpay HMAC authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
