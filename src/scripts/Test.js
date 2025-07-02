async function getClientToken() {
  const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/Auth/client-token', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      clientId: 'site_vegas_vantagens',
      clientSecret: '8iYQ340vgwr4R1rOsdTg341m1/QEyGfLOIMkGQUasu0='
    })
  });
  const data = await resp.json();
  console.log('Token:', data.accessToken);
  return data.accessToken;
}

getClientToken();


async function fetchStores() {
  try {
    const token = await getClientToken();
    const resp = await fetch('https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!resp.ok) {
      throw new Error(`Erro ao buscar estabelecimentos: ${resp.status} ${resp.statusText}`);
    }

    const data = await resp.json();
    console.log('Dados recebidos:', data);
    return data;
  } catch (error) {
    console.error('Erro no fetchStores:', error.message);
    return [];
  }

 
}

document.querySelector(".btn-puxar").addEventListener('click', fetchStores)