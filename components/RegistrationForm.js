"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import PaymentProgress from "./PaymentProgress";
import PaymentSuccessModal from "./PaymentSuccessModal";
import Toast from "./Toast";
import { saveTransaction } from "@/lib/transactionService";
import { sendRegistrationEmail } from "@/lib/emailService";

const COUNTRY_CODES = [
  { code: "+91", country: "India (IN)", flag: "🇮🇳", digits: 10 },
  { code: "+1", country: "USA / Canada (US/CA)", flag: "🇺🇸", digits: 10 },
  { code: "+44", country: "United Kingdom (UK)", flag: "🇬🇧", digits: 10 },
  { code: "+971", country: "UAE (AE)", flag: "🇦🇪", digits: 9 },
  { code: "+65", country: "Singapore (SG)", flag: "🇸🇬", digits: 8 },
  { code: "+61", country: "Australia (AU)", flag: "🇦🇺", digits: 9 },
  { code: "+49", country: "Germany (DE)", flag: "🇩🇪", digits: 10 },
  { code: "+33", country: "France (FR)", flag: "🇫🇷", digits: 9 },
];

export default function RegistrationForm() {
  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    countryCode: "+91",
    whatsappNumber: "",
    termsAccepted: false,
  });

  // Touched state for immediate inline error feedback
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    whatsappNumber: false,
    termsAccepted: false,
  });

  // Flow State
  // 'idle' | 'creating_order' | 'checkout_open' | 'verifying' | 'success' | 'failed'
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [progressStage, setProgressStage] = useState(0);

  // Success payload
  const [verifiedPaymentData, setVerifiedPaymentData] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState({
    message: "",
    type: "info",
  });

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: "", type: "info" });
  };

  // Validation Logic
  const validateForm = () => {
    const errors = {};

    // Full Name
    const nameTrimmed = formData.fullName.trim();
    if (!nameTrimmed) {
      errors.fullName = "Full name is required.";
    } else if (nameTrimmed.length < 2) {
      errors.fullName = "Name must be at least 2 characters long.";
    }

    // Email
    const emailTrimmed = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(emailTrimmed)) {
      errors.email = "Please enter a valid email address.";
    }

    // Mobile Number
    const phoneClean = formData.whatsappNumber.replace(/\D/g, "");
    if (!phoneClean) {
      errors.whatsappNumber = "Mobile number is required.";
    } else if (formData.countryCode === "+91" && phoneClean.length !== 10) {
      errors.whatsappNumber = "Indian mobile number must be exactly 10 digits.";
    } else if (phoneClean.length < 7 || phoneClean.length > 15) {
      errors.whatsappNumber = "Please enter a valid mobile number.";
    }

    // Terms
    if (!formData.termsAccepted) {
      errors.termsAccepted = "Please confirm the workshop registration terms.";
    }

    return errors;
  };

  const formErrors = validateForm();
  const isFormValid = Object.keys(formErrors).length === 0;

  // Handle Field Input
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  // Main Registration & Payment Handler
  const handleRegisterAndPay = async (e) => {
    if (e) e.preventDefault();

    // Mark all as touched to display errors if any
    setTouched({
      fullName: true,
      email: true,
      whatsappNumber: true,
      termsAccepted: true,
    });

    const currentErrors = validateForm();
    if (Object.keys(currentErrors).length > 0) {
      const firstError = Object.values(currentErrors)[0];
      showToast(firstError, "warning");
      return;
    }

    // Check if Razorpay SDK is loaded
    if (typeof window === "undefined" || !window.Razorpay) {
      showToast(
        "Payment gateway could not be loaded. Please refresh and try again.",
        "error"
      );
      return;
    }

    try {
      setPaymentStatus("checkout_open");
      setProgressStage(2); // 50% Checkout opened
      showToast("Opening secure Razorpay checkout...", "info");

      const cleanPhone = `${formData.countryCode}${formData.whatsappNumber.replace(/\D/g, "")}`;
      const razorpayKey =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_Tb4Km1evAI6DKr";

      // Fixed ₹19 (1900 paise) client-side
      const orderAmount = 1900;
      const orderCurrency = "INR";

      // Open Razorpay Standard Web Checkout Modal
      const options = {
        key: razorpayKey,
        amount: orderAmount,
        currency: orderCurrency,
        name: "Bandhas & Nauli Kriya Workshop",
        description: "Workshop Registration (₹19)",
        image: typeof window !== "undefined" && !window.location.hostname.includes("localhost") ? "/logo1.png" : undefined,
        prefill: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          contact: cleanPhone,
        },
        notes: {
          workshop: "Bandhas & Nauli Kriya Workshop",
          attendee_name: formData.fullName.trim(),
          attendee_email: formData.email.trim(),
          attendee_phone: cleanPhone,
        },
        theme: {
          color: "#1A4D3E",
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus("failed");
            setProgressStage(0);
            showToast(
              "Payment cancelled. Your registration has not been completed.",
              "warning"
            );
          },
        },
        handler: function (razorpayResponse) {
          const paymentId = razorpayResponse?.razorpay_payment_id;
          const returnedOrderId =
            razorpayResponse?.razorpay_order_id ||
            `DIRECT_${Date.now().toString(36).toUpperCase()}`;

          if (!paymentId) {
            setPaymentStatus("failed");
            setProgressStage(0);
            showToast("Payment was not completed. Please try again.", "error");
            return;
          }

          const payData = {
            razorpay_payment_id: paymentId,
            razorpay_order_id: returnedOrderId,
            amount: 19,
          };

          // Save transaction to Firebase Firestore & local storage immediately
          saveTransaction(formData, payData).catch((err) => {
            console.warn("Background saveTransaction error:", err);
          });

          // Dispatch confirmation email via EmailJS immediately
          sendRegistrationEmail(formData, payData).catch((err) => {
            console.warn("Background sendRegistrationEmail error:", err);
          });

          // Mark payment 100% verified & confirmed
          setProgressStage(4); // 100% Confirmed
          setPaymentStatus("success");
          setVerifiedPaymentData(payData);
          showToast("Payment Successful! Booking Confirmed ✓", "success");
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure event
      rzp.on("payment.failed", function (response) {
        console.error("Razorpay Payment Failed:", response.error);
        setPaymentStatus("failed");
        setProgressStage(0);
        const errDesc =
          response.error?.description || "Payment failed. Please try again.";
        showToast(errDesc, "error");
      });

      rzp.open();
    } catch (err) {
      console.error("Registration error:", err);
      setPaymentStatus("failed");
      setProgressStage(0);
      showToast(
        err.message ||
          "Could not open payment gateway. Please try again.",
        "error"
      );
    }
  };

  const handleResetFlow = () => {
    setPaymentStatus("idle");
    setProgressStage(0);
    setVerifiedPaymentData(null);
  };

  // Button text and state
  const getButtonContent = () => {
    switch (paymentStatus) {
      case "checkout_open":
        return (
          <>
            <Sparkles className="w-5 h-5 text-wellness-goldLight" />
            <span>Complete Payment in Razorpay</span>
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>Payment Successful ✓</span>
          </>
        );
      case "failed":
        return (
          <>
            <span>Try Payment Again (₹19)</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        );
      default:
        return (
          <>
            <span>Register & Pay ₹19</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        );
    }
  };

  const isProcessing = paymentStatus === "checkout_open";

  return (
    <div className="relative">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      {/* Payment Success Modal after HMAC verification */}
      {paymentStatus === "success" && verifiedPaymentData && (
        <PaymentSuccessModal
          registrationData={formData}
          paymentData={verifiedPaymentData}
          onReset={handleResetFlow}
        />
      )}

      {/* Main Form Glass Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-8 lg:p-9 shadow-premium-lg border border-wellness-border relative overflow-hidden w-full">
        {/* Card Decorative Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-wellness-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-wellness-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Form Header */}
        <div className="mb-6 space-y-1 relative">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wellness-primary bg-wellness-emeraldBg px-3 py-1 rounded-full border border-wellness-primary/15 mb-2">
            <Lock className="w-3.5 h-3.5" />
            Instant Seat Confirmation
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-wellness-dark font-serif">
            Reserve Your Spot
          </h2>
          <p className="text-sm text-wellness-muted">
            Enter your details below to join the live online workshop.
          </p>
        </div>

        {/* Optional Animated Progress Indicator when active */}
        {paymentStatus !== "idle" && (
          <PaymentProgress stage={progressStage} />
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegisterAndPay} noValidate className="space-y-5">
          {/* Full Name Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="block text-xs font-bold uppercase tracking-wider text-wellness-dark"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-wellness-muted">
                <User className="w-5 h-5" />
              </div>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                onBlur={() => handleBlur("fullName")}
                disabled={isProcessing}
                placeholder="e.g. Priya Sharma"
                className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium bg-wellness-cream/70 border ${
                  touched.fullName && formErrors.fullName
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : "border-wellness-border focus:border-wellness-primary focus:ring-wellness-primary/20"
                } focus:outline-none focus:ring-2 focus:bg-white text-wellness-dark placeholder:text-gray-400`}
              />
            </div>
            {touched.fullName && formErrors.fullName && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {formErrors.fullName}
              </p>
            )}
          </div>

          {/* Email Address Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-wellness-dark"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-wellness-muted">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                disabled={isProcessing}
                placeholder="e.g. priya@example.com"
                className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium bg-wellness-cream/70 border ${
                  touched.email && formErrors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                    : "border-wellness-border focus:border-wellness-primary focus:ring-wellness-primary/20"
                } focus:outline-none focus:ring-2 focus:bg-white text-wellness-dark placeholder:text-gray-400`}
              />
            </div>
            {touched.email && formErrors.email && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {formErrors.email}
              </p>
            )}
          </div>

          {/* Mobile Number Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="whatsappNumber"
              className="block text-xs font-bold uppercase tracking-wider text-wellness-dark"
            >
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <div className="relative w-32 shrink-0">
                <select
                  id="countryCode"
                  aria-label="Country Code"
                  value={formData.countryCode}
                  onChange={(e) =>
                    handleInputChange("countryCode", e.target.value)
                  }
                  disabled={isProcessing}
                  className="w-full py-3 px-3 rounded-xl text-sm font-semibold bg-wellness-cream/70 border border-wellness-border focus:border-wellness-primary focus:ring-2 focus:ring-wellness-primary/20 focus:outline-none text-wellness-dark cursor-pointer appearance-none"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-wellness-muted">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Number Input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-wellness-muted">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="whatsappNumber"
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    handleInputChange(
                      "whatsappNumber",
                      e.target.value.replace(/[^\d\s-]/g, "")
                    )
                  }
                  onBlur={() => handleBlur("whatsappNumber")}
                  disabled={isProcessing}
                  placeholder={
                    formData.countryCode === "+91"
                      ? "10 digit mobile number"
                      : "Phone number"
                  }
                  maxLength={15}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium bg-wellness-cream/70 border ${
                    touched.whatsappNumber && formErrors.whatsappNumber
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-wellness-border focus:border-wellness-primary focus:ring-wellness-primary/20"
                  } focus:outline-none focus:ring-2 focus:bg-white text-wellness-dark placeholder:text-gray-400 font-mono`}
                />
              </div>
            </div>
            {touched.whatsappNumber && formErrors.whatsappNumber && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {formErrors.whatsappNumber}
              </p>
            )}
          </div>

          {/* Terms & Confirmation Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) =>
                  handleInputChange("termsAccepted", e.target.checked)
                }
                onBlur={() => handleBlur("termsAccepted")}
                disabled={isProcessing}
                className="mt-1 w-4.5 h-4.5 rounded border-wellness-border text-wellness-primary focus:ring-wellness-primary/20 accent-wellness-primary cursor-pointer shrink-0"
              />
              <span className="text-xs text-wellness-muted leading-relaxed">
                I understand this is an interactive online workshop on Saturday, 19 Sept (8:00 AM) and agree to complete the ₹19 token fee to reserve my seat.
              </span>
            </label>
            {touched.termsAccepted && formErrors.termsAccepted && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1.5 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {formErrors.termsAccepted}
              </p>
            )}
          </div>

          {/* Main Payment CTA Button */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={!isFormValid || isProcessing}
              className={`w-full group relative flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-base shadow-premium transition-all duration-300 ${
                !isFormValid || isProcessing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-wellness-primaryDark via-wellness-primary to-wellness-accent text-white hover:shadow-premium-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
              }`}
            >
              {getButtonContent()}
            </button>

            {/* Micro-copy and Security Badges */}
            <div className="space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-wellness-muted font-medium">
                <Lock className="w-3.5 h-3.5 text-wellness-gold" />
                <span>Your registration is confirmed only after successful payment.</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-wellness-muted/80">
                <ShieldCheck className="w-3.5 h-3.5 text-wellness-primary" />
                <span>Secure 256-bit encrypted checkout powered by Razorpay</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
