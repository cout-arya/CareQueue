"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Users,
  Calendar,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: err } = await signUp.email({
        email,
        password,
        name,
      });

      if (err) {
        setError(err.message || "Registration failed");
        setLoading(false);
        return;
      }

      // After successful signup, redirect to clinic onboarding
      router.push("/onboarding");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — Brand ── */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#004f4f] via-primary to-primary-light overflow-hidden">
        {/* Decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-32 right-10 w-64 h-64 rounded-full bg-white/5 animate-float" />
          <div className="absolute bottom-32 left-16 w-44 h-44 rounded-full bg-white/8 animate-float-delayed" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-headline text-xl font-bold text-white">
              CareQueue
            </span>
          </Link>

          {/* Message */}
          <div className="max-w-sm">
            <h2 className="font-headline text-3xl font-bold text-white leading-tight mb-4">
              Start managing your clinic smarter
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-8">
              Join hundreds of clinics that have eliminated no-shows and recovered lost revenue with CareQueue.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                { icon: <CheckCircle2 className="w-5 h-5" />, title: "Free to start", desc: "No credit card required" },
                { icon: <Users className="w-5 h-5" />, title: "Multi-doctor support", desc: "Add your entire team" },
                { icon: <Calendar className="w-5 h-5" />, title: "Instant setup", desc: "Be live in under 5 minutes" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white/80">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} CareQueue — Smart Clinic Management
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-headline text-lg font-bold text-on-surface">CareQueue</span>
          </div>

          <div className="mb-8">
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              Create your account
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5">
              Sign up and set up your clinic profile in minutes
            </p>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-3.5 rounded-xl text-sm mb-6 flex items-start gap-2.5 animate-fade-up">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
                placeholder="Dr. Sarah Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                placeholder="sarah@clinic.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input !pr-11"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full landing-btn-primary !rounded-xl flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
