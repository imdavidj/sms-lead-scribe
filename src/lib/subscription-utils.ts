import { supabase } from "@/integrations/supabase/client";

export async function checkSubscriptionAccess() {
  // Make sure session is ready
  let { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    await supabase.auth.refreshSession();
    ({ data: { session } } = await supabase.auth.getSession());
  }

  const token = session?.access_token;
  if (!token) {
    return { subscribed: false, error: "No valid session" };
  }

  // Poll check-subscription with brief backoff for webhook delays
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(`https://fllsnsidgqlacdyatvbm.supabase.co/functions/v1/check-subscription`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        }
      });
      
      const result = await response.json();
      if (result.subscribed) {
        return result; // Success - subscription is active
      }
      
      // If not subscribed yet, wait and try again
      if (i < 4) { // Don't wait on the last attempt
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second backoff
      }
    } catch (error) {
      console.error(`Subscription check attempt ${i + 1} failed:`, error);
      if (i < 4) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  return { subscribed: false, error: "Subscription not activated after polling" };
}

export async function handlePostCheckoutFlow() {
  try {
    const subState = await checkSubscriptionAccess();
    
    if (subState.subscribed) {
      return {
        success: true,
        subscription: subState
      };
    } else {
      return {
        success: false,
        error: subState.error || "Subscription not found",
        needsActivation: true
      };
    }
  } catch (error) {
    console.error("Post-checkout flow error:", error);
    return {
      success: false,
      error: "Failed to verify subscription status"
    };
  }
}