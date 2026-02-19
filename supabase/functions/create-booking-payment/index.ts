import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, amount, booking_ref, service_name, deposit } = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Try to get user email from auth header
    let customerEmail: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data } = await supabaseClient.auth.getUser(token);
      customerEmail = data.user?.email;
    }

    // Get booking email if no user
    if (!customerEmail) {
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("email")
        .eq("id", booking_id)
        .single();
      customerEmail = booking?.email;
    }

    // Check for existing Stripe customer
    let customerId: string | undefined;
    if (customerEmail) {
      const existing = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (existing.data.length > 0) customerId = existing.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://jtstudios.events";
    const label = deposit ? "50% Deposit" : "Remaining Balance";
    const description = deposit
      ? `JT Studios — ${service_name || "Service"} (Booking ${booking_ref}) - 50% Deposit`
      : `JT Studios — ${service_name || "Service"} (Booking ${booking_ref}) - Remaining Balance`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: amount,
            product_data: {
              name: description,
              description: `JT Studios & Events — Professional ${service_name || "multimedia"} services`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?booking_id=${booking_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking`,
      metadata: {
        booking_id,
        booking_ref: booking_ref || "",
        deposit: deposit ? "true" : "false",
      },
    });

    // Update booking with session ID
    if (deposit) {
      await supabaseAdmin.from("bookings").update({ stripe_deposit_session_id: session.id }).eq("id", booking_id);
    } else {
      await supabaseAdmin.from("bookings").update({ stripe_balance_session_id: session.id }).eq("id", booking_id);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
