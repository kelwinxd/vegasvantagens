const searchInput = document.getElementById("searchInput");
const btnLimpar = document.querySelector(".limpar")

const cityData = {
  sp: {
    americana: {
      center: { lat: -22.739444, lng: -47.331111 },
      points: [
        { name: "Academia BodyTech", type: "academia", card: ["visa", "mastercard"], address: "Av. Brasil, 1000 - Americana, SP", position: { lat: -22.735, lng: -47.328 } },
        { name: "Farmácia São João", type: "farmacia", card: ["visa"], address: "Rua das Flores, 200 - Americana, SP", position: { lat: -22.740, lng: -47.330 } }
      ]
    },
    osasco: {
      center: { lat: -23.532, lng: -46.791 },
      points: [
        { name: "Academia Fit Osasco", type: "academia", card: ["mastercard"], address: "Rua Central, 50 - Osasco, SP", position: { lat: -23.530, lng: -46.790 } },
        { name: "Drogaria Osasco", type: "farmacia", card: ["visa"], address: "Av. Principal, 300 - Osasco, SP", position: { lat: -23.533, lng: -46.792 } }
      ]
    }
  },
  rj: {
    rio: {
      center: { lat: -22.9068, lng: -43.1729 },
      points: [
        { name: "Academia Rio Fitness", type: "academia", card: ["visa"], address: "Copacabana, RJ", position: { lat: -22.91, lng: -43.17 } }
      ]
    }
  }
};

let map;
let markers = [];

// Elementos
const filterState = document.getElementById("filterState");
const filterCity = document.getElementById("filterCity");
const filterSegment = document.getElementById("filterSegment");
const filterCard = document.getElementById("filterCard");
const lojasList = document.querySelector(".produtoLista");
const mapContainer = document.getElementById("map"); // Certifique-se que esse ID existe

// Inicializa o mapa
function initMap() {
  const defaultCenter = { lat: -23.561684, lng: -46.625378 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: defaultCenter,
  });
}

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
  

// Atualiza o select de cidades baseado no estado
filterState.addEventListener("change", () => {
  const estado = filterState.value;
  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;

  if (cityData[estado]) {
    Object.keys(cityData[estado]).forEach(cidade => {
      const opt = document.createElement("option");
      opt.value = cidade;
      opt.textContent = cidade.charAt(0).toUpperCase() + cidade.slice(1);
      filterCity.appendChild(opt);
    });
  }

  filtrar();
});

function updateMapByCity(cidade, segmento, busca, cartao) {
    // Limpa os marcadores do mapa
    markers.forEach(m => m.setMap(null));
    markers = [];
  
    // Limpa a lista de lojas
    lojasList.innerHTML = "";
  
    for (const estado in cityData) {
      if (cityData[estado][cidade]) {
        const cidadeData = cityData[estado][cidade];
        const pontos = cidadeData.points;
  
        map.setCenter(cidadeData.center);
        map.setZoom(14);
  
        pontos.forEach(ponto => {
          const nomeMatch = !busca || ponto.name.toLowerCase().includes(busca.toLowerCase());
          const segMatch = !segmento || ponto.type === segmento;
          const cardMatch = !cartao || ponto.card.includes(cartao); // Filtro por cartão
  
          if (nomeMatch && segMatch && cardMatch) {
            // Cria marcador
            const marker = new google.maps.Marker({
              position: ponto.position,
              map: map,
              title: ponto.name
            });
            markers.push(marker);
  
            // Cria item da lista
           // Criação do item da lista (card de lugar)
           const li = document.createElement("li");
           li.classList.add("place-card");
           
           // Defina os data-attributes para permitir filtragem
           li.dataset.city = cidade;
           li.dataset.state = estado;
           li.dataset.seg = ponto.type;
           li.dataset.card = ponto.card.join(",");
           li.dataset.tags = `${ponto.name.toLowerCase()} ${ponto.address.toLowerCase()}`;
           

li.innerHTML = `
  <div class="place-image">
    <img src="URL_DA_IMAGEM_AQUI" alt="${ponto.name}" onerror="this.onerror=null;this.src='default-image.jpg';">
  </div>
  <div class="place-details">
    <h3>${ponto.name}</h3>
    <p class="address">${ponto.address}</p>
    <p class="distance">Distância: 5.0 km</p> <!-- Valor fictício de distância -->
  </div>
`;

lojasList.appendChild(li);

          }
        });
      }
    }
  }
  
  

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
  
// Eventos
filterCity.addEventListener("change", filtrar);
filterSegment.addEventListener("change", filtrar);
filterCard.addEventListener("change", filtrar);
searchInput.addEventListener("input", filtrar);
btnLimpar.addEventListener("click", limparDados)






/* slider */


const slide1 = document.getElementById('slide1');
const slide2 = document.getElementById('slide2');
const slide3 = document.getElementById('slide3');
const slidesContainer = document.querySelector('.slides');
const bullets = document.querySelectorAll('.bullet'); // Supondo que os bullets tenham a classe '.bullet'

let currentSlide = 1;
let autoPlayInterval;

// Atualiza a posição do slide com base no slide ativo
function updateSlidePosition() {
    if (slide1.checked) {
        slidesContainer.style.transform = 'translateX(0%)';
    } else if (slide2.checked) {
        slidesContainer.style.transform = 'translateX(-33.6%)';
    } else if (slide3.checked) {
        slidesContainer.style.transform = 'translateX(-66.7%)';
    }
}

// Atualiza os bullets, colocando a cor branca no ativo
function updateBulletClasses() {
    bullets.forEach((bullet, index) => {
        if (index + 1 === currentSlide) {
            bullet.classList.add('bullet-ativo');
        } else {
            bullet.classList.remove('bullet-ativo');
        }
    });
}

// Função de autoplay (muda o slide a cada 3 segundos)
function startAutoplay() {
    autoPlayInterval = setInterval(() => {
        currentSlide = currentSlide % 3 + 1; // Vai de 1 a 3 e volta para 1
        document.getElementById(`slide${currentSlide}`).checked = true;
        updateSlidePosition();
        updateBulletClasses();
    }, 3000);
}

// Para o autoplay (caso queira parar em algum evento)
function stopAutoplay() {
    clearInterval(autoPlayInterval);
}

// Adiciona evento para os slides ao serem clicados
slide1.addEventListener('change', () => {
    currentSlide = 1;
    updateSlidePosition();
    updateBulletClasses();
    stopAutoplay(); // Para o autoplay quando o usuário interagir
});

slide2.addEventListener('change', () => {
    currentSlide = 2;
    updateSlidePosition();
    updateBulletClasses();
    stopAutoplay();
});

slide3.addEventListener('change', () => {
    currentSlide = 3;
    updateSlidePosition();
    updateBulletClasses();
    stopAutoplay();
});

// Inicializa a posição do slide
updateSlidePosition();
updateBulletClasses();

// Inicia o autoplay
startAutoplay();

