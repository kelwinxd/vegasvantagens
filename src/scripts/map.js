let map, markers = [];

function corrigirCoordenada(valor, tipo) {
  const num = parseFloat(valor);
  if (isNaN(num)) return null;
  if (tipo === "longitude" && (num > 180 || num < -180)) return num / 1e15;
  if (tipo === "latitude" && (num > 90 || num < -90)) return num / 1e15;
  return num;
}

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

async function fetchAllStores(token) {
  const baseUrl = 'https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos';
  const res = await fetch(baseUrl, { headers: { Authorization: `Bearer ${token}` } });
  const lojas = await res.json();

  const detalhes = await Promise.all(lojas.map(async loja => {
    const detalheRes = await fetch(`${baseUrl}/${loja.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await detalheRes.json();
  }));

  return detalhes.filter(l => l.latitude && l.longitude);
}

async function popularEstadosECidades() {
  const token = await getClientToken();
  const lojas = await fetchAllStores(token);
  const estadosCidades = {};

  lojas.forEach(loja => {
    const estado = loja.uf?.toLowerCase() || "";
    const cidade = loja.cidade?.toLowerCase() || "";
    if (!estado || !cidade) return;
    if (!estadosCidades[estado]) estadosCidades[estado] = new Set();
    estadosCidades[estado].add(cidade);
  });

  const estados = Object.keys(estadosCidades).sort();
  filterState.innerHTML = `<option value="">Todos os Estados</option>`;

  estados.forEach(uf => {
    const opt = document.createElement("option");
    opt.value = uf;
    opt.textContent = uf.toUpperCase();
    filterState.appendChild(opt);
  });

  filterState.addEventListener("change", () => {
    const uf = filterState.value;
    const cidades = estadosCidades[uf] || [];
    filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
    const listaUl = document.getElementById("list-ul");
    listaUl.innerHTML = "";

    [...cidades].sort().forEach(cidade => {
      const opt = document.createElement("option");
      opt.value = cidade;
      opt.textContent = cidade.charAt(0).toUpperCase() + cidade.slice(1);
      filterCity.appendChild(opt);

      const li = document.createElement("li");
      li.dataset.value = cidade;
      li.textContent = cidade.charAt(0).toUpperCase() + cidade.slice(1);
      li.addEventListener("click", () => {
        filterCity.value = cidade;
        filterCity.dispatchEvent(new Event("change"));
        listaUl.querySelectorAll("li").forEach(el => el.classList.remove("active"));
        li.classList.add("active");
      });
      listaUl.appendChild(li);
    });
  });
}

function limparDados() {
  filterState.value = "";
  filterCity.innerHTML = '<option value="">Todas as Cidades</option>';
  filterSegment.value = "";
  filterCard.value = "";
  searchInput.value = "";
  lojasList.innerHTML = "";
  markers.forEach(m => m.setMap(null));
  markers = [];
  const defaultCenter = { lat: -23.561684, lng: -46.625378 };
  map.setCenter(defaultCenter);
  map.setZoom(10);
}

function filtrar() {
  const search = searchInput.value.toLowerCase();
  const estado = filterState.value;
  const cidade = filterCity.value;
  const segmento = filterSegment.value;
  const cartao = filterCard.value;
  updateMapByCity(cidade, segmento, search, cartao);
}

async function updateMapByCity(cidade, segmento, busca, cartao) {
  const token = await getClientToken();
  const lojas = await fetchAllStores(token);

  markers.forEach(m => m.setMap(null));
  markers = [];
  lojasList.innerHTML = "";

  const lojasFiltradas = lojas.filter(loja => {
    const nomeMatch = !busca || loja.nome.toLowerCase().includes(busca.toLowerCase());
    const cidadeMatch = !cidade || loja.cidade.toLowerCase() === cidade.toLowerCase();
    const segMatch = !segmento || loja.categorias?.some(cat => cat.toLowerCase().includes(segmento.toLowerCase()));
    const cardMatch = !cartao || loja.cartoes?.includes(cartao);
    return nomeMatch && cidadeMatch && segMatch && cardMatch;
  });

  if (lojasFiltradas.length === 0) return;
  const centro = corrigirCoordenada(lojasFiltradas[0].latitude, "latitude");
  const centroLng = corrigirCoordenada(lojasFiltradas[0].longitude, "longitude");
  if (!isNaN(centro) && !isNaN(centroLng)) {
    map.setCenter({ lat: centro, lng: centroLng });
    map.setZoom(13);
  }

  lojasFiltradas.forEach(loja => {
    const lat = corrigirCoordenada(loja.latitude, "latitude");
    const lng = corrigirCoordenada(loja.longitude, "longitude");
    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = new google.maps.Marker({ position: { lat, lng }, map, title: loja.nome });
      marker.addListener("click", () => {
        window.location.href = `testes.html#store-${loja.id}`;
      });
      markers.push(marker);

      const li = document.createElement("li");
      li.classList.add("place-card");
      li.innerHTML = `
        <div class="place-image">
          <img src="${loja.imagens[0] || './imgs/default-image.png'}" alt="${loja.nome}" onerror="this.onerror=null;this.src='./imgs/default-image.png';">
        </div>
        <div class="place-details">
          <h3>${loja.nome}</h3>
          <p class="address">${loja.rua}, ${loja.numero}, ${loja.bairro}</p>
          <p class="distance"><img src="./imgs/icons/location.svg" /> 5.0 km</p>
          <button class="btn-card-map">Saiba Mais</button>
        </div>`;
      li.addEventListener("click", () => {
        window.location.href = `testes.html#store-${loja.id}`;
      });
      lojasList.appendChild(li);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await popularEstadosECidades();
  await initMap();
  filtrar();
});

const searchInput = document.getElementById("searchInput");
const btnLimpar = document.querySelector(".limpar");
const lojasList = document.querySelector(".produtoLista");
const filterState = document.getElementById("filterState");
const filterCity = document.getElementById("filterCity");
const filterSegment = document.getElementById("filterSegment");
const filterCard = document.getElementById("filterCard");

filterCity.addEventListener("change", filtrar);
filterSegment.addEventListener("change", filtrar);
filterCard.addEventListener("change", filtrar);
searchInput.addEventListener("input", filtrar);
btnLimpar.addEventListener("click", limparDados);