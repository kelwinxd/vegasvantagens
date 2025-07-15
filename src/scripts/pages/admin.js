document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".painel button");
  const sections = document.querySelectorAll(".telas > div");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-target");

      // Esconde todas as telas
      sections.forEach(section => {
        section.classList.remove("active");
      });

      // Remove "active" de todos os botões
      buttons.forEach(btn => {
        btn.classList.remove("active");
      });

      // Mostra a tela correspondente
      const targetSection = document.querySelector(`.telas [data-tag="${target}"]`);
      if (targetSection) {
        targetSection.classList.add("active");
      }

      // Marca botão como ativo
      button.classList.add("active");
    });
  });
});
