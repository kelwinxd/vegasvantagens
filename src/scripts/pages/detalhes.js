import { getClientToken, API_BASE, loginToken } from '../auth.js';


// Loader setup global
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



async function fetchStoreDetails(token, storeId) {
  const resp = await fetch(`${API_BASE}/api/Estabelecimentos/${storeId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!resp.ok) throw new Error("Falha ao buscar estabelecimento");
  return await resp.json();
}

// ---- descrições por NOME (somente) ----
const DESCRICOES_POR_NOME = [
  {
    match: ["zanini"],
    text: "A Zanini Utilidades traz praticidade e estilo para o seu lar. Com uma linha completa de produtos domésticos, a marca se destaca pela qualidade, variedade e soluções que tornam o dia a dia mais fácil e funcional."
  },
  {
    match: ["betta suplementos", "betta"],
    text: "A Betta Suplementos é referência em saúde e performance, oferecendo produtos de alta qualidade para quem busca melhor rendimento nos treinos e bem-estar no dia a dia. Comprometida com resultados reais, a marca combina excelência e confiança para ajudar você a alcançar o seu melhor."
  },
  {
    match: ["cãochorro", "caochorro", "cão chorro", "cao chorro"],
    text: "O CãoChorro é um petshop que oferece tudo o que seu melhor amigo precisa para viver feliz e saudável. Com atendimento cuidadoso, produtos de qualidade e muito carinho pelos animais, a marca é sinônimo de confiança e amor pelos pets."
  },
  {
    match: ["boi que mia"],
    text: "O Boi que Mia é uma casa de lanches que conquistou seu público com sabores únicos e ingredientes selecionados. Cada lanche é preparado com cuidado e paixão, garantindo uma experiência deliciosa e autêntica."
  },
];

function normalize(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

function pickDescricaoPorNome(nome = "") {
  const n = normalize(nome);
  for (const rule of DESCRICOES_POR_NOME) {
    if (rule.match.some(k => n.includes(normalize(k)))) {
      return rule.text;
    }
  }
  return "";
}


document.addEventListener("DOMContentLoaded", async () => {
  const hash = decodeURIComponent(window.location.hash).slice(1);
  const idMatch = hash.match(/^store-(\d+)$/);

  if (!idMatch) {
    console.warn("Formato de hash inválido:", hash);
    return;
  }

  const storeId = idMatch[1];
  showGlobalLoader();

  const imgContainers = document.querySelectorAll(".main-img, .main-img-tablet");
  const logoContainers = document.querySelectorAll(".img-logo img");
  const loadersImg = [];
  const loadersLogo = [];

  imgContainers.forEach(container => {
    const img = container.querySelector("img.img-comercio");
    if (img) {
      img.style.display = "none";
      const loader = createInlineLoader(container);
      loadersImg.push({ img, loader });
    }
  });

  logoContainers.forEach(img => {
    if (img) {
      img.style.display = "none";
      const loader = createInlineLoader(img.parentElement);
      loadersLogo.push({ img, loader });
    }
  });

  try {
    const token = await getClientToken();
    const loja = await fetchStoreDetails(token, storeId);

    if (!loja) {
      console.warn("Loja não encontrada.");
      return;
    }

    console.log(loja)

    mostrarCuponsDoEstabelecimento(loja);

    document.querySelectorAll('.title-comercio').forEach(el => {
      el.textContent = loja.nome;
    });

    const linkCruMapa = `https://www.google.com/maps/search/?api=1&query=${loja.latitude},${loja.longitude}`
    const linkMapa = loja.mapaUrl ? loja.mapaUrl : linkCruMapa;

    document.querySelectorAll(".coupon-modal .cm-cta").forEach(btn => {
  btn.href = linkMapa;
    });

    const addressEl = document.querySelector(".adress");
    if (addressEl) addressEl.textContent = `${loja.rua}, ${loja.numero}, ${loja.bairro} - ${loja.cidade}`;

    const phoneEl = document.querySelector(".phone");
    if (phoneEl) phoneEl.textContent = loja.telefone;

    const cardsEl = document.querySelector(".cards");
    if (cardsEl) cardsEl.textContent = (loja.cartoes || []).join(", ");

    // descrição específica por NOME
const avaliacaoEl = document.querySelector(".avaliacao");
if (avaliacaoEl) {
  const desc = pickDescricaoPorNome(loja.nome);
  if (desc) {
    avaliacaoEl.textContent = desc;   // seguro (sem HTML)
    avaliacaoEl.style.display = "flex";  
    console.log(desc) // garante que apareça
  } else {
    avaliacaoEl.style.display = "none";
    console.log("nao conseguiu aparecer a desc") // oculta se não houver match
  }
}
  console.log(loja.imagens)
  const FachadaImg = loja.imagens?.find(img => img.fachada);
  
  if (loja.imagens?.length > 0) {
      loadersImg.forEach(({ img, loader }) => {
        img.onload = () => {
          img.style.display = "block";
          loader.remove();
        };
        img.onerror = () => {
          img.src = './imgs/default-image.png';
          img.style.display = "block";
          loader.remove();
        };
        // 👇 se for a loja de ID 3, usa a imagem fixa do front
      
     img.src = FachadaImg?.url;
    
      });

      console.log(FachadaImg, "Imagem Fachada")
    }
    const logoImg = loja.imagens?.find(img => img.logo);
    if (loja.imagens?.length > 0) {
      loadersLogo.forEach(({ img, loader }) => {
        img.onload = () => {
          img.style.display = "block";
          loader.remove();
        };
        img.onerror = () => {
          img.src = './imgs/default-image.png';
          img.style.display = "block";
          loader.remove();
        };
        img.src = logoImg?.url;
      });

      console.log(logoImg, "Imagem Logo")
    }

    const tagEl = document.querySelector(".tag-comercio");
    if (tagEl && loja.categorias?.length > 0) {
      const categoria = loja.categorias[0];
      tagEl.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    }

  } catch (err) {
    console.error("Erro ao buscar detalhes da loja:", err.message);
  } finally {
    hideGlobalLoader();
  }
});

function mostrarCuponsDoEstabelecimento(estabelecimento) {
  const nomeEstabelecimento = normalizarTexto(estabelecimento?.nome || '');
  const todosCupons = document.querySelectorAll('article.coupon-card');

  let encontrouAlgum = false;

  todosCupons.forEach(cupom => {
    const nomeCupom = normalizarTexto(cupom.dataset.cupom || '');
    const corresponde = nomeCupom && nomeEstabelecimento.includes(nomeCupom);

    cupom.style.display = corresponde ? 'flex' : 'none';
    if (corresponde) encontrouAlgum = true;

    console.log('cupom:', nomeCupom, '| corresponde:', corresponde, '| loja:', nomeEstabelecimento);
  });

  // container da seção de cupons (já existente)
  const containerCupons = document.querySelector('.coupons-section');



  // cria/pega a mensagem de "sem cupons"
  let msg = document.getElementById('no-coupons-msg');
  if (!msg) {
    msg = document.createElement('p');
    msg.id = 'no-coupons-msg';
    msg.className = 'no-coupons-msg';
    msg.textContent = 'No momento não há cupons disponíveis para este estabelecimento.';
    msg.setAttribute('aria-live', 'polite');

    // onde anexar: abaixo do grid, dentro da seção
    // tenta colocar após a grade se existir
    const grid = containerCupons?.querySelector('.coupon-grid');
    if (grid && grid.parentElement) {
      grid.parentElement.insertBefore(msg, grid.nextSibling);
    } else if (containerCupons) {
      containerCupons.appendChild(msg);
    } else {
      // fallback: coloca no body (não recomendado, mas evita sumir)
      document.body.appendChild(msg);
    }
  }
 

  // liga/desliga seção + mensagem
  if (containerCupons) {
    containerCupons.style.display = encontrouAlgum ? 'block' : 'block'; // mantém a seção para mostrar a msg
  }
  msg.style.display = encontrouAlgum ? 'none' : 'block';

  return encontrouAlgum; // útil se quiser saber no chamador
}


/*

function mostrarCuponsDoEstabelecimento(estabelecimento) {
  const nomeEstabelecimento = normalizarTexto(estabelecimento?.nome || '');

  const todosCupons = document.querySelectorAll('article.coupon-card');

  let encontrouAlgum = false; // <-- FALTAVA ISTO

  todosCupons.forEach(cupom => {
    const nomeCupom = normalizarTexto(cupom.dataset.cupom || '');
    const corresponde = nomeCupom && nomeEstabelecimento.includes(nomeCupom);

    cupom.style.display = corresponde ? 'flex' : 'none';
    if (corresponde) encontrouAlgum = true;

    console.log('cupom:', nomeCupom, '| corresponde:', corresponde, '| loja:', nomeEstabelecimento);
  });

  // (opcional) esconder/mostrar o bloco de cupons
  const containerCupons = document.querySelector('.coupons-section');
  if (containerCupons) {
    containerCupons.style.display = encontrouAlgum ? 'block' : 'none';
  }
}
*/

// Função utilitária
function normalizarTexto(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}



/*
async function fetchCuponsPorEstabelecimento(token, estabelecimentoId) {
  const resp = await fetch(`https://apiclubedevantagens.vegascard.com.br/api/Cupons/por-estabelecimento/${estabelecimentoId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!resp.ok) throw new Error("Falha ao buscar cupons");
  return await resp.json();
}

if (window.location.pathname.includes("detalhes.html")) {
  document.addEventListener("DOMContentLoaded", async () => {
    const hash = decodeURIComponent(window.location.hash).slice(1);
    const idMatch = hash.match(/^store-(\d+)$/);
    if (!idMatch) return;
    const storeId = idMatch[1];

    const container = document.querySelector(".coupon-grid");
    if (!container) return;

    const loaderCupons = document.createElement("div");
    loaderCupons.className = "loader";
    loaderCupons.style.display = "none";
    container.parentElement.insertBefore(loaderCupons, container);

    loaderCupons.style.display = "block";

    try {
      const token = await getClientToken();
      const cupons = await fetchCuponsPorEstabelecimento(token, storeId);

      const semCupom = document.querySelector(".sem-cupom")
      container.innerHTML = "";

      if(cupons.length === 0) {
           semCupom.style.display = 'flex'
      } else {
 cupons.forEach(cupom => {
        const card = document.createElement("div");
        card.className = "coupon-card";
        card.innerHTML = `
  <div class="coupon-image">
    <img src="${cupom.imagens?.[0] || './imgs/img-desc.png'}" alt="Imagem do Cupom">
  </div>
  <div class="coupon-content">
    <div class="coupon-tag">${cupom.tipo === "Percentual" ? `${cupom.valorDesconto}% OFF` : 'Desconto'}</div>
    <h2 class="coupon-title">${cupom.titulo}</h2>
    <p class="coupon-description">${cupom.descricao}</p>
    <button class="coupon-button">Ver Mais</button>
  </div>
`;

        card.querySelector("button").addEventListener("click", () => {
          console.log('clicou!');
          
          const modal = document.querySelector(".modal");
          const overlay = document.querySelector(".modal-overlay");
          if (!modal || !overlay) return;

          modal.querySelector(".modal-title").textContent = cupom.titulo;
          modal.querySelector(".modal-validade").textContent = `Válido até ${new Date(cupom.dataExpiracao).toLocaleDateString()}`;
          modal.querySelector(".modal-descricao").textContent = cupom.descricao;
          modal.querySelector(".modal-logo").src = cupom.imagens?.[0] || "";

          modal.style.display = "flex";
          modal.style.flexDirection = 'column'
          modal.style.alignItems = 'center'
          overlay.style.display = "flex";
        });

        container.appendChild(card);
      });

      const closeBtn = document.querySelector(".modal .close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          document.querySelector(".modal").style.display = "none";
          document.querySelector('.modal-overlay').style.display = 'none'
        });
      }
      }

     

    } catch (e) {
      console.error("Erro ao carregar cupons:", e.message);
    } finally {
      loaderCupons.style.display = "none";
    }
  });
}
 */


// Abre um único modal global ao clicar em qualquer .coupon-cta
// pega todos os botões e liga cada um ao seu modal correspondente
// Overlay ultra-robusto (inline styles, ignorando CSS externo)
function ensureOverlay() {
  let ov = document.getElementById('__coupon_overlay__');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = '__coupon_overlay__';
    // estilos inline para não sofrer override
    Object.assign(ov.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(17,20,40,.55)',
      backdropFilter: 'blur(2px)',
      zIndex: '9998',        // bem acima de qualquer coisa
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity .15s ease',
    });
    ov.addEventListener('click', () => {
      // fecha qualquer modal aberto ao clicar no overlay
      document.querySelectorAll('.coupon-modal').forEach(m => m.style.display = 'none');
      hideOverlay();
      document.body.style.overflow = '';
    });
    document.body.appendChild(ov);
  }
  return ov;
}

function showOverlay() {
  const ov = ensureOverlay();
  ov.style.opacity = '1';
  ov.style.pointerEvents = 'auto';
}

function hideOverlay() {
  const ov = ensureOverlay();
  ov.style.opacity = '0';
  ov.style.pointerEvents = 'none';
}

// ===== Integra com seus botões/modais =====
document.querySelectorAll('.coupon-card .coupon-cta').forEach(btn => {
  const key = btn.dataset.target;
  const modal = document.querySelector(`.coupon-modal[data-modal="${key}"]`);
  if (!key || !modal) return;

  btn.addEventListener('click', () => {
    modal.style.display = 'block'; // seu modo simples
    showOverlay();                 // <- liga o overlay
    document.body.style.overflow = 'hidden';
    // z-index do modal maior que o overlay
    modal.style.zIndex = '2147483647';
  });

  const closeBtn = modal.querySelector('.cm-close');
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      hideOverlay();               // <- desliga o overlay
      document.body.style.overflow = '';
    });
    closeBtn.dataset.bound = '1';
  }

  // fechar clicando “fora” (no próprio dialog, se usar <dialog>)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      hideOverlay();
      document.body.style.overflow = '';
    }
  });
});


 

(() => {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const initRail = (rail) => {
    if (!rail || rail.dataset.csReady === "1") return;
    rail.dataset.csReady = "1";

    const track = rail.querySelector('.coupon-grid');
    const bar   = rail.querySelector('.cs-progress');
    const thumb = bar ? bar.querySelector('.cs-thumb') : null;
    if (!track) return;

    const updateBar = () => {
      if (!bar || !thumb) return;

      const maxScroll = track.scrollWidth - track.clientWidth;
      const ratio     = track.clientWidth / Math.max(track.scrollWidth, 1);
      const thumbPct  = Math.max(ratio * 100, 8); // largura mínima 8%
      const leftPct   = maxScroll > 0
        ? (track.scrollLeft / maxScroll) * (100 - thumbPct)
        : 0;

      thumb.style.width = thumbPct + '%';
      thumb.style.left  = leftPct + '%';
      bar.setAttribute('aria-valuenow',
        String(Math.round((track.scrollLeft / (maxScroll || 1)) * 100))
      );

      // esconde barra quando não há overflow
      bar.hidden = track.scrollWidth <= track.clientWidth + 1;
    };

    // sincroniza barra enquanto rola
    track.addEventListener('scroll', updateBar, { passive: true });

    // wheel vertical -> horizontal (só se houver overflow)
    track.addEventListener('wheel', (e) => {
      if (track.scrollWidth <= track.clientWidth) return; // deixa a página rolar
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        track.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });

    // teclado ← →
    track.tabIndex = 0;
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        track.scrollBy({ left: track.clientWidth * 0.6, behavior: 'smooth' });
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        track.scrollBy({ left: -track.clientWidth * 0.6, behavior: 'smooth' });
      }
    });

    // clique/arraste na barra para navegar
    if (bar && thumb) {
      let dragging = false, pointerId = null;

      const moveToClientX = (clientX) => {
        const rect = bar.getBoundingClientRect();
        const x = clamp(clientX - rect.left, 0, rect.width);
        const p = rect.width ? (x / rect.width) : 0;
        const maxScroll = track.scrollWidth - track.clientWidth;
        track.scrollLeft = maxScroll * p;
      };

      bar.addEventListener('pointerdown', (e) => {
        dragging = true; pointerId = e.pointerId; bar.classList.add('dragging');
        bar.setPointerCapture(pointerId);
        moveToClientX(e.clientX);
      });
      bar.addEventListener('pointermove', (e) => {
        if (dragging) moveToClientX(e.clientX);
      });
      const stop = () => {
        if (!dragging) return;
        dragging = false; bar.classList.remove('dragging');
        try { bar.releasePointerCapture(pointerId); } catch {}
        pointerId = null;
      };
      bar.addEventListener('pointerup', stop);
      bar.addEventListener('pointercancel', stop);
    }

    // recalcular em mudanças de tamanho
    const ro = new ResizeObserver(updateBar);
    ro.observe(track);
    window.addEventListener('resize', updateBar);

    // inicial
    updateBar();
  };

  // inicializa TODOS os rails da página
  document.querySelectorAll('.coupon-rail').forEach(initRail);

  // (opcional) se você injeta sections depois do load, exponha a função:
  window.initCouponRail = initRail;
})();






