const slide11 = document.getElementById('slide11');
const slide22 = document.getElementById('slide22');
const slide33 = document.getElementById('slide33');
const slide44 = document.getElementById('slide44');
const slide55 = document.getElementById('slide55');
const slidesContainer1 = document.querySelector('.slides1');
const bullets1 = document.querySelectorAll('.bullet1');

let currentSlide1 = 1;
let autoPlayInterval1;

// Executa ao carregar
document.addEventListener("DOMContentLoaded", () => {
  atualizarSrcDasImagens1();
});

// Tamanhos do banner
function getBannerSize1() {
  const width = window.innerWidth;
  if (width >= 1440) return '1520X450';
  if (width >= 1024) return '1232X365';
  if (width >= 768) return '768X360';
  if (width >= 480) return '402X520';
  return '402X520';
}

// Remove acentos
function formatFileName1(str) {
  return str.replace(/ /g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, '');
}

// Atualiza imagens responsivas
function atualizarSrcDasImagens1() {
  const slides = document.querySelectorAll('.slides1 img');
  const tamanho = getBannerSize1();

  slides.forEach(img => {
    const base = formatFileName1(img.getAttribute('data-base'));
    const folder = img.getAttribute('data-folder');
    img.src = `./imgs/banners/${folder}/${base}_${tamanho}.jpg`;
  });
}

// Atualiza a posição dos slides
function updateSlidePosition1() {
  const index = currentSlide1 - 1;
  slidesContainer1.style.transform = `translateX(-${index * 20}%)`; // 5 slides = 20%
}

// Atualiza bullets
function updateBulletClasses1() {
  bullets1.forEach((bullet, index) => {
    bullet.classList.toggle('bullet-ativo', index + 1 === currentSlide1);
  });
}

// Autoplay com 5 slides
function startAutoplay1() {
  autoPlayInterval1 = setInterval(() => {
    currentSlide1 = currentSlide1 % 5 + 1;
    document.getElementById(`slide${currentSlide1}${currentSlide1}`).checked = true;
    updateSlidePosition1();
    updateBulletClasses1();
  }, 5000);
}

function stopAutoplay1() {
  clearInterval(autoPlayInterval1);
}

// Eventos manuais
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
slide44.addEventListener('change', () => {
  currentSlide1 = 4;
  updateSlidePosition1();
  updateBulletClasses1();
});
slide55.addEventListener('change', () => {
  currentSlide1 = 5;
  updateSlidePosition1();
  updateBulletClasses1();
});

// Botões
const btnLeft1 = document.querySelector('.btn-left1');
const btnRight1 = document.querySelector('.btn-right1');

btnLeft1.addEventListener('click', () => {
  currentSlide1 = currentSlide1 === 1 ? 5 : currentSlide1 - 1;
  document.getElementById(`slide${currentSlide1}${currentSlide1}`).checked = true;
  updateSlidePosition1();
  updateBulletClasses1();
});

btnRight1.addEventListener('click', () => {
  currentSlide1 = currentSlide1 === 5 ? 1 : currentSlide1 + 1;
  document.getElementById(`slide${currentSlide1}${currentSlide1}`).checked = true;
  updateSlidePosition1();
  updateBulletClasses1();
});

// Inicializa
updateSlidePosition1();
updateBulletClasses1();
startAutoplay1();
