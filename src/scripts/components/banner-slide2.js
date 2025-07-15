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

