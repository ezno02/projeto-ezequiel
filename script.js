import {
    consultarDiretoComFetch, 
    insertSugestao, 
    sqlDeletarSugestao, 
    sqlAtualizarSugestao 
} from './script_db.js';

/* ==========================================================================
   PASSO 2: VARIÁVEIS GLOBAIS E ELEMENTOS DA TELA
   Pegamos os elementos do HTML que vamos manipular pelo JavaScript.
   ========================================================================== */
const formUsuario = document.getElementById('form-usuario');
const tabelaSugestao = document.getElementById('tabela-corpo');
const btnCancelar = document.getElementById('btn-cancelar');
const formTitulo = document.getElementById('form-titulo');
const btnSalvarText = document.getElementById('btn-salvar-text');


/* ==========================================================================
   PASSO 3: FUNÇÕES DE INTERFACE (Visuais)
   Funções que apenas mudam coisas na tela, sem mexer no banco de dados.
   ========================================================================== */

// Função para limpar o formulário e voltar ao estado de "Novo Cadastro"
function limparFormulario() {
    formUsuario.reset();
    document.getElementById('user-id').value = ''; // Limpa o ID oculto
    
    // Restaura os textos originais
    formTitulo.textContent = "Nova Sugestão";
    btnSalvarText.textContent = "💡 Enviar Sugestão";
    btnCancelar.classList.add('hidden'); // Esconde o botão cancelar
}

// Função para mostrar notificações bonitas (Toasts) na tela
function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const cores = { success: 'bg-green-600', error: 'bg-rose-600', info: 'bg-blue-600' };
    const icones = { success: 'fa-check-circle', error: 'fa-exclamation-triangle', info: 'fa-info-circle' };

    toast.className = `toast-enter ${cores[tipo]} toast-message`;
    toast.innerHTML = `<i class="fas ${icones[tipo]} text-lg"></i> <span>${mensagem}</span>`;
    
    container.appendChild(toast);
    
    // Remove o toast após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


/* ==========================================================================
   PASSO 4: CRUD - READ (Ler e Listar Dados)
   ========================================================================== */
async function criarTabelaSugestao() {
    // 1. Busca os dados no banco
    const dados = await consultarDiretoComFetch();

    // 2. Limpa a tabela antes de preenchê-la com os novos dados
    tabelaSugestao.innerHTML = '';

    // 3. Verifica se tem dados. Se não tiver, sai da função.
    if (!dados || dados.length === 0) {
        tabelaSugestao.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhum usuário encontrado.</td></tr>`;
        return;
    }

    // 4. Para cada usuário, cria uma linha (<tr>) na tabela
    dados.forEach(sugestao => {
        const linha = document.createElement('tr');
        console.log(sugestao)
        
        // Define qual "badge" (etiqueta colorida) usar com base no area
        // let statusBadge = '<span class="badge badge-'+ sugestao.area.toLowerCase() +'">RH</span>';
        // switch (sugestao.area) {
        //     case 'RH':
        //         statusBadge ='<span class="badge badge-rh">RH</span>';
        //         break;
        //     case 'Atendimento':
        //         statusBadge ='<span class="badge badge-atendimento">Atendimento</span>';
        //         break;
        //     case 'TI':
        //         statusBadge ='<span class="badge badge-ti">TI</span>';
        //         break;
        //     case 'Infrestrutura':
        //         statusBadge ='<span class="badge badge-infra">Infretrutura</span>';
        //         break;
        //     case 'Comunicacao':
        //         statusBadge ='<span class="badge badge-comunicacao">Comunicacao</span>';
        //         break;
        //     case 'Outros':
        //         statusBadge ='<span class="badge badge-outros">RH</span>';
        //         break;
        // }

        linha.innerHTML = `
            <td class="cell-id">#${sugestao.id}</td>
            <td>
                <p class="cell-name">${sugestao.autor}</p>
                <p class="cell-mensagem">${sugestao.mensagem}</p>
            </td>
            <td><span class="badge badge-${sugestao.area.toLowerCase()}">${sugestao.area}</span></td>
            <td>
                <div class="action-container">
                    <button onclick="prepararEdicao(${sugestao.id}, '${sugestao.autor}', '${sugestao.mensagem}', '${sugestao.area}')" class="btn-action btn-edit" title="Editar">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button onclick="deletarMensagem(${sugestao.id})" class="btn-action btn-delete" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tabelaSugestao.appendChild(linha);
    });
}


/* ==========================================================================
   PASSO 5: CRUD - CREATE & UPDATE (Criar ou Atualizar Dados)
   ========================================================================== */

// Prepara o formulário com os dados da linha clicada
window.prepararEdicao = function(id, nome, mensagem, area) {
    document.getElementById('user-id').value = id; // Preenche o ID oculto (Isso diz ao sistema que é uma edição!)
    document.getElementById('user-nome').value = nome;
    document.getElementById('user-mensagem').value = mensagem;
    document.getElementById('user-area').value = area;

    // Muda os textos visualmente para indicar que estamos a editar
    formTitulo.textContent = "Editar Sugestão";
    btnSalvarText.textContent = "Atualizar Sugestão";
    btnCancelar.classList.remove('hidden'); // Mostra o botão cancelar
}

// Uma única função que decide se vai Criar ou Atualizar com base no ID oculto
async function lidarComEnvioDoFormulario(event) {
    event.preventDefault(); // Evita que a página recarregue ao enviar o formulário

    // Pega os valores dos inputs
    const id = document.getElementById('user-id').value;
    const nome = document.getElementById('user-nome').value;
    const mensagem = document.getElementById('user-mensagem').value;
    const area = document.getElementById('user-area').value;

    let sucesso = false;

    // Se tem ID, é uma ATUALIZAÇÃO (UPDATE)
    if (id) {
        console.log("A atualizar sugestão:", { id, nome, mensagem, area });
        sucesso = await sqlAtualizarSugestao(id, nome, mensagem, area);
        if (sucesso) mostrarToast("Sugestão atualizada com sucesso!", "success");
    }
    // Se não tem ID, é uma CRIAÇÃO (CREATE)
    else {
        console.log("A criar nova sugestão:", { nome, mensagem, area });
        sucesso = await insertSugestao(nome, mensagem, area);
        if (sucesso) mostrarToast("Sugestão cadastrada com sucesso!", "success");
    }

    // Tratamento de Erro Geral
    if (!sucesso) {
        mostrarToast("Ocorreu um erro na operação.", "error");
        return; // Sai da função sem limpar o formulário, para a pessoa tentar de novo
    }

    // Se deu tudo certo, limpa o formulário e recarrega a tabela
    limparFormulario();
    criarTabelaSugestao();
}


/* ==========================================================================
   PASSO 6: CRUD - DELETE (Excluir Dados)
   ========================================================================== */
window.deletarMensagem = async function(id) {
    if (confirm("Tem certeza que deseja excluir esta mensagem?")) {
        const sucesso = await sqlDeletarSugestao(id);

        if (sucesso) {
            mostrarToast("Mensagem excluída com sucesso!", "success");
            criarTabelaSugestao(); // Recarrega a tabela para a linha sumir
        } else {
            mostrarToast("Erro ao excluir mensagem.", "error");
        }
    }
}


/* ==========================================================================
   PASSO 7: FUNÇÕES DE CONFIGURAÇÃO DO TOPO (Neon DB)
   ========================================================================== */
window.salvarConfiguracoes = function() {
    console.log("A ligar ao Neon...");
    mostrarToast("Conexão configurada (Simulação)", "info");
}

window.usarMock = function() {
    console.log("Modo Simulação ativado!");
    mostrarToast("Modo de simulação ativado", "info");
}


/* ==========================================================================
   PASSO 8: INICIALIZAÇÃO E EVENTOS
   ========================================================================== */

// Atrela a função unificada ao envio (submit) do formulário
formUsuario.addEventListener('submit', lidarComEnvioDoFormulario);

// Atrela a limpeza do formulário ao botão de cancelar
btnCancelar.addEventListener('click', limparFormulario);

// Quando o ficheiro JS é carregado, chama a tabela pela primeira vez
criarTabelaSugestao();