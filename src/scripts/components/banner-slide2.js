const slide11 = document.getElementById('slide11');
const slide22 = document.getElementById('slide22');
const slide33 = document.getElementById('slide33');
const slidesContainer1 = document.querySelector('.slides1');
const bullets1 = document.querySelectorAll('.bullet1');

let currentSlide1 = 1;
let autoPlayInterval1;

// Executa ao carregar
document.addEventListener("DOMContentLoaded", () => {
  atualizarSrcDasImagens1();
});

// Obtém tamanho do banner conforme o viewport
function getBannerSize1() {
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

  return '402X520';
}

// Formata o nome do arquivo, remove acento e espaços
function formatFileName1(str) {
  return str
    .replace(/ /g, '_')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '');
}

// Atualiza src das imagens com base no tamanho da tela
function atualizarSrcDasImagens1() {
  const slides = document.querySelectorAll('.slides1 img');
  const tamanho = getBannerSize1();

  slides.forEach(img => {
    const base = formatFileName1(img.getAttribute('data-base'));
    const folder = img.getAttribute('data-folder');
    img.src = `./imgs/banners/${folder}/${base}_${tamanho}.jpg`;
  });
}

// Atualiza a posição do slide com base no slide ativo
function updateSlidePosition1() {
  if (slide11.checked) {
    slidesContainer1.style.transform = 'translateX(0%)';
  } else if (slide22.checked) {
    slidesContainer1.style.transform = 'translateX(-33.3%)';
  } else if (slide33.checked) {
    slidesContainer1.style.transform = 'translateX(-66.6%)';
  }
}

// Atualiza os bullets
function updateBulletClasses1() {
  bullets1.forEach((bullet, index) => {
    if (index + 1 === currentSlide1) {
      bullet.classList.add('bullet-ativo');
    } else {
      bullet.classList.remove('bullet-ativo');
    }
  });
}

// Autoplay dos slides
function startAutoplay1() {
  autoPlayInterval1 = setInterval(() => {
    currentSlide1 = currentSlide1 % 3 + 1;
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
