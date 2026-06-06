import Link from "next/link";
import {
  ArrowRight, Sun, Zap, ShieldCheck, TrendingDown, ChevronRight,
  Building2, Home, Wrench, BatteryCharging, Layers,
  MapPin, Phone, Mail, Facebook,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONTACT } from "@/lib/types";
import type { ContactInfo } from "@/lib/types";

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

const services = [
  {
    icon: Building2,
    label: "Commercial Installation",
    desc: "Scalable solar solutions for businesses, warehouses, and commercial properties.",
  },
  {
    icon: Home,
    label: "Residential Installation",
    desc: "Custom-sized systems for houses and condominiums across the Visayas region.",
  },
  {
    icon: Wrench,
    label: "Repair, Rehab & Maintenance",
    desc: "Existing system underperforming? We diagnose, repair, and fully restore it.",
  },
];

const systemTypes = [
  {
    icon: Zap,
    label: "Grid-Tied",
    desc: "Stay connected to the grid and export excess power back to the utility.",
  },
  {
    icon: BatteryCharging,
    label: "Off-Grid",
    desc: "Fully independent from the utility grid — ideal for remote locations.",
  },
  {
    icon: Layers,
    label: "Hybrid",
    desc: "Battery backup plus grid connection — the best of both worlds.",
  },
];

export default async function HomePage() {
  // Fetch contact info from DB; fall back to defaults if table not yet created
  let contact: ContactInfo = DEFAULT_CONTACT;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("address, phone, email, facebook")
      .eq("id", "main")
      .single();
    if (data) contact = data as ContactInfo;
  } catch {
    // Table may not exist yet — silently use defaults
  }

  return (
    <div className="min-h-screen bg-[#F5F8FF] flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-blue/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <nav className="flex items-center gap-1 sm:gap-3">
            <a href="#services" className="btn-ghost text-xs sm:text-sm hidden sm:inline-flex">
              Services
            </a>
            <a href="#contact" className="btn-ghost text-xs sm:text-sm hidden sm:inline-flex">
              Contact
            </a>
            <Link href="/admin/login" className="btn-ghost text-xs sm:text-sm">
              Admin
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-navy-900 pt-16">
          {/*
            Royal-blue depth gradient — brings the logo's dominant MAC-letters
            blue into the hero background for an on-brand atmosphere.
          */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-brand-blue/20" />
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-25" />

          {/* Brand-blue atmospheric glow — logo royal blue */}
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />
          {/* Solar gold glow — logo sun color */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-solar-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-solar-500/8 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-solar-500/15 border border-solar-500/30 mb-6 animate-fade-up opacity-0 stagger-1">
                <Sun className="w-3.5 h-3.5 text-solar-400" />
                <span className="text-solar-400 text-xs font-semibold tracking-wide uppercase">
                  Certified Solar Installers
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

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F5F8FF] to-transparent" />
        </section>

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 mb-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="card p-6 text-center"
                style={{ animationDelay: `${i * 0.05 + 0.3}s` }}
              >
                {/* Stat value in brand-blue — the logo's primary color makes numbers pop */}
                <div className="font-display font-bold text-3xl text-brand-blue mb-1">
                  {s.value}
                </div>
                <div className="text-xs text-navy-800/50 font-medium tracking-wide">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why Solar ─────────────────────────────────────────────────────── */}
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
                <div className="w-12 h-12 rounded-2xl bg-brand-blue/8 flex items-center justify-center mb-5 group-hover:bg-brand-blue/15 transition-colors duration-300">
                  <b.icon className="w-6 h-6 text-brand-blue" />
                </div>
                <h3 className="font-display font-bold text-lg text-navy-800 mb-2">
                  {b.title}
                </h3>
                <p className="text-navy-800/55 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Services & System Types ──────────────────────────────────── */}
          <div id="services" className="grid sm:grid-cols-2 gap-6 mb-20">
            <div className="card p-8">
              <p className="section-label mb-3">What We Do</p>
              <h3 className="font-display font-bold text-xl text-navy-800 mb-6">
                Solar Services
              </h3>
              <ul className="space-y-5">
                {services.map((s) => (
                  <li key={s.label} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-solar-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <s.icon className="w-4 h-4 text-solar-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-navy-800">{s.label}</p>
                      <p className="text-navy-800/50 text-xs leading-relaxed mt-0.5">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-8">
              <p className="section-label mb-3">System Types</p>
              <h3 className="font-display font-bold text-xl text-navy-800 mb-6">
                Solar PV Systems
              </h3>
              <ul className="space-y-5">
                {systemTypes.map((s) => (
                  <li key={s.label} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-solar-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <s.icon className="w-4 h-4 text-solar-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-navy-800">{s.label}</p>
                      <p className="text-navy-800/50 text-xs leading-relaxed mt-0.5">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── CTA Banner ───────────────────────────────────────────────── */}
          {/*
            Changed from bg-navy-800 → bg-brand-blue.
            This is the logo's primary royal blue — makes the banner feel
            genuinely on-brand and visually alive rather than generic dark.
          */}
          <div className="relative rounded-3xl bg-brand-blue overflow-hidden p-10 md:p-14 text-center">
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-15" />
            {/* Solar gold glow on brand-blue = perfectly logo-colored */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-solar-500/25 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-brand-blueDark/50 rounded-full blur-3xl" />
            <div className="relative">
              <p className="section-label text-solar-400 mb-3">Free. No Commitment.</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
                Ready to Cut Your Bill?
              </h2>
              <p className="text-white/60 text-base mb-8 max-w-md mx-auto">
                Answer a few quick questions about your home and we&apos;ll
                design your ideal solar system.
              </p>
              {/* White button on brand-blue bg — turns solar-gold on hover */}
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 text-base px-10 py-4 rounded-xl bg-white text-brand-blue font-semibold tracking-wide hover:bg-solar-400 hover:text-navy-900 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get My Free Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Contact ───────────────────────────────────────────────────────── */}
        {/*
          bg-brand-blue instead of bg-navy-900 — uses the logo's primary
          royal blue (MAC letters color) so the section is fully on-brand.
        */}
        <section id="contact" className="bg-brand-blue relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-15" />
          {/* Solar gold glow — logo sun color warming the blue background */}
          <div className="absolute bottom-0 right-1/4 w-96 h-48 bg-solar-500/20 rounded-full blur-3xl pointer-events-none" />
          {/* Deeper blue shadow for dimension */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-brand-blueDark/35 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <div className="text-center mb-12">
              <p className="section-label text-solar-400 mb-3">Reach Us</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
                We&apos;re Based in Leyte
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {/* Location */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-11 h-11 rounded-2xl bg-solar-500/15 flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5 text-solar-400" />
                </div>
                <p className="text-white/40 text-xs font-medium tracking-wide uppercase mb-1">
                  Location
                </p>
                <p className="text-white font-semibold text-sm">{contact.address}</p>
              </div>

              {/* Phone + Email */}
              <div className="flex flex-col gap-3">
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-solar-500/15 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-solar-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Phone</p>
                    <p className="text-white font-semibold text-sm group-hover:text-solar-400 transition-colors">
                      {contact.phone}
                    </p>
                  </div>
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-solar-500/15 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-solar-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-0.5">Email</p>
                    <p className="text-white font-semibold text-sm group-hover:text-solar-400 transition-colors">
                      {contact.email}
                    </p>
                  </div>
                </a>
              </div>

              {/* Facebook */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-11 h-11 rounded-2xl bg-solar-500/15 flex items-center justify-center mb-4">
                  <Facebook className="w-5 h-5 text-solar-400" />
                </div>
                <p className="text-white/40 text-xs font-medium tracking-wide uppercase mb-1">
                  Follow Us
                </p>
                <p className="text-white font-semibold text-sm mb-4">MAC Solar</p>
                <a
                  href={contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-solar-500 text-white font-semibold text-sm hover:bg-solar-400 transition-colors"
                >
                  Visit Page
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-blue/10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-navy-800/40 text-xs text-center">
            © {new Date().getFullYear()} MAC Solar Installation Services. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={contact.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-navy-800/30 hover:text-brand-blue transition-colors flex items-center gap-1.5"
            >
              <Facebook className="w-3.5 h-3.5" />
              Facebook
            </a>
            <Link
              href="/admin/login"
              className="text-xs text-navy-800/30 hover:text-brand-blue transition-colors"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
