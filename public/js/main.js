/* =====================================================================
   ARQUIVO: public/js/main.js
   ===================================================================== */
(function () {
  "use strict";

  /* ==================================================================
     PARTE 1 - MENU (abre e fecha ao clicar nas 3 barrinhas)
     ================================================================== */
  const botaoMenu = document.querySelector(".menu-botao");
  const fundoMenu = document.querySelector(".fundo-menu");

  function fecharMenu() { document.body.classList.remove("menu-aberto"); }
  function alternarMenu() { document.body.classList.toggle("menu-aberto"); }

  if (botaoMenu) {
    botaoMenu.addEventListener("click", alternarMenu);
    botaoMenu.setAttribute("aria-expanded", "false");
  }
  if (fundoMenu) fundoMenu.addEventListener("click", fecharMenu);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });

  /* ==================================================================
     PARTE 2 - TRANSICAO ENTRE PAGINAS
     ================================================================== */
  document.addEventListener("click", function (e) {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const externo = a.target === "_blank" || /^(https?:|mailto:|tel:|#)/i.test(href);
    if (externo || !/\.html$/i.test(href)) return;
    e.preventDefault();
    fecharMenu();
    document.body.classList.add("saindo");
    setTimeout(function () { window.location.href = href; }, 260);
  });

  window.addEventListener("pageshow", function () {
    document.body.classList.remove("saindo");
  });

  setTimeout(function () { document.body.classList.add("pronto"); }, 40);

  /* ==================================================================
     PARTE 3 - APARECER AO ROLAR ("revelar")
     ================================================================== */
  const alvos = document.querySelectorAll(".revelar");
  if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada, i) {
        if (entrada.isIntersecting) {
          const el = entrada.target;
          const atraso = Number(el.dataset.atraso || (i % 4) * 90);
          setTimeout(function () { el.classList.add("visivel"); }, atraso);
          observador.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    alvos.forEach(function (el) { observador.observe(el); });
  } else {
    alvos.forEach(function (el) { el.classList.add("visivel"); });
  }

  window.addEventListener("load", function () {
    alvos.forEach(function (el) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) el.classList.add("visivel");
    });
  });

  /* ==================================================================
     PARTE 4 - ICONES DO CLIMA (Corrigido para cores neutras e brancas)
     ================================================================== */
  var ICONES = {
    sol: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><circle cx="32" cy="32" r="12" fill="none" stroke="#fff"/><path d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.7 5.7M44.7 44.7l5.7 5.7M50.4 13.6l-5.7 5.7M19.3 44.7l-5.7 5.7"/></svg>',
    solNuvem: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><circle cx="24" cy="24" r="9" fill="none" stroke="#fff"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11.3 11.3l4.2 4.2M32.5 32.5l4.2 4.2M36.7 11.3l-4.2 4.2M15.5 32.5l-4.2 4.2"/><path d="M22 50h22a10 10 0 0 0 .6-19.9A14 14 0 0 0 18 34" fill="#fff" stroke="none"/></svg>',
    nuvem: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"><path d="M18 48h26a11 11 0 0 0 .7-21.9A15 15 0 0 0 16.5 30A9.5 9.5 0 0 0 18 48Z" fill="#fff" stroke="none"/></svg>',
    nevoa: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M18 40h26a11 11 0 0 0 .7-21.9A15 15 0 0 0 16.5 22A9.5 9.5 0 0 0 18 40Z" fill="#fff" stroke="none"/><path d="M12 48h40M18 56h32"/></svg>',
    chuva: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 38h26a11 11 0 0 0 .7-21.9A15 15 0 0 0 16.5 20A9.5 9.5 0 0 0 18 38Z" fill="#fff" stroke="none"/><path d="M22 46l-3 10M32 46l-3 10M42 46l-3 10"/></svg>',
    trovoada: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 38h26a11 11 0 0 0 .7-21.9A15 15 0 0 0 16.5 20A9.5 9.5 0 0 0 18 38Z" fill="#fff" stroke="none"/><path d="M32 42l-6 12h8l-4 10" stroke="#fff"/></svg>',
    neve: '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 38h26a11 11 0 0 0 .7-21.9A15 15 0 0 0 16.5 20A9.5 9.5 0 0 0 18 38Z" fill="#fff" stroke="none"/><path d="M24 48v10M20 53l8-4M28 53l-8-4M40 48v10M36 53l8-4M44 53l-8-4"/></svg>',
  };

  function iconePorCodigo(codigo) {
    if (codigo === 0) return ICONES.sol;
    if (codigo === 1 || codigo === 2) return ICONES.solNuvem;
    if (codigo === 3) return ICONES.nuvem;
    if (codigo === 45 || codigo === 48) return ICONES.nevoa;
    if (codigo >= 51 && codigo <= 67) return ICONES.chuva;
    if (codigo >= 71 && codigo <= 77) return ICONES.neve;
    if (codigo >= 80 && codigo <= 82) return ICONES.chuva;
    if (codigo >= 85 && codigo <= 86) return ICONES.neve;
    if (codigo >= 95) return ICONES.trovoada;
    return ICONES.nuvem;
  }

  /* ==================================================================
     PARTE 5 - CLIMA (Corrigido para fundo transparente estilo Glass)
     ================================================================== */
  const cxClima = document.getElementById("clima-conteudo");

  function numero(v, casas) {
    if (v === null || v === undefined) return "--";
    return Number(v).toFixed(casas === undefined ? 0 : casas).replace(".", ",");
  }

  function horaLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function carregarClima() {
    if (!cxClima) return;
    
    // Força o fundo escuro com blur (Glassmorphism) igual à foto original
    cxClima.parentElement.style.background = "rgba(20, 30, 60, 0.65)";
    cxClima.parentElement.style.backdropFilter = "blur(12px)";
    cxClima.parentElement.style.webkitBackdropFilter = "blur(12px)";
    cxClima.parentElement.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    cxClima.parentElement.style.color = "#ffffff";
    cxClima.parentElement.style.maxWidth = "400px";

    fetch("/api/clima", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.erro || "Falha ao consultar o clima");
        
        // Estrutura HTML limpa e alinhada
        cxClima.innerHTML = `
          <div style="text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #fff;">${d.cidade} - BA</p>
            <p style="margin: 0; font-size: 0.85rem; color: rgba(255,255,255,0.7);">Destino dos universitários</p>
          </div>
          
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
            <div style="display: flex; align-items: baseline; gap: 8px;">
              <span style="font-size: 3.5rem; font-weight: 800; line-height: 1; color: #fff;">${numero(d.temperatura)}&deg;</span>
              <span style="font-size: 1.1rem; font-weight: 500; color: rgba(255,255,255,0.9);">${d.descricao}</span>
            </div>
            <div style="width: 54px; height: 54px;">
              ${iconePorCodigo(d.codigo)}
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
            <div>
              <p style="margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6);">UMIDADE</p>
              <p style="margin: 0; font-size: 1rem; font-weight: 700; color: #fff;">${numero(d.umidade)}%</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6);">VENTO</p>
              <p style="margin: 0; font-size: 1rem; font-weight: 700; color: #fff;">${numero(d.vento)} km/h</p>
            </div>
          </div>
          
          <p style="margin: 16px 0 0; font-size: 0.75rem; color: rgba(255,255,255,0.5);">Atualizado em ${horaLocal(d.atualizadoEm)}</p>
        `;
      })
      .catch(function (e) {
        cxClima.innerHTML = '<p style="color:#fff; text-align:center;">Não foi possível carregar o clima.<br><small>' + (e.message || "") + '</small></p>';
      });
  }

  carregarClima();
  if (cxClima) setInterval(carregarClima, 10 * 60 * 1000);

  /* ==================================================================
     PARTE 6 - ROTA (Corrigido para integrar ao visual Glass)
     ================================================================== */
  const botaoRota = document.getElementById("botao-rota");
  const painelRota = document.getElementById("rota");
  
  // Ícone original do botão (setinha)
  const iconeBotao = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width: 20px; height: 20px;"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>';

  if (botaoRota && painelRota) {
    // Força o visual original branco no botão
    botaoRota.style.background = "#fff";
    botaoRota.style.color = "#101e52";
    botaoRota.style.border = "none";
    botaoRota.style.padding = "14px 34px";
    botaoRota.innerHTML = `${iconeBotao} Rota para VCA`;
    
    // Força o efeito Glass no painel da rota para combinar com o clima
    painelRota.style.background = "rgba(20, 30, 60, 0.65)";
    painelRota.style.backdropFilter = "blur(12px)";
    painelRota.style.webkitBackdropFilter = "blur(12px)";
    painelRota.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    painelRota.style.color = "#ffffff";
    painelRota.style.maxWidth = "400px";

    botaoRota.addEventListener("click", function () {
      botaoRota.disabled = true;
      botaoRota.innerHTML = "Calculando...";
      painelRota.classList.add("visivel");
      painelRota.innerHTML = '<p style="color:#fff; text-align:center;">Consultando tempo de trajeto...</p>';

      fetch("/api/rota", { headers: { Accept: "application/json" } })
        .then(function (r) { return r.json().then(function (d) { return { status: r.status, dados: d }; }); })
        .then(function (res) {
          const d = res.dados || {};

          if (!d.ok) {
            painelRota.innerHTML = `<p style="color:#fff;"><strong>Erro:</strong> ${d.erro || "Não foi possível calcular a rota."}</p>`;
            return;
          }

          const chegada = new Date(Date.now() + d.duracaoSegundos * 1000);
          
          // Injeta a estrutura de Rota alinhada ao design do Clima
          painelRota.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <p style="margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6);">Tempo</p>
                <p style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #fff;">${d.duracaoTexto}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6);">Distância</p>
                <p style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #fff;">${d.distanciaTexto}</p>
              </div>
            </div>
            <p style="margin: 0; font-size: 0.9rem; color: rgba(255,255,255,0.85); border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
              Chegada prevista por volta das <strong>${chegada.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>
            </p>
            ${d.estimativa ? '<p style="margin: 12px 0 0; font-size: 0.75rem; color: #f0b429;">⚠️ Estimado sem trânsito (Rota alternativa)</p>' : ''}
          `;
        })
        .catch(function () {
          painelRota.innerHTML = '<p style="color:#fff;"><strong>Falha de comunicação com o servidor.</strong></p>';
        })
        .finally(function () {
          botaoRota.disabled = false;
          botaoRota.innerHTML = `${iconeBotao} Rota para VCA`;
        });
    });
  }

  /* ==================================================================
     PARTE 7 - DETALHES
     ================================================================== */
  document.querySelectorAll("[data-ano]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();