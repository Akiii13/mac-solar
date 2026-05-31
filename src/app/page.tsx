"use client";

import Link from "next/link";
import { ArrowRight, Sun, Zap, ShieldCheck, TrendingDown, ChevronRight } from "lucide-react";
import Logo from "@/components/ui/Logo";

const stats = [
  { value: "₱0", label: "Assessment Cost" },
  { value: "30%", label: "Avg. Bill Reduction" },
  { value: "25yr", label: "Panel Lifespan" },
  { value: "100+", label: "Installations Done" },
];

const benefits = [
  {
    icon: TrendingDown,
    title: "Slash Your Electric Bill",
    desc: "Reduce monthly electricity costs by up to 80% with the right solar setup sized for your home.",
  },
  {
    icon: ShieldCheck,
    title: "Certified Installation",
    desc: "Licensed electricians and DOE-accredited panels. Professional installation with full warranty.",
  },
  {
    icon: Zap,
    title: "Fast ROI",
    desc: "Most clients recover their investment in 3–5 years. Solar pays for itself, then keeps paying you.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-navy-800/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <Link
            href="/admin/login"
            className="btn-ghost text-xs sm:text-sm"
          >
            Admin
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-navy-900 pt-16">
          {/* Background grid */}
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />

          {/* Amber glow */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-solar-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-solar-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-solar-500/15 border border-solar-500/30 mb-6 animate-fade-up opacity-0 stagger-1">
                <Sun className="w-3.5 h-3.5 text-solar-400" />
                <span className="text-solar-400 text-xs font-semibold tracking-wide uppercase">
                  Cebu&apos;s Solar Experts
                </span>
              </div>

              <h1 className="font-display font-bold text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6 animate-fade-up opacity-0 stagger-2">
                Power Your Home{" "}
                <span className="text-solar-400">With the Sun</span>
              </h1>

              <p className="text-white/60 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl animate-fade-up opacity-0 stagger-3">
                Get a free, no-obligation solar assessment. We size the perfect
                system for your exact energy needs — no guesswork.
              </p>

              <div className="flex flex-wrap gap-4 animate-fade-up opacity-0 stagger-4">
                <Link href="/assessment" className="btn-primary text-base px-8 py-4">
                  Start Free Assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#why-solar"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white/70 font-semibold text-base border border-white/15 hover:border-white/30 hover:text-white transition-all duration-200"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 mb-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="card p-6 text-center"
                style={{ animationDelay: `${i * 0.05 + 0.3}s` }}
              >
                <div className="font-display font-bold text-3xl text-navy-800 mb-1">
                  {s.value}
                </div>
                <div className="text-xs text-navy-800/50 font-medium tracking-wide">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Solar */}
        <section id="why-solar" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Why Go Solar</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-navy-800">
              Built for Filipino Homes
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-20">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="card p-8 hover:shadow-md transition-shadow duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-solar-500/10 flex items-center justify-center mb-5 group-hover:bg-solar-500/20 transition-colors duration-300">
                  <b.icon className="w-6 h-6 text-solar-500" />
                </div>
                <h3 className="font-display font-bold text-lg text-navy-800 mb-2">
                  {b.title}
                </h3>
                <p className="text-navy-800/55 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="relative rounded-3xl bg-navy-800 overflow-hidden p-10 md:p-14 text-center">
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-solar-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <p className="section-label text-solar-400 mb-3">Free. No Commitment.</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
                Ready to Cut Your Bill?
              </h2>
              <p className="text-white/55 text-base mb-8 max-w-md mx-auto">
                Answer a few quick questions about your home and we&apos;ll
                design your ideal solar system.
              </p>
              <Link href="/assessment" className="btn-primary text-base px-10 py-4">
                Get My Free Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800/8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-navy-800/40 text-xs text-center">
            © {new Date().getFullYear()} MAC Solar Installation Services. All rights reserved.
          </p>
          <Link
            href="/admin/login"
            className="text-xs text-navy-800/30 hover:text-navy-800/60 transition-colors"
          >
            Admin Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
