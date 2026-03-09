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

      console.log(detalhes)

      estabelecimentosCache = detalhes.filter(Boolean);

      


   
      

      // Página de gerenciamento
      renderizarLista(estabelecimentosCache, "listaCards");
      inicializarFiltroDashboard()

      //Grafico
      inicializarDashboardGraficos();
         
      // Dashboard
      atualizarDashboard();
     

    } catch (err) {
      console.error(err);
      alert("Erro ao carregar estabelecimentos");
    }

    
  }


//CARTOES ACEITOS

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




 inicializarPaginaEstabelecimentos();


// ============================================================
//  renderizarLista — ATUALIZADO
//  Clique no card → abrirModalEditar() (modal unificado ver/editar)
//  Botão editar   → idem
//  Botão excluir  → excluí normalmente
// ============================================================

function renderizarLista(lista, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum estabelecimento.</p>";
    return;
  }

  lista.forEach(estab => {
    const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';

    let imagemSrc = PLACEHOLDER;
    if (estab.imagemPrincipal) {
      imagemSrc = estab.imagemPrincipal;
    } else if (estab.imagens && estab.imagens.length > 0) {
      const fachada = estab.imagens.find(i => i.fachada);
      const logo    = estab.imagens.find(i => i.logo);
      if (fachada?.url)     imagemSrc = fachada.url;
      else if (logo?.url)   imagemSrc = logo.url;
    }

    // Categorias
    let categoriasHTML = '';
    if (estab.categorias?.length > 0) {
      categoriasHTML = estab.categorias.map(cat =>
        `<span class="categoria-badge">${cat}</span>`
      ).join('');
    }

    // Badge status operacional
    const statusOpClass = {
      "Ativo":     "status-op-ativo",
      "Pausado":   "status-op-pausado",
      "Cancelado": "status-op-cancelado"
    }[estab.statusOperacional] || "status-op-ativo";

    const statusOpLabel = estab.statusOperacional || "Ativo";
    const isPublicado   = estab.statusPublicacao === "Publicado";

    const cardHTML = `
      <div class="card-estab-novo" data-id="${estab.id}" style="cursor:pointer;" title="Clique para ver detalhes">
        <div class="card-img-container">
          <img src="${imagemSrc}" alt="${estab.nome}"
               onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
        </div>

        <div class="info-wrapper">
          <div class="card-info-container">
            <div class="header-info-container">
              <div class="header-info-names">
                <h3 class="card-titulo">${estab.nome}</h3>
                <p class="card-localizacao">${estab.cidade || ""} - ${estab.unidadeFederativa || "SP"}</p>
              </div>

              <div class="toggle-container">
                <label class="switch-card" title="Publicação: ${isPublicado ? 'Publicado' : 'Rascunho'}">
                  <input type="checkbox" id="toggle-pub-${estab.id}"
                    ${isPublicado ? "checked" : ""} data-estab-id="${estab.id}">
                  <span class="slider-card"></span>
                </label>
                <span class="status-op-badge ${statusOpClass}">${statusOpLabel}</span>
              </div>
            </div>
          </div>

          <div class="card-acoes-container">
            <div class="card-categorias">
              ${categoriasHTML}
            </div>
            <div class="botoes-acoes">
              <button class="btn-acao btn-editar" data-action="editar" title="Ver / Editar">
                <img src="./imgs/icons/edit-e.svg" alt="Editar">
              </button>
              <button class="btn-acao btn-excluir" data-action="excluir" title="Excluir">
                <img src="./imgs/icons/trash-02.svg" alt="Excluir">
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHTML);

    const card = container.lastElementChild;

    // ── Clique no card (qualquer área exceto botões e toggle) abre o modal ver ──
    card.addEventListener("click", (e) => {
      // Ignora cliques nos botões de ação e no toggle de publicação
      if (
        e.target.closest("[data-action]") ||
        e.target.closest(".switch-card") ||
        e.target.closest("input[type='checkbox']")
      ) return;
      abrirModalEditar(estab);
    });

    // ── Toggle: altera statusPublicacao ───────────────────────────────────────
    const togglePub = card.querySelector(`#toggle-pub-${estab.id}`);
    togglePub.addEventListener("change", async (e) => {
      e.stopPropagation();
      const isChecked           = e.target.checked;
      const estabelecimentoId   = e.target.dataset.estabId;
      const novoStatusPublicacao = isChecked ? "Publicado" : "Rascunho";

      try {
        await atualizarStatusEstabelecimentoPatch(
          estabelecimentoId,
          novoStatusPublicacao,
          estab.statusOperacional || "Ativo"
        );

        estab.statusPublicacao = novoStatusPublicacao;

        const index = estabelecimentosCache.findIndex(e => e.id === estab.id);
        if (index !== -1) estabelecimentosCache[index].statusPublicacao = novoStatusPublicacao;

        togglePub.closest('label').title = `Publicação: ${novoStatusPublicacao}`;
        console.log(`✅ statusPublicacao → ${novoStatusPublicacao}`);

        if (typeof _atualizarContadores === 'function') _atualizarContadores();

      } catch (err) {
        console.error("❌ Erro ao alterar statusPublicacao:", err);
        alert("Erro ao alterar status de publicação: " + err.message);
        e.target.checked = !isChecked;
      }
    });

    // ── Botão editar ──────────────────────────────────────────────────────────
    card.querySelector('[data-action="editar"]').addEventListener("click", (e) => {
      e.stopPropagation();
      abrirModalEditar(estab);
    });

    // ── Botão excluir ─────────────────────────────────────────────────────────
    card.querySelector('[data-action="excluir"]').addEventListener("click", async (e) => {
      e.stopPropagation();

      if (!confirm(`Tem certeza que deseja excluir "${estab.nome}"?`)) return;

      const token = localStorage.getItem("token");

      try {
        const res = await fetch(`${API_BASE}/api/Estabelecimentos/${estab.id}`, {
          method: "DELETE",
          headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) throw new Error("Erro ao excluir");

        const index = estabelecimentosCache.findIndex(e => e.id === estab.id);
        if (index > -1) estabelecimentosCache.splice(index, 1);

        card.remove();
        alert("Estabelecimento excluído com sucesso!");

        if (typeof _atualizarContadores === 'function') _atualizarContadores();
        if (typeof inicializarFiltros    === 'function') inicializarFiltros();

      } catch (err) {
        console.error(err);
        alert("Erro ao excluir o estabelecimento.");
      }
    });
  });
}

// ========== PATCH STATUS — mesmo endpoint /status, envia ambos os campos ==========
async function atualizarStatusEstabelecimentoPatch(estabelecimentoId, statusPublicacao, statusOperacional) {
  const token = localStorage.getItem("token");

  if (!token) throw new Error("Token não encontrado");

  console.log(`🔄 Atualizando status do estabelecimento ${estabelecimentoId}:`, { statusPublicacao, statusOperacional });

  const response = await fetch(`${API_BASE}/api/Estabelecimentos/${estabelecimentoId}/status`, {
    method: "PATCH",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ statusPublicacao, statusOperacional })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Erro na resposta:", errorText);
    throw new Error(`Erro ao atualizar status: ${response.status} - ${errorText}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    console.log("✅ Resposta do servidor:", data);
    return data;
  }

  console.log("✅ Status atualizado com sucesso");
  return null;
}


 /*
function renderizarLista(lista, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum estabelecimento.</p>";
    return;
  }

  lista.forEach(estab => {
    const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';

    let imagemSrc = PLACEHOLDER;
    
    if (estab.imagemPrincipal) {
      imagemSrc = estab.imagemPrincipal;
    } else if (estab.imagens && estab.imagens.length > 0) {
      const fachada = estab.imagens.find(i => i.fachada);
      const logo = estab.imagens.find(i => i.logo);
      
      if (fachada && fachada.url) {
        imagemSrc = fachada.url;
      } else if (logo && logo.url) {
        imagemSrc = logo.url;
      }
    }

    // Renderiza categorias
    let categoriasHTML = '';
    if (estab.categorias && estab.categorias.length > 0) {
      categoriasHTML = estab.categorias.map(cat => 
        `<span class="categoria-badge">${cat}</span>`
      ).join('');
    }

    // Cria o card usando template literal
    const cardHTML = `
     <div class="card-estab-novo" data-id="${estab.id}">
        <!-- Imagem -->
        <div class="card-img-container">
          <img src="${imagemSrc}" alt="${estab.nome}">
        </div>
        
        <div class="info-wrapper">
        
        <!-- Informações -->
        <div class="card-info-container">
          <div class="header-info-container">
           <div class="header-info-names">
            <h3 class="card-titulo">${estab.nome}</h3>
             <p class="card-localizacao">${estab.cidade || ""} - ${estab.unidadeFederativa || "SP"}</p>
           </div>
            
            <!-- Toggle -->
            <div class="toggle-container">
              <label class="switch-card">
                <input type="checkbox" id="toggle-${estab.id}" ${estab.status === "Publicado" ? "checked" : ""} data-estab-id="${estab.id}">
                <span class="slider-card"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div class="card-acoes-container">
        <div class="card-categorias">
            ${categoriasHTML}
        </div>

          <div class="botoes-acoes">
            <button class="btn-acao btn-editar" data-action="editar">
              <img src="./imgs/icons/edit-e.svg" alt="Editar">
            </button>
            <button class="btn-acao btn-excluir" data-action="excluir">
              <img src="./imgs/icons/trash-02.svg" alt="Excluir">
            </button>
          </div>
        </div>
        </div>
      </div>
    `;

    // Insere o card no container
    container.insertAdjacentHTML('beforeend', cardHTML);

    // Pega o card recém-criado
    const card = container.lastElementChild;

    // Event listener para o toggle - USA PATCH
    const toggleInput = card.querySelector(`#toggle-${estab.id}`);
    toggleInput.addEventListener("change", async (e) => {
      const isChecked = e.target.checked;
      const estabelecimentoId = e.target.dataset.estabId;
      
      // Se marcado = "Publicado", se desmarcado = "Rascunho"
      const novoStatus = isChecked ? "Publicado" : "Rascunho";
      
      try {
        await atualizarStatusEstabelecimentoPatch(estabelecimentoId, novoStatus);
        
        // Atualiza o cache local
        estab.status = novoStatus;
        estab.ativo = isChecked;
        
        // Atualiza o cache global
        const index = estabelecimentosCache.findIndex(e => e.id === estab.id);
        if (index !== -1) {
          estabelecimentosCache[index].status = novoStatus;
          estabelecimentosCache[index].ativo = isChecked;
        }
        
        console.log(`✅ Status do estabelecimento ${estabelecimentoId} atualizado para: ${novoStatus}`);
        
        // Atualiza os contadores
        if (typeof _atualizarContadores === 'function') {
          _atualizarContadores();
        }

      } catch (err) {
        console.error("❌ Erro ao alterar status:", err);
        alert("Erro ao alterar status: " + err.message);
        // Reverte o toggle em caso de erro
        e.target.checked = !isChecked;
      }
    });

    // Event listener para o botão editar
    const btnEditar = card.querySelector('[data-action="editar"]');
    btnEditar.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirModalEditar(estab);
    });

    // Event listener para o botão excluir
    const btnExcluir = card.querySelector('[data-action="excluir"]');
    btnExcluir.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (!confirm(`Tem certeza que deseja excluir "${estab.nome}"?`)) return;

      const token = localStorage.getItem("token");

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

        // Remove do cache
        const index = estabelecimentosCache.findIndex(e => e.id === estab.id);
        if (index > -1) {
          estabelecimentosCache.splice(index, 1);
        }

        card.remove();
        alert("Estabelecimento excluído com sucesso!");
        
        // Atualiza contadores e filtros
        if (typeof _atualizarContadores === 'function') {
          _atualizarContadores();
        }
        if (typeof inicializarFiltros === 'function') {
          inicializarFiltros();
        }

      } catch (err) {
        console.error(err);
        alert("Erro ao excluir o estabelecimento.");
      }
    });
  });
}

// ========== FUNÇÃO PATCH PARA ATUALIZAR STATUS DO ESTABELECIMENTO ==========
async function atualizarStatusEstabelecimentoPatch(estabelecimentoId, novoStatus) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new Error("Token não encontrado");
  }

  try {
    console.log(`🔄 Atualizando status do estabelecimento ${estabelecimentoId} para: ${novoStatus}`);
    
    const response = await fetch(`${API_BASE}/api/Estabelecimentos/${estabelecimentoId}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(novoStatus) // Envia apenas a string: "Publicado" ou "Rascunho"
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro na resposta:", errorText);
      throw new Error(`Erro ao atualizar status: ${response.status} - ${errorText}`);
    }

    // Verifica se há conteúdo na resposta
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("✅ Resposta do servidor:", data);
      return data;
    }
    
    console.log("✅ Status do estabelecimento atualizado com sucesso");
    return null;

  } catch (err) {
    console.error("❌ Erro ao fazer PATCH:", err);
    throw err;
  }
}

*/


// ========== INICIALIZAÇÃO ==========

// 🔹 IMPORTANTE: Chamar apenas UMA VEZ quando abrir a subpage
document.addEventListener('DOMContentLoaded', () => {
  const btnListaEstab = document.querySelector('[data-open-subpage="lista-estab"]');
  
  if (btnListaEstab) {
    btnListaEstab.addEventListener('click', () => {
      // Pequeno delay para garantir que o DOM está pronto
      setTimeout(() => {
        inicializarPaginaEstabelecimentos();
      }, 100);
    });
  }

    const form = document.getElementById('formCadastro2');

  // Atualiza preview sempre que qualquer campo mudar
  form.addEventListener('input', atualizarPreview);
  form.addEventListener('change', atualizarPreview);

  // Executa uma vez ao abrir
  atualizarPreview();
});

  function filtrarEstabelecimentos(texto) {
    const containerId = "listaCards";

    if (!texto || texto.trim() === "") {
      renderizarLista(estabelecimentosCache, containerId);
      return;
    }

    const termo = texto.toLowerCase();

    const filtrados = estabelecimentosCache.filter(estab =>
      estab.nome?.toLowerCase().includes(termo) ||
      estab.cidade?.toLowerCase().includes(termo) ||
      estab.status?.toLowerCase().includes(termo)
    );

    renderizarLista(filtrados, containerId);
  }

function inicializarBuscaEstabelecimentos() {
  const input = document.querySelector(".search-estab");
  if (!input) return;

  input.addEventListener("input", e => {
    filtrarEstabelecimentos(e.target.value);
  });
}

document.querySelector(".search-estab").addEventListener("input", e => {
    filtrarEstabelecimentos(e.target.value);
  });




// ========== NOVA CLASSE GERENCIADORA ==========

class GerenciadorSubPages {
  constructor(pageElement) {
    this.page = pageElement;
    this.hierarquia = {}; // Cada página pode ter sua própria hierarquia
    this.init();
  }
  
  init() {
    this.page.querySelectorAll("[data-open-subpage]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const nomeSubpage = btn.dataset.openSubpage;
        
        // Se for botão de voltar, usa o método voltarPara
        if (btn.classList.contains("btn-voltar")) {
          e.preventDefault();
          this.voltarPara(nomeSubpage);
          return;
        }
        
        // Caso contrário, troca normalmente
        this.trocarSubPage(btn);
      });
    });
  }
  
  trocarSubPage(btn) {
    const nomeSubpage = btn.dataset.openSubpage;
    
    // Remove active de todos os botões principais desta página
    this.page.querySelectorAll(".btns-subpage [data-open-subpage]")
      .forEach(b => b.classList.remove("active"));
    
    // Verifica se é uma subpage filha
    const paginaPai = this.hierarquia[nomeSubpage];
    
    if (paginaPai) {
      // Se é filha, ativa o botão pai
      this.page.querySelector(`[data-open-subpage="${paginaPai}"]`)
        ?.classList.add("active");
    } else {
      // Se não é filha, ativa o próprio botão
      btn.classList.add("active");
    }
    
    this.abrirSubPage(nomeSubpage);
  }
  
  abrirSubPage(nome) {
    // Fecha todas as subpages DESTA página
    this.page.querySelectorAll(".sub-page")
      .forEach(sp => sp.classList.remove("active"));
    
    // Abre a subpage desejada
    const subpage = this.page.querySelector(`.sub-page[data-subpage="${nome}"]`);
    if (!subpage) {
      console.warn("Subpage não encontrada:", nome);
      return;
    }
    subpage.classList.add("active");
  }
  
  // Método público para ser chamado de fora
  voltarPara(nomeSubpage) {
    this.abrirSubPage(nomeSubpage);
    // Reativa o botão correspondente
    const btn = this.page.querySelector(`[data-open-subpage="${nomeSubpage}"]`);
    if (btn) {
      this.page.querySelectorAll(".btns-subpage [data-open-subpage]")
        .forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    }
  }
  
  // Setter para hierarquia
  setHierarquia(hierarquia) {
    this.hierarquia = hierarquia;
  }
}

// ========== INICIALIZAÇÃO ==========
const gerenciadores = {};

document.querySelectorAll(".page").forEach(page => {
  const pageId = page.dataset.page;
  gerenciadores[pageId] = new GerenciadorSubPages(page);
});

// Configurar hierarquia para estabelecimentos
/*
if (gerenciadores.estabelecimentos) {
  gerenciadores.estabelecimentos.setHierarquia({
    "criar-estab": "lista-estab"
  });
}

*/

// Configurar hierarquia para promoções (se necessário no futuro)
if (gerenciadores.promocoes) {
  gerenciadores.promocoes.setHierarquia({
    // "criar-cupom": "lista-cupom" // exemplo
  });
}

// ========== FUNÇÕES ESPECÍFICAS ADAPTADAS ==========

// Chame isso quando carregar a página de estabelecimentos
async function inicializarPaginaEstabelecimentos() {
  await buscarEstabelecimentos(); // sua função existente
  await popularFiltros();
  inicializarFiltrosEstabelecimentos();
  aplicarFiltros();
}

// Event listener para quando abrir a subpage de lista de estabelecimentos
document.querySelector('.page[data-page="estabelecimentos"] [data-open-subpage="lista-estab"]')
  ?.addEventListener('click', () => {
    inicializarPaginaEstabelecimentos();
  });

// Função específica para voltar aos estabelecimentos
function voltarEstabelecimentos() {
  if (gerenciadores.estabelecimentos) {
    gerenciadores.estabelecimentos.voltarPara("lista-estab");
  }
}

var filtrosAtivos = {
  busca: "",
  status: "todos",
  statusOperacional: "Todos",
  cidade: "Todos",
  categoria: "Todos",
  grupo: "Todos"
};

// ========== FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO ==========
function inicializarFiltros() {
  console.log("🚀 INICIANDO FILTROS...");

  // Listeners sempre registrados — só dependem do DOM
  _configurarEventListeners();

  // O restante depende dos dados da API
  if (!window.estabelecimentosCache || !Array.isArray(estabelecimentosCache) || estabelecimentosCache.length === 0) {
    console.warn("⚠️ Cache vazio — listeners registrados, aguardando dados.");
    return;
  }

  console.log(`✅ ${estabelecimentosCache.length} estabelecimentos encontrados`);

  _popularFiltroCidades();
  _popularFiltroCategorias();
  _popularFiltroGrupos();

  _atualizarContadores();
  aplicarFiltros();

  console.log("✅ FILTROS INICIALIZADOS COM SUCESSO!");
}

// ========== POPULAR CIDADES ==========
function _popularFiltroCidades() {
  console.log("📍 Populando cidades...");
  
  const select = document.getElementById("filtroCidade");
  if (!select) {
    console.error("❌ Select filtroCidade não encontrado!");
    return;
  }
  
  // Limpa o select
  select.innerHTML = '<option value="Todos">Todas</option>';
  
  // Extrai cidades únicas
  const cidadesSet = new Set();
  estabelecimentosCache.forEach(estab => {
    if (estab.cidade && typeof estab.cidade === 'string' && estab.cidade.trim() !== '') {
      cidadesSet.add(estab.cidade.trim());
    }
  });
  
  const cidades = Array.from(cidadesSet).sort();
  console.log(`  Encontradas ${cidades.length} cidades:`, cidades);
  
  // Adiciona as opções
  cidades.forEach(cidade => {
    const option = document.createElement("option");
    option.value = cidade;
    option.textContent = cidade;
    select.appendChild(option);
  });
  
  console.log(`✅ ${cidades.length} cidades adicionadas ao select`);
}

// ========== POPULAR CATEGORIAS ==========
function _popularFiltroCategorias() {
  console.log("🏷️ Populando categorias...");
  
  const select = document.getElementById("filtroCategoria");
  if (!select) {
    console.error("❌ Select filtroCategoria não encontrado!");
    return;
  }
  
  // Limpa o select - CORRIGIDO: value="Todos"
  select.innerHTML = '<option value="Todos">Todas</option>';
  
  // Extrai categorias únicas
  const categoriasSet = new Set();
  estabelecimentosCache.forEach(estab => {
    if (estab.categorias && Array.isArray(estab.categorias)) {
      estab.categorias.forEach(cat => {
        if (cat && typeof cat === 'string' && cat.trim() !== '') {
          categoriasSet.add(cat.trim());
        }
      });
    }
  });
  
  const categorias = Array.from(categoriasSet).sort();
  console.log(`  Encontradas ${categorias.length} categorias:`, categorias);
  
  // Adiciona as opções
  categorias.forEach(categoria => {
    const option = document.createElement("option");
    option.value = categoria;
    option.textContent = categoria;
    select.appendChild(option);
  });
  
  console.log(`✅ ${categorias.length} categorias adicionadas ao select`);
}

// ========== POPULAR GRUPOS ==========
function _popularFiltroGrupos() {
  console.log("👥 Populando grupos...");
  
  const select = document.getElementById("filtroGrupo");
  if (!select) {
    console.error("❌ Select filtroGrupo não encontrado!");
    return;
  }
  
  // Limpa o select - CORRIGIDO: value="Todos"
  select.innerHTML = '<option value="Todos">Todos</option>';
  
  // Verifica se gruposCache existe
  if (!window.gruposCache || !Array.isArray(gruposCache)) {
    console.warn("⚠️ gruposCache não existe ou não é um array");
    return;
  }
  
  if (gruposCache.length === 0) {
    console.warn("⚠️ gruposCache está vazio");
    return;
  }
  
  console.log(`  Encontrados ${gruposCache.length} grupos:`, gruposCache);
  
  // Adiciona as opções
  gruposCache.forEach(grupo => {
    if (grupo && grupo.id && grupo.nome) {
      const option = document.createElement("option");
      option.value = grupo.id;
      option.textContent = grupo.nome;
      select.appendChild(option);
    }
  });
  
  console.log(`✅ ${gruposCache.length} grupos adicionados ao select`);
}

// ========== CONFIGURAR EVENT LISTENERS ==========
function _configurarEventListeners() {
  console.log("🎧 Configurando event listeners...");

   // Select Status Operacional
  const selectStatusOp = document.getElementById("filtroStatusOperacional");
  console.log(selectStatusOp, "componente dos status")
  if (selectStatusOp) {
    selectStatusOp.addEventListener("change", function(e) {
      filtrosAtivos.statusOperacional = e.target.value;
      console.log("⚙️ Status operacional selecionado:", e.target.value);
      aplicarFiltros();
    });
    console.log("  ✅ Select de status operacional configurado");
  } else {
    console.warn("  ⚠️ Select de status operacional não encontrado");
  }
  
  // Busca
  const inputBusca = document.querySelector(".search-estab");
  if (inputBusca) {
    inputBusca.addEventListener("input", function(e) {
      filtrosAtivos.busca = e.target.value;
      aplicarFiltros();
    });
    console.log("  ✅ Input de busca configurado");
  } else {
    console.warn("  ⚠️ Input de busca não encontrado");
  }
  
  // Tabs de status (statusPublicacao)
  const tabs = document.querySelectorAll(".tab-filtro");
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener("click", function(e) {
        tabs.forEach(t => t.classList.remove("active"));
        this.classList.add("active");
        filtrosAtivos.status = this.getAttribute("data-status");
        aplicarFiltros();
      });
    });
    console.log(`  ✅ ${tabs.length} tabs configuradas`);
  } else {
    console.warn("  ⚠️ Tabs de status não encontradas");
  }
  
  // Select Cidade
  const selectCidade = document.getElementById("filtroCidade");
  if (selectCidade) {
    selectCidade.addEventListener("change", function(e) {
      filtrosAtivos.cidade = e.target.value;
      console.log("🏙️ Cidade selecionada:", e.target.value);
      aplicarFiltros();
    });
    console.log("  ✅ Select de cidade configurado");
  }
  
  // Select Categoria
  const selectCategoria = document.getElementById("filtroCategoria");
  if (selectCategoria) {
    selectCategoria.addEventListener("change", function(e) {
      filtrosAtivos.categoria = e.target.value;
      console.log("🏷️ Categoria selecionada:", e.target.value);
      aplicarFiltros();
    });
    console.log("  ✅ Select de categoria configurado");
  }
  
  // Select Grupo
  const selectGrupo = document.getElementById("filtroGrupo");
  if (selectGrupo) {
    selectGrupo.addEventListener("change", function(e) {
      filtrosAtivos.grupo = e.target.value;
      console.log("👥 Grupo selecionado:", e.target.value);
      aplicarFiltros();
    });
    console.log("  ✅ Select de grupo configurado");
  }

 
  
  console.log("✅ Event listeners configurados");
}

// ========== APLICAR FILTROS ==========

function aplicarFiltros() {
  console.log("🔍 Aplicando filtros...", filtrosAtivos);
  
  let resultado = [...estabelecimentosCache];
  
  // Filtro por busca
  if (filtrosAtivos.busca && filtrosAtivos.busca.trim() !== '') {
    const termo = filtrosAtivos.busca.toLowerCase().trim();
    resultado = resultado.filter(estab => {
      const nome = (estab.nome || '').toLowerCase();
      const cidade = (estab.cidade || '').toLowerCase();
      return nome.includes(termo) || cidade.includes(termo);
    });
    console.log(`  Após busca: ${resultado.length} resultados`);
  }
  
  // Filtro por statusPublicacao
  if (filtrosAtivos.status !== "todos") {
    const statusBusca = filtrosAtivos.status === "publicados" ? "Publicado" : "Rascunho";
    resultado = resultado.filter(estab => estab.statusPublicacao === statusBusca);
    console.log(`  Após statusPublicacao (${statusBusca}): ${resultado.length} resultados`);
  }

  // Filtro por statusOperacional
  // Filtro por statusOperacional
if (filtrosAtivos.statusOperacional && filtrosAtivos.statusOperacional !== "Todos") {
  console.log("🔎 Valores de statusOperacional no cache:", 
    estabelecimentosCache.map(e => ({ nome: e.nome, statusOperacional: e.statusOperacional }))
  );
  resultado = resultado.filter(estab => estab.statusOperacional === filtrosAtivos.statusOperacional);
  console.log(`  Após statusOperacional (${filtrosAtivos.statusOperacional}): ${resultado.length} resultados`);
}
  
  // Filtro por cidade
  if (filtrosAtivos.cidade && filtrosAtivos.cidade !== 'Todos') {
    resultado = resultado.filter(estab => estab.cidade === filtrosAtivos.cidade);
    console.log(`  Após cidade (${filtrosAtivos.cidade}): ${resultado.length} resultados`);
  }
  
  // Filtro por categoria
  if (filtrosAtivos.categoria && filtrosAtivos.categoria !== 'Todos') {
    resultado = resultado.filter(estab => {
      return estab.categorias && 
             Array.isArray(estab.categorias) && 
             estab.categorias.includes(filtrosAtivos.categoria);
    });
    console.log(`  Após categoria (${filtrosAtivos.categoria}): ${resultado.length} resultados`);
  }
  
  // Filtro por grupo
  if (filtrosAtivos.grupo && filtrosAtivos.grupo !== 'Todos') {
    const grupoId = parseInt(filtrosAtivos.grupo);
    resultado = resultado.filter(estab => estab.grupoId === grupoId);
    console.log(`  Após grupo (${grupoId}): ${resultado.length} resultados`);
  }
  
  console.log(`✅ ${resultado.length} de ${estabelecimentosCache.length} estabelecimentos`);
  
  if (typeof renderizarLista === 'function') {
    renderizarLista(resultado, "listaCards");
  } else {
    console.error("❌ Função renderizarLista não encontrada!");
  }
  
  _atualizarContadores();
}


// ========== ATUALIZAR CONTADORES ==========
function _atualizarContadores() {
  const total = estabelecimentosCache.length;
  const publicados = estabelecimentosCache.filter(e => e.statusPublicacao === "Publicado").length;
  const rascunhos = estabelecimentosCache.filter(e => e.statusPublicacao === "Rascunho").length;
  
  const countTodos = document.getElementById("count-todos");
  const countPublicados = document.getElementById("count-publicados");
  const countRascunhos = document.getElementById("count-rascunhos");
  
  if (countTodos) countTodos.textContent = total;
  if (countPublicados) countPublicados.textContent = publicados;
  if (countRascunhos) countRascunhos.textContent = rascunhos;
  
  console.log(`📊 Contadores: Total=${total}, Publicados=${publicados}, Rascunhos=${rascunhos}`);
}




// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
// Garante que os filtros sejam inicializados quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarFiltros);
} else {
  // DOM já está pronto, inicializa imediatamente
  inicializarFiltros();
}
// ========== LIMPAR FILTROS ==========
function limparFiltros() {
  console.log("🧹 Limpando filtros...");
  
  // Reseta o estado
var filtrosAtivos = {
  busca: "",
  status: "todos",
  statusOperacional: "Todos",
  cidade: "Todos",
  categoria: "Todos",
  grupo: "Todos"
};
  
  // Limpa os campos
  const inputBusca = document.querySelector(".search-estab");
  if (inputBusca) inputBusca.value = "";
  
  const selectCidade = document.getElementById("filtroCidade");
  if (selectCidade) selectCidade.value = "";
  
  const selectCategoria = document.getElementById("filtroCategoria");
  if (selectCategoria) selectCategoria.value = "";
  
  const selectGrupo = document.getElementById("filtroGrupo");
  if (selectGrupo) selectGrupo.value = "";

  const filtroStatusOp = document.getElementById("filtroStatusOperacional");
  if (filtroStatusOp) filtroStatusOp.value = "Todos";
  filtrosAtivos.statusOperacional = "Todos";
  
  // Ativa a tab "Todos"
  const tabs = document.querySelectorAll(".tab-filtro");
  tabs.forEach(tab => tab.classList.remove("active"));
  
  const tabTodos = document.querySelector('[data-status="todos"]');
  if (tabTodos) tabTodos.classList.add("active");
  
  // Reaplica os filtros
  aplicarFiltros();
  
  console.log("✅ Filtros limpos");
}

// ========== RECARREGAR FILTROS ==========
function recarregarFiltros() {
  console.log("🔄 Recarregando filtros...");
  _popularFiltroCidades();
  _popularFiltroCategorias();
  _popularFiltroGrupos();
  _atualizarContadores();
  aplicarFiltros();
}



console.log("✅ Filtros carregados! Execute testarFiltros() para verificar.");

// ========== EVENT LISTENERS ==========
function inicializarFiltrosEstabelecimentos() {
  // Busca por texto
  document.querySelector(".search-estab")?.addEventListener("input", e => {
    filtrosAtivos.busca = e.target.value;
    aplicarFiltros();
  });

  // Filtro de status (Todos, Publicados, Rascunhos)
  document.querySelectorAll(".tab-filtro").forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active de todos
      document.querySelectorAll(".tab-filtro").forEach(t => t.classList.remove("active"));
      // Adiciona active no clicado
      tab.classList.add("active");
      
      // Atualiza o filtro
      filtrosAtivos.status = tab.dataset.status;
      aplicarFiltros();
    });
  });

  // Filtro por cidade
  document.getElementById("filtroCidade")?.addEventListener("change", e => {
    filtrosAtivos.cidade = e.target.value;
    aplicarFiltros();
  });

  // Filtro por categoria
  document.getElementById("filtroCategoria")?.addEventListener("change", e => {
    filtrosAtivos.categoria = e.target.value;
    aplicarFiltros();
  });

  // Filtro por grupo
  document.getElementById("filtroGrupo")?.addEventListener("change", e => {
    filtrosAtivos.grupo = e.target.value;
    aplicarFiltros();
  });
}

// ========== ATUALIZAR DASHBOARD (remover tabs antigas) ==========
function atualizarDashboard() {
  document.getElementById("totalEstab").textContent = estabelecimentosCache.length;

  const cuponsCache = localStorage.getItem("cache_cupons_promocoes");
  let totalCupons = 0;
  
  if (cuponsCache) {
    try {
      const cupons = JSON.parse(cuponsCache);
      totalCupons = Array.isArray(cupons) ? cupons.length : 0;
    } catch (e) {
      console.error("Erro ao parsear cache de cupons:", e);
      totalCupons = 0;
    }
  }
  
  document.getElementById("totalCupons").textContent = totalCupons;


}

function popularFiltros() {
  console.log("📋 Populando filtros...");
  
  // Popula cada filtro individualmente
  _popularFiltroCidades();
  _popularFiltroCategorias();
  _popularFiltroGrupos();
}






// Listener genérico para botões principais


function inicializarFiltroDashboard() {
  const tabAtiva = document.querySelector(".tab.active");

  if (!tabAtiva) return;

  filtrarDashboard(tabAtiva.dataset.status);
}



function filtrarDashboard(statusFiltro) {
  const listaFiltrada = estabelecimentosCache.filter(estab => {
    if (statusFiltro === "publicados") {
      return estab.status === "Publicado";
    }

    if (statusFiltro === "rascunhos") {
      return estab.status === "Rascunho";
    }

    return true; // fallback (todos)
  });

  renderizarLista(listaFiltrada, "listaCardsDashboard");
}


//Dashboard Filter Button
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
async function carregarCuponsPromocoes() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  try {
    // 1️⃣ Buscar estabelecimentos
    const resEstab = await fetch(`${API_BASE}/api/Estabelecimentos`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!resEstab.ok) {
      throw new Error("Erro ao buscar estabelecimentos");
    }

    const estabelecimentos = await resEstab.json();

    // 2️⃣ Buscar IDs dos cupons por estabelecimento
    const cuponsPorEstab = await Promise.all(
      estabelecimentos.map(estab =>
        fetch(`${API_BASE}/api/Cupons/por-estabelecimento/${estab.id}`, {
          headers: { Authorization: "Bearer " + token }
        })
          .then(res => res.ok ? res.json() : [])
          .then(cupons =>
            cupons.map(c => ({
              id: c.id,
              nomeEstabelecimento: estab.nome
            }))
          )
          .catch(() => [])
      )
    );

    const cuponsBasicos = cuponsPorEstab.flat();

    if (!cuponsBasicos.length) {
      renderizarPromocoes([]);
      window._cuponsPromocoes = [];
      localStorage.setItem("cache_cupons_promocoes", JSON.stringify([]));
      inicializarFiltrosCupons(); // ✅ Inicializa mesmo vazio
      return;
    }

    // 3️⃣ Buscar DADOS COMPLETOS de cada cupom
    const cuponsCompletos = await Promise.all(
      cuponsBasicos.map(cupomBase =>
        fetch(`${API_BASE}/api/Cupons/${cupomBase.id}`, {
          headers: { Authorization: "Bearer " + token }
        })
          .then(res => res.ok ? res.json() : null)
          .then(cupomCompleto =>
            cupomCompleto
              ? {
                  ...cupomCompleto,
                  nomeEstabelecimento: cupomBase.nomeEstabelecimento
                }
              : null
          )
          .catch(() => null)
      )
    );

    const cuponsFiltrados = cuponsCompletos.filter(Boolean);

    // 4️⃣ Atualizar cache global e localStorage
    window._cuponsPromocoes = cuponsFiltrados;
    localStorage.setItem("cache_cupons_promocoes", JSON.stringify(cuponsFiltrados));
    
    // 5️⃣ Renderizar
    renderizarPromocoes(cuponsFiltrados);
    
    // 6️⃣ Inicializar filtros
    inicializarFiltrosCupons();

  } catch (err) {
    console.error("Erro ao carregar cupons:", err);
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

  // 🔹 CRIAR CACHE DOS CUPONS
  const cuponsCacheMap = new Map();

  cupons.forEach(c => {
    // 🔹 GUARDAR NO CACHE
    cuponsCacheMap.set(c.id.toString(), c);
    const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';

    const imagem =
      c.imagens && c.imagens.length
        ? c.imagens[0]
        : PLACEHOLDER;

    // Renderiza badges de cartões (máximo 2 + contador)
const cartoesVisiveis = c.cartoesAceitos ? c.cartoesAceitos.slice(0, 2) : [];
const cartoesExtras = c.cartoesAceitos ? c.cartoesAceitos.length - 2 : 0;

const cartoesHTML = cartoesVisiveis.length > 0
  ? cartoesVisiveis.map(cartao => 
      `<span class="badge-cartao">${cartao.nome}</span>`
    ).join('') + (cartoesExtras > 0 ? `<span class="badge-cartao badge-cartao-extra">+${cartoesExtras}</span>` : '')
  : '';

    // Verifica se está publicado (status === "Publicado")
    const isPublicado = c.status === "Publicado";

    container.insertAdjacentHTML("beforeend", `
      <article class="cupom-card-admin">
        <!-- Imagem -->
        <div class="cupom-media-admin">
          <img src="${imagem}" alt="Imagem do cupom" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
        </div>

        <!-- Badges de Cartões -->
        <div class="cartoes-cp">
          ${cartoesHTML}
        </div>

        <!-- Header com Título e Toggle -->
        <div class="header-cp-admin">
          <h2 class="cupom-title-admin">${c.titulo}</h2>
          
          <label class="switch-cupom-admin">
            <input type="checkbox" ${isPublicado ? 'checked' : ''} data-cupom-id="${c.id}">
            <span class="slider-cupom-admin"></span>
          </label>
        </div>

        <!-- Conteúdo -->
        <div class="cupom-content-admin">
          <h3 class="nome-estab">${c.nomeEstabelecimento}</h3>

          <p class="expira-admin">
            <strong>Validade:</strong> ${new Date(c.dataExpiracao).toLocaleDateString()}
          </p>

          <!-- Botões de Ação -->
          <div class="cupom-actions-admin">
            <button class="btn-action-admin btn-editar-cupom-admin" data-id="${c.id}">
              <img src="./imgs/icons/edit-e.svg" alt="Editar">
            </button>
            <button class="btn-action-admin btn-excluir-cupom-admin" data-id="${c.id}">
              <img src="./imgs/icons/trash-02.svg" alt="Excluir">
            </button>
          </div>
        </div>
      </article>
    `);
  });   

  cupons.forEach(c => {
  console.log(`Cupom: ${c.titulo} | status: "${c.status}" | ativo: ${c.ativo} (${typeof c.ativo})`)})
  

  // 🔹 SALVAR O CACHE GLOBALMENTE
  window._cuponsCacheMap = cuponsCacheMap;

  // Event listeners para editar
  document.querySelectorAll(".btn-editar-cupom-admin").forEach(btn => {
    btn.addEventListener("click", () => {
      // 🔹 BUSCAR DO CACHE
      const cupom = cuponsCacheMap.get(btn.dataset.id);
      if (cupom) {
        abrirModalEditarCupom(cupom.id, cupom.nomeEstabelecimento, cupom.estabelecimentoId);
      }
    });
  });

  // Event listeners para excluir
  document.querySelectorAll(".btn-excluir-cupom-admin").forEach(btn => {
    btn.addEventListener("click", () =>
      excluirCupomPromocao(btn.dataset.id)
    );
  });

  // Event listeners para os toggles - USA PATCH
  document.querySelectorAll(".switch-cupom-admin input").forEach(toggle => {
    toggle.addEventListener("change", async (e) => {
      const cupomId = e.target.dataset.cupomId;
      const isChecked = e.target.checked;
      
      // Se marcado = "Publicado", se desmarcado = "Rascunho"
      const novoStatus = isChecked ? "Publicado" : "Rascunho";
      
      try {
        await atualizarStatusCupomPatch(cupomId, novoStatus);
        
        // Atualiza o cache local
        const cupom = cuponsCacheMap.get(cupomId);
        if (cupom) {
          cupom.status = novoStatus;
        }
        
        // Atualiza o cache global
        if (window._cuponsPromocoes) {
          const index = window._cuponsPromocoes.findIndex(c => c.id.toString() === cupomId);
          if (index !== -1) {
            window._cuponsPromocoes[index].status = novoStatus;
          }
        }
        
        // Atualiza contadores
        if (typeof _atualizarContadoresCupons === 'function') {
          _atualizarContadoresCupons();
        }
        
        console.log(`✅ Status do cupom ${cupomId} atualizado para: ${novoStatus}`);
        
      } catch (err) {
        console.error("❌ Erro ao atualizar status:", err);
        alert("Erro ao atualizar status do cupom.");
        // Reverte o toggle em caso de erro
        e.target.checked = !isChecked;
      }
    });
  });
}

// ========== FUNÇÃO PATCH PARA ATUALIZAR STATUS DO CUPOM ==========
async function atualizarStatusCupomPatch(cupomId, novoStatus) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new Error("Token não encontrado");
  }

  try {
    console.log(`🔄 Atualizando status do cupom ${cupomId} para: ${novoStatus}`);
    
    const response = await fetch(`${API_BASE}/api/Cupons/${cupomId}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(novoStatus) // Envia apenas a string: "Publicado" ou "Rascunho"
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro na resposta:", errorText);
      throw new Error(`Erro ao atualizar status: ${response.status} - ${errorText}`);
    }

    // Verifica se há conteúdo na resposta
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("✅ Resposta do servidor:", data);
      return data;
    }
    
    console.log("✅ Status atualizado com sucesso");
    return null;

  } catch (err) {
    console.error("❌ Erro ao fazer PATCH:", err);
    throw err;
  }
}

//FILTROS CUPOM
var filtrosCuponsAtivos = {
  busca: "",
  status: "todos",
  estabelecimento: "Todos",
  grupo: "Todos"
};

// ========== ENUM DE STATUS DO CUPOM ==========
const CupomStatus = {
  Rascunho: 0,
  Revisao: 1,
  Aprovado: 2,
  Publicado: 3,
  Pausado: 4,
  Expirado: 5
};

// Função helper para verificar se cupom está expirado
function cupomEstaExpirado(cupom) {
  const hoje = new Date();
  const dataExpiracao = new Date(cupom.dataExpiracao);
  return dataExpiracao < hoje;
}

// ========== INICIALIZAR FILTROS DE CUPONS ==========
function inicializarFiltrosCupons() {
  console.log("🎟️ INICIANDO FILTROS DE CUPONS...");
  
  // Verifica se os cupons existem
  if (!window._cuponsPromocoes) {
    console.warn("⚠️ _cuponsPromocoes não existe ainda!");
    return;
  }
  
  if (!Array.isArray(window._cuponsPromocoes)) {
    console.error("❌ _cuponsPromocoes não é um array!");
    return;
  }
  
  console.log(`✅ ${window._cuponsPromocoes.length} cupons encontrados`);
  
  // Popula os filtros (usando caches existentes)
  _popularFiltroEstabelecimentosCupom();
  _popularFiltroGruposCupom();
  
  // Configura event listeners
  _configurarEventListenersCupons();
  
  // Atualiza contadores
  _atualizarContadoresCupons();
  
  // Aplica filtros iniciais
  aplicarFiltrosCupons();
  
  console.log("✅ FILTROS DE CUPONS INICIALIZADOS!");
}

// ========== POPULAR ESTABELECIMENTOS (USA CACHE EXISTENTE) ==========
function _popularFiltroEstabelecimentosCupom() {
  console.log("🏢 Populando estabelecimentos nos filtros de cupom...");
  
  const select = document.getElementById("filtroCupomEstabelecimento");
  if (!select) {
    console.error("❌ Select filtroCupomEstabelecimento não encontrado!");
    return;
  }
  
  // Limpa o select
  select.innerHTML = '<option value="Todos">Todos</option>';
  
  // Verifica se estabelecimentosCache existe e está populado
  if (!window.estabelecimentosCache || !Array.isArray(estabelecimentosCache)) {
    console.warn("⚠️ estabelecimentosCache não existe ou não é um array");
    return;
  }
  
  if (estabelecimentosCache.length === 0) {
    console.warn("⚠️ estabelecimentosCache está vazio");
    return;
  }
  
  // Ordena estabelecimentos por nome
  const estabelecimentosOrdenados = [...estabelecimentosCache].sort((a, b) => 
    (a.nome || '').localeCompare(b.nome || '')
  );
  
  console.log(`  Encontrados ${estabelecimentosOrdenados.length} estabelecimentos no cache`);
  
  // Adiciona as opções
  estabelecimentosOrdenados.forEach(estab => {
    if (estab && estab.id && estab.nome) {
      const option = document.createElement("option");
      option.value = estab.id;
      option.textContent = estab.nome;
      select.appendChild(option);
    }
  });
  
  console.log(`✅ ${estabelecimentosOrdenados.length} estabelecimentos adicionados ao select`);
}

// ========== POPULAR GRUPOS (USA CACHE EXISTENTE) ==========
function _popularFiltroGruposCupom() {
  console.log("👥 Populando grupos nos filtros de cupom...");
  
  const select = document.getElementById("filtroCupomGrupo");
  if (!select) {
    console.error("❌ Select filtroCupomGrupo não encontrado!");
    return;
  }
  
  // Limpa o select
  select.innerHTML = '<option value="Todos">Todos</option>';
  
  // Verifica se gruposCache existe e está populado
  if (!window.gruposCache || !Array.isArray(gruposCache)) {
    console.warn("⚠️ gruposCache não existe ou não é um array");
    return;
  }
  
  if (gruposCache.length === 0) {
    console.warn("⚠️ gruposCache está vazio");
    return;
  }
  
  console.log(`  Encontrados ${gruposCache.length} grupos no cache`);
  
  // Adiciona as opções (grupos já vêm ordenados da API)
  gruposCache.forEach(grupo => {
    if (grupo && grupo.id && grupo.nome) {
      const option = document.createElement("option");
      option.value = grupo.id;
      option.textContent = grupo.nome;
      select.appendChild(option);
    }
  });
  
  console.log(`✅ ${gruposCache.length} grupos adicionados ao select`);
}

// ========== CONFIGURAR EVENT LISTENERS ==========
function _configurarEventListenersCupons() {
  console.log("🎧 Configurando event listeners de cupons...");
  
  // Busca
  const inputBusca = document.querySelector(".search-cupom");
  if (inputBusca) {
    inputBusca.addEventListener("input", function(e) {
      filtrosCuponsAtivos.busca = e.target.value;
      aplicarFiltrosCuponsAtual();
    });
    console.log("  ✅ Input de busca configurado");
  }
  
  // Tabs de status
  const tabs = document.querySelectorAll(".tab-filtro-cupom");
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener("click", function(e) {
        // Remove active de todas
        tabs.forEach(t => t.classList.remove("active"));
        // Adiciona active na clicada
        this.classList.add("active");
        // Atualiza filtro
        filtrosCuponsAtivos.status = this.getAttribute("data-status");
        aplicarFiltrosCuponsAtual();
      });
    });
    console.log(`  ✅ ${tabs.length} tabs configuradas`);
  }
  
  // Select Estabelecimento - ATUALIZADO
  const selectEstab = document.getElementById("filtroCupomEstabelecimento");
  if (selectEstab) {
    selectEstab.addEventListener("change", async function(e) {
      const valorSelecionado = e.target.value;
      filtrosCuponsAtivos.estabelecimento = valorSelecionado;
      
      console.log("🏢 Estabelecimento selecionado:", valorSelecionado);
      
      // Se selecionou "Todos", usa o cache global
      if (valorSelecionado === 'Todos') {
        window._cuponsPromocoesAtual = window._cuponsPromocoes;
        aplicarFiltrosCupons();
      } else {
        // Se selecionou um estabelecimento específico, busca da API
        await buscarCuponsPorEstabelecimento(parseInt(valorSelecionado));
      }
    });
    console.log("  ✅ Select de estabelecimento configurado");
  }
  
  // Select Grupo
  const selectGrupo = document.getElementById("filtroCupomGrupo");
  if (selectGrupo) {
    selectGrupo.addEventListener("change", function(e) {
      filtrosCuponsAtivos.grupo = e.target.value;
      console.log("👥 Grupo selecionado:", e.target.value);
      aplicarFiltrosCuponsAtual();
    });
    console.log("  ✅ Select de grupo configurado");
  }
  
  console.log("✅ Event listeners de cupons configurados");
}

// ========== APLICAR FILTROS NO CONJUNTO ATUAL ==========
function aplicarFiltrosCuponsAtual() {
  // Se há um estabelecimento selecionado, usa a lista atual filtrada
  // Senão, usa o cache completo
  if (filtrosCuponsAtivos.estabelecimento && filtrosCuponsAtivos.estabelecimento !== 'Todos') {
    // Já tem cupons filtrados por estabelecimento em _cuponsPromocoesAtual
    aplicarFiltrosNaListaAtual();
  } else {
    // Usa o cache completo
    aplicarFiltrosCupons();
  }
}

// ========== APLICAR FILTROS NA LISTA ATUAL (PÓS-ESTABELECIMENTO) ==========
function aplicarFiltrosNaListaAtual() {
  console.log("🔍 Aplicando filtros na lista atual...", filtrosCuponsAtivos);
  
  if (!window._cuponsPromocoesAtual || !Array.isArray(window._cuponsPromocoesAtual)) {
    console.error("❌ _cuponsPromocoesAtual não disponível");
    return;
  }
  
  let resultado = [...window._cuponsPromocoesAtual];
  
  // Filtro por busca
  if (filtrosCuponsAtivos.busca && filtrosCuponsAtivos.busca.trim() !== '') {
    const termo = filtrosCuponsAtivos.busca.toLowerCase().trim();
    resultado = resultado.filter(cupom => {
      const titulo = (cupom.titulo || '').toLowerCase();
      const codigo = (cupom.codigo || '').toLowerCase();
      return titulo.includes(termo) || codigo.includes(termo);
    });
    console.log(`  Após busca: ${resultado.length} resultados`);
  }
  
  // Filtro por status

if (filtrosCuponsAtivos.status === "publicados") {
  resultado = resultado.filter(cupom => {
    const estaAtivo = cupom.ativo === true || cupom.ativo === "true";
    return cupom.status === "Publicado" && 
           estaAtivo && 
           !cupomEstaExpirado(cupom);
  });
    console.log(`  Após status (publicados): ${resultado.length} resultados`);
    
  } else if (filtrosCuponsAtivos.status === "expirados") {
    resultado = resultado.filter(cupom => {
      return cupomEstaExpirado(cupom) || cupom.status === "Expirado";
    });
    console.log(`  Após status (expirados): ${resultado.length} resultados`);
    
  } else if (filtrosCuponsAtivos.status === "rascunhos") {
    resultado = resultado.filter(cupom => {
      return cupom.status === "Rascunho";
    });
    console.log(`  Após status (rascunhos): ${resultado.length} resultados`);
  }
  
  // Filtro por grupo
  if (filtrosCuponsAtivos.grupo && filtrosCuponsAtivos.grupo !== 'Todos') {
    const grupoId = parseInt(filtrosCuponsAtivos.grupo);
    
    if (window.estabelecimentosCache && Array.isArray(estabelecimentosCache)) {
      const estabsDoGrupo = estabelecimentosCache
        .filter(e => e.grupoId === grupoId)
        .map(e => e.id);
      
      resultado = resultado.filter(cupom => estabsDoGrupo.includes(cupom.estabelecimentoId));
      console.log(`  Após grupo (${grupoId}): ${resultado.length} resultados`);
    }
  }
  
  console.log(`✅ ${resultado.length} de ${window._cuponsPromocoesAtual.length} cupons`);
  
  // Renderiza os resultados
  renderizarPromocoes(resultado);
  console.log("Cupom exemplo:", window._cuponsPromocoesAtual[0]);
  
  // Atualiza contadores com a lista atual (não filtrada por status)
  _atualizarContadoresCuponsComLista(window._cuponsPromocoesAtual);
}

// ========== BUSCAR CUPONS POR ESTABELECIMENTO ==========
async function buscarCuponsPorEstabelecimento(estabelecimentoId) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const container = document.getElementById("listaPromocoes");
  
  try {
    console.log(`🔍 Buscando cupons do estabelecimento ${estabelecimentoId}...`);
    
    // Mostra loading
    if (container) {
      container.innerHTML = "<p>Carregando...</p>";
    }
    
    // 1️⃣ Busca IDs dos cupons do estabelecimento
    const resCupons = await fetch(
      `${API_BASE}/api/Cupons/por-estabelecimento/${estabelecimentoId}`,
      {
        headers: { Authorization: "Bearer " + token }
      }
    );

    if (!resCupons.ok) {
      console.log(`⚠️ Nenhum cupom encontrado para o estabelecimento ${estabelecimentoId}`);
      window._cuponsPromocoesAtual = [];
      renderizarPromocoes([]);
      _atualizarContadoresCuponsComLista([]);
      return;
    }

    const cuponsBasicos = await resCupons.json();
    
    console.log(`  Encontrados ${cuponsBasicos.length} cupons básicos`);

    if (!cuponsBasicos.length) {
      window._cuponsPromocoesAtual = [];
      renderizarPromocoes([]);
      _atualizarContadoresCuponsComLista([]);
      return;
    }

    // 2️⃣ Busca dados completos de cada cupom
    const cuponsCompletos = await Promise.all(
      cuponsBasicos.map(cupomBase =>
        fetch(`${API_BASE}/api/Cupons/${cupomBase.id}`, {
          headers: { Authorization: "Bearer " + token }
        })
          .then(res => res.ok ? res.json() : null)
          .then(cupomCompleto => {
            if (!cupomCompleto) return null;
            
            // Adiciona o nome do estabelecimento
            const estab = estabelecimentosCache.find(e => e.id === estabelecimentoId);
            return {
              ...cupomCompleto,
              nomeEstabelecimento: estab ? estab.nome : 'Estabelecimento'
            };
          })
          .catch(() => null)
      )
    );

    const cuponsFiltrados = cuponsCompletos.filter(Boolean);
    
    console.log(`✅ ${cuponsFiltrados.length} cupons completos carregados`);

    // 3️⃣ Salva a lista atual de cupons (sem filtros de status ainda)
    window._cuponsPromocoesAtual = cuponsFiltrados;

    // 4️⃣ Aplica os filtros (status, busca, grupo)
    aplicarFiltrosNaListaAtual();

  } catch (err) {
    console.error("❌ Erro ao buscar cupons do estabelecimento:", err);
    window._cuponsPromocoesAtual = [];
    renderizarPromocoes([]);
    _atualizarContadoresCuponsComLista([]);
  }
}

// ========== APLICAR FILTROS (MANTÉM ORIGINAL PARA "TODOS") ==========
function aplicarFiltrosCupons() {
  console.log("🔍 Aplicando filtros de cupons...", filtrosCuponsAtivos);
  
  if (!window._cuponsPromocoes || !Array.isArray(window._cuponsPromocoes)) {
    console.error("❌ _cuponsPromocoes não disponível");
    return;
  }
  
  let resultado = [...window._cuponsPromocoes];
  
  // Filtro por busca
  if (filtrosCuponsAtivos.busca && filtrosCuponsAtivos.busca.trim() !== '') {
    const termo = filtrosCuponsAtivos.busca.toLowerCase().trim();
    resultado = resultado.filter(cupom => {
      const titulo = (cupom.titulo || '').toLowerCase();
      const codigo = (cupom.codigo || '').toLowerCase();
      const estabelecimento = (cupom.nomeEstabelecimento || '').toLowerCase();
      return titulo.includes(termo) || codigo.includes(termo) || estabelecimento.includes(termo);
    });
    console.log(`  Após busca: ${resultado.length} resultados`);
  }
  
  // Filtro por status
  if (filtrosCuponsAtivos.status === "publicados") {
    resultado = resultado.filter(cupom => {
      return cupom.status === "Publicado" && 
             cupom.ativo === true && 
             !cupomEstaExpirado(cupom);
    });
    console.log(`  Após status (publicados): ${resultado.length} resultados`);
    
  } else if (filtrosCuponsAtivos.status === "expirados") {
    resultado = resultado.filter(cupom => {
      return cupomEstaExpirado(cupom) || cupom.status === "Expirado";
    });
    console.log(`  Após status (expirados): ${resultado.length} resultados`);
    
  } else if (filtrosCuponsAtivos.status === "rascunhos") {
    resultado = resultado.filter(cupom => {
      return cupom.status === "Rascunho";
    });
    console.log(`  Após status (rascunhos): ${resultado.length} resultados`);
  }
  
  // Filtro por estabelecimento
  if (filtrosCuponsAtivos.estabelecimento && filtrosCuponsAtivos.estabelecimento !== 'Todos') {
    const estabelecimentoId = parseInt(filtrosCuponsAtivos.estabelecimento);
    resultado = resultado.filter(cupom => cupom.estabelecimentoId === estabelecimentoId);
    console.log(`  Após estabelecimento: ${resultado.length} resultados`);
  }
  
  // Filtro por grupo
  if (filtrosCuponsAtivos.grupo && filtrosCuponsAtivos.grupo !== 'Todos') {
    const grupoId = parseInt(filtrosCuponsAtivos.grupo);
    
    if (window.estabelecimentosCache && Array.isArray(estabelecimentosCache)) {
      const estabsDoGrupo = estabelecimentosCache
        .filter(e => e.grupoId === grupoId)
        .map(e => e.id);
      
      resultado = resultado.filter(cupom => estabsDoGrupo.includes(cupom.estabelecimentoId));
      console.log(`  Após grupo (${grupoId}): ${resultado.length} resultados`);
    } else {
      console.warn("⚠️ estabelecimentosCache não disponível para filtrar por grupo");
    }
  }
  
  console.log(`✅ ${resultado.length} de ${window._cuponsPromocoes.length} cupons`);
  
  renderizarPromocoes(resultado);
  _atualizarContadoresCupons();
}

// ========== ATUALIZAR CONTADORES ==========
function _atualizarContadoresCupons() {
  if (!window._cuponsPromocoes || !Array.isArray(window._cuponsPromocoes)) {
    return;
  }
  
  const total = window._cuponsPromocoes.length;
  
  // Publicados: status = "Publicado" E não expirado E ativo
  const publicados = window._cuponsPromocoes.filter(cupom => {
    return cupom.status === "Publicado" && 
           cupom.ativo === true && 
           !cupomEstaExpirado(cupom);
  }).length;
  
  // Expirados: dataExpiracao < hoje OU status = "Expirado"
  const expirados = window._cuponsPromocoes.filter(cupom => {
    return cupomEstaExpirado(cupom) || cupom.status === "Expirado";
  }).length;
  
  // Rascunhos: status = "Rascunho"
  const rascunhos = window._cuponsPromocoes.filter(cupom => {
    return cupom.status === "Rascunho";
  }).length;
  
  const countTodos = document.getElementById("count-cupons-todos");
  const countPublicados = document.getElementById("count-cupons-publicados");
  const countExpirados = document.getElementById("count-cupons-expirados");
  const countRascunhos = document.getElementById("count-cupons-rascunhos");
  
  if (countTodos) countTodos.textContent = total;
  if (countPublicados) countPublicados.textContent = publicados;
  if (countExpirados) countExpirados.textContent = expirados;
  if (countRascunhos) countRascunhos.textContent = rascunhos;
  
  console.log(`📊 Contadores Cupons: Total=${total}, Publicados=${publicados}, Expirados=${expirados}, Rascunhos=${rascunhos}`);
}

// ========== ATUALIZAR CONTADORES COM LISTA CUSTOMIZADA ==========
function _atualizarContadoresCuponsComLista(listaCupons) {
  if (!listaCupons || !Array.isArray(listaCupons)) {
    return;
  }
  
  const total = listaCupons.length;
  
  // Publicados: status = "Publicado" E não expirado E ativo
  const publicados = listaCupons.filter(cupom => {
    return cupom.status === "Publicado" && 
           cupom.ativo === true && 
           !cupomEstaExpirado(cupom);
  }).length;
  
  // Expirados: dataExpiracao < hoje OU status = "Expirado"
  const expirados = listaCupons.filter(cupom => {
    return cupomEstaExpirado(cupom) || cupom.status === "Expirado";
  }).length;
  
  // Rascunhos: status = "Rascunho"
  const rascunhos = listaCupons.filter(cupom => {
    return cupom.status === "Rascunho";
  }).length;
  
  const countTodos = document.getElementById("count-cupons-todos");
  const countPublicados = document.getElementById("count-cupons-publicados");
  const countExpirados = document.getElementById("count-cupons-expirados");
  const countRascunhos = document.getElementById("count-cupons-rascunhos");
  
  if (countTodos) countTodos.textContent = total;
  if (countPublicados) countPublicados.textContent = publicados;
  if (countExpirados) countExpirados.textContent = expirados;
  if (countRascunhos) countRascunhos.textContent = rascunhos;
  
  console.log(`📊 Contadores Cupons (filtrado): Total=${total}, Publicados=${publicados}, Expirados=${expirados}, Rascunhos=${rascunhos}`);
}

// ========== LIMPAR FILTROS ==========
function limparFiltrosCupons() {
  console.log("🧹 Limpando filtros de cupons...");
  
  // Reseta os filtros
  filtrosCuponsAtivos = {
    busca: "",
    status: "todos",
    estabelecimento: "Todos",
    grupo: "Todos"
  };
  
  // Limpa os campos
  const inputBusca = document.querySelector(".search-cupom");
  if (inputBusca) inputBusca.value = "";
  
  const selectEstab = document.getElementById("filtroCupomEstabelecimento");
  if (selectEstab) selectEstab.value = "Todos";
  
  const selectGrupo = document.getElementById("filtroCupomGrupo");
  if (selectGrupo) selectGrupo.value = "Todos";
  
  // Ativa tab "Todos"
  const tabs = document.querySelectorAll(".tab-filtro-cupom");
  tabs.forEach(tab => {
    if (tab.getAttribute("data-status") === "todos") {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
  
  // Reaplica filtros
  aplicarFiltrosCupons();
  
  console.log("✅ Filtros limpos!");
}

// Cache para armazenar dados
let estabelecimentosModalCache = [];
let cartoesModalCache = [];

// ========================================
// 🔹 RENDERIZAR IMAGENS DO CUPOM
// ========================================
function renderizarImagensCupomEdicao(cupom) {
  const container = document.getElementById("imagensCupomEditContainer");
  container.innerHTML = "";

   const imagens = cupom.imagens || [];

  // 🔹 Pega a ÚLTIMA imagem do array (mais recente)
  const imagemPrincipal = imagens.length > 0 ? imagens[imagens.length - 1] : null;

  // 🔹 IMAGEM PRINCIPAL
  container.appendChild(
    criarBlocoImagemCupom({
      titulo: "Imagem do Cupom",
      imagem: imagemPrincipal,
      cupomId: cupom.id,
      isPrincipal: true
    })
  );
}

// ========================================
// 🔹 CRIAR BLOCO DE IMAGEM (UI)
// ========================================
function criarBlocoImagemCupom({ titulo, imagem, cupomId, isPrincipal }) {
  const div = document.createElement("div");
  div.className = "imagem-edit-item";

  const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';

  const tipoClasse = "upload-cupom";
  // 🔹 imagem agora é uma STRING (URL) e não um objeto
  const srcImagem = imagem || PLACEHOLDER;

  div.innerHTML = `
 

    <div class="upload-card ${tipoClasse}">
      <img />

      <div class="upload-overlay">
        <label class="upload-action">
          <img src="./imgs/image-up.png" class="icon-edit" />
          <input
            type="file"
            accept="image/*"
            onchange="${
              imagem
                ? `substituirImagemCupom(event, ${cupomId})`
                : `adicionarImagemNovaCupom(event, ${cupomId})`
            }"
          />
        </label>

        ${
          imagem
            ? `
              <button
                type="button"
                class="upload-action danger"
                onclick="excluirImagemCupom(${cupomId})"
              >
                <img src="./imgs/trash-02.png" class="icon-edit" />
              </button>
            `
            : ""
        }
      </div>
    </div>
  `;

  // 🔥 Fallback de imagem
  const img = div.querySelector("img");
  img.src = srcImagem;

  img.onerror = () => {
    img.onerror = null;
    img.src = PLACEHOLDER;
  };

  return div;
}
// ========================================
// 🔹 ADICIONAR NOVA IMAGEM
// ========================================
async function adicionarImagemNovaCupom(event, cupomId) {
  const file = event.target.files[0];
  if (!file) return;

  await enviarImagemCupom(cupomId, file, true);

  alert("Imagem adicionada com sucesso");
  recarregarCupomEdit();
}

// ========================================
// 🔹 ENVIAR IMAGEM PARA API
// ========================================
async function enviarImagemCupom(cupomId, file, isPrincipal = true) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Token não encontrado");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("principal", isPrincipal);

  try {
    const res = await fetch(
      `${API_BASE}/api/cupons/${cupomId}/imagens`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        },
        body: formData
      }
    );

    if (!res.ok) {
      throw new Error("Erro ao enviar imagem");
    }

    return await res.json();

  } catch (err) {
    console.error("Erro ao enviar imagem:", err);
    alert("Erro ao enviar imagem do cupom");
    throw err;
  }
}

// ========================================
// 🔹 EXCLUIR IMAGEM (exclui a última)
// ========================================
async function excluirImagemCupom(cupomId) {
  const token = localStorage.getItem("token");

  if (!confirm("Deseja realmente excluir esta imagem?")) return;

  try {
    const res = await fetch(
      `${API_BASE}/api/cupons/${cupomId}/imagens`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    if (!res.ok) {
      alert("Erro ao excluir imagem");
      return;
    }

    alert("Imagem excluída com sucesso");

    // 🔄 Reabrir modal atualizado
    recarregarCupomEdit();

  } catch (err) {
    console.error("Erro ao excluir imagem:", err);
    alert("Erro ao excluir imagem");
  }
}

// ========================================
// 🔹 SUBSTITUIR IMAGEM EXISTENTE
// ========================================
async function substituirImagemCupom(event, cupomId) {
  const file = event.target.files[0];
  if (!file) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    // 1️⃣ Exclui a imagem antiga
    const delResp = await fetch(
      `${API_BASE}/api/cupons/${cupomId}/imagens`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    // ✔️ 404 = imagem já não existe → segue o fluxo
    if (!delResp.ok && delResp.status !== 404) {
      throw new Error("Erro ao excluir imagem antiga");
    }

    // 2️⃣ Envia a nova imagem
    await enviarImagemCupom(cupomId, file, true);

    alert("Imagem atualizada com sucesso");

    // 🔄 Atualiza visual
    recarregarCupomEdit();

  } catch (err) {
    console.error(err);
    alert("Erro ao substituir a imagem.");
  } finally {
    // Limpa o input para permitir reenviar o mesmo arquivo se necessário
    event.target.value = "";
  }
}

// ========================================
// 🔹 RECARREGAR CUPOM NO MODAL
// ========================================
async function recarregarCupomEdit() {
  const id = document.getElementById("edit-id").value;
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(
      `${API_BASE}/api/Cupons/${id}`,
      {
        headers: { Authorization: "Bearer " + token }
      }
    );

    if (!res.ok) {
      throw new Error("Erro ao recarregar cupom");
    }

    const cupomAtualizado = await res.json();
    renderizarImagensCupomEdicao(cupomAtualizado);

  } catch (err) {
    console.error("Erro ao recarregar cupom:", err);
  }
}

// ========== FUNÇÕES DO LOADER ==========
function mostrarLoader(texto = "Carregando cupom...", subtexto = "Aguarde um momento") {
  const loader = document.getElementById("modalLoader");
  const loaderText = loader.querySelector(".loader-text");
  const loaderSubtext = loader.querySelector(".loader-subtext");
  
  if (loaderText) loaderText.textContent = texto;
  if (loaderSubtext) loaderSubtext.textContent = subtexto;
  
  loader.classList.add("active");
  
  // Desabilita scroll do body
  document.body.style.overflow = "hidden";
}

function ocultarLoader() {
  const loader = document.getElementById("modalLoader");
  loader.classList.remove("active");
  
  // Reabilita scroll do body
  document.body.style.overflow = "";
}

// ========================================
// 🔹 ATUALIZAR MODAL EDITAR CUPOM
// ========================================
async function abrirModalEditarCupom(id, nomeEstab, estabelecimentoId) {
  const token = localStorage.getItem("token");

  // 🔹 INICIA O LOADER
  mostrarLoader("Carregando cupom...", "Buscando informações do cupom");

  try {
    // 🔹 Carrega estabelecimentos PASSANDO O NOME (não o ID)
    await carregarEstabelecimentosModal(nomeEstab);
    
    // Atualiza texto do loader
    mostrarLoader("Carregando cupom...", "Carregando cartões aceitos...");
  


    // Atualiza texto do loader
    mostrarLoader("Carregando cupom...", "Processando dados do cupom...");
    
    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
      ocultarLoader();
      alert("Erro ao carregar dados do cupom.");
      return;
    }

    const cupom = await res.json();
    console.log("Cupom carregado:", cupom);

    // Salva o cupom original para reenviar TUDO no PUT
    window._cupomEditando = cupom;

      const idsCartoes = cupom.cartoesAceitos
  ? cupom.cartoesAceitos.map(c => c.id)
  : [];

await carregarCartoesModal(idsCartoes);

    // Preenche os campos do modal
    document.getElementById("edit-id").value = cupom.id;
    document.getElementById("edit-codigo").value = cupom.codigo || "";
    document.getElementById("edit-titulo").value = cupom.titulo || "";
    document.getElementById("edit-descricao").value = cupom.descricao || "";
    document.getElementById("edit-modalTitulo").value = cupom.modalTitulo || "";
    document.getElementById("edit-modalDescricao").value = cupom.modalDescricao || "";
    document.getElementById("edit-tipo").value = cupom.tipo || "";
    document.getElementById("edit-desconto").value = cupom.valorDesconto || "";
    document.getElementById("edit-minimo").value = cupom.valorMinimoCompra || "";

    // Formata datas (remove a parte do horário)
    document.getElementById("edit-inicio").value = cupom.dataInicio?.split("T")[0] || "";
    document.getElementById("edit-expiracao").value = cupom.dataExpiracao?.split("T")[0] || "";

    document.getElementById("edit-limite").value = cupom.limiteUso || "";
    document.getElementById("edit-limiteUsuario").value = cupom.limiteUsoPorUsuario || "";

    document.getElementById("edit-ativo").checked = cupom.ativo || false;

    // 🔹 Exibe os cartões vinculados
    const cartoesHTML = cupom.cartoesAceitos && cupom.cartoesAceitos.length > 0
      ? cupom.cartoesAceitos.map(cartao => 
          `<span class="badge-cartao">${cartao.nome}</span>`
        ).join('')
      : '<p class="text-muted">Nenhum cartão vinculado</p>';
    document.getElementById("cartoes-vinculados").innerHTML = cartoesHTML;

    

    // Atualiza texto do loader
    mostrarLoader("Carregando cupom...", "Carregando imagens...");
    
    // 🔹 RENDERIZA AS IMAGENS DO CUPOM
    await renderizarImagensCupomEdicao(cupom);

    // 🔹 OCULTA O LOADER ANTES DE ABRIR O MODAL
    ocultarLoader();
    
    // Pequeno delay para transição suave
    setTimeout(() => {
      // Abre o modal
      document.getElementById("modalEditarCupom").classList.add("open");
    }, 200);

  } catch (err) {
    console.error("Erro ao carregar cupom:", err);
    ocultarLoader();
    alert("Erro ao carregar dados do cupom.");
  }
}

// 🔹 Função para carregar estabelecimentos no select
async function carregarEstabelecimentosModal(nomeEstabelecimentoSelecionado = null) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/Estabelecimentos`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) throw new Error("Erro ao buscar estabelecimentos");

    const estabelecimentos = await res.json();
    console.log("Estabelecimentos carregados:", estabelecimentos);
    
    // 🔹 Salva no cache
    estabelecimentosModalCache = estabelecimentos;

    const selectEstab = document.getElementById("edit-estabelecimento");

    // Limpa opções existentes
    selectEstab.innerHTML = '<option value="">Selecione um estabelecimento</option>';

    // Adiciona os estabelecimentos
    estabelecimentos.forEach(estab => {
      const option = document.createElement("option");
      option.value = estab.id;
      option.textContent = estab.nome;
      selectEstab.appendChild(option);
    });

    // 🔹 Se foi passado o nome do estabelecimento, seleciona ele automaticamente
    if (nomeEstabelecimentoSelecionado) {
      const estabEncontrado = estabelecimentos.find(e => e.nome === nomeEstabelecimentoSelecionado);
      
      if (estabEncontrado) {
        selectEstab.value = estabEncontrado.id;
        console.log(`✅ Estabelecimento "${nomeEstabelecimentoSelecionado}" selecionado (ID: ${estabEncontrado.id})`);
      } else {
        console.warn(`⚠️ Estabelecimento "${nomeEstabelecimentoSelecionado}" não encontrado na lista.`);
      }
    }

  } catch (error) {
    console.error("Erro ao carregar estabelecimentos:", error);
    alert("Não foi possível carregar os estabelecimentos.");
  }
}
// 🔹 Função para carregar cartões no select multiple
async function carregarCartoesModal(cartoesSelecionados = []) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}/api/Cartoes`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) throw new Error("Erro ao buscar cartões");

    const cartoes = await res.json();
    const container = document.getElementById("edit-cartoes-container");

    container.innerHTML = "";

    cartoes.forEach(cartao => {
      const label = document.createElement("label");
      label.className = "checkbox-cartao";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = cartao.id;
      input.name = "edit-cartoes";

      // 🔥 Já marca se estiver vinculado ao cupom
      if (cartoesSelecionados.includes(cartao.id)) {
        input.checked = true;
      }

      const span = document.createElement("span");
      span.textContent = cartao.nome;

      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
    });

  } catch (error) {
    console.error(error);
    alert("Erro ao carregar cartões.");
  }
}
// 🔹 Exibe o estabelecimento vinculado ao cupom
function exibirEstabelecimentoVinculado(estabelecimentoId) {
  const container = document.getElementById("estabelecimento-vinculado");
  
  if (!container) return;

  if (!estabelecimentoId) {
    container.innerHTML = '<p style="color: #999; font-size: 14px;">Nenhum estabelecimento vinculado</p>';
    return;
  }

  const estab = estabelecimentosModalCache.find(e => e.id === estabelecimentoId);

  if (estab) {
    container.innerHTML = `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 3px solid #4B57A3;">
        <strong style="color: #4B57A3;">📍 Estabelecimento Atual:</strong>
        <p style="margin: 4px 0 0 0; font-size: 14px;">${estab.nome}</p>
      </div>
    `;
  } else {
    container.innerHTML = `<p style="color: #999; font-size: 14px;">Estabelecimento ID: ${estabelecimentoId}</p>`;
  }
}

// 🔹 Exibe os cartões vinculados ao cupom
function exibirCartoesVinculados(cartoesIds) {
  const container = document.getElementById("cartoes-vinculados");
  
  
  if (!container) return;

  if (!cartoesIds || cartoesIds.length === 0) {
    container.innerHTML = '<p style="color: #999; font-size: 14px;">Nenhum cartão vinculado</p>';
    return;
  }

  const cartoesVinculados = cartoesModalCache.filter(c => cartoesIds.includes(c.id));

  if (cartoesVinculados.length > 0) {
    const cartoesHTML = cartoesVinculados.map(cartao => `
      <span style="
        display: inline-block;
        padding: 6px 12px;
        background: #e8f5e9;
        color: #2e7d32;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 500;
        margin-right: 8px;
        margin-bottom: 8px;
      ">
        💳 ${cartao.nome}
      </span>
    `).join('');

    container.innerHTML = `
      <div style="padding: 12px; background: #f5f5f5; border-radius: 6px; border-left: 3px solid #4B57A3;">
        <strong style="color: #4B57A3; display: block; margin-bottom: 8px;">💳 Cartões Aceitos Atuais:</strong>
        <div>${cartoesHTML}</div>
      </div>
    `;
  } else {
    container.innerHTML = '<p style="color: #999; font-size: 14px;">Nenhum cartão encontrado</p>';
  }
}

async function salvarEdicaoCupom() {
  const token = localStorage.getItem("token");
  const cupomOriginal = window._cupomEditando;

  if (!cupomOriginal) {
    alert("Erro: dados do cupom não encontrados.");
    return;
  }

  try {
    // Pega os valores editados do formulário
    const id = document.getElementById("edit-id").value;
    const codigo = document.getElementById("edit-codigo").value;
    const titulo = document.getElementById("edit-titulo").value;
    const descricao = document.getElementById("edit-descricao").value;
    const modalTitulo = document.getElementById("edit-modalTitulo").value;
    const modalDescricao = document.getElementById("edit-modalDescricao").value;
    const tipo = document.getElementById("edit-tipo").value;
    const valorDesconto = parseFloat(document.getElementById("edit-desconto").value) || 0;
    const valorMinimoCompra = parseFloat(document.getElementById("edit-minimo").value) || 0;
    const limiteUso = parseInt(document.getElementById("edit-limite").value) || 0;
    const limiteUsoPorUsuario = parseInt(document.getElementById("edit-limiteUsuario").value) || 0;
    const ativo = document.getElementById("edit-ativo").checked;
    const estabelecimentoId = parseInt(document.getElementById("edit-estabelecimento").value);

    // Formata as datas no formato ISO 8601 esperado pela API
    const dataInicio = document.getElementById("edit-inicio").value;
    const dataExpiracao = document.getElementById("edit-expiracao").value;
    const dataInicioISO = dataInicio ? new Date(dataInicio).toISOString() : new Date().toISOString();
    const dataExpiracaoISO = dataExpiracao ? new Date(dataExpiracao).toISOString() : new Date().toISOString();

    const cartoesSelecionados = Array.from(
  document.querySelectorAll('#edit-cartoes-container input[type="checkbox"]:checked')
).map(cb => parseInt(cb.value));


    // Status baseado no checkbox ativo
    const status = ativo ? "Publicado" : "Rascunho";

    // Monta o body EXATAMENTE como o endpoint espera
    const body = {
      "codigo": codigo,
      "titulo": titulo,
      "descricao": descricao,
      "modalTitulo": modalTitulo,
      "modalDescricao": modalDescricao,
      "tipo": tipo,
      "valorDesconto": valorDesconto,
      "valorMinimoCompra": valorMinimoCompra,
      "dataInicio": dataInicioISO,
      "dataExpiracao": dataExpiracaoISO,
      "limiteUso": limiteUso,
      "limiteUsoPorUsuario": limiteUsoPorUsuario,
      "ativo": ativo,
      "estabelecimentoId": estabelecimentoId,
      "cartoesAceitosIds": cartoesSelecionados,
      "status": status
    };

    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const erro = await res.text();
      throw new Error(erro);
    }

    alert("Cupom atualizado com sucesso!");
    
    // Fecha o modal
    document.getElementById("modalEditarCupom").classList.remove("open");
    
    // Recarrega a lista
    carregarCuponsPromocoes({ ignoreCache: true });

  } catch (err) {
    console.error("Erro ao salvar cupom:", err);
    alert("Erro ao salvar cupom: " + err.message);
  }
}

async function excluirCupomPromocao(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este cupom?");
  if (!confirmar) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
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


 function fecharModalEditarCupom() {
    document.getElementById("modalEditarCupom").classList.remove("open");
  }

  // Fechar ao clicar fora do modal
  document.getElementById("modalEditarCupom").addEventListener("click", (e) => {
    if (e.target.id === "modalEditarCupom") {
      fecharModalEditarCupom();
    }
  });


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




// ========== FUNÇÃO PARA POPULAR O SELECT CUPOM ==========


async function renderizarCheckboxesEstabelecimentos() {
  console.log("📋 Renderizando checkboxes de estabelecimentos...");
  
  const container = document.querySelector(".estabelecimentos-checkbox-container");
  if (!container) {
    console.error("❌ Container .estabelecimentos-checkbox-container não encontrado!");
    return;
  }

  // Limpa o container
  container.innerHTML = '<p class="carregando-estabelecimentos">Carregando estabelecimentos...</p>';

  // Verifica se tem estabelecimentos no cache
  if (!window.estabelecimentosCache || estabelecimentosCache.length === 0) {
    console.warn("⚠️ Nenhum estabelecimento no cache, buscando...");
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ Token não encontrado");
      container.innerHTML = '<p class="erro-estabelecimentos">Erro: Token não encontrado</p>';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/Estabelecimentos`, {
        headers: { Authorization: "Bearer " + token }
      });

      if (!res.ok) throw new Error("Erro ao buscar estabelecimentos");
      
      const data = await res.json();
      estabelecimentosCache = data;
      
    } catch (err) {
      console.error("❌ Erro ao buscar estabelecimentos:", err);
      container.innerHTML = `<p class="erro-estabelecimentos">Erro ao carregar estabelecimentos: ${err.message}</p>`;
      return;
    }
  }

  // Limpa o container novamente antes de adicionar os checkboxes
  container.innerHTML = "";

  // Agrupa estabelecimentos por similaridade de nome
  const grupos = agruparEstabelecimentosPorSimilaridade(estabelecimentosCache);

  // Renderiza os grupos
  grupos.forEach(grupo => {
    // Cria um wrapper para cada grupo
    const grupoDiv = document.createElement("div");
    grupoDiv.className = "grupo-estabelecimentos";

    // Se o grupo tem mais de um estabelecimento, adiciona um título
    if (grupo.estabelecimentos.length > 1) {
      const tituloGrupo = document.createElement("h4");
      tituloGrupo.className = "titulo-grupo-estabelecimentos";
      tituloGrupo.textContent = grupo.nomeBase;
      grupoDiv.appendChild(tituloGrupo);
    }

    // Cria os checkboxes para cada estabelecimento do grupo
    grupo.estabelecimentos.forEach(estab => {
      const label = document.createElement("label");
      label.className = "field-checkbox-estabelecimento";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "estabelecimentos[]";
      input.value = estab.id;
      input.id = `estab-${estab.id}`;
      input.dataset.estabelecimentoNome = estab.nome;

      const span = document.createElement("span");
      span.textContent = `${estab.nome}${estab.cidade ? ` - ${estab.cidade}` : ''}`;

      label.appendChild(input);
      label.appendChild(span);

      grupoDiv.appendChild(label);
    });

    container.appendChild(grupoDiv);
  });

  console.log(`✅ ${estabelecimentosCache.length} estabelecimentos renderizados em ${grupos.length} grupos`);
}

// Função auxiliar para agrupar estabelecimentos por similaridade
function agruparEstabelecimentosPorSimilaridade(estabelecimentos) {
  const grupos = [];
  const processados = new Set();

  // Ordena por nome primeiro
  const estabelecimentosOrdenados = [...estabelecimentos].sort((a, b) => 
    a.nome.localeCompare(b.nome)
  );

  estabelecimentosOrdenados.forEach(estab => {
    if (processados.has(estab.id)) return;

    // Extrai o nome base (remove números, "filial", "unidade", etc)
    const nomeBase = extrairNomeBase(estab.nome);

    // Encontra estabelecimentos similares
    const similares = estabelecimentosOrdenados.filter(e => {
      if (processados.has(e.id)) return false;
      const nomeBaseOutro = extrairNomeBase(e.nome);
      return calcularSimilaridade(nomeBase, nomeBaseOutro) > 0.7; // 70% de similaridade
    });

    // Marca todos como processados
    similares.forEach(s => processados.add(s.id));

    grupos.push({
      nomeBase: nomeBase,
      estabelecimentos: similares
    });
  });

  return grupos;
}

// Extrai o nome base removendo números, filiais, etc
function extrairNomeBase(nome) {
  return nome
    .replace(/\s*-\s*(filial|unidade|loja|un\.?)\s*\d+/gi, '')
    .replace(/\s*\d+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calcula similaridade entre dois textos (algoritmo simples)
function calcularSimilaridade(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  // Verifica se um contém o outro
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Calcula palavras em comum
  const palavras1 = s1.split(' ');
  const palavras2 = s2.split(' ');
  const palavrasComuns = palavras1.filter(p => palavras2.includes(p));
  
  const totalPalavras = Math.max(palavras1.length, palavras2.length);
  return palavrasComuns.length / totalPalavras;
}

// Função auxiliar para obter estabelecimentos selecionados
function obterEstabelecimentosSelecionados() {
  const checkboxes = document.querySelectorAll('input[name="estabelecimentos[]"]:checked');
  return Array.from(checkboxes).map(cb => ({
    id: cb.value,
    nome: cb.dataset.estabelecimentoNome
  }));
}

// ========== CHAMAR QUANDO ABRIR O FORMULÁRIO ==========
// Adicione esta linha quando o formulário de cupom for aberto

// Exemplo: Se você tem um botão que abre o formulário
document.querySelector('[data-open-subpage="criar-cupom"]').addEventListener('click', () => {
  // Mostra o formulário
  document.getElementById('formCupom').classList.add('active');
  
  // Popula o select
  renderizarCheckboxesEstabelecimentos()
    carregarCartoesParaCupom()

});

// Ou se abre ao clicar em uma aba/menu:
function abrirPaginaCupons() {
  // Sua lógica de mostrar a página
  mostrarPagina('cupons');
  renderizarCheckboxesEstabelecimentos()
  carregarCartoesParaCupom()
  

}

// Ou se é um modal:
function abrirModalCriarCupom() {
  // Abre o modal
  document.getElementById('modalCupom').style.display = 'block';
  renderizarCheckboxesEstabelecimentos()
    carregarCartoesParaCupom()
  

}

async function carregarCartoesParaCupom() {
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

    console.log("Cartões carregados:", cartoes);
    const container = document.querySelector(".cupom-cards-row");

    if (!container) {
      console.error("Container .cupom-cards-row não encontrado!");
      return;
    }

    container.innerHTML = "";

    cartoes.forEach(cartao => {
      const label = document.createElement("label");
      label.className = "field-checkbox-cartao";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "cartoes-cupom[]";
      input.value = cartao.id;
      input.id = `cartao-cupom-${cartao.id}`;

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

// Função para obter IDs dos cartões selecionados no formulário de cupom
function obterCartoesSelecionadosCupom() {
  return Array.from(
    document.querySelectorAll('#cp-cards-row-preview input[type="checkbox"]:checked')
  ).map(input => parseInt(input.dataset.id));
}


// ========== FUNÇÃO COMPLETA DE CADASTRAR CUPOM (ATUALIZADA) ==========

/* Cadastro antigo 
async function cadastrarCupom() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  // Valida se pelo menos um estabelecimento foi selecionado
  const estabelecimentosSelecionados = obterEstabelecimentosSelecionados();
  if (!estabelecimentosSelecionados || estabelecimentosSelecionados.length === 0) {
    alert("Por favor, selecione pelo menos um estabelecimento!");
    return;
  }

  // Pega os cartões selecionados
  const cartoesSelecionados = obterCartoesSelecionadosCupom();

  function toIso(dt) {
    return dt ? new Date(dt).toISOString() : null;
  }
  
  const ativo = document.getElementById("ativo-cupom").checked;

  // 1) MONTA O OBJETO DO CUPOM
  const data = {
    codigo: document.getElementById("codigo").value,
    titulo: document.getElementById("titulo").value,
    descricao: document.getElementById("descricao").value,
    modalTitulo: document.getElementById("modalTitulo").value,
    modalDescricao: document.getElementById("modalDescricao").value,
    tipo: "Percentual",
    valorDesconto: parseFloat(document.getElementById("valorDesconto").value),
    valorMinimoCompra: parseFloat(document.getElementById("valorMinimoCompra").value) || 0,

    dataInicio: toIso(document.getElementById("dataInicio").value),
    dataExpiracao: toIso(document.getElementById("dataExpiracao").value),

    limiteUso: parseInt(document.getElementById("limiteUso").value) || 0,
    limiteUsoPorUsuario: parseInt(document.getElementById("limiteUsoPorUsuario").value) || 0,

    ativo: ativo,
    estabelecimentoId: parseInt(estabelecimentosSelecionados[0].id), // Usa o primeiro estabelecimento selecionado
    status: ativo ? "Publicado" : "Rascunho",

    cartoesAceitosIds: cartoesSelecionados // ✅ Agora vem dos checkboxes
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
      form.append("tipo", tipo);

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
    carregarCuponsPromocoes();

    // Reset do formulário
    document.getElementById("formCupom").reset();
    
    // Recarrega os checkboxes
    renderizarCheckboxesEstabelecimentos();
    carregarCartoesParaCupom();

  } catch (err) {
    alert("Erro: " + err.message);
    console.error(err);
  }
}

*/

async function cadastrarCupom() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const estabelecimentosSelecionados = obterEstabelecimentosSelecionados();
  if (!estabelecimentosSelecionados || estabelecimentosSelecionados.length === 0) {
    alert("Por favor, selecione pelo menos um estabelecimento!");
    return;
  }

  const cartoesSelecionados = obterCartoesSelecionadosCupom();

  function toIso(dt) {
    return dt ? new Date(dt).toISOString() : null;
  }

  const ativo = document.getElementById("cp-ativo").checked;

  const valorDesconto     = parseFloat(document.getElementById("cp-valorDesconto").value);
  const valorMinimoCompra = parseFloat(document.getElementById("cp-valorMinimoCompra").value) || 0;
  const limiteUso         = parseInt(document.getElementById("cp-limiteUso").value) || 0;
  const limiteUsoPorUsuario = parseInt(document.getElementById("cp-limiteUsoPorUsuario").value) || 0;

  // Validação dos campos obrigatórios
  if (!document.getElementById("cp-codigo").value.trim()) {
    alert("Preencha o código do cupom!"); return;
  }
  if (!document.getElementById("cp-titulo").value.trim()) {
    alert("Preencha o título do cupom!"); return;
  }
  if (isNaN(valorDesconto)) {
    alert("Preencha o valor de desconto!"); return;
  }
  if (!document.getElementById("cp-dataInicio").value) {
    alert("Preencha a data de início!"); return;
  }
  if (!document.getElementById("cp-dataExpiracao").value) {
    alert("Preencha a data de expiração!"); return;
  }


  const data = {
    codigo:               document.getElementById("cp-codigo").value.trim(),
    titulo:               document.getElementById("cp-titulo").value.trim(),
    descricao:            document.getElementById("cp-descricao").value.trim(),
    modalTitulo:          document.getElementById("cp-modalTitulo").value.trim(),
    modalDescricao:       document.getElementById("cp-modalDescricao").value.trim(),
    tipo:                 "Percentual",
    valorDesconto,
    valorMinimoCompra,
    dataInicio:           toIso(document.getElementById("cp-dataInicio").value),
    dataExpiracao:        toIso(document.getElementById("cp-dataExpiracao").value),
    limiteUso,
    limiteUsoPorUsuario,
    ativo: ativo,
    estabelecimentoId:    parseInt(estabelecimentosSelecionados[0].id),
    status:               ativo ? "Publicado" : "Rascunho",
    cartoesAceitosIds:    cartoesSelecionados
  };

  // 👇 LOG para conferir o payload antes de enviar
  console.log("Payload enviado:", JSON.stringify(data, null, 2));

  try {
    const res = await fetch(`${API_BASE}/api/Cupons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    // 👇 Lê o corpo do erro para diagnóstico
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resposta da API (erro):", errBody);
      throw new Error(`Erro ao criar cupom: ${res.status} — ${errBody}`);
    }

    
  const cupomCriado = await res.json();
const cupomId = cupomCriado.id;
console.log("Cupom criado com ID:", cupomId);

// 👇 Força o status correto logo após criar
if (ativo) {
  await atualizarStatusCupomPatch(cupomId, "Publicado");
  console.log("Status forçado para Publicado");
}

    const galeriaFile = document.getElementById("cp-imgGaleria").files[0];
    const modalFile   = document.getElementById("cp-imgModal").files[0];

    async function enviarImagem(tipo, file) {
      const form = new FormData();
      form.append("imagem", file);
      form.append("tipo", tipo);

      const imgRes = await fetch(`${API_BASE}/api/Cupons/${cupomId}/imagens`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token },
        body: form
      });

      if (!imgRes.ok) throw new Error("Erro ao enviar imagem " + tipo);
    }

    if (galeriaFile) { await enviarImagem("Galeria", galeriaFile); console.log("Imagem Galeria enviada!"); }
    if (modalFile)   { await enviarImagem("Modal",   modalFile);   console.log("Imagem Modal enviada!"); }

    alert("Cupom criado com sucesso!");
    carregarCuponsPromocoes();

    // Reset — usa o ID correto do form novo
    document.getElementById("formCupomPreview").reset();
    renderizarCheckboxesEstabelecimentos();
    carregarCartoesParaCupom();

  } catch (err) {
    alert("Erro: " + err.message);
    console.error(err);
  }
}

// URLs temporárias das imagens do cupom
let cpImgGaleriaUrl = null;
let cpImgModalUrl   = null;

// Abrir modal preview cupom
function abrirPreviewCupom() {
  const modal = document.getElementById('modal-preview-cupom');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);

    // ✅ Registra listeners no form (igual ao formCadastro2)
  const form = document.getElementById('formCupomPreview');
  form.addEventListener('input', sincronizarCupomPreview);
  form.addEventListener('change', sincronizarCupomPreview);
  sincronizarCupomPreview();
  // Popula cartões e estabelecimentos se necessário
  cpPopularCartoes();
  cpPopularEstabelecimentos();
}

// Fechar modal preview cupom
function fecharPreviewCupom() {
  const modal = document.getElementById('modal-preview-cupom');
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    document.getElementById('formCupomPreview').reset();
    cpImgGaleriaUrl = null;
    cpImgModalUrl   = null;
    document.getElementById('cp-thumb-galeria').innerHTML = '';
    document.getElementById('cp-thumb-modal').innerHTML   = '';
    fecharModalCupomPreview();
  }, 300);
}

// Abrir/fechar modal dentro do preview
function abrirModalCupomPreview() {
  document.getElementById('cpv-modal-wrap').style.display = 'flex';
}
function fecharModalCupomPreview() {
  document.getElementById('cpv-modal-wrap').style.display = 'none';
}

// Preview de imagem do cupom
function cpPreviewImagem(input, tipo) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target.result;
    if (tipo === 'galeria') {
      cpImgGaleriaUrl = url;
      document.getElementById('cpv-card-img').src = url;
      document.getElementById('cp-thumb-galeria').innerHTML = `<img src="${url}" alt="preview">`;
    } else {
      cpImgModalUrl = url;
      document.getElementById('cpv-modal-img').src = url;
      document.getElementById('cp-thumb-modal').innerHTML = `<img src="${url}" alt="preview">`;
    }
  };
  reader.readAsDataURL(file);
}

// Formatar data para exibição
function cpFormatarData(dtString) {
  if (!dtString) return '--/--/----';
  const d = new Date(dtString);
  if (isNaN(d)) return '--/--/----';
  return d.toLocaleDateString('pt-BR');
}

// Sincronizar campos → preview em tempo real
function sincronizarCupomPreview() {
  const titulo        = document.getElementById('cp-titulo').value.trim()        || 'Título do cupom';
  const descricao     = document.getElementById('cp-descricao').value.trim()     || 'Descrição do cupom aparece aqui';
  const modalTitulo   = document.getElementById('cp-modalTitulo').value.trim()   || 'Título do Modal';
  const modalDescricao= document.getElementById('cp-modalDescricao').value.trim()|| 'Descrição modal aparece aqui';
  const valorDesconto = document.getElementById('cp-valorDesconto').value.trim();
  const dataExpiracao = document.getElementById('cp-dataExpiracao').value;
  const dataFormatada = cpFormatarData(dataExpiracao);

  // Badge do card
  document.getElementById('cpv-badge-titulo').textContent =
    valorDesconto ? `${valorDesconto}% De desconto!` : 'Desconto!';

  // Corpo do card
  document.getElementById('cpv-titulo').textContent    = titulo;
  document.getElementById('cpv-descricao').textContent = descricao;
  document.getElementById('cpv-validade').textContent  = dataFormatada;

  // Modal
  document.getElementById('cpv-modal-titulo').textContent    = modalTitulo;
  document.getElementById('cpv-modal-descricao').textContent = modalDescricao;
  document.getElementById('cpv-modal-chip-validade').innerHTML =
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Válido até ${dataFormatada}`;
  document.getElementById('cpv-modal-validade-texto').textContent = dataFormatada;

  // Pills dos cartões
  cpAtualizarPillsPreview();
}

// Cartões selecionados → pills no card e modal
function cpAtualizarPillsPreview() {
  const cores = {
    'Vegas Alimentação': { bg: '#d4f5d4', color: '#1a7a1a' },
    'Vegas Refeição':    { bg: '#d4e8ff', color: '#1a4fa0' },
    'Vegas Day':         { bg: '#ffe4d4', color: '#a04a1a' },
    'Vegas Farmácia':    { bg: '#f5d4f5', color: '#7a1a7a' },
    'Vegas Plus':        { bg: '#fff3d4', color: '#8a6000' },
    'Vegas Pay':         { bg: '#d4fff5', color: '#007a5a' },
  };

  const checkboxes = document.querySelectorAll('#cp-cards-row-preview input[type="checkbox"]');
  let pillsCard  = '';
  let pillsModal = '';
  let count      = 0;

  checkboxes.forEach(cb => {
    if (cb.checked) {
      const nome = cb.dataset.nome || cb.value || cb.id;
      const cor  = cores[nome] || { bg: '#e8eaf6', color: '#434D9C' };
      if (count < 2) {
        pillsCard += `<span class="pill" style="background:${cor.bg};color:${cor.color};">${nome.replace('Vegas ','')}</span>`;
      }
      pillsModal += `<span class="pill" style="background:${cor.bg};color:${cor.color};padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;">${nome.replace('Vegas ','')}</span>`;
      count++;
    }
  });

  document.getElementById('cpv-meta-pills').innerHTML  = pillsCard || '<span class="pill pill-alt">Cartão</span>';
  document.getElementById('cpv-modal-pills').innerHTML = pillsModal || '<span style="color:#888;font-size:13px;">Nenhum selecionado</span>';
}

// Popular cartões no form do preview (reutiliza os mesmos do form principal)
async function cpPopularCartoes() {
  const container = document.getElementById('cp-cards-row-preview');
  if (!container || container.children.length > 0) return;

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/Cartoes`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) throw new Error("Erro ao buscar cartões");

    const cartoes = await res.json();

    cartoes.forEach(cartao => {
      const label = document.createElement("label");
      label.className = "field-ratio";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = `cp-cartao-${cartao.id}`;
      input.dataset.id = cartao.id;
      input.dataset.nome = cartao.nome;
      input.addEventListener("change", sincronizarCupomPreview);

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

async function cpPopularEstabelecimentos() {
  const container = document.getElementById("cp-estab-container");
  if (!container) return;

  container.innerHTML = '<p class="carregando-estabelecimentos">Carregando estabelecimentos...</p>';

  if (!window.estabelecimentosCache || estabelecimentosCache.length === 0) {
    const token = localStorage.getItem("token");
    if (!token) {
      container.innerHTML = '<p class="erro-estabelecimentos">Token não encontrado</p>';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/Estabelecimentos`, {
        headers: { Authorization: "Bearer " + token }
      });
      if (!res.ok) throw new Error("Erro ao buscar estabelecimentos");
      estabelecimentosCache = await res.json();
    } catch (err) {
      container.innerHTML = `<p class="erro-estabelecimentos">Erro: ${err.message}</p>`;
      return;
    }
  }

  // ✅ PARTE QUE FALTAVA: renderizar os checkboxes
  container.innerHTML = '';
  estabelecimentosCache.forEach(estab => {
    const label = document.createElement('label');
    label.className = 'field-ratio';
    label.innerHTML = `
      <input type="checkbox" name="estabelecimentos[]" value="${estab.id}" data-nome="${estab.nomeFantasia || estab.nome}">
      <span>${estab.nomeFantasia || estab.nome}</span>
    `;
    container.appendChild(label);
  });
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

const map = document.getElementById("mapurl2");
const btnMapa = document.querySelector(".btn-map");

btnMapa.addEventListener("click", () => {
  const url = map.value;
  const coordenadas = extrairLatLngGoogleMaps(url);

  if (!coordenadas) {
    console.log("Coordenadas não encontradas");
    return;
  }
  
  document.querySelector(".latitude2").value = coordenadas.latitude
  document.querySelector(".longitude2").value = coordenadas.latitude

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

async function carregarCidades2(nomeCidadeSelecionada = null) {
  const estadoId2 = document.getElementById("estadoId2-edit").value;
  const token = localStorage.getItem("token");

  if (!estadoId2 || !token) return;

  console.log("carregarCidades() chamado com estadoId =", estadoId2);

  try {
    const res = await fetch(`${API_BASE}/api/Cidades/por-estado/${estadoId2}`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Erro ao buscar cidades.");

    const cidades = await res.json();
    console.log("Cidades carregadas:", cidades);

    const selectCidade = document.getElementById("cidadeId2-edit");
    selectCidade.innerHTML = '<option value="">Selecione uma cidade</option>';

    cidades.forEach(cidade => {
      const option = document.createElement("option");
      option.value = cidade.id;
      option.textContent = cidade.nome;
      selectCidade.appendChild(option);
    });

    // 🔹 Se foi passado o nome da cidade, seleciona ela automaticamente
    if (nomeCidadeSelecionada) {
      const cidadeEncontrada = cidades.find(c => c.nome === nomeCidadeSelecionada);
      
      if (cidadeEncontrada) {
        selectCidade.value = cidadeEncontrada.id;
        console.log(`Cidade "${nomeCidadeSelecionada}" selecionada (ID: ${cidadeEncontrada.id})`);
      } else {
        console.warn(`Cidade "${nomeCidadeSelecionada}" não encontrada na lista.`);
      }
    }

  } catch (err) {
    alert("Erro ao carregar cidades: " + err.message);
    console.error(err);
  }
}




window.onload = async () => {
  carregarCategorias();
  await carregarEstados();
  carregarCartoes();

  

  

  const btnMapa = document.querySelector(".btn-map");
  const map = document.getElementById("mapurl");

  document.querySelector('[data-open-subpage="lista-grupo"]')
  .addEventListener("click", () => {
    carregarGrupos();
    popularEstabelecimentosParaGrupo() 
  });


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



//Estabelecimento Section
async function cadastrarEstabelecimento2() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const categoriaId = parseInt(document.getElementById("categoriaId2").value) || null;
  const ativo = document.getElementById("ativoEstab2").checked;

  const data = {
    "nome": document.getElementById("nomeEstab2").value.trim(),
    "razaoSocial": document.getElementById("razaoSocial2").value.trim(),
    "cnpj": document.getElementById("cnpj2").value.trim(),
    "telefone": document.getElementById("telefone2").value.trim(),
    "emailContato": document.getElementById("emailContato2").value.trim(),
    "ativo": ativo,

    "categoriaId": Number(document.getElementById("categoriaId2").value),
    "cidadeId": Number(document.getElementById("cidadeId2").value),

    "rua": document.getElementById("rua2").value.trim(),
    "numero": document.getElementById("numero2").value.trim(),
    "bairro": document.getElementById("bairro2").value.trim(),
    "complemento": document.getElementById("complemento2").value.trim(),
    "cep": document.getElementById("cep2").value.trim(),

    "latitude": Number(document.getElementById("latitude2").value),
    "longitude": Number(document.getElementById("longitude2").value),

    "grupoId": Number(document.getElementById("grupo2").value) || null,
    "mapaUrl": document.getElementById("mapurl2").value.trim(),
    "sobre": document.getElementById("sobre2").value.trim(),

    // Status
    "statusPublicacao": document.getElementById("statusPublicacao2").value,
    "statusOperacional": document.getElementById("statusOperacional2").value,
    "motivoCancelamento": document.getElementById("statusOperacional2").value === "Cancelado"
      ? document.getElementById("motivoCancelamento2").value.trim()
      : "",

    // Consultor
    "consultorNome": document.getElementById("consultorNome2").value.trim(),
    "consultorEmail": document.getElementById("consultorEmail2").value.trim(),

    // Representante Legal
    "representanteLegalNome": document.getElementById("representanteLegalNome2").value.trim(),
    "cpfRepresentante": document.getElementById("cpfRepresentante2").value.trim(),

    // Segundo Contato
    "segundoContatoNome": document.getElementById("segundoContatoNome2").value.trim(),
    "segundoContatoTelefone": document.getElementById("segundoContatoTelefone2").value.trim(),
    "segundoContatoCargo": document.getElementById("segundoContatoCargo2").value.trim(),
  };

  console.log('rodou antes do try');

  try {
    const res = await fetch(`${API_BASE}/api/Estabelecimentos/Criar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(data),
    });

    console.log(data);
    console.log('depois do try');

    if (!res.ok) {
      const erro = await res.text();
      throw new Error(erro);
    }

    const estab = await res.json();

    // 🔹 VINCULAR CATEGORIA
    if (categoriaId) {
      await vincularCategoria(estab.id, categoriaId);
    }

    // 🔹 VINCULAR GRUPO (se selecionado)
    const grupoId = Number(document.getElementById("grupo2").value);
    if (grupoId) {
      await fetch(
        `${API_BASE}/api/Grupos/${grupoId}/vincular-estabelecimentos/${estab.id}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      ).then(res => {
        if (!res.ok) {
          throw new Error("Erro ao vincular grupo");
        }
      });
    }

    // 🔹 VINCULAR CARTÕES
    const cartoesIds = obterCartoesSelecionados();
    if (cartoesIds.length > 0) {
      await vincularCartoes(estab.id, cartoesIds);
    }

    // 🔹 ENVIO DAS IMAGENS
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


async function salvarEdicaoEstabelecimento(e) {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const id = document.getElementById("editId2").value;

  const ativo = document.getElementById("ativoEstab2-edit").checked;

const data = {
  "nome": document.getElementById("nomeEstab2-edit").value.trim(),
  "razaoSocial": document.getElementById("razaoSocial2-edit").value.trim(),
  "cnpj": document.getElementById("cnpj2-edit").value.trim(),
  "telefone": document.getElementById("telefone2-edit").value.trim(),
  "emailContato": document.getElementById("emailContato2-edit").value.trim(),
  "ativo": ativo,

  "categoriaId": Number(document.getElementById("categoriaId2-edit").value),
  "cidadeId": Number(document.getElementById("cidadeId2-edit").value),

  "rua": document.getElementById("rua2-edit").value.trim(),
  "numero": document.getElementById("numero2-edit").value.trim(),
  "bairro": document.getElementById("bairro2-edit").value.trim(),
  "complemento": document.getElementById("complemento2-edit").value.trim(),
  "cep": document.getElementById("cep2-edit").value.trim(),

  "latitude": Number(document.getElementById("latitude2-edit").value),
  "longitude": Number(document.getElementById("longitude2-edit").value),

  "grupoId": null,
  "mapaUrl": document.getElementById("mapurl2-edit").value.trim(),
  "sobre": document.getElementById("sobre2-edit").value.trim(),
  "status": ativo ? "Publicado" : "Rascunho"
};

  try {
    const res = await fetch(`${API_BASE}/api/Estabelecimentos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Erro ao atualizar estabelecimento");

    alert("Estabelecimento atualizado com sucesso!");
    fecharModalEditarVer();
    buscarEstabelecimentos();

  } catch (err) {
    console.error(err);
    alert("Erro ao salvar alterações");
  }
}



function renderizarImagensEdicao(estab) {
  const container = document.getElementById("imagensEditContainer");
  container.innerHTML = "";

  const imagens = estab.imagens || [];

  const logo = imagens.find(img => img.logo === true);
  const fachada = imagens.find(img => img.fachada === true);

  // 🔹 LOGO
  container.appendChild(
    criarBlocoImagem({
      titulo: "Logo",
      imagem: logo,
      estabId: estab.id,
      isLogo: true,
      isFachada: false
    })
  );

  // 🔹 FACHADA
  container.appendChild(
    criarBlocoImagem({
      titulo: "Fachada",
      imagem: fachada,
      estabId: estab.id,
      isLogo: false,
      isFachada: true
    })
  );
}

function criarBlocoImagem({ titulo, imagem, estabId, isLogo, isFachada }) {
  const div = document.createElement("div");
  div.className = "imagem-edit-item";

  const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';



  const tipoClasse = isLogo ? "upload-logo" : "upload-fachada";
  const srcImagem = imagem?.url || PLACEHOLDER;

  div.innerHTML = `
    <strong>${titulo}</strong>

    <div class="upload-card ${tipoClasse}">
      <img />

      <div class="upload-overlay">
        <label class="upload-action">
          <img src="./imgs/image-up.png" class="icon-edit" />
          <input
            type="file"
            accept="image/*"
            onchange="${
              imagem
                ? `substituirImagem(event, ${estabId}, ${imagem.id}, ${isLogo}, ${isFachada})`
                : `adicionarImagemNova(event, ${estabId}, ${isLogo}, ${isFachada})`
            }"
          />
        </label>

        ${
          imagem
            ? `
              <button
                type="button"
                class="upload-action danger"
                onclick="excluirImagem(${imagem.id}, ${estabId})"
              >
                <img src="./imgs/trash-02.png" class="icon-edit" />
              </button>
            `
            : ""
        }
      </div>
    </div>
  `;

  // 🔥 fallback de imagem
  const img = div.querySelector("img");
  img.src = srcImagem;

  img.onerror = () => {
    img.onerror = null;
    img.src = PLACEHOLDER;
  };

  return div;
}




async function adicionarImagemNova(event, estabId, isLogo, isFachada) {
  const file = event.target.files[0];
  if (!file) return;

  await enviarImagemEstabelecimento(
    estabId,
    file,
    isLogo,
    isFachada
  );

  alert("Imagem adicionada com sucesso");
  recarregarEstabelecimentoEdit();
}





async function excluirImagem(imagemId, estabId) {
  const token = localStorage.getItem("token");

  if (!confirm("Deseja realmente excluir esta imagem?")) return;

  const res = await fetch(
    `${API_BASE}/api/estabelecimentos/${estabId}/imagens/${imagemId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token
      }
    }
  );

  if (!res.ok) {
    alert("Erro ao excluir imagem");
    return;
  }

  alert("Imagem excluída com sucesso");

  // 🔄 Reabrir modal atualizado
  recarregarEstabelecimentoEdit();
}

async function substituirImagem(
  event,
  estabId,
  imagemId,
  isLogo,
  isFachada
) {
  const file = event.target.files[0];
  if (!file) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    // 1️⃣ Tenta excluir a imagem antiga (se existir)
    if (imagemId) {
      const delResp = await fetch(
        `${API_BASE}/api/estabelecimentos/${estabId}/imagens/${imagemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token
          }
        }
      );

      // ✔️ 404 = imagem já não existe → segue o fluxo
      if (!delResp.ok && delResp.status !== 404) {
        throw new Error("Erro ao excluir imagem antiga");
      }
    }

    // 2️⃣ Sempre tenta enviar a nova imagem
    await enviarImagemEstabelecimento(
      estabId,
      file,
      isLogo,
      isFachada
    );

    alert("Imagem atualizada com sucesso");

    // 🔄 Atualiza visual
    recarregarEstabelecimentoEdit();

  } catch (err) {
    console.error(err);
    alert("Erro ao substituir a imagem.");
  } finally {
    // limpa o input para permitir reenviar o mesmo arquivo se necessário
    event.target.value = "";
  }
}

function fecharModalEditar() {
  document.getElementById("estadoId2-edit").value = " "
  document.getElementById("cidadeId2-edit").value = " "
  document.getElementById("modalEditarOverlay2").style.display = "none";
}



async function recarregarEstabelecimentoEdit() {
  const id = document.getElementById("editId2").value;
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${API_BASE}/api/Estabelecimentos/${id}`,
    {
      headers: { Authorization: "Bearer " + token }
    }
  );

  const estabAtualizado = await res.json();
  renderizarImagensEdicao(estabAtualizado);
}


// ============================================================
//  MODAL VER / EDITAR ESTABELECIMENTO — Unificado
//  Substitui: abrirModalEditar() e o antigo #modalEditarOverlay2
// ============================================================

// Guarda o objeto completo do estab aberto atualmente
let _estabAtual = null;

// ── ABRIR ────────────────────────────────────────────────────

/**
 * Chamado ao clicar no card (ícone editar OU no próprio card).
 * Abre o modal em modo VISUALIZAÇÃO com todas as infos preenchidas.
 */
async function abrirModalEditar(estab) {
  _estabAtual = estab;

  // Garante modo visualização ao abrir
  _setModoVisualizacao();

  // Popula os campos
  _popularVerModal(estab);

  // Carrega selects (categorias + estados) em paralelo
  await Promise.all([
    carregarCategoriasVer(estab.categorias?.[0]),
    carregarEstadosVer()
  ]);

  // Depois que o select de estado está populado, carrega as cidades
  if (estab.unidadeFederativaId) {
    document.getElementById("vi-estadoId").value = estab.unidadeFederativaId;
    await carregarCidadesVer(estab.cidade);
  }

  // Exibe modal
  document.getElementById("modal-ver-estab").style.display = "flex";
}

function fecharVerEstab() {
  document.getElementById("modal-ver-estab").style.display = "none";
  _estabAtual = null;
  _setModoVisualizacao(); // reseta para visualização ao fechar
}

// ── MODO VISUALIZAÇÃO / EDIÇÃO ────────────────────────────────

function ativarModoEdicao() {
  if (!_estabAtual) return;

  // Preenche os inputs com os valores atuais
  _preencherInputs(_estabAtual);

  // Troca .ver-value por .ver-input em todos os campos
  document.querySelectorAll("#modal-ver-estab .ver-value").forEach(el => (el.style.display = "none"));
  document.querySelectorAll("#modal-ver-estab .ver-input").forEach(el => (el.style.display = ""));

  // Mostra/esconde botões
  document.getElementById("btn-ativar-edicao").style.display   = "none";
  document.getElementById("btn-salvar-edicao").style.display   = "";
  document.getElementById("btn-cancelar-edicao").style.display = "";

  // Imagens: mostrar overlays de troca
  _toggleImagensEdicao(true);

  // Status Operacional: checar motivo
  toggleMotivoVer();
}

function cancelarModoEdicao() {
  _setModoVisualizacao();
}

function _setModoVisualizacao() {
  document.querySelectorAll("#modal-ver-estab .ver-value").forEach(el => (el.style.display = ""));
  document.querySelectorAll("#modal-ver-estab .ver-input").forEach(el => (el.style.display = "none"));

  document.getElementById("btn-ativar-edicao").style.display   = "";
  document.getElementById("btn-salvar-edicao").style.display   = "none";
  document.getElementById("btn-cancelar-edicao").style.display = "none";

  // Esconde campo motivo cancelamento
  document.getElementById("ver-row-motivo").style.display = "none";

  _toggleImagensEdicao(false);
}

// ── POPULAR MODAL COM DADOS DO ESTAB ─────────────────────────

function _popularVerModal(estab) {
  // ID oculto
  document.getElementById("ver-estab-id").value = estab.id;

  // Título no header
  document.getElementById("ver-form-nome-titulo").textContent = estab.nome || "—";

  // Badges de status
  const badgePub = document.getElementById("ver-badge-pub");
  badgePub.textContent = estab.statusPublicacao || "Rascunho";
  badgePub.className   = "badge-pub " + (estab.statusPublicacao === "Publicado" ? "pub-publicado" : "pub-rascunho");

  const badgeOp = document.getElementById("ver-badge-op");
  badgeOp.textContent = estab.statusOperacional || "Ativo";
  badgeOp.className   = "badge-op status-op-" + (estab.statusOperacional || "Ativo").toLowerCase();

  // Preview do site (lado esquerdo)
  _atualizarPreviewVer(estab);

  // Campos .ver-value
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "—";
  };

  set("vv-nome",         estab.nome);
  set("vv-razaoSocial",  estab.razaoSocial);
  set("vv-cnpj",         estab.cnpj);
  set("vv-telefone",     estab.telefone);
  set("vv-email",        estab.emailContato);
  set("vv-sobre",        estab.sobre);
  set("vv-statusPub",    estab.statusPublicacao);
  set("vv-statusOp",     estab.statusOperacional);
  set("vv-motivo",       estab.motivoCancelamento);
  set("vv-categoria",    estab.categorias?.[0] || "—");
  set("vv-cep",          estab.cep);
  set("vv-estado",       estab.unidadeFederativa || "—");
  set("vv-cidade",       estab.cidade);
  set("vv-rua",          estab.rua);
  set("vv-numero",       estab.numero);
  set("vv-bairro",       estab.bairro);
  set("vv-complemento",  estab.complemento);
  set("vv-mapurl",       estab.mapaUrl);
  set("vv-latitude",     estab.latitude);
  set("vv-longitude",    estab.longitude);
  set("vv-consultorNome",  estab.consultorNome);
  set("vv-consultorEmail", estab.consultorEmail);
  set("vv-repNome",      estab.representanteLegalNome);
  set("vv-repCpf",       estab.cpfRepresentante);
  set("vv-seg2Nome",     estab.segundoContatoNome);
  set("vv-seg2Tel",      estab.segundoContatoTelefone);
  set("vv-seg2Cargo",    estab.segundoContatoCargo);

  // Motivo cancelamento: mostra apenas se cancelado (em modo viz)
  const rowMotivo = document.getElementById("ver-row-motivo");
  if (estab.statusOperacional === "Cancelado") {
    rowMotivo.style.display = "";
  }

  // Cartões
  _renderizarCartoesVer(estab);

  // Imagens
  _renderizarImagensVer(estab);
}

function _preencherInputs(estab) {
  const setInput = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };

  setInput("vi-nomeEstab",     estab.nome);
  setInput("vi-razaoSocial",   estab.razaoSocial);
  setInput("vi-cnpj",          estab.cnpj);
  setInput("vi-telefone",      estab.telefone);
  setInput("vi-email",         estab.emailContato);
  setInput("vi-sobre",         estab.sobre);
  setInput("vi-statusPub",     estab.statusPublicacao);
  setInput("vi-statusOp",      estab.statusOperacional);
  setInput("vi-motivo",        estab.motivoCancelamento);
  setInput("vi-cep",           estab.cep);
  setInput("vi-rua",           estab.rua);
  setInput("vi-numero",        estab.numero);
  setInput("vi-bairro",        estab.bairro);
  setInput("vi-complemento",   estab.complemento);
  setInput("vi-mapurl",        estab.mapaUrl);
  setInput("vi-latitude",      estab.latitude);
  setInput("vi-longitude",     estab.longitude);
  setInput("vi-consultorNome", estab.consultorNome);
  setInput("vi-consultorEmail",estab.consultorEmail);
  setInput("vi-repNome",       estab.representanteLegalNome);
  setInput("vi-repCpf",        estab.cpfRepresentante);
  setInput("vi-seg2Nome",      estab.segundoContatoNome);
  setInput("vi-seg2Tel",       estab.segundoContatoTelefone);
  setInput("vi-seg2Cargo",     estab.segundoContatoCargo);

  // Selects que precisam de valor numérico
  if (estab.unidadeFederativaId) {
    document.getElementById("vi-estadoId").value = estab.unidadeFederativaId;
  }
}

// ── PREVIEW LADO ESQUERDO ────────────────────────────────────

function _atualizarPreviewVer(estab) {
  const PLACEHOLDER = "./imgs/default-image.png";

  const imagens   = estab.imagens || [];
  const logoObj   = imagens.find(i => i.logo);
  const fachadaObj= imagens.find(i => i.fachada);

  const logoSrc    = logoObj?.url    || estab.imagemPrincipal || PLACEHOLDER;
  const fachadaSrc = fachadaObj?.url || estab.imagemPrincipal || PLACEHOLDER;

  // Atualiza todas as imgs do preview
  ["ver-logo-img", "ver-logo-mobile"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.src = logoSrc; el.onerror = () => { el.onerror=null; el.src=PLACEHOLDER; }; }
  });

  ["ver-fachada-img", "ver-fachada-mobile", "ver-fachada-tablet"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.src = fachadaSrc; el.onerror = () => { el.onerror=null; el.src=PLACEHOLDER; }; }
  });

  // Textos do preview
  const textSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "—"; };
  textSet("ver-nome",       estab.nome);
  textSet("ver-nome-mobile",estab.nome);
  textSet("ver-sobre",      estab.sobre);
  textSet("ver-telefone",   estab.telefone);
  textSet("ver-categoria",  estab.categorias?.[0] || "—");

  const partes = [estab.rua, estab.numero, estab.bairro, estab.cidade].filter(Boolean);
  textSet("ver-endereco", partes.join(", ") || "—");
}

// ── IMAGENS NO PAINEL DIREITO ─────────────────────────────────

function _renderizarImagensVer(estab) {
  const container = document.getElementById("ver-imagens-container");
  container.innerHTML = "";

  const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';

  const imagens   = estab.imagens || [];
  const logoObj   = imagens.find(i => i.logo);
  const fachadaObj= imagens.find(i => i.fachada);

  [
    { label: "Logo",    obj: logoObj,    isLogo: true,  isFachada: false },
    { label: "Fachada", obj: fachadaObj, isLogo: false, isFachada: true  }
  ].forEach(({ label, obj, isLogo, isFachada }) => {
    const src = obj?.url || PLACEHOLDER;

    const wrap = document.createElement("div");
    wrap.className = "ver-img-item";
    wrap.dataset.tipo = label.toLowerCase();

    wrap.innerHTML = `
      <span class="ver-img-label">${label}</span>
      <div class="ver-img-wrap">
        <img class="ver-img-thumb" src="${src}" alt="${label}"
             onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
        <!-- Overlay de edição — visível apenas em modo edição -->
        <div class="ver-img-overlay" style="display:none;">
          <label class="ver-img-btn-trocar" title="Trocar imagem">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <input type="file" accept="image/*"
              onchange="${obj
                ? `_verTrocarImagem(event, ${estab.id}, ${obj.id}, ${isLogo}, ${isFachada})`
                : `_verAdicionarImagem(event, ${estab.id}, ${isLogo}, ${isFachada})`}">
          </label>
          ${obj ? `
          <button type="button" class="ver-img-btn-excluir" title="Excluir imagem"
            onclick="_verExcluirImagem(${obj.id}, ${estab.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>` : ""}
        </div>
      </div>
    `;
    container.appendChild(wrap);
  });
}

function _toggleImagensEdicao(ativar) {
  document.querySelectorAll("#ver-imagens-container .ver-img-overlay").forEach(el => {
    el.style.display = ativar ? "flex" : "none";
  });
}

// ── AÇÕES DE IMAGEM ───────────────────────────────────────────

async function _verTrocarImagem(event, estabId, imagemId, isLogo, isFachada) {
  const file = event.target.files[0];
  if (!file) return;
  const token = localStorage.getItem("token");

  try {
    if (imagemId) {
      const del = await fetch(`${API_BASE}/api/estabelecimentos/${estabId}/imagens/${imagemId}`, {
        method: "DELETE", headers: { Authorization: "Bearer " + token }
      });
      if (!del.ok && del.status !== 404) throw new Error("Erro ao excluir imagem antiga");
    }
    await enviarImagemEstabelecimento(estabId, file, isLogo, isFachada);
    alert("Imagem atualizada com sucesso!");
    await _recarregarEstabVer(estabId);
  } catch (err) {
    console.error(err);
    alert("Erro ao trocar imagem: " + err.message);
  } finally {
    event.target.value = "";
  }
}

async function _verAdicionarImagem(event, estabId, isLogo, isFachada) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    await enviarImagemEstabelecimento(estabId, file, isLogo, isFachada);
    alert("Imagem adicionada com sucesso!");
    await _recarregarEstabVer(estabId);
  } catch (err) {
    console.error(err);
    alert("Erro ao adicionar imagem: " + err.message);
  } finally {
    event.target.value = "";
  }
}

async function _verExcluirImagem(imagemId, estabId) {
  if (!confirm("Deseja realmente excluir esta imagem?")) return;
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/estabelecimentos/${estabId}/imagens/${imagemId}`, {
    method: "DELETE", headers: { Authorization: "Bearer " + token }
  });
  if (!res.ok) { alert("Erro ao excluir imagem"); return; }
  alert("Imagem excluída com sucesso!");
  await _recarregarEstabVer(estabId);
}

async function _recarregarEstabVer(estabId) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/api/Estabelecimentos/${estabId}`, {
    headers: { Authorization: "Bearer " + token }
  });
  if (!res.ok) return;
  const estab = await res.json();
  _estabAtual = estab;
  _popularVerModal(estab);
  // Mantém modo edição ativo
  ativarModoEdicao();
}

// ── CARTÕES ───────────────────────────────────────────────────

function _renderizarCartoesVer(estab) {
  const container = document.getElementById("ver-cartoes-container");
  if (!container) return;

  const cartoes = estab.cartoesAceitos || [];
  if (cartoes.length === 0) {
    container.innerHTML = '<span class="ver-sem-cartao">Nenhum cartão vinculado</span>';
    return;
  }
  container.innerHTML = cartoes
    .map(c => `<span class="categoria-badge">${c.nome || c}</span>`)
    .join("");
}

// ── SELECTS DINÂMICOS ─────────────────────────────────────────

async function carregarCategoriasVer(categoriaNomeSelecionada = null) {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/CategoriasEstabelecimentos`, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) return;
    const data = await res.json();
    const select = document.getElementById("vi-categoriaId");
    select.innerHTML = "";
    data.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.nome;
      if (cat.nome === categoriaNomeSelecionada) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) { console.error("Erro ao carregar categorias:", err); }
}

async function carregarEstadosVer() {
  // Reutiliza a mesma função já existente no projeto, apenas popula o select correto
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/UnidadesFederativas`, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) return;
    const data = await res.json();
    const select = document.getElementById("vi-estadoId");
    select.innerHTML = "";
    data.forEach(uf => {
      const opt = document.createElement("option");
      opt.value = uf.id;
      opt.textContent = uf.nome;
      select.appendChild(opt);
    });
  } catch (err) { console.error("Erro ao carregar estados:", err); }
}

async function carregarCidadesVer(cidadeNomeSelecionada = null) {
  const token = localStorage.getItem("token");
  const estadoId = document.getElementById("vi-estadoId").value;
  if (!estadoId || !token) return;
  try {
    const res = await fetch(`${API_BASE}/api/Cidades?unidadeFederativaId=${estadoId}`, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) return;
    const cidades = await res.json();
    const select = document.getElementById("vi-cidadeId");
    select.innerHTML = "";
    cidades.forEach(cidade => {
      const opt = document.createElement("option");
      opt.value = cidade.id;
      opt.textContent = cidade.nome;
      if (cidade.nome === cidadeNomeSelecionada) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) { console.error("Erro ao carregar cidades:", err); }
}

// ── TOGGLE MOTIVO CANCELAMENTO ────────────────────────────────

function toggleMotivoVer() {
  const select    = document.getElementById("vi-statusOp");
  const rowMotivo = document.getElementById("ver-row-motivo");
  if (!select || !rowMotivo) return;

  const isCancelado = select.value === "Cancelado";
  rowMotivo.style.display = isCancelado ? "" : "none";

  // value/display do textarea de motivo
  const vvMotivo = document.getElementById("vv-motivo");
  const viMotivo = document.getElementById("vi-motivo");
  if (isCancelado) {
    // Em modo edição, mostra input; em visualização, mostra .ver-value
    const emEdicao = document.getElementById("vi-nomeEstab").style.display !== "none";
    if (emEdicao) { viMotivo.style.display = ""; vvMotivo.style.display = "none"; }
    else           { vvMotivo.style.display = ""; viMotivo.style.display = "none"; }
  }
}

// ── SALVAR EDIÇÃO ─────────────────────────────────────────────

async function salvarEdicaoUnificada() {
  const token = localStorage.getItem("token");
  const id    = document.getElementById("ver-estab-id").value;
  if (!id) return;

  const statusPub = document.getElementById("vi-statusPub").value;
  const statusOp  = document.getElementById("vi-statusOp").value;

  const data = {
    nome:         document.getElementById("vi-nomeEstab").value.trim(),
    razaoSocial:  document.getElementById("vi-razaoSocial").value.trim(),
    cnpj:         document.getElementById("vi-cnpj").value.trim(),
    telefone:     document.getElementById("vi-telefone").value.trim(),
    emailContato: document.getElementById("vi-email").value.trim(),
    sobre:        document.getElementById("vi-sobre").value.trim(),

    statusPublicacao:  statusPub,
    statusOperacional: statusOp,
    motivoCancelamento: statusOp === "Cancelado"
      ? document.getElementById("vi-motivo").value.trim()
      : "",

    ativo: statusPub === "Publicado",
    status: statusPub,

    categoriaId: Number(document.getElementById("vi-categoriaId").value),
    cidadeId:    Number(document.getElementById("vi-cidadeId").value),

    rua:         document.getElementById("vi-rua").value.trim(),
    numero:      document.getElementById("vi-numero").value.trim(),
    bairro:      document.getElementById("vi-bairro").value.trim(),
    complemento: document.getElementById("vi-complemento").value.trim(),
    cep:         document.getElementById("vi-cep").value.trim(),

    mapaUrl:   document.getElementById("vi-mapurl").value.trim(),
    latitude:  Number(document.getElementById("vi-latitude").value) || null,
    longitude: Number(document.getElementById("vi-longitude").value) || null,

    consultorNome:           document.getElementById("vi-consultorNome").value.trim(),
    consultorEmail:          document.getElementById("vi-consultorEmail").value.trim(),
    representanteLegalNome:  document.getElementById("vi-repNome").value.trim(),
    cpfRepresentante:        document.getElementById("vi-repCpf").value.trim(),
    segundoContatoNome:      document.getElementById("vi-seg2Nome").value.trim(),
    segundoContatoTelefone:  document.getElementById("vi-seg2Tel").value.trim(),
    segundoContatoCargo:     document.getElementById("vi-seg2Cargo").value.trim(),

    grupoId: _estabAtual?.grupoId || null
  };

  try {
    const res = await fetch(`${API_BASE}/api/Estabelecimentos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Erro ao atualizar estabelecimento");

    alert("Estabelecimento atualizado com sucesso!");

    // Atualiza cache global
    const idx = estabelecimentosCache.findIndex(e => e.id === _estabAtual.id);
    if (idx !== -1) {
      estabelecimentosCache[idx] = { ...estabelecimentosCache[idx], ...data };
    }

    // Fecha o modal e recarrega lista
    fecharVerEstab();
    buscarEstabelecimentos();

    if (typeof _atualizarContadores === "function") _atualizarContadores();

  } catch (err) {
    console.error(err);
    alert("Erro ao salvar alterações: " + err.message);
  }
}

// ── VIEWPORT (botões Desktop/Tablet/Mobile) ───────────────────

function mudarViewportVer(tipo) {
  const wrapper = document.getElementById("ver-preview-wrapper");
  wrapper.className = "ver-preview-wrapper";
  if (tipo === "tablet") wrapper.classList.add("viewport-tablet");
  if (tipo === "mobile") wrapper.classList.add("viewport-mobile");

  ["desktop","tablet","mobile"].forEach(t => {
    document.getElementById(`btn-${t}-v`).classList.toggle("active", t === tipo);
  });
}

// ── COMPATIBILIDADE: fecharModalEditar antigo ────────────────
// (mantido para não quebrar chamadas existentes no código)
function fecharModalEditarVer() {
  fecharVerEstab();
}



async function carregarCategoriasModal(categoriaNomeSelecionada = null) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para carregar as categorias.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/CategoriasEstabelecimentos`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Erro ao buscar categorias: " + res.status);

    const data = await res.json();

    const select = document.getElementById("categoriaId2-edit");
    select.innerHTML = `<option value="">Selecione uma categoria</option>`;

    data.forEach(categoria => {
      const option = document.createElement("option");
      option.value = categoria.id;
      option.textContent = categoria.nome;

      // ⭐ AQUI ESTÁ A CHAVE
      if (
        categoriaNomeSelecionada &&
        categoria.nome.toLowerCase() === categoriaNomeSelecionada.toLowerCase()
      ) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (err) {
    alert("Erro ao carregar categorias: " + err.message);
    console.error(err);
  }
}


async function carregarEstadosModal() {
  const estados = [
    { id: 1, nome: "São Paulo" },
    { id: 2, nome: "Rio de Janeiro" },
    { id: 3, nome: "Minas Gerais" }
  ];

  const selectEstado = document.getElementById("estadoId2-edit");
  selectEstado.innerHTML = `<option value="">Selecione um estado</option>`;

  estados.forEach(estado => {
    const option = document.createElement("option");
    option.value = estado.id;
    option.textContent = estado.nome;
    selectEstado.appendChild(option);
  });

  console.log(
    "Estados carregados (modal):",
    Array.from(selectEstado.options).map(o => o.textContent)
  );
}


//Testes com modalEstab

// Variáveis globais para armazenar imagens temporárias
let previewLogoUrl = null;
let previewFachadaUrl = null;

const btnDesktopP = document.getElementById('btn-desktop-p');
const btnTabletP  = document.getElementById('btn-tablet-p');
const btnMobileP  = document.getElementById('btn-mobile-p');
const wrapperPreview = document.getElementById('preview-comercio-wrapper');

const viewportBtns = [btnDesktopP, btnTabletP, btnMobileP];

function setViewport(mode) {
  // Remove todas as classes de viewport
  wrapperPreview.classList.remove('viewport-tablet', 'viewport-mobile');

  // Remove active de todos os botões
  viewportBtns.forEach(b => b.classList.remove('active'));

  if (mode === 'tablet') {
    wrapperPreview.classList.add('viewport-tablet');
    wrapperPreview.style.maxWidth = '768px';
    btnTabletP.classList.add('active');
  } else if (mode === 'mobile') {
    wrapperPreview.classList.add('viewport-mobile');
    wrapperPreview.style.maxWidth = '480px';
    btnMobileP.classList.add('active');
  } else {
    wrapperPreview.style.maxWidth = '100%';
    btnDesktopP.classList.add('active');
  }
}

btnDesktopP.addEventListener('click', () => setViewport('desktop'));
btnTabletP.addEventListener('click',  () => setViewport('tablet'));
btnMobileP.addEventListener('click',  () => setViewport('mobile'));

// Abrir modal de preview
function abrirPreview() {
 
  const modal = document.getElementById('modal-preview');
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('active');
  }, 10);
  
  // Inicializar preview vazio
  atualizarPreview();
}

// Fechar modal de preview
function fecharPreview() {
  const modal = document.getElementById('modal-preview');
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
  
  // Limpar formulário
  document.getElementById('formCadastro2').reset();
  previewLogoUrl = null;
  previewFachadaUrl = null;
}

// Preview de imagens
function previewImagem(input, tipo) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const url = e.target.result;
    
    if (tipo === 'logo') {
      previewLogoUrl = url;
      // Atualizar todas as instâncias do logo no preview
      document.getElementById('prev-logo-img').src = url;
      document.getElementById('prev-logo-mobile').src = url;
      
      const previewContainer = document.getElementById('preview-logo-small');
      previewContainer.innerHTML = `<img src="${url}" alt="Preview Logo">`;
    } else if (tipo === 'fachada') {
      previewFachadaUrl = url;
      // Atualizar todas as instâncias da fachada no preview
      document.getElementById('prev-fachada-img').src = url;
      document.getElementById('prev-fachada-mobile').src = url;
      document.getElementById('prev-fachada-tablet').src = url;
      
      const previewContainer = document.getElementById('preview-fachada-small');
      previewContainer.innerHTML = `<img src="${url}" alt="Preview Fachada">`;
    }
  };
  reader.readAsDataURL(file);
}

// Atualizar preview em tempo real (APENAS CAMPOS VISÍVEIS NO SITE)
function atualizarPreview() {
  // Nome (VISÍVEL)
  const nome = document.getElementById('nomeEstab2').value.trim() || 'Nome do Estabelecimento';
  document.getElementById('prev-nome').textContent = nome;
  document.getElementById('prev-nome-mobile').textContent = nome;
  
  // Telefone (VISÍVEL)
  const telefone = document.getElementById('telefone2').value.trim() || 'Preencha o telefone no formulário';
  document.getElementById('prev-telefone').textContent = telefone;
  
  // Sobre (VISÍVEL)
  const sobre = document.getElementById('sobre2').value.trim() || 'Adicione uma descrição sobre o estabelecimento';
  document.getElementById('prev-sobre').textContent = sobre;
  
  // Endereço completo (VISÍVEL)
  const rua = document.getElementById('rua2').value.trim();
  const numero = document.getElementById('numero2').value.trim();
  const bairro = document.getElementById('bairro2').value.trim();
  const complemento = document.getElementById('complemento2').value.trim();
  const cidadeSelect = document.getElementById('cidadeId2');
  const cidade = cidadeSelect.options[cidadeSelect.selectedIndex]?.text || 'Americana';
  const estado = 'SP';
  
  let endereco = '';
  if (rua) endereco += rua;
  if (numero) endereco += `, ${numero}`;
  if (complemento) endereco += ` - ${complemento}`;
  if (bairro) endereco += ` - ${bairro}`;
  if (endereco) endereco += ` - ${cidade}/${estado}`;
  else endereco = 'Preencha o endereço no formulário';
  
  document.getElementById('prev-endereco').textContent = endereco;
  
  // Categoria (VISÍVEL)
  const categoriaSelect = document.getElementById('categoriaId2');
  const categoriaNome = categoriaSelect.options[categoriaSelect.selectedIndex]?.text || 'Bares e Restaurantes';
  document.getElementById('prev-categoria').textContent = categoriaNome;
}

// Extrair Lat/Long do Google Maps URL
function extrairLatLong() {
  const mapUrl = document.getElementById('mapurl2').value;
  
  if (!mapUrl) {
    alert('Por favor, insira a URL do Google Maps');
    return;
  }
  
  // Regex para extrair coordenadas de diferentes formatos de URL do Google Maps
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = mapUrl.match(regex);
  
  if (match) {
    document.getElementById('latitude2').value = match[1];
    document.getElementById('longitude2').value = match[2];
    alert('✅ Coordenadas extraídas com sucesso!');
  } else {
    alert('❌ Não foi possível extrair as coordenadas. Verifique se a URL está correta.');
  }
}

// Sua função cadastrarEstabelecimento2() original permanece igual
// Apenas certifique-se de que ela usa os IDs corretos (que já estão: nomeEstab2, razaoSocial2, etc.)

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
  const modal = document.getElementById('modal-preview');
  if (e.target === modal) {
    fecharPreview();
  }
});

// Tecla ESC para fechar
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-preview');
    if (modal && modal.classList.contains('active')) {
      fecharPreview();
    }
  }
});

//GRUPO SECTION

let grupoSelecionadoId = null;

let gruposCache = [];

async function deletarGrupo(grupoId) {
  // Confirmação antes de deletar
  if (!confirm("Tem certeza que deseja deletar este grupo?")) {
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/Grupos/${grupoId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) {
      // Se der erro (provavelmente 400 ou 409 - conflito)
      throw new Error("Erro ao deletar grupo");
    }

    alert("Grupo deletado com sucesso!");
    
    // Fecha o modal se estiver aberto
    const modal = document.getElementById("modalVincularEstab");
    if (modal && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
    }

    // Limpa o cache e recarrega os grupos
    gruposCache = []; // Limpa o cache para forçar recarregar
    await carregarGrupos(true); // Força o recarregamento

  } catch (error) {
    console.error("Erro ao deletar grupo:", error);
    alert("Erro ao deletar, o grupo pode ter estabelecimentos vinculados!");
  }
}

// ========== CARREGAR GRUPOS COM CACHE ==========
async function carregarGrupos(forcarRecarregar = false) {
  const token = localStorage.getItem("token");

  // Se já tem cache e não está forçando recarregar, usa o cache
  if (gruposCache.length > 0 && !forcarRecarregar) {
    console.log("Usando grupos do cache");
    renderizarListaGrupos(gruposCache);
    return gruposCache;
  }

  try {
    console.log("Buscando grupos da API...");
    
    const response = await fetch(`${API_BASE}/api/Grupos/grupos-ativos`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na resposta:", response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText || "Erro ao buscar grupos"}`);
    }

    const grupos = await response.json();
    
    // Atualiza o cache
    gruposCache = grupos;
    
    console.log(`${grupos.length} grupos carregados`);
    
    renderizarListaGrupos(grupos);
    
    return grupos;

  } catch (error) {
    console.error("Erro ao carregar grupos:", error);
    
    // Se for erro de CORS ou rede, tenta usar cache antigo se existir
    if (gruposCache.length > 0) {
      console.warn("Usando cache antigo devido ao erro");
      renderizarListaGrupos(gruposCache);
      return gruposCache;
    }
    
    // Se for erro de fetch (CORS/rede), mostra mensagem mais clara
    if (error.message.includes("Failed to fetch")) {
      alert("Erro de conexão com o servidor. Verifique se o backend está rodando e configurado corretamente.");
    } else {
      alert("Não foi possível carregar os grupos: " + error.message);
    }
    
    return [];
  }
}

async function garantirEstabelecimentosNoCache() {
  if (estabelecimentosCache.length > 0) {
    return estabelecimentosCache;
  }

  await buscarEstabelecimentos();
  return estabelecimentosCache;
}

async function abrirModalVincular(grupoId) {
  grupoSelecionadoId = grupoId;

  document.getElementById("modalVincularEstab").classList.remove("hidden");

  const listaVinculados = document.getElementById("listaEstabVinculados");
  const listaDisponiveis = document.getElementById("listaEstabModal");
  const vincHeader = document.querySelector(".modal-gp-header");
  vincHeader.innerHTML = ""

// Cria o botão
const btnDelete = document.createElement("button");
btnDelete.innerHTML = `
  <img src="./imgs/trash-02.png" alt="Deletar">
`;
btnDelete.type = "button";
btnDelete.className = "btn-icon-deletar-grupo";
btnDelete.title = "Deletar grupo";
btnDelete.onclick = () => deletarGrupo(grupoId);

// Adiciona ao header
vincHeader.appendChild(btnDelete);

  listaVinculados.innerHTML = "Carregando...";
  listaDisponiveis.innerHTML = "Carregando...";

  try {
    // garante cache
    const todos = await garantirEstabelecimentosNoCache();

    // busca os já vinculados
    const vinculados = await buscarEstabelecimentosDoGrupo(grupoId);

    const idsVinculados = vinculados.map(e => e.id);



    /* =========================
       LISTA DE JÁ VINCULADOS
    ========================== */

    if (!vinculados || vinculados.length === 0) {
      listaVinculados.innerHTML =
        "<p class='empty-text'>Nenhum estabelecimento cadastrado nesse grupo.</p>";
    } else {
      listaVinculados.innerHTML = "";
      vinculados.forEach(estab => {
        const div = document.createElement("div");
        div.className = "item-checkbox";
        div.innerHTML = `<span>${estab.nome}</span>`;
        listaVinculados.appendChild(div);
      });
    }

    /* =========================
       LISTA DE DISPONÍVEIS
    ========================== */

    const disponiveis = todos.filter(
      e => !idsVinculados.includes(e.id)
    );

    if (disponiveis.length === 0) {
      listaDisponiveis.innerHTML =
        "<p class='empty-text'>Nenhum estabelecimento disponível.</p>";
      return;
    }

    listaDisponiveis.innerHTML = "";
    disponiveis.forEach(estab => {
      const div = document.createElement("div");
      div.className = "item-checkbox";
      div.innerHTML = `
        <label>
          <input type="checkbox" value="${estab.id}">
          ${estab.nome}
        </label>
      `;
      listaDisponiveis.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    listaVinculados.innerHTML = "Erro ao carregar dados.";
    listaDisponiveis.innerHTML = "";
  }
}




function fecharModalVincular() {
  document.getElementById("modalVincularEstab").classList.add("hidden");
  grupoSelecionadoId = null;
}

// ========== VINCULAR ESTABELECIMENTOS (com atualização de cache) ==========
async function confirmarVinculo() {
  if (!grupoSelecionadoId) return;

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const selecionados = [
    ...document.querySelectorAll("#listaEstabModal input[type='checkbox']:checked")
  ].map(cb => cb.value);

  if (selecionados.length === 0) {
    alert("Selecione ao menos um estabelecimento.");
    return;
  }

  try {
    await Promise.all(
      selecionados.map(estabId =>
        fetch(
          `${API_BASE}/api/Grupos/${grupoSelecionadoId}/vincular-estabelecimentos/${estabId}`,
          {
            method: "POST",
            headers: {
              Authorization: "Bearer " + token
            }
          }
        ).then(res => {
          if (!res.ok) {
            throw new Error("Erro ao vincular estabelecimento " + estabId);
          }
        })
      )
    );

    alert("Estabelecimentos vinculados com sucesso!");
    fecharModalVincular();
    
    // 🔹 LIMPA O CACHE E RECARREGA
    limparCacheGrupos();
    await carregarGrupos(true);

  } catch (err) {
    console.error(err);
    alert("Erro ao vincular um ou mais estabelecimentos.");
  }
}

// ========== RENDERIZAR LISTA DE GRUPOS ==========
function renderizarListaGrupos(grupos) {

  popularEstabelecimentosParaGrupo() 
  const container = document.getElementById("listaGrupo");
  if (!container) return;

  container.innerHTML = "";

  if (!grupos || grupos.length === 0) {
    container.innerHTML = "<p>Nenhum grupo encontrado.</p>";
    return;
  }

  container.classList.add("grupo-wrapper");
  const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';



  grupos.forEach(grupo => {
    const logo = grupo.logoCaminho
      ? `${API_BASE}${grupo.logoCaminho}`
      : PLACEHOLDER;

    const card = document.createElement("div");
    card.className = "grupo-card";

    card.innerHTML = `
      <div class="grupo-logo">
        <img src="${logo}" alt="Logo ${grupo.nome}"
             onerror="this.src='${PLACEHOLDER}'">
      </div>

      <div class="grupo-info">
        <h4>${grupo.nome}</h4>

        ${grupo.siteURL
          ? `<a href="${grupo.siteURL}" target="_blank">Site</a>`
          : `<span class="site-placeholder">Sem site</span>`}

        <span class="grupo-count">
          ${grupo.estabelecimentosCount || 0} estabelecimentos
        </span>
      </div>

      <div class="grupo-actions">
        <button onclick="abrirModalVincular(${grupo.id})">
          Ver Mais
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// ========== LIMPAR CACHE DE GRUPOS ==========
function limparCacheGrupos() {
  gruposCache = [];
  console.log("Cache de grupos limpo");
}

// ========== POPULAR SELECT DE GRUPOS (usando cache) ==========
async function popularSelectGrupos(selectId = "grupo2") {
  try {
    // Se não tem cache, carrega
    if (gruposCache.length === 0) {
      await carregarGrupos();
    }

    const select = document.getElementById(selectId);
    if (!select) {
      console.warn(`Select #${selectId} não encontrado`);
      return;
    }

    select.innerHTML = '<option value="">Selecione</option>';

    gruposCache.forEach(grupo => {
      const option = document.createElement("option");
      option.value = grupo.id;
      option.textContent = grupo.nome;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao popular select de grupos:", error);
  }
}

// ========== CADASTRAR GRUPO (com atualização de cache) ==========
async function cadastrarGrupo() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const nome = document.getElementById("nomeGrupo").value.trim();
  if (!nome) {
    alert("O nome do grupo é obrigatório.");
    return;
  }

  const formData = new FormData();
  
  formData.append("Nome", nome);
  formData.append("SiteURL", document.getElementById("siteUrlGrupo").value.trim());
  formData.append("Ativo", document.getElementById("ativoGrupo").checked);

  const logoFile = document.getElementById("logoGrupo").files[0];
  if (logoFile) {
    formData.append("LogoCaminho", logoFile);
  }

  const estabelecimentosIds = obterEstabelecimentosSelecionados();
  estabelecimentosIds.forEach(id => {
    formData.append("EstabelecimentosIds", id);
  });

  try {
    const response = await fetch(`${API_BASE}/api/Grupos/criar`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const erro = await response.text();
      console.error("Erro ao criar grupo:", response.status, erro);
      throw new Error(erro || `Erro ${response.status} ao criar grupo`);
    }

    const grupo = await response.json();
    
    alert("Grupo cadastrado com sucesso!");
    document.getElementById("formCadastroGrupo").reset();
    
    // 🔹 Aguarda um pouco antes de recarregar (dá tempo do backend processar)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 🔹 LIMPA O CACHE E RECARREGA
    limparCacheGrupos();
    await carregarGrupos(true); // força recarregar
    
    // Volta para a lista de grupos usando o gerenciador
    if (gerenciadores.estabelecimentos) {
      gerenciadores.estabelecimentos.voltarPara("lista-grupo");
    }

  } catch (error) {
    console.error("Erro detalhado:", error);
    
    if (error.message.includes("Failed to fetch")) {
      alert("Erro de conexão ao cadastrar grupo. Verifique se o servidor está acessível.");
    } else {
      alert("Erro ao cadastrar grupo: " + error.message);
    }
  }
}

async function buscarEstabelecimentosDoGrupo(grupoId) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(
      `${API_BASE}/api/Grupos/${grupoId}/estabelecimentos-por-grupo`,
      {
        headers: { Authorization: "Bearer " + token }
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erro ao buscar estabelecimentos:", res.status, errorText);
      throw new Error(`Erro ${res.status}: ${errorText || "Erro ao buscar estabelecimentos do grupo"}`);
    }

    return await res.json();
    
  } catch (error) {
    console.error("Erro ao buscar estabelecimentos do grupo:", error);
    throw error;
  }
}

// ========== POPULAR ESTABELECIMENTOS PARA GRUPO ==========
async function popularEstabelecimentosParaGrupo() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("listaEstabelecimentosGrupo");
  
  container.innerHTML = '<p>Carregando...</p>';

  try {
    const response = await fetch(`${API_BASE}/api/Estabelecimentos`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar estabelecimentos");
    }

    const estabelecimentos = await response.json();
    container.innerHTML = "";

    if (!estabelecimentos || estabelecimentos.length === 0) {
      container.innerHTML = "<p>Nenhum estabelecimento disponível.</p>";
      return;
    }

    estabelecimentos.forEach(estab => {
      const checkboxWrapper = document.createElement("div");
      checkboxWrapper.className = "checkbox-item";
      
      checkboxWrapper.innerHTML = `
        <label>
          <input type="checkbox" value="${estab.id}" class="estab-checkbox">
          ${estab.nome}
        </label>
      `;
      
      container.appendChild(checkboxWrapper);
    });

  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Erro ao carregar estabelecimentos.</p>";
  }
}




//GRAFICO

// ==========================================
// DASHBOARD - GRÁFICOS E ESTATÍSTICAS
// ==========================================


let graficoPizzaEstab = null;

// Processar dados dos estabelecimentos por tipo
function processarDadosGrafico(tipo) {
  // Verificar se o cache existe
  if (!estabelecimentosCache || estabelecimentosCache.length === 0) {
    console.warn('❌ estabelecimentosCache vazio ou não existe');
    return {};
  }

  const dados = {};

  estabelecimentosCache.forEach(estab => {
    let chave;

    switch(tipo) {
      case 'cidade':
        chave = estab.cidade || 'Sem Cidade';
        break;
        
      case 'categoria':
        // Categorias vem como array: ['Farmácia']
        if (estab.categorias && estab.categorias.length > 0) {
          // Para cada categoria do estabelecimento
          estab.categorias.forEach(cat => {
            const categoria = cat || 'Sem Categoria';
            dados[categoria] = (dados[categoria] || 0) + 1;
          });
          return; // Pula o incremento padrão no final
        } else {
          chave = 'Sem Categoria';
        }
        break;
        
      case 'cupons':
        // Verificar se cupons existe (pode não existir no objeto)
        const qtdCupons = estab.cupons?.filter(c => c.ativo).length || 0;
        if (qtdCupons === 0) chave = 'Sem cupons';
        else if (qtdCupons <= 5) chave = '1-5 cupons';
        else if (qtdCupons <= 10) chave = '6-10 cupons';
        else if (qtdCupons <= 20) chave = '11-20 cupons';
        else chave = '20+ cupons';
        break;
        
      case 'bairro':
        chave = estab.bairro || 'Sem Bairro';
        break;
        
      case 'status':
        chave = estab.status || 'Sem Status';
        break;
    }

    dados[chave] = (dados[chave] || 0) + 1;
  });

  return dados;
}

// Gerar paleta de cores para o gráfico
function gerarPaletaCores(quantidade) {
  const cores = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12',
    '#9B59B6', '#1ABC9C', '#E67E22', '#34495E', '#16A085'
  ];
  
  // Se precisar de mais cores, gerar aleatórias
  while (cores.length < quantidade) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    cores.push(`rgb(${r}, ${g}, ${b})`);
  }
  
  return cores.slice(0, quantidade);
}

// Renderizar gráfico de pizza
function renderizarGraficoPizza() {
  // Verificar se elementos existem
  const ctx = document.getElementById('graficoEstabelecimentos');
  if (!ctx) {
    console.error('Canvas do gráfico não encontrado');
    return;
  }

  if (!estabelecimentosCache || estabelecimentosCache.length === 0) {
    ctx.parentElement.innerHTML = '<div class="no-data">Nenhum estabelecimento encontrado</div>';
    return;
  }

  const tipo = document.getElementById('filtroTipo')?.value || 'cidade';
  const ordem = document.getElementById('filtroOrdem')?.value || 'desc';
  const limite = parseInt(document.getElementById('filtroLimite')?.value || '0');

  const dadosProcessados = processarDadosGrafico(tipo);
  
  // Verificar se há dados
  if (Object.keys(dadosProcessados).length === 0) {
    ctx.parentElement.innerHTML = '<div class="no-data">Nenhum dado disponível para este filtro</div>';
    return;
  }

  // Converter para array e ordenar
  let dadosArray = Object.entries(dadosProcessados).map(([label, value]) => ({
    label,
    value
  }));

  // Aplicar ordenação
  dadosArray.sort((a, b) => {
    return ordem === 'desc' ? b.value - a.value : a.value - b.value;
  });

  // Aplicar limite e agrupar "Outros"
  if (limite > 0 && dadosArray.length > limite) {
    const outros = dadosArray.slice(limite);
    const somaOutros = outros.reduce((sum, item) => sum + item.value, 0);
    dadosArray = dadosArray.slice(0, limite);
    if (somaOutros > 0) {
      dadosArray.push({ label: 'Outros', value: somaOutros });
    }
  }

  const labels = dadosArray.map(d => d.label);
  const valores = dadosArray.map(d => d.value);
  const cores = gerarPaletaCores(labels.length);

  // Destruir gráfico anterior se existir
  if (graficoPizzaEstab) {
    graficoPizzaEstab.destroy();
  }

  // Criar novo gráfico
  graficoPizzaEstab = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: cores,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 15,
            font: {
              size: 13
            },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    }
  });
}

// Atualizar cards de estatísticas gerais
function renderizarCardsEstatisticas() {
  const statsContainer = document.getElementById('statsGrid');
  if (!statsContainer) {
    console.error('Container de estatísticas não encontrado');
    return;
  }

  if (!estabelecimentosCache || estabelecimentosCache.length === 0) {
    statsContainer.innerHTML = '<div class="no-data">Nenhum dado disponível</div>';
    return;
  }

  const totalEstab = estabelecimentosCache.length;
  
  // Cupons podem não existir em todos os estabelecimentos
  const totalCupons = estabelecimentosCache.reduce((sum, e) => 
    sum + (e.cupons?.filter(c => c.ativo).length || 0), 0);
  
  // Cidades únicas
  const totalCidades = new Set(
    estabelecimentosCache
      .map(e => e.cidade)
      .filter(Boolean)
  ).size;
  
  // Categorias únicas (flat das arrays de categorias)
  const todasCategorias = estabelecimentosCache
    .flatMap(e => e.categorias || [])
    .filter(Boolean);
  const totalCategorias = new Set(todasCategorias).size;

  const statsHTML = `
    <div class="stat-card">
      <h3>Total de Estabelecimentos</h3>
      <div class="value">${totalEstab}</div>
    </div>
    <div class="stat-card">
      <h3>Cupons Ativos</h3>
      <div class="value">${totalCupons}</div>
    </div>
    <div class="stat-card">
      <h3>Cidades</h3>
      <div class="value">${totalCidades}</div>
    </div>
    <div class="stat-card">
      <h3>Categorias</h3>
      <div class="value">${totalCategorias}</div>
    </div>
  `;

  statsContainer.innerHTML = statsHTML;
}

// Configurar eventos dos filtros do dashboard
function inicializarFiltrosGrafico() {
  const filtroTipo = document.getElementById('filtroTipo');
  const filtroOrdem = document.getElementById('filtroOrdem');
  const filtroLimite = document.getElementById('filtroLimite');

  if (filtroTipo) {
    filtroTipo.addEventListener('change', renderizarGraficoPizza);
  }

  if (filtroOrdem) {
    filtroOrdem.addEventListener('change', renderizarGraficoPizza);
  }

  if (filtroLimite) {
    filtroLimite.addEventListener('change', renderizarGraficoPizza);
  }
}

// Inicializar todo o dashboard de gráficos
function inicializarDashboardGraficos() {
  console.log('📊 Inicializando dashboard...', {
    totalEstabelecimentos: estabelecimentosCache?.length || 0
  });

  if (!estabelecimentosCache || estabelecimentosCache.length === 0) {
    const chartWrapper = document.querySelector('.chart-wrapper');
    if (chartWrapper) {
      chartWrapper.innerHTML = '<div class="no-data">Nenhum estabelecimento encontrado</div>';
    }
    
    const statsContainer = document.getElementById('statsGrid');
    if (statsContainer) {
      statsContainer.innerHTML = '<div class="no-data">Nenhum dado disponível</div>';
    }
    return;
  }

  renderizarCardsEstatisticas();
  inicializarFiltrosGrafico();
  renderizarGraficoPizza();
}

// Atualizar dashboard completo (chamado após mudanças nos dados)
function atualizarDashboardCompleto() {
  if (!estabelecimentosCache || estabelecimentosCache.length === 0) {
    console.warn('⚠️ Tentando atualizar dashboard sem dados');
    return;
  }
  
  renderizarCardsEstatisticas();
  renderizarGraficoPizza();
}











buscarEstabelecimentos();
carregarCuponsPromocoes();
window.cadastrarCupom = cadastrarCupom;
window.cadastrarEstabelecimento2 = cadastrarEstabelecimento2;
window.salvarEdicaoEstabelecimento = salvarEdicaoEstabelecimento;
window.fecharModalEditar = fecharModalEditar;
window.carregarCidades2 = carregarCidades2;
window.carregarCategoriasModal = carregarCategoriasModal();
window.substituirImagem = substituirImagem;
window.excluirImagem = excluirImagem;
window.adicionarImagemNova = adicionarImagemNova;
window.confirmarVinculo = confirmarVinculo;
window.abrirModalVincular = abrirModalVincular;
window.fecharModalVincular = fecharModalVincular;
window.salvarEdicaoCupom = salvarEdicaoCupom;
window.fecharModalEditarCupom = fecharModalEditarCupom;
window.cadastrarGrupo = cadastrarGrupo;
window.limparFiltros = limparFiltros;
window.estabelecimentosCache = estabelecimentosCache;
window.limparFiltrosCupons = limparFiltrosCupons;
window.voltarEstabelecimentos = voltarEstabelecimentos;
window.renderizarCheckboxesEstabelecimentos = renderizarCheckboxesEstabelecimentos;
window.deletarGrupo = deletarGrupo;
window.substituirImagemCupom = substituirImagemCupom;
window.adicionarImagemNovaCupom = adicionarImagemNovaCupom;

window.excluirImagemCupom = excluirImagemCupom;
window.popularEstabelecimentosParaGrupo = popularEstabelecimentosParaGrupo
window.abrirPreview = abrirPreview;
window.fecharPreview = fecharPreview;
window.previewImagem = previewImagem;
window.abrirPreviewCupom = abrirPreviewCupom;
window.fecharPreviewCupom = fecharPreviewCupom;
window.abrirModalCupomPreview = abrirModalCupomPreview
window.cpPreviewImagem = cpPreviewImagem;
// ── EXPOR GLOBALMENTE ─────────────────────────────────────────
window.abrirModalEditar        = abrirModalEditar;
window.fecharVerEstab          = fecharVerEstab;
window.ativarModoEdicao        = ativarModoEdicao;
window.cancelarModoEdicao      = cancelarModoEdicao;
window.salvarEdicaoUnificada   = salvarEdicaoUnificada;
window.mudarViewportVer        = mudarViewportVer;
window.carregarCidadesVer      = carregarCidadesVer;
window.toggleMotivoVer         = toggleMotivoVer;
window._verTrocarImagem        = _verTrocarImagem;
window._verAdicionarImagem     = _verAdicionarImagem;
window._verExcluirImagem       = _verExcluirImagem;
window.fecharModalEditarVer       = fecharModalEditarVer; // retrocompat


