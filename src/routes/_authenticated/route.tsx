import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/app-nav";
import { SiteDisclaimer } from "@/components/site-disclaimer";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        <Outlet />
      </main>
      <SiteDisclaimer />
    </div>
  );
}
