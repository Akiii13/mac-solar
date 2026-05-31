"use client";

import { Sun, Moon, Minus, Plus } from "lucide-react";
import type { ApplianceQty } from "@/lib/types";

interface ApplianceRowProps {
  label: string;
  sublabel?: string;
  value: ApplianceQty;
  onChange: (val: ApplianceQty) => void;
}

function QtyButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy-800/5 hover:bg-navy-800/10 active:scale-90 transition-all duration-150 text-navy-800/60 hover:text-navy-800 flex-shrink-0"
    >
      {children}
    </button>
  );
}

function QtyControl({
  icon,
  iconColor,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className={`flex items-center gap-1.5 w-14 flex-shrink-0 ${iconColor}`}>
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <QtyButton onClick={() => onChange(Math.max(0, value - 1))}>
          <Minus className="w-3.5 h-3.5" />
        </QtyButton>
        <span className="w-6 text-center font-bold text-sm text-navy-800 tabular-nums">
          {value}
        </span>
        <QtyButton onClick={() => onChange(value + 1)}>
          <Plus className="w-3.5 h-3.5" />
        </QtyButton>
      </div>
    </div>
  );
}

export default function ApplianceRow({
  label,
  sublabel,
  value,
  onChange,
}: ApplianceRowProps) {
  const hasAny = value.day > 0 || value.night > 0;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        hasAny
          ? "border-solar-500/30 bg-solar-500/5"
          : "border-navy-800/8 bg-white hover:border-navy-800/20"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Label */}
        <div className="sm:w-40 flex-shrink-0">
          <p className="font-semibold text-navy-800 text-sm">{label}</p>
          {sublabel && (
            <p className="text-xs text-navy-800/45 mt-0.5">{sublabel}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col xs:flex-row gap-3 flex-1">
          <QtyControl
            icon={<Sun className="w-3.5 h-3.5" />}
            iconColor="text-solar-500"
            label="Day"
            value={value.day}
            onChange={(v) => onChange({ ...value, day: v })}
          />
          <div className="hidden xs:block w-px bg-navy-800/10 self-stretch" />
          <QtyControl
            icon={<Moon className="w-3.5 h-3.5" />}
            iconColor="text-indigo-400"
            label="Night"
            value={value.night}
            onChange={(v) => onChange({ ...value, night: v })}
          />
        </div>
      </div>
    </div>
  );
}
