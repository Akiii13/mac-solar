"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, Mail } from "lucide-react";
import Logo from "@/components/ui/Logo";
import AppliancesSection from "@/components/assessment/AppliancesSection";
import ElectricitySection from "@/components/assessment/ElectricitySection";
import LocationSection from "@/components/assessment/LocationSection";
import { submitAssessment } from "@/lib/actions";
import { validateEmail } from "@/lib/email-validator";
import { INITIAL_FORM_DATA } from "@/lib/types";
import type { AssessmentFormData } from "@/lib/types";

const STEPS = [
  { id: 1, label: "Appliances" },
  { id: 2, label: "Bill" },
  { id: 3, label: "Location" },
  { id: 4, label: "Email" },
];

function countFilledAppliances(form: AssessmentFormData): number {
  const qtys = [
    form.fan,
    form.tv,
    form.ref,
    form.aircon.hp_0_5,
    form.aircon.hp_1,
    form.aircon.hp_1_5,
    form.aircon.hp_2,
    form.aircon.hp_2_5_plus,
    form.shower_heater,
  ];
  let count = qtys.filter((a) => a.day > 0 || a.night > 0).length;
  if (form.has_electric_car && form.electric_car_qty > 0) count++;
  return count;
}

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AssessmentFormData>(INITIAL_FORM_DATA);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const update = (partial: Partial<AssessmentFormData>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const emailValidation = validateEmail(form.email);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return countFilledAppliances(form) >= 2;
      case 2:
        return !!(form.monthly_bill_avg || form.monthly_kwh);
      case 3:
        return !!(form.location_lat && form.location_lng);
      case 4:
        return emailValidation.valid;
      default:
        return true;
    }
  };

  const getStepError = (): string => {
    switch (step) {
      case 1:
        return `Please add at least 2 appliances. You've added ${countFilledAppliances(form)} so far.`;
      case 2:
        return "Please enter your monthly electricity bill or kWh consumption to continue.";
      case 3:
        return "Please pin your property location on the map before continuing.";
      default:
        return "";
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      setStepError(getStepError());
      return;
    }
    setStepError(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStepError(null);
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    if (!canProceed()) return;
    setSubmitError(null);
    startTransition(async () => {
      try {
        await submitAssessment(form);
        router.push("/thank-you");
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-navy-800/8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-xs text-navy-800/40 font-medium">Free Assessment</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 pb-28">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-0 mb-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => s.id < step && setStep(s.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                    step > s.id
                      ? "bg-solar-500 text-white"
                      : step === s.id
                      ? "bg-navy-800 text-white ring-4 ring-navy-800/10"
                      : "bg-navy-800/10 text-navy-800/30"
                  }`}
                >
                  {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                </button>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 bg-navy-800/10 overflow-hidden">
                    <div
                      className="h-full bg-solar-500 step-line"
                      style={{ width: step > s.id ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-navy-800/40 uppercase tracking-widest">
            {STEPS.map((s) => (
              <span key={s.id} className={step === s.id ? "text-navy-800" : ""}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div
          className="animate-fade-up opacity-0"
          key={step}
          style={{ animationFillMode: "forwards" }}
        >
          {/* Step title */}
          <div className="mb-8">
            {step === 1 && (
              <>
                <p className="section-label mb-1">Step 1 of 4</p>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-800">
                  What Appliances Do You Use?
                </h1>
                <p className="text-navy-800/50 text-sm mt-2">
                  Enter how many of each appliance you typically run during the day and night.{" "}
                  <span className="font-medium text-navy-800/70">At least 2 appliances required.</span>
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <p className="section-label mb-1">Step 2 of 4</p>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-800">
                  Your Monthly Electricity Bill
                </h1>
                <p className="text-navy-800/50 text-sm mt-2">
                  Check your latest VECO or Meralco statement.{" "}
                  <span className="font-medium text-navy-800/70">At least one field required.</span>
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <p className="section-label mb-1">Step 3 of 4</p>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-800">
                  Where Is Your Property?
                </h1>
                <p className="text-navy-800/50 text-sm mt-2">
                  Pin your location so we can plan the best installation approach.{" "}
                  <span className="font-medium text-navy-800/70">Required.</span>
                </p>
              </>
            )}
            {step === 4 && (
              <>
                <p className="section-label mb-1">Step 4 of 4</p>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-800">
                  Where Should We Send Your Results?
                </h1>
                <p className="text-navy-800/50 text-sm mt-2">
                  Our experts will review your details and email you a personalized solar recommendation.
                </p>
              </>
            )}
          </div>

          {/* Section card */}
          <div className="card p-5 sm:p-7">
            {step === 1 && <AppliancesSection data={form} onChange={update} />}
            {step === 2 && <ElectricitySection data={form} onChange={update} />}
            {step === 3 && <LocationSection data={form} onChange={update} />}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-navy-800 mb-2"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/30 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => update({ email: e.target.value })}
                      placeholder="you@example.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-navy-800 placeholder:text-navy-800/30 focus:outline-none focus:ring-2 transition-all text-sm ${
                        form.email && !emailValidation.valid
                          ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
                          : form.email && emailValidation.valid
                          ? "border-green-400 focus:ring-green-500/20"
                          : "border-navy-800/15 focus:ring-solar-500/30 focus:border-solar-500"
                      }`}
                    />
                    {form.email && emailValidation.valid && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  {form.email && !emailValidation.valid && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                      {emailValidation.error}
                    </p>
                  )}
                </div>

                <div className="bg-solar-500/6 border border-solar-500/20 rounded-xl p-4">
                  <p className="text-sm font-semibold text-navy-800 mb-1">
                    What happens next?
                  </p>
                  <ul className="space-y-1 text-sm text-navy-800/60 leading-relaxed">
                    <li>• Our solar experts review your assessment (usually within 1–2 business days)</li>
                    <li>• You receive a personalized recommendation to your email</li>
                    <li>• Includes estimated system size, savings, and next steps</li>
                  </ul>
                </div>

                <p className="text-xs text-navy-800/40 text-center">
                  Your email is only used to send your solar results. We do not share it with third parties.
                </p>
              </div>
            )}
          </div>

          {stepError && (
            <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              <p className="text-sm text-red-600">{stepError}</p>
            </div>
          )}

          {submitError && (
            <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-navy-800/8 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          {step > 1 && (
            <button type="button" onClick={handleBack} className="btn-secondary flex-none">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <div className="flex-1" />

          {step < 4 ? (
            <button type="button" onClick={handleNext} className="btn-primary">
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Submit Assessment
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
