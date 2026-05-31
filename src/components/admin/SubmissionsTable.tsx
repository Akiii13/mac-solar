"use client";

import { useState } from "react";
import {
  Sun,
  Moon,
  MapPin,
  Receipt,
  Zap,
  ChevronDown,
  ChevronUp,
  Wind,
  Tv,
  AirVent,
  Flame,
  Car,
  RefrigeratorIcon,
} from "lucide-react";
import type { Assessment } from "@/lib/types";

interface Props {
  assessments: Assessment[];
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-navy-800/6 text-navy-800/70 text-xs font-medium">
      {children}
    </span>
  );
}

function DayNight({ day, night }: { day: number; night: number }) {
  if (day === 0 && night === 0) return <span className="text-navy-800/20 text-xs">—</span>;
  return (
    <span className="text-xs font-medium text-navy-800/70">
      <span className="text-solar-500">{day}d</span>
      {" / "}
      <span className="text-indigo-400">{night}n</span>
    </span>
  );
}

function AssessmentRow({ a, index }: { a: Assessment; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const totalAppliances =
    a.fan_day + a.fan_night +
    a.tv_day + a.tv_night +
    a.ref_day + a.ref_night +
    a.ac_05hp_day + a.ac_05hp_night +
    a.ac_1hp_day + a.ac_1hp_night +
    a.ac_15hp_day + a.ac_15hp_night +
    a.ac_2hp_day + a.ac_2hp_night +
    a.ac_25hp_day + a.ac_25hp_night +
    a.heater_day + a.heater_night;

  const date = new Date(a.created_at);

  return (
    <div className="card overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-navy-800/2 transition-colors"
      >
        {/* Index */}
        <span className="w-7 h-7 rounded-full bg-navy-800/8 flex items-center justify-center text-xs font-bold text-navy-800/50 flex-shrink-0">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Date */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-navy-800/35 mb-0.5">Date</p>
            <p className="text-sm font-semibold text-navy-800">
              {date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "2-digit" })}
            </p>
            <p className="text-[11px] text-navy-800/40">
              {date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* Bill */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-navy-800/35 mb-0.5">Bill</p>
            <p className="text-sm font-semibold text-navy-800">
              {a.monthly_bill_avg
                ? `₱${Number(a.monthly_bill_avg).toLocaleString("en-PH")}`
                : "—"}
            </p>
            <p className="text-[11px] text-navy-800/40">
              {a.monthly_kwh ? `${Number(a.monthly_kwh).toLocaleString()} kWh` : ""}
            </p>
          </div>

          {/* Appliances count */}
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-wider text-navy-800/35 mb-0.5">Appliances</p>
            <p className="text-sm font-semibold text-navy-800">{totalAppliances} units</p>
            {a.has_electric_car && (
              <Badge>EV</Badge>
            )}
          </div>

          {/* Location */}
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-wider text-navy-800/35 mb-0.5">Location</p>
            <p className="text-sm font-medium text-navy-800 truncate max-w-[160px]">
              {a.location_address
                ? a.location_address.split(",").slice(0, 2).join(",")
                : "Not provided"}
            </p>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-navy-800/30 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-navy-800/30 flex-shrink-0" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-navy-800/8 px-4 sm:px-5 py-5 space-y-5 animate-fade-in">
          {/* Appliances grid */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy-800/40 mb-3">
              Appliance Details
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Wind, label: "Fan", day: a.fan_day, night: a.fan_night },
                { icon: Tv, label: "TV", day: a.tv_day, night: a.tv_night },
                { icon: RefrigeratorIcon, label: "Ref", day: a.ref_day, night: a.ref_night },
                { icon: AirVent, label: "0.5 HP AC", day: a.ac_05hp_day, night: a.ac_05hp_night },
                { icon: AirVent, label: "1 HP AC", day: a.ac_1hp_day, night: a.ac_1hp_night },
                { icon: AirVent, label: "1.5 HP AC", day: a.ac_15hp_day, night: a.ac_15hp_night },
                { icon: AirVent, label: "2 HP AC", day: a.ac_2hp_day, night: a.ac_2hp_night },
                { icon: AirVent, label: "2.5+ HP AC", day: a.ac_25hp_day, night: a.ac_25hp_night },
                { icon: Flame, label: "Heater", day: a.heater_day, night: a.heater_night },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 bg-navy-800/3 rounded-xl p-2.5">
                  <item.icon className="w-4 h-4 text-navy-800/40 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-navy-800/50">{item.label}</p>
                    <DayNight day={item.day} night={item.night} />
                  </div>
                </div>
              ))}

              {/* EV */}
              <div className="flex items-center gap-2.5 bg-navy-800/3 rounded-xl p-2.5">
                <Car className="w-4 h-4 text-navy-800/40 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-navy-800/50">Electric Car</p>
                  <p className="text-xs font-medium text-navy-800/70">
                    {a.has_electric_car ? `${a.electric_car_qty} unit(s)` : "None"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill + Location */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-navy-800/40">
                Electricity
              </p>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-navy-800/40" />
                <span className="text-sm font-medium text-navy-800">
                  {a.monthly_bill_avg
                    ? `₱${Number(a.monthly_bill_avg).toLocaleString("en-PH")}/mo`
                    : "Not provided"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-navy-800/40" />
                <span className="text-sm font-medium text-navy-800">
                  {a.monthly_kwh ? `${Number(a.monthly_kwh).toLocaleString()} kWh/mo` : "Not provided"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-navy-800/40">
                Location
              </p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-navy-800/40 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-navy-800 leading-snug">
                  {a.location_address || "Not provided"}
                </span>
              </div>
              {a.location_lat && a.location_lng && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${a.location_lat}&mlon=${a.location_lng}&zoom=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-solar-600 hover:text-solar-500 font-medium underline-offset-2 hover:underline"
                >
                  View on map →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmissionsTable({ assessments }: Props) {
  if (assessments.length === 0) {
    return (
      <div className="card p-16 text-center">
        <Sun className="w-10 h-10 text-navy-800/15 mx-auto mb-4" />
        <p className="font-display font-bold text-lg text-navy-800/40">
          No assessments yet
        </p>
        <p className="text-sm text-navy-800/30 mt-1">
          Submissions will appear here once customers complete the form.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assessments.map((a, i) => (
        <AssessmentRow key={a.id} a={a} index={i} />
      ))}
    </div>
  );
}
