import { redirect } from "next/navigation";
import { LogOut, Sun, Users, TrendingDown, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { adminLogout } from "@/lib/actions";
import Logo from "@/components/ui/Logo";
import SubmissionsTable from "@/components/admin/SubmissionsTable";
import type { Assessment } from "@/lib/types";

export const revalidate = 0; // always fresh

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: assessments, error } = await supabase
    .from("assessments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (assessments ?? []) as Assessment[];

  // Quick stats
  const totalBill = rows.reduce((s, a) => s + (Number(a.monthly_bill_avg) || 0), 0);
  const avgBill = rows.length ? totalBill / rows.length : 0;
  const totalKwh = rows.reduce((s, a) => s + (Number(a.monthly_kwh) || 0), 0);
  const avgKwh = rows.length ? totalKwh / rows.length : 0;
  const evCount = rows.filter((a) => a.has_electric_car).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-navy-800/8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-navy-800/40 font-medium hidden sm:block">
              {user.email}
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
          {[
            {
              icon: Users,
              label: "Total Submissions",
              value: rows.length.toString(),
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
              sub: `of ${rows.length} clients`,
            },
          ].map((stat) => (
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

        {/* Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-navy-800">
              All Submissions
            </h2>
            <span className="text-xs text-navy-800/40 font-medium">
              {rows.length} total
            </span>
          </div>
          <SubmissionsTable assessments={rows} />
        </div>
      </main>
    </div>
  );
}
