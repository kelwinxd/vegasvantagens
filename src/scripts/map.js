let map, markers = [], todasAsLojas = [];

const filterState = document.getElementById("filterState");
const filterCity = document.getElementById("filterCity");
const filterSegment = document.getElementById("filterSegment");
const filterCard = document.getElementById("filterCard");
const searchInput = document.getElementById("searchInput");
const lojasList = document.querySelector(".produtoLista");
const resultsCount = document.querySelector(".resultscount span");
const listaUl = document.getElementById("list-ul");

window.initMap = async function initMap() {
  const token = await getClientToken();
  todasAsLojas = await fetchAllStores(token);

  if (!todasAsLojas.length) {
    console.warn("Nenhuma loja com coordenadas encontradas.");
    return;
  }

  const primeira = todasAsLojas.find(loja => loja.latitude && loja.longitude);
  if (!primeira) return;

  const lat = corrigirCoordenada(primeira.latitude, "latitude");
  const lng = corrigirCoordenada(primeira.longitude, "longitude");

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat, lng },
    zoom: 13,
  });

  filtrar(); // renderiza marcadores iniciais
};


// === UTILITÁRIOS ===
function corrigirCoordenada(valor, tipo) {
  const num = parseFloat(valor);
  if (isNaN(num)) return null;
  if (tipo === "longitude" && (num > 180 || num < -180)) return num / 1e15;
  if (tipo === "latitude" && (num > 90 || num < -90)) return num / 1e15;
  return num;
}

function normalizarEstado(siglaOuNome) {
  const mapa = {
    "sp": "são paulo",
    "rj": "rio de janeiro",
    "mg": "minas gerais"
  };
  const lower = siglaOuNome.toLowerCase();
  return mapa[lower] || lower;
}

// === API ===
async function getClientToken() {
  const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/Auth/client-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: 'site_vegas_vantagens',
      clientSecret: '8iYQ340vgwr4R1rOsdTg341m1/QEyGfLOIMkGQUasu0='
    })
  });
  const data = await resp.json();
  return data.accessToken;
}

async function fetchAllStores(accessToken) {
  const respLista = await fetch('https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const lista = await respLista.json();

  const detalhes = await Promise.all(lista.map(async loja => {
    const r = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${loja.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return r.ok ? await r.json() : null;
  }));

  return detalhes.filter(e => e && e.latitude && e.longitude);
}

// === MAPA ===
function initMapComLoja(loja) {
  const lat = corrigirCoordenada(loja.latitude, "latitude");
  const lng = corrigirCoordenada(loja.longitude, "longitude");

  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat, lng },
    zoom: 13
  });
}

// === CIDADES DINÂMICAS ===
function atualizarFiltroDeCidades(estadoSelecionado) {
  const estadoNormalizado = normalizarEstado(estadoSelecionado);
  const lojasDoEstado = todasAsLojas.filter(loja =>
    loja.estado?.toLowerCase() === estadoNormalizado
  );

  const cidades = [...new Set(lojasDoEstado.map(l => l.cidade?.toLowerCase()).filter(Boolean))];

  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
  listaUl.innerHTML = "";

  const liDefault = document.createElement("li");
  liDefault.textContent = "Todas as Cidades";
  liDefault.dataset.value = "";
  listaUl.appendChild(liDefault);

  cidades.forEach(cidade => {
    const nomeFormatado = cidade.charAt(0).toUpperCase() + cidade.slice(1);

    const opt = document.createElement("option");
    opt.value = cidade;
    opt.textContent = nomeFormatado;
    filterCity.appendChild(opt);

    const li = document.createElement("li");
    li.textContent = nomeFormatado;
    li.dataset.value = cidade;

    li.addEventListener("click", () => {
      filterCity.value = cidade;
      filterCity.dispatchEvent(new Event("change"));
      listaUl.querySelectorAll("li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");
    });

    listaUl.appendChild(li);
  });
}

// === CARREGAR RESULTADOS ===
function renderizarResultados(lojas) {
  lojasList.innerHTML = "";
  markers.forEach(m => m.setMap(null));
  markers = [];

  lojas.forEach(loja => {
    const lat = corrigirCoordenada(loja.latitude, "latitude");
    const lng = corrigirCoordenada(loja.longitude, "longitude");

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      title: loja.nome
    });
    markers.push(marker);

    marker.addListener('click', () => {
      window.location.href = `testes.html#store-${loja.id}`;
    });

    const li = document.createElement("li");
    li.className = "place-card";
    li.dataset.city = loja.cidade;
    li.dataset.state = loja.estado?.toLowerCase() || "";
    li.dataset.seg = loja.categorias?.join(",") || "";
    li.dataset.card = loja.cartoes?.join(",") || "";
    li.dataset.tags = `${loja.nome.toLowerCase()} ${loja.rua?.toLowerCase() || ""}`;

    li.innerHTML = `
      <div class="place-image">
        <img src="${loja.imagens?.[0] || './imgs/default-image.png'}" alt="${loja.nome}" onerror="this.src='./imgs/default-image.png'">
      </div>
      <div class="place-details">
        <h3>${loja.nome}</h3>
        <p class="address">${loja.rua}, ${loja.numero}, ${loja.bairro}</p>
        <p class="distance"><img src="./imgs/icons/location.svg" /> 5.0 km</p>
        <button class="btn-card-map">Saiba Mais</button>
      </div>
    `;

    li.querySelector(".btn-card-map").addEventListener("click", () => {
      window.location.href = `testes.html#store-${loja.id}`;
    });

    lojasList.appendChild(li);
  });

  resultsCount.textContent = lojas.length;
}

// === FILTRAR ===
function filtrar() {
  const busca = searchInput.value.toLowerCase();
  const estado = filterState.value.toLowerCase();
  const cidade = filterCity.value.toLowerCase();
  const segmento = filterSegment.value.toLowerCase();
  const cartao = filterCard.value.toLowerCase();

  const resultados = todasAsLojas.filter(loja => {
    const nomeMatch = loja.nome?.toLowerCase().includes(busca);
    const estadoMatch = !estado || loja.estado?.toLowerCase() === normalizarEstado(estado);
    const cidadeMatch = !cidade || loja.cidade?.toLowerCase() === cidade;
    const segMatch = !segmento || loja.categorias?.some(c => c.toLowerCase().includes(segmento));
    const cardMatch = !cartao || loja.cartoes?.some(c => c.toLowerCase().includes(cartao));
    return nomeMatch && estadoMatch && cidadeMatch && segMatch && cardMatch;
  });

  if (resultados.length > 0) initMapComLoja(resultados[0]);
  renderizarResultados(resultados);
}

// === LIMPAR ===
function limparDados() {
  filterState.value = "";
  filterCity.innerHTML = '<option value="">Todas as Cidades</option>';
  filterSegment.value = "";
  filterCard.value = "";
  searchInput.value = "";
  lojasList.innerHTML = "";
  markers.forEach(m => m.setMap(null));
  markers = [];
}

// === EVENTOS ===
filterState.addEventListener("change", () => {
  atualizarFiltroDeCidades(filterState.value);
  filtrar();
});
filterCity.addEventListener("change", filtrar);
filterSegment.addEventListener("change", filtrar);
filterCard.addEventListener("change", filtrar);
searchInput.addEventListener("input", filtrar);
document.querySelector(".limpar").addEventListener("click", limparDados);

// === MOBILE SELECT (customizado) ===
document.querySelectorAll(".custom-options").forEach(optionList => {
  const inputId = optionList.dataset.inputId;
  const select = document.getElementById(inputId);
  const title = document.querySelector(`.custom-select-title[data-input-id="${inputId}"]`);

  optionList.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", () => {
      const value = li.dataset.value;
      select.value = value;
      title.textContent = li.textContent;
      optionList.querySelectorAll("li").forEach(el => el.classList.remove("selected"));
      li.classList.add("selected");
      optionList.classList.remove("show-options");
      select.dispatchEvent(new Event("change"));
    });
  });
});

// === INICIALIZAÇÃO ===
document.addEventListener("DOMContentLoaded", async () => {
  const token = await getClientToken();
  todasAsLojas = await fetchAllStores(token);

  filterState.value = "sp";
  atualizarFiltroDeCidades("sp");
  filterCity.value = "americana";

  filtrar();
});

