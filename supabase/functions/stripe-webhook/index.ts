// Force redeploy: v2.2 - Streamlined signup flow
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

Deno.serve(async (req) => {
  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SERVICE || !SUPABASE_URL) {
      return new Response("Missing required environment variables", { status: 500 });
    }
    
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    const admin = createClient(SUPABASE_URL, SERVICE);

    const sig = req.headers.get("Stripe-Signature")!;
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);

    const handleSub = async (sub: Stripe.Subscription) => {
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await admin.from("users").update({
        subscription_status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq("stripe_customer_id", customerId);
    };

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSub(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed":
        // optional: you can look up the subscription/customer and update users here if needed
        break;
      default:
        // ignore others
        break;
    }

    return new Response("ok");
  } catch (err) {
    return new Response(`Webhook Error: ${String(err)}`, { status: 400 });
  }
});