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
} from "lucide-react";

export default function WorkshopDetails() {
  const highlights = [
    {
      title: "The Science & Philosophy of Yogic Breathing",
      desc: "Understand how conscious breath regulation revitalizes the nervous system, balances prana, and calms the mind.",
    },
    {
      title: "Diaphragmatic & Full Yogic Breath (Dirga Pranayama)",
      desc: "Expand lung capacity and improve oxygenation through systematic three-part breath integration.",
    },
    {
      title: "Nadi Shodhana & Anulom Vilom for Mental Balance",
      desc: "Harmonize the brain hemispheres, balance energy channels (nadis), and release deep mental tension.",
    },
    {
      title: "Energizing Breaths: Kapalabhati & Bhastrika",
      desc: "Invigorating cleansing practices to detoxify the respiratory system and awaken natural vitality.",
    },
    {
      title: "Cooling & Calming Techniques: Sheetali & Bhramari",
      desc: "Soothe anxiety, cool internal heat, and induce immediate mental stillness with humming sound vibrations.",
    },
    {
      title: "Breath Retention (Kumbhaka) & Vital Energy Control",
      desc: "Safe progression into mindful breath retention to cultivate inner focus, endurance, and meditative calm.",
    },
    {
      title: "Daily Breathwork Protocol & Safe Progression",
      desc: "Establish a 15-minute daily breathing routine with clear precautions, contraindications, and posture alignment.",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner / Tag */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-wellness-gold/15 text-wellness-goldDark border border-wellness-gold/30 shimmer-badge">
          <Sparkles className="w-3.5 h-3.5 text-wellness-gold" />
          Online Masterclass
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-wellness-emeraldBg text-wellness-primary border border-wellness-primary/20">
          <Users className="w-3.5 h-3.5" />
          Interactive Live Session
        </span>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-wellness-dark tracking-tight leading-[1.15] font-serif">
          Master Your Breath,{" "}
          <span className="text-wellness-primary italic font-serif underline decoration-wellness-gold/50 decoration-wavy decoration-1">
            Transform Your Life
          </span>
        </h1>
        <p className="text-lg sm:text-xl font-medium text-wellness-muted">
          The Art of Breathing Workshop
        </p>
      </div>

      {/* Event Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-wellness-surface/70 border border-wellness-border/80 flex flex-col justify-between hover:bg-wellness-surface transition-colors">
          <div className="flex items-center gap-2 text-wellness-primary mb-2">
            <Calendar className="w-4 h-4 text-wellness-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-wellness-muted">
              Date
            </span>
          </div>
          <span className="text-sm font-bold text-wellness-dark leading-snug">
            Saturday, 31st Oct
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-wellness-surface/70 border border-wellness-border/80 flex flex-col justify-between hover:bg-wellness-surface transition-colors">
          <div className="flex items-center gap-2 text-wellness-primary mb-2">
            <Clock className="w-4 h-4 text-wellness-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-wellness-muted">
              Time
            </span>
          </div>
          <span className="text-sm font-bold text-wellness-dark leading-snug">
            8:15 AM IST
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-wellness-surface/70 border border-wellness-border/80 flex flex-col justify-between hover:bg-wellness-surface transition-colors">
          <div className="flex items-center gap-2 text-wellness-primary mb-2">
            <Video className="w-4 h-4 text-wellness-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-wellness-muted">
              Mode
            </span>
          </div>
          <span className="text-sm font-bold text-wellness-dark leading-snug">
            Online (Live)
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-wellness-surface/70 border border-wellness-border/80 flex flex-col justify-between hover:bg-wellness-surface transition-colors">
          <div className="flex items-center gap-2 text-wellness-primary mb-2">
            <Hourglass className="w-4 h-4 text-wellness-gold" />
            <span className="text-xs font-semibold uppercase tracking-wider text-wellness-muted">
              Duration
            </span>
          </div>
          <span className="text-sm font-bold text-wellness-dark leading-snug">
            90 Minutes
          </span>
        </div>
      </div>

      {/* Workshop Access Highlight Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-wellness-primaryDark via-wellness-primary to-wellness-primaryLight text-white shadow-premium flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider text-wellness-goldLight/80 font-medium">
            Complimentary Access Pass
          </span>
          <p className="text-sm text-gray-200">
            Includes live interactive masterclass & Q&A
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs line-through text-gray-300 mr-2">₹499</span>
          <span className="text-3xl font-extrabold text-wellness-goldLight">FREE</span>
          <span className="block text-[11px] text-gray-200 uppercase tracking-wider font-semibold">
            Limited Seats
          </span>
        </div>
      </div>

      {/* What You'll Explore Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-wellness-gold" />
          <h2 className="text-xl font-bold text-wellness-dark font-serif tracking-tight">
            What You&apos;ll Explore
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

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-wellness-border/60">
        <div className="flex items-center gap-2.5 text-xs text-wellness-muted font-medium">
          <Award className="w-4 h-4 text-wellness-gold shrink-0" />
          <span>Practical & guided breakdown</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-wellness-muted font-medium">
          <ShieldCheck className="w-4 h-4 text-wellness-primary shrink-0" />
          <span>Suitable for all practice levels</span>
        </div>
      </div>
    </div>
  );
}
