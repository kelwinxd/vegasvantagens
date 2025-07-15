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
