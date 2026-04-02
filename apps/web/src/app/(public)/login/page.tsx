"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export default function LoginPage() {
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
      const { data, error: err } = await signIn.email({
        email,
        password,
      });

      if (err) {
        setError(err.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — Brand ── */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-primary via-primary-light to-[#009e9e] overflow-hidden">
        {/* Decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/5 animate-float" />
          <div className="absolute bottom-20 right-10 w-52 h-52 rounded-full bg-white/8 animate-float-delayed" />
          <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-white/3" />
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
              Welcome back to your clinic dashboard
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-8">
              Continue managing your appointments, recover cancelled slots, and keep your waitlist patients happy.
            </p>

            {/* Feature pills */}
            <div className="space-y-3">
              {[
                { icon: <Zap className="w-4 h-4" />, text: "Instant slot recovery" },
                { icon: <Shield className="w-4 h-4" />, text: "Secure patient data" },
                { icon: <Clock className="w-4 h-4" />, text: "Real-time dashboard" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/10 backdrop-blur-sm w-fit"
                >
                  <span className="text-white/80">{item.icon}</span>
                  <span className="text-sm text-white/90 font-medium">{item.text}</span>
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
              Sign in
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5">
              Enter your credentials to access the dashboard
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
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                placeholder="you@clinic.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-on-surface">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input !pr-11"
                  placeholder="••••••••"
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
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full landing-btn-primary !rounded-xl flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Register your clinic
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
