const DATABASE_URL = "postgresql://neondb_owner:npg_ABiGwmFr1U8c@ep-twilight-sound-ac8b61fo-pooler.sa-east-1.aws.neon.tech/idealab_db?sslmode=require&channel_binding=require";
const host = new URL(DATABASE_URL).host;
const neonHttpEndpoint = `https://${host}/sql`;

async function executarQueryNeon(querySQL, parametros = []) {
    try {
        const resposta = await fetch(neonHttpEndpoint, {
            method: 'POST',
            headers: {


                'Neon-Connection-String': DATABASE_URL,
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({
                query: querySQL,
                params: parametros
            })
        });

        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            throw new Error(`Erro HTTP ${resposta.status}: ${erroTexto}`);
        }

        const dados = await resposta.json();
        return dados.rows;

    } catch (erro) {
        console.error("Falha ao comunicar com o banco de dados:", erro);
        return null;
    }
}


// --- R (READ / LER) ---
export async function consultarDiretoComFetch() {
    console.log("Buscando todos os usuários no banco...");
    const query = 'SELECT * FROM sugestao ORDER BY enviado_em DESC';

    const linhas = await executarQueryNeon(query);
    return linhas || [];
}

// --- C (CREATE / CRIAR) ---
export async function insertSugestao(autor, mensagem, area) {
    console.log("Cadastrando sugestão no banco:", { autor, mensagem, area });
    const query = 'INSERT INTO sugestao (autor, mensagem, area) VALUES ($1, $2, $3) RETURNING *';
    const params = [autor, mensagem, area];

    const linhas = await executarQueryNeon(query, params);
    return linhas !== null;
}

// --- U (UPDATE / ATUALIZAR) ---
export async function sqlAtualizarSugestao(id, autor, mensagem, area) {
    console.log("Atualizando sugestão no banco. ID:", id);
    const query = 'UPDATE sugestao SET autor = $1, mensagem = $2, area = $3 WHERE id = $4 RETURNING *';
    const params = [autor, mensagem, area, id];

    const linhas = await executarQueryNeon(query, params);
    return linhas !== null;
}

// --- D (DELETE / DELETAR) ---
export async function sqlDeletarSugestao(id) {
    console.log("Deletando sugestão do banco. ID:", id);
    const query = 'DELETE FROM sugestao WHERE id = $1 RETURNING *';
    const params = [id];

    const linhas = await executarQueryNeon(query, params);
    return linhas !== null;
}