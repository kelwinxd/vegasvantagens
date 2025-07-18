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







const lojasList = document.querySelector(".produtoLista");
const mapContainer = document.getElementById("map"); 

// Inicializa o mapa

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
              <img src="${ponto.image ? ponto.image : './imgs/default-image.png' }" alt="${ponto.name}" onerror="this.onerror=null;this.src='./imgs/default-image.png';">
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

document.addEventListener("DOMContentLoaded", () => {
  const estadoPadrao = "sp";
  const cidadePadrao = "americana";

  // Define estado
  filterState.value = estadoPadrao;

  // Limpa selects e lista
  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
  const listaUl = document.getElementById("list-ul");
  listaUl.innerHTML = "";

  // Cria li "Todas as Cidades"
  const liDefault = document.createElement("li");
  liDefault.textContent = "Todas as Cidades";
  liDefault.dataset.value = "";
  listaUl.appendChild(liDefault);

  // Popular cidades e <li>s com base no estado
  Object.keys(cityData[estadoPadrao]).forEach(cidade => {
    const nomeFormatado = cidade.charAt(0).toUpperCase() + cidade.slice(1);

    // Adiciona ao <select>
    const opt = document.createElement("option");
    opt.value = cidade;
    opt.textContent = nomeFormatado;
    filterCity.appendChild(opt);

    // Adiciona ao <ul>
    const li = document.createElement("li");
    li.textContent = nomeFormatado;
    li.dataset.value = cidade;

    // Evento: atualizar <select> e aplicar classe 'active'
    li.addEventListener("click", () => {
      filterCity.value = cidade;
      filterCity.dispatchEvent(new Event("change"));

      // Remove 'active' de todos e adiciona no selecionado
      listaUl.querySelectorAll("li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");
    });

    listaUl.appendChild(li);
  });

  // Define cidade no <select>
  filterCity.value = cidadePadrao;

  // Aplica 'active' ao li correspondente
  listaUl.querySelectorAll("li").forEach(li => {
    li.classList.remove("active");
    if (li.dataset.value === cidadePadrao) {
      li.classList.add("active");
    }
  });

  

  // Aplica o filtro
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
