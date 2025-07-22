const slide1 = document.getElementById('slide1');
const slide2 = document.getElementById('slide2');
const slide3 = document.getElementById('slide3');
const slidesContainer = document.querySelector('.slides');
const bullets = document.querySelectorAll('.bullet'); // Supondo que os bullets tenham a classe '.bullet'

let currentSlide = 1;
let autoPlayInterval;

document.addEventListener("DOMContentLoaded", () => {
  atualizarSrcDasImagens(); // Executa ao carregar
});

function getBannerSize() {
  const width = window.innerWidth;

  if (width >= 1440) {
    console.log("1520X450");
    return '1520X450';
  }
  if (width >= 1024) {
    console.log("1232X365");
    return '1232X365';
  }
  if (width >= 768) {
    console.log("768X360");
    return '768X360';
  }
  if (width >= 480) {
    console.log("402X520");
    return '402X520';
  }

  return '402X520'; // fallback
}


function formatFileName(str) {
  return str
    .replace(/ /g, '_')                         // espaços para _
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ''); // remove acentos
}

function atualizarSrcDasImagens() {
  const slides = document.querySelectorAll('.slides img');
  const tamanho = getBannerSize();

  slides.forEach(img => {
    const base = formatFileName(img.getAttribute('data-base')); // ainda precisa formatar o nome do arquivo
    const folder = img.getAttribute('data-folder'); // usa o nome exato da pasta
    img.src = `./imgs/banners/${folder}/${base}_${tamanho}.jpg`;
  });
}



// Atualiza a posição do slide com base no slide ativo
function updateSlidePosition() {
    if (slide1.checked) {
        slidesContainer.style.transform = 'translateX(0%)';
    } else if (slide2.checked) {
        slidesContainer.style.transform = 'translateX(-33.3%)';
    } else if (slide3.checked) {
        slidesContainer.style.transform = 'translateX(-66.6%)';
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



/* 


const slidesContainer = document.querySelector('.slides');
const bulletsContainer = document.querySelector('.bullets'); // container que você precisa criar no HTML
let currentSlide = 0;
let autoPlayInterval;

document.addEventListener("DOMContentLoaded", async () => {
  const banners = getMockedBanners(); // Depois substitui por chamada real
  renderSlides(banners);
  startAutoplay();
});

// Mock temporário até vir da API
function getMockedBanners() {
  return [
    { nome: "ZANINI" },
    { nome: "BETTASUPLEMENTOS" },
    { nome: "CAOCHORRO" }
  ];
}

function getBannerSize() {
  const width = window.innerWidth;
  if (width >= 1820) return '1520X450';
  if (width >= 1440) return '1232X365';
  if (width >= 768) return '768X360';
  if (width >= 480) return '402X520';
  return '402X520';
}

function formatFileName(str) {
  return str
    .replace(/ /g, '_')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '');
}

function renderSlides(banners) {
  const tamanho = getBannerSize();
  slidesContainer.innerHTML = '';
  bulletsContainer.innerHTML = '';

  banners.forEach((banner, index) => {
    const nome = formatFileName(banner.nome);

    // Slide image
    const img = document.createElement('img');
    img.src = `./imgs/banners/${nome}/${nome}_${tamanho}.jpg`;
    img.className = `slide slide${index + 1}`;
    img.setAttribute('data-base', nome);
    img.setAttribute('data-folder', nome);
    slidesContainer.appendChild(img);

    // Bullet
    const bullet = document.createElement('span');
    bullet.classList.add('bullet');
    bullet.dataset.index = index;
    bullet.addEventListener('click', () => {
      currentSlide = index;
      updateSlidePosition();
      updateBulletClasses();
    });
    bulletsContainer.appendChild(bullet);
  });

  updateSlidePosition();
  updateBulletClasses();
}

function updateSlidePosition() {
  const percent = -(100 * currentSlide);
  slidesContainer.style.transform = `translateX(${percent}%)`;
}

function updateBulletClasses() {
  const bullets = document.querySelectorAll('.bullet');
  bullets.forEach((bullet, index) => {
    bullet.classList.toggle('bullet-ativo', index === currentSlide);
  });
}

function startAutoplay() {
  const totalSlides = document.querySelectorAll('.slides img').length;

  autoPlayInterval = setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlidePosition();
    updateBulletClasses();
  }, 4000);
}

function stopAutoplay() {
  clearInterval(autoPlayInterval);
}

*/