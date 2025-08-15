// supabase/functions/check-subscription/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");

  try {
    // Require JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });
    }

    // DB (service role)
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: me } = await admin
      .from("users")
      .select("stripe_customer_id, subscription_status, current_period_end")
      .eq("id", user.id)
      .single();

    // 1) DB-first
    if (me?.subscription_status && ["active", "trialing"].includes(me.subscription_status)) {
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_status: me.subscription_status,
        subscription_end: me.current_period_end,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2) Stripe fallback (only if we have a stored customer id)
    if (!me?.stripe_customer_id || !STRIPE_KEY) {
      // No customer or no key → not subscribed
      return new Response(JSON.stringify({ subscribed: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = `https://api.stripe.com/v1/subscriptions?customer=${encodeURIComponent(me.stripe_customer_id)}&limit=10`;
    const sRes = await fetch(url, {
      headers: { Authorization: `Bearer ${STRIPE_KEY}` },
    });
    const sJson = await sRes.json();

    if (!sRes.ok) {
      return new Response(JSON.stringify({ subscribed: false, error: sJson?.error?.message || "Stripe list failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // still return 200 so client handles gracefully
      });
    }

    const live = (sJson?.data || []).find((s: any) => ["active", "trialing"].includes(s.status));
    if (live) {
      const endIso = live.current_period_end ? new Date(live.current_period_end * 1000).toISOString() : null;
      await admin.from("users").update({
        subscription_status: live.status,
        current_period_end: endIso,
      }).eq("id", user.id);

      return new Response(JSON.stringify({
        subscribed: true,
        subscription_status: live.status,
        subscription_end: endIso,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ subscribed: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders });
  }
});