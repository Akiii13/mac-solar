"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, Plug } from "lucide-react";
import Logo from "@/components/ui/Logo";
import AppliancesSection from "@/components/assessment/AppliancesSection";
import ElectricitySection from "@/components/assessment/ElectricitySection";
import LocationSection from "@/components/assessment/LocationSection";
import { submitAssessment } from "@/lib/actions";
import { INITIAL_FORM_DATA } from "@/lib/types";
import type { AssessmentFormData } from "@/lib/types";

const STEPS = [
  { id: 1, label: "Appliances", icon: Plug },
  { id: 2, label: "Bill", icon: null },
  { id: 3, label: "Location", icon: null },
];

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AssessmentFormData>(INITIAL_FORM_DATA);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const update = (partial: Partial<AssessmentFormData>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const canProceed = () => {
    if (step === 3) {
      return !!form.location_lat && !!form.location_lng;
    }
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await submitAssessment(form);
        router.push("/thank-you");
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-navy-800/8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-xs text-navy-800/40 font-medium">
            Free Assessment
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 pb-24">
        {/* Progress */}
        <div className="mb-8">
          {/* Step dots + line */}
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
                  {step > s.id ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    s.id
                  )}
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

          {/* Labels */}
          <div className="flex justify-between text-[11px] font-semibold text-navy-800/40 uppercase tracking-widest">
            {STEPS.map((s) => (
              <span
                key={s.id}
                className={step === s.id ? "text-navy-800" : ""}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="animate-fade-up opacity-0" key={step} style={{ animationFillMode: "forwards" }}>
          {/* Title */}
          <div className="mb-8">
            {step === 1 && (
              <>
                <p className="section-label mb-1">Step 1 of 3</p>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-800">
                  What Appliances Do You Use?
                </h1>
                <p className="text-navy-800/50 text-sm mt-2">
                  Enter how many of each appliance you typically run during the
                  day and night.
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <p className="section-label mb-1">Step 2 of 3</p>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-800">
                  Your Monthly Electricity Bill
                </h1>
                <p className="text-navy-800/50 text-sm mt-2">
                  Check your latest VECO or Meralco statement for these figures.
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <p className="section-label mb-1">Step 3 of 3</p>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-800">
                  Where Is Your Property?
                </h1>
                <p className="text-navy-800/50 text-sm mt-2">
                  Pin your location so we can plan the best installation approach.
                </p>
              </>
            )}
          </div>

          {/* Sections */}
          <div className="card p-5 sm:p-7">
            {step === 1 && <AppliancesSection data={form} onChange={update} />}
            {step === 2 && <ElectricitySection data={form} onChange={update} />}
            {step === 3 && <LocationSection data={form} onChange={update} />}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
        )}
      </main>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-navy-800/8 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary flex-none"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <div className="flex-1" />

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
            >
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
