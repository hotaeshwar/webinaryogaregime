import React from "react";
import { CheckCircle, Loader2 } from "lucide-react";

export default function PaymentProgress({ stage = 0 }) {
  // stage values:
  // 0: Details validated
  // 1: Creating secure payment order (25%)
  // 2: Secure checkout opened (50%)
  // 3: Verifying payment (75%)
  // 4: Registration confirmed (100%)

  const stages = [
    { label: "Details Validated", percent: 0 },
    { label: "Preparing Checkout", percent: 25 },
    { label: "Checkout Open", percent: 50 },
    { label: "Processing Payment", percent: 75 },
    { label: "Confirmed", percent: 100 },
  ];

  const currentPercent = stages[stage]?.percent || 0;

  return (
    <div className="w-full bg-wellness-cream p-4 rounded-2xl border border-wellness-border shadow-inner mb-6 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-wellness-primary flex items-center gap-1.5">
          {stage > 0 && stage < 4 && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-wellness-gold" />
          )}
          {stage === 4 && (
            <CheckCircle className="w-3.5 h-3.5 text-wellness-primary" />
          )}
          Payment Progress
        </span>
        <span className="text-xs font-bold text-wellness-dark font-mono bg-wellness-surface px-2 py-0.5 rounded-md border border-wellness-border">
          {currentPercent}%
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-wellness-border/70 h-2.5 rounded-full overflow-hidden p-0.5">
        <div
          className="bg-gradient-to-r from-wellness-gold to-wellness-primary h-full rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${Math.max(currentPercent, 4)}%` }}
        />
      </div>

      {/* Stage Description */}
      <div className="mt-2 text-center">
        <p className="text-xs font-medium text-wellness-muted">
          {stage === 0 && "Ready to proceed with registration & payment"}
          {stage === 1 && "Opening secure Razorpay checkout..."}
          {stage === 2 && "Razorpay checkout modal is active..."}
          {stage === 3 && "Processing payment confirmation..."}
          {stage === 4 && "✓ Payment verified & registration confirmed!"}
        </p>
      </div>
    </div>
  );
}
