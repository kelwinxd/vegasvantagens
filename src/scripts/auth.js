// auth.js
let accessToken = null;
let tokenTimestamp = null;
const EXPIRATION_TIME = 50 * 60 * 1000; // 50 minutos

export async function getClientToken() {
  const now = Date.now();

  // Reutiliza token se ainda estiver válido
  if (accessToken && tokenTimestamp && (now - tokenTimestamp < EXPIRATION_TIME)) {
    return accessToken;
  }

  try {
    const response = await fetch('https://apivegasvantagens-production.up.railway.app/api/Auth/client-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'site_vegas_vantagens',
        clientSecret: '8iYQ340vgwr4R1rOsdTg341m1/QEyGfLOIMkGQUasu0='
      })
    });

    if (!response.ok) throw new Error("Token request failed");

    const data = await response.json();
    accessToken = data.accessToken;
    tokenTimestamp = now;

    return accessToken;
  } catch (err) {
    console.error("Erro ao obter token do cliente:", err);
    return null;
  }
}

export async function loginToken(email, senha) {
  try {
    const response = await fetch('https://apivegasvantagens-production.up.railway.app/api/Auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    if (!response.ok) throw new Error("Login falhou");

    const data = await response.json();
    return data.accessToken;
  } catch (err) {
    console.error("Erro no login:", err);
    return null;
  }
}
