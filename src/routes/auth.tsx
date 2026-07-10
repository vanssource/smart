import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrendingUp, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [signinEmail, setSigninEmail] = useState("");

  useEffect(() => {
    // Only redirect on explicit sign-in events, not on stale sessions from the iframe.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.replace("/dashboard");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // useEffect(() => {
  //   const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
  //     // Jika event adalah SIGNED_IN atau session sudah ada, langsung arahkan ke dashboard
  //     if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
  //       window.location.replace("/dashboard");
  //     }
  //   });
  //   return () => sub.subscription.unsubscribe();
  // }, []);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Jika berhasil, beri feedback DAN arahkan langsung
    if (data.session) {
      toast.success("Login berhasil!");
      // Menggunakan navigate dari TanStack Router
      navigate({ to: "/dashboard" });
    }
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const name = String(fd.get("name"));

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }, // Metadata ini akan diambil oleh trigger tadi
      },
    });

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    setLoading(false);
    toast.success("Akun berhasil dibuat! Silakan login.");
    setSigninEmail(email);
    setTab("signin");
  }

  async function google() {
    setLoading(true);

    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Ini akan otomatis pakai localhost kalau di laptop,
        // dan pakai Vercel kalau di web live
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-hero md:grid-cols-2">
      <div className="relative hidden flex-col justify-between p-12 md:flex">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary shadow-glow">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">SahamSmart</span>
        </Link>
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Trading IDX <span className="text-primary">berbasis data</span>, bukan feeling.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Gabung ribuan trader yang menggunakan sinyal harian & indikator teknikal untuk
            pengambilan keputusan lebih baik.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} SahamSmart</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 bg-card-gradient shadow-card-lg">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Selamat datang</CardTitle>
            <CardDescription>Masuk atau daftar untuk mulai menganalisa saham IDX.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Masuk</TabsTrigger>
                <TabsTrigger value="signup">Daftar</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-4">
                <form onSubmit={signIn} className="space-y-3">
                  <div>
                    <Label htmlFor="e1">Email</Label>
                    <Input
                      id="e1"
                      name="email"
                      type="email"
                      required
                      defaultValue={signinEmail}
                      key={signinEmail}
                    />
                  </div>
                  <div>
                    <Label htmlFor="p1">Password</Label>
                    <Input id="p1" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Masuk
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <form onSubmit={signUp} className="space-y-3">
                  <div>
                    <Label htmlFor="n2">Nama</Label>
                    <Input id="n2" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="e2">Email</Label>
                    <Input id="e2" name="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="p2">Password</Label>
                    <Input id="p2" name="password" type="password" minLength={6} required />
                  </div>
                  <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Buat Akun
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> atau{" "}
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.9 32.4 29.4 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 5 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c11 0 20-8 20-21 0-1.2-.1-2.3-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 5 29.3 3 24 3 16.3 3 9.7 7.4 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 45c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.3 36 26.8 37 24 37c-5.4 0-9.9-2.6-11.7-6.6l-6.5 5C9.5 40.6 16.2 45 24 45z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C42 34.6 45 30 45 24c0-1.2-.1-2.3-1.4-3.5z"
                />
              </svg>
              Lanjutkan dengan Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
