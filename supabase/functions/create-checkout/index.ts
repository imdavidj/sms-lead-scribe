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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PRICE_ID = Deno.env.get("STRIPE_PRICE_ID")!;
    const origin = new URL(req.url).origin;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });

    const admin = createClient(SUPABASE_URL, SERVICE);

    let { data: me } = await admin.from("users").select("stripe_customer_id, email").eq("id", user.id).maybeSingle();
    if (!me) {
      await admin.from("users").insert({ id: user.id, email: user.email });
      me = { stripe_customer_id: null, email: user.email };
    }

    let customerId = me.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({ 
        email: user.email || undefined, 
        metadata: { supabase_user_id: user.id } 
      });
      customerId = customer.id;
      await admin.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const { returnTo } = await req.json().catch(() => ({ returnTo: `${origin}/return` }));

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId!,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${returnTo}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe`,
      client_reference_id: user.id,
      metadata: { user_id: user.id, email: user.email ?? "" },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders });
  }
});