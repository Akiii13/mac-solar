"use client";

import { useState } from "react";
import {
  Lightbulb, Tv, RefrigeratorIcon as Fridge,
  AirVent, Droplets, Flame, Car, Wrench,
  ChevronDown, ChevronUp, Minus, Plus,
  Sun, Moon, Trash2,
} from "lucide-react";
import ApplianceRow from "./ApplianceRow";
import type { AssessmentFormData, ApplianceQty, OtherAppliance } from "@/lib/types";

const OTHER_MAX = 10;
const NAME_MAX = 50;

interface Props {
  data: AssessmentFormData;
  onChange: (data: Partial<AssessmentFormData>) => void;
}

// ─── Category accordion ───────────────────────────────────────────────────────

function CategoryAccordion({
  icon: Icon,
  title,
  description,
  activeCount,
  defaultOpen = false,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  activeCount: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || activeCount > 0);

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-colors duration-200 ${
        activeCount > 0 ? "border-solar-500/25" : "border-navy-800/8"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 bg-white hover:bg-navy-800/[0.02] active:bg-navy-800/[0.04] transition-colors text-left"
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            activeCount > 0 ? "bg-solar-500/10" : "bg-navy-800/5"
          }`}
        >
          <Icon
            className={`w-5 h-5 transition-colors ${
              activeCount > 0 ? "text-solar-500" : "text-navy-800/50"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-800 text-sm">{title}</p>
          <p className="text-xs text-navy-800/45 mt-0.5">{description}</p>
        </div>
        {activeCount > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 bg-solar-500/10 text-solar-600 rounded-full whitespace-nowrap flex-shrink-0">
            {activeCount} unit{activeCount !== 1 ? "s" : ""}
          </span>
        )}
        {open ? (
          <ChevronUp className="w-4 h-4 text-navy-800/30 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-navy-800/30 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-navy-800/8 p-4 space-y-3 bg-navy-800/[0.012]">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Sub-section label ────────────────────────────────────────────────────────

function SubLabel({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-semibold text-navy-800/40 uppercase tracking-wider pt-1">
      {label}
    </p>
  );
}

// ─── Other Appliance row ──────────────────────────────────────────────────────

function OtherApplianceRow({
  item,
  onChange,
  onRemove,
}: {
  item: OtherAppliance;
  onChange: (val: OtherAppliance) => void;
  onRemove: () => void;
}) {
  const hasAny = item.day > 0 || item.night > 0;
  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        hasAny
          ? "border-solar-500/30 bg-solar-500/5"
          : "border-navy-800/8 bg-white hover:border-navy-800/20"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value.slice(0, NAME_MAX) })}
          placeholder="Appliance name…"
          maxLength={NAME_MAX}
          className="flex-1 px-3 py-2 rounded-xl border border-navy-800/15 text-sm text-navy-800 placeholder:text-navy-800/30 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 bg-white transition-all"
        />
        <button
          type="button"
          onClick={onRemove}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-800/30 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col xs:flex-row gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 w-14 flex-shrink-0 text-solar-500">
            <Sun className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Day</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...item, day: Math.max(0, item.day - 1) })}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy-800/5 hover:bg-navy-800/10 active:scale-90 transition-all duration-150 text-navy-800/60 hover:text-navy-800 flex-shrink-0"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-bold text-sm text-navy-800 tabular-nums">
              {item.day}
            </span>
            <button
              type="button"
              onClick={() => onChange({ ...item, day: item.day + 1 })}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy-800/5 hover:bg-navy-800/10 active:scale-90 transition-all duration-150 text-navy-800/60 hover:text-navy-800 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="hidden xs:block w-px bg-navy-800/10 self-stretch" />
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 w-14 flex-shrink-0 text-navy-600">
            <Moon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Night</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...item, night: Math.max(0, item.night - 1) })}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy-800/5 hover:bg-navy-800/10 active:scale-90 transition-all duration-150 text-navy-800/60 hover:text-navy-800 flex-shrink-0"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-bold text-sm text-navy-800 tabular-nums">
              {item.night}
            </span>
            <button
              type="button"
              onClick={() => onChange({ ...item, night: item.night + 1 })}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy-800/5 hover:bg-navy-800/10 active:scale-90 transition-all duration-150 text-navy-800/60 hover:text-navy-800 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sum = (q: ApplianceQty) => q.day + q.night;

// ─── Main component ───────────────────────────────────────────────────────────

export default function AppliancesSection({ data, onChange }: Props) {
  const updateAircon = (key: keyof typeof data.aircon, val: ApplianceQty) =>
    onChange({ aircon: { ...data.aircon, [key]: val } });

  const updatePump = (key: keyof typeof data.water_pump, val: ApplianceQty) =>
    onChange({ water_pump: { ...data.water_pump, [key]: val } });

  const lightsFanCount = sum(data.lights) + sum(data.fan);
  const entertainmentCount = sum(data.tv) + sum(data.desktop);
  const kitchenCount =
    sum(data.ref) +
    sum(data.rice_cooker) +
    sum(data.induction_cooker) +
    sum(data.electric_oven) +
    sum(data.coffee_maker) +
    sum(data.water_dispenser);
  const airconCount = Object.values(data.aircon).reduce((s, q) => s + sum(q), 0);
  const pumpCount = Object.values(data.water_pump).reduce((s, q) => s + sum(q), 0);
  const utilitiesCount = sum(data.shower_heater) + sum(data.flat_iron);
  const evCount = data.has_electric_car ? data.electric_car_qty : 0;
  const otherCount = data.other_appliances.reduce((s, a) => s + a.day + a.night, 0);

  return (
    <div className="space-y-3">
      {/* ── 1. Lighting & Fans ─────────────────────────────────────────────── */}
      <CategoryAccordion
        icon={Lightbulb}
        title="Lighting & Fans"
        description="Light bulbs, fixtures, and electric fans."
        activeCount={lightsFanCount}
        defaultOpen
      >
        <ApplianceRow
          label="Lights"
          sublabel="All bulbs & fixtures (LED, fluorescent, etc.)"
          value={data.lights}
          onChange={(val) => onChange({ lights: val })}
        />
        <ApplianceRow
          label="Electric Fan"
          sublabel="Desk, stand, ceiling, exhaust"
          value={data.fan}
          onChange={(val) => onChange({ fan: val })}
        />
      </CategoryAccordion>

      {/* ── 2. Entertainment & Work ────────────────────────────────────────── */}
      <CategoryAccordion
        icon={Tv}
        title="Entertainment & Work"
        description="Television and desktop computer."
        activeCount={entertainmentCount}
      >
        <ApplianceRow
          label="Television"
          value={data.tv}
          onChange={(val) => onChange({ tv: val })}
        />
        <ApplianceRow
          label="Desktop Computer"
          sublabel="PC + monitor (~150–400W)"
          value={data.desktop}
          onChange={(val) => onChange({ desktop: val })}
        />
      </CategoryAccordion>

      {/* ── 3. Kitchen & Cooking ───────────────────────────────────────────── */}
      <CategoryAccordion
        icon={Fridge}
        title="Kitchen & Cooking"
        description="Refrigerator and kitchen appliances."
        activeCount={kitchenCount}
      >
        <ApplianceRow
          label="Refrigerator"
          sublabel="~100–400W"
          value={data.ref}
          onChange={(val) => onChange({ ref: val })}
        />
        <ApplianceRow
          label="Rice Cooker"
          sublabel="~400–700W"
          value={data.rice_cooker}
          onChange={(val) => onChange({ rice_cooker: val })}
        />
        <ApplianceRow
          label="Induction Cooker"
          sublabel="~1,000–2,000W"
          value={data.induction_cooker}
          onChange={(val) => onChange({ induction_cooker: val })}
        />
        <ApplianceRow
          label="Electric Oven"
          sublabel="~1,000–2,000W"
          value={data.electric_oven}
          onChange={(val) => onChange({ electric_oven: val })}
        />
        <ApplianceRow
          label="Coffee Maker"
          sublabel="~600–1,200W"
          value={data.coffee_maker}
          onChange={(val) => onChange({ coffee_maker: val })}
        />
        <ApplianceRow
          label="Water Dispenser"
          sublabel="~500–800W"
          value={data.water_dispenser}
          onChange={(val) => onChange({ water_dispenser: val })}
        />
      </CategoryAccordion>

      {/* ── 4. Air Conditioner ─────────────────────────────────────────────── */}
      <CategoryAccordion
        icon={AirVent}
        title="Air Conditioner"
        description="Specify units per HP rating."
        activeCount={airconCount}
      >
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
      </CategoryAccordion>

      {/* ── 5. Water Pump ──────────────────────────────────────────────────── */}
      <CategoryAccordion
        icon={Droplets}
        title="Water Pump"
        description="Deep well, submersible, or booster pumps."
        activeCount={pumpCount}
      >
        <ApplianceRow
          label="0.5 HP"
          sublabel="~370W"
          value={data.water_pump.hp_0_5}
          onChange={(val) => updatePump("hp_0_5", val)}
        />
        <ApplianceRow
          label="1 HP"
          sublabel="~750W"
          value={data.water_pump.hp_1}
          onChange={(val) => updatePump("hp_1", val)}
        />
        <ApplianceRow
          label="1.5 HP"
          sublabel="~1,100W"
          value={data.water_pump.hp_1_5}
          onChange={(val) => updatePump("hp_1_5", val)}
        />
        <ApplianceRow
          label="2 HP"
          sublabel="~1,500W"
          value={data.water_pump.hp_2}
          onChange={(val) => updatePump("hp_2", val)}
        />
        <ApplianceRow
          label="3 HP & Higher"
          sublabel="~2,200W+"
          value={data.water_pump.hp_3_plus}
          onChange={(val) => updatePump("hp_3_plus", val)}
        />
      </CategoryAccordion>

      {/* ── 6. Personal Care & Utilities ───────────────────────────────────── */}
      <CategoryAccordion
        icon={Flame}
        title="Personal Care & Utilities"
        description="Shower heater and flat iron."
        activeCount={utilitiesCount}
      >
        <ApplianceRow
          label="Shower Heater"
          sublabel="~3,000–4,500W"
          value={data.shower_heater}
          onChange={(val) => onChange({ shower_heater: val })}
        />
        <ApplianceRow
          label="Flat Iron"
          sublabel="~1,000–2,500W"
          value={data.flat_iron}
          onChange={(val) => onChange({ flat_iron: val })}
        />
      </CategoryAccordion>

      {/* ── 7. Electric Vehicle ────────────────────────────────────────────── */}
      <CategoryAccordion
        icon={Car}
        title="Electric Vehicle"
        description="Do you charge an EV at home?"
        activeCount={evCount}
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            {[
              { id: "ev-yes", val: true,  label: "Yes, I have an EV" },
              { id: "ev-no",  val: false, label: "No EV" },
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
                      electric_car_qty: opt.val
                        ? Math.max(1, data.electric_car_qty)
                        : 0,
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
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-sm text-navy-800">
                  {data.electric_car_qty}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      electric_car_qty: (data.electric_car_qty || 1) + 1,
                    })
                  }
                  className="w-8 h-8 rounded-lg bg-navy-800/5 hover:bg-navy-800/10 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </CategoryAccordion>

      {/* ── 8. Other Appliances ────────────────────────────────────────────── */}
      <CategoryAccordion
        icon={Wrench}
        title="Other Appliances"
        description={`Anything not listed above (max ${OTHER_MAX}).`}
        activeCount={otherCount}
      >
        <div className="space-y-3">
          {data.other_appliances.map((item, idx) => (
            <OtherApplianceRow
              key={idx}
              item={item}
              onChange={(val) =>
                onChange({
                  other_appliances: data.other_appliances.map((a, i) =>
                    i === idx ? val : a
                  ),
                })
              }
              onRemove={() =>
                onChange({
                  other_appliances: data.other_appliances.filter((_, i) => i !== idx),
                })
              }
            />
          ))}
          {data.other_appliances.length < OTHER_MAX ? (
            <button
              type="button"
              onClick={() =>
                onChange({
                  other_appliances: [
                    ...data.other_appliances,
                    { name: "", day: 0, night: 0 },
                  ],
                })
              }
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-navy-800/20 text-sm font-semibold text-navy-800/40 hover:text-navy-800/60 hover:border-navy-800/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Appliance
            </button>
          ) : (
            <p className="text-center text-xs text-navy-800/35 py-2">
              Maximum {OTHER_MAX} custom appliances reached.
            </p>
          )}
        </div>
      </CategoryAccordion>
    </div>
  );
}
