"use client";

import { Receipt, Zap, Info } from "lucide-react";
import type { AssessmentFormData } from "@/lib/types";

interface Props {
  data: AssessmentFormData;
  onChange: (data: Partial<AssessmentFormData>) => void;
}

export default function ElectricitySection({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-solar-500/8 border border-solar-500/20 p-4 flex gap-3">
        <Info className="w-4 h-4 text-solar-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-navy-800/70 leading-relaxed">
          You can find your average bill and kWh on your Meralco/VECO billing
          statement. This helps us accurately size your solar system.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Average Bill */}
        <div>
          <label className="block text-sm font-semibold text-navy-800 mb-2">
            <span className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-navy-800/50" />
              Average Monthly Bill
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-navy-800/40">
              ₱
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 4,500"
              value={data.monthly_bill_avg}
              onChange={(e) => onChange({ monthly_bill_avg: e.target.value })}
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
              Monthly Energy Usage
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 350"
              value={data.monthly_kwh}
              onChange={(e) => onChange({ monthly_kwh: e.target.value })}
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

      {/* Visual hint */}
      {data.monthly_bill_avg && (
        <div className="rounded-2xl border border-navy-800/8 bg-white p-5">
          <p className="text-xs text-navy-800/50 font-medium uppercase tracking-wide mb-2">
            Estimated Solar Savings
          </p>
          <p className="font-display font-bold text-2xl text-navy-800">
            ₱
            {(
              parseFloat(data.monthly_bill_avg || "0") * 0.7
            ).toLocaleString("en-PH", { maximumFractionDigits: 0 })}
            <span className="text-base font-normal text-navy-800/40">/mo</span>
          </p>
          <p className="text-xs text-navy-800/40 mt-1">
            Based on typical 70% bill reduction with solar
          </p>
        </div>
      )}
    </div>
  );
}
