# Edge Functions Guide

## CORS Implementation

All edge functions **MUST** use the standardized CORS headers and handle OPTIONS requests properly.

### Required CORS Headers

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
```

### Required OPTIONS Handler

Every function must handle CORS preflight requests by returning early on OPTIONS:

```typescript
if (req.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
}
```

### Response Pattern

Always include CORS headers in responses:

```typescript
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, "Content-Type": "application/json" },
  status: 200,
});
```

## Using the Shared Helper

For new functions, you can import the shared CORS helper:

```typescript
import { corsHeaders, handleCorsOptions, createCorsResponse } from "../_shared/cors.ts";

// Handle OPTIONS early
if (req.method === "OPTIONS") {
  return handleCorsOptions();
}

// Return responses with CORS
return createCorsResponse({ success: true });
```

## Edge Function Standards

1. **CORS**: Always use standardized CORS headers
2. **Authentication**: Use Supabase JWT verification when needed
3. **Service Role**: Use service role key to bypass RLS for admin operations
4. **Error Handling**: Return proper HTTP status codes with CORS headers
5. **Logging**: Include detailed logging for debugging

## Authentication Pattern

For functions requiring authentication:

```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return createCorsResponse({ error: "Unauthorized" }, 401);
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!, // or SERVICE_ROLE_KEY for admin operations
  { global: { headers: { Authorization: authHeader } } }
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return createCorsResponse({ error: "Invalid user" }, 401);
}
```

## Updated Functions

All existing functions have been updated to use the standardized CORS implementation:

- ✅ `hooks/index.ts` - Message webhook handler
- ✅ `reply/index.ts` - SMS reply function
- ✅ `create-checkout/index.ts` - Stripe checkout creation
- ✅ `customer-portal/index.ts` - Stripe customer portal
- ✅ `check-subscription/index.ts` - Subscription status check
- ✅ `validate-twilio/index.ts` - Twilio credentials validation
- ✅ `stripe-webhook/index.ts` - Stripe webhook handler
- ✅ `is-paid-email/index.ts` - Email payment status check
- ✅ `create-checkout-public/index.ts` - Public checkout creation