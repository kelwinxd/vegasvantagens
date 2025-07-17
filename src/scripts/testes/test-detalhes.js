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
  const hash = decodeURIComponent(window.location.hash).slice(1); // remove o "#"
  const idMatch = hash.match(/^store-(\d+)$/);

  if (!idMatch) {
    console.warn("Formato de hash inválido:", hash);
    return;
  }

  const storeId = idMatch[1];

  try {
    // Obter token
    const token = await getClientToken();

    // Buscar dados da loja
    const loja = await fetchStoreDetails(token, storeId);

    if (!loja) {
      console.warn("Loja não encontrada.");
      return;
    }

    // Atualiza os elementos da página
    document.querySelectorAll('.title-comercio').forEach(el => {
      el.textContent = loja.nome;
    });

    const addressEl = document.querySelector(".adress");
    if (addressEl) addressEl.textContent = `${loja.rua}, ${loja.numero}, ${loja.bairro} - ${loja.cidade}`;

    const phoneEl = document.querySelector(".phone");
    if (phoneEl) phoneEl.textContent = loja.telefone;

    const cardsEl = document.querySelector(".cards");
    if (cardsEl) cardsEl.textContent = (loja.cartoes || []).join(", ");

    const imageEls = document.querySelectorAll(".img-comercio");
    if (imageEls && loja.imagens?.length > 0) {
      imageEls.forEach(img => {
        img.src = loja.imagens[1];
      });
    }

    const logoEls = document.querySelectorAll(".img-logo img");
    if (logoEls && loja.imagemPrincipal) {
      logoEls.forEach(img => {
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
  }
});

// Função auxiliar para buscar cupons
// Função auxiliar para buscar cupons
async function fetchCuponsPorEstabelecimento(token, estabelecimentoId) {
  const resp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Cupons/por-estabelecimento/${estabelecimentoId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!resp.ok) throw new Error("Falha ao buscar cupons");
  return await resp.json();
}

// Atualização na DOMContentLoaded para página de testes.html
if (window.location.pathname.includes("testes.html")) {
  document.addEventListener("DOMContentLoaded", async () => {
    const hash = decodeURIComponent(window.location.hash).slice(1); // remove o "#"
    const idMatch = hash.match(/^store-(\d+)$/);

    if (!idMatch) return;
    const storeId = idMatch[1];

    try {
      const token = await getClientToken();
      const cupons = await fetchCuponsPorEstabelecimento(token, storeId);

      const container = document.querySelector(".cards-descontos");
      if (!container) return;

      container.innerHTML = "";
      cupons.forEach(cupom => {
        const card = document.createElement("div");
        card.className = "card-desconto";
    card.innerHTML = `
  <div class="coupon-card">
    <div class="coupon-image">
      <img src="${cupom.imagens?.[0] || './imgs/img-desc.png'}" alt="Imagem do Cupom">
    </div>
    <div class="coupon-content">
      <div class="coupon-tag">${cupom.tipo === "Percentual" ? `${cupom.valorDesconto}% OFF` : 'Desconto'}</div>
      <h2 class="coupon-title">${cupom.titulo}</h2>
      <p class="coupon-description">${cupom.descricao}</p>
      <button class="coupon-button">Ver Mais</button>
    </div>
  </div>
`;


        card.querySelector("button").addEventListener("click", () => {
          console.log('clicou!')
          const modal = document.querySelector(".modal");
          if (!modal) return;
          modal.querySelector(".modal-title").textContent = cupom.titulo;
          modal.querySelector(".modal-validade").textContent = `Válido até ${new Date(cupom.dataExpiracao).toLocaleDateString()}`;
          modal.querySelector(".modal-descricao").textContent = cupom.descricao;
          modal.querySelector(".modal-logo").src = cupom.imagens?.[0] || "";
          modal.style.display = "flex";
        });

        container.appendChild(card);
      });

      const closeBtn = document.querySelector(".modal .close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          document.querySelector(".modal").style.display = "none";
        });
      }

    } catch (e) {
      console.error("Erro ao carregar cupons:", e.message);
    }
  });
}
