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

async function carregarCartoes() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/Cartoes`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) {
      throw new Error("Erro ao buscar cartões");
    }

    const cartoes = await res.json();

    console.log(cartoes)
    const container = document.querySelector(".cards-row");

    container.innerHTML = "";

    cartoes.forEach(cartao => {
      const label = document.createElement("label");
      label.className = "field-ratio";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = cartao.id;

      const span = document.createElement("span");
      span.textContent = cartao.nome;

      label.appendChild(input);
      label.appendChild(span);

      container.appendChild(label);
    });

  } catch (error) {
    console.error(error);
    alert("Não foi possível carregar os cartões.");
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

  const token = localStorage.getItem("token");

  console.log(lista)

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
    info.className = "card-info";
    info.innerHTML = `
      <h3>${estab.nome}</h3>
      <p>${estab.cidade ?? ""}</p>
      <span class="status ${estab.ativo ? "ativo" : "inativo"}">
        ${estab.ativo ? "Ativo" : "Inativo"}
      </span>
    `;

    // 🔴 BOTÃO EXCLUIR
    const btnExcluir = document.createElement("button");
    btnExcluir.className = "btn-excluir";
    btnExcluir.textContent = "Excluir";

    btnExcluir.addEventListener("click", async (e) => {
      e.stopPropagation(); // evita conflito com clique no card

      if (!confirm(`Tem certeza que deseja excluir "${estab.nome}"?`)) return;

      try {
        const res = await fetch(
          `${API_BASE}/api/Estabelecimentos/${estab.id}`,
          {
            method: "DELETE",
            headers: {
              "Authorization": "Bearer " + token
            }
          }
        );

        if (!res.ok) throw new Error("Erro ao excluir");

        card.remove();
        alert("Estabelecimento excluído com sucesso!");

      } catch (err) {
        console.error(err);
        alert("Erro ao excluir o estabelecimento.");
      }
    });

    card.appendChild(img);
    card.appendChild(info);
    card.appendChild(btnExcluir);
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
  const CACHE_TIME = 5 * 60 * 1000;

  // 📦 Cache
  if (!options.ignoreCache) {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      const { data, timestamp } = JSON.parse(cache);
      if (Date.now() - timestamp < CACHE_TIME) {
        window._cuponsPromocoes = data;
        renderizarPromocoes(data);
        return;
      }
    }
  }

  try {
    // 🔹 Buscar estabelecimentos
    const resEstab = await fetch(`${API_BASE}/api/Estabelecimentos`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!resEstab.ok) throw new Error("Erro ao buscar estabelecimentos");

    const estabelecimentos = await resEstab.json();

    // 🔹 Buscar cupons por estabelecimento
    const cuponsPorEstab = await Promise.all(
      estabelecimentos.map(estab =>
        fetch(`${API_BASE}/api/Cupons/por-estabelecimento/${estab.id}`, {
          headers: { Authorization: "Bearer " + token }
        })
          .then(res => res.ok ? res.json() : [])
          .then(cupons =>
            cupons.map(c => ({
              ...c,
              nomeEstabelecimento: estab.nome
            }))
          )
          .catch(() => [])
      )
    );

    const cupons = cuponsPorEstab.flat();

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data: cupons, timestamp: Date.now() })
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

  container.innerHTML = "";

  if (!cupons.length) {
    container.innerHTML = "<p>Nenhuma promoção encontrada.</p>";
    return;
  }

  cupons.forEach(c => {
    const imagem =
      c.imagens && c.imagens.length
        ? c.imagens[0]
        : "./imgs/woman-card.png";

    container.insertAdjacentHTML("beforeend", `
      <article class="cupom-card">
        <div class="cupom-media">
          <img src="${imagem}" alt="Imagem do cupom" loading="lazy">
          <span class="cupom-badge">
            <strong>${c.titulo}</strong>
          </span>
        </div>

        <div class="cupom-content">
          <h3>${c.nomeEstabelecimento}</h3>

          <p><strong>Código:</strong> ${c.codigo || "-"}</p>
          <p><strong>Desconto:</strong> ${c.valorDesconto} (${c.tipo})</p>
          <p class="expira">
            Expira em ${new Date(c.dataExpiracao).toLocaleDateString()}
          </p>

          <div class="cupom-actions">
            <button class="btn-excluir" data-id="${c.id}">
              Excluir
            </button>
          </div>
        </div>
      </article>
    `);
  });

  document.querySelectorAll(".btn-excluir").forEach(btn => {
    btn.addEventListener("click", () =>
      excluirCupomPromocao(btn.dataset.id)
    );
  });
}



async function excluirCupomPromocao(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este cupom?");
  if (!confirmar) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) {
      const erro = await res.text();
      throw new Error(erro);
    }

    alert("Cupom excluído com sucesso!");

    // 🔄 Força recarregar ignorando cache
    carregarCuponsPromocoes({ ignoreCache: true });

  } catch (err) {
    console.error("Erro ao excluir cupom:", err);
    alert("Erro ao excluir cupom.");
  }
}

async function buscarImagemCupom(cupomId) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}/api/Cupons/${cupomId}/imagens`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) return null;

    const imagens = await res.json();

    if (!imagens || imagens.length === 0) return null;

    // ajuste conforme o backend (url, caminho, base64 etc.)
    return imagens[0].url || imagens[0].caminho || null;

  } catch (err) {
    console.error("Erro ao buscar imagem do cupom", err);
    return null;
  }
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

async function carregarCidades() {
  const estadoId = document.getElementById("estadoId2").value;
  const token = localStorage.getItem("token");

  if (!estadoId || !token) return;

  try {
    const res = await fetch(`${API_BASE}/api/Cidades/por-estado/${estadoId}`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Erro ao buscar cidades");

    const cidades = await res.json();

    const selectCidade = document.getElementById("cidadeId2");
    selectCidade.innerHTML = '<option value="">Selecione uma cidade</option>';

    cidades.forEach(cidade => {
      const option = document.createElement("option");
      option.value = cidade.id;
      option.textContent = cidade.nome;
      selectCidade.appendChild(option);
    });

    console.log("Cidades carregadas para estado:", estadoId);

  } catch (err) {
    alert("Erro ao carregar cidades");
    console.error(err);
  }
}

async function carregarEstados() {
  const estados = [
    { id: 1, nome: "São Paulo" },
    { id: 2, nome: "Rio de Janeiro" },
    { id: 3, nome: "Minas Gerais" }
  ];

  const selectEstado = document.getElementById("estadoId2");

  // limpa antes
  selectEstado.innerHTML = '<option value="">Selecione um estado</option>';

  estados.forEach(estado => {
    const option = document.createElement("option");
    option.value = estado.id;
    option.textContent = estado.nome;
    selectEstado.appendChild(option);
  });

  console.log("Estados carregados");

  // 🔑 só chama cidades quando o estado mudar
  selectEstado.addEventListener("change", carregarCidades);
}


window.onload = async () => {
  carregarCategorias();
  await carregarEstados();
  carregarCartoes();
  

  

  const btnMapa = document.querySelector(".btn-map");
  const map = document.getElementById("mapurl");

  if (btnMapa && map) {
    btnMapa.addEventListener("click", () => {
      const coordenadas = extrairLatLngGoogleMaps(map.value);
      if (!coordenadas) return;

      document.querySelector(".lat").value = coordenadas.latitude;
      document.querySelector(".long").value = coordenadas.longitude;
    });
  }
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

//Cartões
async function vincularCartoes(estabelecimentoId, cartoesIds) {
  const token = localStorage.getItem("token");
  if (!token || !cartoesIds.length) return;

  const res = await fetch(
    `${API_BASE}/api/Cartoes/${estabelecimentoId}/vincular-estabelecimento`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(cartoesIds)
    }
  );

  if (!res.ok) {
    const erro = await res.text();
    throw new Error("Erro ao vincular cartões: " + erro);
  }
}

function obterCartoesSelecionados() {
  return Array.from(
    document.querySelectorAll(".cards-row input[type='checkbox']:checked")
  ).map(input => Number(input.id));
}




async function cadastrarEstabelecimento2() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const categoriaId = parseInt(document.getElementById("categoriaId2").value) || null;

  const cidadeSelect = document.getElementById("cidadeId2");
  

const data = {
  "nome": document.getElementById("nomeEstab2").value.trim(),
  "razaoSocial": document.getElementById("razaoSocial2").value.trim(),
  "cnpj": document.getElementById("cnpj2").value.trim(),
  "telefone": document.getElementById("telefone2").value.trim(),
  "emailContato": document.getElementById("emailContato2").value.trim(),
  "ativo": document.getElementById("ativoEstab2").checked,

  "categoriaId": Number(document.getElementById("categoriaId2").value),
  "cidadeId": Number(document.getElementById("cidadeId2").value),

  "rua": document.getElementById("rua2").value.trim(),
  "numero": document.getElementById("numero2").value.trim(),
  "bairro": document.getElementById("bairro2").value.trim(),
  "complemento": document.getElementById("complemento2").value.trim(),
  "cep": document.getElementById("cep2").value.trim(),

  "latitude": Number(document.getElementById("latitude2").value),
  "longitude": Number(document.getElementById("longitude2").value),

  "grupoId": null,
  "mapaUrl": document.getElementById("mapurl2").value.trim(),
  "sobre": document.getElementById("sobre2").value.trim(),
  "status": "Rascunho"
};



console.log('rodou antes do  try')


  try {
    const res = await fetch(`${API_BASE}/api/Estabelecimentos/Criar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify(data),
        
        });

console.log(data)

console.log('depois do try');



    if (!res.ok) {
      const erro = await res.text();
      throw new Error(erro);
    }

    const estab = await res.json();

    // 🔹 VINCULAR CATEGORIA (AQUI ESTAVA FALTANDO)
    if (categoriaId) {
      await vincularCategoria(estab.id, categoriaId);
    }

    // 🔹 VINCULAR CARTÕES
    const cartoesIds = obterCartoesSelecionados();
    if (cartoesIds.length > 0) {
  await vincularCartoes(estab.id, cartoesIds);
    }

    // 🔹 envio das imagens
    const logo = document.getElementById("logoImagem2").files[0];
    const fachada = document.getElementById("fachadaImagem2").files[0];

    if (logo) {
      await enviarImagemEstabelecimento(estab.id, logo, true, false);
    }

    if (fachada) {
      await enviarImagemEstabelecimento(estab.id, fachada, false, true);
    }

    alert("Estabelecimento cadastrado com sucesso!");
    document.getElementById("formCadastro2").reset();

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
    const select = document.getElementById("categoriaId2");
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
window.cadastrarEstabelecimento2 = cadastrarEstabelecimento2;




