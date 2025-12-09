import { getClientToken, API_BASE } from '../auth.js';

document.addEventListener("DOMContentLoaded", () => {
    const storeId = extrairStoreIdDaURL();
    if (!storeId) return;

    carregarCupons(storeId);
});

/* ============================================================
    Extrair o ID do Estabelecimento pela URL
============================================================ */
function extrairStoreIdDaURL() {
    const hash = window.location.hash;
    if (!hash.includes("store-")) return null;
    return hash.replace("#store-", "");
}

/* ============================================================
    Carregar cupons com Token
============================================================ */
async function carregarCupons(estabelecimentoId) {
    try {
        const token = await getClientToken();

        const response = await fetch(
            `${API_BASE}/api/Cupons/por-estabelecimento/${estabelecimentoId}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            console.error("Erro ao buscar cupons:", response.status);
            mostrarMensagemSemCupons();
            return;
        }

        const cupons = await response.json();
        renderizarCupons(cupons);

    } catch (err) {
        console.error("Erro ao carregar cupons:", err);
        mostrarMensagemSemCupons();
    }
}

/* ============================================================
    Renderizar cards dos cupons
============================================================ */
function renderizarCupons(cupons) {
    const container = document.getElementById("cupons-container");
    container.innerHTML = "";

    if (!cupons || cupons.length === 0) {
        mostrarMensagemSemCupons();
        return;
    }

    cupons.forEach(cupom => {
        const card = document.createElement("article");
        card.classList.add("coupon-card");

        card.innerHTML = `
            <div class="coupon-media">
                <img src="${cupom.imagem || './imgs/default.png'}" alt="Imagem do cupom">
                <span class="coupon-badge">${cupom.desconto || 'Desconto'}</span>
            </div>

            <div class="coupon-content">
                <h3>${cupom.titulo}</h3>
                <p>${cupom.descricao}</p>

                <div class="coupon-actions">
                    <button class="btn-detalhes" data-id="${cupom.id}">Ver detalhes</button>
                    <button class="btn-usar" data-id="${cupom.id}" data-codigo="${cupom.codigo}">Usar cupom</button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Eventos dos botões
    document.querySelectorAll(".btn-detalhes").forEach(btn => {
        btn.addEventListener("click", abrirModalDetalhes);
    });

    document.querySelectorAll(".btn-usar").forEach(btn => {
        btn.addEventListener("click", abrirModalUsar);
    });
}

/* ============================================================
    Modal — DETALHES DO CUPOM
============================================================ */
function abrirModalDetalhes(event) {
    const id = event.target.dataset.id;

    const card = event.target.closest(".coupon-card");
    const titulo = card.querySelector("h3").textContent;
    const descricao = card.querySelector("p").textContent;

    const modal = document.getElementById("modal-detalhes");
    modal.querySelector(".modal-titulo").textContent = titulo;
    modal.querySelector(".modal-desc").textContent = descricao;

    modal.classList.add("active");
}

function fecharModalDetalhes() {
    document.getElementById("modal-detalhes").classList.remove("active");
}

/* ============================================================
    Modal — USAR CUPOM
============================================================ */
function abrirModalUsar(event) {
    const codigo = event.target.dataset.codigo;

    const modal = document.getElementById("modal-usar");
    modal.querySelector(".codigo-cupom").textContent = codigo;

    modal.classList.add("active");
}

function fecharModalUsar() {
    document.getElementById("modal-usar").classList.remove("active");
}

/* ============================================================
    Caso não exista cupom
============================================================ */
function mostrarMensagemSemCupons() {
    const container = document.getElementById("cupons-container");
    container.innerHTML = `
        <p style="text-align:center; opacity:0.6">
            Nenhum cupom disponível.
        </p>
    `;
}
