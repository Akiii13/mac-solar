"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, Mail, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  MapPin, Zap, Car, Calendar, Check, X,
  Clock, CheckCircle2, Send, AlertTriangle,
  Users, Eye, Copy,
  ShieldAlert, ShieldCheck, Shield, Ban,
  Activity, Timer, ArrowUpRight, ArrowDownRight, BarChart2,
  TrendingDown, History,
  EyeOff, KeyRound, Settings,
  Phone, Facebook,
  AtSign, ExternalLink, Navigation,
  // appliance icons
  Lightbulb, Wind, Tv, Monitor, RefrigeratorIcon,
  Utensils, Flame, Coffee, Droplets, AirVent,
  Thermometer, Wrench,
} from "lucide-react";
import {
  adminLogout, deleteAssessment, sendResultEmail,
  blockEmail, unblockEmail,
} from "@/lib/actions";
import { updateContactInfo } from "@/lib/contact-actions"; // ← new
import { logActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";
import type { Assessment, AnalyticsData, ActivityEntry, ActivityActionType, ContactInfo } from "@/lib/types"; // ← added ContactInfo
import { DEFAULT_CONTACT } from "@/lib/types"; // ← new

type Tab = "pending" | "reviewed" | "duplicates" | "analytics" | "history" | "settings";
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
  blockedEmails: string[];
  analytics: AnalyticsData;
  activityLog: ActivityEntry[];
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/assessment": "Assessment Form",
  "/thank-you": "Thank You",
};

// ─── Activity meta ────────────────────────────────────────────────────────────

const ACTION_META: Record<
  ActivityActionType,
  { icon: React.ElementType; bg: string; color: string; label: string }
> = {
  email_sent: {
    icon: Send,
    bg: "bg-solar-500/10",
    color: "text-solar-600",
    label: "Sent Result Email",
  },
  deleted: {
    icon: Trash2,
    bg: "bg-red-50",
    color: "text-red-500",
    label: "Deleted Submission",
  },
  blocked: {
    icon: Ban,
    bg: "bg-navy-800/10",
    color: "text-navy-800/60",
    label: "Blocked Email",
  },
  unblocked: {
    icon: ShieldCheck,
    bg: "bg-green-50",
    color: "text-green-600",
    label: "Unblocked Email",
  },
  password_changed: {
    icon: KeyRound,
    bg: "bg-brand-blue/10",
    color: "text-brand-blue",
    label: "Password Changed",
  },
  email_changed: {
    icon: AtSign,
    bg: "bg-brand-blue/10",
    color: "text-brand-blue",
    label: "Email Changed",
  },
  contact_updated: {
    icon: Settings,
    bg: "bg-brand-blue/10",
    color: "text-brand-blue",
    label: "Contact Info Updated",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  if (diff < MIN) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return "Yesterday";
  return formatDate(iso);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function countAppliances(a: Assessment) {
  return [
    a.lights_day + a.lights_night,
    a.fan_day + a.fan_night,
    a.tv_day + a.tv_night,
    a.desktop_day + a.desktop_night,
    a.ref_day + a.ref_night,
    a.rice_cooker_day + a.rice_cooker_night,
    a.induction_day + a.induction_night,
    a.electric_oven_day + a.electric_oven_night,
    a.coffee_maker_day + a.coffee_maker_night,
    a.water_dispenser_day + a.water_dispenser_night,
    a.ac_05hp_day + a.ac_05hp_night,
    a.ac_1hp_day + a.ac_1hp_night,
    a.ac_15hp_day + a.ac_15hp_night,
    a.ac_2hp_day + a.ac_2hp_night,
    a.ac_25hp_day + a.ac_25hp_night,
    a.wp_05hp_day + a.wp_05hp_night,
    a.wp_1hp_day + a.wp_1hp_night,
    a.wp_15hp_day + a.wp_15hp_night,
    a.wp_2hp_day + a.wp_2hp_night,
    a.wp_3hp_day + a.wp_3hp_night,
    a.heater_day + a.heater_night,
    a.flat_iron_day + a.flat_iron_night,
  ].filter((v) => v > 0).length
    + (a.has_electric_car ? 1 : 0)
    + (a.other_appliances?.filter((oa) => oa.day + oa.night > 0).length ?? 0);
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

type SpamLevel = "high" | "medium" | "likely_legit" | null;

function classifyDuplicate(
  items: Assessment[]
): { level: SpamLevel; reason: string | null } {
  const count = items.length;
  const times = items
    .map((a) => new Date(a.created_at).getTime())
    .sort((a, b) => a - b);

  const ONE_MIN = 60 * 1000;
  const ONE_HOUR = 60 * ONE_MIN;
  const ONE_DAY = 24 * ONE_HOUR;
  const ONE_WEEK = 7 * ONE_DAY;

  const gaps = times.slice(1).map((t, i) => t - times[i]);
  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);
  const totalSpan = times[times.length - 1] - times[0];

  const bill0 = Number(items[0].monthly_bill_avg);
  const apps0 = countAppliances(items[0]);
  const isIdenticalData = items.every(
    (a) => Number(a.monthly_bill_avg) === bill0 && countAppliances(a) === apps0
  );

  const hasReviewed = items.some((a) => a.status === "reviewed");

  const bills = items.map((a) => Number(a.monthly_bill_avg)).filter((v) => v > 0);
  const billVariance =
    bills.length > 1
      ? (Math.max(...bills) - Math.min(...bills)) / Math.max(...bills)
      : 0;

  if (count >= 5)
    return { level: "high", reason: `${count} submissions from one address` };
  if (count >= 3 && minGap < 10 * ONE_MIN)
    return { level: "high", reason: "3+ submissions sent within 10 minutes" };
  if (count >= 3 && isIdenticalData && minGap < ONE_HOUR)
    return { level: "high", reason: "Multiple rapid identical submissions" };

  if (hasReviewed && totalSpan > ONE_WEEK)
    return { level: "likely_legit", reason: "Previously reviewed client who returned weeks later" };
  if (totalSpan > ONE_WEEK && billVariance > 0.15)
    return { level: "likely_legit", reason: "Re-submitted weeks apart with noticeably different bill" };
  if (count === 2 && hasReviewed && maxGap > ONE_DAY)
    return { level: "likely_legit", reason: "Returning client — admin previously engaged with this email" };

  if (count >= 3)
    return { level: "medium", reason: `${count} submissions — no clear spam pattern` };
  if (minGap < ONE_HOUR && isIdenticalData)
    return { level: "medium", reason: "Same data submitted twice within 1 hour" };
  if (minGap < ONE_HOUR)
    return { level: "medium", reason: "Two submissions within 1 hour (data is different)" };

  return { level: null, reason: null };
}

const DEFAULT_MESSAGE = `Dear Customer,

Thank you for completing your solar assessment with MAC Solar.

Based on your energy usage and location, here are our recommendations:

[Your recommendation here — include estimated system size, panel count, and expected monthly savings]

To schedule a free site visit or to ask any questions, simply reply to this email or contact us directly.

Best regards,
MAC Solar Team`;

// ─── Contact field helpers ────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "Phone number is required.";
  if (!digits.startsWith("0")) return "Must start with 0 (e.g. 0950 607 4094).";
  if (digits.length !== 11) return "Must be 11 digits (e.g. 0950 607 4094).";
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
  return null;
}

function normalizeFacebook(raw: string): string {
  const v = raw.trim();
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(www\.)?facebook\.com/i.test(v)) return `https://${v}`;
  return `https://www.facebook.com/${v.replace(/^\/+/, "")}`;
}

function validateFacebook(url: string): string | null {
  if (!url.trim()) return "Facebook Page URL is required.";
  try {
    const { hostname } = new URL(url);
    if (!hostname.endsWith("facebook.com")) return "Must be a facebook.com URL.";
  } catch {
    return "Enter a valid URL (e.g. https://www.facebook.com/...).";
  }
  return null;
}

// ─── Pagination constants ─────────────────────────────────────────────────────

const ROWS_PER_PAGE = 20;
const DUPS_PER_PAGE = 15;
const HIST_PER_PAGE = 25;

// ─── Pagination component ─────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  return (
    <div className="flex items-center justify-between pt-4 px-1">
      <p className="text-xs text-navy-800/40">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="btn-ghost py-1.5 px-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-navy-800/40 px-2">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="btn-ghost py-1.5 px-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard({
  userEmail, assessments, blockedEmails, analytics, activityLog,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteCountdown, setDeleteCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  // Settings — change password
  type PwStep = "form" | "verify" | "done";
  const [pwStep, setPwStep] = useState<PwStep>("form");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwPending, setPwPending] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [blockTarget, setBlockTarget] = useState<string | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<string | null>(null);
  const [mapModal, setMapModal] = useState<Assessment | null>(null);

  // ─── Contact info state ───────────────────────────────────────────────────
  const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [savedContact, setSavedContact] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [contactLoading, setContactLoading] = useState(true);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactErrors, setContactErrors] = useState<Partial<Record<keyof ContactInfo, string>>>({});
  const [contactSaved, setContactSaved] = useState(false);

  // ─── Change email state ───────────────────────────────────────────────────
  type EmailStep = "form" | "verify" | "done";
  const [emailStep, setEmailStep] = useState<EmailStep>("form");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [emailChangePending, setEmailChangePending] = useState(false);

  // ─── Pagination state ─────────────────────────────────────────────────────
  const [pendingPage, setPendingPage] = useState(0);
  const [reviewedPage, setReviewedPage] = useState(0);
  const [duplicatesPage, setDuplicatesPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);

  const pending = useMemo(() => assessments.filter((a) => a.status === "pending"), [assessments]);
  const reviewed = useMemo(() => assessments.filter((a) => a.status === "reviewed"), [assessments]);
  const rows = useMemo(() => activeTab === "pending" ? pending : reviewed, [activeTab, pending, reviewed]);
  const duplicateGroups = useMemo(() => getDuplicateGroups(assessments), [assessments]);
  const hasContactChanges = useMemo(() => JSON.stringify(contact) !== JSON.stringify(savedContact), [contact, savedContact]);

  // Reset pagination and collapse any expanded row whenever the active tab changes
  useEffect(() => {
    setPendingPage(0);
    setReviewedPage(0);
    setDuplicatesPage(0);
    setHistoryPage(0);
    setExpandedId(null);
    setExpandedEmail(null);
  }, [activeTab]);

  // ── Paged slices (derived from memoized base arrays) ──────────────────────
  const pagedRows = useMemo(() => {
    const page = activeTab === "pending" ? pendingPage : reviewedPage;
    return rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
  }, [rows, activeTab, pendingPage, reviewedPage]);

  const pagedDuplicates = useMemo(
    () => duplicateGroups.slice(duplicatesPage * DUPS_PER_PAGE, (duplicatesPage + 1) * DUPS_PER_PAGE),
    [duplicateGroups, duplicatesPage]
  );

  const pagedHistory = useMemo(
    () => activityLog.slice(historyPage * HIST_PER_PAGE, (historyPage + 1) * HIST_PER_PAGE),
    [activityLog, historyPage]
  );

  // Tab config — single source of truth for both nav variants
  interface TabConfig {
    id: Tab;
    icon: React.ElementType;
    label: string;
    badge?: number;
    badgeColor?: "solar" | "red";
    count?: number;
  }
  const TABS: TabConfig[] = [
    {
      id: "pending",
      icon: Clock,
      label: "Pending",
      badge: pending.length > 0 ? pending.length : undefined,
      badgeColor: "solar",
    },
    {
      id: "reviewed",
      icon: CheckCircle2,
      label: "Reviewed",
      count: reviewed.length,
    },
    {
      id: "duplicates",
      icon: Copy,
      label: "Duplicates",
      badge: duplicateGroups.length > 0 ? duplicateGroups.length : undefined,
      badgeColor: "red",
    },
    { id: "analytics", icon: BarChart2, label: "Analytics" },
    { id: "history", icon: History, label: "History" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const STATS = [
    {
      icon: Users,
      label: "Total Submissions",
      value: assessments.length.toString(),
      sub: "all time",
      change: undefined as number | null | undefined,
    },
    {
      icon: Eye,
      label: "Today's Visits",
      value: analytics.todayVisits.toString(),
      sub: "unique sessions",
      change: undefined as number | null | undefined,
    },
    {
      icon: Activity,
      label: "Monthly Visits",
      value: analytics.monthVisits.toString(),
      sub: "this month",
      change: analytics.momVisitChange,
    },
    {
      icon: Timer,
      label: "Avg Session",
      value: analytics.avgSessionDuration
        ? formatDuration(analytics.avgSessionDuration)
        : "—",
      sub: "this month",
      change: analytics.momDurationChange,
    },
  ];

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
    setEmailModalOpen(true);
  };

  // ── Action handlers (each logs on success) ──────────────────────────────────

  const handleSendEmail = () => {
    if (!emailDraft) return;
    const draft = emailDraft;
    startTransition(async () => {
      const res = await sendResultEmail(
        draft.assessment.id,
        draft.assessment.email!,
        draft.subject,
        draft.message,
        draft.note
      );
      if (res.error) {
        showToast("error", res.error);
      } else {
        await logActivity(
          "email_sent",
          draft.assessment.email,
          draft.subject,
          draft.assessment.id
        );
        setEmailDraft(null);
        setEmailModalOpen(false);
        showToast("success", "Email sent! Submission moved to Reviewed.");
        setActiveTab("reviewed");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const id = deleteId;
    const email = assessments.find((a) => a.id === id)?.email ?? null;
    startTransition(async () => {
      const res = await deleteAssessment(id);
      if (res.error) {
        showToast("error", res.error);
      } else {
        await logActivity("deleted", email, null, id);
        setDeleteId(null);
        showToast("success", "Submission deleted.");
        router.refresh();
      }
    });
  };

  const handleBlock = (email: string) => {
    startTransition(async () => {
      const res = await blockEmail(email);
      if (res.error) {
        showToast("error", res.error);
      } else {
        await logActivity("blocked", email, null);
        showToast("success", `${email} blocked — future submissions rejected.`);
        router.refresh();
      }
      setBlockTarget(null);
    });
  };

  const handleUnblock = (email: string) => {
    startTransition(async () => {
      const res = await unblockEmail(email);
      if (res.error) {
        showToast("error", res.error);
      } else {
        await logActivity("unblocked", email, null);
        showToast("success", `${email} unblocked.`);
        router.refresh();
      }
      setUnblockTarget(null);
    });
  };

  // Countdown depends on emailModalOpen — a boolean that only flips on open/close,
  // never on typing. Previously depended on emailDraft directly, which caused the
  // interval to be cleared and restarted on every keystroke (React cleanup fires
  // before each effect re-run whenever a dependency changes).
  useEffect(() => {
    if (!emailModalOpen) { setEmailCountdown(0); return; }
    setEmailCountdown(3);
    const id = setInterval(() => {
      setEmailCountdown((n) => {
        if (n <= 1) { clearInterval(id); return 0; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [emailModalOpen]);

  // Start 3-second countdown whenever the delete modal opens
  useEffect(() => {
    if (!deleteId) { setDeleteCountdown(0); return; }
    setDeleteCountdown(3);
    const id = setInterval(() => {
      setDeleteCountdown((n) => {
        if (n <= 1) { clearInterval(id); return 0; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [deleteId]);

  // ─── Load contact info when Settings tab is opened (new) ─────────────────
  useEffect(() => {
    if (activeTab !== "settings") return;
    setContactLoading(true);
    const supabase = createClient();
    supabase
      .from("site_settings")
      .select("address, phone, email, facebook")
      .eq("id", "main")
      .single()
      .then(({ data }) => {
        if (data) {
          const loaded = data as ContactInfo;
          setContact(loaded);
          setSavedContact(loaded);
        }
        setContactLoading(false);
      });
  }, [activeTab]);

  // ─── Save contact info ────────────────────────────────────────────────────
  const CONTACT_FIELD_LABELS: Record<keyof ContactInfo, string> = {
    address: "Address", phone: "Phone", email: "Email", facebook: "Facebook",
  };

  const handleSaveContact = async () => {
    const errors: Partial<Record<keyof ContactInfo, string>> = {};
    const phoneErr = validatePhone(contact.phone);
    const emailErr = validateEmail(contact.email);
    const fbErr = validateFacebook(contact.facebook);
    if (phoneErr) errors.phone = phoneErr;
    if (emailErr) errors.email = emailErr;
    if (fbErr) errors.facebook = fbErr;
    if (Object.keys(errors).length > 0) { setContactErrors(errors); return; }

    const changedDetails = (Object.keys(contact) as (keyof ContactInfo)[])
      .filter((k) => contact[k] !== savedContact[k])
      .map((k) => CONTACT_FIELD_LABELS[k])
      .join(" · ") || null;

    setContactSaving(true);
    setContactError(null);
    setContactErrors({});
    const res = await updateContactInfo(contact);
    setContactSaving(false);
    if (res.error) {
      setContactError(res.error);
    } else {
      await logActivity("contact_updated", null, changedDetails);
      setSavedContact(contact);
      setContactSaved(true);
      showToast("success", "Contact info updated. Changes are live on the homepage.");
      setTimeout(() => setContactSaved(false), 3000);
      startTransition(() => router.refresh());
    }
  };

  const handleSendEmailCode = async () => {
    const trimmed = newAdminEmail.trim();
    const emailErr = validateEmail(trimmed);
    if (emailErr) { setEmailChangeError(emailErr); return; }
    if (trimmed.toLowerCase() === userEmail.toLowerCase()) {
      setEmailChangeError("New email must be different from your current email.");
      return;
    }
    if (trimmed !== confirmNewEmail.trim()) {
      setEmailChangeError("Emails do not match.");
      return;
    }
    setEmailChangeError(null);
    setEmailChangePending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: userEmail,
      options: { shouldCreateUser: false },
    });
    setEmailChangePending(false);
    if (error) { setEmailChangeError(error.message); return; }
    setEmailStep("verify");
  };

  const handleChangeEmail = async () => {
    if (emailVerifyCode.length < 8) {
      setEmailChangeError("Please enter the full 8-digit code.");
      return;
    }
    setEmailChangeError(null);
    setEmailChangePending(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: userEmail,
      token: emailVerifyCode,
      type: "email",
    });
    if (verifyError) {
      setEmailChangePending(false);
      setEmailChangeError(verifyError.message);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({
      email: newAdminEmail.trim(),
    });
    setEmailChangePending(false);
    if (updateError) { setEmailChangeError(updateError.message); return; }
    await logActivity("email_changed", userEmail, newAdminEmail.trim());
    setEmailStep("done");
    setEmailVerifyCode("");
    startTransition(() => router.refresh());
  };

  const handleSendCode = async () => {
    if (!currentPassword) {
      setPwError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (currentPassword === newPassword) {
      setPwError("New password must be different from your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwError(null);
    setPwPending(true);
    const supabase = createClient();
    // Re-authenticate first to verify the current password is correct
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });
    if (authError) {
      setPwPending(false);
      setPwError("Current password is incorrect.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: userEmail,
      options: { shouldCreateUser: false },
    });
    setPwPending(false);
    if (error) { setPwError(error.message); return; }
    setPwStep("verify");
  };

  const handleChangePassword = async () => {
    if (verifyCode.length < 8) {
      setPwError("Please enter the full 8-digit code.");
      return;
    }
    setPwError(null);
    setPwPending(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: userEmail,
      token: verifyCode,
      type: "email",
    });
    if (verifyError) {
      setPwPending(false);
      setPwError(verifyError.message);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setPwPending(false);
    if (updateError) { setPwError(updateError.message); return; }
    await logActivity("password_changed", userEmail, null);
    setPwStep("done");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVerifyCode("");
    startTransition(() => router.refresh());
  };

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const assessmentStat = analytics.pageStats.find((p) => p.page === "/assessment");
  const stepBreakdown = assessmentStat?.stepBreakdown ?? [];

  // ── Shared badge renderer ────────────────────────────────────────────────────

  const TabBadge = ({ tab }: { tab: TabConfig }) => {
    if (tab.badge !== undefined) {
      return (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none text-white ${tab.badgeColor === "red" ? "bg-red-500" : "bg-solar-500"
            }`}
        >
          {tab.badge}
        </span>
      );
    }
    if (tab.count !== undefined) {
      return (
        <span className="text-navy-800/30 font-normal text-xs">{tab.count}</span>
      );
    }
    return null;
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-blue/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo size="md" />
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

      {/*
        pb-24 on mobile gives clearance for the fixed bottom tab bar.
        sm:pb-0 removes it on desktop where the tabs are inline.
      */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24 sm:pb-8">
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
              <p className="font-display font-bold text-xl text-brand-blue">
                {stat.value}
              </p>
              {stat.change != null ? (
                <p
                  className={`text-xs mt-0.5 flex items-center gap-0.5 font-medium ${stat.change >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                >
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(stat.change)}% vs last month
                </p>
              ) : (
                <p className="text-xs text-navy-800/40 mt-0.5">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Desktop Tab Pills (hidden on mobile) ─────────────────────────── */}
        <div>
          <div className="hidden sm:block overflow-x-auto -mx-1 px-1 pb-1 mb-6">
            <div className="flex items-center gap-1 bg-brand-blue/8 p-1 rounded-xl w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                    ? "bg-white text-brand-blue shadow-sm"
                    : "text-navy-800/40 hover:text-navy-800/70"
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {tab.label}
                  <TabBadge tab={tab} />
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ────────────────────────────────────────────────── */}

          {/* Settings */}
          {activeTab === "settings" ? (
            <div className="max-w-md space-y-8">

              {/* ── Contact Information (new section) ──────────────────────── */}
              <div>
                <div className="mb-4">
                  <p className="section-label mb-1">Homepage Content</p>
                  <h2 className="font-display font-bold text-xl text-navy-800">Contact Information</h2>
                  <p className="text-sm text-navy-800/40 mt-1">
                    Changes go live on the homepage as soon as you save.
                  </p>
                </div>

                <div className="card p-6">
                  {contactLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="w-5 h-5 border-2 border-solar-500/30 border-t-solar-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">

                      {/* Address */}
                      <div>
                        <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                          Location / Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/30 pointer-events-none" />
                          <input
                            type="text"
                            value={contact.address}
                            onChange={(e) => { setContact({ ...contact, address: e.target.value }); setContactError(null); setContactSaved(false); }}
                            placeholder="e.g. Alangalang, Leyte 6517"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-navy-800/15 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                          Phone Number
                          <span className="ml-1 normal-case font-normal text-navy-800/30">(11 digits, e.g. 0950 607 4094)</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/30 pointer-events-none" />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={contact.phone}
                            onChange={(e) => {
                              setContact({ ...contact, phone: formatPhone(e.target.value) });
                              setContactErrors((prev) => ({ ...prev, phone: undefined }));
                              setContactSaved(false);
                            }}
                            placeholder="e.g. 0950 607 4094"
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 transition-all ${contactErrors.phone
                              ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                              : "border-navy-800/15 focus:border-solar-500"
                              }`}
                          />
                        </div>
                        {contactErrors.phone && (
                          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />{contactErrors.phone}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/30 pointer-events-none" />
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) => {
                              setContact({ ...contact, email: e.target.value });
                              setContactErrors((prev) => ({ ...prev, email: undefined }));
                              setContactSaved(false);
                            }}
                            placeholder="e.g. hello@macsolar.com"
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 transition-all ${contactErrors.email
                              ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                              : "border-navy-800/15 focus:border-solar-500"
                              }`}
                          />
                        </div>
                        {contactErrors.email && (
                          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />{contactErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Facebook */}
                      <div>
                        <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                          Facebook Page URL
                        </label>
                        <div className="relative">
                          <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/30 pointer-events-none" />
                          <input
                            type="url"
                            value={contact.facebook}
                            onChange={(e) => {
                              setContact({ ...contact, facebook: e.target.value });
                              setContactErrors((prev) => ({ ...prev, facebook: undefined }));
                              setContactSaved(false);
                            }}
                            onBlur={(e) => {
                              const normalized = normalizeFacebook(e.target.value);
                              setContact((prev) => ({ ...prev, facebook: normalized }));
                            }}
                            placeholder="https://www.facebook.com/..."
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 transition-all ${contactErrors.facebook
                              ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                              : "border-navy-800/15 focus:border-solar-500"
                              }`}
                          />
                        </div>
                        {contactErrors.facebook && (
                          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />{contactErrors.facebook}
                          </p>
                        )}
                      </div>

                      {contactError && (
                        <p className="text-xs text-red-500 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          {contactError}
                        </p>
                      )}

                      <button
                        onClick={handleSaveContact}
                        disabled={contactSaving || !hasContactChanges}
                        className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {contactSaving ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving…
                          </>
                        ) : contactSaved ? (
                          <>
                            <Check className="w-4 h-4" />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider between the two sections */}
              <div className="border-t border-navy-800/8" />

              {/* ── Change Password (original, untouched) ──────────────────── */}
              <div>
                <div className="mb-6">
                  <p className="section-label mb-1">Admin Settings</p>
                  <h2 className="font-display font-bold text-xl text-navy-800">Change Password</h2>
                </div>

                {pwStep === "done" ? (
                  /* ── Success ── */
                  <div className="card p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-display font-bold text-navy-800 mb-2">Password Changed</h3>
                    <p className="text-sm text-navy-800/50 mb-6">Your password has been updated successfully.</p>
                    <button
                      onClick={() => { setPwStep("form"); setPwError(null); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setVerifyCode(""); }}
                      className="btn-secondary text-sm"
                    >
                      Change Again
                    </button>
                  </div>

                ) : pwStep === "verify" ? (
                  /* ── Step 2: Enter OTP ── */
                  <div className="card p-6 space-y-5">
                    <div className="flex items-start gap-3 pb-4 border-b border-navy-800/8">
                      <div className="w-9 h-9 rounded-full bg-solar-500/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-solar-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy-800">Check your email</p>
                        <p className="text-xs text-navy-800/50 mt-0.5">
                          We sent an 8-digit verification code to{" "}
                          <strong className="text-navy-800/70">{userEmail}</strong>
                        </p>
                        <p className="text-xs text-navy-800/35 mt-1.5">
                          Expires in 5 minutes · Not in your inbox? Check your spam or junk folder.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        value={verifyCode}
                        onChange={(e) => {
                          setVerifyCode(e.target.value.replace(/\D/g, ""));
                          setPwError(null);
                        }}
                        placeholder="00000000"
                        className="w-full px-3 py-3 rounded-xl border border-navy-800/15 text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all tracking-[0.4em] font-mono text-center text-xl"
                      />
                    </div>

                    {pwError && (
                      <p className="text-xs text-red-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{pwError}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setPwStep("form"); setVerifyCode(""); setPwError(null); }}
                        className="btn-secondary"
                        disabled={pwPending}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={pwPending || verifyCode.length < 8}
                        className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pwPending ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying…
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />Change Password
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-navy-800/30 text-center">
                      Didn't receive it?{" "}
                      <button
                        onClick={handleSendCode}
                        disabled={pwPending}
                        className="text-solar-600 hover:text-solar-700 font-semibold hover:underline underline-offset-2 disabled:opacity-50"
                      >
                        Resend code
                      </button>
                    </p>
                  </div>

                ) : (
                  /* ── Step 1: New password form ── */
                  <div className="card p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => { setCurrentPassword(e.target.value); setPwError(null); }}
                          placeholder="Your current password"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-navy-800/15 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-800/30 hover:text-navy-800/60 transition-colors"
                        >
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setPwError(null); }}
                          placeholder="Min. 8 characters"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-navy-800/15 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-800/30 hover:text-navy-800/60 transition-colors"
                        >
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setPwError(null); }}
                          placeholder="Re-enter new password"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-navy-800/15 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-800/30 hover:text-navy-800/60 transition-colors"
                        >
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {pwError && (
                      <p className="text-xs text-red-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{pwError}
                      </p>
                    )}

                    <button
                      onClick={handleSendCode}
                      disabled={pwPending || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pwPending ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending code…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />Send Verification Code
                        </>
                      )}
                    </button>

                    <p className="text-xs text-navy-800/30 text-center leading-relaxed">
                      An 8-digit code will be sent to <strong className="text-navy-800/40">{userEmail}</strong> before the password is saved.
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-navy-800/8" />

              {/* ── Change Email ──────────────────────────────────────────── */}
              <div>
                <div className="mb-6">
                  <h2 className="font-display font-bold text-xl text-navy-800">Change Email</h2>
                </div>

                {emailStep === "done" ? (
                  /* ── Success ── */
                  <div className="card p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-display font-bold text-navy-800 mb-2">Email Updated</h3>
                    <p className="text-sm text-navy-800/50 mb-1">Your login email has been updated.</p>
                    <p className="text-sm text-navy-800/40 mb-6 leading-relaxed">
                      Check{" "}
                      <strong className="text-navy-800/60 break-all">{newAdminEmail}</strong>
                      {" "}for a confirmation link if required by your Supabase settings.
                    </p>
                    <button
                      onClick={() => {
                        setEmailStep("form");
                        setEmailChangeError(null);
                        setNewAdminEmail("");
                        setConfirmNewEmail("");
                        setEmailVerifyCode("");
                      }}
                      className="btn-secondary text-sm"
                    >
                      Change Again
                    </button>
                  </div>

                ) : emailStep === "verify" ? (
                  /* ── Step 2: Enter OTP ── */
                  <div className="card p-6 space-y-5">
                    <div className="flex items-start gap-3 pb-4 border-b border-navy-800/8">
                      <div className="w-9 h-9 rounded-full bg-solar-500/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-solar-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy-800">Check your email</p>
                        <p className="text-xs text-navy-800/50 mt-0.5">
                          We sent an 8-digit verification code to{" "}
                          <strong className="text-navy-800/70">{userEmail}</strong>
                        </p>
                        <p className="text-xs text-navy-800/35 mt-1.5">
                          Expires in 5 minutes · Not in your inbox? Check your spam or junk folder.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        value={emailVerifyCode}
                        onChange={(e) => {
                          setEmailVerifyCode(e.target.value.replace(/\D/g, ""));
                          setEmailChangeError(null);
                        }}
                        placeholder="00000000"
                        className="w-full px-3 py-3 rounded-xl border border-navy-800/15 text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all tracking-[0.4em] font-mono text-center text-xl"
                      />
                    </div>

                    {emailChangeError && (
                      <p className="text-xs text-red-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{emailChangeError}
                      </p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setEmailStep("form"); setEmailVerifyCode(""); setEmailChangeError(null); }}
                        className="btn-secondary"
                        disabled={emailChangePending}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleChangeEmail}
                        disabled={emailChangePending || emailVerifyCode.length < 8}
                        className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {emailChangePending ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying…
                          </>
                        ) : (
                          <>
                            <AtSign className="w-4 h-4" />Change Email
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-navy-800/30 text-center">
                      Didn&apos;t receive it?{" "}
                      <button
                        onClick={handleSendEmailCode}
                        disabled={emailChangePending}
                        className="text-solar-600 hover:text-solar-700 font-semibold hover:underline underline-offset-2 disabled:opacity-50"
                      >
                        Resend code
                      </button>
                    </p>
                  </div>

                ) : (
                  /* ── Step 1: New email form ── */
                  <div className="card p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                        New Email Address
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/30 pointer-events-none" />
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => { setNewAdminEmail(e.target.value); setEmailChangeError(null); }}
                          placeholder="Enter new email"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-navy-800/15 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-navy-800/50 uppercase tracking-wider mb-1.5">
                        Confirm New Email
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/30 pointer-events-none" />
                        <input
                          type="email"
                          value={confirmNewEmail}
                          onChange={(e) => { setConfirmNewEmail(e.target.value); setEmailChangeError(null); }}
                          placeholder="Re-enter new email"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-navy-800/15 text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-solar-500/30 focus:border-solar-500 transition-all"
                        />
                      </div>
                    </div>

                    {emailChangeError && (
                      <p className="text-xs text-red-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{emailChangeError}
                      </p>
                    )}

                    <button
                      onClick={handleSendEmailCode}
                      disabled={emailChangePending || !newAdminEmail || !confirmNewEmail}
                      className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {emailChangePending ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending code…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />Send Verification Code
                        </>
                      )}
                    </button>

                    <p className="text-xs text-navy-800/30 text-center leading-relaxed">
                      An 8-digit code will be sent to <strong className="text-navy-800/40">{userEmail}</strong> before the email is changed.
                    </p>
                  </div>
                )}
              </div>
            </div>

          ) : activeTab === "analytics" ? (
            <div className="space-y-6">
              {/* Month-over-Month */}
              <div>
                <p className="section-label mb-3">Month-over-Month</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-solar-500" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-800/40">
                        Visits Change
                      </p>
                    </div>
                    {analytics.momVisitChange != null ? (
                      <>
                        <p className={`font-display font-bold text-xl flex items-center gap-1 ${analytics.momVisitChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {analytics.momVisitChange >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                          {Math.abs(analytics.momVisitChange)}%
                        </p>
                        <p className="text-xs text-navy-800/40 mt-0.5">
                          {analytics.monthVisits} visits vs last month
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-display font-bold text-xl text-navy-800/25">—</p>
                        <p className="text-xs text-navy-800/40 mt-0.5">no prior month data</p>
                      </>
                    )}
                  </div>

                  <div className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-4 h-4 text-solar-500" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-800/40">
                        Session Change
                      </p>
                    </div>
                    {analytics.momDurationChange != null ? (
                      <>
                        <p className={`font-display font-bold text-xl flex items-center gap-1 ${analytics.momDurationChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {analytics.momDurationChange >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                          {Math.abs(analytics.momDurationChange)}%
                        </p>
                        <p className="text-xs text-navy-800/40 mt-0.5">avg session vs last month</p>
                      </>
                    ) : (
                      <>
                        <p className="font-display font-bold text-xl text-navy-800/25">—</p>
                        <p className="text-xs text-navy-800/40 mt-0.5">no prior month data</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Page Performance */}
              <div>
                <p className="section-label mb-3">Page Performance — This Month</p>
                {analytics.pageStats.length === 0 ? (
                  <div className="card p-14 text-center">
                    <BarChart2 className="w-8 h-8 text-navy-800/15 mx-auto mb-3" />
                    <p className="text-navy-800/30 font-medium text-sm">No analytics data yet.</p>
                    <p className="text-navy-800/25 text-xs mt-1">
                      Data appears once visitors browse the live site.
                    </p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-navy-800/8">
                            <th className="text-left px-4 sm:px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-navy-800/40">Page</th>
                            <th className="text-right px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-navy-800/40">Visits</th>
                            <th className="text-right px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-navy-800/40 hidden sm:table-cell">Avg Time</th>
                            <th className="text-right px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-navy-800/40">Exit Rate</th>
                            <th className="text-right px-4 sm:px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-navy-800/40 hidden sm:table-cell">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-800/5">
                          {analytics.pageStats.map((stat) => (
                            <tr key={stat.page} className="hover:bg-navy-800/[0.02] transition-colors">
                              <td className="px-4 sm:px-5 py-3.5">
                                <p className="font-semibold text-navy-800 text-sm">
                                  {PAGE_LABELS[stat.page] ?? stat.page}
                                </p>
                                <p className="text-xs text-navy-800/35 font-mono">{stat.page}</p>
                              </td>
                              <td className="text-right px-3 py-3.5">
                                <span className="font-display font-bold text-navy-800">{stat.visits}</span>
                              </td>
                              <td className="text-right px-3 py-3.5 hidden sm:table-cell">
                                <span className="text-navy-800/60">
                                  {stat.avgDuration != null ? formatDuration(stat.avgDuration) : "—"}
                                </span>
                              </td>
                              <td className="text-right px-3 py-3.5">
                                <span className={`font-semibold ${stat.exitRate > 0.6 ? "text-amber-600" : "text-navy-800/60"}`}>
                                  {Math.round(stat.exitRate * 100)}%
                                </span>
                              </td>
                              <td className="text-right px-4 sm:px-5 py-3.5 hidden sm:table-cell">
                                {stat.isFriction ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                    <AlertTriangle className="w-2.5 h-2.5" />Friction
                                  </span>
                                ) : stat.exitRate > 0.7 && stat.page !== "/thank-you" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-navy-800/8 text-navy-800/50 rounded-full">
                                    Exit Point
                                  </span>
                                ) : (
                                  <span className="text-navy-800/20 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 sm:px-5 py-3 border-t border-navy-800/8 bg-navy-800/[0.02]">
                      <p className="text-xs text-navy-800/40 leading-relaxed">
                        <strong className="text-navy-800/55">Friction:</strong> high avg time + high exit rate.{" "}
                        <strong className="text-navy-800/55">Exit Point:</strong> most sessions end here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Assessment Step Funnel */}
              {stepBreakdown.length > 0 && (
                <div>
                  <p className="section-label mb-3">Assessment Form — Drop-off by Step</p>
                  <div className="card overflow-hidden">
                    <div className="divide-y divide-navy-800/5">
                      {stepBreakdown.map((s) => (
                        <div key={s.step} className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-navy-800/8 flex items-center justify-center flex-shrink-0">
                            <span className="text-[11px] font-bold text-navy-800/50">{s.step}</span>
                          </div>
                          <p className="text-sm font-semibold text-navy-800 w-20 sm:w-28 flex-shrink-0">
                            {s.label}
                          </p>
                          <div className="flex-1 bg-navy-800/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${s.step === 5
                                ? "bg-green-400"
                                : s.exitRate > 0.3
                                  ? "bg-red-400"
                                  : "bg-solar-500"
                                }`}
                              style={{ width: `${Math.round(s.exitRate * 100)}%` }}
                            />
                          </div>
                          <div className="text-right flex-shrink-0 min-w-[80px]">
                            <span
                              className={`text-sm font-bold ${s.step === 5
                                ? "text-green-600"
                                : s.exitRate > 0.3
                                  ? "text-red-500"
                                  : "text-navy-800/60"
                                }`}
                            >
                              {Math.round(s.exitRate * 100)}%
                            </span>
                            <span className="text-xs text-navy-800/35 ml-1.5">
                              {s.exitCount} {s.exitCount === 1 ? "exit" : "exits"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 sm:px-5 py-3 border-t border-navy-800/8 bg-navy-800/[0.02]">
                      <p className="text-xs text-navy-800/40 leading-relaxed">
                        % of assessment visits that left on each step.{" "}
                        <strong className="text-navy-800/55">Step 5 (Review)</strong> = completed and submitted.
                        <span className="inline-flex items-center gap-1 ml-2">
                          <TrendingDown className="w-3 h-3 text-red-400" />
                          <span className="text-red-400">red = high drop-off</span>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            /* ── Activity History tab ─────────────────────────────────────────── */
          ) : activeTab === "history" ? (
            <div className="space-y-4">
              {activityLog.length === 0 ? (
                <div className="card p-14 text-center">
                  <History className="w-8 h-8 text-navy-800/15 mx-auto mb-3" />
                  <p className="text-navy-800/30 font-medium text-sm">No activity recorded yet.</p>
                  <p className="text-navy-800/25 text-xs mt-1">
                    Sending emails, deleting submissions, blocking emails, changing your password, and updating contact info will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Action guide — mirrors Duplicates badge guide placement */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 px-1">
                    <p className="text-xs text-navy-800/40 font-medium">Action guide:</p>
                    {(Object.entries(ACTION_META) as [ActivityActionType, typeof ACTION_META[ActivityActionType]][]).map(
                      ([key, meta]) => {
                        const Icon = meta.icon;
                        return (
                          <span key={key} className="flex items-center gap-1.5 text-[11px] font-bold text-navy-800/50">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                              <Icon className={`w-2.5 h-2.5 ${meta.color}`} />
                            </span>
                            {meta.label}
                          </span>
                        );
                      }
                    )}
                  </div>

                  <div className="card overflow-hidden">
                    {/* Entries */}
                    <div className="divide-y divide-navy-800/5">
                      {pagedHistory.map((entry) => {
                        const meta = ACTION_META[entry.action_type];
                        const Icon = meta.icon;
                        return (
                          <div key={entry.id} className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bg}`}
                            >
                              <Icon className={`w-4 h-4 ${meta.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-navy-800 leading-snug">
                                {meta.label}
                              </p>
                              {entry.target_email && (
                                <p className="text-xs text-navy-800/50 mt-0.5 truncate">
                                  {entry.target_email}
                                </p>
                              )}
                              {entry.details && (
                                <p className="text-xs text-navy-800/35 italic mt-0.5 truncate">
                                  {entry.details}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-navy-800/30 flex-shrink-0 mt-0.5 text-right whitespace-nowrap" suppressHydrationWarning>
                              {formatRelativeTime(entry.created_at)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Pagination
                    page={historyPage}
                    total={activityLog.length}
                    pageSize={HIST_PER_PAGE}
                    onPageChange={(p) => setHistoryPage(p)}
                  />
                </>
              )}
            </div>

            /* ── Duplicates tab ──────────────────────────────────────────────── */
          ) : activeTab === "duplicates" ? (
            duplicateGroups.length === 0 ? (
              <div className="card p-14 text-center">
                <Copy className="w-8 h-8 text-navy-800/15 mx-auto mb-3" />
                <p className="text-navy-800/30 font-medium text-sm">No duplicate emails found.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 px-1">
                  <p className="text-xs text-navy-800/40 font-medium">Badge guide:</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                    <ShieldAlert className="w-2.5 h-2.5" />Likely Spam
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                    <Shield className="w-2.5 h-2.5" />Review Needed
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    <ShieldCheck className="w-2.5 h-2.5" />Likely Legit
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-navy-800 text-white rounded-full">
                    <Ban className="w-2.5 h-2.5" />Blocked
                  </span>
                  <span className="text-[10px] text-navy-800/30 italic">No badge = inconclusive</span>
                </div>

                <div className="space-y-3">
                  {pagedDuplicates.map(({ email, items }) => {
                    const { level, reason } = classifyDuplicate(items);
                    const isBlocked = blockedEmails.includes(email);
                    const isOpen = expandedEmail === email;

                    const accentBorder = isBlocked
                      ? "border-l-4 border-l-navy-800/50"
                      : level === "high" ? "border-l-4 border-l-red-400"
                        : level === "medium" ? "border-l-4 border-l-amber-400"
                          : level === "likely_legit" ? "border-l-4 border-l-green-400"
                            : "";

                    return (
                      <div key={email} className={`card overflow-hidden ${accentBorder}`}>
                        <div
                          className="flex items-center gap-3 p-4 sm:p-5 cursor-pointer select-none"
                          onClick={() =>
                            setExpandedEmail((prev) => (prev === email ? null : email))
                          }
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-navy-800 break-all">
                                {email}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-navy-800/8 text-navy-800/50 rounded-full whitespace-nowrap">
                                {items.length} submissions
                              </span>
                              {isBlocked && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-navy-800 text-white rounded-full whitespace-nowrap">
                                  <Ban className="w-2.5 h-2.5" />Blocked
                                </span>
                              )}
                              {!isBlocked && level === "high" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full whitespace-nowrap">
                                  <ShieldAlert className="w-2.5 h-2.5" />Likely Spam
                                </span>
                              )}
                              {!isBlocked && level === "medium" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full whitespace-nowrap">
                                  <Shield className="w-2.5 h-2.5" />Review Needed
                                </span>
                              )}
                              {!isBlocked && level === "likely_legit" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                                  <ShieldCheck className="w-2.5 h-2.5" />Likely Legit
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-1 gap-0.5">
                              {reason && !isBlocked && (
                                <p className="text-xs text-navy-800/50 italic leading-snug">{reason}</p>
                              )}
                              <p className="text-xs text-navy-800/40 flex items-center gap-1" suppressHydrationWarning>
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                Latest: {formatDate(items[0].created_at)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              isBlocked ? setUnblockTarget(email) : setBlockTarget(email);
                            }}
                            disabled={isPending}
                            className={`flex items-center gap-1 btn-ghost flex-shrink-0 py-1.5 px-2 text-xs font-semibold disabled:opacity-50 ${isBlocked
                              ? "text-green-700 hover:bg-green-50"
                              : "text-navy-800/40 hover:bg-navy-800/8 hover:text-navy-800"
                              }`}
                          >
                            {isBlocked
                              ? <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                              : <Ban className="w-3.5 h-3.5 flex-shrink-0" />
                            }
                            <span className="hidden sm:inline">
                              {isBlocked ? "Unblock" : "Block"}
                            </span>
                          </button>
                          {isOpen
                            ? <ChevronUp className="w-4 h-4 text-navy-800/30 flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-navy-800/30 flex-shrink-0" />
                          }
                        </div>

                        {isOpen && (
                          <div className="border-t border-navy-800/8 divide-y divide-navy-800/5">
                            {items.map((a, idx) => (
                              <div
                                key={a.id}
                                className="flex items-start gap-3 px-4 sm:px-5 py-3 bg-navy-800/[0.015]"
                              >
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold text-navy-800/25">
                                      #{items.length - idx}
                                    </span>
                                    {a.status === "pending" ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-solar-500/10 text-solar-600 rounded-full">
                                        <Clock className="w-2.5 h-2.5" />Pending
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                        <Check className="w-2.5 h-2.5" />Reviewed
                                      </span>
                                    )}
                                    <span className="text-xs text-navy-800/40 flex items-center gap-1" suppressHydrationWarning>
                                      <Calendar className="w-3 h-3 flex-shrink-0" />
                                      {formatDate(a.created_at)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-navy-800/40 flex-wrap">
                                    {a.monthly_bill_avg ? (
                                      <span className="flex items-center gap-1">
                                        <Zap className="w-3 h-3" />₱{Number(a.monthly_bill_avg).toLocaleString()}
                                      </span>
                                    ) : null}
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      {(() => { const n = countAppliances(a); return `${n} appliance${n !== 1 ? "s" : ""}`; })()}
                                    </span>
                                    {a.location_address && (
                                      <span className="flex items-center gap-1 min-w-0">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate max-w-[140px] sm:max-w-[220px]">
                                          {a.location_address}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(a.id);
                                  }}
                                  className="btn-ghost text-red-400 hover:text-red-500 hover:bg-red-50 py-2 px-2 flex-shrink-0 mt-0.5"
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
                <Pagination
                  page={duplicatesPage}
                  total={duplicateGroups.length}
                  pageSize={DUPS_PER_PAGE}
                  onPageChange={(p) => {
                    setExpandedEmail(null);
                    setDuplicatesPage(p);
                  }}
                />
              </>
            )

            /* ── Pending / Reviewed tabs ─────────────────────────────────────── */
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
              {pagedRows.map((a) => (
                <div key={a.id} className="card overflow-hidden">
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
                        <span className="flex items-center gap-1" suppressHydrationWarning>
                          <Calendar className="w-3 h-3" />{formatDate(a.created_at)}
                        </span>
                        {a.location_address && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setMapModal(a); }}
                            className="flex items-center gap-1 truncate max-w-[180px] hover:text-solar-600 hover:underline underline-offset-2 transition-colors"
                            title="View on map"
                          >
                            <MapPin className="w-3 h-3 flex-shrink-0 text-solar-500" />{a.location_address}
                          </button>
                        )}
                        {a.monthly_bill_avg ? (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />₱{Number(a.monthly_bill_avg).toLocaleString()}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {(() => { const n = countAppliances(a); return `${n} appliance${n !== 1 ? "s" : ""}`; })()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {activeTab === "pending" && a.email && (
                        <button
                          onClick={() => openEmailModal(a)}
                          className="btn-primary py-2 px-3 text-xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Email</span>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(a.id)}
                        className="btn-ghost text-red-400 hover:text-red-500 hover:bg-red-50 py-2 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleExpand(a.id)} className="btn-ghost py-2 px-2">
                        {expandedId === a.id
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>

                  {expandedId === a.id && (
                    <div className="border-t border-navy-800/8 p-4 sm:p-5 bg-navy-800/[0.02] space-y-4">
                      <div>
                        <p className="section-label mb-3">Appliances</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {([
                            { label: "Lights",            icon: Lightbulb,      day: a.lights_day,          night: a.lights_night },
                            { label: "Electric Fan",       icon: Wind,           day: a.fan_day,             night: a.fan_night },
                            { label: "TV",                 icon: Tv,             day: a.tv_day,              night: a.tv_night },
                            { label: "Desktop Computer",   icon: Monitor,        day: a.desktop_day,         night: a.desktop_night },
                            { label: "Refrigerator",       icon: RefrigeratorIcon, day: a.ref_day,           night: a.ref_night },
                            { label: "Rice Cooker",        icon: Utensils,       day: a.rice_cooker_day,     night: a.rice_cooker_night },
                            { label: "Induction Cooker",   icon: Flame,          day: a.induction_day,       night: a.induction_night },
                            { label: "Electric Oven",      icon: Flame,          day: a.electric_oven_day,   night: a.electric_oven_night },
                            { label: "Coffee Maker",       icon: Coffee,         day: a.coffee_maker_day,    night: a.coffee_maker_night },
                            { label: "Water Dispenser",    icon: Droplets,       day: a.water_dispenser_day, night: a.water_dispenser_night },
                            { label: "Aircon 0.5HP",       icon: AirVent,        day: a.ac_05hp_day,         night: a.ac_05hp_night },
                            { label: "Aircon 1HP",         icon: AirVent,        day: a.ac_1hp_day,          night: a.ac_1hp_night },
                            { label: "Aircon 1.5HP",       icon: AirVent,        day: a.ac_15hp_day,         night: a.ac_15hp_night },
                            { label: "Aircon 2HP",         icon: AirVent,        day: a.ac_2hp_day,          night: a.ac_2hp_night },
                            { label: "Aircon 2.5HP+",      icon: AirVent,        day: a.ac_25hp_day,         night: a.ac_25hp_night },
                            { label: "Pump 0.5HP",         icon: Droplets,       day: a.wp_05hp_day,         night: a.wp_05hp_night },
                            { label: "Pump 1HP",           icon: Droplets,       day: a.wp_1hp_day,          night: a.wp_1hp_night },
                            { label: "Pump 1.5HP",         icon: Droplets,       day: a.wp_15hp_day,         night: a.wp_15hp_night },
                            { label: "Pump 2HP",           icon: Droplets,       day: a.wp_2hp_day,          night: a.wp_2hp_night },
                            { label: "Pump 3HP+",          icon: Droplets,       day: a.wp_3hp_day,          night: a.wp_3hp_night },
                            { label: "Shower Heater",      icon: Thermometer,    day: a.heater_day,          night: a.heater_night },
                            { label: "Flat Iron",          icon: Zap,            day: a.flat_iron_day,       night: a.flat_iron_night },
                          ] as { label: string; icon: React.ElementType; day: number; night: number }[])
                            .filter((item) => item.day + item.night > 0)
                            .map((item) => {
                              const Icon = item.icon;
                              return (
                                <div
                                  key={item.label}
                                  className="bg-white rounded-lg p-3 border border-navy-800/6"
                                >
                                  <p className="text-xs font-semibold text-navy-800 mb-1.5 flex items-center gap-1">
                                    <Icon className="w-3 h-3 flex-shrink-0" /> {item.label}
                                  </p>
                                  <div className="flex gap-3 text-xs text-navy-800/50">
                                    <span>Day: <strong className="text-navy-800">{item.day}</strong></span>
                                    <span>Night: <strong className="text-navy-800">{item.night}</strong></span>
                                  </div>
                                </div>
                              );
                            })}
                          {a.has_electric_car && (
                            <div className="bg-white rounded-lg p-3 border border-navy-800/6">
                              <p className="text-xs font-semibold text-navy-800 mb-1.5 flex items-center gap-1">
                                <Car className="w-3 h-3 flex-shrink-0" /> Electric Car
                              </p>
                              <p className="text-xs text-navy-800/50">
                                Qty: <strong className="text-navy-800">{a.electric_car_qty}</strong>
                              </p>
                            </div>
                          )}
                          {/* ── Other Appliances ── */}
                          {(a.other_appliances ?? []).map((oa, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-navy-800/6">
                              <p className="text-xs font-semibold text-navy-800 mb-1.5 flex items-center gap-1">
                                <Wrench className="w-3 h-3 flex-shrink-0" /> {oa.name}
                              </p>
                              <div className="flex gap-3 text-xs text-navy-800/50">
                                <span>Day: <strong className="text-navy-800">{oa.day}</strong></span>
                                <span>Night: <strong className="text-navy-800">{oa.night}</strong></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-navy-800/6">
                          <p className="section-label mb-2">Electricity</p>
                          {a.monthly_bill_avg ? (
                            <p className="text-sm text-navy-800">
                              Bill: <strong>₱{Number(a.monthly_bill_avg).toLocaleString()}/mo</strong>
                            </p>
                          ) : (
                            <p className="text-xs text-navy-800/30">No bill entered</p>
                          )}
                          {a.monthly_kwh ? (
                            <p className="text-sm text-navy-800 mt-0.5">
                              kWh: <strong>{Number(a.monthly_kwh).toFixed(0)} kWh/mo</strong>
                            </p>
                          ) : null}
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-navy-800/6">
                          <p className="section-label mb-2">Location</p>
                          {a.location_address ? (
                            <>
                              <p className="text-sm text-navy-800">{a.location_address}</p>
                              {a.location_lat ? (
                                <p className="text-xs text-navy-800/40 mt-1 font-mono">
                                  {Number(a.location_lat).toFixed(5)},{" "}
                                  {Number(a.location_lng).toFixed(5)}
                                </p>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setMapModal(a)}
                                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-solar-600 hover:text-solar-700 hover:underline underline-offset-2 transition-colors"
                              >
                                <MapPin className="w-3 h-3" />
                                View on Map
                              </button>
                            </>
                          ) : (
                            <p className="text-xs text-navy-800/30">No address</p>
                          )}
                        </div>
                      </div>

                      {a.admin_note && (
                        <div className="bg-solar-500/5 border border-solar-500/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-navy-800 mb-1">Admin Note</p>
                          <p className="text-sm text-navy-800/70">{a.admin_note}</p>
                        </div>
                      )}

                      {a.email_sent_at && (
                        <p className="text-xs text-navy-800/30 flex items-center gap-1.5" suppressHydrationWarning>
                          <Mail className="w-3 h-3" />Email sent {formatDate(a.email_sent_at)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <Pagination
                page={activeTab === "pending" ? pendingPage : reviewedPage}
                total={rows.length}
                pageSize={ROWS_PER_PAGE}
                onPageChange={(p) => {
                  setExpandedId(null);
                  if (activeTab === "pending") setPendingPage(p);
                  else setReviewedPage(p);
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar (hidden on sm+) ─────────────────────────────── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-blue/10">
        <div className="flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${isActive ? "text-solar-500" : "text-navy-800/35"
                  }`}
              >
                {/* Icon + badge */}
                <div className="relative">
                  <tab.icon className="w-5 h-5" />
                  {tab.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2 min-w-[15px] h-[15px] flex items-center justify-center text-[9px] font-bold px-1 rounded-full text-white ${tab.badgeColor === "red" ? "bg-red-500" : "bg-solar-500"
                        }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-solar-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Location Map Modal ───────────────────────────────────────────────── */}
      {mapModal && (() => {
        const lat = mapModal.location_lat;
        const lng = mapModal.location_lng;
        const addr = mapModal.location_address;
        const hasCoords = !!(lat && lng);

        // All URLs open in a new tab — no API key required
        const googleMapsUrl = hasCoords
          ? `https://www.google.com/maps?q=${lat},${lng}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr ?? "")}`;
        const streetViewUrl = hasCoords
          ? `https://maps.google.com/?cbll=${lat},${lng}&layer=c`
          : null;
        // OpenStreetMap embed — free, no key, iframe sandboxed for security
        const osmSrc = hasCoords
          ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.012},${lng + 0.012},${lat + 0.012}&layer=mapnik&marker=${lat},${lng}`
          : null;

        return (
          <div
            className="fixed inset-0 z-50 bg-navy-800/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setMapModal(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: "90dvh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-3 p-5 border-b border-navy-800/8 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-solar-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-solar-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-navy-800 leading-snug">
                    Customer Location
                  </h3>
                  {addr ? (
                    <p className="text-sm text-navy-800/60 mt-0.5 leading-snug break-words">
                      {addr}
                    </p>
                  ) : (
                    <p className="text-sm text-navy-800/30 italic mt-0.5">No address provided</p>
                  )}
                  {hasCoords && (
                    <p className="text-[11px] text-navy-800/35 font-mono mt-1 select-all">
                      {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMapModal(null)}
                  className="btn-ghost py-1.5 px-1.5 flex-shrink-0 -mt-0.5 -mr-0.5"
                  aria-label="Close map"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Map — OpenStreetMap iframe, no API key, lazy-loaded, sandboxed */}
              {osmSrc ? (
                <div className="relative bg-navy-800/[0.04]" style={{ height: "280px" }}>
                  <iframe
                    title={`Map of ${addr ?? "customer location"}`}
                    src={osmSrc}
                    className="w-full h-full border-0"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1.5 right-2 text-[9px] text-black/40 pointer-events-none select-none bg-white/60 px-1 py-0.5 rounded">
                    © OpenStreetMap contributors
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 bg-navy-800/[0.03]" style={{ height: "180px" }}>
                  <MapPin className="w-8 h-8 text-navy-800/15" />
                  <p className="text-sm text-navy-800/30 font-medium text-center px-4">
                    {addr ? "No GPS coordinates — use the button below to search by address" : "No location data available"}
                  </p>
                </div>
              )}

              {/* Action buttons — open in new tab */}
              <div className="p-4 flex flex-col sm:flex-row gap-2.5 border-t border-navy-800/8 flex-shrink-0">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 justify-center text-sm"
                >
                  <MapPin className="w-4 h-4" />
                  Google Maps
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
                {streetViewUrl && (
                  <a
                    href={streetViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex-1 justify-center text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Street View
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Email Modal ────────────────────────────────────────────────────────── */}
      {emailDraft && (
        <div
          className="fixed inset-0 z-50 bg-navy-800/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => { if (!isPending) { setEmailDraft(null); setEmailModalOpen(false); } }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-navy-800/8 flex items-start justify-between flex-shrink-0">
              <div>
                <h3 className="font-display font-bold text-navy-800">Send Result to Customer</h3>
                <p className="text-xs text-navy-800/50 mt-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {emailDraft.assessment.email}
                </p>
              </div>
              <button
                onClick={() => { if (!isPending) { setEmailDraft(null); setEmailModalOpen(false); } }}
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
                After sending, this submission will automatically move to the Reviewed tab.
              </p>
            </div>
            <div className="p-5 border-t border-navy-800/8 flex gap-3 justify-end flex-shrink-0">
              <button
                onClick={() => { setEmailDraft(null); setEmailModalOpen(false); }}
                className="btn-secondary"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={
                  isPending ||
                  emailCountdown > 0 ||
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
                ) : emailCountdown > 0 ? (
                  <>
                    <Clock className="w-4 h-4 opacity-70" />
                    Send in {emailCountdown}s
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      {deleteId && (() => {
        const da = assessments.find((x) => x.id === deleteId);
        return (
          <div className="fixed inset-0 z-50 bg-navy-800/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-navy-800">Delete Submission?</h3>
                  <p className="text-sm text-navy-800/50 mt-1 leading-relaxed">
                    This will permanently remove the submission and cannot be undone.
                  </p>
                </div>
              </div>
              {/* Submission details */}
              {da && (
                <div className="mb-5 rounded-xl border border-red-100 bg-red-50/60 divide-y divide-red-100 text-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-3.5 py-2.5">
                    <Mail className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="font-semibold text-navy-800 truncate">
                      {da.email ?? <span className="italic text-navy-800/40">No email</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2.5">
                    <Calendar className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="text-navy-800/60" suppressHydrationWarning>{formatDate(da.created_at)}</span>
                  </div>
                  {da.location_address ? (
                    <div className="flex items-center gap-2 px-3.5 py-2.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span className="text-navy-800/60 truncate">{da.location_address}</span>
                    </div>
                  ) : null}
                  {da.monthly_bill_avg ? (
                    <div className="flex items-center gap-2 px-3.5 py-2.5">
                      <Zap className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span className="text-navy-800/60">₱{Number(da.monthly_bill_avg).toLocaleString()}/mo</span>
                    </div>
                  ) : null}
                </div>
              )}
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
                  disabled={isPending || deleteCountdown > 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : deleteCountdown > 0 ? (
                    <Clock className="w-4 h-4 opacity-70" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isPending
                    ? "Deleting…"
                    : deleteCountdown > 0
                      ? `Delete in ${deleteCountdown}s`
                      : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Block Confirm ────────────────────────────────────────────────────── */}
      {blockTarget && (
        <div className="fixed inset-0 z-50 bg-navy-800/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-navy-800/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Ban className="w-5 h-5 text-navy-800/60" />
              </div>
              <div>
                <h3 className="font-display font-bold text-navy-800">Block this email?</h3>
                <p className="text-sm text-navy-800/50 mt-1 leading-relaxed">
                  <strong className="font-semibold text-navy-800/70 break-all">{blockTarget}</strong>
                  {" "}will be blocked — any future submissions from this address will be automatically rejected.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBlockTarget(null)}
                className="btn-secondary flex-1"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlock(blockTarget!)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-900 active:bg-navy-950 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                {isPending ? "Blocking…" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unblock Confirm ──────────────────────────────────────────────────── */}
      {unblockTarget && (
        <div className="fixed inset-0 z-50 bg-navy-800/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-navy-800">Unblock this email?</h3>
                <p className="text-sm text-navy-800/50 mt-1 leading-relaxed">
                  <strong className="font-semibold text-navy-800/70 break-all">{unblockTarget}</strong>
                  {" "}will be unblocked — future submissions from this address will be accepted again.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setUnblockTarget(null)}
                className="btn-secondary flex-1"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnblock(unblockTarget!)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {isPending ? "Unblocking…" : "Unblock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-20 sm:bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === "success"
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
            }`}
        >
          {toast.type === "success"
            ? <Check className="w-4 h-4 flex-shrink-0" />
            : <X className="w-4 h-4 flex-shrink-0" />
          }
          {toast.message}
        </div>
      )}
    </div>
  );
}
