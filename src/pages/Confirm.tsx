import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Confirm() {
  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      window.location.replace(error ? "/auth?error=confirm_failed" : "/subscribe");
    })();
  }, []);
  return null;
}