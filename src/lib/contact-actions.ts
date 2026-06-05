"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContactInfo } from "@/lib/types";

export async function updateContactInfo(
  info: ContactInfo
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("site_settings")
      .upsert(
        {
          id: "main",
          address: info.address.trim(),
          phone: info.phone.trim(),
          email: info.email.trim(),
          facebook: info.facebook.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) return { error: error.message };

    // Bust the homepage cache so changes appear immediately
    revalidatePath("/");

    return { error: null };
  } catch (err) {
    return { error: String(err) };
  }
}
