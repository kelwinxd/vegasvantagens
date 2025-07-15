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
