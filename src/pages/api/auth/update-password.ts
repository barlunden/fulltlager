import type { APIRoute } from "astro";
import { createAuthenticatedClient } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const password = formData.get("password")?.toString();
  const passwordConfirm = formData.get("passwordConfirm")?.toString();

  if (!password || !passwordConfirm) {
    return redirect("/tilbakestill-passord?error=missing_fields");
  }
  if (password !== passwordConfirm) {
    return redirect("/tilbakestill-passord?error=Passorda er ikkje like");
  }
  if (password.length < 6) {
    return redirect("/tilbakestill-passord?error=Passordet må vere minst 6 teikn");
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return redirect("/tilbakestill-passord?error=Ugyldig eller utløpt tilbakestillingslenke");
  }

  // Bruk autentisert klient med brukarens token
  const authedSupabase = createAuthenticatedClient(accessToken);
  const { data, error } = await authedSupabase.auth.updateUser({
    password: password
  });

  if (error) {
    return redirect(`/tilbakestill-passord?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    return redirect("/login?message=Passordet er oppdatert — logg inn med nytt passord");
  }

  return redirect("/tilbakestill-passord?error=Noko gjekk galt");
};