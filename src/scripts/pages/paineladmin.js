import { getClientToken, loginToken, API_BASE, CLIENT_ID, CLIENT_SECRET } from '../auth.js';
import {buscarEstabelecimentos } from './paineladmin/estabelecimentos.js'



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


//-------------------------CUPOM----------------------------------------
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
  } finally {
  
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

    const imagem = (c.imagens && c.imagens.length)
  ? (c.imagens.find(img => img.imagemTipoId === 1)?.url || PLACEHOLDER)
  : PLACEHOLDER;

    // Badges de cartões (máximo 2 + contador)
    const cartoesVisiveis = c.cartoesAceitos ? c.cartoesAceitos.slice(0, 2) : [];
    const cartoesExtras   = c.cartoesAceitos ? c.cartoesAceitos.length - 2 : 0;
    const cartoesHTML = cartoesVisiveis.length > 0
      ? cartoesVisiveis.map(cartao => `<span class="badge-cartao">${cartao.nome}</span>`).join('')
        + (cartoesExtras > 0 ? `<span class="badge-cartao badge-cartao-extra">+${cartoesExtras}</span>` : '')
      : '';

    const isPublicado = c.status === "Publicado";

    container.insertAdjacentHTML("beforeend", `
      <article class="cupom-card-admin" style="cursor:pointer;" title="Clique para ver detalhes">
        <div class="cupom-media-admin">
          <img src="${imagem}" alt="Imagem do cupom" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
        </div>

        <div class="cartoes-cp">
          ${cartoesHTML}
        </div>

        <div class="header-cp-admin">
          <h2 class="cupom-title-admin">${c.titulo}</h2>
          <label class="switch-cupom-admin">
            <input type="checkbox" ${isPublicado ? "checked" : ""} data-cupom-id="${c.id}">
            <span class="slider-cupom-admin"></span>
          </label>
        </div>

        <div class="cupom-content-admin">
          <h3 class="nome-estab">${c.nomeEstabelecimento}</h3>
          <p class="expira-admin">
            <strong>Validade:</strong> ${new Date(c.dataExpiracao).toLocaleDateString()}
          </p>
          <div class="cupom-actions-admin">
            <button class="btn-action-admin btn-editar-cupom-admin" data-id="${c.id}" title="Editar">
              <img src="./imgs/icons/edit-e.svg" alt="Editar">
            </button>
            <button class="btn-action-admin btn-excluir-cupom-admin" data-id="${c.id}" title="Excluir">
              <img src="./imgs/icons/trash-02.svg" alt="Excluir">
            </button>
          </div>
        </div>
      </article>
    `);

    const article = container.lastElementChild;

    // ── Clique no card (fora de botões e toggle) → abre modal unificado ──
    article.addEventListener("click", (e) => {
      if (
        e.target.closest(".btn-action-admin") ||
        e.target.closest(".switch-cupom-admin")
      ) return;
      const cupom = cuponsCacheMap.get(c.id.toString());
      if (cupom) abrirModalEditarCupom(cupom.id, cupom.nomeEstabelecimento, cupom.estabelecimentoId);
    });

    // ── Botão editar ──────────────────────────────────────────────────
    article.querySelector(".btn-editar-cupom-admin").addEventListener("click", (e) => {
      e.stopPropagation();
      const cupom = cuponsCacheMap.get(c.id.toString());
      if (cupom) abrirModalEditarCupom(cupom.id, cupom.nomeEstabelecimento, cupom.estabelecimentoId);
    });

    // ── Botão excluir ─────────────────────────────────────────────────
    article.querySelector(".btn-excluir-cupom-admin").addEventListener("click", (e) => {
      e.stopPropagation();
      excluirCupomPromocao(c.id);
    });

    // ── Toggle publicação ─────────────────────────────────────────────
   // ── Toggle publicação ─────────────────────────────────────────────
article.querySelector(".switch-cupom-admin input").addEventListener("change", async (e) => {
  e.stopPropagation();
  const cupomId    = e.target.dataset.cupomId;
  const isChecked  = e.target.checked;
  const novoStatus = isChecked ? "Publicado" : "Rascunho";

  try {
    await atualizarStatusCupomPatch(cupomId, novoStatus);

    // ✅ Atualiza cache local do card
    const cupom = cuponsCacheMap.get(cupomId);
    if (cupom) {
      cupom.status = novoStatus;
      cupom.ativo  = isChecked; // 🔧 FIX 1: sincroniza o campo ativo
    }

    // ✅ Atualiza cache global _cuponsPromocoes
    if (window._cuponsPromocoes) {
      const index = window._cuponsPromocoes.findIndex(cp => cp.id.toString() === cupomId);
      if (index !== -1) {
        window._cuponsPromocoes[index].status = novoStatus;
        window._cuponsPromocoes[index].ativo  = isChecked; // 🔧 FIX 1
      }
    }

    // 🔧 FIX 3: Atualiza também _cuponsPromocoesAtual (quando há filtro de estabelecimento)
    if (window._cuponsPromocoesAtual) {
      const index = window._cuponsPromocoesAtual.findIndex(cp => cp.id.toString() === cupomId);
      if (index !== -1) {
        window._cuponsPromocoesAtual[index].status = novoStatus;
        window._cuponsPromocoesAtual[index].ativo  = isChecked;
      }
    }

    // 🔧 FIX 2: Re-aplica os filtros ativos para atualizar lista + contadores
    if (typeof aplicarFiltrosCuponsAtual === "function") {
      aplicarFiltrosCuponsAtual();
    }

    console.log(`✅ Status do cupom ${cupomId} → ${novoStatus}`);

  } catch (err) {
    console.error("❌ Erro ao atualizar status:", err);
    alert("Erro ao atualizar status do cupom.");
    e.target.checked = !isChecked;
  } finally {
    ocultarLoader(); 
  }
});
  });

  cupons.forEach(c => {
    console.log(`Cupom: ${c.titulo} | status: "${c.status}" | ativo: ${c.ativo} (${typeof c.ativo})`);
  });

  // 🔹 SALVAR O CACHE GLOBALMENTE
  window._cuponsCacheMap = cuponsCacheMap;
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
  if (!container) return;
  container.innerHTML = "";

  const imagens = cupom.imagens || [];
  const imagemGaleria = imagens.find(img => img.imagemTipoId === 1) || null;
  const imagemModal   = imagens.find(img => img.imagemTipoId === 2) || null;

  container.appendChild(
    criarBlocoImagemCupom({
      titulo: "Imagem Cupom (Card)",
      imagem: imagemGaleria,
      cupomId: cupom.id,
      imagemTipoId: 1
    })
  );

  container.appendChild(
    criarBlocoImagemCupom({
      titulo: "Imagem Modal",
      imagem: imagemModal,
      cupomId: cupom.id,
      imagemTipoId: 2
    })
  );
}
// ========================================
// 🔹 CRIAR BLOCO DE IMAGEM (UI)
// ========================================
function criarBlocoImagemCupom({ titulo, imagem, cupomId, imagemTipoId }) {
  const div = document.createElement("div");
  div.className = "imagem-edit-item";

  const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';

  const imagemId  = imagem?.id  || null;
  const srcImagem = imagem?.url || PLACEHOLDER;

  div.innerHTML = `
    <strong>${titulo}</strong>
    <div class="upload-card upload-cupom">
      <img />
      <div class="upload-overlay">
        <label class="upload-action">
          <img src="./imgs/image-up.png" class="icon-edit" />
          <input
            type="file"
            accept="image/*"
            onchange="${
              imagemId
                ? `substituirImagemCupom(event, ${cupomId}, ${imagemId})`
                : `adicionarImagemNovaCupom(event, ${cupomId}, ${imagemTipoId})`
            }"
          />
        </label>
        ${
          imagemId
            ? `<button type="button" class="upload-action danger"
                onclick="excluirImagemCupom(${cupomId}, ${imagemId})">
                <img src="./imgs/trash-02.png" class="icon-edit" />
               </button>`
            : ""
        }
      </div>
    </div>
  `;

  const img = div.querySelector("img");
  img.src = srcImagem;
  img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER; };

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
  await recarregarCupomEdit();
}

async function enviarImagemCupom(cupomId, file, isPrincipal = true, imagemTipoId = 1) {
  const token = localStorage.getItem("token");
  if (!token) { alert("Token não encontrado"); return; }

  const formData = new FormData();
  formData.append("imagem", file);

  try {
    const res = await fetch(`${API_BASE}/api/cupons/${cupomId}/imagens?imagemTipoId=${imagemTipoId}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData
    });

    if (!res.ok) {
      const erroTexto = await res.text();
      console.error("❌ Resposta da API:", res.status, erroTexto);
      throw new Error("Erro ao enviar imagem");
    }

    return await res.json();

  } catch (err) {
    console.error("Erro ao enviar imagem:", err);
    throw err;
  }
}

async function excluirImagemCupom(cupomId, imagemId) {
  const token = localStorage.getItem("token");
  if (!confirm("Deseja realmente excluir esta imagem?")) return;

  if (!imagemId) {
    alert("Nenhuma imagem encontrada para excluir.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/cupons/${cupomId}/imagens/${imagemId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) throw new Error("Erro ao excluir imagem");

    await recarregarCupomEdit();

  } catch (err) {
    console.error(err);
    alert("Erro ao excluir imagem: " + err.message);
  }
}

async function substituirImagemCupom(event, cupomId, imagemId) {
  const file = event.target.files[0];
  if (!file) return;
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    // Busca o tipo da imagem atual no _cupomAtual
    const imagens = _cupomAtual?.imagens || [];
    const imagemAtual = imagens.find(img => img.id === imagemId);
    const imagemTipoId = imagemAtual?.imagemTipoId || 1;

    if (imagemId) {
      const delResp = await fetch(`${API_BASE}/api/cupons/${cupomId}/imagens/${imagemId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });
      if (!delResp.ok && delResp.status !== 404) {
        throw new Error("Erro ao excluir imagem antiga");
      }
    }

    await enviarImagemCupom(cupomId, file, true, imagemTipoId);
    await recarregarCupomEdit();

  } catch (err) {
    console.error(err);
    alert("Erro ao substituir a imagem: " + err.message);
  } finally {
    event.target.value = "";
  }
}
// ========================================
// 🔹 RECARREGAR CUPOM NO MODAL
// ========================================
async function recarregarCupomEdit() {
  if (!_cupomAtual?.id) return;
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}/api/Cupons/${_cupomAtual.id}`, {
      headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) return;

    const cupomAtualizado = await res.json();
    cupomAtualizado.nomeEstabelecimento = _cupomAtual.nomeEstabelecimento;
    _cupomAtual = cupomAtualizado;
    window._cupomEditando = cupomAtualizado;

    // imagens são objetos com .url e .id
    const imagens = cupomAtualizado.imagens || [];
    const imagemGaleria = imagens.find(img => img.imagemTipoId === 1);
    const imgUrl = imagemGaleria?.url || (imagens.length > 0 ? imagens[imagens.length - 1]?.url : null);

    if (imgUrl) {
      document.getElementById("cpv-card-img").src  = imgUrl;
      document.getElementById("cpv-modal-img").src = imgUrl;
      document.getElementById("cp-thumb-galeria").innerHTML = `<img src="${imgUrl}" alt="preview">`;
    }

    // Re-renderiza o bloco de imagem com o id correto
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



async function excluirCupomPromocao(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este cupom?");
  if (!confirmar) return;

  const token = localStorage.getItem("token");
  mostrarLoader("Excluindo Cupom...", "Acessando o Banco");
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

    console.log("Cupom Excluido com sucesso")

    // 🔄 Força recarregar ignorando cache
    carregarCuponsPromocoes({ ignoreCache: true });

  } catch (err) {
    console.error("Erro ao excluir cupom:", err);
    alert("Erro ao excluir cupom.");
  } finally {
        
  }
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


async function cadastrarCupom() {
  
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  if (getBotaoCupom()?.disabled) return;

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
    cartoesAceitosIds:    cartoesSelecionados,
    tag: document.getElementById("cp-tagCupom").value.trim()
  };

  // 👇 LOG para conferir o payload antes de enviar
  console.log("Payload enviado:", JSON.stringify(data, null, 2));
  mostrarLoader("Cadastrando cupom...", "Salvando dados e enviando imagens...");
  travarBotaoCupom();
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

    // imagemTipoId: 1 = Galeria, 2 = Modal (conforme a entidade que você mostrou)
if (galeriaFile) { await enviarImagemCupom(cupomId, galeriaFile, true, 1); console.log("Imagem Galeria enviada!"); }
if (modalFile)   { await enviarImagemCupom(cupomId, modalFile,   true, 2); console.log("Imagem Modal enviada!"); }

    alert("Cupom criado com sucesso!");
     carregarCuponsPromocoes({ ignoreCache: true });

    // Reset — usa o ID correto do form novo
    document.getElementById("formCupomPreview").reset();
    renderizarCheckboxesEstabelecimentos();
    carregarCartoesParaCupom();

  } catch (err) {
    alert("Erro: " + err.message);
    console.error(err);
  } finally {
    ocultarLoader(); 
     destravarBotaoCupom();
  }
}

function getBotaoCupom() {
  return document.querySelector(".btn-salvar-preview");
}

function travarBotaoCupom() {
  const btn = getBotaoCupom();
  if (!btn) return;

  btn.disabled = true;
  btn.dataset.originalText = btn.innerHTML;
  btn.innerHTML = "⏳ Cadastrando...";
}

function destravarBotaoCupom() {
  const btn = getBotaoCupom();
  if (!btn) return;

  btn.disabled = false;
  btn.innerHTML = btn.dataset.originalText || "💾 Cadastrar Cupom";
}


// ============================================================
//  MODAL CUPOM UNIFICADO — Criar + Ver + Editar
//  Substitui todo o bloco anterior do cupom-modal-unificado.js
// ============================================================

let _cupomAtual      = null;   // null = criação | objeto = edição
let _modoEdicaoCupom = false;  // false = visualização | true = editando
let cpImgGaleriaUrl  = null;
let cpImgModalUrl    = null;

// ============================================================
//  MODOS — visualização / edição / criação
// ============================================================

function _setCupomModoVisualizacao() {
  // Esconde inputs, mostra ver-values
  document.querySelectorAll("#formCupomPreview .ver-input").forEach(el => el.style.display = "none");
  document.querySelectorAll("#formCupomPreview .ver-value").forEach(el => el.style.display = "");

  // Botões
  document.getElementById("cp-actions-visualizacao").style.display = "";
  document.getElementById("cp-actions-edicao").style.display       = "none";
  document.getElementById("cp-actions-rodape-criar").style.display = "none";

  // Badges de status visíveis
  document.getElementById("cp-status-badges").style.display = "";

  _modoEdicaoCupom = false;
}

function _setCupomModoCriacao() {
  // Mostra inputs, esconde ver-values
  document.querySelectorAll("#formCupomPreview .ver-input").forEach(el => el.style.display = "");
  document.querySelectorAll("#formCupomPreview .ver-value").forEach(el => el.style.display = "none");

  // Botões
  document.getElementById("cp-actions-visualizacao").style.display = "none";
  document.getElementById("cp-actions-edicao").style.display       = "none";
  document.getElementById("cp-actions-rodape-criar").style.display = "";

  // Badges de status ocultos na criação
  document.getElementById("cp-status-badges").style.display = "none";

  document.getElementById("cp-form-titulo").textContent = "Cadastrar Cupom";
  _modoEdicaoCupom = false;
}

function ativarModoEdicaoCupom() {
  if (!_cupomAtual) return;

  document.querySelectorAll("#formCupomPreview .ver-input").forEach(el => el.style.display = "");
  document.querySelectorAll("#formCupomPreview .ver-value").forEach(el => el.style.display = "none");

  document.getElementById("cp-actions-visualizacao").style.display = "none";
  document.getElementById("cp-actions-edicao").style.display       = "";
  document.getElementById("cp-actions-rodape-criar").style.display = "none";
  document.getElementById("cp-status-badges").style.display        = "";

  document.getElementById("cp-form-titulo").textContent = "Editar Cupom";
  _modoEdicaoCupom = true;

  // Liga preview reativo ao ativar edição
  _ligarPreviewReativoCupom();
}

function cancelarModoEdicaoCupom() {
  if (!_cupomAtual) return;
  // Repopula os ver-values com os dados originais e volta ao modo visualização
  _popularVerValuesCupom(_cupomAtual);
  _setCupomModoVisualizacao();
  sincronizarCupomPreview();
}

// ============================================================
//  ABRIR MODAL — Criação
// ============================================================
function abrirPreviewCupom() {
  _cupomAtual      = null;
  _modoEdicaoCupom = false;

  _resetarFormCupom();
  _setCupomModoCriacao();

  const modal = document.getElementById("modal-preview-cupom");
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("active"), 10);

  cpPopularCartoes();
  cpPopularEstabelecimentos();

  _ligarPreviewReativoCupom();
  sincronizarCupomPreview();
}

// ============================================================
//  ABRIR MODAL — Edição (abre em modo VISUALIZAÇÃO)
// ============================================================
async function abrirModalEditarCupom(id, nomeEstab, estabelecimentoId) {
  const token = localStorage.getItem("token");

  mostrarLoader("Carregando cupom...", "Buscando informações do cupom");

  try {
    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) {
      ocultarLoader();
      alert("Erro ao carregar dados do cupom.");
      return;
    }

    const cupom   = await res.json();
    _cupomAtual   = cupom;
    window._cupomEditando = cupom;

    mostrarLoader("Carregando cupom...", "Carregando cartões e estabelecimentos...");

    await Promise.all([
      cpPopularCartoes(),
      cpPopularEstabelecimentos()
    ]);

    _marcarCartoesDoCupom(cupom);

    _popularVerValuesCupom(cupom);
    _preencherInputsCupom(cupom, nomeEstab);

    // Separa imagens por tipo
    cpImgGaleriaUrl = null;
    cpImgModalUrl   = null;
    const imagens = cupom.imagens || [];

    const imgGaleria = imagens.find(img => img.imagemTipoId === 1);
    const imgModal = imagens.find(img => img.imagemTipoId === 2 || img.imagemTipoId === 3);

    // Imagem galeria (card)
    if (imgGaleria?.url) {
      cpImgGaleriaUrl = imgGaleria.url;
      document.getElementById("cpv-card-img").src = imgGaleria.url;
      document.getElementById("cp-thumb-galeria").innerHTML =
        `<img src="${imgGaleria.url}" alt="preview">`;
    }

    // Imagem modal
    if (imgModal?.url) {
      cpImgModalUrl = imgModal.url;
      document.getElementById("cpv-modal-img").src = imgModal.url;
      document.getElementById("cp-thumb-modal").innerHTML =
        `<img src="${imgModal.url}" alt="preview">`;
    }

    document.getElementById("cp-form-titulo").textContent = cupom.titulo || "Ver Cupom";
    _setCupomModoVisualizacao();

    ocultarLoader();

    const modal = document.getElementById("modal-preview-cupom");
    modal.style.display = "flex";
    setTimeout(() => {
      modal.classList.add("active");
      sincronizarCupomPreview();
    }, 10);

  } catch (err) {
    console.error("Erro ao carregar cupom:", err);
    ocultarLoader();
    alert("Erro ao carregar dados do cupom.");
  }
}

// ============================================================
//  FECHAR MODAL
// ============================================================
function fecharPreviewCupom() {
  const modal = document.getElementById("modal-preview-cupom");
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
    _resetarFormCupom();
    _cupomAtual      = null;
    _modoEdicaoCupom = false;
    fecharModalCupomPreview();
    document.querySelector('[data-open-subpage="lista-cupom"]').classList.add("active")
    document.querySelector('[data-subpage="lista-cupom"]').classList.add("active")
    document.querySelector('[data-open-subpage="criar-cupom"]').classList.remove("active")


  }, 300);


}

function fecharModalEditarCupom() { fecharPreviewCupom(); }

// ============================================================
//  POPULAR VER-VALUES (modo visualização)
// ============================================================
function _popularVerValuesCupom(cupom) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (val !== null && val !== undefined && val !== "") ? val : "—";
  };

  set("vv-cp-codigo",             cupom.codigo);
  set("vv-cp-titulo",             cupom.titulo);
  set("vv-cp-modalTitulo",        cupom.modalTitulo);
  set("vv-cp-descricao",          cupom.descricao);
  set("vv-cp-modalDescricao",     cupom.modalDescricao);
  set("vv-cp-valorDesconto",      cupom.valorDesconto != null ? `${cupom.valorDesconto}%` : "—");
  set("vv-cp-valorMinimoCompra",  cupom.valorMinimoCompra != null ? `R$ ${parseFloat(cupom.valorMinimoCompra).toFixed(2)}` : "—");
  set("vv-cp-limiteUso",          cupom.limiteUso);
  set("vv-cp-limiteUsoPorUsuario",cupom.limiteUsoPorUsuario);
  set("vv-cp-ativo",              cupom.ativo ? "✅ Sim" : "❌ Não");

  // Datas formatadas
  set("vv-cp-dataInicio",    cupom.dataInicio    ? new Date(cupom.dataInicio).toLocaleString("pt-BR")    : "—");
  set("vv-cp-dataExpiracao", cupom.dataExpiracao ? new Date(cupom.dataExpiracao).toLocaleString("pt-BR") : "—");

  // Estabelecimento
  set("vv-cp-estab", cupom.nomeEstabelecimento || cupom.estabelecimento?.nome || "—");

  // Badges de status
  const badgeStatus = document.getElementById("cp-badge-status");
  badgeStatus.textContent = cupom.status || "Rascunho";
  badgeStatus.className   = "badge-pub " + (cupom.status === "Publicado" ? "pub-publicado" : "pub-rascunho");

  const badgeAtivo = document.getElementById("cp-badge-ativo");
  badgeAtivo.textContent = cupom.ativo ? "Ativo" : "Inativo";
  badgeAtivo.className   = "badge-op " + (cupom.ativo ? "status-op-ativo" : "status-op-pausado");

  // Cartões — badges no ver-value
  const vvCartoes = document.getElementById("vv-cp-cartoes");
  const cartoes   = cupom.cartoesAceitos || [];
  vvCartoes.innerHTML = cartoes.length > 0
    ? cartoes.map(c => `<span class="categoria-badge">${c.nome || c}</span>`).join("")
    : '<span style="color:#999;">Nenhum</span>';
}

// ============================================================
//  PREENCHER INPUTS (preparar para modo edição)
// ============================================================
function _preencherInputsCupom(cupom, nomeEstab) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
  };

  set("cp-codigo",            cupom.codigo);
  set("cp-titulo",            cupom.titulo);
  set("cp-modalTitulo",       cupom.modalTitulo);
  set("cp-descricao",         cupom.descricao);
  set("cp-modalDescricao",    cupom.modalDescricao);
  set("cp-valorDesconto",     cupom.valorDesconto);
  set("cp-valorMinimoCompra", cupom.valorMinimoCompra);
  set("cp-limiteUso",         cupom.limiteUso);
  set("cp-limiteUsoPorUsuario", cupom.limiteUsoPorUsuario);

  // Datas
  if (cupom.dataInicio)    document.getElementById("cp-dataInicio").value    = _toDatetimeLocal(new Date(cupom.dataInicio));
  if (cupom.dataExpiracao) document.getElementById("cp-dataExpiracao").value = _toDatetimeLocal(new Date(cupom.dataExpiracao));

  // Checkbox ativo
  const elAtivo = document.getElementById("cp-ativo");
  if (elAtivo) elAtivo.checked = cupom.ativo ?? true;

  // Estabelecimento — marca o checkbox após render
  setTimeout(() => {
    document.querySelectorAll("#cp-estab-container input[type='checkbox']").forEach(cb => {
      const estabId = parseInt(cb.value);
      const deveMarcar = cupom.estabelecimentoIds
        ? cupom.estabelecimentoIds.includes(estabId)
        : (cupom.estabelecimentoId && estabId === parseInt(cupom.estabelecimentoId));
      cb.checked = deveMarcar;

      // Fallback pelo nome
      if (!cb.checked && nomeEstab) {
        const nomeCb = cb.dataset.nome || "";
        if (nomeCb === nomeEstab) cb.checked = true;
      }
    });
  }, 100);

  // Cartões — marca checkboxes
  setTimeout(() => {
    const idsCartoes = (cupom.cartoesAceitos || []).map(c => c.id);
    document.querySelectorAll("#cp-cards-row-preview input[type='checkbox']").forEach(cb => {
      cb.checked = idsCartoes.includes(parseInt(cb.dataset.id));
    });
    sincronizarCupomPreview();
  }, 150);
}

function _toDatetimeLocal(date) {
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ============================================================
//  RESETAR FORMULÁRIO
// ============================================================
function _resetarFormCupom() {
  const form = document.getElementById("formCupomPreview");
  if (form) form.reset();

  cpImgGaleriaUrl = null;
  cpImgModalUrl   = null;

  const thumbG = document.getElementById("cp-thumb-galeria");
  const thumbM = document.getElementById("cp-thumb-modal");
  if (thumbG) thumbG.innerHTML = "";
  if (thumbM) thumbM.innerHTML = "";

  document.getElementById("cpv-card-img").src  = "./imgs/default-image.png";
  document.getElementById("cpv-modal-img").src = "./imgs/default-image.png";

  document.querySelectorAll("#cp-cards-row-preview input[type='checkbox']").forEach(cb => cb.checked = false);
  document.querySelectorAll("#cp-estab-container input[type='checkbox']").forEach(cb => cb.checked = false);

  // Limpa ver-values
  document.querySelectorAll("#formCupomPreview .ver-value").forEach(el => el.textContent = "—");
  document.getElementById("vv-cp-cartoes").innerHTML = '<span style="color:#999;">Nenhum</span>';

  sincronizarCupomPreview();
}

// ============================================================
//  SALVAR EDIÇÃO
// ============================================================
async function salvarEdicaoCupom() {
  const token = localStorage.getItem("token");
  if (!_cupomAtual) { alert("Erro: cupom não encontrado."); return; }

  try {
    const id                  = _cupomAtual.id;
    const codigo              = document.getElementById("cp-codigo").value;
    const titulo              = document.getElementById("cp-titulo").value;
    const descricao           = document.getElementById("cp-descricao").value;
    const tag                 = document.getElementById("cp-tagCupom").value;
    const modalTitulo         = document.getElementById("cp-modalTitulo").value;
    const modalDescricao      = document.getElementById("cp-modalDescricao").value;
    const valorDesconto       = parseFloat(document.getElementById("cp-valorDesconto").value)       || 0;
    const valorMinimoCompra   = parseFloat(document.getElementById("cp-valorMinimoCompra").value)   || 0;
    const limiteUso           = parseInt(document.getElementById("cp-limiteUso").value)             || 0;
    const limiteUsoPorUsuario = parseInt(document.getElementById("cp-limiteUsoPorUsuario").value)   || 0;
    const ativo               = document.getElementById("cp-ativo").checked;

    const dataInicio       = document.getElementById("cp-dataInicio").value;
    const dataExpiracao    = document.getElementById("cp-dataExpiracao").value;
    const dataInicioISO    = dataInicio    ? new Date(dataInicio).toISOString()    : new Date().toISOString();
    const dataExpiracaoISO = dataExpiracao ? new Date(dataExpiracao).toISOString() : new Date().toISOString();

    const estabChecked = document.querySelector("#cp-estab-container input[type='checkbox']:checked");
    const estabelecimentoId = estabChecked
      ? parseInt(estabChecked.value)
      : parseInt(_cupomAtual.estabelecimentoId);

    const cartoesSelecionados = Array.from(
      document.querySelectorAll("#cp-cards-row-preview input[type='checkbox']:checked")
    ).map(cb => parseInt(cb.dataset.id));

    const body = {
      codigo, titulo, descricao, tag, modalTitulo, modalDescricao,
      tipo: _cupomAtual.tipo || "",
      valorDesconto, valorMinimoCompra,
      dataInicio: dataInicioISO,
      dataExpiracao: dataExpiracaoISO,
      limiteUso, limiteUsoPorUsuario, ativo,
      estabelecimentoId,
      cartoesAceitosIds: cartoesSelecionados,
      status: ativo ? "Publicado" : "Rascunho"
    };

    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await res.text());

    alert("Cupom atualizado com sucesso!");

    const modal = document.getElementById("modal-preview-cupom");
    modal.classList.remove("active");
    modal.style.display = "none";
    _cupomAtual      = null;
    _modoEdicaoCupom = false;
    fecharModalCupomPreview();

    window._cuponsPromocoes = null;
    window._cuponsCacheMap  = null;
    localStorage.removeItem("cache_cupons_promocoes");

    await carregarCuponsPromocoes();

  } catch (err) {
    console.error("Erro ao salvar cupom:", err);
    alert("Erro ao salvar cupom: " + err.message);
  }
}

function _ligarPreviewReativoCupom() {
  const ids = [
    "cp-titulo", "cp-descricao", "cp-modalTitulo", "cp-modalDescricao",
    "cp-valorDesconto", "cp-dataExpiracao", "cp-ativo", "cp-tagCupom"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.removeEventListener("input",  sincronizarCupomPreview);
    el.removeEventListener("change", sincronizarCupomPreview);
    el.addEventListener("input",  sincronizarCupomPreview);
    el.addEventListener("change", sincronizarCupomPreview);
  });
}

function _marcarCartoesDoCupom(cupom) {
  const cartoesCupom = cupom.cartoesAceitos || [];

  const idsSelecionados = cartoesCupom.map(c => c.id);

  const inputs = document.querySelectorAll('#cp-cards-row-preview input[type="checkbox"]');

  inputs.forEach(input => {
    const id = Number(input.dataset.id);
    input.checked = idsSelecionados.includes(id);
  });

  sincronizarCupomPreview();
}

function sincronizarCupomPreview() {
  const emEdicao = _modoEdicaoCupom || _cupomAtual === null;

  const titulo         = emEdicao
    ? (document.getElementById("cp-titulo")?.value.trim()         || "Título do cupom")
    : (document.getElementById("vv-cp-titulo")?.textContent       || "Título do cupom");

  const descricao      = emEdicao
    ? (document.getElementById("cp-descricao")?.value.trim()      || "Descrição do cupom aparece aqui")
    : (document.getElementById("vv-cp-descricao")?.textContent    || "Descrição do cupom aparece aqui");

  const modalTitulo    = emEdicao
    ? (document.getElementById("cp-modalTitulo")?.value.trim()    || "Título do Modal")
    : (document.getElementById("vv-cp-modalTitulo")?.textContent  || "Título do Modal");

  const modalDescricao = emEdicao
    ? (document.getElementById("cp-modalDescricao")?.value.trim() || "Descrição modal aparece aqui")
    : (document.getElementById("vv-cp-modalDescricao")?.textContent || "Descrição modal aparece aqui");

  const valorDesconto  = emEdicao
    ? document.getElementById("cp-valorDesconto")?.value.trim()
    : (_cupomAtual?.valorDesconto ?? "");

  const dataExpiracao  = emEdicao
    ? document.getElementById("cp-dataExpiracao")?.value
    : (_cupomAtual?.dataExpiracao ?? "");

  const tag = emEdicao
    ? (document.getElementById("cp-tagCupom")?.value.trim() || "Tag de Desconto")
    : (_cupomAtual?.tag ?? "Tag de Desconto");

  const dataFormatada = cpFormatarData(dataExpiracao);

  // Atualiza card
  document.getElementById("cpv-badge-titulo").textContent =
    tag;
  document.getElementById("cpv-titulo").textContent    = titulo;
  document.getElementById("cpv-descricao").textContent = descricao;
  document.getElementById("cpv-validade").textContent  = dataFormatada;

  // Atualiza tag no preview (se existir o elemento)
  const cpvMetaCat = document.getElementById("cpv-meta-cat");
  if (cpvMetaCat) cpvMetaCat.textContent = "Categoria";

  // Atualiza modal
  document.getElementById("cpv-modal-titulo").textContent    = modalTitulo;
  document.getElementById("cpv-modal-descricao").textContent = modalDescricao;
  document.getElementById("cpv-modal-chip-validade").innerHTML =
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg> Válido até ${dataFormatada}`;
  document.getElementById("cpv-modal-validade-texto").textContent = dataFormatada;

  cpAtualizarPillsPreview();
}

// ============================================================
//  POPULAR CARTÕES
// ============================================================
async function cpPopularCartoes() {
  const container = document.getElementById("cp-cards-row-preview");
  if (!container) return;

  container.innerHTML = ""; // 🔥 limpa antes

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/Cartoes`, {
      headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) throw new Error();
    const cartoes = await res.json();

    cartoes.forEach(cartao => {
      const label = document.createElement("label");
      label.className = "field-ratio";

      const input = document.createElement("input");
      input.type         = "checkbox";
      input.id           = `cp-cartao-${cartao.id}`;
      input.dataset.id   = cartao.id;
      input.dataset.nome = cartao.nome;
      input.addEventListener("change", sincronizarCupomPreview);

      const span = document.createElement("span");
      span.textContent = cartao.nome;

      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
    });
  } catch (err) {
    console.error("Erro ao carregar cartões:", err);
  }
}

// ============================================================
//  POPULAR ESTABELECIMENTOS
// ============================================================
async function cpPopularEstabelecimentos() {
  const container = document.getElementById("cp-estab-container");
  if (!container) return;
  if (container.children.length > 0 &&
      !container.querySelector(".carregando-estabelecimentos")) return;

  container.innerHTML = '<p class="carregando-estabelecimentos">Carregando...</p>';

  if (!window.estabelecimentosCache || estabelecimentosCache.length === 0) {
    const token = localStorage.getItem("token");
    if (!token) { container.innerHTML = ""; return; }
    try {
      const res = await fetch(`${API_BASE}/api/Estabelecimentos`, {
        headers: { Authorization: "Bearer " + token }
      });
      if (!res.ok) throw new Error();
      estabelecimentosCache = await res.json();
    } catch {
      container.innerHTML = "";
      return;
    }
  }

  container.innerHTML = "";
  estabelecimentosCache.forEach(estab => {
    const label = document.createElement("label");
    label.className = "field-ratio";
    label.innerHTML = `
      <input type="checkbox" name="estabelecimentos[]"
             value="${estab.id}"
             data-nome="${estab.nomeFantasia || estab.nome}">
      <span>${estab.nomeFantasia || estab.nome}</span>
    `;
    container.appendChild(label);
  });
}

// ============================================================
//  UTILITÁRIOS
// ============================================================

function cpFormatarData(dtString) {
  if (!dtString) return "--/--/----";
  const d = new Date(dtString);
  if (isNaN(d)) return "--/--/----";
  return d.toLocaleDateString("pt-BR");
}

async function cpPreviewImagem(input, tipo) {
  const file = input.files[0];
  if (!file) return;

  // imagemTipoId: 1 = Galeria (card), 2 = Modal
  const imagemTipoId = tipo === "galeria" ? 1 : 2;

  // Atualiza preview local imediatamente
  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target.result;
    if (tipo === "galeria") {
      cpImgGaleriaUrl = url;
      document.getElementById("cpv-card-img").src = url;
      document.getElementById("cp-thumb-galeria").innerHTML = `<img src="${url}" alt="preview">`;
    } else {
      cpImgModalUrl = url;
      document.getElementById("cpv-modal-img").src = url;
      document.getElementById("cp-thumb-modal").innerHTML = `<img src="${url}" alt="preview">`;
    }
  };
  reader.readAsDataURL(file);

  // Se está editando um cupom existente, envia para a API
  if (_cupomAtual?.id) {
    try {
      const imagens = _cupomAtual?.imagens || [];
      const imagemExistente = imagens.find(img => img.imagemTipoId === imagemTipoId);
      const imagemId = imagemExistente?.id || null;

      if (imagemId) {
        // Substitui a imagem existente do mesmo tipo
        await substituirImagemCupom(
          { target: { files: [file], value: "" } },
          _cupomAtual.id,
          imagemId
        );
      } else {
        // Adiciona nova imagem com o tipo correto
        await adicionarImagemNovaCupom(
          { target: { files: [file], value: "" } },
          _cupomAtual.id,
          imagemTipoId
        );
      }
    } catch (err) {
      console.error("Erro ao enviar imagem:", err);
    } finally {
      input.value = "";
    }
  }
}

function cpAtualizarPillsPreview() {
  const cores = {
    "Vegas Alimentação": { bg: "#d4f5d4", color: "#1a7a1a" },
    "Vegas Refeição":    { bg: "#d4e8ff", color: "#1a4fa0" },
    "Vegas Day":         { bg: "#ffe4d4", color: "#a04a1a" },
    "Vegas Farmácia":    { bg: "#f5d4f5", color: "#7a1a7a" },
    "Vegas Plus":        { bg: "#fff3d4", color: "#8a6000" },
    "Vegas Pay":         { bg: "#d4fff5", color: "#007a5a" },
  };

  const checkboxes = document.querySelectorAll("#cp-cards-row-preview input[type='checkbox']");
  let pillsCard = "", pillsModal = "", count = 0;

  checkboxes.forEach(cb => {
    if (cb.checked) {
      const nome = cb.dataset.nome || cb.value;
      const cor  = cores[nome] || { bg: "#e8eaf6", color: "#434D9C" };
      if (count < 2) {
        pillsCard += `<span class="pill" style="background:${cor.bg};color:${cor.color};">${nome.replace("Vegas ", "")}</span>`;
      }
      pillsModal += `<span class="pill" style="background:${cor.bg};color:${cor.color};padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;">${nome.replace("Vegas ", "")}</span>`;
      count++;
    }
  });

  // Em modo visualização sem edição, usa os cartões do objeto
  if (!_modoEdicaoCupom && _cupomAtual && count === 0) {
    (_cupomAtual.cartoesAceitos || []).forEach((c, i) => {
      const nome = c.nome || c;
      const cor  = cores[nome] || { bg: "#e8eaf6", color: "#434D9C" };
      if (i < 2) pillsCard  += `<span class="pill" style="background:${cor.bg};color:${cor.color};">${nome.replace("Vegas ", "")}</span>`;
      pillsModal += `<span class="pill" style="background:${cor.bg};color:${cor.color};padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;">${nome.replace("Vegas ", "")}</span>`;
    });
  }

  document.getElementById("cpv-meta-pills").innerHTML  = pillsCard  || '<span class="pill pill-alt">Cartão</span>';
  document.getElementById("cpv-modal-pills").innerHTML = pillsModal || '<span style="color:#888;font-size:13px;">Nenhum selecionado</span>';
}

function abrirModalCupomPreview()  { 

  document.getElementById("cpv-modal-wrap").style.display = "flex"; 
}
function fecharModalCupomPreview() { document.getElementById("cpv-modal-wrap").style.display = "none"; }



// ============================================================
//  HEADER DINÂMICO — muda título e botão de salvar
// ============================================================
function _atualizarHeaderCupom() {
  const titulo = document.querySelector("#formCupomPreview .mpc-form-title, #modal-preview-cupom .mpc-form-title");
  const btnSalvar = document.querySelector("#modal-preview-cupom .btn-salvar-preview");

  if (_modoEdicaoCupom) {
    if (titulo)    titulo.textContent        = "Editar Cupom";
    if (btnSalvar) btnSalvar.textContent     = "💾 Salvar Alterações";
    if (btnSalvar) btnSalvar.onclick         = salvarEdicaoCupom;
  } else {
    if (titulo)    titulo.textContent        = "Cadastrar Cupom";
    if (btnSalvar) btnSalvar.textContent     = "💾 Cadastrar Cupom";
    if (btnSalvar) btnSalvar.onclick         = cadastrarCupom;
  }
}


// ============================================================
//  SALVAR — redireciona para criar ou editar
// ============================================================
async function salvarCupomUnificado() {
  if (_modoEdicaoCupom) {
    await salvarEdicaoCupom();
  } else {
    await cadastrarCupom();
  }
}

//-------------------- ^ CUPOM ACIMA ----------------------//



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





//------------ ESTAB --------------------



window.onload = async () => {
  
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


//---------------- ^ ESTAB ACIMA ------------------------------------


//------------------------ GRUPO -----------------------------------

let grupoSelecionadoId = null;

export let gruposCache = [];

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


// Atualizar dashboard completo (chamado após mudanças nos dados)
function atualizarDashboardCompleto() {
  if (!estabelecimentosCache || estabelecimentosCache.length === 0) {
    console.warn('⚠️ Tentando atualizar dashboard sem dados');
    return;
  }
  
  renderizarCardsEstatisticas();
  renderizarGraficoPizza();
}


carregarCuponsPromocoes();

// ===================== CUPOM =====================
window.cadastrarCupom = cadastrarCupom;
window.ativarModoEdicaoCupom = ativarModoEdicaoCupom;
window.salvarEdicaoCupom = salvarEdicaoCupom;
window.fecharModalEditarCupom = fecharModalEditarCupom;
window.abrirModalCupomPreview = abrirModalCupomPreview;
window.cpPreviewImagem = cpPreviewImagem;
window.substituirImagemCupom = substituirImagemCupom;
window.adicionarImagemNovaCupom = adicionarImagemNovaCupom;
window.excluirImagemCupom = excluirImagemCupom;
window.abrirPreviewCupom = abrirPreviewCupom;
window.fecharPreviewCupom = fecharPreviewCupom;
window.limparFiltrosCupons = limparFiltrosCupons;
window.renderizarCheckboxesEstabelecimentos = renderizarCheckboxesEstabelecimentos;


// ===================== GRUPO =====================
window.cadastrarGrupo = cadastrarGrupo;
window.deletarGrupo = deletarGrupo;
window.popularEstabelecimentosParaGrupo = popularEstabelecimentosParaGrupo;
window.confirmarVinculo = confirmarVinculo;
window.abrirModalVincular = abrirModalVincular;
window.fecharModalVincular = fecharModalVincular;

window.renderizarListaGrupos  = renderizarListaGrupos;
window.gruposCache = gruposCache;
window.carregarGrupos = carregarGrupos;
