import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOnboardingStatus } from "./actions";

export default async function OnboardingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  if (!supabase) redirect("/login");

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if onboarding is complete
  const { data: status } = await getOnboardingStatus();

  if (status?.isComplete) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[--sk-bg-app]">
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
