import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function UserMenu() {
  const [profile, setProfile] = useState<{ name: string; avatar: string | null } | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      const { data: p } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", u.id).maybeSingle();
      setProfile({ name: p?.display_name || u.email || "Usuario", avatar: p?.avatar_url ?? null });
    })();
  }, []);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="glass hover-lift flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs">
        {profile?.avatar ? (
          <img src={profile.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary font-display text-[11px] text-primary-foreground">{profile?.name?.[0]?.toUpperCase() ?? "·"}</span>
        )}
        <span className="max-w-32 truncate">{profile?.name ?? "…"}</span>
      </div>
      <button onClick={signOut} title="Cerrar sesión" aria-label="Cerrar sesión" className="glass hover-lift grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground">
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
