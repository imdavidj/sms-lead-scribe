// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const whSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const sig = req.headers.get("stripe-signature");
    const raw = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(raw, sig!, whSecret);
    } catch (err: any) {
      console.error("Webhook signature verify failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { headers: corsHeaders, status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const customerId = s.customer as string | null;
      const user_id = (s.client_reference_id as string) || s.metadata?.user_id;
      const email = s.customer_details?.email || s.metadata?.email || s.customer_email || "";

      if (user_id && customerId) {
        await supabase.from("subscribers").upsert({
          user_id,
          email,
          stripe_customer_id: customerId,
        });
      }
    }

    if (event.type.startsWith("customer.subscription.")) {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const price = sub.items.data[0]?.price;
      const amount = price?.unit_amount ?? 0;

      const subscription_tier = amount < 99900 ? "Standard" : "Premium";
      const subscription_end = new Date(sub.current_period_end * 1000).toISOString();
      const subscribed = sub.status === "active" || sub.status === "trialing";

      // find the user by stripe_customer_id
      const { data: rows } = await supabase
        .from("subscribers")
        .select("user_id, email")
        .eq("stripe_customer_id", customerId)
        .limit(1);

      const found = rows?.[0];
      if (found) {
        await supabase.from("subscribers").upsert({
          user_id: found.user_id,
          email: found.email,
          stripe_customer_id: customerId,
          subscribed,
          subscription_tier,
          subscription_end: subscribed ? subscription_end : null
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), { headers: corsHeaders, status: 500 });
  }
});