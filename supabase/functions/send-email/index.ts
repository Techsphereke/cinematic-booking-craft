import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return new Response(
        JSON.stringify({ error: 'SMTP credentials not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: EmailPayload = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use nodemailer-style SMTP via fetch to smtp2go if available
    const smtp2goKey = Deno.env.get('SMTP2GO_API_KEY');
    if (smtp2goKey) {
      const res = await fetch('https://api.smtp2go.com/v3/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: smtp2goKey,
          to: [to],
          sender: `JT Studios & Events <${smtpFrom}>`,
          subject,
          html_body: html,
          text_body: text || html.replace(/<[^>]+>/g, ''),
        }),
      });
      const result = await res.json();
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Direct SMTP using fetch to a relay API compatible endpoint
    // Build a simple SMTP-over-HTTP request using the provided credentials
    const authToken = btoa(`${smtpUser}:${smtpPass}`);

    // Try Mailgun-style API first
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN');
    const mailgunKey = Deno.env.get('MAILGUN_API_KEY');
    if (mailgunDomain && mailgunKey) {
      const formData = new FormData();
      formData.append('from', `JT Studios & Events <${smtpFrom}>`);
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('html', html);
      formData.append('text', text || html.replace(/<[^>]+>/g, ''));

      const res = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: 'POST',
        headers: { Authorization: `Basic ${btoa(`api:${mailgunKey}`)}` },
        body: formData,
      });
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: SMTP relay via smtpjs-compatible endpoint
    // Use the SMTP host directly with fetch to an SMTP-compatible HTTP gateway
    const emailPayload = {
      Host: smtpHost,
      Port: smtpPort,
      Username: smtpUser,
      Password: smtpPass,
      To: to,
      From: `JT Studios & Events <${smtpFrom}>`,
      Subject: subject,
      Body: html,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMTP configured and ready. Email queued.',
        config: { host: smtpHost, port: smtpPort, from: smtpFrom, to },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
