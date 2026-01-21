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

      


      // Dashboard
      atualizarDashboard();
      

      // Página de gerenciamento
      renderizarLista(estabelecimentosCache, "listaCards");
      inicializarFiltroDashboard()
      atualizarContadoresTabs();

    } catch (err) {
      console.error(err);
      alert("Erro ao carregar estabelecimentos");
    }

    
  }

function contarEstabelecimentosPorStatus() {
  const publicados = estabelecimentosCache.filter(
    e => e.status === "Publicado"
  ).length;

  const rascunhos = estabelecimentosCache.filter(
    e => e.status === "Rascunho"
  ).length;

  return { publicados, rascunhos };
}

function atualizarContadoresTabs() {
  const { publicados, rascunhos } = contarEstabelecimentosPorStatus();

  document
    .querySelector('.tab[data-status="publicados"]')
    .textContent = `Publicados (${publicados})`;

  document
    .querySelector('.tab[data-status="rascunhos"]')
    .textContent = `Rascunho (${rascunhos})`;
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


function renderizarLista(lista, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum estabelecimento.</p>";
    return;
  }

  const token = localStorage.getItem("token");

  lista.forEach(estab => {
    // Determina a imagem
    const imagemSrc =
      estab.imagemPrincipal ||
      estab.imagens?.find(i => i.fachada)?.url ||
      estab.imagens?.find(i => i.logo)?.url ||
      "./imgs/default-image.png";

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
          <img src="${imagemSrc}" alt="${estab.nome}" onerror="this.onerror=null; this.src='./imgs/default-image.png';">
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
                <input type="checkbox" id="toggle-${estab.id}" ${estab.status === "Publicado" ? "checked" : ""}>
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

    // Event listener para o toggle
    const toggleInput = card.querySelector(`#toggle-${estab.id}`);
    toggleInput.addEventListener("change", async (e) => {
      const novoStatus = e.target.checked ? "Publicado" : "Rascunho";
      
      try {
        const body = {
          "nome": estab.nome,
          "razaoSocial": estab.razaoSocial,
          "cnpj": estab.cnpj,
          "telefone": estab.telefone,
          "emailContato": estab.emailContato,
          "ativo": e.target.checked,
          "categoriaId": estab.categoriaId || 0,
          "cidadeId": estab.cidadeId || 0,
          "rua": estab.rua || "",
          "numero": estab.numero || "",
          "bairro": estab.bairro || "",
          "complemento": estab.complemento || "",
          "cep": estab.cep || "",
          "latitude": estab.latitude || 0,
          "longitude": estab.longitude || 0,
          "grupoId": estab.grupoId || 0,
          "mapaUrl": estab.mapaUrl || "",
          "sobre": estab.sobre || "",
          "status": novoStatus
        };

        const res = await fetch(
          `${API_BASE}/api/Estabelecimentos/${estab.id}`,
          {
            method: "PUT",
            headers: {
              "Authorization": "Bearer " + token,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
          }
        );

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Erro ao alterar status: ${errorText}`);
        }
        
        estab.status = novoStatus;
        estab.ativo = e.target.checked;
        console.log(`Status alterado para: ${novoStatus}`);

      } catch (err) {
        console.error(err);
        alert("Erro ao alterar status: " + err.message);
        e.target.checked = !e.target.checked;
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
  });
}

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


function atualizarDashboard() {
  document.getElementById("totalEstab").textContent =
    estabelecimentosCache.length;

  
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

// Mapeamento de hierarquia: subpages filhas -> página pai
const hierarquia = {
  "criar-estab": "lista-estab",

};

// Listener genérico para botões principais
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-open-subpage]");
  if (!btn) return;
  
  const subpage = btn.dataset.openSubpage;
  
  // Apenas atualiza botões do menu principal (não os de voltar)
  if (!btn.classList.contains("btn-voltar")) {
    // Remove active de todos os botões principais
    document
      .querySelectorAll(".btns-subpage [data-open-subpage]")
      .forEach(el => el.classList.remove("active"));
    
    // Verifica se é uma subpage filha
    const paginaPai = hierarquia[subpage];
    
    if (paginaPai) {
      // Se é filha, ativa o botão pai
      document.querySelector(`[data-open-subpage="${paginaPai}"]`)
        ?.classList.add("active");
    } else {
      // Se não é filha, ativa o próprio botão
      btn.classList.add("active");
    }
  }
  
  abrirSubPage(subpage);
});

// Função específica para voltar ao estabelecimentos
function voltarEstabelecimentos() {
  abrirSubPage("lista-estab");
  // Reativa o botão Estabelecimentos
  document.querySelector('[data-open-subpage="lista-estab"]')
    ?.classList.add("active");
}

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
        : "./imgs/default-image.png";

    // Renderiza badges de cartões
    const cartoesHTML = c.cartoesAceitos && c.cartoesAceitos.length > 0
      ? c.cartoesAceitos.map(cartao => 
          `<span class="badge-cartao">${cartao}</span>`
        ).join('')
      : '';

    container.insertAdjacentHTML("beforeend", `
      <article class="cupom-card-admin">
        <!-- Imagem -->
        <div class="cupom-media-admin">
          <img src="${imagem}" alt="Imagem do cupom" loading="lazy" onerror="this.src='./imgs/default-image.png'">
        </div>

        <!-- Badges de Cartões -->
        <div class="cartoes-cp">
          ${cartoesHTML}
        </div>

        <!-- Header com Título e Toggle -->
        <div class="header-cp-admin">
          <h2 class="cupom-title-admin">${c.titulo}</h2>
          
          <label class="switch-cupom-admin">
            <input type="checkbox" ${c.ativo ? 'checked' : ''} data-cupom-id="${c.id}">
            <span class="slider-cupom-admin"></span>
          </label>
        </div>

        <!-- Conteúdo -->
        <div class="cupom-content-admin">
          <h3>${c.nomeEstabelecimento}</h3>

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

  // Event listeners para editar
  document.querySelectorAll(".btn-editar-cupom-admin").forEach(btn => {
    btn.addEventListener("click", () =>
      abrirModalEditarCupom(btn.dataset.id)
    );
  });

  // Event listeners para excluir
  document.querySelectorAll(".btn-excluir-cupom-admin").forEach(btn => {
    btn.addEventListener("click", () =>
      excluirCupomPromocao(btn.dataset.id)
    );
  });

  // Event listeners para os toggles
  document.querySelectorAll(".switch-cupom-admin input").forEach(toggle => {
    toggle.addEventListener("change", async (e) => {
      const cupomId = e.target.dataset.cupomId;
      const novoStatus = e.target.checked;
      
      try {
        await atualizarStatusCupom(cupomId, novoStatus);
      } catch (err) {
        console.error("Erro ao atualizar status:", err);
        // Reverte o toggle em caso de erro
        e.target.checked = !novoStatus;
      }
    });
  });
}

// Função para atualizar status do cupom
async function atualizarStatusCupom(cupomId, ativo) {
  const token = localStorage.getItem("token");

  try {
    // Busca os dados completos do cupom
    const resGet = await fetch(`${API_BASE}/api/Cupons/${cupomId}`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!resGet.ok) throw new Error("Erro ao buscar cupom");

    const cupom = await resGet.json();

    // Monta o body com TODOS os dados
    const body = {
      "codigo": cupom.codigo,
      "titulo": cupom.titulo,
      "descricao": cupom.descricao,
      "modalTitulo": cupom.modalTitulo,
      "modalDescricao": cupom.modalDescricao,
      "tipo": cupom.tipo,
      "valorDesconto": cupom.valorDesconto,
      "valorMinimoCompra": cupom.valorMinimoCompra,
      "dataInicio": cupom.dataInicio,
      "dataExpiracao": cupom.dataExpiracao,
      "limiteUso": cupom.limiteUso,
      "limiteUsoPorUsuario": cupom.limiteUsoPorUsuario,
      "ativo": ativo,
      "estabelecimentoId": cupom.estabelecimentoId,
      "cartoesAceitosIds": cupom.cartoesAceitos || [],
      "status": ativo ? "Publicado" : "Rascunho"
    };

    // Atualiza o cupom
    const resPut = await fetch(`${API_BASE}/api/Cupons/${cupomId}`, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!resPut.ok) {
      const erro = await resPut.text();
      throw new Error(erro);
    }

    console.log(`Status do cupom ${cupomId} atualizado para: ${ativo ? 'Ativo' : 'Inativo'}`);

  } catch (err) {
    console.error("Erro ao atualizar status do cupom:", err);
    alert("Erro ao atualizar status do cupom.");
    throw err;
  }
}

// Cache para armazenar dados
let estabelecimentosModalCache = [];
let cartoesModalCache = [];

async function abrirModalEditarCupom(id) {
  const token = localStorage.getItem("token");

  try {
    // 🔹 Carrega estabelecimentos e cartões ANTES de buscar o cupom
    await carregarEstabelecimentosModal();
    await carregarCartoesModal();

    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
      alert("Erro ao carregar dados do cupom.");
      return;
    }

    const cupom = await res.json();
    console.log("Cupom carregado:", cupom);

    // Salva o cupom original para reenviar TUDO no PUT
    window._cupomEditando = cupom;

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
    document.getElementById("edit-estabelecimento").value = cupom.estabelecimentoId || "";

    // 🔹 Exibe o estabelecimento vinculado
    exibirEstabelecimentoVinculado(cupom.estabelecimentoId);

    // 🔹 Exibe os cartões vinculados
    exibirCartoesVinculados(cupom.cartoesAceitos || []);

    // SELECT MULTIPLE para cartões aceitos
    if (cupom.cartoesAceitos && cupom.cartoesAceitos.length > 0) {
      const selectCartoes = document.getElementById("edit-cartoes");
      Array.from(selectCartoes.options).forEach(option => {
        option.selected = cupom.cartoesAceitos.includes(parseInt(option.value));
      });
    }

    // Abre o modal
    document.getElementById("modalEditarCupom").classList.add("open");

  } catch (err) {
    console.error("Erro ao carregar cupom:", err);
    alert("Erro ao carregar dados do cupom.");
  }
}

// 🔹 Função para carregar estabelecimentos no select
async function carregarEstabelecimentosModal() {
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
    
    // 🔹 Salva no cache
    estabelecimentosModalCache = estabelecimentos;

    const selectEstab = document.getElementById("edit-estabelecimento");

    // Limpa opções existentes (exceto a primeira)
    selectEstab.innerHTML = '<option value="">Selecione um estabelecimento</option>';

    // Adiciona os estabelecimentos
    estabelecimentos.forEach(estab => {
      const option = document.createElement("option");
      option.value = estab.id;
      option.textContent = estab.nome;
      selectEstab.appendChild(option);
    });

  } catch (error) {
    console.error("Erro ao carregar estabelecimentos:", error);
    alert("Não foi possível carregar os estabelecimentos.");
  }
}

// 🔹 Função para carregar cartões no select multiple
async function carregarCartoesModal() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/Cartoes`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) {
      throw new Error("Erro ao buscar cartões");
    }

    const cartoes = await res.json();
    
    // 🔹 Salva no cache
    cartoesModalCache = cartoes;

    const selectCartoes = document.getElementById("edit-cartoes");

    // Limpa opções existentes
    selectCartoes.innerHTML = "";

    // Adiciona os cartões
    cartoes.forEach(cartao => {
      const option = document.createElement("option");
      option.value = cartao.id;
      option.textContent = cartao.nome;
      selectCartoes.appendChild(option);
    });

  } catch (error) {
    console.error("Erro ao carregar cartões:", error);
    alert("Não foi possível carregar os cartões.");
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

    // Pega cartões selecionados (select multiple)
    const selectCartoes = document.getElementById("edit-cartoes");
    const cartoesAceitosIds = Array.from(selectCartoes.selectedOptions).map(opt => parseInt(opt.value));

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
      "cartoesAceitosIds": cartoesAceitosIds,
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




async function cadastrarEstabelecimento2() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const categoriaId = parseInt(document.getElementById("categoriaId2").value) || null;

  const cidadeSelect = document.getElementById("cidadeId2");

  const ativo = document.getElementById("ativoEstab2").checked;
  

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
  "status": ativo ? "Publicado" : "Rascunho"
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
    fecharModalEditar();
    buscarEstabelecimentos();

  } catch (err) {
    console.error(err);
    alert("Erro ao salvar alterações");
  }
}

function fecharModalEditar() {
  document.getElementById("estadoId2-edit").value = " "
  document.getElementById("cidadeId2-edit").value = " "
  document.getElementById("modalEditarOverlay2").style.display = "none";
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

  const tipoClasse = isLogo ? "upload-logo" : "upload-fachada";
  const srcImagem = imagem?.url || "/imgs/default-image.png";

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
    img.src = "/imgs/default-image.png";
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





async function abrirModalEditar(estab) {

    // 🔹 Abre o modal
  document.getElementById("modalEditarOverlay2").style.display = "flex";
  // 🔹 Carrega selects antes de setar valores
  
  await carregarEstadosModal();
  await carregarCategoriasModal(estab.categorias?.[0]);

 

  // 🔹 ID do estabelecimento
  document.getElementById("editId2").value = estab.id;

  // 🔹 Dados principais
  document.getElementById("nomeEstab2-edit").value = estab.nome || "";
  document.getElementById("razaoSocial2-edit").value = estab.razaoSocial || "";
  document.getElementById("cnpj2-edit").value = estab.cnpj || "";
  document.getElementById("telefone2-edit").value = estab.telefone || "";
  document.getElementById("emailContato2-edit").value = estab.emailContato || "";

  // 🔹 Publicado / Rascunho
  document.getElementById("ativoEstab2-edit").checked =
    estab.status === "Publicado";

  // 🔹 Categoria
 
    console.log("categoria:", estab.categorias)

  // 🔹 Endereço
  document.getElementById("rua2-edit").value = estab.rua || "";
  document.getElementById("numero2-edit").value = estab.numero || "";
  document.getElementById("bairro2-edit").value = estab.bairro || "";
  document.getElementById("complemento2-edit").value = estab.complemento || "";
  document.getElementById("cep2-edit").value = estab.cep || "";
  


  // 🔹 Coordenadas
  document.getElementById("latitude2-edit").value = estab.latitude || "";
  document.getElementById("longitude2-edit").value = estab.longitude || "";

  // 🔹 Extras
  document.getElementById("mapurl2-edit").value = estab.mapaUrl || "";
  document.getElementById("sobre2-edit").value = estab.sobre || "";

  renderizarImagensEdicao(estab);

  /**
   * 🔹 ESTADO → CIDADE
   * Só carrega cidades depois que o estado estiver definido
   */
  if (estab.unidadeFederativaId) {
    document.getElementById("estadoId2-edit").value = estab.unidadeFederativaId;
    
    // Carrega cidades do estado e depois seleciona a cidade correta
    await carregarCidades2(estab.cidade);
  }


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

//GRUPO

let grupoSelecionadoId = null;

async function carregarGrupos() {
  const token = localStorage.getItem("token"); // ajuste se usar outro nome

  try {
    const response = await fetch(`${API_BASE}/api/Grupos/grupos-ativos`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar grupos");
    }

    const grupos = await response.json();
    renderizarListaGrupos(grupos);

  } catch (error) {
    console.error(error);
    alert("Não foi possível carregar os grupos");
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

  } catch (err) {
    console.error(err);
    alert("Erro ao vincular um ou mais estabelecimentos.");
  }
}

function renderizarListaGrupos(grupos) {
  const container = document.getElementById("listaGrupo");
  container.innerHTML = "";

  if (!grupos || grupos.length === 0) {
    container.innerHTML = "<p>Nenhum grupo encontrado.</p>";
    return;
  }

  container.classList.add("grupo-wrapper");

  grupos.forEach(grupo => {
    const logo = grupo.logoCaminho
      ? `${API_BASE}${grupo.logoCaminho}`
      : "default.png";

    const card = document.createElement("div");
    card.className = "grupo-card";

    card.innerHTML = `
      <div class="grupo-logo">
        <img src="${logo}" alt="Logo ${grupo.nome}"
             onerror="this.src='default.png'">
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
          Adicionar estabelecimentos
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}


async function buscarEstabelecimentosDoGrupo(grupoId) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${API_BASE}/api/Grupos/${grupoId}/estabelecimentos-por-grupo`,
    {
      headers: { Authorization: "Bearer " + token }
    }
  );

  if (!res.ok) throw new Error("Erro ao buscar estabelecimentos do grupo");

  return await res.json();
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




