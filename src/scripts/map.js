// ✅ CÓDIGO AJUSTADO — Corrige o carregamento dinâmico de cidades no menu mobile ao selecionar estado
let map, markers = [];

function corrigirCoordenada(valor, tipo) {
  const num = parseFloat(valor);
  if (isNaN(num)) return null;
  if (tipo === "longitude" && (num > 180 || num < -180)) return num / 1e15;
  if (tipo === "latitude" && (num > 90 || num < -90)) return num / 1e15;
  return num;
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

async function fetchAllStores(accessToken) {
  const respLista = await fetch('https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const lista = await respLista.json();
  const detalhes = await Promise.all(
    lista.map(async loja => {
      const detalheResp = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${loja.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!detalheResp.ok) return null;
      return await detalheResp.json();
    })
  );
  return detalhes.filter(e => e && e.latitude && e.longitude);
}

async function atualizarCidadesPorEstado(estado) {
  const listaUl = document.getElementById("list-ul");
  const filterCity = document.getElementById("filterCity");
  filterCity.innerHTML = `<option value="">Todas as Cidades</option>`;
  listaUl.innerHTML = "<li data-value=''>Todas as Cidades</li>";

  if (!estado) return;

  const accessToken = await getClientToken();
  const lojas = await fetchAllStores(accessToken);

  const cidadesDoEstado = lojas
    .filter(loja => loja.uf?.toLowerCase() === estado)
    .map(loja => loja.cidade?.toLowerCase())
    .filter(Boolean);

  const cidadesUnicas = [...new Set(cidadesDoEstado)].sort();

  cidadesUnicas.forEach(cidade => {
    const nomeFormatado = cidade.charAt(0).toUpperCase() + cidade.slice(1);

    const opt = document.createElement("option");
    opt.value = cidade;
    opt.textContent = nomeFormatado;
    filterCity.appendChild(opt);

    const li = document.createElement("li");
    li.textContent = nomeFormatado;
    li.dataset.value = cidade;

    li.addEventListener("click", () => {
      filterCity.value = cidade;
      filterCity.dispatchEvent(new Event("change"));
      listaUl.querySelectorAll("li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");
    });

    listaUl.appendChild(li);
  });
}

// Aplicar ao menu customizado
function inicializarDropdownMobile() {
  document.querySelectorAll(".custom-select").forEach((selectWrapper) => {
    const title = selectWrapper.querySelector(".custom-select-title");
    const optionsList = selectWrapper.querySelector(".custom-options");
    const hiddenInput = document.getElementById(optionsList.dataset.inputId);

    if (!title || !optionsList || !hiddenInput) return;

    title.addEventListener("click", () => {
      optionsList.classList.toggle("show-options");
    });

    optionsList.querySelectorAll("li").forEach((option) => {
      option.addEventListener("click", async () => {
        const value = option.getAttribute("data-value");

        optionsList.querySelectorAll("li").forEach((li) => li.classList.remove("selected"));
        option.classList.add("selected");

        hiddenInput.value = value;
        title.textContent = option.textContent;
        optionsList.classList.remove("show-options");

        if (hiddenInput.id === "filterState") {
          await atualizarCidadesPorEstado(value.toLowerCase());
        }
        hiddenInput.dispatchEvent(new Event("change"));
      });
    });

    document.addEventListener("click", (e) => {
      if (!selectWrapper.contains(e.target)) {
        optionsList.classList.remove("show-options");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await atualizarCidadesPorEstado("sp");
  inicializarDropdownMobile();
});
