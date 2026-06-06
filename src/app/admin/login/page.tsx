"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { adminLogin } from "@/lib/actions";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adminLogin(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    /*
     * bg-brand-blue replaces bg-navy-900 (#081529).
     * The full-page background now uses the logo's primary royal blue
     * (MAC letters color) — consistent with the contact section and
     * CTA banner on the homepage.
     */
    <div className="min-h-screen bg-brand-blue flex flex-col items-center justify-center px-4">
      {/* Background texture */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-15 pointer-events-none" />
      {/* Solar gold glow — logo sun color, visible against the brand-blue bg */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-solar-500/20 rounded-full blur-3xl pointer-events-none" />
      {/* Deeper blue shadow for depth */}
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-blueDark/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-navy-950/30 p-8">
          <div className="flex flex-col items-center mb-8">
            <Logo size="md" />
            <p className="text-navy-800/50 text-sm mt-3 font-medium">
              Admin Portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-navy-800 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@macsolar.ph"
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-navy-800 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-800/30 hover:text-navy-800/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          MAC Solar Admin Portal · Restricted Access
        </p>
      </div>
    </div>
  );
}
