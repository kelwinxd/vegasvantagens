const searchInput = document.getElementById("searchInput");
const btnLimpar = document.querySelector(".limpar");

const cityData = {
  sp: {
    americana: {
      center: { lat: -22.740435, lng: -47.326196 },
      points: [
        {
          name: "Zanini",
          type: ["presentes", "utensílios domésticos", "variedades", "brinquedos"],
          card: ["vegas day", "vegas plus"],
          address: "Av. Dr. Antônio Lobo, 615 - Centro, Americana - SP, 13465-005",
          position: { lat: -22.740250, lng: -47.328021 },
          image:"./imgs/comercios/zanini-est.webp"
        },
        {
          name: "Mercadão dos Óculos",
          type: ["ótica"],
          card: ["vegas day", "vegas plus"],
          address: "Av. Dr. Antônio Lobo, 233 - Centro, Americana - SP, 13465-005",
          position: { lat: -22.740082, lng: -47.330582 },
          image:"./imgs/comercios/mercadaooculos.webp"
        },
        {
          name: "Intensos Barbearia",
          type: ["barbearia"],
          card: ["vegas day", "vegas plus"],
          address: "R. João Bernestein, 651 - Jardim São Vito, Americana - SP, 13473-200",
          position: { lat: -22.737966, lng: -47.311791 }
        },
        {
          name: "Cãochorro Petshop",
          type: ["petshop"],
          card: ["vegas day", "vegas plus"],
          address: "R. das Paineiras, 305 - Jardim Paulistano, Americana - SP, 13474-450",
          position: { lat: -22.717230, lng: -47.303097 },
          image:"./imgs/comercios/cachorro.webp"
        },
        {
          name: "Betta Suplementos",
          type: ["alimentação"],
          card: ["vegas day", "vegas plus", "vegas alimentação", "vegas refeição"],
          address: "R. Sete de Setembro, 135 - Centro, Americana - SP, 13465-300",
          position: { lat: -22.739187, lng: -47.327828 }
        },
        {
          name: "Boi que Mia",
          type: ["restaurante"],
          card: ["vegas day", "vegas plus", "vegas alimentação", "vegas refeição"],
          address: "R. das Paineiras, 378 - Jardim Paulistano, Americana - SP, 13474-450",
          position: { lat: -22.716999, lng: -47.303373 },
          image:"./imgs/comercios/boimia.jpg"
        },
        {
          name: "Casa Florindo",
          type: ["restaurante"],
          card: ["vegas day", "vegas plus"],
          address: "Av. Campos Salles, 181 - Centro, Americana - SP, 13465-400",
          position: { lat: -22.738252, lng: -47.325693 }
        },
        {
          name: "Deck Meia 13",
          type: ["restaurante"],
          card: ["vegas day", "vegas plus"],
          address: "R. Fortunato Faraone, 242 - Vila Rehder, Americana - SP, 13465-450",
          position: { lat: -22.737541, lng: -47.326669 }
        },
        {
          name: "Danny Cosméticos",
          type: ["cosméticos"],
          card: ["vegas day", "vegas plus"],
          address: "Av. Dr. Antônio Lobo, 455 - Centro, Americana - SP, 13465-005",
          position: { lat: -22.739728, lng: -47.328574 }
        },
        {
          name: "Vidrovan",
          type: ["veículos"],
          card: ["vegas day", "vegas plus"],
          address: "Av. Paulista, 1015 - Vila Santa Catarina, Americana - SP, 13465-490",
          position: { lat: -22.724245, lng: -47.323191 }
        },
        {
          name: "Maryara Panificadora & Doçaria",
          type: ["restaurante"],
          card: ["vegas day", "vegas plus", "vegas alimentação", "vegas refeição"],
          address: "Av. Afonso Arinos, 249 - Jardim da Paz, Americana - SP, 13474-000",
          position: { lat: -22.703432, lng: -47.293846 }
        },
        {
          name: "Rede Ferrara",
          type: ["posto de combustível"],
          card: ["vegas day", "vegas plus", "vegas combustível"],
          address: "Av. Nossa Sra. de Fátima, 373 - Parque Universitário, Americana - SP, 13468-280",
          position: { lat: -22.716347, lng: -47.289679 }
        },
        {
          name: "Casa de Carne Boi Forte",
          type: ["açougue"],
          card: ["vegas day", "vegas plus", "vegas alimentação"],
          address: "R. São Vito, 65 - Jardim São Vito, Americana - SP, 13473-230",
          position: { lat: -22.736031, lng: -47.312421 }
        },
        {
          name: "Shopping das Utilidades",
          type: ["presentes", "utensílios domésticos", "variedades", "brinquedos"],
          card: ["vegas day", "vegas plus", "vegas alimentação"],
          address: "Av. Dr. Antônio Lobo, 275 - Centro, Americana - SP, 13465-005",
          position: { lat: -22.739852, lng: -47.328970 }
        }
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
  markers.forEach(m => m.setMap(null));
  markers = [];
  lojasList.innerHTML = "";

  for (const estado in cityData) {
    if (cityData[estado][cidade]) {
      const cidadeData = cityData[estado][cidade];
      map.setCenter(cidadeData.center);
      map.setZoom(14);

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
              <p class="distance">Distância: 5.0 km</p>
            </div>
       
          `;

          lojasList.appendChild(li);
          if(li){
            li.addEventListener("click", () => {
              // Formata a hash com base no nome, cidade e estado
              const hash = encodeURIComponent(`${cidade}-${estado}-${ponto.name}`);
              window.location.href = `detalhes.html#${hash}`;
            });
          }

          
          
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

document.addEventListener("DOMContentLoaded", () => {
  const estadoPadrao = "sp";
  const cidadePadrao = "americana";

  // Define estado
  filterState.value = estadoPadrao;

  // Popular cidades com base no estado
  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
  Object.keys(cityData[estadoPadrao]).forEach(cidade => {
    const opt = document.createElement("option");
    opt.value = cidade;
    opt.textContent = cidade.charAt(0).toUpperCase() + cidade.slice(1);
    filterCity.appendChild(opt);
  });

  // Define cidade
  filterCity.value = cidadePadrao;

  // Aplica o filtro para mostrar resultados e atualizar o mapa
  filtrar();
});


// Eventos
filterCity.addEventListener("change", filtrar);
filterSegment.addEventListener("change", filtrar);
filterCard.addEventListener("change", filtrar);
searchInput.addEventListener("input", filtrar);
btnLimpar.addEventListener("click", limparDados);







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




/* Filter Categorias */

 const categoriaCards = document.querySelectorAll('.card-categoria');
  const descontoCards   = document.querySelectorAll('.card-desconto');

  function resetFiltragem() {
    categoriaCards.forEach(c => c.classList.remove('active'));
    descontoCards.forEach(d => d.classList.remove('hidden'));
  }

  const cardsDesc = document.querySelector(".cards-descontos")

  function filtrarPorCategoria(cat) {
    resetFiltragem();
    // destaca categoria
    const clicked = document.querySelector(`.card-categoria[data-cat="${cat}"]`);
    if (clicked) {
      clicked.classList.add('active');
      cardsDesc.classList.add('classify-cards')

    } 

    // filtra descontos
    descontoCards.forEach(d => {
      if (d.dataset.tag !== cat) d.classList.add('hidden');
    });
  }

  // listener em cada categoria
 categoriaCards.forEach(catCard => {
  catCard.addEventListener('click', (e) => {
    e.preventDefault(); // caso algum clique em link
    const cat = catCard.dataset.cat;
    if (location.hash !== `#${cat}`) {
      location.hash = cat; // Isso vai acionar o hashchange depois
    } else {
      // se o hash já for o mesmo, ainda assim forçamos o filtro
      filtrarPorCategoria(cat);
    }
  });
});

  // reage a mudanças de hash (back/forward e direto na URL)
  window.addEventListener('hashchange', () => {
    const cat = location.hash.replace('#','');
    if (cat) filtrarPorCategoria(cat);
    else resetFiltragem();
  });

  // ao carregar a página, aplica filtro do hash (se houver)
  window.addEventListener('DOMContentLoaded', () => {
    const cat = location.hash.replace('#','');
    if (cat) filtrarPorCategoria(cat);
  });




  
   const track = document.getElementById('track');
  const carrossel = document.getElementById('carrossel');

  // Duplica os itens para garantir continuidade
  track.innerHTML += track.innerHTML;

  let posX = 0;
  let animationId;
  const speed = 1; // pixels por frame

  function animate() {
    posX -= speed;
    if (Math.abs(posX) >= track.scrollWidth / 2) {
      posX = 0;
    }
    track.style.transform = `translateX(${posX}px)`;
    animationId = requestAnimationFrame(animate);
  }

  animate(); // inicia animação

  // Pausar ao passar mouse
  carrossel.addEventListener('mouseenter', () => cancelAnimationFrame(animationId));
  carrossel.addEventListener('mouseleave', () => animate());






  const slides = document.querySelectorAll('.novidades .flex-content');
  let currentIndex = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.remove('showing');
    });
    slides[index].classList.add('showing');
  }

  function startCarousel() {
    showSlide(currentIndex);

    setInterval(() => {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    }, 3000);
  }

  document.addEventListener("DOMContentLoaded", startCarousel);

