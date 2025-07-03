const titleComercio = document.querySelectorAll('.title-comercio')
const adress = document.querySelector(".adress")

const cityData = {
  sp: {
    americana: {
      center: { lat: -22.740435, lng: -47.326196 },
      points: [
        {
          name: "Zanini",
          type: ["presentes", "utensílios domésticos", "variedades", "brinquedos"],
          card: ["vegas day", "vegas plus"],
          phone:"(19) 3462-1940",
          address: "Av. Dr. Antônio Lobo, 615 - Centro, Americana - SP, 13465-005",
          position: { lat: -22.740250, lng: -47.328021 },
          image:"./imgs/comercios/zanini-est.webp",
          logo:"./imgs/logos/logo-zanini.png"
        
        },
        {
          name: "Mercadão dos Óculos",
          type: ["ótica"],
          card: ["vegas day", "vegas plus"],
          phone:"(19) 3462-1940",
          address: "Av. Dr. Antônio Lobo, 233 - Centro, Americana - SP, 13465-005",
          position: { lat: -22.740082, lng: -47.330582 },
          image:"./imgs/comercios/mercadaooculos.webp",
          logo:"./imgs/logos/oculosmercadao.png"
        },
        {
          name: "Intensos Barbearia",
          type: ["barbearia"],
          card: ["vegas day", "vegas plus"],
          phone:"(19) 3462-1940",
          address: "R. João Bernestein, 651 - Jardim São Vito, Americana - SP, 13473-200",
          position: { lat: -22.737966, lng: -47.311791 },
          logo:"./imgs/logos/intensos-barbearia.png"
        },
        {
          name: "Cãochorro Petshop",
          type: ["petshop"],
          card: ["vegas day", "vegas plus"],
          phone:"(19) 3462-1940",
          address: "R. das Paineiras, 305 - Jardim Paulistano, Americana - SP, 13474-450",
          position: { lat: -22.717230, lng: -47.303097 },
          image:"./imgs/comercios/cachorro.webp",
          logo:"./imgs/logos/caochorro-logo.png"
        },
        {
          name: "Betta Suplementos",
          type: ["alimentação"],
          phone:"(19) 3462-1940",
          card: ["vegas day", "vegas plus", "vegas alimentação", "vegas refeição"],
          address: "R. Sete de Setembro, 135 - Centro, Americana - SP, 13465-300",
          position: { lat: -22.739187, lng: -47.327828 },
          logo:"./imgs/logos/beta-png.png"
        },
        {
          name: "Boi que Mia",
          type: ["restaurante"],
          phone:"(19) 3462-1940",
          card: ["vegas day", "vegas plus", "vegas alimentação", "vegas refeição"],
          address: "R. das Paineiras, 378 - Jardim Paulistano, Americana - SP, 13474-450",
          position: { lat: -22.716999, lng: -47.303373 },
          image:"./imgs/comercios/boimia.jpg",
          logo:"./imgs/logos/boi-logo.png"
        },
        {
          name: "Casa Florindo",
          type: ["restaurante"],
          phone:"(19) 3462-1940",
          card: ["vegas day", "vegas plus"],
          address: "Av. Campos Salles, 181 - Centro, Americana - SP, 13465-400",
          position: { lat: -22.738252, lng: -47.325693 },
          logo:"./imgs/logos/florindo-logo.png"
        },
        {
          name: "Deck Meia 13",
          type: ["restaurante"],
          phone:"(19) 3462-1940",
          card: ["vegas day", "vegas plus"],
          address: "R. Fortunato Faraone, 242 - Vila Rehder, Americana - SP, 13465-450",
          position: { lat: -22.737541, lng: -47.326669 },
          logo:"./imgs/logos/florindo-logo.png"
        },
        {
          name: "Danny Cosméticos",
          type: ["cosméticos"],
          phone:"(19) 3462-1940",
          card: ["vegas day", "vegas plus"],
          address: "Av. Dr. Antônio Lobo, 455 - Centro, Americana - SP, 13465-005",
          position: { lat: -22.739728, lng: -47.328574 },
          logo:"./imgs/logos/danny-logo.png"
        },
        {
          name: "Vidrovan",
          type: ["veículos"],
          phone:"(19) 3462-1940",
          card: ["vegas day", "vegas plus"],
          address: "Av. Paulista, 1015 - Vila Santa Catarina, Americana - SP, 13465-490",
          position: { lat: -22.724245, lng: -47.323191 },
         
        },
        {
          name: "Maryara Panificadora & Doçaria",
          type: ["restaurante"],
          phone:"(19) 3462-1940",
          card: ["vegas day", "vegas plus", "vegas alimentação", "vegas refeição"],
          address: "Av. Afonso Arinos, 249 - Jardim da Paz, Americana - SP, 13474-000",
          position: { lat: -22.703432, lng: -47.293846 }
        },
        {
          name: "Rede Ferrara",
          type: ["posto de combustível"],
          phone:"(19) 3462-1940",
          card: ["vegas day", "vegas plus", "vegas combustível"],
          address: "Av. Nossa Sra. de Fátima, 373 - Parque Universitário, Americana - SP, 13468-280",
          position: { lat: -22.716347, lng: -47.289679 }
        },
        {
          name: "Casa de Carne Boi Forte",
          type: ["açougue"],
          phone:"(19) 3462-1940",
          card: ["vegas day", "vegas plus", "vegas alimentação"],
          address: "R. São Vito, 65 - Jardim São Vito, Americana - SP, 13473-230",
          position: { lat: -22.736031, lng: -47.312421 }
        },
        {
          name: "Shopping das Utilidades",
          type: ["presentes", "utensílios domésticos", "variedades", "brinquedos"],
          card: ["vegas day", "vegas plus", "vegas alimentação"],
          phone:"(19) 3462-1940",
          address: "Av. Dr. Antônio Lobo, 275 - Centro, Americana - SP, 13465-005",
          position: { lat: -22.739852, lng: -47.328970 }
        }
      ]
    }
  }
};


window.addEventListener("DOMContentLoaded", () => {
const menuMobile = document.querySelector(".menu-hamb")
const mainMenus = document.querySelector(".main-menus")
const closeMenu = document.querySelector(".close-menu")
  const menuOverlay = document.querySelector(".menu-overlay");

closeMenu.addEventListener('click', () => {
   mainMenus.classList.remove("active")
   menuMobile.style.display = 'block'
   closeMenu.style.display = 'none'
     menuOverlay.classList.remove("active");

})

menuMobile.addEventListener("click", () => {
   mainMenus.classList.add("active")
   menuOverlay.classList.add("active");
   menuMobile.style.display = 'none'
   closeMenu.style.display = 'block'
})

  menuOverlay.addEventListener("click", () => {
   mainMenus.classList.remove("active")
   menuMobile.style.display = 'block'
   closeMenu.style.display = 'none'
   menuOverlay.classList.remove("active");

})


const modalOverlay = document.querySelector(".modal-overlay");
  const closeBtn = document.querySelector(".close-btn");

closeBtn.addEventListener("click", () => {
    modalOverlay.style.display = "none";
  });


  const hash = decodeURIComponent(window.location.hash.substring(1));
  const [cidade, estado, ...nomePartes] = hash.split("-");
  const nomeDoPonto = nomePartes.join(" ");

  titleComercio.forEach((i) => {
    i.textContent =  `${nomeDoPonto}`;
  })

  adress.textContent = `${cidade} | ${estado}`;

  const cidadeData = cityData[estado]?.[cidade];

  if (cidadeData) {
    const pontoEncontrado = cidadeData.points.find(ponto => ponto.name.toLowerCase() === nomeDoPonto.toLowerCase());

    if (pontoEncontrado) {
      const comercioInfo = {
        address: pontoEncontrado.address,
        phone: pontoEncontrado.phone,
        cards: pontoEncontrado.card,
        img: pontoEncontrado.image || null,
        logo: pontoEncontrado.logo || null,
        type: pontoEncontrado.type || []
      };

      // Exibir dados no HTML
      adress.textContent = comercioInfo.address;

      const phoneElement = document.querySelector(".phone");
      if (phoneElement) phoneElement.textContent = comercioInfo.phone;

      const cardsElement = document.querySelector(".cards");
      if (cardsElement) cardsElement.textContent = comercioInfo.cards.join(", ");

      const imageElement = document.querySelectorAll(".img-comercio");
    
      if (imageElement && comercioInfo.img) {
        imageElement.forEach((i) => {
          i.src = comercioInfo.img
        })
      }

      const logoElement = document.querySelectorAll(".img-logo img");
      if (logoElement && comercioInfo.logo) {
        logoElement.forEach((i) => {
          i.src = comercioInfo.logo
        })
        
        console.log("achei o logo")
      } else {
        console.log("nao exite logo")
      }

      const tagElement = document.querySelector(".tag-comercio");
     if (tagElement && comercioInfo.type.length > 0) {
  const tipo = comercioInfo.type[0];
  tagElement.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
}
    }
  }
});


const modalInfo = {
  "mercadao-dos-oculos": {
    logo: "./imgs/logos/oculosmercadao.png",
    titulo: "20% de desconto no Mercadão dos Óculos!",
    validade: "Válido até 31/12/2025.",
    descricao: `Cliente Vegas tem 20% de desconto em armações selecionadas + exame de vista gratuito.`,
  },
  "intensos-barbearia": {
    logo: "./imgs/logos/intensos-barbearia.png",
    titulo: "Benefício na Intensos Barbearia!",
    validade: "Válido até 31/12/2025.",
    descricao: `Cliente Vegas tem 1 hidratação de cabelo no 1º corte + se fechar clube: corte gratuito.`,
  },
  "zanini": {
    logo: "./imgs/logos/zanini-logo.png",
    titulo: "10% de desconto na Zanini!",
    validade: "Válido até 31/12/2025.",
    descricao: `Cliente Vegas tem 10% de desconto em qualquer produto da loja.`,
  },
  "caochorro-petshop": {
    logo: "./imgs/logos/caochorro-logo.png",
    titulo: "10% de desconto no Cãochorro Petshop!",
    validade: "Válido até 31/12/2025.",
    descricao: `Cliente Vegas tem 10% de desconto em qualquer produto da loja.`,
  },
  "betta-suplementos": {
    logo: "./imgs/logos/beta-logo.png",
    titulo: "R$50 de cashback na Betta Suplementos!",
    validade: "Válido até 31/12/2025.",
    descricao: `Cliente Vegas tem R$50 de cashback para clientes cadastrados na landing page exclusiva.`,
  },
  "boi-que-mia": {
    logo: "./imgs/logos/boi-logo.png",
    titulo: "Brinde no Boi Que Mia - Grill Bar!",
    validade: "Válido até 31/12/2025.",
    descricao: `Cliente Vegas ganha 1 pão de alho ou queijo coalho por conta da casa.`,
  },
  "casa-florindo": {
    logo: "./imgs/logos/florindo-logo.png",
    titulo: "Desconto especial na Casa Florindo!",
    validade: "Válido até 31/12/2025.",
    descricao: `Cliente Vegas tem desconto especial.`,
  },
  "danny-cosmeticos": {
    logo: "./imgs/logos/danny-logo.png",
    titulo: "Desconto especial na Danny Cosméticos!",
    validade: "Válido até 31/12/2025.",
    descricao: `Cliente Vegas tem desconto especial.`,
  }
};


function formatarSlug(str) {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function openModalByName(nome) {
  const nomeSlug = formatarSlug(nome);
  const info = modalInfo[nomeSlug];
  console.log('clicou')

  if (!info) {
    console.warn("Informação não encontrada para:", nome);
    return;
  }

  document.querySelector(".modal-logo").src = info.logo;
  document.querySelector(".modal-logo").alt = nome;
  document.querySelector(".modal-title").textContent = info.titulo;
  document.querySelector(".modal-validade").innerHTML = info.validade;
  document.querySelector(".modal-descricao").innerHTML = info.descricao;

  document.querySelector(".modal-overlay").style.display = "flex";
}




document.addEventListener("DOMContentLoaded", () => {
  const hash = decodeURIComponent(window.location.hash).slice(1); // remove o "#"
  const partes = hash.split("-");
  const nomeEmpresa = partes.slice(2).join("-").toLowerCase(); // pega o nome após cidade-estado
   console.log(nomeEmpresa)
  const cards = document.querySelectorAll(".card-desconto");

  if (nomeEmpresa) {
    let encontrou = false;
    cards.forEach(card => {
      const verMais = card.querySelector("button")
      const titulo = card.querySelector("h2").textContent.trim().toLowerCase();
      card.style.height = 'auto'

      verMais.addEventListener("click", () => openModalByName(nomeEmpresa))



      console.log(titulo)
      if (titulo.includes(nomeEmpresa) || titulo == nomeEmpresa) {
        card.style.display = "block";
        encontrou = true;
      } else {
        card.style.display = "none";
      }
    });

    if (!encontrou) {
      console.warn("Nenhum card correspondente foi encontrado para:", nomeEmpresa);
    }
  }


  
});


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


document.querySelectorAll('.avaliacao').forEach(avaliacaoDiv => {
  const countSpan = avaliacaoDiv.querySelector('.count-avaliacao');
  const starsDiv = avaliacaoDiv.querySelector('.stars');
  
  const rating = Math.floor(parseFloat(countSpan.textContent)); // só a parte inteira
  const maxStars = 5;
  
  starsDiv.innerHTML = ''; // limpa
  
  for (let i = 1; i <= rating; i++) {
    const img = document.createElement('img');
    img.src = './imgs/icons/star.svg'; // estrela cheia
    img.classList.add('star');
    img.alt = `Star ${i}`;
    starsDiv.appendChild(img);
  }
});




