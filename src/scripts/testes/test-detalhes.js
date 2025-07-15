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
