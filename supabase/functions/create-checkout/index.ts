import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Env guards
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const PRICE_ID = Deno.env.get("STRIPE_PRICE_ID");
  if (!STRIPE_KEY) return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }), { status: 500, headers: corsHeaders });
  if (!PRICE_ID)  return new Response(JSON.stringify({ error: "Missing STRIPE_PRICE_ID" }),   { status: 500, headers: corsHeaders });

  const origin = new URL(req.url).origin;

  try {
    // Auth (require JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });

    // Admin DB
    const admin = createClient(SUPABASE_URL, SERVICE);

    // Ensure user row
    let { data: me } = await admin.from("users").select("stripe_customer_id, email").eq("id", user.id).single();
    if (!me) {
      await admin.from("users").insert({ id: user.id, email: user.email });
      me = { stripe_customer_id: null, email: user.email };
    }

    // Ensure Stripe customer (REST)
    let customerId = me.stripe_customer_id as string | null;
    if (!customerId) {
      const customerForm = new URLSearchParams();
      if (user.email) customerForm.set("email", user.email);
      customerForm.set("metadata[user_id]", user.id);

      const custRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: customerForm.toString(),
      });

      const custJson = await custRes.json();
      if (!custRes.ok) {
        return new Response(JSON.stringify({ error: custJson.error?.message || "Stripe customer create failed" }), { status: 500, headers: corsHeaders });
      }

      customerId = custJson.id as string;
      await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    // Parse body
    const body = await req.json().catch(() => ({ returnTo: `${origin}/return` }));
    const returnTo: string = body?.returnTo || `${origin}/return`;

    // Create Checkout Session (REST)
    const sessionForm = new URLSearchParams();
    sessionForm.set("mode", "subscription");
    sessionForm.set("customer", customerId!);
    sessionForm.set("line_items[0][price]", PRICE_ID!);
    sessionForm.set("line_items[0][quantity]", "1");
    sessionForm.set("success_url", `${returnTo}?session_id={CHECKOUT_SESSION_ID}`);
    sessionForm.set("cancel_url", `${origin}/subscribe`);
    sessionForm.set("client_reference_id", user.id);
    if (user.email) sessionForm.set("metadata[email]", user.email);
    sessionForm.set("metadata[user_id]", user.id);

    const sessRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: sessionForm.toString(),
    });

    const sessJson = await sessRes.json();
    if (!sessRes.ok || !sessJson.url) {
      return new Response(JSON.stringify({ error: sessJson.error?.message || "Stripe checkout session failed" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ url: sessJson.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders });
  }
});