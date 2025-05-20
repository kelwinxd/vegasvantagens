const titleComercio = document.querySelector('.title-comercio')
const adress = document.querySelector(".adress")

window.addEventListener("DOMContentLoaded", () => {
    const hash = decodeURIComponent(window.location.hash.substring(1)); // remove o #
    
    // Exemplo: dividir a hash
    const [cidade, estado, ...nomePartes] = hash.split("-");
    const nomeDoPonto = nomePartes.join(" ");

    titleComercio.textContent = `${nomeDoPonto}`
    adress.textContent = `${cidade} | ${estado}`
  
    console.log("Cidade:", cidade);
    console.log("Estado:", estado);
    console.log("Nome:", nomeDoPonto);
  
    // Aqui você pode buscar os dados do ponto correspondente
    // por exemplo, usando fetch ou um array local
  });