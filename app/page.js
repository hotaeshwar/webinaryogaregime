import React from "react";
import WorkshopDetails from "@/components/WorkshopDetails";
import RegistrationForm from "@/components/RegistrationForm";
import { Sparkles, Shield, Heart, HelpCircle, PhoneCall } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-wellness-bg relative overflow-hidden flex flex-col justify-between">
      {/* Background Subtle Gradient & Ambience */}
      <div className="absolute inset-0 bg-ambient-pattern pointer-events-none z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-wellness-gold/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-wellness-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full border-b border-wellness-border/70 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo1.png"
              alt="Bandhas & Nauli Kriya Workshop Logo"
              className="h-14 sm:h-16 w-auto max-w-[180px] object-contain drop-shadow-sm transition-transform hover:scale-105"
            />
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-wellness-dark block leading-tight font-serif">
                Prana & Strength
              </span>
              <span className="text-xs text-wellness-muted font-medium">
                Yoga Masterclass Series
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-wellness-cream border border-wellness-border text-xs font-semibold text-wellness-primary">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Masterclass</span>
            </div>
            <a
              href="https://wa.me/919569663204"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-wellness-dark bg-wellness-surface hover:bg-wellness-border border border-wellness-border transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-wellness-primary" />
              <span>Support</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Two-Column Hero / Registration Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Workshop Details & Highlights */}
          <div className="lg:col-span-7 animate-fade-up">
            <WorkshopDetails />
          </div>

          {/* Right Column: Registration Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 animate-fade-up">
            <RegistrationForm />
          </div>
        </div>
      </section>

      {/* Bottom Features / Assurance Bar */}
      <section className="relative z-10 border-t border-wellness-border/80 bg-wellness-surface/60 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-white border border-wellness-border flex items-center justify-center text-wellness-primary shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-wellness-gold" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-wellness-dark uppercase tracking-wider">
                  Live Interactive Q&A
                </h4>
                <p className="text-xs text-wellness-muted">
                  Direct master guidance for your postures & locks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-white border border-wellness-border flex items-center justify-center text-wellness-primary shrink-0 shadow-sm">
                <Shield className="w-5 h-5 text-wellness-primary" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-wellness-dark uppercase tracking-wider">
                  Instant Verification
                </h4>
                <p className="text-xs text-wellness-muted">
                  Secured through Razorpay HMAC authentication
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-white border border-wellness-border flex items-center justify-center text-wellness-primary shrink-0 shadow-sm">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-wellness-dark uppercase tracking-wider">
                  WhatsApp Support
                </h4>
                <p className="text-xs text-wellness-muted">
                  Direct coordinator assistance at +91 95696 63204
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-wellness-border/80 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-wellness-muted">
          <div className="flex items-center gap-3">
            <img
              src="/logo1.png"
              alt="Logo"
              className="h-10 w-auto object-contain"
            />
            <p>© {new Date().getFullYear()} Bandhas & Nauli Kriya Workshop. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Questions? WhatsApp +91 95696 63204
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
