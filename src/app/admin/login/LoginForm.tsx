"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Eye, EyeOff, LogIn, AlertCircle, Clock } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { adminLogin } from "@/lib/actions";

const MAX_ATTEMPTS = 3;
const COOLDOWN_SEC  = 30;
const STORAGE_KEY   = "mac_login_cooldown_until";

export default function LoginForm() {
  const formRef                             = useRef<HTMLFormElement>(null);
  const [showPassword,  setShowPassword]    = useState(false);
  const [error,         setError]           = useState<string | null>(null);
  const [isPending,     startTransition]    = useTransition();
  const [failedAttempts,setFailedAttempts]  = useState(0);
  const [cooldown,      setCooldown]        = useState(0);

  // ── Restore an active cooldown that survived page navigation ──────────────
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const remaining = Math.ceil((parseInt(raw, 10) - Date.now()) / 1000);
    if (remaining > 0) {
      setCooldown(remaining);
      setError(`Too many failed attempts. Try again in ${remaining} seconds.`);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // ── Countdown tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((n) => {
        if (n <= 1) {
          clearInterval(id);
          sessionStorage.removeItem(STORAGE_KEY); // clean up persisted key
          setError(null);                          // clear stale error label
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // ── Trigger cooldown and persist expiry so navigation can't bypass it ─────
  const startCooldown = () => {
    const until = Date.now() + COOLDOWN_SEC * 1000;
    sessionStorage.setItem(STORAGE_KEY, String(until));
    setFailedAttempts(0);
    setCooldown(COOLDOWN_SEC);
    setError(`Too many failed attempts. Try again in ${COOLDOWN_SEC} seconds.`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cooldown > 0 || isPending) return;
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adminLogin(formData);
      if (result?.error) {
        const next = failedAttempts + 1;
        if (next >= MAX_ATTEMPTS) {
          startCooldown();
        } else {
          setFailedAttempts(next);
          setError(result.error);
        }
        // Clear password on every failure — never leave a wrong password visible
        const pwInput = formRef.current?.querySelector<HTMLInputElement>('[name="password"]');
        if (pwInput) { pwInput.value = ""; pwInput.focus(); }
      }
    });
  };

  const isLocked = cooldown > 0 || isPending;

  return (
    <div className="min-h-screen bg-brand-blue flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-solar-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-blueDark/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-2xl shadow-navy-950/30 p-8">
          <div className="flex flex-col items-center mb-8">
            <Logo size="md" />
            <p className="text-navy-800/50 text-sm mt-3 font-medium">Admin Portal</p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
                disabled={isLocked}
                placeholder="admin@macsolar.ph"
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={isLocked}
                  placeholder="••••••••"
                  className="input-field pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-800/30 hover:text-navy-800/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              disabled={isLocked}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : cooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  Try again in {cooldown}s
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
