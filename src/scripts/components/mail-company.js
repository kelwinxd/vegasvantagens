import { getClientToken, API_BASE } from '../auth.js';
  const form = document.getElementById("form-parceiro");
  const statusDiv = document.getElementById("mensagem-status");

  const API = "https://apivegasvantagens-production.up.railway.app"

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusDiv.innerHTML = "Enviando...";
    statusDiv.style.color = "#333";

    // monta o objeto data exatamente como a API espera
    const payload = {
      subject: "Novo cadastro de parceiro - Vegas Vantagens",
      to: ["kelwin.esechiel28@gmail.com"], // preencher para email destino
      data: {
        razao_social: document.getElementById("razao_social").value,
        nome_fantasia: document.getElementById("nome_fantasia").value,
        cnpj: document.getElementById("cnpj").value,
        segmento: document.getElementById("segmento").value,
        tel_comercial: document.getElementById("tel_comercial").value,
        cep: document.getElementById("cep").value,
        endereco: document.getElementById("endereco").value,
        numero: document.getElementById("numero").value,
        complemento: document.getElementById("complemento").value,
        bairro: document.getElementById("bairro").value,
        cidade: document.getElementById("cidade").value,
        estado: document.getElementById("estado").value,
        contato_nome: document.getElementById("contato_nome").value,
        contato_telefone: document.getElementById("contato_telefone").value,
        contato_email: document.getElementById("contato_email").value,
        beneficio: document.getElementById("beneficio").value,
        aceite_termos: document.getElementById("aceite_termos").checked
          ? "Sim"
          : "Não"
      }
    };

    try {
      const response = await fetch(
        `https://${API}/api/mails/site/vegasvantagens`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      console.log(payload)

      if (!response.ok) {
        throw new Error("Erro ao enviar formulário");
      }

      statusDiv.innerHTML = "Formulário enviado com sucesso!";
      statusDiv.style.color = "green";
      form.reset();

    } catch (error) {
      statusDiv.innerHTML =
        "Erro ao enviar. Tente novamente mais tarde.";
      statusDiv.style.color = "red";
      console.error(error);
    }
  });

