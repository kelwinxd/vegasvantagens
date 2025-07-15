// ✅ CÓDIGO FINAL - Corrigido e Otimizado com base na lógica do exemplo original (API + token)
let map, markers = [];

function corrigirCoordenada(valor, tipo) {
  const num = parseFloat(valor);
  if (isNaN(num)) return null;
  if (tipo === "longitude" && (num > 180 || num < -180)) return num / 1e15;
  if (tipo === "latitude" && (num > 90 || num < -90)) return num / 1e15;
  return num;
}

window.initMap = async function () {
  const accessToken = await getClientToken();
  const lojas = await fetchAllStores(accessToken);

  const primeira = lojas.find(loja => {
    const lat = corrigirCoordenada(loja.latitude, "latitude");
    const lng = corrigirCoordenada(loja.longitude, "longitude");
    return !isNaN(lat) && !isNaN(lng);
  });

  if (!primeira) return;

  const lat = corrigirCoordenada(primeira.latitude, "latitude");
  const lng = corrigirCoordenada(primeira.longitude, "longitude");

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat, lng },
    zoom: 13,
  });

  await carregarEstados();
  await atualizarCidadesPorEstado("1");
  inicializarDropdownMobile();
  filtrar();
};

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
  const detalhes = await Promise.all(
    lista.map(async loja => {
      const detalheResp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${loja.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!detalheResp.ok) return null;
      return await detalheResp.json();
    })
  );
  return detalhes.filter(e => e && e.latitude && e.longitude);
}

async function carregarEstados() {
  const token = await getClientToken();
  const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/UnidadesFederativas', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const estados = await resp.json();
  const filterState = document.getElementById("filterState");
  const ul = document.querySelector('[data-input-id="filterState"]');

  filterState.innerHTML = "";
  ul.innerHTML = "";

  estados.forEach(estado => {
    const opt = document.createElement("option");
    opt.value = estado.id;
    opt.textContent = estado.nome;
    filterState.appendChild(opt);

    const li = document.createElement("li");
    li.dataset.value = estado.id;
    li.textContent = estado.nome;
    ul.appendChild(li);
  });
}

async function atualizarCidadesPorEstado(estadoId) {
  const token = await getClientToken();
  const resp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Cidades/por-estado/${estadoId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const cidades = await resp.json();

  const listaUl = document.getElementById("list-ul");
  const filterCity = document.getElementById("filterCity");
  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
  listaUl.innerHTML = "<li data-value=''>Todas as Cidades</li>";

  cidades.forEach(cidade => {
    const opt = document.createElement("option");
    opt.value = cidade.nome.toLowerCase();
    opt.textContent = cidade.nome;
    filterCity.appendChild(opt);

    const li = document.createElement("li");
    li.textContent = cidade.nome;
    li.dataset.value = cidade.nome.toLowerCase();

    li.addEventListener("click", () => {
      filterCity.value = cidade.nome.toLowerCase();
      filterCity.dispatchEvent(new Event("change"));
      listaUl.querySelectorAll("li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");
    });

    listaUl.appendChild(li);
  });
}

function inicializarDropdownMobile() {
  document.querySelectorAll(".custom-select").forEach((selectWrapper) => {
    const title = selectWrapper.querySelector(".custom-select-title");
    const optionsList = selectWrapper.querySelector(".custom-options");
    const hiddenInput = document.getElementById(optionsList.dataset.inputId);

    if (!title || !optionsList || !hiddenInput) return;

    title.addEventListener("click", () => {
      optionsList.classList.toggle("show-options");
    });

    optionsList.querySelectorAll("li").forEach((option) => {
      option.addEventListener("click", async () => {
        const value = option.getAttribute("data-value");
        optionsList.querySelectorAll("li").forEach((li) => li.classList.remove("selected"));
        option.classList.add("selected");
        hiddenInput.value = value;
        title.textContent = option.textContent;
        optionsList.classList.remove("show-options");

        if (hiddenInput.id === "filterState") {
          await atualizarCidadesPorEstado(value);
        } else {
          hiddenInput.dispatchEvent(new Event("change"));
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (!selectWrapper.contains(e.target)) {
        optionsList.classList.remove("show-options");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {

  await carregarEstados();
  await atualizarCidadesPorEstado("1");
  inicializarDropdownMobile();
});
