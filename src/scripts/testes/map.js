let map;
let markers = [];
const lojasList = document.querySelector(".produtoLista");
const mapContainer = document.getElementById("map");

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
  try {
    const respLista = await fetch('https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!respLista.ok) throw new Error("Erro ao buscar lista geral");
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
  } catch (err) {
    console.error("Erro ao buscar estabelecimentos completos:", err.message);
    return [];
  }
}

async function initMap() {
  try {
    const token = await getClientToken();
    const lojas = await fetchAllStores(token);

    if (!lojas || lojas.length === 0) {
      console.warn("Nenhuma loja encontrada.");
      return;
    }

    const primeira = lojas.find(loja => {
      const lat = corrigirCoordenada(loja.latitude, "latitude");
      const lng = corrigirCoordenada(loja.longitude, "longitude");
      return !isNaN(lat) && !isNaN(lng);
    });

    if (!primeira) return;

    const latInicial = corrigirCoordenada(primeira.latitude, "latitude");
    const lngInicial = corrigirCoordenada(primeira.longitude, "longitude");

    map = new google.maps.Map(mapContainer, {
      center: { lat: latInicial, lng: lngInicial },
      zoom: 13
    });

    lojas.forEach(loja => {
      const lat = corrigirCoordenada(loja.latitude, "latitude");
      const lng = corrigirCoordenada(loja.longitude, "longitude");

      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: loja.nome
        });

        marker.addListener("click", () => {
          window.location.href = `detalhes.html#store-${loja.id}`;
        });

        markers.push(marker);

        const li = document.createElement("li");
        li.classList.add("place-card");
        li.dataset.city = loja.cidade?.toLowerCase() || "";
        li.dataset.state = loja.estado?.toLowerCase() || "";
        li.dataset.seg = loja.categorias?.join(",") || "";
        li.dataset.card = loja.cartoes?.join(",") || "";
        li.dataset.tags = `${loja.nome?.toLowerCase() || ""} ${loja.endereco?.toLowerCase() || ""}`;

        li.innerHTML = `
          <div class="place-image">
            <img src="${loja.imagem || './imgs/default-image.png'}" alt="${loja.nome}" onerror="this.onerror=null;this.src='./imgs/default-image.png';">
          </div>
          <div class="place-details">
            <h3>${loja.nome}</h3>
            <p class="address">${loja.endereco || "Endereço não informado"}</p>
            <p class="distance"><img src="./imgs/icons/location.svg" /> 5.0 km</p>
            <button class="btn-card-map">Saiba Mais</button>
          </div>
        `;

        li.addEventListener("click", () => {
          const hash = encodeURIComponent(`${loja.cidade}-${loja.estado}-${loja.nome}`);
          window.location.href = `detalhes.html#${hash}`;
        });

        lojasList.appendChild(li);
      }
    });
  } catch (e) {
    console.error("Erro ao carregar mapa e lojas:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();
});
