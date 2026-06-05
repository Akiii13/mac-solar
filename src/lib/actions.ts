"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateEmail, escapeHtml } from "@/lib/email-validator";
import type { AssessmentFormData } from "@/lib/types";

// ─── Customer: Submit Assessment ──────────────────────────────────────────────

export async function submitAssessment(data: AssessmentFormData) {
  const supabase = createClient();

  const emailCheck = validateEmail(data.email);
  if (!emailCheck.valid) {
    throw new Error(emailCheck.error ?? "Invalid email address.");
  }

  const normalised = data.email.trim().toLowerCase();

  // ── Blocked email guard ────────────────────────────────────────────────────
  const { data: blocked } = await supabase
    .from("blocked_emails")
    .select("email")
    .eq("email", normalised)
    .maybeSingle();

  if (blocked) {
    // Generic message — don't reveal that the email is explicitly blocked.
    throw new Error("Unable to submit an assessment with this email address.");
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ── Duplicate email guard (blocks only while a pending assessment exists) ──
  const { data: existing } = await supabase
    .from("assessments")
    .select("id")
    .eq("email", normalised)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    throw new Error(
      "You already have a pending assessment submitted with this email. Our team will review it and get back to you soon."
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

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
    email: normalised,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "You already have a pending assessment submitted with this email. Our team will review it and get back to you soon."
      );
    }
    throw new Error(error.message);
  }
}

// ─── Customer: Check Email Availability ───────────────────────────────────────

export async function checkEmailAvailable(
  email: string
): Promise<{ available: boolean; error?: string }> {
  const supabase = createClient();

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return { available: false, error: emailCheck.error ?? "Invalid email." };
  }

  const normalised = email.trim().toLowerCase();

  const { data: blocked } = await supabase
    .from("blocked_emails")
    .select("email")
    .eq("email", normalised)
    .maybeSingle();

  if (blocked) {
    return {
      available: false,
      error: "Unable to submit an assessment with this email address.",
    };
  }

  const { data } = await supabase
    .from("assessments")
    .select("id")
    .eq("email", normalised)
    .eq("status", "pending")
    .maybeSingle();

  if (data) {
    return {
      available: false,
      error:
        "You already have a pending assessment submitted with this email. Our team will review it and get back to you soon.",
    };
  }

  return { available: true };
}

// ─── Admin: Auth ───────────────────────────────────────────────────────────────

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

// ─── Admin: Delete Submission ──────────────────────────────────────────────────

export async function deleteAssessment(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) return { error: error.message };

  return { success: true };
}

// ─── Admin: Block / Unblock Email ─────────────────────────────────────────────

export async function blockEmail(
  email: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) return { error: "Invalid email." };

  const { error } = await supabase
    .from("blocked_emails")
    .insert({ email: email.trim().toLowerCase(), blocked_by: user.id });

  if (error) {
    if (error.code === "23505") return { error: "Email is already blocked." };
    return { error: error.message };
  }
  return { success: true };
}

export async function unblockEmail(
  email: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase
    .from("blocked_emails")
    .delete()
    .eq("email", email.trim().toLowerCase());

  if (error) return { error: error.message };
  return { success: true };
}

// ─── Admin: Send Result Email (Brevo) ─────────────────────────────────────────

export async function sendResultEmail(
  assessmentId: string,
  toEmail: string,
  subject: string,
  message: string,
  adminNote: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const emailCheck = validateEmail(toEmail);
  if (!emailCheck.valid) return { error: "Invalid recipient email." };

  const safeSubject = subject.trim() || "Your MAC Solar Assessment Results";
  const safeMessage = escapeHtml(message.trim());

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;">
        <tr><td style="background:#0B1D33;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
          <div style="display:inline-block;background:#FFBA08;width:36px;height:36px;border-radius:8px;line-height:36px;font-size:18px;margin-bottom:10px;">&#9728;</div>
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">MAC Solar</h1>
          <p style="color:rgba(255,255,255,0.45);margin:4px 0 0;font-size:12px;letter-spacing:0.5px;">CERTIFIED SOLAR INSTALLERS</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          <h2 style="color:#0B1D33;font-size:18px;font-weight:600;margin:0 0 20px;">${escapeHtml(safeSubject)}</h2>
          <div style="color:#374151;font-size:14px;line-height:1.8;white-space:pre-wrap;">${safeMessage}</div>
        </td></tr>
        <tr><td style="background:#F8FAFC;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="color:#9CA3AF;font-size:11px;margin:0;line-height:1.6;">
            This email was sent by <strong>MAC Solar</strong> in response to your solar assessment.<br>
            For questions, reply to this email or visit our office in Brgy. San Roque Real St. Alangalang, Leyte.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) return { error: "Sender email not configured." };

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "MAC Solar", email: senderEmail },
      to: [{ email: toEmail }],
      subject: safeSubject,
      htmlContent: emailHtml,
    }),
  });

  if (!brevoRes.ok) {
    const errBody = await brevoRes.json().catch(() => ({}));
    const errMsg = (errBody as { message?: string }).message;
    return {
      error: errMsg ?? "Failed to send email. Check your BREVO_API_KEY.",
    };
  }

  const { error: updateError } = await supabase
    .from("assessments")
    .update({
      status: "reviewed",
      email_sent_at: new Date().toISOString(),
      admin_note: adminNote?.trim() || null,
    })
    .eq("id", assessmentId);

  if (updateError) return { error: updateError.message };

  return { success: true };
}

// ─── Admin: Mark Reviewed (without emailing) ──────────────────────────────────

export async function markAsReviewed(
  id: string,
  note: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase
    .from("assessments")
    .update({ status: "reviewed", admin_note: note?.trim() || null })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
