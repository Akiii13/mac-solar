"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AssessmentFormData } from "@/lib/types";

export async function submitAssessment(data: AssessmentFormData) {
  const supabase = createClient();

  const { error } = await supabase.from("assessments").insert({
    fan_day: data.fan.day,
    fan_night: data.fan.night,
    tv_day: data.tv.day,
    tv_night: data.tv.night,
    ref_day: data.ref.day,
    ref_night: data.ref.night,
    ac_05hp_day: data.aircon.hp_0_5.day,
    ac_05hp_night: data.aircon.hp_0_5.night,
    ac_1hp_day: data.aircon.hp_1.day,
    ac_1hp_night: data.aircon.hp_1.night,
    ac_15hp_day: data.aircon.hp_1_5.day,
    ac_15hp_night: data.aircon.hp_1_5.night,
    ac_2hp_day: data.aircon.hp_2.day,
    ac_2hp_night: data.aircon.hp_2.night,
    ac_25hp_day: data.aircon.hp_2_5_plus.day,
    ac_25hp_night: data.aircon.hp_2_5_plus.night,
    heater_day: data.shower_heater.day,
    heater_night: data.shower_heater.night,
    has_electric_car: data.has_electric_car,
    electric_car_qty: data.has_electric_car ? data.electric_car_qty : 0,
    monthly_bill_avg: data.monthly_bill_avg
      ? parseFloat(data.monthly_bill_avg)
      : null,
    monthly_kwh: data.monthly_kwh ? parseFloat(data.monthly_kwh) : null,
    location_address: data.location_address || null,
    location_lat: data.location_lat,
    location_lng: data.location_lng,
  });

  if (error) throw new Error(error.message);
}

export async function adminLogin(formData: FormData) {
  const supabase = createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password required." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid credentials." };

  redirect("/admin");
}

export async function adminLogout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
