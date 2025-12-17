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
        ${estab.ativo ? "Ativo" : "Inativo"}
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
  });
});

buscarEstabelecimentos();
