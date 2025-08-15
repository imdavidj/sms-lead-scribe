import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(SUPABASE_URL, SERVICE);

  const sig = req.headers.get("Stripe-Signature")!;
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return new Response(`Webhook Error: ${String(err)}`, { status: 400 });
  }

  const handle = async (sub: Stripe.Subscription) => {
    const userId = (sub.metadata?.user_id || sub.client_reference_id) as string | undefined;
    if (!userId) return;

    await admin.from("users")
      .update({
        subscription_status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      })
      .eq("id", userId);
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Nothing to do here if subscription webhook arrives; optional lookup
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await handle(event.data.object as Stripe.Subscription);
      break;
    }
  }

  return new Response("ok");
});