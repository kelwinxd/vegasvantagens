import { getClientToken, loginToken } from '../auth.js';

const globalLoader = document.createElement("div");
globalLoader.className = "loader";
globalLoader.style.display = "none";
document.body.appendChild(globalLoader);

function showGlobalLoader() {
  globalLoader.style.display = "block";
}
function hideGlobalLoader() {
  globalLoader.style.display = "none";
}

function createInlineLoader(targetEl) {
  const loader = document.createElement("div");
  loader.className = "loader loader-inline";
  loader.style.position = "absolute";
  loader.style.top = "50%";
  loader.style.left = "50%";
  loader.style.transform = "translate(-50%, -50%)";
  loader.style.zIndex = "10";
  targetEl.style.position = "relative";
  targetEl.appendChild(loader);
  return loader;
}



async function getEstabelecimentosDetalhados() {
  try {
    const token = await getClientToken();
    const res = await fetch("https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Erro ao buscar estabelecimentos");
    const lista = await res.json();

    const detalhes = await Promise.all(
      lista.map(async (est) => {
        const detalheResp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${est.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!detalheResp.ok) return null;

        const dados = await detalheResp.json();
        return {
          id: dados.id,
          nome: dados.nome,
          cidade: dados.cidade,
          imagemLogo: dados.imagemPrincipal || './imgs/default-image.png'
        };
      })
    );

    return detalhes.filter(e => e !== null);
  } catch (err) {
    console.error("Erro ao carregar carrossel:", err);
    return [];
  }
}

async function montarCarrossel() {
  const track = document.getElementById('track');
  const carrossel = document.getElementById('carrossel');

  const estabelecimentos = await getEstabelecimentosDetalhados();

  if (!track || estabelecimentos.length === 0) return;

  track.innerHTML = "";

  estabelecimentos.forEach(est => {
    const link = document.createElement('a');
    const id = est.id;
    const nomeEncoded = encodeURIComponent(est.nome);
    const cidadeEncoded = encodeURIComponent(est.cidade);
    link.href = `detalhes.html#store-${id}`;

    const img = document.createElement('img');
    img.src = est.imagemLogo;
    img.alt = `Logo ${est.nome}`;
    link.appendChild(img);

    track.appendChild(link);
  });

  if (estabelecimentos.length > 3) {
  // DUPLICAR os itens
  track.innerHTML += track.innerHTML;
  track.classList.add('animate-scroll'); // <=== ativa animação

  let posX = 0;
  let animationId;
  const speed = 0.5;

  function animate() {
    posX -= speed;
    if (Math.abs(posX) >= track.scrollWidth / 2) {
      posX = 0;
    }
    track.style.transform = `translateX(${posX}px)`;
    animationId = requestAnimationFrame(animate);
  }

  animate();

  carrossel.addEventListener('mouseenter', () => cancelAnimationFrame(animationId));
  carrossel.addEventListener('mouseleave', () => animate());
}else {
  track.style.transform = 'translateX(0)';
  track.classList.remove('animate-scroll');
  track.style.animation = 'none'; // remove animação se tiver
  track.style.justifyContent = 'flex-start'; // <=== ALINHAR À ESQUERDA
}

}


document.addEventListener("DOMContentLoaded", montarCarrossel);