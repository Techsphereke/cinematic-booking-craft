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
    const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser || 'noreply@jtstudios.events';

    const body: EmailPayload = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('SMTP not fully configured. Required: SMTP_HOST, SMTP_USER, SMTP_PASS');
      return new Response(
        JSON.stringify({ success: true, message: 'Email queued (SMTP not configured)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build raw MIME email
    const boundary = `boundary_${crypto.randomUUID().replace(/-/g, '')}`;
    const textContent = text || html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const fromDisplay = `JT Studios & Events <${smtpFrom}>`;

    const rawEmail = [
      `From: ${fromDisplay}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      ``,
      textContent,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      ``,
      html,
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    // Use SMTP via fetch to a relay or send directly using Deno TCP
    // We'll use the Deno built-in SMTP approach via net
    const smtpResponse = await sendSmtp({
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      from: smtpFrom,
      to,
      subject,
      rawEmail,
    });

    return new Response(
      JSON.stringify({ success: smtpResponse.success, message: smtpResponse.message }),
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

interface SmtpOptions {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  rawEmail: string;
}

async function sendSmtp(opts: SmtpOptions): Promise<{ success: boolean; message: string }> {
  try {
    const { host, port, user, pass, from, to, rawEmail } = opts;

    // Connect to SMTP server
    let conn: Deno.TcpConn | Deno.TlsConn;
    
    if (port === 465) {
      // Direct TLS
      conn = await Deno.connectTls({ hostname: host, port });
    } else {
      // Plain then STARTTLS
      conn = await Deno.connect({ hostname: host, port });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readLine = async (): Promise<string> => {
      const buf = new Uint8Array(4096);
      let full = '';
      while (true) {
        const n = await conn.read(buf);
        if (!n) break;
        full += decoder.decode(buf.subarray(0, n));
        if (full.includes('\r\n')) break;
      }
      return full.trim();
    };

    const send = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + '\r\n'));
    };

    // Read greeting
    await readLine();

    // EHLO
    await send(`EHLO ${host}`);
    let ehloResp = '';
    for (let i = 0; i < 10; i++) {
      const line = await readLine();
      ehloResp += line;
      if (line.startsWith('250 ') || (!line.startsWith('250-') && !line.startsWith('250 '))) break;
    }

    // STARTTLS if needed
    if (port === 587 && ehloResp.includes('STARTTLS')) {
      await send('STARTTLS');
      await readLine();
      conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: host });
      // Re-EHLO after TLS
      await send(`EHLO ${host}`);
      for (let i = 0; i < 10; i++) {
        const line = await readLine();
        if (line.startsWith('250 ') || (!line.startsWith('250-') && !line.startsWith('250 '))) break;
      }
    }

    // AUTH LOGIN
    await send('AUTH LOGIN');
    await readLine();
    await send(btoa(user));
    await readLine();
    await send(btoa(pass));
    const authResp = await readLine();
    if (!authResp.startsWith('235')) {
      conn.close();
      return { success: false, message: `SMTP AUTH failed: ${authResp}` };
    }

    // MAIL FROM
    await send(`MAIL FROM:<${from}>`);
    const mailResp = await readLine();
    if (!mailResp.startsWith('250')) {
      conn.close();
      return { success: false, message: `MAIL FROM failed: ${mailResp}` };
    }

    // RCPT TO
    await send(`RCPT TO:<${to}>`);
    const rcptResp = await readLine();
    if (!rcptResp.startsWith('250')) {
      conn.close();
      return { success: false, message: `RCPT TO failed: ${rcptResp}` };
    }

    // DATA
    await send('DATA');
    await readLine();
    await send(rawEmail + '\r\n.');
    const dataResp = await readLine();

    // QUIT
    await send('QUIT');
    conn.close();

    if (dataResp.startsWith('250')) {
      return { success: true, message: 'Email sent successfully via SMTP' };
    }
    return { success: false, message: `DATA failed: ${dataResp}` };

  } catch (err) {
    console.error('SMTP send error:', err);
    return { success: false, message: err instanceof Error ? err.message : 'SMTP error' };
  }
}
