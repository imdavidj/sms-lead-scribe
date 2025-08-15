// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { headers: corsHeaders, status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), { headers: corsHeaders, status: 401 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // DB fast-path: if we already have a recent positive state, return it
    const { data: subRow } = await supabase
      .from("subscribers")
      .select("stripe_customer_id, subscribed, subscription_tier, subscription_end, updated_at, email")
      .eq("user_id", user.id)
      .single();

    const recentMs = subRow?.updated_at ? Date.now() - Date.parse(subRow.updated_at) : Infinity;
    if (subRow?.subscribed && subRow.subscription_end && recentMs < 3 * 60 * 1000) {
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: subRow.subscription_tier,
        subscription_end: subRow.subscription_end,
      }), { headers: corsHeaders });
    }

    // Stripe lookup
    type Acceptable = "active" | "trialing";
    const ok = new Set<Acceptable>(["active", "trialing"]);

    const candidates: string[] = [];
    if (subRow?.stripe_customer_id) candidates.push(subRow.stripe_customer_id);

    const email = subRow?.email || user.email || "";
    if (email) {
      const listed = await stripe.customers.list({ email });
      for (const c of listed.data) if (!candidates.includes(c.id)) candidates.push(c.id);
    }

    let best: { customerId: string; sub: Stripe.Subscription } | null = null;

    for (const customerId of candidates) {
      const subs = await stripe.subscriptions.list({ customer: customerId });
      for (const s of subs.data) {
        if (!ok.has(s.status as Acceptable)) continue;
        if (!best || s.current_period_end > best.sub.current_period_end) {
          best = { customerId, sub: s };
        }
      }
    }

    if (!best) {
      await supabase.from("subscribers").upsert({
        user_id: user.id,
        email,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
      return new Response(JSON.stringify({ subscribed: false }), { headers: corsHeaders });
    }

    const { customerId, sub } = best;
    const price = sub.items.data[0]?.price;
    const amount = price?.unit_amount ?? 0;

    // simple tiering example
    const subscriptionTier = amount < 99900 ? "Standard" : "Premium";
    const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();

    await supabase.from("subscribers").upsert({
      user_id: user.id,
      email,
      subscribed: true,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      stripe_customer_id: customerId,
    });

    return new Response(JSON.stringify({
      subscribed: true,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
    }), { headers: corsHeaders });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), { headers: corsHeaders, status: 500 });
  }
});