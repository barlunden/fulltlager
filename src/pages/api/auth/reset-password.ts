// src/pages/api/auth/reset-password.ts
import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();

  if (!email) {
    return redirect("/glemt-passord?error=missing_email");
  }

  // Send passord-reset e-post
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${new URL(request.url).origin}/tilbakestill-passord`,
});

  if (error) {
    console.error("Reset password error:", error);
    return redirect(`/glemt-passord?error=${encodeURIComponent(error.message)}`);
  }

  // Suksess - send brukar tilbake med melding
  return redirect("/glemt-passord?message=Vi har sendt deg ein e-post med lenke for å tilbakestille passordet");
};
