import React from "react";
import {
  Calendar,
  Clock,
  Video,
  Hourglass,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  Zap,
  Users,
  Award,
  PlayCircle,
  Heart,
} from "lucide-react";

export default function WorkshopDetails() {
  const highlights = [
    {
      title: "1. Shatkarma",
      desc: "Traditional yogic cleansing practices and their importance for internal purification.",
    },
    {
      title: "2. Asana",
      desc: "Improve flexibility, strength, mobility, balance and body alignment through systematic practice.",
    },
    {
      title: "3. Pranayama",
      desc: "Understand the science of breathing and learn different pranayama techniques.",
    },
    {
      title: "4. Mudra",
      desc: "Explore yogic gestures and their role in regulating and channeling subtle energy.",
    },
    {
      title: "5. Bandha",
      desc: "Learn the three major bandhas and understand how to engage and apply them correctly.",
    },
    {
      title: "6. Meditation",
      desc: "Understand and practise traditional yogic techniques for holistic and mindful development.",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner / Badges */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-wellness-gold/15 text-wellness-goldDark border border-wellness-gold/30 shimmer-badge">
          <Sparkles className="w-3.5 h-3.5 text-wellness-gold" />
          1-Month Intensive Program
        </span>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-wellness-emeraldBg text-wellness-primary border border-wellness-primary/20">
          <Users className="w-3.5 h-3.5" />
          Live Online Classes
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <PlayCircle className="w-3.5 h-3.5 text-amber-700" />
          Recordings Available
        </span>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-wellness-dark tracking-tight leading-[1.15] font-serif">
          Sampoorna{" "}
          <span className="text-wellness-primary italic font-serif underline decoration-wellness-gold/50 decoration-wavy decoration-1">
            Yoga
          </span>
        </h1>
        <p className="text-lg sm:text-xl font-semibold text-wellness-muted">
          A Complete Yogic Journey • Where Body, Breath &amp; Mind Work Together
        </p>
        <p className="text-sm sm:text-base text-wellness-dark/85 leading-relaxed pt-1">
          A one-month online yoga program designed to help you explore yoga beyond just physical postures and experience its different dimensions. Whether you are a beginner or have been practising yoga for some time, this program will help you develop a deeper understanding of yoga through proper techniques, guidance and consistent practice.
        </p>
      </div>

      {/* Program Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-wellness-surface/70 border border-wellness-border/80 flex flex-col justify-between hover:bg-wellness-surface transition-colors shadow-xs">
          <div className="flex items-center gap-2 text-wellness-primary mb-2">
            <Hourglass className="w-4 h-4 text-wellness-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-wellness-muted">
              Duration
            </span>
          </div>
          <span className="text-sm font-bold text-wellness-dark leading-snug">
            1 Month
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-wellness-surface/70 border border-wellness-border/80 flex flex-col justify-between hover:bg-wellness-surface transition-colors shadow-xs">
          <div className="flex items-center gap-2 text-wellness-primary mb-2">
            <Calendar className="w-4 h-4 text-wellness-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-wellness-muted">
              Days
            </span>
          </div>
          <span className="text-sm font-bold text-wellness-dark leading-snug">
            Mon, Wed &amp; Fri
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-wellness-surface/70 border border-wellness-border/80 flex flex-col justify-between hover:bg-wellness-surface transition-colors shadow-xs">
          <div className="flex items-center gap-2 text-wellness-primary mb-2">
            <Clock className="w-4 h-4 text-wellness-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-wellness-muted">
              Timing
            </span>
          </div>
          <span className="text-sm font-bold text-wellness-dark leading-snug">
            7:00 AM – 8:00 AM IST
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-wellness-surface/70 border border-wellness-border/80 flex flex-col justify-between hover:bg-wellness-surface transition-colors shadow-xs">
          <div className="flex items-center gap-2 text-wellness-primary mb-2">
            <Video className="w-4 h-4 text-wellness-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-wellness-muted">
              Mode
            </span>
          </div>
          <span className="text-sm font-bold text-wellness-dark leading-snug">
            Online Classes
          </span>
        </div>
      </div>

      {/* Program Fee & Recording Highlight Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-wellness-primaryDark via-wellness-primary to-wellness-primaryLight text-white shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-wellness-gold/25 text-wellness-goldLight border border-wellness-gold/40">
            <PlayCircle className="w-3.5 h-3.5" />
            RECORDING AVAILABLE FOR SELF PRACTICE
          </div>
          <p className="text-sm text-gray-200">
            Full 1-Month Online Yoga Regime with Guided Mentorship
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs text-gray-300 block font-medium">Program Fee</span>
          <span className="text-3xl font-extrabold text-wellness-goldLight tracking-tight">₹1,500</span>
          <span className="block text-[11px] text-gray-200 uppercase tracking-wider font-semibold">
            Complete Month
          </span>
        </div>
      </div>

      {/* What Will You Learn Section */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-wellness-gold" />
          <h2 className="text-xl font-bold text-wellness-dark font-serif tracking-tight">
            ✨ What Will You Learn?
          </h2>
        </div>

        <div className="space-y-3">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3.5 rounded-xl bg-wellness-cream/90 border border-wellness-border/60 hover:border-wellness-gold/40 hover:bg-white transition-all shadow-sm group"
            >
              <div className="mt-0.5 w-5 h-5 rounded-full bg-wellness-emeraldBg text-wellness-primary flex items-center justify-center shrink-0 group-hover:bg-wellness-primary group-hover:text-white transition-colors">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-wellness-dark group-hover:text-wellness-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-wellness-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructor / Mentor Note Card */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-wellness-primary text-white flex items-center justify-center shrink-0 font-serif font-bold text-sm shadow-xs">
          HK
        </div>
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="text-wellness-dark font-medium leading-relaxed italic">
            &ldquo;Our intention is to help you experience Sampoorna Yoga – where the body, breath and mind work together.&rdquo;
          </p>
          <div className="flex items-center gap-2 text-wellness-primary font-bold text-xs pt-1">
            <span>Harpreet Kaur</span>
            <span className="text-wellness-muted font-normal">•</span>
            <span className="text-wellness-goldDark font-semibold">Yoga Regime 🧘‍♀️</span>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-wellness-border/60">
        <div className="flex items-center gap-2.5 text-xs text-wellness-muted font-medium">
          <Award className="w-4 h-4 text-wellness-gold shrink-0" />
          <span>Beginner &amp; Advanced Friendly</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-wellness-muted font-medium">
          <ShieldCheck className="w-4 h-4 text-wellness-primary shrink-0" />
          <span>Recordings Included For Practice</span>
        </div>
      </div>
    </div>
  );
}
