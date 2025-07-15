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
    const lojas = await fetchAllStores(accessToken);

    if (!lojas || lojas.length === 0) {
      console.warn("Nenhuma loja encontrada.");
      return;
    }

    // Pega a primeira loja com coordenadas válidas (corrigidas)
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

    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: latInicial, lng: lngInicial },
      zoom: 13
    });

    lojas.forEach(loja => {
      const lat = corrigirCoordenada(loja.latitude, "latitude");
      const lng = corrigirCoordenada(loja.longitude, "longitude");

      console.log(`Loja: ${loja.nome}, Latitude corrigida: ${lat}, Longitude corrigida: ${lng}`);

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
  return data.accessToken; // adapte conforme resposta real
}

async function loginToken(email, senha) {
  const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/Auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });
  const data = await resp.json();
  return data.accessToken;
}

async function fetchAllStores(accessToken) {
  try {
    // Buscar lista resumida
    const respLista = await fetch('https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!respLista.ok) throw new Error("Erro ao buscar lista geral");
    const lista = await respLista.json();

    // Buscar detalhes um a um
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

async function fetchStoreDetails(loginToken, storeId) {
  const resp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${storeId}`, {
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
const filterCard = document.getElementById("filterCard");







const lojasList = document.querySelector(".produtoLista");
const mapContainer = document.getElementById("map"); 

// menu mobile
// Atualiza o select de cidades baseado no estado
filterState.addEventListener("change", () => {
  atualizarCidadesPorEstado(filterState.value.toLowerCase());
});


async function fetchCidadesPorEstado(estadoId) {
  const resp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Cidades/por-estado/${estadoId}`);
  return await resp.json();
}

const estados = {
  sp: 1,
  rj: 2,
  mg: 3,
  es: 4
};

async function atualizarCidadesPorEstado(siglaEstado) {
  const estadoId = estados[siglaEstado.toLowerCase()];
  if (!estadoId) return;

  const cidades = await fetchCidadesPorEstado(estadoId);
  const listaUl = document.getElementById("list-ul");
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




async function updateMapByCity(cidade, segmento, busca, cartao) {
  try {
    const accessToken = await getClientToken();
    const lojas = await fetchAllStores(accessToken);

    markers.forEach(m => m.setMap(null));
    markers = [];
    lojasList.innerHTML = "";

    let count = 0;

    const lojasFiltradas = lojas.filter(loja => {
      const nomeMatch = !busca || loja.nome.toLowerCase().includes(busca.toLowerCase());
      const cidadeMatch = !cidade || loja.cidade.toLowerCase() === cidade.toLowerCase();
      const segMatch = !segmento || loja.categorias?.some(cat => cat.toLowerCase().includes(segmento.toLowerCase()));
      const cardMatch = !cartao || loja.cartoes?.includes(cartao); // ajuste se necessário

      return nomeMatch && cidadeMatch && segMatch && cardMatch;
    });

    console.log("Lojas filtradas:", lojasFiltradas);



    if (lojasFiltradas.length === 0) return;

    const cidadeCentro = lojasFiltradas[0];
  const centroLat = corrigirCoordenada(cidadeCentro.latitude, "latitude");
const centroLng = corrigirCoordenada(cidadeCentro.longitude, "longitude");

if (!isNaN(centroLat) && !isNaN(centroLng)) {
  map.setCenter({ lat: centroLat, lng: centroLng });
  map.setZoom(13);
}

lojasFiltradas.forEach(loja => {
  const lat = corrigirCoordenada(loja.latitude, "latitude");
  const lng = corrigirCoordenada(loja.longitude, "longitude");

  if (!isNaN(lat) && !isNaN(lng)) {
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      title: loja.nome
    });


        marker.addListener("click", () => {
          window.location.href = `testes.html#store-${loja.id}`;
        });

        markers.push(marker);

        const li = document.createElement("li");
        li.classList.add("place-card");
        li.dataset.city = loja.cidade;
        li.dataset.state = ""; // pode incluir se for necessário depois
        li.dataset.seg = loja.categorias?.join(",") || "";
        li.dataset.card = loja.cartoes?.join(",") || "";
        li.dataset.tags = `${loja.nome.toLowerCase()} ${loja.rua?.toLowerCase() || ""}`;

        li.innerHTML = `
          <div class="place-image">
            <img src="${loja.imagens[0] || './imgs/default-image.png'}" alt="${loja.nome}" onerror="this.onerror=null;this.src='./imgs/default-image.png';">
          </div>
          <div class="place-details">
            <h3>${loja.nome}</h3>
            <p class="address">${loja.rua}, ${loja.numero}, ${loja.bairro}</p>
            <p class="distance"><img src="./imgs/icons/location.svg" /> 5.0 km</p>
            <button class="btn-card-map">Saiba Mais</button>
          </div>
        `;

        lojasList.appendChild(li);
        count++;

        const resultsCount = document.querySelector(".resultscount span");
        resultsCount.textContent = `${count}`;

        li.addEventListener("click", () => {
          const hash = encodeURIComponent(`store-${loja.id}`);
          window.location.href = `testes.html#${hash}`;
        });

      /*  if (count >= 4) {
          li.classList.add("hidden");
        }*/
      }
    });

  } catch (err) {
    console.error("Erro ao atualizar mapa:", err.message);
  }

const totalItems = lojasList.querySelectorAll("li").length;
if (window.innerWidth <= 768) { // ✅ Só executa em telas menores ou iguais a 768px
  if (totalItems > 3) {
    buttonVerMais.style.display = "block";
    buttonVerMais.textContent = "Ver Mais";
    buttonVerMais.classList.remove("expanded");
  } else {
    buttonVerMais.style.display = "none";
  }
} else {
  // 👉 Se for maior que 768, esconde sempre
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
  const cartao = filterCard.value;

  const produtoLista = document.querySelectorAll(".produtoLista li");

  let cidadesFiltradas = new Set();

  produtoLista.forEach((item) => {
    const nome = item.querySelector("h3")?.textContent.toLowerCase() || "";
    const cidades = item.dataset.city.split(",");
    const estadoItem = item.dataset.state;
    const seg = item.dataset.seg;
    const cards = item.dataset.card.split(",");
    const tags = item.dataset.tags.toLowerCase();

    const nomeOuTagMatch = !search || nome.includes(search) || tags.includes(search);
    const estadoMatch = !estado || estadoItem === estado;
    const cidadeMatch = !cidade || cidades.includes(cidade);
    const segMatch = !segmento || seg === segmento;
    const cardMatch = !cartao || cards.includes(cartao);

    const mostrar = nomeOuTagMatch && estadoMatch && cidadeMatch && segMatch && cardMatch;

    item.style.display = mostrar ? "block" : "none";

    if (mostrar && cidades.length > 0) {
      cidades.forEach(c => cidadesFiltradas.add(c));
    }
  });



  // Atualizar o mapa baseado na(s) cidade(s) encontradas
  if (cidade) {
    updateMapByCity(cidade, segmento, search, cartao);
  } else if (cidadesFiltradas.size === 1) {
    const unicaCidade = [...cidadesFiltradas][0];
    updateMapByCity(unicaCidade, segmento, search, cartao);
  }

}

function limparDados() {
  // Resetar os selects e o campo de busca
  filterState.value = "sp";
  filterCity.innerHTML = '<option value="">Todas as Cidades</option>';
  filterSegment.value = "";
  filterCard.value = "";
  searchInput.value = "";

  // Limpar lista de lojas e marcadores
  lojasList.innerHTML = "";
  markers.forEach(m => m.setMap(null));
  markers = [];

  // Centralizar o mapa na posição padrão
  const defaultCenter = { lat: -23.561684, lng: -46.625378 };
  map.setCenter(defaultCenter);
  map.setZoom(10);
}

document.addEventListener("DOMContentLoaded", async () => {
  const estadoPadrao = "sp";
  const cidadePadrao = "americana";

  // Obtém token e lojas da API
  const clientToken = await getClientToken();
  const lojas = await fetchAllStores(clientToken);

  // Agrupa cidades únicas por estado
  const cidadesDoEstado = lojas
    .filter(l => l.cidade?.toLowerCase().includes(cidadePadrao)) // pode ajustar
    .map(l => l.cidade.toLowerCase());

  const listaUl = document.getElementById("list-ul");
  filterState.value = estadoPadrao;
  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
  listaUl.innerHTML = "";

  // "Todas as cidades"
  const liDefault = document.createElement("li");
  liDefault.textContent = "Todas as Cidades";
  liDefault.dataset.value = "";
  listaUl.appendChild(liDefault);

  // Cidades únicas
  const cidadesUnicas = [...new Set(cidadesDoEstado)];
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

  // Define cidade padrão
  filterCity.value = cidadePadrao;

  listaUl.querySelectorAll("li").forEach(li => {
    li.classList.remove("active");
    if (li.dataset.value === cidadePadrao) {
      li.classList.add("active");
    }
  });

  filtrar();
});


// Eventos
filterCity.addEventListener("change", filtrar);
filterSegment.addEventListener("change", filtrar);
filterCard.addEventListener("change", filtrar);
searchInput.addEventListener("input", filtrar);
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
  await atualizarCidadesPorEstado(value.toLowerCase());


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


