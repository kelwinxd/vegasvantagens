window.initMap = function () {
  const defaultCenter = { lat: -23.561684, lng: -46.625378 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: defaultCenter,
  });
}



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

const filterState2 = document.getElementById("filterState2")
const filterCity2 = document.getElementById("filterCity2");
const filterSegment2 = document.getElementById("filterSegment2");
const filterCard2 = document.getElementById("filterCard2");





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

filterState2.addEventListener("change", () => {
  const estado2 = filterState2.value;
  filterCity2.innerHTML = "";

  if (cityData[estado2]) {
    Object.keys(cityData[estado2]).forEach(cidade => {
      const opt2 = document.createElement("li");
      opt2.setAttribute("data-value", cidade);
      opt2.textContent = cidade.charAt(0).toUpperCase() + cidade.slice(1);
      filterCity2.appendChild(opt2);

      // Evento para selecionar a cidade clicada
      opt2.addEventListener("click", () => {
        // Remove seleção anterior
        filterCity2.querySelectorAll("li").forEach(li => li.classList.remove("selected"));

        // Marca a selecionada
        opt2.classList.add("selected");

        // Salva em uma variável global (exemplo)
        cidadeSelecionada2 = cidade;

        filtrar();
      });
    });
  } else {
    cidadeSelecionada2 = null;
  }
});



function updateMapByCity(cidade, segmento, busca, cartao) {
  markers.forEach(m => m.setMap(null));
  markers = [];
  lojasList.innerHTML = "";

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

btnCloseFilter.addEventListener("click", () => {
    mobileFilter.classList.remove("active")
})

btnFilter.addEventListener('click', () => {
  mobileFilter.classList.add("active")
})





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
    }, 4000);
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
});

slide2.addEventListener('change', () => {
    currentSlide = 2;
    updateSlidePosition();
    updateBulletClasses();
});

slide3.addEventListener('change', () => {
    currentSlide = 3;
    updateSlidePosition();
    updateBulletClasses();
});

const btnLeft = document.querySelector('.btn-left');
const btnRight = document.querySelector('.btn-right');

btnLeft.addEventListener('click', () => {
    currentSlide = currentSlide === 1 ? 3 : currentSlide - 1;
    document.getElementById(`slide${currentSlide}`).checked = true;
    updateSlidePosition();
    updateBulletClasses();
    // Não parar autoplay!
});

btnRight.addEventListener('click', () => {
    currentSlide = currentSlide === 3 ? 1 : currentSlide + 1;
    document.getElementById(`slide${currentSlide}`).checked = true;
    updateSlidePosition();
    updateBulletClasses();
    // Não parar autoplay!
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







  // Carrossel Novidades
  /*
 const slides = document.querySelectorAll('.novidades .flex-content');
let currentIndex = 0;
const bulletsContainer = document.querySelector(".carrossel-bullets");
const bullets2= []; // <- CRIA o array que será usado no updateBullets

function updateBullets(index) {
  bullets2.forEach((bullet, i) => {
    bullet.classList.toggle("active", i === index);
  });
}

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.remove('showing');
  });
  slides[index].classList.add('showing');
  updateBullets(index); // <- Atualiza os bullets sempre que muda o slide
}

function startCarousel() {
  showSlide(currentIndex);

  // Criar os bullets dinamicamente e guardar no array
  slides.forEach((_, index) => {
    const bullet = document.createElement("span");
    bullet.classList.add("bullet");
    if (index === 0) bullet.classList.add("active");

    bullet.addEventListener("click", () => {
      currentIndex = index;
      showSlide(currentIndex); // <- Mostra o slide ao clicar no bullet
    });

    bulletsContainer.appendChild(bullet);
    bullets2.push(bullet); // <- Armazena o bullet no array
  });

  // Muda os slides automaticamente
  setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    showSlide(currentIndex);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", startCarousel);

*/

//Menu-mobile 
const menuMobile = document.querySelector(".menu-hamb")
const mainMenus = document.querySelector(".main-menus")
const closeMenu = document.querySelector(".close-menu")

closeMenu.addEventListener('click', () => {
   mainMenus.classList.remove("active")
   menuMobile.style.display = 'block'
   closeMenu.style.display = 'none'

})

menuMobile.addEventListener("click", () => {
   mainMenus.classList.add("active")
   menuMobile.style.display = 'none'
   closeMenu.style.display = 'block'
})




const slide11 = document.getElementById('slide11');
const slide22 = document.getElementById('slide22');
const slide33 = document.getElementById('slide33');
const slidesContainer1 = document.querySelector('.slides1');
const bullets1 = document.querySelectorAll('.bullet1');

let currentSlide1 = 1;
let autoPlayInterval1;

// Atualiza a posição do slide com base no slide ativo
function updateSlidePosition1() {
    if (slide11.checked) {
        slidesContainer1.style.transform = 'translateX(0%)';
    } else if (slide22.checked) {
        slidesContainer1.style.transform = 'translateX(-33.6%)';
    } else if (slide33.checked) {
        slidesContainer1.style.transform = 'translateX(-66.7%)';
    }
}

// Atualiza os bullets, colocando a cor branca no ativo
function updateBulletClasses1() {
    bullets1.forEach((bullet, index) => {
        if (index + 1 === currentSlide1) {
            bullet.classList.add('bullet-ativo');
        } else {
            bullet.classList.remove('bullet-ativo');
        }
    });
}

// Função de autoplay
function startAutoplay1() {
    autoPlayInterval1 = setInterval(() => {
        currentSlide1 = currentSlide1 % 3 + 1;
        document.getElementById(`slide${currentSlide1}${currentSlide1}`).checked = true;
        updateSlidePosition1();
        updateBulletClasses1();
    }, 4000);
}

// Para o autoplay
function stopAutoplay1() {
    clearInterval(autoPlayInterval1);
}

// Eventos de mudança de slide manual
slide11.addEventListener('change', () => {
    currentSlide1 = 1;
    updateSlidePosition1();
    updateBulletClasses1();
});

slide22.addEventListener('change', () => {
    currentSlide1 = 2;
    updateSlidePosition1();
    updateBulletClasses1();
});

slide33.addEventListener('change', () => {
    currentSlide1 = 3;
    updateSlidePosition1();
    updateBulletClasses1();
});

const btnLeft1 = document.querySelector('.btn-left1');
const btnRight1 = document.querySelector('.btn-right1');

btnLeft1.addEventListener('click', () => {
    currentSlide1 = currentSlide1 === 1 ? 3 : currentSlide1 - 1;
    document.getElementById(`slide${currentSlide1}${currentSlide1}`).checked = true;
    updateSlidePosition1();
    updateBulletClasses1();
});

btnRight1.addEventListener('click', () => {
    currentSlide1 = currentSlide1 === 3 ? 1 : currentSlide1 + 1;
    document.getElementById(`slide${currentSlide1}${currentSlide1}`).checked = true;
    updateSlidePosition1();
    updateBulletClasses1();
});

// Inicializa
updateSlidePosition1();
updateBulletClasses1();
startAutoplay1();

