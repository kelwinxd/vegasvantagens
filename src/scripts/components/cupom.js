const API_URL = "https://apivegasvantagens-production.up.railway.app"; // <-- altere aqui
const couponGrid = document.querySelector(".coupon-grid");
const noCouponsMsg = document.getElementById("no-coupons-msg");

// Modal refs
const modal = document.getElementById("coupon-modal");
const modalTitle = document.getElementById("cm-title");
const modalSub = document.getElementById("cm-sub");
const modalChips = document.getElementById("cm-topchips");
const modalPills = document.getElementById("cm-pills");
const modalMap = document.getElementById("cm-map");

// Fechar modal
modal.querySelector(".cm-close").addEventListener("click", () => modal.close());

// ------------------------
// 1. BUSCAR CUPONS DA API
// ------------------------
async function carregarCupons(estabelecimentoId) {
    try {
        const response = await fetch(`${API_URL}/api/Cupons/por-estabelecimento/${estabelecimentoId}`);
        const cupons = await response.json();

        if (!cupons.length) {
            noCouponsMsg.style.display = "block";
            return;
        }

        noCouponsMsg.style.display = "none";
        renderCupons(cupons);

    } catch (error) {
        console.error("Erro ao carregar cupons:", error);
    }
}

// -----------------------------
// 2. RENDERIZAR CUPONS NO GRID
// -----------------------------
function renderCupons(cupons) {
    couponGrid.innerHTML = "";

    cupons.forEach(cupom => {
        const card = document.createElement("article");
        card.classList.add("coupon-card");

        card.innerHTML = `
            <div class="coupon-media">
                <img src="${cupom.imagens?.[0] || './imgs/placeholder.png'}" 
                     alt="${cupom.titulo}" loading="lazy">

                <span class="coupon-badge">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 6a3 3 0 0 1 3-3h8..."></path>
                    </svg>
                    ${cupom.titulo}
                </span>
            </div>

            <div class="coupon-content">
                <p class="coupon-description">${cupom.descricao}</p>

                <div class="coupon-pills">
                    ${renderCartoesPreview(cupom.cartoesAceitos)}
                </div>

                <button class="coupon-btn">Ver oferta</button>
            </div>
        `;

        // botão "Ver oferta"
        card.querySelector(".coupon-btn").addEventListener("click", () => {
            abrirModal(cupom);
        });

        couponGrid.appendChild(card);
    });
}

// ----------------------------------------
// 3. MOSTRAR APENAS 2 CARTÕES + "+X"
// ----------------------------------------
function renderCartoesPreview(cartoes) {
    if (!cartoes || cartoes.length === 0) return "";

    if (cartoes.length <= 2) {
        return cartoes.map(c => `<span class="coupon-pill">${c.nome}</span>`).join("");
    }

    return `
        <span class="coupon-pill">${cartoes[0].nome}</span>
        <span class="coupon-pill">${cartoes[1].nome}</span>
        <span class="coupon-pill-more">+${cartoes.length - 2}</span>
    `;
}

// -----------------------------
// 4. MODAL DINÂMICO
// -----------------------------
function abrirModal(cupom) {
    // título e descrição
    modalTitle.textContent = cupom.modalTitulo;
    modalSub.textContent = cupom.modalDescricao;

    // chips (se tiver categorias)
    modalChips.innerHTML = "";
    if (cupom.categorias?.length) {
        cupom.categorias.forEach(cat => {
            modalChips.innerHTML += `
                <span class="cm-chip"><img src="./imgs/utils-icon.png">${cat}</span>
            `;
        });
    }

    // TODOS OS CARTÕES
    modalPills.innerHTML = "";
    cupom.cartoesAceitos.forEach(cartao => {
        modalPills.innerHTML += `<span class="cm-pill">${cartao.nome}</span>`;
    });

    // link do mapa
    modalMap.href = `/mapa?estab=${cupom.estabelecimentoId}`;

    modal.showModal();
}

// -----------------------------
// 5. INICIAR (exemplo)
// -----------------------------
const estabelecimentoId = 2; // <-- troque dinamicamente
carregarCupons(estabelecimentoId);
