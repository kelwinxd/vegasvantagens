import { getClientToken, loginToken, API_BASE, CLIENT_ID, CLIENT_SECRET } from '../auth.js';

 let estabelecimentosCache = [];

async function buscarEstabelecimentos() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/Estabelecimentos`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) throw new Error("Erro ao buscar estabelecimentos");
    const data = await res.json();

    const detalhes = await Promise.all(
      data.map(e =>
        fetch(`${API_BASE}/api/Estabelecimentos/${e.id}`, {
          headers: { Authorization: "Bearer " + token }
        })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    );

    estabelecimentosCache = detalhes.filter(Boolean);

    // Dashboard
    atualizarDashboard();

    // Página de gerenciamento
    renderizarLista(estabelecimentosCache, "listaCards");

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar estabelecimentos");
  }
}

function renderizarLista(lista, containerId) {
  const container = document.getElementById(containerId);
   if (!container) return;
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum estabelecimento.</p>";
    return;
  }

  lista.forEach(estab => {

    console.log(estab)
    const card = document.createElement("div");
    card.className = "card-estab";

    const fachada = estab.imagens?.find(i => i.fachada);
    const logo = estab.imagens?.find(i => i.logo);

    const img = document.createElement("img");
    img.src =
      estab.imagemPrincipal ||
      fachada?.url ||
      logo?.url ||
      "./imgs/default-image.png";

    const info = document.createElement("div");
    info.innerHTML = `
      <h3>${estab.nome}</h3>
      <p>${estab.cidade}</p>
      <span class="status ${estab.ativo ? "ativo" : "inativo"}">
        ${estab.ativo === 'true' ? "Ativo" : "Inativo"}
      </span>
    `;

    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}

function atualizarDashboard() {
  document.getElementById("totalEstab").textContent =
    estabelecimentosCache.length;

  filtrarDashboard("ativos");
}


function filtrarDashboard(status) {
  const listaFiltrada = estabelecimentosCache.filter(e =>
    status === "ativos" ? e.ativo : !e.ativo
  );

  renderizarLista(listaFiltrada, "listaCardsDashboard");
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    filtrarDashboard(tab.dataset.status);

    const paginaAtiva = document.querySelector(".page .active");
    console.log('pagina ativa: ', paginaAtiva)

  if (!paginaAtiva) return;

  if (paginaAtiva.dataset.page === "promocoes") {
    carregarCuponsPromocoes();
  }
  });
});

async function carregarCuponsPromocoes(options = { ignoreCache: false }) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const CACHE_KEY = "cache_cupons_promocoes";
  const CACHE_TIME = 5 * 60 * 1000; // 5 minutos

  // 📦 Tentar cache
  if (!options.ignoreCache) {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      const { data, timestamp } = JSON.parse(cache);

      if (Date.now() - timestamp < CACHE_TIME) {
        console.log("✔ Cupons promoções carregados do cache");
        window._cuponsPromocoes = data;
        renderizarPromocoes(data);
        return;
      }
    }
  }

  console.log("🔄 Buscando cupons para promoções...");

  try {
    // Buscar estabelecimentos
    const resEstab = await fetch(`${API_BASE}/api/Estabelecimentos`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!resEstab.ok) throw new Error("Erro ao buscar estabelecimentos");

    const estabelecimentos = await resEstab.json();

    // Buscar cupons em paralelo
    const cuponsPorEstabelecimento = await Promise.all(
      estabelecimentos.map(estab =>
        fetch(`${API_BASE}/api/Cupons/por-estabelecimento/${estab.id}`, {
          headers: { Authorization: "Bearer " + token }
        })
          .then(res => res.ok ? res.json() : [])
          .then(cupons => cupons.map(c => ({
            ...c,
            nomeEstabelecimento: estab.nome
          })))
          .catch(() => [])
      )
    );

    const cupons = cuponsPorEstabelecimento.flat();

    // 💾 Salvar cache
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: cupons,
        timestamp: Date.now()
      })
    );

    window._cuponsPromocoes = cupons;

    renderizarPromocoes(cupons);

  } catch (err) {
    console.error("Erro ao carregar promoções:", err);
  }
}

function verificarPaginaAtiva() {
  const paginaAtiva = document.querySelector(".page .active");

  if (!paginaAtiva) return;

  if (paginaAtiva.dataset.page === "promocoes") {
    carregarCuponsPromocoes();
  }
}


function renderizarPromocoes(cupons) {
  const container = document.getElementById("listaPromocoes");

  if (!container) return;

  if (cupons.length === 0) {
    container.innerHTML = "<p>Nenhuma promoção encontrada.</p>";
    return;
  }

  container.innerHTML = cupons.map(c => `
    <div class="cupom">
      <strong>${c.titulo || "Cupom"}</strong>
      <span>${c.nomeEstabelecimento}</span>
    </div>
  `).join("");
}



buscarEstabelecimentos();
carregarCuponsPromocoes();



