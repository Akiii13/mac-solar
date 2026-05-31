"use client";

import { Wind, Tv, RefrigeratorIcon as Fridge, AirVent, Flame, Car } from "lucide-react";
import ApplianceRow from "./ApplianceRow";
import type { AssessmentFormData, ApplianceQty } from "@/lib/types";

interface Props {
  data: AssessmentFormData;
  onChange: (data: Partial<AssessmentFormData>) => void;
}

const sectionHeader = (
  Icon: React.ElementType,
  label: string,
  desc?: string
) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-9 h-9 rounded-xl bg-navy-800/5 flex items-center justify-center">
      <Icon className="w-4.5 h-4.5 text-navy-800/60" />
    </div>
    <div>
      <p className="font-semibold text-navy-800 text-sm">{label}</p>
      {desc && <p className="text-xs text-navy-800/45">{desc}</p>}
    </div>
  </div>
);

export default function AppliancesSection({ data, onChange }: Props) {
  const updateAircon = (
    key: keyof typeof data.aircon,
    val: ApplianceQty
  ) => {
    onChange({ aircon: { ...data.aircon, [key]: val } });
  };

  return (
    <div className="space-y-8">
      {/* Electric Fan */}
      <div>
        {sectionHeader(Wind, "Electric Fan", "How many fans are used per time of day?")}
        <ApplianceRow
          label="Electric Fan"
          value={data.fan}
          onChange={(val) => onChange({ fan: val })}
        />
      </div>

      {/* TV */}
      <div>
        {sectionHeader(Tv, "Television", "How many TVs are running per time of day?")}
        <ApplianceRow
          label="TV"
          value={data.tv}
          onChange={(val) => onChange({ tv: val })}
        />
      </div>

      {/* Refrigerator */}
      <div>
        {sectionHeader(Fridge, "Refrigerator", "How many refrigerators do you have?")}
        <ApplianceRow
          label="Refrigerator"
          value={data.ref}
          onChange={(val) => onChange({ ref: val })}
        />
      </div>

      {/* Aircon */}
      <div>
        {sectionHeader(AirVent, "Air Conditioner", "Specify units per HP rating and time of day.")}
        <div className="space-y-3">
          <ApplianceRow
            label="0.5 HP"
            sublabel="~550–650W"
            value={data.aircon.hp_0_5}
            onChange={(val) => updateAircon("hp_0_5", val)}
          />
          <ApplianceRow
            label="1 HP"
            sublabel="~900–1,100W"
            value={data.aircon.hp_1}
            onChange={(val) => updateAircon("hp_1", val)}
          />
          <ApplianceRow
            label="1.5 HP"
            sublabel="~1,300–1,500W"
            value={data.aircon.hp_1_5}
            onChange={(val) => updateAircon("hp_1_5", val)}
          />
          <ApplianceRow
            label="2 HP"
            sublabel="~1,700–2,000W"
            value={data.aircon.hp_2}
            onChange={(val) => updateAircon("hp_2", val)}
          />
          <ApplianceRow
            label="2.5 HP & Higher"
            sublabel="~2,200W+"
            value={data.aircon.hp_2_5_plus}
            onChange={(val) => updateAircon("hp_2_5_plus", val)}
          />
        </div>
      </div>

      {/* Shower Heater */}
      <div>
        {sectionHeader(Flame, "Shower Heater", "Instant water heater units.")}
        <ApplianceRow
          label="Shower Heater"
          sublabel="~3,000–4,500W"
          value={data.shower_heater}
          onChange={(val) => onChange({ shower_heater: val })}
        />
      </div>

      {/* Electric Car */}
      <div>
        {sectionHeader(Car, "Electric Vehicle", "Do you charge an EV at home?")}
        <div className="rounded-2xl border border-navy-800/8 bg-white p-4 space-y-4">
          <div className="flex gap-4">
            {[
              { id: "ev-yes", val: true, label: "Yes, I have an EV" },
              { id: "ev-no", val: false, label: "No EV" },
            ].map((opt) => (
              <label
                key={opt.id}
                htmlFor={opt.id}
                className={`flex items-center gap-3 flex-1 rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                  data.has_electric_car === opt.val
                    ? "border-solar-500/40 bg-solar-500/5"
                    : "border-navy-800/10 hover:border-navy-800/20"
                }`}
              >
                <input
                  type="radio"
                  id={opt.id}
                  name="electric_car"
                  checked={data.has_electric_car === opt.val}
                  onChange={() =>
                    onChange({
                      has_electric_car: opt.val,
                      electric_car_qty: opt.val ? data.electric_car_qty : 0,
                    })
                  }
                  className="accent-solar-500"
                />
                <span className="text-sm font-medium text-navy-800">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>

          {data.has_electric_car && (
            <div className="flex items-center gap-3 pt-1 border-t border-navy-800/8">
              <label className="text-sm font-medium text-navy-800/70">
                How many?
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      electric_car_qty: Math.max(1, data.electric_car_qty - 1),
                    })
                  }
                  className="w-8 h-8 rounded-lg bg-navy-800/5 hover:bg-navy-800/10 flex items-center justify-center transition-colors"
                >
                  <span className="text-lg leading-none">−</span>
                </button>
                <span className="w-6 text-center font-bold text-sm text-navy-800">
                  {data.electric_car_qty || 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ electric_car_qty: (data.electric_car_qty || 1) + 1 })
                  }
                  className="w-8 h-8 rounded-lg bg-navy-800/5 hover:bg-navy-800/10 flex items-center justify-center transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
