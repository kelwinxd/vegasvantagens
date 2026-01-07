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

function fecharSubPages() {
  document.querySelectorAll(".sub-page")
    .forEach(sp => sp.classList.remove("active"));
}

function abrirSubPage(nome) {
  fecharSubPages();

  const subpage = document.querySelector(
    `.sub-page[data-subpage="${nome}"]`
  );

  if (!subpage) {
    console.warn("Subpage não encontrada:", nome);
    return;
  }

  subpage.classList.add("active");
}

// Listener genérico

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-open-subpage]");
  if (!btn) return;

  // Remove active de todos os botões
  document
    .querySelectorAll("[data-open-subpage]")
    .forEach(el => el.classList.remove("active"));

  // Ativa o botão clicado
  btn.classList.add("active");

  // Abre a subpage correspondente
  const subpage = btn.dataset.openSubpage;
  abrirSubPage(subpage);
});





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

 
  });
});


//CUPOM
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

async function cadastrarCupom() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  function toIso(dt) {
    return dt ? new Date(dt).toISOString() : null;
  }

  // 1) MONTA O OBJETO DO CUPOM
  const data = {
    codigo: document.getElementById("codigo").value,
    titulo: document.getElementById("titulo").value,
    descricao: document.getElementById("descricao").value,
    modalTitulo: document.getElementById("modalTitulo").value,
    modalDescricao: document.getElementById("modalDescricao").value,
    tipo: document.getElementById("tipo").value,
    valorDesconto: parseFloat(document.getElementById("valorDesconto").value),
    valorMinimoCompra: parseFloat(document.getElementById("valorMinimoCompra").value) || 0,

    dataInicio: toIso(document.getElementById("dataInicio").value),
    dataExpiracao: toIso(document.getElementById("dataExpiracao").value),

    limiteUso: parseInt(document.getElementById("limiteUso").value) || 0,
    limiteUsoPorUsuario: parseInt(document.getElementById("limiteUsoPorUsuario").value) || 0,

    ativo: document.getElementById("ativo").checked,
    estabelecimentoId: parseInt(document.getElementById("estabelecimentoId").value),

    cartoesAceitosIds: document.getElementById("cartoes").value
      ? document.getElementById("cartoes").value.split(",").map(id => parseInt(id.trim()))
      : []
  };

  try {
    // 2) CRIA O CUPOM
    const res = await fetch(`${API_BASE}/api/Cupons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Erro ao criar cupom: " + res.status);

    const cupomCriado = await res.json();
    const cupomId = cupomCriado.id;

    console.log("Cupom criado com ID:", cupomId);

    // 3) ENVIO DAS IMAGENS (opcional)
    const galeriaFile = document.getElementById("imgGaleria").files[0];
    const modalFile = document.getElementById("imgModal").files[0];

    async function enviarImagem(tipo, file) {
      const form = new FormData();
      form.append("imagem", file);
      form.append("tipo", tipo); // "Galeria" ou "Modal"

      const imgRes = await fetch(`${API_BASE}/api/Cupons/${cupomId}/imagens`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token
        },
        body: form
      });

      if (!imgRes.ok) throw new Error("Erro ao enviar imagem " + tipo);
    }

    // GALERIA
    if (galeriaFile) {
      await enviarImagem("Galeria", galeriaFile);
      console.log("Imagem Galeria enviada!");
    }

    // MODAL
    if (modalFile) {
      await enviarImagem("Modal", modalFile);
      console.log("Imagem Modal enviada!");
    }

    alert("Cupom criado com sucesso!");

    document.getElementById("formCupom").reset();

  } catch (err) {
    alert("Erro: " + err.message);
    console.error(err);
  }
}

//MAPA URL

function extrairLatLngGoogleMaps(url) {
  if (!url || typeof url !== "string") return null;

  // Padrão: @lat,lng
  const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchAt = url.match(regexAt);

  if (matchAt) {
    return {
      latitude: parseFloat(matchAt[1]),
      longitude: parseFloat(matchAt[2]),
    };
  }

  // Fallback: !3dLAT!4dLNG
  const regexFallback = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
  const matchFallback = url.match(regexFallback);

  if (matchFallback) {
    return {
      latitude: parseFloat(matchFallback[1]),
      longitude: parseFloat(matchFallback[2]),
    };
  }

  return null;
}

const map = document.getElementById("mapurl");
const btnMapa = document.querySelector(".btn-map");

btnMapa.addEventListener("click", () => {
  const url = map.value;
  const coordenadas = extrairLatLngGoogleMaps(url);

  if (!coordenadas) {
    console.log("Coordenadas não encontradas");
    return;
  }
  
  document.querySelector(".lat").value = coordenadas.latitude
  document.querySelector(".long").value = coordenadas.latitude

  console.log("Latitude:", coordenadas.latitude);
  console.log("Longitude:", coordenadas.longitude);
});


//ESTAB

window.onload = () => {
  carregarCategorias();
  carregarEstados();

  document
    .getElementById("formCadastro")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      cadastrarEstabelecimento();
    });
};

async function enviarImagemEstabelecimento(estabelecimentoId, file, principal, fachada) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("imagem", file);

  const url =
    `${API_BASE}/api/estabelecimentos/${estabelecimentoId}/imagens` +
    `?principal=${principal}&fachada=${fachada}&logo=${principal}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token
    },
    body: formData
  });

  if (!res.ok) {
    const erro = await res.text();
    throw new Error("Erro imagem: " + erro);
  }
}



async function cadastrarEstabelecimento() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const categoriaId = parseInt(document.getElementById("categoriaId").value) || null;

  const data = {
    nome: document.getElementById("nomeEstab").value,
    razaoSocial: document.getElementById("razaoSocial").value,
    cnpj: document.getElementById("cnpj").value,
    telefone: document.getElementById("telefone").value,
    emailContato: document.getElementById("emailContato").value,
    ativo: document.getElementById("ativoEstab").checked,

    grupoId: null,

    cidadeId: parseInt(document.getElementById("cidadeId").value) || null,
    rua: document.getElementById("rua").value,
    numero: document.getElementById("numero").value,
    bairro: document.getElementById("bairro").value,
    complemento: document.getElementById("complemento").value,
    cep: document.getElementById("cep").value,

    mapaUrl: document.getElementById("mapurl").value || null,
    sobre: document.getElementById("sobre").value || "",
    status: "Rascunho",

    latitude: parseFloat(document.getElementById("latitude").value) || 0,
    longitude: parseFloat(document.getElementById("longitude").value) || 0
  };

  try {
    const res = await fetch(`${API_BASE}/api/Estabelecimentos/Criar`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const erro = await res.text();
      throw new Error(erro);
    }

    const estab = await res.json();

    // 🔹 VINCULAR CATEGORIA (AQUI ESTAVA FALTANDO)
    if (categoriaId) {
      await vincularCategoria(estab.id, categoriaId);
    }

    // 🔹 envio das imagens
    const logo = document.getElementById("logoImagem").files[0];
    const fachada = document.getElementById("fachadaImagem").files[0];

    if (logo) {
      await enviarImagemEstabelecimento(estab.id, logo, true, false);
    }

    if (fachada) {
      await enviarImagemEstabelecimento(estab.id, fachada, false, true);
    }

    alert("Estabelecimento cadastrado com sucesso!");
    document.getElementById("formCadastro").reset();

  } catch (err) {
    console.error(err);
    alert("Erro ao cadastrar: " + err.message);
  }
}

  async function vincularCategoria(estabelecimentoId, categoriaId) {
  const token = localStorage.getItem("token");
  await fetch(`${API_BASE}/api/Estabelecimentos/${estabelecimentoId}/vincular-categorias`, {
    method: "POST", // ← alterado de PUT para POST
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify([categoriaId]) // ← continua um array
  });
}

function carregarCategorias() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para carregar as categorias.");
    return;
  }

  fetch(`${API_BASE}/api/CategoriasEstabelecimentos`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Erro ao buscar categorias: " + res.status);
    return res.json();
  })
  .then(data => {
    const select = document.getElementById("categoriaId");
    select.innerHTML = "";

    data.forEach(categoria => {
      const option = document.createElement("option");
      option.value = categoria.id;
      option.textContent = categoria.nome;
      select.appendChild(option);
    });
  })
  .catch(err => {
    alert("Erro ao carregar categorias: " + err.message);
    console.error(err);
  });
}







buscarEstabelecimentos();
carregarCuponsPromocoes();
window.cadastrarCupom = cadastrarCupom;



