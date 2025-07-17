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

async function getClientToken() {
  const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/Auth/client-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: 'site_vegas_vantagens',
      clientSecret: '8iYQ340vgwr4R1rOsdTg341m1/QEyGfLOIMkGQUasu0='
    })
  });
  const data = await resp.json();
  return data.accessToken;
}

async function fetchStoreDetails(token, storeId) {
  const resp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${storeId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!resp.ok) throw new Error("Falha ao buscar estabelecimento");
  return await resp.json();
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

    document.querySelectorAll('.title-comercio').forEach(el => {
      el.textContent = loja.nome;
    });

    const addressEl = document.querySelector(".adress");
    if (addressEl) addressEl.textContent = `${loja.rua}, ${loja.numero}, ${loja.bairro} - ${loja.cidade}`;

    const phoneEl = document.querySelector(".phone");
    if (phoneEl) phoneEl.textContent = loja.telefone;

    const cardsEl = document.querySelector(".cards");
    if (cardsEl) cardsEl.textContent = (loja.cartoes || []).join(", ");

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
        img.src = loja.imagens[1];
      });
    }

    if (loja.imagemPrincipal) {
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
        img.src = loja.imagemPrincipal;
      });
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

async function fetchCuponsPorEstabelecimento(token, estabelecimentoId) {
  const resp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Cupons/por-estabelecimento/${estabelecimentoId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!resp.ok) throw new Error("Falha ao buscar cupons");
  return await resp.json();
}

if (window.location.pathname.includes("testes.html")) {
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

      container.innerHTML = "";

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

    } catch (e) {
      console.error("Erro ao carregar cupons:", e.message);
    } finally {
      loaderCupons.style.display = "none";
    }
  });
}
