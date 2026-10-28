import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { HeroGradient } from "@/components/bench/HeroGradient";
import { Logo } from "@/components/bench/Logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => z.object({ mode: z.enum(["signin", "signup"]).optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "BenchEngine — Entrar o registrarse" },
      { name: "description", content: "Inicia sesión o crea tu cuenta de BenchEngine para acceder al panel de control." },
      { property: "og:title", content: "BenchEngine — Entrar o registrarse" },
      { property: "og:description", content: "Accede al panel de benchmarks de IA local." },
    ],
  }),
  component: AuthPage,
});

const field = "h-11 w-full rounded-lg border border-border bg-input/60 px-3 text-sm outline-none transition focus:border-ring focus:shadow-glow";

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/dashboard", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") navigate({ to: "/dashboard", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = mode === "signup"
      ? await supabase.auth.signUp({ email: form.email, password: form.password, options: { emailRedirectTo: window.location.origin, data: { display_name: form.name } } })
      : await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const oauth = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(String(r.error.message ?? r.error));
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <HeroGradient className="absolute inset-0 h-full w-full opacity-70" />
      <div className="absolute inset-0 bg-background/40" />
      <div className="fade-up glass-strong neon-border relative w-full max-w-md rounded-3xl p-8">
        <Link to="/lobby" className="block text-center"><Logo className="text-base" /></Link>
        <div className="mt-8 grid grid-cols-2 rounded-full border border-border bg-input/50 p-1 text-sm">
          {(["signin", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn("rounded-full py-2 transition-all duration-300", mode === m ? "neon-btn" : "text-muted-foreground hover:text-foreground")}>
              {m === "signin" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" className={field} />
          )}
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@correo.com" className={field} />
          <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña" className={field} />
          <button disabled={busy} className="neon-btn hover-lift flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Entrar al panel" : "Crear cuenta"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground"><span className="h-px flex-1 bg-border" />o continúa con<span className="h-px flex-1 bg-border" /></div>
        <div className="space-y-2">
          <button onClick={() => oauth("google")} className="glass hover-lift flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95S8.78 6.28 12 6.28c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.72 14.53 2.8 12 2.8 6.92 2.8 2.8 6.92 2.8 12s4.12 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.99 0-.6-.07-1.06-.15-1.51z" /></svg>
            Continuar con Google
          </button>
          <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
        </div>
      </div>
    </div>
  );
}
