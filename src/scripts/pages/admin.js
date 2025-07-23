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

window.onload = () => {
  buscarEstabelecimentos();
  carregarCategorias();
  carregarEstados();
};

function carregarEstados() {
  const estados = [
    { id: 1, nome: "São Paulo" },
    { id: 2, nome: "Rio de Janeiro" },
    { id: 3, nome: "Minas Gerais" }
  ];

  const selectEstado = document.getElementById("estadoId");
  estados.forEach(estado => {
    const option = document.createElement("option");
    option.value = estado.id;
    option.textContent = estado.nome;
    selectEstado.appendChild(option);
  });

   console.log("Estados carregados:", Array.from(selectEstado.options).map(o => o.textContent));

 
}

async function enviarImagemEstabelecimento(estabelecimentoId, imagemFile, principal) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("imagem", imagemFile);

  const resposta = await fetch(
    `https://apivegasvantagens-production.up.railway.app/api/estabelecimentos/${estabelecimentoId}/imagens?principal=${principal}`,
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token
      },
      body: formData
    }
  );

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error("Erro ao enviar imagem: " + erro);
  }
}


function carregarCidades() {
 

  const estadoId = document.getElementById("estadoId").value;
  const token = localStorage.getItem("token");

  if (!estadoId || !token) return;

  fetch(`https://apivegasvantagens-production.up.railway.app/api/Cidades/por-estado/${estadoId}`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Erro ao buscar cidades.");
    return res.json();
  })
  .then(cidades => {
    const selectCidade = document.getElementById("cidadeId");
    selectCidade.innerHTML = '<option value="">Selecione uma cidade</option>';
    cidades.forEach(cidade => {
      const option = document.createElement("option");
      option.value = cidade.id;
      option.textContent = cidade.nome;
      selectCidade.appendChild(option);
    });
  })
  .catch(err => {
    alert("Erro ao carregar cidades: " + err.message);
    console.error(err);
  });

  console.log("carregarCidades() chamado com estadoId =", estadoId);

}

function carregarCategorias() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para carregar as categorias.");
    return;
  }

  fetch("https://apivegasvantagens-production.up.railway.app/api/CategoriasEstabelecimentos", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Erro ao buscar categorias: " + res.status);
    return res.json();
  })
  .then(data => {
    const select = document.getElementById("categoriaId");
    select.innerHTML = ""; // Limpa os options

    data.forEach(categoria => {
      const option = document.createElement("option");
      option.value = categoria.id;
      option.textContent = categoria.nome;
      select.appendChild(option);
    });
  })
  .catch(err => {
    alert("Erro ao carregar categorias: " + err.message);
    console.error(err);
  });
}

  async function cadastrarEstabelecimento() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para cadastrar.");
    return;
  }

  const nome = document.getElementById("nomeEstab").value;
  const ativo = document.getElementById("ativoEstab").checked;
  const categoriaId = parseInt(document.getElementById("categoriaId").value);
  const imagemPrincipal = document.getElementById("imagemPrincipal");
  const imagemAdicional = document.getElementById("imagemAdicional");

  const data = {
    nome,
    razaoSocial: document.getElementById("razaoSocial").value,
    cnpj: document.getElementById("cnpj").value,
    endereco: document.getElementById("endereco").value,
    telefone: document.getElementById("telefone").value,
    emailContato: document.getElementById("emailContato").value,
    ativo,
   
    cidadeId: parseInt(document.getElementById("cidadeId").value) || 0,
    rua: document.getElementById("rua").value,
    numero: document.getElementById("numero").value,
    bairro: document.getElementById("bairro").value,
    complemento: document.getElementById("complemento").value,
    cep: document.getElementById("cep").value,
    latitude: parseFloat(document.getElementById("latitude").value) || 0,
    longitude: parseFloat(document.getElementById("longitude").value) || 0
  };

  try {
    const res = await fetch("https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/Criar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Erro ao cadastrar estabelecimento: " + res.status);
    const estab = await res.json();

    alert("Estabelecimento cadastrado com sucesso!");

    if (imagemPrincipal.files.length > 0) {
      await enviarImagemEstabelecimento(estab.id, imagemPrincipal.files[0], true);
    }

    if (imagemAdicional.files.length > 0) {
      await enviarImagemEstabelecimento(estab.id, imagemAdicional.files[0], false);
    }

    if (categoriaId) {
      await vincularCategoria(estab.id, categoriaId);
    }

    document.getElementById("formCadastro").reset();

  } catch (err) {
    alert("Erro: " + err.message);
    console.error(err);
  }
}

  async function vincularCategoria(estabelecimentoId, categoriaId) {
  const token = localStorage.getItem("token");
  await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${estabelecimentoId}/vincular-categorias`, {
    method: "POST", // ← alterado de PUT para POST
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify([categoriaId]) // ← continua um array
  });
}



   async function buscarEstabelecimentos() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para ver a lista.");
    return;
  }

  const listaDiv = document.getElementById("listaEstabelecimentos");
  const listaCards = document.getElementById("listaCards");
  listaCards.innerHTML = "";

  try {
    const res = await fetch("https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) throw new Error("Erro ao buscar estabelecimentos: " + res.status);
    const data = await res.json();

    if (data.length === 0) {
      listaCards.innerHTML = "<p>Nenhum estabelecimento cadastrado.</p>";
      return;
    }

    const detalhes = await Promise.all(
      data.map(estab =>
        fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${estab.id}`, {
          headers: { "Authorization": "Bearer " + token }
        }).then(r => r.json())
      )
    );

    detalhes.forEach(estab => {
      const card = document.createElement("div");
      card.className = "card-estab";
      card.setAttribute("data-nome", estab.nome.toLowerCase());

      const imagem = document.createElement("img");
      imagem.src = estab.imagemPrincipal || "./imgs/default-image.png";
      imagem.alt = estab.nome;

      const info = document.createElement("div");
      info.className = "card-info";
      info.innerHTML = `
        <h3>${estab.nome}</h3>
        <p>${estab.cidade}</p>
      `;

      const actions = document.createElement("div");
      actions.className = "card-actions";

      const btnEditar = document.createElement("i");
      btnEditar.className = "fa-solid fa-pen-to-square";

      btnEditar.addEventListener("click", () => abrirModalEditar(estab));



      const btnExcluir = document.createElement("i");
      btnExcluir.className = "fa-solid fa-trash";

      // Ação do botão excluir
      btnExcluir.addEventListener("click", async () => {
        if (confirm(`Tem certeza que deseja excluir "${estab.nome}"?`)) {
          try {
            const res = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${estab.id}`, {
              method: "DELETE",
              headers: {
                "Authorization": "Bearer " + token
              }
            });

            if (!res.ok) throw new Error("Erro ao excluir");

            alert("Estabelecimento excluído com sucesso!");
            card.remove();
          } catch (e) {
            alert("Erro ao excluir: " + e.message);
          }
        }
      });

      actions.appendChild(btnEditar);
      actions.appendChild(btnExcluir);

      card.appendChild(imagem);
      card.appendChild(info);
      card.appendChild(actions);
      listaCards.appendChild(card);
    });

    listaDiv.style.display = "block";

  } catch (err) {
    alert("Erro: " + err.message);
    console.error(err);
  }
}

//EDITAR

async function carregarCategoriasModal() {
  const token = localStorage.getItem("token");
  const select = document.getElementById("editCategoriaId");

  try {
    const res = await fetch("https://apivegasvantagens-production.up.railway.app/api/Categorias", {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) throw new Error("Resposta inválida");

    const data = await res.json();
    select.innerHTML = "";

    data.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.nome;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Erro ao carregar categorias:", err);
    select.innerHTML = "<option value=''>Erro ao carregar</option>";
  }
}


async function carregarEstadosModal() {
  const token = localStorage.getItem("token");
  const select = document.getElementById("editEstadoId");

  try {
    const res = await fetch("https://apivegasvantagens-production.up.railway.app/api/Estados", {
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();
    select.innerHTML = "<option value=''>Selecione um estado</option>";

    data.forEach(estado => {
      const option = document.createElement("option");
      option.value = estado.id;
      option.textContent = estado.nome;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Erro ao carregar estados:", err);
  }
}


async function carregarCidades(isModal = false) {
  const estadoId = isModal
    ? document.getElementById("editEstadoId").value
    : document.getElementById("estadoId").value;

  const select = isModal
    ? document.getElementById("editCidadeId")
    : document.getElementById("cidadeId");

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Cidades/por-estado/${estadoId}`, {
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();
    select.innerHTML = "<option value=''>Selecione uma cidade</option>";

    data.forEach(cidade => {
      const option = document.createElement("option");
      option.value = cidade.id;
      option.textContent = cidade.nome;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Erro ao carregar cidades:", err);
  }
}




async function abrirModalEditar(estab) {
  await carregarCategoriasModal();
  await carregarEstadosModal();

  // Setar os valores após o carregamento
  document.getElementById("editCategoriaId").value = estab.categoriaId || "";
  document.getElementById("editEstadoId").value = estab.estadoId || "";

  await carregarCidades(true); // carrega cidades do estado selecionado
  document.getElementById("editCidadeId").value = estab.cidadeId || "";


  document.getElementById("editId").value = estab.id;
  document.getElementById("editNomeEstab").value = estab.nome;
  document.getElementById("editRazaoSocial").value = estab.razaoSocial || "";
  document.getElementById("editCnpj").value = estab.cnpj || "";
  document.getElementById("editEndereco").value = estab.endereco || "";
  document.getElementById("editTelefone").value = estab.telefone || "";
  document.getElementById("editEmailContato").value = estab.emailContato || "";
  document.getElementById("editAtivoEstab").checked = estab.ativo;

  document.getElementById("editCategoriaId").value = estab.categoriaId || "";
  document.getElementById("editEstadoId").value = estab.estadoId || "";
  document.getElementById("editCidadeId").value = estab.cidadeId || "";

  document.getElementById("editRua").value = estab.rua || "";
  document.getElementById("editNumero").value = estab.numero || "";
  document.getElementById("editBairro").value = estab.bairro || "";
  document.getElementById("editComplemento").value = estab.complemento || "";
  document.getElementById("editCep").value = estab.cep || "";
  document.getElementById("editLatitude").value = estab.latitude || "";
  document.getElementById("editLongitude").value = estab.longitude || "";

document.getElementById("editLogoPreview").src =
  estab.imagemPrincipal || "./imgs/default-image.png";

document.getElementById("editFachadaPreview").src =
  estab.imagens && estab.imagens.length > 1
    ? estab.imagens[1]
    : "./imgs/default-image.png";

  document.getElementById("modalEditarOverlay").style.display = "flex";
}

document.getElementById("editImagemPrincipal").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    document.getElementById("editLogoPreview").src = URL.createObjectURL(file);
  }
});

document.getElementById("editImagemAdicional").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    document.getElementById("editFachadaPreview").src = URL.createObjectURL(file);
  }
});


function fecharModalEditar() {
  document.getElementById("modalEditarOverlay").style.display = "none";
}

async function salvarAlteracoesEstab() {
  const token = localStorage.getItem("token");
  const estabId = document.getElementById("editModal").dataset.estabId;

  const formData = new FormData();
  formData.append("id", estabId);
  formData.append("nome", document.getElementById("editNomeEstab").value);
  formData.append("razaoSocial", document.getElementById("editRazaoSocial").value);
  formData.append("cnpj", document.getElementById("editCnpj").value); // readOnly mas incluído
  formData.append("endereco", document.getElementById("editEndereco").value);
  formData.append("telefone", document.getElementById("editTelefone").value);
  formData.append("emailContato", document.getElementById("editEmailContato").value);
  formData.append("ativo", document.getElementById("editAtivoEstab").checked);
  formData.append("categoriaId", document.getElementById("editCategoriaId").value);
  formData.append("estadoId", document.getElementById("editEstadoId").value);
  formData.append("cidadeId", document.getElementById("editCidadeId").value);
  formData.append("rua", document.getElementById("editRua").value);
  formData.append("numero", document.getElementById("editNumero").value);
  formData.append("bairro", document.getElementById("editBairro").value);
  formData.append("complemento", document.getElementById("editComplemento").value);
  formData.append("cep", document.getElementById("editCep").value);
  formData.append("latitude", document.getElementById("editLatitude").value);
  formData.append("longitude", document.getElementById("editLongitude").value);

formData.append("imagemPrincipal", document.getElementById("editImagemPrincipal").files[0] || null);
formData.append("imagemAdicional", document.getElementById("editImagemAdicional").files[0] || null);
 

  try {
    const res = await fetch(`https://apivegasvantagens-production.up.railway.app/api/Estabelecimentos/${estabId}`, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token
        // Não inclua Content-Type aqui, o browser define automaticamente com multipart/form-data
      },
      body: formData
    });

    if (!res.ok) throw new Error("Erro ao atualizar");

    alert("Estabelecimento atualizado com sucesso!");
    document.getElementById("editModal").style.display = "none";
    buscarEstabelecimentos(); // Atualiza a lista na interface
  } catch (err) {
    console.error("Erro ao salvar alterações:", err);
    alert("Erro ao salvar alterações: " + err.message);
  }
}





document.getElementById("filtroEstab").addEventListener("input", function () {
  const termo = this.value.toLowerCase();
  const cards = document.querySelectorAll(".card-estab");

  cards.forEach(card => {
    const nome = card.getAttribute("data-nome");
    card.style.display = nome.includes(termo) ? "flex" : "none";
  });
});
