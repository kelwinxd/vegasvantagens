import { getClientToken, API_BASE } from '../auth.js';

document.addEventListener("DOMContentLoaded", () => {
    const storeId = extrairStoreIdDaURL();
    if (!storeId) return;

    carregarCupons(storeId);
});

function extrairStoreIdDaURL() {
    const hash = window.location.hash;
    if (!hash.includes("store-")) return null;
    return hash.replace("#store-", "");
}

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

        const text = await response.text();
        const cupons = text ? JSON.parse(text) : [];
        console.log(cupons)

        if (!cupons.length) {
            mostrarMensagemSemCupons();
            return;
        }

        renderizarCupons(cupons);
        criarModais(cupons);
        ativarAberturaDeModais();

    } catch (err) {
        console.error("Erro ao carregar cupons:", err);
        mostrarMensagemSemCupons();
    }
}

function mostrarMensagemSemCupons() {
    const msg = document.getElementById("no-coupons-msg");
    msg.style.display = "block";
}

function renderizarCupons(cupons) {
    const container = document.querySelector(".coupon-grid");
    container.innerHTML = ""; 

    cupons.forEach(cupom => {
        const doisCartoes = cupom.cartoesAceitos.slice(0, 2)
            .map(c => `<span class="pill">${c.nome}</span>`)
            .join("");

        container.insertAdjacentHTML("beforeend", `
        <article class="coupon-card">

            <div class="coupon-media">
                <img src="${cupom.urlImagem || './imgs/woman-card.png'}" loading="lazy">
                <span class="coupon-badge">
                    <strong>${cupom.titulo}</strong>
                </span>
            </div>

            <div class="coupon-body">

                <div class="coupon-meta">
                    <span class="meta-cat">Utilidades</span>
                    <div class="meta-pills">${doisCartoes}</div>
                </div>

                <h3 class="coupon-title">${cupom.titulo}</h3>
                <p class="coupon-sub">${cupom.descricao}</p>

                <button class="coupon-cta" type="button" data-modal-target="${cupom.codigo}">
                    Ver Oferta
                </button>

                <p class="coupon-valid">Válido até ${cupom.validade}</p>
            </div>

        </article>
        `);
    });
}


function criarModais(cupons) {
    const container = document.body;
    
    cupons.forEach(cupom => {
        const todosCartoes = cupom.cartoesAceitos
            .map(c => `<span class="cm-pill">${c.nome}</span>`)
            .join("");

        container.insertAdjacentHTML("beforeend", `
        <dialog class="coupon-modal" data-modal="${cupom.codigo}">
            <button class="cm-close" aria-label="Fechar">&times;</button>

            <div class="cm-wrap">

                <div class="cm-topchips">
                    <span class="cm-chip"><img src="./imgs/utils-icon.png" alt="">Fitness</span>
                </div>

                <div class="cm-badge">
                    <h2 class="cm-title">${cupom.titulo}</h2>
                </div>

                <p class="cm-sub">${cupom.modalDescricao}</p>

                <p class="aceitos-cm">Cartões Aceitos:</p>
                <div class="cm-pills">
                    ${todosCartoes}
                </div>

                <div class="cm-alert">
                    <div class="flex-alert">
                        <img src="./imgs/alert-icon.png" alt=""><strong>Atenção!</strong>
                    </div>
                    <p class="subvalid-cm">
                        Não acumulável com outras promoções. Apresente o cupom no momento do pedido.
                    </p>
                </div>

                <a href="#" class="cm-cta" role="button">Consultar no mapa</a>
            </div>
        </dialog>
        `);
    });
}

function ativarAberturaDeModais() {
    const botoes = document.querySelectorAll("[data-modal-target]");

    botoes.forEach(btn => {
        btn.addEventListener("click", () => {
            const codigo = btn.getAttribute("data-modal-target");
            const modal = document.querySelector(`dialog[data-modal="${codigo}"]`);
            if (modal) modal.showModal();
        });
    });

    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("cm-close")) {
            e.target.closest("dialog").close();
        }
    });
}
