async function carregarEstabelecimentos() {
  try {
    // Obter token
    const respToken = await fetch('https://apivegasvantagens-production.up.railway.app/api/Auth/client-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'site_vegas_vantagens',
        clientSecret: '8iYQ340vgwr4R1rOsdTg341m1/QEyGfLOIMkGQUasu0='
      })
    });

    const { accessToken } = await respToken.json();

    // Buscar todos os IDs
    const respLista = await fetch('https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!respLista.ok) throw new Error(`Erro ao buscar lista: ${respLista.status}`);
    const lista = await respLista.json();

    // Buscar dados completos de cada loja
    const detalhes = await Promise.all(
      lista.map(async loja => {
        const respDetalhe = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${loja.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!respDetalhe.ok) return null;
        return await respDetalhe.json();
      })
    );

    const container = document.getElementById("resultado");
    detalhes
      .filter(e => e !== null)
      .forEach(e => {
        const div = document.createElement("div");
        div.style.marginBottom = "2rem";

        div.innerHTML = `
          <strong>ID:</strong> ${e.id}<br/>
          <strong>Nome:</strong> ${e.nome}<br/>
          <strong>Razão Social:</strong> ${e.razaoSocial}<br/>
          <strong>CNPJ:</strong> ${e.cnpj}<br/>
          <strong>Cidade:</strong> ${e.cidade}<br/>
          <strong>Endereço:</strong> ${e.rua}, ${e.numero}, ${e.bairro}<br/>
          <strong>Complemento:</strong> ${e.complemento || "—"}<br/>
          <strong>CEP:</strong> ${e.cep}<br/>
          <strong>Telefone:</strong> ${e.telefone}<br/>
          <strong>Email:</strong> ${e.emailContato}<br/>
          <strong>Latitude:</strong> ${e.latitude}<br/>
          <strong>Longitude:</strong> ${e.longitude}<br/>
          <strong>Categorias:</strong> ${e.categorias?.join(", ") || "Nenhuma"}<br/>
          <strong>Imagem Principal:</strong> ${e.imagemPrincipal ? `<img src="${e.imagemPrincipal}" width="120" />` : "—"}<br/>
          <hr/>
        `;

        container.appendChild(div);
      });

  } catch (err) {
    console.error("Erro ao carregar estabelecimentos:", err.message);
    document.getElementById("resultado").textContent = "Erro ao carregar dados.";
  }
}

document.addEventListener("DOMContentLoaded", carregarEstabelecimentos);
