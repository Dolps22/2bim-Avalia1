import { gerarDesenho } from "../../lib/desenho.js";

const erro = (status, msg) =>
  new Response(JSON.stringify({ erro: msg }), {
    status,
    headers: { "Content-Type": "application/json" }
  });

export async function onRequest({ request, env }) {
  // 405: método
  if (request.method !== "POST") return erro(405, "Método não permitido");

  // 400: corpo
  let corpo;
  try { corpo = await request.json(); } catch { return erro(400, "Corpo inválido"); }
  const numero = corpo && corpo.numero;
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    return erro(400, "numero deve ser um inteiro entre 1 e 100");
  }

  // 401: token
  const m = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return erro(401, "Token ausente");

  let r;
  try {
    r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(m[1]));
  } catch {
    return erro(401, "Falha ao verificar o token");
  }
  if (r.status !== 200) return erro(401, "Token inválido ou expirado");

  const info = await r.json();
  if (info.aud !== env.GOOGLE_CLIENT_ID) return erro(401, "aud diferente do Client ID");
  if (String(info.email_verified) !== "true") return erro(401, "E-mail não verificado");
  if (!info.email) return erro(401, "Token sem e-mail");

  // 200: SVG assinado com o e-mail do token
  return new Response(gerarDesenho(numero, info.email), {
    status: 200,
    headers: { "Content-Type": "image/svg+xml" }
  });
}
