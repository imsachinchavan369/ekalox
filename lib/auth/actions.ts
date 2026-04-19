"use server";

import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase";

function normalize(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function signUpWithEmailAction(formData: FormData) {
  const email = normalize(formData.get("email")).toLowerCase();
  const password = normalize(formData.get("password"));

  if (!email || !password) {
    redirect("/signup?error=Email+and+password+are+required");
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Account+created.+Please+log+in");
}

export async function loginWithEmailAction(formData: FormData) {
  const email = normalize(formData.get("email")).toLowerCase();
  const password = normalize(formData.get("password"));
  const next = normalize(formData.get("next")) || "/profile";

  if (!email || !password) {
    redirect("/login?error=Email+and+password+are+required");
  }

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login?message=You+have+been+logged+out");
}
