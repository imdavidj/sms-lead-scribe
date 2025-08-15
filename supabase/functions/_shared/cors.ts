/**
 * Shared CORS helper for all Edge Functions
 * Use this in every function to ensure consistent CORS handling
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Handle CORS preflight requests
 * Returns a Response object for OPTIONS requests
 */
export function handleCorsOptions(): Response {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Create a JSON response with CORS headers
 */
export function createCorsResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}