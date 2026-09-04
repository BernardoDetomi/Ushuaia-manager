const TYPES = {
  help: 'Ajuda',
  suggestion: 'Sugestão',
  bug: 'Bug',
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY não configurada.');
    return response.status(500).json({ error: 'O envio de mensagens ainda não foi configurado.' });
  }

  let body = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return response.status(400).json({ error: 'Conteúdo inválido.' });
    }
  }

  const type = body?.type;
  const title = body?.title?.trim();
  const description = body?.description?.trim();
  const contactEmail = body?.contactEmail?.trim().toLowerCase();

  // Campo invisível preenchido apenas por bots.
  if (body?.website) return response.status(200).json({ ok: true });
  if (!TYPES[type] || !title || title.length < 3 || title.length > 120) {
    return response.status(400).json({ error: 'Informe um título entre 3 e 120 caracteres.' });
  }
  if (!description || description.length < 10 || description.length > 5000) {
    return response.status(400).json({ error: 'A descrição deve ter entre 10 e 5.000 caracteres.' });
  }
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return response.status(400).json({ error: 'Informe um e-mail válido para contato.' });
  }

  const typeLabel = TYPES[type];
  const pageUrl = String(body?.pageUrl || '').slice(0, 500);
  const from = process.env.RESEND_FROM_EMAIL || 'Ushuaia Manager <onboarding@resend.dev>';
  const to = process.env.FEEDBACK_TO_EMAIL || 'bernardomd01@gmail.com';

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: contactEmail,
      subject: `[Ushuaia Manager] ${typeLabel}: ${title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1e293b">
          <h2 style="color:#0f766e">Nova mensagem — ${escapeHtml(typeLabel)}</h2>
          <p><strong>Título:</strong> ${escapeHtml(title)}</p>
          <p><strong>Contato:</strong> ${escapeHtml(contactEmail)}</p>
          <div style="margin:20px 0;padding:16px;background:#f1f5f9;border-radius:8px;white-space:pre-wrap">${escapeHtml(description)}</div>
          ${pageUrl ? `<p style="font-size:12px;color:#64748b"><strong>Página:</strong> ${escapeHtml(pageUrl)}</p>` : ''}
        </div>
      `,
    }),
  });

  if (!resendResponse.ok) {
    const providerError = await resendResponse.text();
    console.error('Falha no Resend:', resendResponse.status, providerError);
    return response.status(502).json({ error: 'Não foi possível enviar a mensagem agora. Tente novamente.' });
  }

  return response.status(200).json({ ok: true });
}
