import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/env";

export default function Confirm() {
  useEffect(() => {
    (async () => {
      // 1) Turn magic-link into a real session
      const { error: exchErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (exchErr) {
        console.error("exchangeCodeForSession error:", exchErr);
        window.location.replace("/auth?error=confirm_failed");
        return;
      }

      // 2) If already subscribed, go to dashboard
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        window.location.replace("/auth?error=no_session");
        return;
      }

      try {
        const checkRes = await supabase.functions.invoke('check-subscription');
        if (checkRes.data?.subscribed) {
          window.location.replace("/dashboard");
          return;
        }
      } catch (err) {
        console.warn("check-subscription failed, continuing to checkout:", err);
      }

      // 3) Not subscribed → create a Checkout Session and redirect immediately
      try {
        const createRes = await supabase.functions.invoke('create-checkout', {
          body: { returnTo: `${SITE_URL}/return` }
        });

        if (createRes.error || !createRes.data?.url) {
          console.error("create-checkout failed:", createRes.error);
          const errorMsg = createRes.error?.message || createRes.error || "checkout_failed";
          window.location.replace(`/subscribe?err=${encodeURIComponent(errorMsg)}`);
          return;
        }

        window.location.href = createRes.data.url; // → Stripe Checkout
      } catch (err) {
        console.error("create-checkout exception:", err);
        window.location.replace(`/subscribe?err=${encodeURIComponent("checkout_error")}`);
      }
    })();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Setting up your subscription...</p>
      </div>
    </div>
  );
}