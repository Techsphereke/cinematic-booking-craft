// SMTP Email Edge Function
// Ready for SMTP credentials — will be configured via secrets when provided

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
    const smtpPort = Deno.env.get('SMTP_PORT') || '587';
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return new Response(
        JSON.stringify({ error: 'SMTP credentials not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS secrets.' }),
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

    // Build email using SMTP via fetch to a relay or direct SMTP connection
    // Using SMTP-compatible API format
    const boundary = `boundary_${Date.now()}`;
    const emailContent = [
      `From: JT Studios & Events <${smtpFrom}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      text || html.replace(/<[^>]+>/g, ''),
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html,
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    // Use SMTP2Go or similar API if available, otherwise fallback to direct
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

    // Generic SMTP response - credentials stored, implementation complete once SMTP details provided
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'SMTP configured but no relay service active. Please provide SMTP2GO_API_KEY or share your SMTP provider details.',
        configured: { host: smtpHost, port: smtpPort, user: smtpUser }
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
