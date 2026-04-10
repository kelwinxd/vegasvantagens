// ========== FUNÇÕES DO LOADER ==========
export function mostrarLoader(texto = "Carregando cupom...", subtexto = "Aguarde um momento") {
  const loader = document.getElementById("modalLoader");
  const loaderText = loader.querySelector(".loader-text");
  const loaderSubtext = loader.querySelector(".loader-subtext");
  
  if (loaderText) loaderText.textContent = texto;
  if (loaderSubtext) loaderSubtext.textContent = subtexto;
  
  loader.classList.add("active");
  
  // Desabilita scroll do body
  document.body.style.overflow = "hidden";
}

export function ocultarLoader() {
  const loader = document.getElementById("modalLoader");
  loader.classList.remove("active");
  
  // Reabilita scroll do body
  document.body.style.overflow = "";
}
