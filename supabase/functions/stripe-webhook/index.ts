// supabase/functions/stripe-webhook/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

// --- Stripe signature verification (HMAC-SHA256) ---
const encoder = new TextEncoder();

function parseStripeSigHeader(sigHeader: string) {
  // Format: "t=timestamp,v1=signature,v1=altSignature"
  const parts = sigHeader.split(",").map(p => p.trim());
  const out: { t?: string; v1: string[] } = { v1: [] };
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "t") out.t = v;
    if (k === "v1") out.v1.push(v);
  }
  return out;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

async function computeSignature(payload: string, secret: string, timestamp: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const data = encoder.encode(`${timestamp}.${payload}`);
  const mac = await crypto.subtle.sign("HMAC", key, data);
  const bytes = new Uint8Array(mac);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  try {
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!WEBHOOK_SECRET) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

    const sig = req.headers.get("Stripe-Signature");
    if (!sig) return new Response("Missing Stripe-Signature", { status: 400 });

    const rawBody = await req.text();
    const parsed = parseStripeSigHeader(sig);
    if (!parsed.t || parsed.v1.length === 0) return new Response("Invalid signature header", { status: 400 });

    // Optional time tolerance (300s)
    const tSec = Number(parsed.t);
    if (!Number.isFinite(tSec) || Math.abs(Math.floor(Date.now() / 1000) - tSec) > 300) {
      return new Response("Timestamp outside tolerance", { status: 400 });
    }

    const expected = await computeSignature(rawBody, WEBHOOK_SECRET, parsed.t);
    const valid = parsed.v1.some(v => timingSafeEqual(v, expected));
    if (!valid) return new Response("Invalid signature", { status: 400 });

    // Signature valid → parse event
    const event = JSON.parse(rawBody);

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Handle subscription lifecycle
    if (event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.deleted") {

      const sub = event.data.object;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      const status = sub.status ?? (event.type === "customer.subscription.deleted" ? "canceled" : null);
      const endIso = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

      if (customerId) {
        await admin.from("users").update({
          subscription_status: status,
          current_period_end: endIso,
        }).eq("stripe_customer_id", customerId);
      }

      return new Response("ok");
    }

    // (Optional) handle checkout.session.completed if you want
    // else ignore other events
    return new Response("ok");
  } catch (e) {
    return new Response(`Webhook Error: ${String(e?.message ?? e)}`, { status: 400 });
  }
});