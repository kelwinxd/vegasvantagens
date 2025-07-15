let map, markers = [];

function corrigirCoordenada(valor, tipo) {
  const num = parseFloat(valor);
  if (isNaN(num)) return null;

  if (tipo === "longitude" && (num > 180 || num < -180)) {
    return num / 1e15;
  }
  if (tipo === "latitude" && (num > 90 || num < -90)) {
    return num / 1e15;
  }

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

async function fetchAllStores(accessToken) {
  const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const lista = await resp.json();

  const detalhes = await Promise.all(
    lista.map(async loja => {
      const respDetalhe = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${loja.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!respDetalhe.ok) return null;
      return await respDetalhe.json();
    })
  );

  return detalhes.filter(e => e);
}

async function fetchEstados() {
  const accessToken = await getClientToken();
  const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/UnidadesFederativas', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!resp.ok) {
    console.error("Erro ao buscar estados.");
    return [];
  }

  return await resp.json();
}

async function fetchCidadesPorEstado(estadoId) {
  const accessToken = await getClientToken();
  const resp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Cidades/por-estado/${estadoId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!resp.ok) {
    console.error(`Erro ao buscar cidades: ${resp.status}`);
    return [];
  }

  return await resp.json();
}

async function carregarEstados() {
  const estados = await fetchEstados();
  const filterState = document.getElementById("filterState");
  const listaEstados = document.querySelector("#list-estados");

  estados.forEach(estado => {
    const option = document.createElement("option");
    option.value = estado.id;
    option.textContent = estado.nome;
    filterState.appendChild(option);

    if (listaEstados) {
      const li = document.createElement("li");
      li.textContent = estado.nome;
      li.dataset.value = estado.id;

      li.addEventListener("click", () => {
        filterState.value = estado.id;
        filterState.dispatchEvent(new Event("change"));
        listaEstados.querySelectorAll("li").forEach(el => el.classList.remove("active"));
        li.classList.add("active");
      });

      listaEstados.appendChild(li);
    }
  });
}

async function atualizarCidadesPorEstado(estadoId) {
  if (!estadoId) return;

  const cidades = await fetchCidadesPorEstado(estadoId);
  const listaUl = document.getElementById("list-ul");
  const filterCity = document.getElementById("filterCity");

  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
  listaUl.innerHTML = "";

  cidades.forEach(cidade => {
    const nome = cidade.nome;
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
      listaUl.querySelectorAll("li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");
    });

    listaUl.appendChild(li);
  });

  filtrar();
}

// Evento para select real
const filterState = document.getElementById("filterState");
filterState.addEventListener("change", () => {
  atualizarCidadesPorEstado(filterState.value);
});

async function initMap() {
  const accessToken = await getClientToken();
  const lojas = await fetchAllStores(accessToken);

  const primeira = lojas.find(loja => loja.latitude && loja.longitude);
  if (!primeira) return;

  const latInicial = corrigirCoordenada(primeira.latitude, "latitude");
  const lngInicial = corrigirCoordenada(primeira.longitude, "longitude");

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: latInicial, lng: lngInicial },
    zoom: 13
  });

  lojas.forEach(loja => {
    const lat = corrigirCoordenada(loja.latitude, "latitude");
    const lng = corrigirCoordenada(loja.longitude, "longitude");

    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: loja.nome
      });
      markers.push(marker);
    }
  });
}

window.initMap = initMap;

document.addEventListener("DOMContentLoaded", async () => {
  await carregarEstados();
  await initMap();
});
