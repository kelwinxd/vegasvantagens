// Código ajustado com lógica de atualização de cidades e mapa integrada

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

async function initMap() {
  try {
    const accessToken = await getClientToken();
    const lojas = await fetchAllStores(accessToken);

    if (!lojas || lojas.length === 0) return;

    const primeiraComCoordValida = lojas.find(loja => {
      const lat = corrigirCoordenada(loja.latitude, "latitude");
      const lng = corrigirCoordenada(loja.longitude, "longitude");
      return !isNaN(lat) && !isNaN(lng);
    });

    if (!primeiraComCoordValida) return;

    const latInicial = corrigirCoordenada(primeiraComCoordValida.latitude, "latitude");
    const lngInicial = corrigirCoordenada(primeiraComCoordValida.longitude, "longitude");

    map = new google.maps.Map(document.getElementById('map'), {
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

        marker.addListener('click', () => {
          window.location.href = `testes.html#store-${loja.id}`;
        });

        markers.push(marker);
      }
    });

  } catch (error) {
    console.error("Erro ao inicializar o mapa:", error.message);
  }
}

const searchInput = document.getElementById("searchInput");
const btnLimpar = document.querySelector(".limpar");

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
  try {
    const respLista = await fetch('https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!respLista.ok) throw new Error("Erro ao buscar lista geral");
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
  } catch (err) {
    console.error("Erro ao buscar estabelecimentos completos:", err.message);
    return [];
  }
}

const filterState = document.getElementById("filterState");
const filterCity = document.getElementById("filterCity");

filterState.addEventListener("change", () => {
  atualizarCidadesPorEstado(filterState.value.toLowerCase());
});

async function atualizarCidadesPorEstado(estado) {
  const listaUl = document.getElementById("list-ul");
  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
  listaUl.innerHTML = "";

  if (!estado) return;

  const accessToken = await getClientToken();
  const lojas = await fetchAllStores(accessToken);

  const cidadesDoEstado = lojas
    .filter(loja => loja.uf?.toLowerCase() === estado)
    .map(loja => loja.cidade?.toLowerCase())
    .filter(Boolean);

  const cidadesUnicas = [...new Set(cidadesDoEstado)].sort();

  const liDefault = document.createElement("li");
  liDefault.textContent = "Todas as Cidades";
  liDefault.dataset.value = "";
  listaUl.appendChild(liDefault);

  cidadesUnicas.forEach(cidade => {
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

  filtrar();
}

function filtrar() {
  // Reimplemente aqui sua lógica de filtragem se necessário
  console.log("Filtro aplicado (placeholder).");
}

// Atualização para selects personalizados (mobile)
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
        await atualizarCidadesPorEstado(value.toLowerCase());
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

filterCity.addEventListener("change", filtrar);
