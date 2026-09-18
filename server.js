/*
 * ARQUIVO: server.js  -  O "cérebro" do site (roda no servidor, nao no navegador)
 * Site da Comissão de Transporte dos Universitários de Divisa Alegre - MG
 * ---------------------------------------------------------------------------
 * Servidor HTTP em Node puro, sem dependencias. Nao precisa de npm install.
 *
 * INDICE DAS PARTES (use Ctrl+F pelo numero, ex: "PARTE 3")
 *   PARTE 1  Configuracao ........ le o .env e guarda tudo em CFG
 *   PARTE 2  Utilidades .......... respostas JSON, cache, limite de acessos, seguranca
 *   PARTE 3  Clima ............... chama a Open-Meteo (nao usa chave)
 *   PARTE 4  Arquivos estaticos .. entrega HTML, CSS, JS e imagens de ./public
 *   PARTE 5  Servidor ............ define as rotas /api/... e liga o site na porta
 *
 * Rodar:  node server.js         (porta padrao 3000, ou defina PORT no .env)
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

/* ------------------------------------------------------------------ */
/* PARTE 1 - CONFIGURACAO: le o .env e monta o objeto CFG              */
/* ------------------------------------------------------------------ */
const RAIZ = __dirname;
const ARQ_ENV = path.join(RAIZ, ".env");

function carregarEnv(caminho) {
  if (!fs.existsSync(caminho)) return;
  const linhas = fs.readFileSync(caminho, "utf8").split(/\r?\n/);
  for (const linha of linhas) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith("#")) continue;
    const i = limpa.indexOf("=");
    if (i === -1) continue;
    const chave = limpa.slice(0, i).trim();
    let valor = limpa.slice(i + 1).trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    if (!(chave in process.env)) process.env[chave] = valor;
  }
}
carregarEnv(ARQ_ENV);

const CFG = {
  porta: Number(process.env.PORT || 3000),
  climaLat: process.env.CLIMA_LAT || "-14.8661",
  climaLon: process.env.CLIMA_LON || "-40.8394",
  climaCidade: process.env.CLIMA_CIDADE || "Vitória da Conquista",
  climaTz: process.env.CLIMA_TIMEZONE || "America/Bahia",
  pastaPublica: path.join(RAIZ, "public"),
};

/* ------------------------------------------------------------------ */
/* PARTE 2 - UTILIDADES: json(), cache, limpar() e limitarAcesso()     */
/* ------------------------------------------------------------------ */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

const cache = new Map();          // cache simples em memoria
const acessos = new Map();        // rate limit por IP

function json(res, status, dados) {
  const corpo = JSON.stringify(dados);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(corpo),
  });
  res.end(corpo);
}

function limpar(v) {
  let s = String(v == null ? "" : v);
  return s.slice(0, 400);
}

async function buscar(url, opcoes, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs || 12000);
  try {
    return await fetch(url, { ...opcoes, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function limitarAcesso(ip) {
  const agora = Date.now();
  const janela = 60000, max = 30;
  const reg = acessos.get(ip) || { inicio: agora, n: 0 };
  if (agora - reg.inicio > janela) { reg.inicio = agora; reg.n = 0; }
  reg.n += 1;
  acessos.set(ip, reg);
  return reg.n <= max;
}

/* ------------------------------------------------------------------ */
/* PARTE 3 - CLIMA: DESCRICAO_TEMPO + clima()                          */
/* ------------------------------------------------------------------ */
const DESCRICAO_TEMPO = {
  0: "Céu limpo", 1: "Predomínio de sol", 2: "Parcialmente nublado", 3: "Nublado",
  45: "Nevoeiro", 48: "Nevoeiro com geada", 51: "Garoa fraca", 53: "Garoa moderada",
  55: "Garoa forte", 56: "Garoa congelante", 57: "Garoa congelante forte",
  61: "Chuva fraca", 63: "Chuva moderada", 65: "Chuva forte",
  66: "Chuva congelante", 67: "Chuva congelante forte",
  71: "Neve fraca", 73: "Neve moderada", 75: "Neve forte", 77: "Grãos de neve",
  80: "Pancadas de chuva", 81: "Pancadas moderadas de chuva", 82: "Pancadas fortes de chuva",
  85: "Pancadas de neve", 86: "Pancadas fortes de neve",
  95: "Trovoada", 96: "Trovoada com granizo", 99: "Trovoada forte com granizo",
};

async function clima() {
  const chave = "clima";
  const salvo = cache.get(chave);
  if (salvo && Date.now() - salvo.em < 5 * 60 * 1000) return salvo.dados;

  const url = "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${encodeURIComponent(CFG.climaLat)}&longitude=${encodeURIComponent(CFG.climaLon)}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
    `&timezone=${encodeURIComponent(CFG.climaTz)}`;

  const r = await buscar(url, { headers: { "User-Agent": "site-universitarios-divisa-alegre" } });
  if (!r.ok) throw new Error("Open-Meteo respondeu " + r.status);
  const d = await r.json();
  const c = d.current || {};
  const dados = {
    ok: true,
    fonte: "Open-Meteo",
    cidade: CFG.climaCidade,
    temperatura: c.temperature_2m,
    sensacao: c.apparent_temperature,
    umidade: c.relative_humidity_2m,
    vento: c.wind_speed_10m,
    chuva: c.precipitation,
    codigo: c.weather_code,
    descricao: DESCRICAO_TEMPO[c.weather_code] || "Condição não informada",
    atualizadoEm: c.time,
  };
  cache.set(chave, { em: Date.now(), dados });
  return dados;
}

/* ------------------------------------------------------------------ */
/* PARTE 4 - ARQUIVOS ESTATICOS: servirEstatico()                      */
/* ------------------------------------------------------------------ */
function servirEstatico(req, res, caminhoUrl) {
  let rel = decodeURIComponent(caminhoUrl.split("?")[0]);
  if (rel === "/" || rel === "") rel = "/index.html";
  if (rel.endsWith("/")) rel += "index.html";

  const alvo = path.normalize(path.join(CFG.pastaPublica, rel));
  if (!alvo.startsWith(CFG.pastaPublica)) {          // protecao contra path traversal
    return json(res, 403, { ok: false, erro: "Acesso negado." });
  }
  if (!fs.existsSync(alvo) || !fs.statSync(alvo).isFile()) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end("<h1>404 — Página não encontrada</h1><p><a href=\"/\">Voltar à página inicial</a></p>");
  }

  const ext = path.extname(alvo).toLowerCase();
  const cacheavel = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".css", ".js", ".ico"].includes(ext);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": cacheavel ? "public, max-age=86400" : "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  fs.createReadStream(alvo).pipe(res);
}

/* ------------------------------------------------------------------ */
/* PARTE 5 - SERVIDOR: rotas /api/status e /api/clima                  */
/* ------------------------------------------------------------------ */
const servidor = http.createServer(async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?").toString().split(",")[0].trim();
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));

  if (url.pathname.startsWith("/api/")) {
    if (!limitarAcesso(ip)) return json(res, 429, { ok: false, erro: "Muitas solicitações. Aguarde um instante." });

    if (url.pathname === "/api/status") {
      return json(res, 200, {
        ok: true,
        integracoes: {
          clima: "Open-Meteo (sem chave)",
        },
      });
    }

    if (url.pathname === "/api/clima") {
      try {
        return json(res, 200, await clima());
      } catch (e) {
        console.error("[clima] falhou:", limpar(e.message));
        return json(res, 502, { ok: false, erro: "Não foi possível consultar o clima agora. " + limpar(e.message) });
      }
    }

    return json(res, 404, { ok: false, erro: "Endpoint não encontrado." });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return json(res, 405, { ok: false, erro: "Método não permitido." });
  }

  servirEstatico(req, res, url.pathname);
});

servidor.listen(CFG.porta, "0.0.0.0", () => {
  console.log(`Site no ar em http://0.0.0.0:${CFG.porta}`);
  console.log(`  Clima : Open-Meteo (${CFG.climaCidade})`);
});