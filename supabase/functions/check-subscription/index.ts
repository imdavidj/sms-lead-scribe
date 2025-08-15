// Force redeploy: v2.1 - Updated for secret verification
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }), { status: 500, headers: corsHeaders });
    }
    
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: me } = await admin
      .from("users")
      .select("stripe_customer_id, subscription_status, current_period_end")
      .eq("id", user.id)
      .maybeSingle();

    // Prefer DB first
    if (me?.subscription_status && ["active", "trialing"].includes(me.subscription_status)) {
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_status: me.subscription_status,
        subscription_end: me.current_period_end,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fallback to Stripe if we have a customer id
    if (me?.stripe_customer_id) {
      const subs = await stripe.subscriptions.list({ customer: me.stripe_customer_id });
      const live = subs.data.find(s => ["active", "trialing"].includes(s.status));
      if (live) {
        const end = new Date(live.current_period_end * 1000).toISOString();
        await admin.from("users").update({
          subscription_status: live.status,
          current_period_end: end,
        }).eq("id", user.id);

        return new Response(JSON.stringify({
          subscribed: true,
          subscription_status: live.status,
          subscription_end: end,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ subscribed: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders });
  }
});