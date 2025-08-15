// supabase/functions/customer-portal/index.ts
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
  if (!STRIPE_KEY) return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }), { status: 500, headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });

    // Read customer id
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: me } = await admin.from("users").select("stripe_customer_id").eq("id", user.id).single();

    if (!me?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "No Stripe customer found. Please complete a subscription first." }), { status: 400, headers: corsHeaders });
    }

    // Create Billing Portal Session (REST)
    const form = new URLSearchParams();
    form.set("customer", me.stripe_customer_id);
    form.set("return_url", `${new URL(req.url).origin}/app/account`);

    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const portalJson = await portalRes.json();
    if (!portalRes.ok || !portalJson.url) {
      return new Response(JSON.stringify({ error: portalJson.error?.message || "Stripe portal session failed" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ url: portalJson.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders });
  }
});