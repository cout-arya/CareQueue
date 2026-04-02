"use client";

import Link from "next/link";
import {
  Activity,
  Zap,
  ListOrdered,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Clock,
  Shield,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface overflow-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-headline text-lg font-bold text-on-surface">
              CareQueue
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-on-surface-variant hover:text-on-surface transition">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-on-surface-variant hover:text-on-surface transition">
              How it works
            </a>
            <a href="#stats" className="text-sm text-on-surface-variant hover:text-on-surface transition">
              Results
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition"
            >
              Sign in
            </Link>
            <Link href="/register" className="landing-btn-primary !px-5 !py-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/8 to-primary-light/5 blur-3xl animate-float" />
          <div className="absolute -bottom-20 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-tertiary/5 to-primary/3 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-primary/30 animate-pulse-ring" />
          <div className="absolute top-1/2 left-1/6 w-2 h-2 rounded-full bg-tertiary/30 animate-pulse-ring delay-500" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-8 animate-fade-up">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">
              AI-Powered Clinic Management
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-extrabold text-on-surface leading-[1.08] mb-6 animate-fade-up delay-100">
            Smart Clinic Management,{" "}
            <span className="bg-gradient-to-r from-primary via-primary-light to-[#00b3b3] bg-clip-text text-transparent">
              Zero No-Shows
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            Recover cancelled slots in under 30 seconds. Automate waitlist ranking,
            WhatsApp reminders, and patient engagement — all from one receptionist dashboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <Link href="/register" className="landing-btn-primary flex items-center gap-2 group">
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="landing-btn-secondary flex items-center gap-2">
              Sign in to Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-12 animate-fade-up delay-400">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Shield className="w-3.5 h-3.5 text-primary" />
              HIPAA Ready
            </div>
            <div className="w-1 h-1 rounded-full bg-outline/30" />
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              No Credit Card Required
            </div>
            <div className="w-1 h-1 rounded-full bg-outline/30" />
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Setup in 5 minutes
            </div>
          </div>
        </div>

        {/* Hero Visual — Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto mt-16 animate-fade-up delay-500">
          <div className="relative rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,101,101,0.12)] border border-primary/10">
            <div className="bg-gradient-to-br from-surface-container-low to-surface p-1">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container rounded-t-xl">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-error/60" />
                  <div className="w-3 h-3 rounded-full bg-[#f5a623]/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-surface-container-high rounded-md px-3 py-1 text-[11px] text-outline text-center">
                    carequeue.app/dashboard
                  </div>
                </div>
              </div>
              {/* Dashboard mockup content */}
              <div className="bg-surface p-6 rounded-b-xl min-h-[320px]">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Today's Appointments", value: "24", color: "from-primary/10 to-primary/5" },
                    { label: "Slots Recovered", value: "8", color: "from-[#00b3b3]/10 to-primary-light/5" },
                    { label: "Avg Recovery Time", value: "28s", color: "from-secondary/10 to-secondary/5" },
                    { label: "Active Waitlist", value: "12", color: "from-tertiary/10 to-tertiary/5" },
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-xl p-4 bg-gradient-to-br ${stat.color}`}>
                      <p className="text-2xl font-headline font-bold text-on-surface">{stat.value}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* Timeline preview */}
                  <div className="col-span-1 space-y-2">
                    {["09:00", "09:30", "10:00", "10:30"].map((time) => (
                      <div key={time} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container-low">
                        <span className="text-[11px] font-semibold text-on-surface-variant w-10">{time}</span>
                        <div className="flex-1 h-2 rounded-full bg-primary/20" />
                      </div>
                    ))}
                  </div>
                  {/* Waitlist preview */}
                  <div className="col-span-1 space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-[10px] font-bold">
                          {i}
                        </div>
                        <div className="flex-1">
                          <div className="h-2 rounded-full bg-on-surface/10 w-3/4" />
                          <div className="h-1.5 rounded-full bg-on-surface/5 w-1/2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Activity preview */}
                  <div className="col-span-1 space-y-2">
                    {["📅", "✅", "📱", "🔄"].map((icon, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low">
                        <span className="text-sm">{icon}</span>
                        <div className="flex-1">
                          <div className="h-2 rounded-full bg-on-surface/10 w-full" />
                          <div className="h-1.5 rounded-full bg-on-surface/5 w-2/3 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect behind */}
          <div className="absolute inset-x-10 bottom-0 h-40 bg-gradient-to-t from-primary/6 to-transparent blur-2xl -z-10" />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              Powerful Features
            </p>
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface">
              Everything your clinic needs
            </h2>
            <p className="text-on-surface-variant mt-3 max-w-xl mx-auto">
              From the moment a patient cancels to the moment a waitlisted patient fills the slot — fully automated.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Zap className="w-5 h-5" />,
                title: "Slot Recovery Engine",
                desc: "Automatically detects cancellations and offers the slot to the best-matched waitlisted patient within seconds.",
                gradient: "from-primary/10 to-primary-light/5",
                iconBg: "bg-primary/10 text-primary",
              },
              {
                icon: <ListOrdered className="w-5 h-5" />,
                title: "Smart Waitlist Ranking",
                desc: "Patients are ranked by proximity, reliability score, urgency level, and wait time for optimal slot filling.",
                gradient: "from-tertiary/10 to-tertiary/5",
                iconBg: "bg-tertiary/10 text-tertiary",
              },
              {
                icon: <MessageSquare className="w-5 h-5" />,
                title: "WhatsApp Reminders",
                desc: "Automated appointment reminders at 24h, 2h, and 30min via WhatsApp. SMS fallback included.",
                gradient: "from-[#25D366]/10 to-[#25D366]/5",
                iconBg: "bg-[#25D366]/10 text-[#25D366]",
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: "Recovery Analytics",
                desc: "Track slot fill rates, revenue recovered, and per-doctor recovery performance in real time.",
                gradient: "from-secondary/10 to-secondary/5",
                iconBg: "bg-secondary/10 text-secondary",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/60 hover:shadow-ambient-lg hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`w-11 h-11 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="font-headline text-base font-bold text-on-surface mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              Simple Setup
            </p>
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface">
              Go live in 3 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Register Your Clinic",
                desc: "Create an account and set up your clinic profile with doctors, specialties, and working hours.",
                icon: <Shield className="w-6 h-6 text-primary" />,
              },
              {
                step: "02",
                title: "Import Your Schedule",
                desc: "Add your existing appointments and patient list. Our system starts learning patterns immediately.",
                icon: <Clock className="w-6 h-6 text-primary" />,
              },
              {
                step: "03",
                title: "Let CareQueue Work",
                desc: "Sit back while the receptionist dashboard handles cancellations, waitlist offers, and reminders automatically.",
                icon: <Zap className="w-6 h-6 text-primary" />,
              },
            ].map((step) => (
              <div key={step.step} className="relative text-center group">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white shadow-ambient flex items-center justify-center group-hover:shadow-ambient-lg group-hover:-translate-y-1 transition-all duration-300">
                  {step.icon}
                </div>
                <span className="text-xs font-bold text-primary/50 tracking-widest mb-2 block">
                  STEP {step.step}
                </span>
                <h3 className="font-headline text-lg font-bold text-on-surface mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-primary via-primary-light to-[#009e9e] p-12 md:p-16 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

            <h2 className="font-headline text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
              Results that speak for themselves
            </h2>
            <p className="text-white/70 mb-12 max-w-xl mx-auto relative z-10">
              Clinics using CareQueue recover revenue that would otherwise be lost to no-shows and late cancellations.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              {[
                { value: "95%", label: "Slot Recovery Rate" },
                { value: "28s", label: "Avg Fill Time" },
                { value: "3x", label: "Revenue Recovery" },
                { value: "60%", label: "No-Show Reduction" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-4xl md:text-5xl font-headline font-extrabold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 text-center">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-4">
          Ready to eliminate no-shows?
        </h2>
        <p className="text-on-surface-variant mb-8 max-w-lg mx-auto">
          Set up your clinic in under 5 minutes. No credit card required.
        </p>
        <Link href="/register" className="landing-btn-primary inline-flex items-center gap-2 group">
          Get Started Free
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-outline-variant/20 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-headline text-sm font-bold text-on-surface">CareQueue</span>
          </div>
          <p className="text-xs text-outline">
            © {new Date().getFullYear()} CareQueue. Smart Clinic Management Platform.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface transition">Privacy</a>
            <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface transition">Terms</a>
            <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
