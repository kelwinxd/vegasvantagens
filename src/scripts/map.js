let map, markers = [];

function isValidCoordinate(coord) {
  return typeof coord === 'number' && isFinite(coord) && Math.abs(coord) <= 90;
}
async function initMap() {
  const token = await getClientToken();
  const lojas = await fetchAllStores(token);

  if (!lojas || lojas.length === 0) {
  console.warn("Nenhuma loja encontrada.");
  return;
}
const first = lojas[0];
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: first.latitude, lng: first.longitude },
    zoom: 13
  });

  lojas.forEach(loja => {
  if (isValidCoordinate(loja.latitude) && isValidCoordinate(loja.longitude)) {
  const marker = new google.maps.Marker({
    position: { lat: parseFloat(loja.latitude),
lng: parseFloat(loja.longitude), },
    map,
    title: loja.nome
  });
  marker.addListener('click', () => {
    window.location.href = `detalhes.html#store-${loja.id}`;
  });
  markers.push(marker);
}
  });
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
  return data.token; // adapte conforme resposta real
}

async function loginToken(email, senha) {
  const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/Auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });
  const data = await resp.json();
  return data.token;
}

async function fetchAllStores(clientToken) {
  try {
    const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/Store', {
      headers: {
        'Authorization': `Bearer ${clientToken}`
      }
    });
    if (!resp.ok) throw new Error('Erro ao buscar lojas');
    return await resp.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function fetchStoreDetails(loginToken, storeId) {
  const resp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Store/${storeId}`, {
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

// Inicializa o mapa

/*
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Usa a API de geocodificação reversa do Google para obter cidade/estado
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === "OK" && results[0]) {
        let cidadeDetectada = "";
        let estadoDetectado = "";

        for (const comp of results[0].address_components) {
          if (comp.types.includes("administrative_area_level_2")) {
            cidadeDetectada = comp.long_name.toLowerCase();
          }
          if (comp.types.includes("administrative_area_level_1")) {
            estadoDetectado = comp.short_name.toLowerCase(); // 'SP', 'RJ'...
          }
        }

        // Se a cidade/estado detectados existirem no seu cityData, selecione
        if (cityData[estadoDetectado] && cityData[estadoDetectado][cidadeDetectada]) {
          filterState.value = estadoDetectado;

          // Atualiza as opções de cidade
          filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
          Object.keys(cityData[estadoDetectado]).forEach(cidade => {
            const opt = document.createElement("option");
            opt.value = cidade;
            opt.textContent = cidade.charAt(0).toUpperCase() + cidade.slice(1);
            filterCity.appendChild(opt);
          });

          filterCity.value = cidadeDetectada;
          filtrar(); // Aplica o filtro
        }
      }
    });
  });
}
*/
// Atualiza o select de cidades baseado no estado
filterState.addEventListener("change", () => {
  const estado = filterState.value;
  const listaUl = document.getElementById("list-ul");
  
  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;

  if (cityData[estado]) {

    listaUl.innerHTML = ""; 
    Object.keys(cityData[estado]).forEach(cidade => {
      const opt = document.createElement("option");

      opt.value = cidade;
      opt.textContent = cidade.charAt(0).toUpperCase() + cidade.slice(1);
      filterCity.appendChild(opt);

  // LI (para a UI customizada)
    const li = document.createElement("li");
    li.textContent = cidade.charAt(0).toUpperCase() + cidade.slice(1);
    li.dataset.value = cidade;

    // Evento de clique para atualizar o filtro
    li.addEventListener("click", () => {
      filterCity.value = cidade; // atualiza o select
      filterCity.dispatchEvent(new Event("change")); // dispara o evento de filtro
    });

    listaUl.appendChild(li);
    });




  }

  filtrar();
});




function updateMapByCity(cidade, segmento, busca, cartao) {
  markers.forEach(m => m.setMap(null));
  markers = [];
  lojasList.innerHTML = "";

   let count = 0;

  for (const estado in cityData) {
    if (cityData[estado][cidade]) {
      const cidadeData = cityData[estado][cidade];
      if (cidadeData.center && cidadeData.points.length > 0) {
  map.setCenter(cidadeData.center);
  map.setZoom(13);
}
      

      cidadeData.points.forEach(ponto => {
        const nomeMatch = !busca || ponto.name.toLowerCase().includes(busca.toLowerCase());
        const segMatch = !segmento || ponto.type.includes(segmento);
        const cardMatch = !cartao || ponto.card.includes(cartao);

        if (nomeMatch && segMatch && cardMatch) {
          const marker = new google.maps.Marker({
            position: ponto.position,
            map: map,
            title: ponto.name
          });
          markers.push(marker);

          const li = document.createElement("li");
          li.classList.add("place-card");
          li.dataset.city = cidade;
          li.dataset.state = estado;
          li.dataset.seg = ponto.type.join(",");
          li.dataset.card = ponto.card.join(",");
          li.dataset.tags = `${ponto.name.toLowerCase()} ${ponto.address.toLowerCase()}`;

          li.innerHTML = `
         
            <div class="place-image">
              <img src="${ponto.image}" alt="${ponto.name}" onerror="this.onerror=null;this.src='./imgs/default-image.png';">
            </div>
            <div class="place-details">
              <h3>${ponto.name}</h3>
              <p class="address">${ponto.address}</p>
              <p class="distance"><img src="./imgs/icons/location.svg" /> 5.0 km</p>
              <button class ="btn-card-map"> Saiba Mais </button>
            </div>
       
          `;
           
          lojasList.appendChild(li);
          count++

          const resultsCount = document.querySelector(".resultscount span")
          
          resultsCount.textContent = `${count}`
          if(li){
            li.addEventListener("click", () => {
              // Formata a hash com base no nome, cidade e estado
              const hash = encodeURIComponent(`${cidade}-${estado}-${ponto.name}`);
              window.location.href = `detalhes.html#${hash}`;

            


            });
          }

              if (count >= 4) {
            li.classList.add('hidden');
            console.log("escondido")
          }

          
          
        }
      });
    }
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
  filterState.value = "";
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
  option.addEventListener("click", () => {
    const value = option.getAttribute("data-value");

    // Remove "selected" de todos os <li> DENTRO dessa optionsList
    optionsList.querySelectorAll("li").forEach((li) => {
      li.classList.remove("selected");
    });

    // Adiciona "selected" no clicado
    option.classList.add("selected");

    // Atualiza o input oculto e o título
    hiddenInput.value = value;
    title.textContent = option.textContent;

    // Fecha a lista de opções
    optionsList.classList.remove("show-options");

    // Dispara evento de mudança (se necessário)
    hiddenInput.dispatchEvent(new Event("change"));
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


