import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fllsnsidgqlacdyatvbm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbHNuc2lkZ3FsYWNkeWF0dmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MTUzNjIsImV4cCI6MjA2ODk5MTM2Mn0.cS3_Iihv1_VhuoGhWb8CBl72cJx3WNRi1SjmPV6ntl0"
);

export default function Confirm() {
  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      window.location.replace(error ? "/auth?error=confirm_failed" : "/subscribe");
    })();
  }, []);
  return null;
}