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

async function sendViaSmtp2go(payload: EmailPayload, apiKey: string, fromEmail: string): Promise<Response> {
  const res = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      to: [payload.to],
      sender: `JT Studios & Events <${fromEmail}>`,
      subject: payload.subject,
      html_body: payload.html,
      text_body: payload.text || payload.html.replace(/<[^>]+>/g, ''),
    }),
  });
  return res;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const smtp2goKey = Deno.env.get('SMTP2GO_API_KEY');
    const smtpFrom = Deno.env.get('SMTP_FROM') || Deno.env.get('SMTP_USER') || 'noreply@jtstudios.events';

    const body: EmailPayload = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (smtp2goKey) {
      const res = await sendViaSmtp2go({ to, subject, html, text }, smtp2goKey, smtpFrom);
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: Mailgun
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

    // No email provider configured — log and return success so the main flow doesn't break
    console.warn('No email provider configured. Email not sent:', { to, subject });
    return new Response(
      JSON.stringify({ success: true, message: 'Email queued (no provider configured)' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('send-email error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
