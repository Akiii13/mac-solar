"use client";

import { useState } from "react";
import { Banknote, Zap, Info } from "lucide-react";
import type { AssessmentFormData } from "@/lib/types";

interface Props {
  data: AssessmentFormData;
  onChange: (data: Partial<AssessmentFormData>) => void;
}

function formatWithCommas(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function toNumericString(val: string): string {
  const stripped = val.replace(/,/g, "");
  const match = stripped.match(/^\d*\.?\d*/);
  return match ? match[0] : "";
}

export default function ElectricitySection({ data, onChange }: Props) {
  const [billFocused, setBillFocused] = useState(false);
  const [kwhFocused, setKwhFocused] = useState(false);

  const blockInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-solar-500/8 border border-solar-500/20 p-4 flex gap-3">
        <Info className="w-4 h-4 text-solar-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-navy-800/70 leading-relaxed">
          You can find your average bill and kWh on your LEYECO/VECO billing
          statement. This helps us accurately size your solar system.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Average Bill */}
        <div>
          <label className="block text-sm font-semibold text-navy-800 mb-2">
            <span className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-navy-800/50" />
              Average Monthly Bill <span className="text-red-500">*</span>
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-navy-800/40">
              ₱
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 4,500"
              value={
                billFocused
                  ? data.monthly_bill_avg
                  : formatWithCommas(data.monthly_bill_avg)
              }
              onFocus={() => setBillFocused(true)}
              onBlur={() => setBillFocused(false)}
              onKeyDown={blockInvalidKeys}
              onChange={(e) =>
                onChange({ monthly_bill_avg: toNumericString(e.target.value) })
              }
              className="input-field pl-8"
            />
          </div>
          <p className="text-xs text-navy-800/40 mt-1.5">Philippine Peso (₱)</p>
        </div>

        {/* kWh */}
        <div>
          <label className="block text-sm font-semibold text-navy-800 mb-2">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-navy-800/50" />
              Monthly Energy Usage <span className="text-red-500">*</span>
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 350"
              value={
                kwhFocused
                  ? data.monthly_kwh
                  : formatWithCommas(data.monthly_kwh)
              }
              onFocus={() => setKwhFocused(true)}
              onBlur={() => setKwhFocused(false)}
              onKeyDown={blockInvalidKeys}
              onChange={(e) =>
                onChange({ monthly_kwh: toNumericString(e.target.value) })
              }
              className="input-field pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-navy-800/40">
              kWh
            </span>
          </div>
          <p className="text-xs text-navy-800/40 mt-1.5">
            Found on your monthly billing statement
          </p>
        </div>
      </div>

    </div>
  );
}
