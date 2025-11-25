import { getClientToken, loginToken, API_BASE } from '../auth.js';
let map, markers = [];

function corrigirCoordenada(valor, tipo) {
  const num = parseFloat(valor);
  if (isNaN(num)) return null;

  // Corrige se estiver fora dos limites reais de coordenadas
  if (tipo === "longitude" && (num > 180 || num < -180)) {
    return num / 1e15;
  }
  if (tipo === "latitude" && (num > 90 || num < -90)) {
    return num / 1e15;
  }

  return num;
}

async function initMap() {
  try {
    const accessToken = await getClientToken();
    const lojas = await fetchAllStoresCached(accessToken);

    if (!lojas || lojas.length === 0) {
      console.warn("Nenhuma loja encontrada.");
      return;
    }

    // Centro inicial só para instanciar o mapa (sem markers aqui)
    const primeiraComCoordValida = lojas.find(loja => {
      const lat = corrigirCoordenada(loja.latitude, "latitude");
      const lng = corrigirCoordenada(loja.longitude, "longitude");
      return !isNaN(lat) && !isNaN(lng);
    });

    if (!primeiraComCoordValida) {
      console.warn("Nenhuma coordenada válida encontrada.");
      return;
    }

    const latInicial = corrigirCoordenada(primeiraComCoordValida.latitude, "latitude");
    const lngInicial = corrigirCoordenada(primeiraComCoordValida.longitude, "longitude");

    // Cria o mapa uma única vez
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: latInicial, lng: lngInicial },
      zoom: 13
    });

   

  } catch (error) {
    console.error("Erro ao inicializar o mapa:", error.message);
  }
}

let IS_BOOTSTRAPPING = false;

// === SKELETON ===
function showMapSkeleton() {
  const wrap = document.querySelector(".map-container");
  const mapEl = document.getElementById("map");
  if (!wrap || !mapEl) return;

  wrap.style.position = "relative";
  if (!document.getElementById("map-skeleton")) {
    const sk = document.createElement("div");
    sk.id = "map-skeleton";
    sk.className = "skeleton map-skeleton";
    wrap.appendChild(sk);
  }
  mapEl.style.visibility = "hidden";
}
function hideMapSkeleton() {
  const sk = document.getElementById("map-skeleton");
  const mapEl = document.getElementById("map");
  if (sk) sk.remove();
  if (mapEl) mapEl.style.visibility = "visible";
}

function createListSkeleton(qtd = 6) {
  if (!lojasList) return;
  lojasList.innerHTML = "";
  for (let i = 0; i < qtd; i++) {
    const li = document.createElement("li");
    li.className = "skel-card skeleton";

    const thumb = document.createElement("div"); thumb.className = "skel-thumb skeleton";
    const lines = document.createElement("div"); lines.className = "skel-lines";
    const l1 = document.createElement("div"); l1.className = "skel-line skeleton w90";
    const l2 = document.createElement("div"); l2.className = "skel-line skeleton w70";
    const l3 = document.createElement("div"); l3.className = "skel-line skeleton w50";

    lines.appendChild(l1); lines.appendChild(l2); lines.appendChild(l3);
    li.appendChild(thumb); li.appendChild(lines);
    lojasList.appendChild(li);
  }
}

// === LOADER (mínimo visível) ===
let loaderMinTimer = null;
let loaderShownAt = 0;

function mostrarLoader() {
  // some com a mensagem vazia
  const msg = document.getElementById("mensagem-vazia");
  if (msg) msg.style.display = "none";

  // skeletons
  createListSkeleton(6);
  showMapSkeleton();

  // garante que o browser pinte o estado "carregando"
  loaderShownAt = performance.now();
  if (loaderMinTimer) {
    clearTimeout(loaderMinTimer);
    loaderMinTimer = null;
  }
  // força um paint antes de prosseguir (workaround Blink)
  requestAnimationFrame(() => {});
}

function esconderLoader() {
  // respeita um mínimo de 200ms em tela
  const elapsed = performance.now() - loaderShownAt;
  const remaining = Math.max(0, 200 - elapsed);
  if (loaderMinTimer) clearTimeout(loaderMinTimer);
  loaderMinTimer = setTimeout(() => {
    hideMapSkeleton();
    // a lista real substituirá os skeletons ao final do update
    loaderMinTimer = null;
  }, remaining);
}




document.addEventListener("DOMContentLoaded", async () => {
  IS_BOOTSTRAPPING = true;

  await carregarEstados(); // povoa estados e cidades, mas NÃO chama filtrar por causa da flag

  // Seleciona SP (se já não estiver) – opcional, só para garantir UI
  const spOption = [...filterState.options].find(opt => (opt.textContent || "").toUpperCase() === "SP");
  if (spOption) {
    filterState.value = spOption.value;
    const listEstados = document.querySelector(".custom-options[data-input-id='filterState']");
    const estadoLi = listEstados?.querySelector(`li[data-value='${spOption.value}']`);
    if (estadoLi) {
      listEstados.querySelectorAll("li").forEach(el => el.classList.remove("selected"));
      estadoLi.classList.add("selected");
      const title = estadoLi.closest(".custom-select")?.querySelector(".custom-select-title");
      if (title) title.textContent = estadoLi.textContent;
    }
  }

  // Seleciona a cidade "Americana" ANTES de filtrar
  const americanaOpt = [...filterCity.options].find(opt => normalizeStr(opt.textContent) === "americana");
  if (americanaOpt) {
    filterCity.value = americanaOpt.value;

    // reflete no dropdown customizado
    const listaUl = document.getElementById("list-ul");
    if (listaUl) {
      listaUl.querySelectorAll("li").forEach(el => el.classList.remove("active","selected"));
      const liAmericana = [...listaUl.querySelectorAll("li")]
        .find(li => normalizeStr(li.dataset.value || "") === "americana");
      if (liAmericana) {
        liAmericana.classList.add("active","selected");
        const title = listaUl.closest(".custom-select")?.querySelector(".custom-select-title");
        if (title) title.textContent = liAmericana.textContent;
      }
    }
  }

  // Agora podemos filtrar (vai chamar updateMapByCity("Americana", ...))
  IS_BOOTSTRAPPING = false;

  // cria o mapa antes da primeira atualização
  await initMap();

  // dispara a filtragem inicial (cidade = Americana => aplica setZoom(13))
  filtrar();

  // (opcional) carregar categorias depois do mapa para não travar o primeiro paint
  atualizarCategoriasComEstabelecimentos();
});


// Debounce simples
function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

// Última chamada vence (evita “vai e volta” do mapa)
let UPDATE_CALL_SEQ = 0;
function nextUpdateToken() {
  UPDATE_CALL_SEQ += 1;
  return UPDATE_CALL_SEQ;
}
function isStale(token) {
  return token !== UPDATE_CALL_SEQ;
}

// ===== CACHES =====
let ALL_STORES_CACHE = null;                          // cache de lojas
const CIDADES_POR_UF_CACHE = new Map();               // cache: ufId -> [{nome,...}]

//  wrapper em vez de chamar fetchAllStores direto
async function fetchAllStoresCached(accessToken) {
  if (ALL_STORES_CACHE) return ALL_STORES_CACHE;
  ALL_STORES_CACHE = await fetchAllStores(accessToken);
  return ALL_STORES_CACHE;
}







const searchInput = document.getElementById("searchInput");
const btnLimpar = document.querySelector(".limpar");




async function fetchAllStores(accessToken) {
  try {
    
    // Buscar lista resumida
    const respLista = await fetch('https://apivegasvantagens-production.up.railway.app', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!respLista.ok) throw new Error("Erro ao buscar lista geral");
    const lista = await respLista.json();

    // Buscar detalhes um a um
    const detalhes = await Promise.all(
      lista.map(async loja => {
        const detalheResp = await fetch(`https://apivegasvantagens-production.up.railway.app/${loja.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!detalheResp.ok) return null;
        return await detalheResp.json();
      })
    );

    return detalhes.filter(e => e && e.latitude && e.longitude);

  } catch (err) {

    console.error("Erro ao buscar estabelecimentos completos:", err.message);
    return [];
  }
}

async function fetchStoreDetails(loginToken, storeId) {
  const resp = await fetch(`https://apivegasvantagens-production.up.railway.app/${storeId}`, {
    headers: {
      'Authorization': `Bearer ${loginToken}`
    }
  });
  return resp.json(); // retorna dados completos incl. lat/lng, categorias, imagens...
}





// Elementos
const filterState = document.getElementById("filterState");
const filterCity = document.getElementById("filterCity");
const filterSegment = document.getElementById("filterSegment");







const lojasList = document.querySelector(".produtoLista");
const mapContainer = document.getElementById("map"); 

// menu mobile
// Atualiza o select de cidades baseado no estado
filterState.addEventListener("change", () => {
  atualizarCidadesPorEstado(filterState.value);
});








// Busca cidades por UF com cache
async function fetchCidadesPorUfCached(ufId, accessToken) {
  if (CIDADES_POR_UF_CACHE.has(ufId)) {
    return CIDADES_POR_UF_CACHE.get(ufId);
  }
  const resp = await fetch(
    `https://apiclubedevantagens.vegascard.com.br/api/Cidades/por-estado/${ufId}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  if (!resp.ok) {
    CIDADES_POR_UF_CACHE.set(ufId, []); // evita re-fetch nessa sessão
    return [];
  }
  const cidades = await resp.json();
  CIDADES_POR_UF_CACHE.set(ufId, cidades);
  return cidades;
}

// (opcional) Funções para limpar caches quando quiser
function clearStoresCache() { ALL_STORES_CACHE = null; }
function clearCidadesCache() { CIDADES_POR_UF_CACHE.clear(); }


// ===== FUNÇÃO PRINCIPAL =====
async function carregarEstados() {
  try {
    const accessToken = await getClientToken();

    // 1) UFs oficiais
    const respUF = await fetch(
      'https://apiclubedevantagens.vegascard.com.br/api/UnidadesFederativas',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!respUF.ok) throw new Error('Falha ao buscar UFs');
    const todasUFs = await respUF.json(); // [{ id, sigla, ... }]

    // 2) Lojas e set de cidades realmente usadas
    const lojas = await fetchAllStoresCached(accessToken);
    const cidadesDeLojas = new Set(
      lojas.map(l => normalizeStr(l.cidade || "")).filter(Boolean)
    );

    // 3) Verifica, com cache, quais UFs têm alguma cidade presente nas lojas
    //    Fazemos em paralelo pra ficar rápido
    const checks = await Promise.allSettled(
      todasUFs.map(async (uf) => {
        const cidadesUF = await fetchCidadesPorUfCached(uf.id, accessToken);
        const temMatch = cidadesUF.some(c =>
          cidadesDeLojas.has(normalizeStr(c.nome || ""))
        );
        return { uf, temMatch };
      })
    );

    const ufsPopuladas = checks
      .filter(r => r.status === "fulfilled" && r.value.temMatch)
      .map(r => r.value.uf);

    // 4) Monta UI (select + custom list)
    filterState.innerHTML = '<option value="">Todos os Estados</option>';
    const listEstados = document.querySelector(".custom-options[data-input-id='filterState']");
    if (listEstados) listEstados.innerHTML = '<li data-value="">Todos os Estados</li>';

    ufsPopuladas.forEach(estado => {
      const opt = document.createElement("option");
      opt.value = estado.id;                 // mantém ID oficial
      opt.textContent = estado.sigla;
      filterState.appendChild(opt);

      if (listEstados) {
        const li = document.createElement("li");
        li.dataset.value = estado.id;
        li.textContent = estado.sigla;
        listEstados.appendChild(li);

        li.addEventListener("click", async () => {
          filterState.value = estado.id;
          const title = li.closest(".custom-select")?.querySelector(".custom-select-title");
          if (title) title.textContent = estado.sigla;

          listEstados.querySelectorAll("li").forEach(el => el.classList.remove("selected"));
          li.classList.add("selected");

          await atualizarCidadesPorEstado(estado.id);
        });
      }
    });

    // 5) Seleção padrão: SP se houver; senão a primeira UF populada
    const sp = ufsPopuladas.find(e => (e.sigla || "").toUpperCase() === "SP");
    const padrao = sp || ufsPopuladas[0];

    if (padrao) {
      filterState.value = padrao.id;

      if (listEstados) {
        const liPadrao = listEstados.querySelector(`li[data-value='${padrao.id}']`);
        if (liPadrao) {
          listEstados.querySelectorAll("li").forEach(el => el.classList.remove("selected"));
          liPadrao.classList.add("selected");
          const title = liPadrao.closest(".custom-select")?.querySelector(".custom-select-title");
          if (title) title.textContent = padrao.sigla;
        }
      }

      await atualizarCidadesPorEstado(padrao.id);
    } else {
      // Nenhuma UF populada — mantém “Todos os Estados”/limpa cidades
      if (listEstados) {
        const title = listEstados.closest(".custom-select")?.querySelector(".custom-select-title");
        if (title) title.textContent = "Todos os Estados";
      }
      filterState.value = "";
      await atualizarCidadesPorEstado(""); // limpa cidades
    }

  } catch (err) {
    console.error("Erro ao carregar estados:", err);
  }
}



// Função para normalizar strings (remove acentos, espaços extras e padroniza caixa)
function normalizeStr(str = "") {
  return str
    .toString()
    .normalize("NFD") // separa acentos das letras
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim()
    .toLowerCase();
}

async function atualizarCidadesPorEstado(estadoId) {
  if (!estadoId) return;

  const listaUl = document.getElementById("list-ul");
  filterCity.innerHTML = ``;
  listaUl.innerHTML = ``;

  try {
    const accessToken = await getClientToken();

    // 1) Busca cidades do estado
    const resp = await fetch(
      `https://apiclubedevantagens.vegascard.com.br/api/Cidades/por-estado/${estadoId}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!resp.ok) {
      if (Array.isArray(markers)) {
        markers.forEach(m => m.setMap && m.setMap(null));
        markers = [];
      }
      if (typeof lojasList !== "undefined" && lojasList) lojasList.innerHTML = "";
      throw new Error("Cidades não encontradas para este estado.");
    }

    const cidades = await resp.json();

    // 2) Busca estabelecimentos detalhados
    const lojas = await fetchAllStoresCached(accessToken);

    // 3) Cria Set com cidades que possuem estabelecimentos
    const cidadesComEstab = new Set(
      lojas
        .map(loja => normalizeStr(loja.cidade || loja.cidadeNome || (loja.cidade?.nome ?? "")))
        .filter(Boolean)
    );

    let adicionouAlguma = false;

    // 4) Adiciona "Todas as Cidades" no topo
    const optTodas = document.createElement("option");
    optTodas.value = "";
    optTodas.textContent = "Todas as Cidades";
    filterCity.appendChild(optTodas);

    const liTodas = document.createElement("li");
    liTodas.textContent = "Todas as Cidades";
    liTodas.dataset.value = "";
    liTodas.addEventListener("click", () => {
      filterCity.value = "";
      filterCity.dispatchEvent(new Event("change"));

      listaUl.querySelectorAll("li").forEach(el => {
        el.classList.remove("active", "selected");
      });

      liTodas.classList.add("active", "selected");

      const title = listaUl.closest(".custom-select")?.querySelector(".custom-select-title");
      if (title) title.textContent = "Todas as Cidades";
    });
    listaUl.appendChild(liTodas);

    // 5) Adiciona cidades com estabelecimentos
    cidades.forEach(cidade => {
      const nome = (cidade.nome || "").toString();
      const nomeNorm = normalizeStr(nome);

      if (!cidadesComEstab.has(nomeNorm)) return;

      adicionouAlguma = true;

      const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1);

      const opt = document.createElement("option");
      opt.value = nome;
      opt.textContent = nomeFormatado;
      filterCity.appendChild(opt);

      const li = document.createElement("li");
      li.textContent = nomeFormatado;
      li.dataset.value = nome;

      li.addEventListener("click", () => {
        filterCity.value = nome;
        filterCity.dispatchEvent(new Event("change"));

        listaUl.querySelectorAll("li").forEach(el => {
          el.classList.remove("active", "selected");
        });

        li.classList.add("active", "selected");

        const title = listaUl.closest(".custom-select")?.querySelector(".custom-select-title");
        if (title) title.textContent = nomeFormatado;
      });

      listaUl.appendChild(li);
    });

    // 6) Caso não tenha nenhuma cidade com estabelecimentos
    if (!adicionouAlguma) {
      // filterCity.disabled = true; // opcional
    }

  } catch (error) {
    console.warn("Falha ao carregar cidades:", error.message);
  }

  if (!IS_BOOTSTRAPPING && typeof filtrar === "function") filtrar();
}

// Normaliza strings para comparar com segurança

// Carrega dinamicamente as categorias que TÊM estabelecimentos
async function atualizarCategoriasComEstabelecimentos() {
  const selectSeg = document.getElementById("filterSegment");
  const listSeg = document.querySelector(".custom-options[data-input-id='filterSegment']");

  if (!selectSeg) return;

  // limpa UI
  selectSeg.innerHTML = "";
  if (listSeg) listSeg.innerHTML = "";

  try {
    const accessToken = await getClientToken();

    // 1) Buscar todas as lojas detalhadas
    const lojas = await fetchAllStoresCached(accessToken);

    // 2) Extrair categorias que realmente aparecem nas lojas
    //    (suporta loja.categorias como array ou string "A, B")
    const categoriasUsadasSet = new Set();
    const originalPorNorm = new Map(); // guarda nome original para exibir

    lojas.forEach((loja) => {
      let cats = loja.categorias;
      if (!cats) return;

      if (typeof cats === "string") {
        cats = cats.split(",").map(s => s.trim()).filter(Boolean);
      }

      if (Array.isArray(cats)) {
        cats.forEach((c) => {
          const norm = normalizeStr(c);
          if (!norm) return;
          categoriasUsadasSet.add(norm);
          if (!originalPorNorm.has(norm)) {
            originalPorNorm.set(norm, c); // mantém o primeiro formato "bonito" que apareceu
          }
        });
      }
    });

    // 3) Opcional: buscar categorias "oficiais" e filtrar só as que têm uso
    let categoriasOficiais = [];
    const catsResp = await fetch(`${API_BASE}/api/CategoriasEstabelecimentos`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    if (catsResp.ok) {
      categoriasOficiais = await catsResp.json(); // [{id, nome}, ...]
    }

    // 4) Montar lista final de exibição:
    //    - Se tivemos oficiais, preferimos os nomes oficiais presentes no Set
    //    - Senão, usamos os nomes vindos das lojas (fallback)
    let categoriasParaExibir = [];

    if (categoriasOficiais.length > 0) {
      categoriasParaExibir = categoriasOficiais
        .filter(c => categoriasUsadasSet.has(normalizeStr(c.nome)))
        .map(c => c.nome);
    } else {
      // Fallback: usar os nomes tal como vieram das lojas
      categoriasParaExibir = Array.from(categoriasUsadasSet)
        .map(norm => originalPorNorm.get(norm))
        .filter(Boolean);
    }

    // Ordena alfabeticamente (opcional)
    categoriasParaExibir.sort((a, b) => a.localeCompare(b, "pt-BR"));

    // 5) Preencher o select e a lista customizada
    const optTodos = document.createElement("option");
    optTodos.value = "";
    optTodos.textContent = "Todos os Segmentos";
    selectSeg.appendChild(optTodos);

    if (listSeg) {
      const liTodos = document.createElement("li");
      liTodos.dataset.value = "";
      liTodos.textContent = "Todos os Segmentos";
      liTodos.addEventListener("click", () => {
        selectSeg.value = "";
        selectSeg.dispatchEvent(new Event("change"));

        listSeg.querySelectorAll("li").forEach(el => el.classList.remove("selected"));
        liTodos.classList.add("selected");

        const title = listSeg.closest(".custom-select")?.querySelector(".custom-select-title");
        if (title) title.textContent = "Todos os Segmentos";
      });
      listSeg.appendChild(liTodos);
    }

    categoriasParaExibir.forEach((nomeCat) => {
      const opt = document.createElement("option");
      opt.value = nomeCat;          // importante: o value deve ser o MESMO texto usado na sua filtragem
      opt.textContent = nomeCat;
      selectSeg.appendChild(opt);

      if (listSeg) {
        const li = document.createElement("li");
        li.dataset.value = nomeCat;
        li.textContent = nomeCat;

        li.addEventListener("click", () => {
          selectSeg.value = nomeCat;
          selectSeg.dispatchEvent(new Event("change"));

          listSeg.querySelectorAll("li").forEach(el => el.classList.remove("selected"));
          li.classList.add("selected");

          const title = listSeg.closest(".custom-select")?.querySelector(".custom-select-title");
          if (title) title.textContent = nomeCat;
        });

        listSeg.appendChild(li);
      }
    });

  } catch (err) {
    console.error("Erro ao carregar segmentos dinâmicos:", err);
    // fallback mínimo para não quebrar a UI
    const optTodos = document.createElement("option");
    optTodos.value = "";
    optTodos.textContent = "Todos os Segmentos";
    document.getElementById("filterSegment").appendChild(optTodos);
  }

  // dispara filtragem após atualizar a lista
  if (typeof filtrar === "function") filtrar();
}




// Criação do elemento loader no HTML (adicione dinamicamente)
const loader = document.createElement("div");
loader.className = "loader";
loader.style.display = "none";
lojasList.parentElement.insertBefore(loader, lojasList);
/*
function mostrarLoader() {
  const msg = document.getElementById("mensagem-vazia");
if (msg) msg.style.display = "none";
  loader.style.display = "block";
}

*/

/*
function esconderLoader() {
  loader.style.display = "none";
}

*/
function mostrarMensagemVazia() {
  const msg = document.getElementById("mensagem-vazia");
  if (msg) msg.style.display = "block";
}

function esconderMensagemVazia() {
  const msg = document.getElementById("mensagem-vazia");
  if (msg) msg.style.display = "none";
}

async function updateMapByCity(cidade, segmento, busca) {
  const callToken = nextUpdateToken();
  try {
    // mostra skeleton/loader imediatamente
    mostrarLoader();

    const accessToken = await getClientToken();
    const lojas = await fetchAllStoresCached(accessToken);
    if (isStale(callToken)) return; // outra chamada mais nova já começou

    // limpa mapa/lista
    if (markers.length) {
      markers.forEach(m => m.setMap && m.setMap(null));
      markers = [];
    }
    lojasList.innerHTML = "";

    const buscaNorm = (busca || "").toLowerCase();
    const segNorm   = (segmento || "").toLowerCase();
    const cidNorm   = (cidade || "").toLowerCase();

    const lojasFiltradas = lojas.filter(loja => {
      const nomeMatch   = !buscaNorm || loja.nome?.toLowerCase().includes(buscaNorm);
      const cidadeMatch = !cidNorm   || (loja.cidade && loja.cidade.toLowerCase() === cidNorm);
      const segMatch    = !segNorm   || (Array.isArray(loja.categorias) &&
                           loja.categorias.some(cat => (cat||"").toLowerCase().includes(segNorm)));
      return nomeMatch && cidadeMatch && segMatch;
    });

    if (isStale(callToken)) return;

    if (lojasFiltradas.length === 0) {
      mostrarMensagemVazia();
      // nada para renderizar → esconder loader/skeleton desta call
      if (!isStale(callToken)) {
        esconderLoader();
        // se quiser manter o mapa visível mesmo sem resultado:
        hideMapSkeleton && hideMapSkeleton();
      }
      return;
    } else {
      esconderMensagemVazia && esconderMensagemVazia();
    }

    // --- Preparação de câmera ---
    const bounds = new google.maps.LatLngBounds();
    let primeiroValido = null;

    // Minimiza reflow: monta fragment
    const frag = document.createDocumentFragment();
    let count = 0;

    for (const loja of lojasFiltradas) {
      const lat = corrigirCoordenada(loja.latitude, "latitude");
      const lng = corrigirCoordenada(loja.longitude, "longitude");
      if (isNaN(lat) || isNaN(lng)) continue;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: loja.nome
      });
      marker.addListener("click", () => {
        window.location.href = `detalhes.html#store-${loja.id}`;
      });
      markers.push(marker);

      const pos = marker.getPosition();
      if (pos) bounds.extend(pos);
      if (!primeiroValido) primeiroValido = { lat, lng };

      const li = document.createElement("li");
      li.className = "place-card";
      li.dataset.city  = loja.cidade || "";
      li.dataset.state = ""; // se tiver UF no futuro
      li.dataset.seg   = (Array.isArray(loja.categorias) ? loja.categorias.join(",") : "");
      li.dataset.card  = (Array.isArray(loja.cartoes) ? loja.cartoes.join(",") : "");
      li.dataset.tags  = `${(loja.nome||"").toLowerCase()} ${(loja.rua||"").toLowerCase()}`;

      li.innerHTML = `
        <div class="place-image">
          <img src="${(loja.imagens && loja.imagens[0]) || './imgs/default-image.png'}"
               alt="${loja.nome}"
               onerror="this.onerror=null;this.src='./imgs/default-image.png';">
        </div>
        <div class="place-details">
          <h3>${loja.nome}</h3>
          <p class="address">${loja.rua || ""}, ${loja.numero || ""}, ${loja.bairro || ""}</p>
          <p class="distance"><img src="./imgs/icons/location.svg" /> 5.0 km</p>
          <button class="btn-card-map">Saiba Mais</button>
        </div>
      `;
      li.addEventListener("click", () => {
        const hash = encodeURIComponent(`store-${loja.id}`);
        window.location.href = `detalhes.html#${hash}`;
      });

      frag.appendChild(li);
      count++;
    }

    if (isStale(callToken)) return;

    // injeta todos os cards de uma vez
    lojasList.appendChild(frag);

    const resultsCount = document.querySelector(".resultscount span");
    if (resultsCount) resultsCount.textContent = `${count}`;

    // --- Ajuste de câmera (sem flicker) ---
    if (!cidade) {
      // todas as cidades → enquadra tudo e limita zoom
      if (!bounds.isEmpty && !bounds.isEmpty()) {
        map.fitBounds(bounds);
        google.maps.event.addListenerOnce(map, "idle", () => {
          const maxZoom = 10;
          if (map.getZoom() > maxZoom) map.setZoom(maxZoom);
        });
      }
    } else if (primeiroValido) {
      // cidade específica
      map.setCenter(primeiroValido);
      map.setZoom(13);
    }

    // terminou esta call → esconder loaders desta call
    if (!isStale(callToken)) {
      // se estiver usando skeleton:
      hideMapSkeleton && hideMapSkeleton();
      esconderLoader();
    }

  } catch (err) {
    console.error("Erro ao atualizar mapa:", err.message);
    mostrarMensagemVazia && mostrarMensagemVazia();
    if (!isStale(callToken)) {
      // garante que não fique preso em "loading" em caso de erro
      hideMapSkeleton && hideMapSkeleton();
      esconderLoader();
    }
  }

  // Controle do "Ver mais"
  const totalItems = lojasList.children.length;
  if (window.innerWidth <= 768) {
    if (totalItems > 3) {
      buttonVerMais.style.display = "block";
      buttonVerMais.textContent = "Ver Mais";
      buttonVerMais.classList.remove("expanded");
    } else {
      buttonVerMais.style.display = "none";
    }
  } else {
    buttonVerMais.style.display = "none";
  }
}




const buttonVerMais = document.querySelector(".vermais");
const lojasContainer = document.querySelector(".lojas");
const resultsFilter = document.querySelector('.filter-results')

buttonVerMais.addEventListener("click", () => {
  const allItems = document.querySelectorAll(".place-card");

  const isExpanded = buttonVerMais.classList.contains("expanded");

  if (isExpanded) {
  
    allItems.forEach((item, index) => {
      if (index >= 3) {
        item.classList.add("hidden");
      }
    });
    buttonVerMais.textContent = "Ver Mais";
    buttonVerMais.classList.remove("expanded");
  } else {
     const totalHeight = Array.from(allItems)
      .reduce((acc, item) => acc + item.offsetHeight + parseFloat(getComputedStyle(item).marginBottom), 0);
    resultsFilter.style.height = totalHeight + "px";
    lojasContainer.style.height = totalHeight + "px";
    allItems.forEach(item => item.classList.remove("hidden"));
    buttonVerMais.textContent = "Ver Menos";
    buttonVerMais.classList.add("expanded");
  }
});


// Filtro principal
function filtrar() {
  const search = searchInput.value.toLowerCase();
  const estado = filterState.value;
  const cidade = filterCity.value;
  const segmento = filterSegment.value;

  const produtoLista = document.querySelectorAll(".produtoLista li");

  let cidadesFiltradas = new Set();

  produtoLista.forEach((item) => {
    const nome = item.querySelector("h3")?.textContent.toLowerCase() || "";
    const cidades = item.dataset.city.split(",");
    const estadoItem = item.dataset.state;
    const seg = item.dataset.seg;
    const tags = item.dataset.tags.toLowerCase();

    const nomeOuTagMatch = !search || nome.includes(search) || tags.includes(search);
    const estadoMatch = !estado || estadoItem === estado;
    const cidadeMatch = !cidade || cidades.includes(cidade);
    const segMatch = !segmento ||
  (seg || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .includes(segmento.toLowerCase());

    const mostrar = nomeOuTagMatch && estadoMatch && cidadeMatch && segMatch;

    item.style.display = mostrar ? "block" : "none";

    if (mostrar && cidades.length > 0) {
      cidades.forEach(c => cidadesFiltradas.add(c));
    }
  });

 
if (cidade) {
  // Cidade específica
  updateMapByCity(cidade, segmento, search);
} else {
  // "Todas as Cidades" -> carrega todas as lojas (respeitando search/segmento)
  updateMapByCity("", segmento, search);
   
}


}

// opcional: helper para invalidar qualquer update pendente
function cancelPendingUpdates() {
  UPDATE_CALL_SEQ += 1; // qualquer update em voo vira "stale"
}

async function limparDados() {
  try {
    // 0) Cancela qualquer update em voo e limpa UI imediatamente
    cancelPendingUpdates();

    // limpa marcadores e lista já de cara
    if (markers.length) {
      markers.forEach(m => m.setMap && m.setMap(null));
      markers = [];
    }
    if (lojasList) lojasList.innerHTML = "";

    // opcional: skeletons visuais durante o reset
    showMapSkeleton && showMapSkeleton();
    createListSkeleton && createListSkeleton(6);

    // 1) Resetar estado para SP SEM disparar filtrar() no meio
    const spOption = [...filterState.options].find(
      opt => (opt.textContent || "").toUpperCase() === "SP"
    );

    if (spOption) {
      // seta UI do estado
      filterState.value = spOption.value;
      const listEstados = document.querySelector(".custom-options[data-input-id='filterState']");
      if (listEstados) {
        listEstados.querySelectorAll("li").forEach(el => el.classList.remove("selected"));
        const liSp = listEstados.querySelector(`li[data-value='${spOption.value}']`);
        if (liSp) {
          liSp.classList.add("selected");
          const title = liSp.closest(".custom-select")?.querySelector(".custom-select-title");
          if (title) title.textContent = liSp.textContent;
        }
      }

      // impede o atualizarCidadesPorEstado de chamar filtrar() automaticamente
      IS_BOOTSTRAPPING = true;
      await atualizarCidadesPorEstado(spOption.value);
      IS_BOOTSTRAPPING = false;
    }

    // 2) Selecionar AMERICANA (sem disparar change)
    const americanaOpt = [...filterCity.options].find(
      opt => normalizeStr(opt.textContent) === "americana"
    );
    if (americanaOpt) {
      filterCity.value = americanaOpt.value;

      // reflete no dropdown customizado
      const listaUl = document.getElementById("list-ul");
      if (listaUl) {
        listaUl.querySelectorAll("li").forEach(el => el.classList.remove("active","selected"));
        const liAmericana = [...listaUl.querySelectorAll("li")]
          .find(li => normalizeStr(li.dataset.value || "") === "americana");
        if (liAmericana) {
          liAmericana.classList.add("active","selected");
          const title = listaUl.closest(".custom-select")?.querySelector(".custom-select-title");
          if (title) title.textContent = liAmericana.textContent;
        }
      }
    }

    // 3) Resetar segmento e busca (sem disparar change)
    filterSegment.value = "";
    searchInput.value   = "";

    // 4) UMA ÚNICA atualização agora: só Americana, sem concatenar com nada
    await updateMapByCity("Americana", "", "");

  } catch (err) {
    console.error("Erro ao limpar dados:", err);
  } finally {
    // esconde skeletons (updateMapByCity também esconde, mas garantimos aqui)
    clearListSkeleton && clearListSkeleton();
    hideMapSkeleton && hideMapSkeleton();
  }
}








// Eventos
filterCity.addEventListener("change", filtrar);
filterSegment.addEventListener("change", filtrar);
searchInput.addEventListener("input", debounce(filtrar, 300));

btnLimpar.addEventListener("click", limparDados);


//Selects mobile do mapa
// Ativa o dropdown personalizado ao clicar no título
document.querySelectorAll(".custom-select").forEach((selectWrapper) => {
  const title = selectWrapper.querySelector(".custom-select-title");
  const optionsList = selectWrapper.querySelector(".custom-options");

  const hiddenInput = document.getElementById(optionsList.dataset.inputId);

  if (!title || !optionsList || !hiddenInput) return;

  // Abre ou fecha o menu ao clicar no título
  title.addEventListener("click", () => {
    optionsList.classList.toggle("show-options");
  });



  // Seleciona a opção ao clicar
  optionsList.querySelectorAll("li").forEach((option) => {
    option.addEventListener("click", async () => {
      const value = option.getAttribute("data-value");
      console.log(value)

      // Remove "selected" de todos os <li> DENTRO dessa optionsList
      optionsList.querySelectorAll("li").forEach((li) => {
        li.classList.remove("selected");
      });

      // Adiciona "selected" no clicado
      option.classList.add("selected");

      // Atualiza o input oculto e o título
      hiddenInput.value = value;
      console.log("hiddenInput: ", hiddenInput.value)
      title.textContent = option.textContent;

      // Fecha a lista de opções
      optionsList.classList.remove("show-options");

      // Se for o input de estado, atualiza as cidades
    if (hiddenInput.id === "filterState") {
   hiddenInput.dispatchEvent(new Event("change"));


} else {
  // Para cidade, segmento, cartão...
  hiddenInput.dispatchEvent(new Event("change"));
}

    });
  });

  // Fecha o menu se clicar fora
  document.addEventListener("click", (e) => {
    if (!selectWrapper.contains(e.target)) {
      optionsList.classList.remove("show-options");
    }
  });
});



const btnCloseFilter = document.querySelector(".close-filter")
const mobileFilter = document.querySelector(".mobile-btns")
const btnFilter = document.querySelector(".mobile-filter")
const overlay = document.querySelector(".overlay")

btnCloseFilter.addEventListener("click", () => {
    mobileFilter.classList.remove("active")
      overlay.classList.remove("active")
        document.body.classList.remove("no-scroll")
})

btnFilter.addEventListener('click', () => {
  mobileFilter.classList.add("active")
  overlay.classList.add("active")
 document.body.classList.add('no-scroll');
  
})

 document.querySelectorAll('.custom-options').forEach(optionList => {
    const selectId = optionList.dataset.inputId;
    const select = document.getElementById(selectId);

    optionList.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => {
        const value = li.dataset.value;

        // Atualiza o select escondido
        select.value = value;

        // Marca a opção selecionada visualmente
        optionList.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
        li.classList.add('selected');



        // Dispara evento de mudança, caso haja lógica atrelada
        select.dispatchEvent(new Event('change'));
      });
    });
  });

window.initMap = initMap;
