"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, Mail, Trash2, ChevronDown, ChevronUp,
  MapPin, Zap, Car, Calendar, Check, X,
  Clock, CheckCircle2, Send, AlertTriangle,
  Users, TrendingDown, Sun, Eye, Copy, ShieldAlert,
} from "lucide-react";
import { adminLogout, deleteAssessment, sendResultEmail } from "@/lib/actions";
import Logo from "@/components/ui/Logo";
import type { Assessment } from "@/lib/types";

type Tab = "pending" | "reviewed" | "duplicates";
interface Toast { type: "success" | "error"; message: string }
interface EmailDraft {
  assessment: Assessment;
  subject: string;
  message: string;
  note: string;
}

interface Props {
  userEmail: string;
  assessments: Assessment[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function countAppliances(a: Assessment) {
  return [
    a.fan_day + a.fan_night,
    a.tv_day + a.tv_night,
    a.ref_day + a.ref_night,
    a.ac_05hp_day + a.ac_05hp_night,
    a.ac_1hp_day + a.ac_1hp_night,
    a.ac_15hp_day + a.ac_15hp_night,
    a.ac_2hp_day + a.ac_2hp_night,
    a.ac_25hp_day + a.ac_25hp_night,
    a.heater_day + a.heater_night,
  ].filter((v) => v > 0).length + (a.has_electric_car ? 1 : 0);
}

function getDuplicateGroups(assessments: Assessment[]) {
  const map = new Map<string, Assessment[]>();
  for (const a of assessments) {
    const key = (a.email ?? "").trim().toLowerCase();
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries())
    .filter(([, items]) => items.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([email, items]) => ({
      email,
      items: [...items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }));
}

function isSpamRisk(items: Assessment[]) {
  if (items.length >= 3) return true;
  const times = items
    .map((a) => new Date(a.created_at).getTime())
    .sort((a, b) => a - b);
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] < 60 * 60 * 1000) return true; // within 1 hour
  }
  return false;
}

const DEFAULT_MESSAGE = `Dear Customer,

Thank you for completing your solar assessment with MAC Solar.

Based on your energy usage and location, here are our recommendations:

[Your recommendation here — include estimated system size, panel count, and expected monthly savings]

To schedule a free site visit or to ask any questions, simply reply to this email or contact us directly.

Best regards,
MAC Solar Team`;

export default function AdminDashboard({ userEmail, assessments }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isPending, startTransition] = useTransition();

  const pending = assessments.filter((a) => a.status === "pending");
  const reviewed = assessments.filter((a) => a.status === "reviewed");
  const rows = activeTab === "pending" ? pending : reviewed;
  const duplicateGroups = getDuplicateGroups(assessments);

  const totalBill = assessments.reduce((s, a) => s + (Number(a.monthly_bill_avg) || 0), 0);
  const avgBill = assessments.length ? totalBill / assessments.length : 0;
  const totalKwh = assessments.reduce((s, a) => s + (Number(a.monthly_kwh) || 0), 0);
  const avgKwh = assessments.length ? totalKwh / assessments.length : 0;
  const evCount = assessments.filter((a) => a.has_electric_car).length;

  const showToast = useCallback((type: Toast["type"], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const openEmailModal = (a: Assessment) => {
    setEmailDraft({
      assessment: a,
      subject: "Your MAC Solar Assessment Results",
      message: DEFAULT_MESSAGE,
      note: "",
    });
  };

  const handleSendEmail = () => {
    if (!emailDraft) return;
    startTransition(async () => {
      const res = await sendResultEmail(
        emailDraft.assessment.id,
        emailDraft.assessment.email!,
        emailDraft.subject,
        emailDraft.message,
        emailDraft.note
      );
      if (res.error) {
        showToast("error", res.error);
      } else {
        setEmailDraft(null);
        showToast("success", "Email sent! Submission moved to Reviewed.");
        router.refresh();
        setActiveTab("reviewed");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const id = deleteId;
    startTransition(async () => {
      const res = await deleteAssessment(id);
      if (res.error) {
        showToast("error", res.error);
      } else {
        setDeleteId(null);
        showToast("success", "Submission deleted.");
        router.refresh();
      }
    });
  };

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const STATS = [
    {
      icon: Users,
      label: "Total Submissions",
      value: assessments.length.toString(),
      sub: "assessments",
    },
    {
      icon: TrendingDown,
      label: "Avg Monthly Bill",
      value: avgBill
        ? `₱${avgBill.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`
        : "—",
      sub: "per household",
    },
    {
      icon: Zap,
      label: "Avg Monthly kWh",
      value: avgKwh ? `${avgKwh.toFixed(0)} kWh` : "—",
      sub: "consumption",
    },
    {
      icon: Sun,
      label: "EV Owners",
      value: evCount.toString(),
      sub: `of ${assessments.length} clients`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-navy-800/8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-navy-800/40 font-medium hidden sm:block">
              {userEmail}
            </span>
            <form action={adminLogout}>
              <button
                type="submit"
                className="btn-ghost text-red-500/70 hover:text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Title */}
        <div>
          <p className="section-label mb-1">Admin Dashboard</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-800">
            Assessment Submissions
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className="w-4 h-4 text-solar-500" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-800/40">
                  {stat.label}
                </p>
              </div>
              <p className="font-display font-bold text-xl text-navy-800">
                {stat.value}
              </p>
              <p className="text-xs text-navy-800/40 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div>
          <div className="flex items-center gap-1 bg-navy-800/5 p-1 rounded-xl w-fit mb-6">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "pending"
                  ? "bg-white text-navy-800 shadow-sm"
                  : "text-navy-800/40 hover:text-navy-800/70"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending
              {pending.length > 0 && (
                <span className="bg-solar-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {pending.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("reviewed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "reviewed"
                  ? "bg-white text-navy-800 shadow-sm"
                  : "text-navy-800/40 hover:text-navy-800/70"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reviewed
              <span className="text-navy-800/30 font-normal text-xs">
                {reviewed.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("duplicates")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "duplicates"
                  ? "bg-white text-navy-800 shadow-sm"
                  : "text-navy-800/40 hover:text-navy-800/70"
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicates
              {duplicateGroups.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {duplicateGroups.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "duplicates" ? (
            duplicateGroups.length === 0 ? (
              <div className="card p-14 text-center">
                <Copy className="w-8 h-8 text-navy-800/15 mx-auto mb-3" />
                <p className="text-navy-800/30 font-medium text-sm">
                  No duplicate emails found.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {duplicateGroups.map(({ email, items }) => {
                  const risk = isSpamRisk(items);
                  const isOpen = expandedEmail === email;
                  return (
                    <div key={email} className="card overflow-hidden">
                      {/* Group header */}
                      <div
                        className="flex items-center gap-3 p-4 sm:p-5 cursor-pointer select-none"
                        onClick={() =>
                          setExpandedEmail((prev) =>
                            prev === email ? null : email
                          )
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-navy-800 truncate">
                              {email}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-navy-800/8 text-navy-800/50 rounded-full">
                              {items.length} submissions
                            </span>
                            {risk && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                                <ShieldAlert className="w-2.5 h-2.5" />
                                Suspicious
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-navy-800/40 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Latest: {formatDate(items[0].created_at)}
                          </p>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-navy-800/30 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-navy-800/30 flex-shrink-0" />
                        )}
                      </div>

                      {/* Submission history */}
                      {isOpen && (
                        <div className="border-t border-navy-800/8 divide-y divide-navy-800/5">
                          {items.map((a, idx) => (
                            <div
                              key={a.id}
                              className="flex items-center gap-3 px-4 sm:px-5 py-3 bg-navy-800/[0.015]"
                            >
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-bold text-navy-800/25">
                                    #{items.length - idx}
                                  </span>
                                  {a.status === "pending" ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-solar-500/10 text-solar-600 rounded-full">
                                      <Clock className="w-2.5 h-2.5" />
                                      Pending
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                      <Check className="w-2.5 h-2.5" />
                                      Reviewed
                                    </span>
                                  )}
                                  <span className="text-xs text-navy-800/40 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(a.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-navy-800/40 flex-wrap">
                                  {a.monthly_bill_avg ? (
                                    <span className="flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      ₱{Number(a.monthly_bill_avg).toLocaleString()}
                                    </span>
                                  ) : null}
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {countAppliances(a)} appliance
                                    {countAppliances(a) !== 1 ? "s" : ""}
                                  </span>
                                  {a.location_address && (
                                    <span className="flex items-center gap-1 truncate max-w-[160px]">
                                      <MapPin className="w-3 h-3 flex-shrink-0" />
                                      {a.location_address}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(a.id);
                                }}
                                className="btn-ghost text-red-400 hover:text-red-500 hover:bg-red-50 py-2 px-2 flex-shrink-0"
                                title="Delete this submission"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : rows.length === 0 ? (
            <div className="card p-14 text-center">
              <p className="text-navy-800/30 font-medium text-sm">
                {activeTab === "pending"
                  ? "No pending submissions yet."
                  : "No reviewed submissions yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((a) => (
                <div key={a.id} className="card overflow-hidden">
                  {/* Row header */}
                  <div className="flex items-center gap-3 p-4 sm:p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-navy-800 truncate">
                          {a.email ?? (
                            <span className="text-navy-800/30 italic">No email</span>
                          )}
                        </span>
                        {a.status === "reviewed" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            <Check className="w-2.5 h-2.5" /> Reviewed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-navy-800/40 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(a.created_at)}
                        </span>
                        {a.location_address && (
                          <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {a.location_address}
                          </span>
                        )}
                        {a.monthly_bill_avg ? (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            ₱{Number(a.monthly_bill_avg).toLocaleString()}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {countAppliances(a)} appliance
                          {countAppliances(a) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {activeTab === "pending" && a.email && (
                        <button
                          onClick={() => openEmailModal(a)}
                          className="btn-primary py-2 px-3 text-xs"
                          title="Send result email to customer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Email</span>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(a.id)}
                        className="btn-ghost text-red-400 hover:text-red-500 hover:bg-red-50 py-2 px-2"
                        title="Delete this submission"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpand(a.id)}
                        className="btn-ghost py-2 px-2"
                        title="View full details"
                      >
                        {expandedId === a.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === a.id && (
                    <div className="border-t border-navy-800/8 p-4 sm:p-5 bg-navy-800/[0.02] space-y-4">
                      <div>
                        <p className="section-label mb-3">Appliances</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { label: "Electric Fan", day: a.fan_day, night: a.fan_night },
                            { label: "TV", day: a.tv_day, night: a.tv_night },
                            { label: "Refrigerator", day: a.ref_day, night: a.ref_night },
                            { label: "Aircon 0.5HP", day: a.ac_05hp_day, night: a.ac_05hp_night },
                            { label: "Aircon 1HP", day: a.ac_1hp_day, night: a.ac_1hp_night },
                            { label: "Aircon 1.5HP", day: a.ac_15hp_day, night: a.ac_15hp_night },
                            { label: "Aircon 2HP", day: a.ac_2hp_day, night: a.ac_2hp_night },
                            { label: "Aircon 2.5HP+", day: a.ac_25hp_day, night: a.ac_25hp_night },
                            { label: "Shower Heater", day: a.heater_day, night: a.heater_night },
                          ]
                            .filter((item) => item.day + item.night > 0)
                            .map((item) => (
                              <div
                                key={item.label}
                                className="bg-white rounded-lg p-3 border border-navy-800/6"
                              >
                                <p className="text-xs font-semibold text-navy-800 mb-1.5">
                                  {item.label}
                                </p>
                                <div className="flex gap-3 text-xs text-navy-800/50">
                                  <span>
                                    Day:{" "}
                                    <strong className="text-navy-800">{item.day}</strong>
                                  </span>
                                  <span>
                                    Night:{" "}
                                    <strong className="text-navy-800">{item.night}</strong>
                                  </span>
                                </div>
                              </div>
                            ))}
                          {a.has_electric_car && (
                            <div className="bg-white rounded-lg p-3 border border-navy-800/6">
                              <p className="text-xs font-semibold text-navy-800 mb-1.5 flex items-center gap-1">
                                <Car className="w-3 h-3" /> Electric Car
                              </p>
                              <p className="text-xs text-navy-800/50">
                                Qty:{" "}
                                <strong className="text-navy-800">
                                  {a.electric_car_qty}
                                </strong>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-navy-800/6">
                          <p className="section-label mb-2">Electricity</p>
                          {a.monthly_bill_avg ? (
                            <p className="text-sm text-navy-800">
                              Bill:{" "}
                              <strong>
                                ₱{Number(a.monthly_bill_avg).toLocaleString()}/mo
                              </strong>
                            </p>
                          ) : (
                            <p className="text-xs text-navy-800/30">No bill entered</p>
                          )}
                          {a.monthly_kwh ? (
                            <p className="text-sm text-navy-800 mt-0.5">
                              kWh:{" "}
                              <strong>
                                {Number(a.monthly_kwh).toFixed(0)} kWh/mo
                              </strong>
                            </p>
                          ) : null}
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-navy-800/6">
                          <p className="section-label mb-2">Location</p>
                          {a.location_address ? (
                            <p className="text-sm text-navy-800">{a.location_address}</p>
                          ) : (
                            <p className="text-xs text-navy-800/30">No address</p>
                          )}
                          {a.location_lat ? (
                            <p className="text-xs text-navy-800/40 mt-1 font-mono">
                              {Number(a.location_lat).toFixed(5)},{" "}
                              {Number(a.location_lng).toFixed(5)}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {a.admin_note && (
                        <div className="bg-solar-500/5 border border-solar-500/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-navy-800 mb-1">
                            Admin Note
                          </p>
                          <p className="text-sm text-navy-800/70">{a.admin_note}</p>
                        </div>
                      )}

                      {a.email_sent_at && (
                        <p className="text-xs text-navy-800/30 flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          Email sent {formatDate(a.email_sent_at)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Email Modal */}
      {emailDraft && (
        <div
          className="fixed inset-0 z-50 bg-navy-800/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => !isPending && setEmailDraft(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-navy-800/8 flex items-start justify-between flex-shrink-0">
              <div>
                <h3 className="font-display font-bold text-navy-800">
                  Send Result to Customer
                </h3>
                <p className="text-xs text-navy-800/50 mt-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {emailDraft.assessment.email}
                </p>
              </div>
              <button
                onClick={() => !isPending && setEmailDraft(null)}
                className="btn-ghost p-2 -mr-1 -mt-1"
                disabled={isPending}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailDraft.subject}
                  onChange={(e) =>
                    setEmailDraft({ ...emailDraft, subject: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-navy-800/15 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  value={emailDraft.message}
                  onChange={(e) =>
                    setEmailDraft({ ...emailDraft, message: e.target.value })
                  }
                  rows={9}
                  className="w-full px-3 py-2.5 rounded-xl border border-navy-800/15 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all resize-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                  Internal Note{" "}
                  <span className="normal-case font-normal text-navy-800/30">
                    (not sent to customer)
                  </span>
                </label>
                <input
                  type="text"
                  value={emailDraft.note}
                  onChange={(e) =>
                    setEmailDraft({ ...emailDraft, note: e.target.value })
                  }
                  placeholder="Optional note for your records…"
                  className="w-full px-3 py-2.5 rounded-xl border border-navy-800/15 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all"
                />
              </div>
              <p className="text-xs text-navy-800/30">
                After sending, this submission will automatically move to the
                Reviewed tab.
              </p>
            </div>

            <div className="p-5 border-t border-navy-800/8 flex gap-3 justify-end flex-shrink-0">
              <button
                onClick={() => setEmailDraft(null)}
                className="btn-secondary"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={
                  isPending ||
                  !emailDraft.subject.trim() ||
                  !emailDraft.message.trim()
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-navy-800/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-display font-bold text-navy-800">
                  Delete Submission?
                </h3>
                <p className="text-sm text-navy-800/50 mt-1 leading-relaxed">
                  This will permanently remove the submission and cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
