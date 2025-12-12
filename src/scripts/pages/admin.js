import { getClientToken, loginToken, API_BASE, CLIENT_ID, CLIENT_SECRET } from '../auth.js';



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

  
document.querySelectorAll(".submenu-promocoes .sub").forEach(btn => {
    btn.addEventListener("click", () => {

        // remover active de todos os botões
        document.querySelectorAll(".submenu-promocoes .sub")
            .forEach(b => b.classList.remove("active"));

        // ativar botão clicado
        btn.classList.add("active");

        // esconder todas as telas
        document.querySelectorAll(".subscreen")
            .forEach(screen => screen.classList.remove("active"));

        // mostrar a selecionada
        const target = btn.dataset.target;
        const tela = document.getElementById(target);
        tela.classList.add("active");

        // 🔥 CHAMAR CARREGAR CUPONS SOMENTE QUANDO ABRIR A TELA
        if (target === "gerenciarCupons") {
            carregarTodosCupons();              // Lista geral
             
        }

        if (target === "cuponsVencidos") {
        carregarTodosCupons().then(() => {
        mostrarCuponsVencidos();
  });
             
}

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

async function enviarImagemEstabelecimento(estabelecimentoId, imagemFile, tipo) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("imagem", imagemFile);

  let query = "";

  if (tipo === "principal") query = "principal";
  if (tipo === "fachada") query = "fachada";
  if (tipo === "logo") query = "logo&principal=true"; // regra especial para logo

  const resposta = await fetch(
    `${API_BASE}/api/estabelecimentos/${estabelecimentoId}/imagens?${query}`,
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

  fetch(`${API_BASE}/api/Cidades/por-estado/${estadoId}`, {
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

  fetch(`${API_BASE}/api/CategoriasEstabelecimentos`, {
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
  const imagemLogo = document.getElementById("ImagemLogo");
  const imagemFachada = document.getElementById("ImagemFachada");

  const data = {
    nome,
    razaoSocial: document.getElementById("razaoSocial").value,
    cnpj: document.getElementById("cnpj").value,
    telefone: document.getElementById("telefone").value,
    emailContato: document.getElementById("emailContato").value,
    ativo,
    categoriaId: categoriaId || 0,
    cidadeId: parseInt(document.getElementById("cidadeId").value) || 0,
    rua: document.getElementById("rua").value,
    numero: document.getElementById("numero").value,
    bairro: document.getElementById("bairro").value,
    complemento: document.getElementById("complemento").value,
    cep: document.getElementById("cep").value,
    latitude: parseFloat(document.getElementById("latitude").value) || 0,
    longitude: parseFloat(document.getElementById("longitude").value) || 0,
    grupoId: parseInt(document.getElementById("grupoid").value) || 0,
    mapaUrl: document.getElementById("mapaurl").value
  };

  try {
     const res = await fetch(`${API_BASE}/api/Estabelecimentos/Criar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify(data),
        
        });
    
    const text = await res.text();  // <-- isso mostra o erro do backend
    console.log("Resposta bruta do backend:", text);

    if (!res.ok) throw new Error("Erro ao cadastrar estabelecimento: " + res.status);

    const estab = await res.json();

   

    // =============================
    // UPLOAD IMAGENS
    // =============================

    // Fachada
    if (imagemFachada.files.length > 0) {
      await enviarImagemEstabelecimento(estab.id, imagemFachada.files[0], "fachada");
    }

    // Logo
    if (imagemLogo.files.length > 0) {
      await enviarImagemEstabelecimento(estab.id, imagemLogo.files[0], "logo");
    }

    // =============================
    // CATEGORIA (se ainda precisar vincular)
    // =============================
    if (categoriaId) {
      await vincularCategoria(estab.id, categoriaId);
    }

    alert("Estabelecimento cadastrado com sucesso!");

    // Limpa o formulário
    document.getElementById("formCadastro").reset();

  } catch (err) {
    alert("Erro: " + err.message);
    console.error(err);
  }
}


  async function vincularCategoria(estabelecimentoId, categoriaId) {
  const token = localStorage.getItem("token");
  await fetch(`${API_BASE}/api/Estabelecimentos/${estabelecimentoId}/vincular-categorias`, {
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
    const res = await fetch(`${API_BASE}/api/Estabelecimentos`, {
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
    fetch(`${API_BASE}/api/Estabelecimentos/${estab.id}`, {
      headers: { "Authorization": "Bearer " + token }
    })
    .then(r => {
      if (!r.ok) throw new Error(`Erro ao buscar detalhes do ID ${estab.id}: ${r.status}`);
      return r.json();
    })
    .catch(err => {
      console.warn("Falha ao buscar estabelecimento:", err);
      return null; // para evitar quebra no .forEach
    })
  )
);
    detalhes.filter(e => e !== null).forEach(estab => {
      const card = document.createElement("div");
      card.className = "card-estab";
      card.setAttribute("data-nome", estab.nome.toLowerCase());

      const imagem = document.createElement("img");
      const fachadaImg = estab.imagens?.filter(i => i.fachada).pop();
      const logoImg = estab.imagens?.find(img => img.logo);
      imagem.src = estab.imagemPrincipal || fachadaImg.url || logoImg.url || "./imgs/default-image.png";
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
            const res = await fetch(`${API_BASE}/api/Estabelecimentos/${estab.id}`, {
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
  if (!token) {
    alert("Você precisa estar logado para carregar as categorias.");
    return;
  }

  fetch(`${API_BASE}/api/CategoriasEstabelecimentos`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Erro ao buscar categorias: " + res.status);
    return res.json();
  })
  .then(data => {
    const select = document.getElementById("editCategoriaId");
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


async function carregarEstadosModal() {
  const estados = [
    { id: 1, nome: "São Paulo" },
    { id: 2, nome: "Rio de Janeiro" },
    { id: 3, nome: "Minas Gerais" }
  ];

  const selectEstado = document.getElementById("editEstadoId");
  estados.forEach(estado => {
    const option = document.createElement("option");
    option.value = estado.id;
    option.textContent = estado.nome;
    selectEstado.appendChild(option);
  });

   console.log("Estados carregados:", Array.from(selectEstado.options).map(o => o.textContent));

}


async function carregarCidades2() {
  const estadoId2 = document.getElementById("editEstadoId").value;
  const token = localStorage.getItem("token");

  if (!estadoId2 || !token) return;

  fetch(`${API_BASE}/api/Cidades/por-estado/${estadoId2}`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Erro ao buscar cidades.");
    return res.json();
  })
  .then(cidades => {
    const selectCidade = document.getElementById("editCidadeId");
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

  console.log("carregarCidades() chamado com estadoId =", estadoId2);
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
/*
document.getElementById("editLogoPreview").src =
  estab.imagemPrincipal || "./imgs/default-image.png";

document.getElementById("editFachadaPreview").src =
  estab.imagens && estab.imagens.length > 1
    ? estab.imagens[1]
    : "./imgs/default-image.png";
*/
  document.getElementById("modalEditarOverlay").style.display = "flex";
}




function fecharModalEditar() {
  document.getElementById("modalEditarOverlay").style.display = "none";
}

 async function salvarAlteracoesEstab() {
  const id = document.getElementById("editId").value;
  const token = localStorage.getItem("token");

  // Montagem do payload com os campos válidos exigidos pela API
  const payload = {
    nome: document.getElementById("editNomeEstab").value,
    razaoSocial: document.getElementById("editRazaoSocial").value,
    cnpj: document.getElementById("editCnpj").value,
    endereco: document.getElementById("editEndereco").value,
    telefone: document.getElementById("editTelefone").value,
    emailContato: document.getElementById("editEmailContato").value,
    ativo: document.getElementById("editAtivoEstab").checked,
    categoriaId: parseInt(document.getElementById("editCategoriaId").value),
    cidadeId: parseInt(document.getElementById("editCidadeId").value),
    rua: document.getElementById("editRua").value,
    numero: document.getElementById("editNumero").value,
    bairro: document.getElementById("editBairro").value,
    complemento: document.getElementById("editComplemento").value,
    cep: document.getElementById("editCep").value,
    latitude: parseFloat(document.getElementById("editLatitude").value),
    longitude: parseFloat(document.getElementById("editLongitude").value)
  };

  try {
    const res = await fetch(`${API_BASE}/api/Estabelecimentos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Erro ao atualizar");

    alert("Estabelecimento atualizado com sucesso!");
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

async function cadastrarCupom() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  function toIso(dt) {
    return dt ? new Date(dt).toISOString() : null;
  }

  // 1) MONTA O OBJETO DO CUPOM
  const data = {
    codigo: document.getElementById("codigo").value,
    titulo: document.getElementById("titulo").value,
    descricao: document.getElementById("descricao").value,
    modalTitulo: document.getElementById("modalTitulo").value,
    modalDescricao: document.getElementById("modalDescricao").value,
    tipo: document.getElementById("tipo").value,
    valorDesconto: parseFloat(document.getElementById("valorDesconto").value),
    valorMinimoCompra: parseFloat(document.getElementById("valorMinimoCompra").value) || 0,

    dataInicio: toIso(document.getElementById("dataInicio").value),
    dataExpiracao: toIso(document.getElementById("dataExpiracao").value),

    limiteUso: parseInt(document.getElementById("limiteUso").value) || 0,
    limiteUsoPorUsuario: parseInt(document.getElementById("limiteUsoPorUsuario").value) || 0,

    ativo: document.getElementById("ativo").checked,
    estabelecimentoId: parseInt(document.getElementById("estabelecimentoId").value),

    cartoesAceitosIds: document.getElementById("cartoes").value
      ? document.getElementById("cartoes").value.split(",").map(id => parseInt(id.trim()))
      : []
  };

  try {
    // 2) CRIA O CUPOM
    const res = await fetch(`${API_BASE}/api/Cupons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Erro ao criar cupom: " + res.status);

    const cupomCriado = await res.json();
    const cupomId = cupomCriado.id;

    console.log("Cupom criado com ID:", cupomId);

    // 3) ENVIO DAS IMAGENS (opcional)
    const galeriaFile = document.getElementById("imgGaleria").files[0];
    const modalFile = document.getElementById("imgModal").files[0];

    async function enviarImagem(tipo, file) {
      const form = new FormData();
      form.append("imagem", file);
      form.append("tipo", tipo); // "Galeria" ou "Modal"

      const imgRes = await fetch(`${API_BASE}/api/Cupons/${cupomId}/imagens`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token
        },
        body: form
      });

      if (!imgRes.ok) throw new Error("Erro ao enviar imagem " + tipo);
    }

    // GALERIA
    if (galeriaFile) {
      await enviarImagem("Galeria", galeriaFile);
      console.log("Imagem Galeria enviada!");
    }

    // MODAL
    if (modalFile) {
      await enviarImagem("Modal", modalFile);
      console.log("Imagem Modal enviada!");
    }

    alert("Cupom criado com sucesso!");

    document.getElementById("formCupom").reset();

  } catch (err) {
    alert("Erro: " + err.message);
    console.error(err);
  }
}



async function carregarTodosCupons() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para ver os cupons.");
    return;
  }

  const lista = document.getElementById("listaCupons");
  lista.innerHTML = "Carregando cupons...";

  try {
    // 1️⃣ Buscar todos os estabelecimentos
    const resEstab = await fetch(`${API_BASE}/api/Estabelecimentos`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!resEstab.ok) throw new Error("Erro ao buscar estabelecimentos: " + resEstab.status);

    const estabelecimentos = await resEstab.json();

    if (estabelecimentos.length === 0) {
      lista.innerHTML = "<p>Nenhum estabelecimento encontrado.</p>";
      return;
    }

    // 2️⃣ Buscar cupons de todos os estabelecimentos em paralelo
    const cuponsPorEstabelecimento = await Promise.all(
      estabelecimentos.map(estab =>
        fetch(`${API_BASE}/api/Cupons/por-estabelecimento/${estab.id}`, {
          headers: { "Authorization": "Bearer " + token }
        })
          .then(res => {
            if (!res.ok) return []; // sem cupons ou erro -> ignora
            return res.json();
          })
          .then(cupons => {
            // incluir nome do estabeleciemento em cada cupom
            return cupons.map(c => ({
              ...c,
              nomeEstabelecimento: estab.nome
            }));
          })
          .catch(err => {
            console.warn("Falha ao carregar cupons do estabelecimento:", estab.id, err);
            return [];
          })
      )
    );

    // 3️⃣ Juntar todos em um único array
    const todosCupons = cuponsPorEstabelecimento.flat();

    // Guarda em cache global (usado para "cupons vencidos")
    window._todosCupons = todosCupons;

    // 4️⃣ Exibir
    mostrarCuponsGerais(todosCupons);

  } catch (error) {
    console.error("Erro ao carregar todos os cupons:", error);
    lista.innerHTML = "<p>Erro ao carregar cupons.</p>";
  }
}


function mostrarCuponsGerais(cupons = []) {
  const lista = document.getElementById("listaCupons");
  lista.innerHTML = "";

  if (cupons.length === 0) {
    lista.innerHTML = "<p>Nenhum cupom encontrado.</p>";
    return;
  }

  cupons.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("cupom-card");

    div.innerHTML = `
      <h2>${c.nomeEstabelecimento}</h2>
      <p><strong>Título:</strong> ${c.titulo}</p>
      <p><strong>Código:</strong> ${c.codigo}</p>
      <p><strong>Desconto:</strong> ${c.valorDesconto} (${c.tipo})</p>
      <p><strong>Expira em:</strong> ${new Date(c.dataExpiracao).toLocaleString()}</p>

      <div class="cupom-actions">
        <button class="btn-editar" data-id="${c.id}">Editar</button>
        <button class="btn-excluir" data-id="${c.id}">Excluir</button>
      </div>

      <hr/>
    `;

    lista.appendChild(div);
  });

  // Eventos dos botões
  document.querySelectorAll(".btn-editar").forEach(btn =>
    btn.addEventListener("click", () => abrirModalEditarCupom(btn.dataset.id))
  );

  document.querySelectorAll(".btn-excluir").forEach(btn =>
    btn.addEventListener("click", () => excluirCupom(btn.dataset.id))
  );
}

async function excluirCupom(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este cupom?");
  if (!confirmar) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) {
      alert("Erro ao excluir cupom.");
      return;
    }

    alert("Cupom excluído com sucesso!");

    // recarrega os cupons
    carregarTodosCupons();

  } catch (err) {
    console.error("Erro ao excluir cupom:", err);
    alert("Erro ao excluir cupom.");
  }
}

async function salvarEdicaoCupom() {
  const id = document.getElementById("edit-id").value;

  if (!window._cupomEditando) {
    alert("Erro interno: cupom não carregado.");
    return;
  }

  const cupom = window._cupomEditando;

  // Atualiza TODOS os campos conforme o modelo esperado pela API
  cupom.codigo = document.getElementById("edit-codigo").value;
  cupom.titulo = document.getElementById("edit-titulo").value;
  cupom.descricao = document.getElementById("edit-descricao").value;
  cupom.modalTitulo = document.getElementById("edit-modalTitulo").value;
  cupom.modalDescricao = document.getElementById("edit-modalDescricao").value;
  cupom.tipo = document.getElementById("edit-tipo").value;

  cupom.valorDesconto = Number(document.getElementById("edit-desconto").value);
  cupom.valorMinimoCompra = Number(document.getElementById("edit-minimo").value);

  const inicio = document.getElementById("edit-inicio").value;
  const expiracao = document.getElementById("edit-expiracao").value;

  cupom.dataInicio = inicio.length === 10 ? `${inicio}T00:00:00Z` : inicio;
  cupom.dataExpiracao = expiracao.length === 10 ? `${expiracao}T00:00:00Z` : expiracao;

  cupom.limiteUso = Number(document.getElementById("edit-limite").value);
  cupom.limiteUsoPorUsuario = Number(document.getElementById("edit-limiteUsuario").value);

  cupom.ativo = document.getElementById("edit-ativo").checked;
  cupom.estabelecimentoId = Number(document.getElementById("edit-estabelecimento").value);

  cupom.cartoesAceitosIds = document.getElementById("edit-cartoes").value
  .split(",")
  .map(x => Number(x.trim()))
  .filter(x => !isNaN(x));

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(cupom)
    });

    if (!res.ok) {
      const erro = await res.text();
      console.error("Erro backend:", erro);
      alert("Erro ao salvar alterações.");
      return;
    }

    alert("Cupom atualizado com sucesso!");
    document.getElementById("modalEditarCupom").classList.remove("open");
    carregarTodosCupons();

  } catch (err) {
    console.error("Erro ao editar cupom:", err);
  }
}




async function abrirModalEditarCupom(id) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_BASE}/api/Cupons/${id}`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
      alert("Erro ao carregar dados do cupom.");
      return;
    }

    const cupom = await res.json();

    // Salva o cupom original para reenviar TUDO no PUT
    window._cupomEditando = cupom;

    document.getElementById("edit-id").value = cupom.id;
    document.getElementById("edit-codigo").value = cupom.codigo;
    document.getElementById("edit-titulo").value = cupom.titulo;
    document.getElementById("edit-descricao").value = cupom.descricao;
    document.getElementById("edit-modalTitulo").value = cupom.modalTitulo;
    document.getElementById("edit-modalDescricao").value = cupom.modalDescricao;
    document.getElementById("edit-tipo").value = cupom.tipo;
    document.getElementById("edit-desconto").value = cupom.valorDesconto;
    document.getElementById("edit-minimo").value = cupom.valorMinimoCompra;

    document.getElementById("edit-inicio").value = cupom.dataInicio.split("T")[0];
    document.getElementById("edit-expiracao").value = cupom.dataExpiracao.split("T")[0];

    document.getElementById("edit-limite").value = cupom.limiteUso;
    document.getElementById("edit-limiteUsuario").value = cupom.limiteUsoPorUsuario;

    document.getElementById("edit-ativo").checked = cupom.ativo;
    document.getElementById("edit-estabelecimento").value = cupom.estabelecimentoId;

    // SELECT MULTIPLE
    document.getElementById("edit-cartoes").value = cupom.cartoesAceitosIds;

    document.getElementById("modalEditarCupom").classList.add("open");

  } catch (err) {
    console.error("Erro ao carregar cupom:", err);
  }
}




async function mostrarCuponsVencidos() {
  const lista = document.getElementById("listaCuponsVencidos");

  if (!window._todosCupons) {
    lista.innerHTML = "<p>Carregando cupons...</p>";
    return;
  }

  const hoje = new Date();

  const vencidos = window._todosCupons.filter(cupom => {
    const expira = new Date(cupom.dataExpiracao);
    return expira < hoje; // já passou da data
  });

  if (vencidos.length === 0) {
    lista.innerHTML = "<p>Nenhum cupom vencido.</p>";
    return;
  }

  lista.innerHTML = "";
  vencidos.forEach(c => {
    const div = document.createElement("div");
    div.className = "cupom-item vencido";

    div.innerHTML = `
      <h3>${c.nomeEstabelecimento}</h3>
      <p><strong>Título:</strong> ${c.titulo}</p>
      <p><strong>Validade:</strong> ${new Date(c.dataExpiracao).toLocaleDateString("pt-BR")}</p>
      <p><strong>Descrição:</strong> ${c.descricao}</p>
      <br/>
      <hr>
    `;

    lista.appendChild(div);
  });
}








window.carregarCidades = carregarCidades;
window.cadastrarEstabelecimento = cadastrarEstabelecimento;
window.fecharModalEditar = fecharModalEditar;
window.salvarAlteracoesEstab = salvarAlteracoesEstab;
window.carregarCidades2 = carregarCidades2;
window.abrirModalEditar = abrirModalEditar;
window.cadastrarCupom = cadastrarCupom;
window.carregarTodosCupons = carregarTodosCupons;
window.mostrarCuponsGerais = mostrarCuponsGerais;
window.salvarEdicaoCupom = salvarEdicaoCupom;