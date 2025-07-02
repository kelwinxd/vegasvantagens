


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

      // Buscar estabelecimentos
      const respEstab = await fetch('https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!respEstab.ok) throw new Error(`Erro: ${respEstab.status}`);
      const estabelecimentos = await respEstab.json();

      // Imprimir em tela
      const container = document.getElementById("resultado");
      estabelecimentos.forEach(e => {
        const div = document.createElement("div");
        div.style.marginBottom = "1rem";
        div.innerHTML = `
          <strong>${e.nome}</strong><br/>
          ${e.razaoSocial}<br/>
          CNPJ: ${e.cnpj}<br/>
          Cidade: ${e.cidade}<br/>
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

