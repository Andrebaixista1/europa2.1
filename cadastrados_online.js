import axios from 'axios';
import moment from 'moment';
import mysql from 'mysql2/promise';

// Configuração do logging
const logging = {
    info: (message) => console.log(`INFO: ${message}`),
    error: (message) => console.error(`ERROR: ${message}`)
};

// Configuração do MySQL
const dbConfig = {
    host: '45.179.91.180',
    user: 'planejamento',
    password: '899605aA@',
    database: 'inbis',
    port: 3306
};

// Cria um pool de conexões
const pool = mysql.createPool(dbConfig);

// URLs das APIs
const urls = [
    { empresa: "vieira", url: "https://api.newcorban.com.br/api/propostas/", username: "robo.planejamento", password: "Vieira@165" },
    { empresa: "abbcred", url: "https://api.newcorban.com.br/api/propostas/", username: "robo.planejamento", password: "Vieira@2024!" },
    { empresa: "impacto", url: "https://api.newcorban.com.br/api/propostas/", username: "planejamento", password: "Vieira@165" },
    { empresa: "franquiasazul", url: "https://api.newcorban.com.br/api/propostas/", username: "Azul.dev", password: "Vieira@165" },
    { empresa: "gmpromotora", url: "https://api.newcorban.com.br/api/propostas/", username: "planejamento", password: "Planejamento@1234" }
];

// Função para formatar as datas
function format_date(date_string) {
    if (!date_string) return null;
    try {
        let d = new Date(date_string);
        return d.toISOString().split('T')[0];
    } catch (error) {
        return null;
    }
}

// Função para buscar os dados da API
async function fetch_data_vd(start_date, end_date) {
    logging.info(`Buscando dados para o período: ${start_date} - ${end_date}`);
    const combined_data = [];

    for (const entry of urls) {
        logging.info(`Chamando API da empresa: ${entry.empresa}`);

        const payload = {
            auth: {
                username: entry.username,
                password: entry.password,
                empresa: entry.empresa
            },
            requestType: "getPropostas",
            filters: {
                data: {
                    tipo: "pagamento",
                    startDate: start_date,
                    endDate: end_date
                }
            }
        };

        try {
            const response = await axios.post(entry.url, payload, { headers: { "Content-Type": "application/json" } });
            logging.info(`Resposta recebida da empresa ${entry.empresa}: ${response.status}`);

            if (response.status === 200) {
                const data = response.data;
                for (const key in data) {
                    if (Object.prototype.hasOwnProperty.call(data, key) && typeof data[key] === 'object') {
                        const item = data[key];
                        combined_data.push({
                            empresa: entry.empresa,
                            data_formalizacao: format_date(item.datas?.data_formalizacao),
                            data_cadastro: format_date(item.datas?.cadastro),
                            cadastro: format_date(item.datas?.cadastro),
                            data_pagamento: format_date(item.datas?.pagamento),
                            pagamento: format_date(item.datas?.pagamento),
                            data_status_api: format_date(item.api?.data_status_api),
                            data_atualizacao_api: format_date(item.api?.data_atualizacao_api),
                            dt_ultima_tentativa_api: format_date(item.api?.dt_ultima_tentativa_api),
                            status_api: item.api?.status_api || "NÃO INFORMADO",
                            status_api_descricao: item.api?.status_api_descricao || "NÃO INFORMADO",
                            banco_averbacao: item.averbacao?.banco_averbacao || "NÃO INFORMADO",
                            agencia: item.averbacao?.agencia || "NÃO INFORMADO",
                            agencia_digito: item.averbacao?.agencia_digito || "NÃO INFORMADO",
                            conta: item.averbacao?.conta || "NÃO INFORMADO",
                            conta_digito: item.averbacao?.conta_digito || "NÃO INFORMADO",
                            pix: item.averbacao?.pix || "NÃO INFORMADO",
                            tipo_liberacao: item.averbacao?.tipo_liberacao || "NÃO INFORMADO",
                            inclusao: format_date(item.datas?.inclusao),
                            cancelado: format_date(item.datas?.cancelado),
                            concluido: format_date(item.datas?.concluido),
                            averbacao: format_date(item.datas?.averbacao),
                            retorno_saldo: format_date(item.datas?.retorno_saldo),
                            banco_id: item.proposta?.banco_id || "NÃO INFORMADO",
                            banco_nome: item.proposta?.banco_nome || "NÃO INFORMADO",
                            convenio_id: item.proposta?.convenio_id || "NÃO INFORMADO",
                            convenio_nome: item.proposta?.convenio_nome || "NÃO INFORMADO",
                            link_formalizacao: item.proposta?.link_formalizacao || "NÃO INFORMADO",
                            orgao: item.proposta?.orgao || "NÃO INFORMADO",
                            prazo: parseInt(item.proposta?.prazo) || 0,
                            promotora_id: item.proposta?.promotora_id || "NÃO INFORMADO",
                            promotora_nome: item.proposta?.promotora_nome || "NÃO INFORMADO",
                            produto_id: item.proposta?.produto_id || "NÃO INFORMADO",
                            produto_nome: item.proposta?.produto_nome || "NÃO INFORMADO",
                            proposta_id: item.proposta?.proposta_id || "NÃO INFORMADO",
                            proposta_id_banco: item.proposta?.proposta_id_banco || "NÃO INFORMADO",
                            proposta_reference_api: item.proposta?.proposta_reference_api || "NÃO INFORMADO",
                            valor_financiado: parseFloat(item.proposta?.valor_financiado) || 0,
                            valor_liberado: parseFloat(item.proposta?.valor_liberado) || 0,
                            valor_parcela: parseFloat(item.proposta?.valor_parcela) || 0,
                            valor_referencia: parseFloat(item.proposta?.valor_referencia) || 0,
                            valor_meta: parseFloat(item.proposta?.valor_meta) || 0,
                            valor_total_comissionado: parseFloat(item.proposta?.valor_total_comissionado) || 0,
                            valor_total_repassado_vendedor: parseFloat(item.proposta?.valor_total_repassado_vendedor) || 0,
                            valor_total_estornado: parseFloat(item.proposta?.valor_total_estornado) || 0,
                            valor_total_comissao_liq: parseFloat(item.proposta?.valor_total_comissao_liq) || 0,
                            valor_total_comissao_franquia: parseFloat(item.proposta?.valor_total_comissao_franquia) || 0,
                            valor_total_repasse_franquia: parseFloat(item.proposta?.valor_total_repasse_franquia) || 0,
                            tabela_id: item.proposta?.tabela_id || "NÃO INFORMADO",
                            tabela_nome: item.proposta?.tabela_nome || "NÃO INFORMADO",
                            flag_aumento: item.proposta?.flag_aumento || false,
                            srcc: item.proposta?.srcc || false,
                            seguro: item.proposta?.seguro || false,
                            proposta_duplicada: item.proposta?.proposta_duplicada || false,
                            taxa: parseFloat(item.proposta?.taxa) || 0,
                            usuariobanco: item.proposta?.usuarioBanco || "NÃO INFORMADO",
                            franquia_id: item.proposta?.franquia_id || "NÃO INFORMADO",
                            indicacao_id: item.proposta?.indicacao_id || "NÃO INFORMADO",
                            enviado_quali: item.proposta?.enviado_quali || "NÃO INFORMADO",
                            equipe_id: item.equipe_id || "NÃO INFORMADO",
                            equipe_nome: item.equipe_nome || "NÃO INFORMADO",
                            franquia_nome: item.franquia_nome || "NÃO INFORMADO",
                            origem: item.origem || "NÃO INFORMADO",
                            origem_id: item.origem_id || "NÃO INFORMADO",
                            status_id: item.status_id || "NÃO INFORMADO",
                            substatus: item.substatus || "NÃO INFORMADO",
                            status_nome: item.status_nome || "NÃO INFORMADO",
                            tipo_cadastro: item.tipo_cadastro || "NÃO INFORMADO",
                            data_status: format_date(item.data_status),
                            usuario_id: item.usuario_id || "NÃO INFORMADO",
                            vendedor_nome: item.vendedor_nome || "NÃO INFORMADO",
                            vendedor_id: item.vendedor_id || "NÃO INFORMADO",
                            digitador_id: item.digitador_id || "NÃO INFORMADO",
                            digitador_nome: item.digitador_nome || "NÃO INFORMADO",
                            vendedor_cargo_id: item.vendedor_cargo_id || "NÃO INFORMADO",
                            vendedor_participante: item.vendedor_participante || "NÃO INFORMADO",
                            vendedor_participante_nome: item.vendedor_participante_nome || "NÃO INFORMADO",
                            formalizador: item.formalizador || "NÃO INFORMADO",
                            formalizador_nome: item.formalizador_nome || "NÃO INFORMADO",
                            cliente_id: item.cliente?.cliente_id || "NÃO INFORMADO",
                            cliente_cpf: item.cliente?.cliente_cpf || "NÃO INFORMADO",
                            cliente_sexo: item.cliente?.cliente_sexo || "NÃO INFORMADO",
                            nascimento: item.cliente?.nascimento || "NÃO INFORMADO",
                            analfabeto: item.cliente?.analfabeto || "NÃO INFORMADO",
                            nao_perturbe: item.cliente?.nao_perturbe || "NÃO INFORMADO",
                            cliente_nome: item.cliente?.cliente_nome || "NÃO INFORMADO",
                            cep: item.cliente?.endereco?.cep || "NÃO INFORMADO",
                            cidade: item.cliente?.endereco?.cidade || "NÃO INFORMADO",
                            estado: item.cliente?.endereco?.estado || "NÃO INFORMADO",
                            telefone_id: item.cliente?.telefone_id || "NÃO INFORMADO",
                            documento_id: item.cliente?.documento_id || "NÃO INFORMADO",
                            beneficio_id: item.cliente?.beneficio_id || "NÃO INFORMADO",
                            endereco_id: item.cliente?.endereco_id || "NÃO INFORMADO",
                            matricula: item.cliente?.matricula || "NÃO INFORMADO",
                            nome_mae: item.cliente?.nome_mae || "NÃO INFORMADO",
                            renda: parseFloat(item.cliente?.renda) || 0,
                            especie: item.cliente?.especie || "NÃO INFORMADO",
                            ddb: item.cliente?.ddb || "NÃO INFORMADO",
                            possui_representante: item.cliente?.possui_representante || false,
                            logradouro: item.cliente?.endereco?.logradouro || "NÃO INFORMADO",
                            endereco_numero: item.cliente?.endereco?.endereco_numero || "NÃO INFORMADO",
                            bairro: item.cliente?.endereco?.bairro || "NÃO INFORMADO",
                            telefone_ddd: item.cliente?.telefones?.[item.cliente?.telefone_id]?.ddd || "NÃO INFORMADO",
                            telefone_numero: item.cliente?.telefones?.[item.cliente?.telefone_id]?.numero || "NÃO INFORMADO",
                            banco_refinanciador: item.proposta?.banco_nome || "NÃO INFORMADO",
                            beneficio: item.cliente?.beneficio_id || "NÃO INFORMADO",
                            id_proposta_banco: item.proposta?.proposta_id_banco || "NÃO INFORMADO"
                        });
                    }
                }
            } else {
                logging.info(`Status code diferente de 200 para ${entry.empresa}`);
            }
        } catch (e) {
            logging.error(`Erro ao acessar a API da empresa ${entry.empresa}: ${e.message}`);
        }
    }

    return combined_data;
}

const columns = [
    "empresa",
    "data_formalizacao",
    "data_cadastro",
    "cadastro",
    "data_pagamento",
    "pagamento",
    "data_status_api",
    "data_atualizacao_api",
    "dt_ultima_tentativa_api",
    "status_api",
    "status_api_descricao",
    "banco_averbacao",
    "agencia",
    "agencia_digito",
    "conta",
    "conta_digito",
    "pix",
    "tipo_liberacao",
    "inclusao",
    "cancelado",
    "concluido",
    "averbacao",
    "retorno_saldo",
    "banco_id",
    "banco_nome",
    "convenio_id",
    "convenio_nome",
    "link_formalizacao",
    "orgao",
    "prazo",
    "promotora_id",
    "promotora_nome",
    "produto_id",
    "produto_nome",
    "proposta_id",
    "proposta_id_banco",
    "proposta_reference_api",
    "valor_financiado",
    "valor_liberado",
    "valor_parcela",
    "valor_referencia",
    "valor_meta",
    "valor_total_comissionado",
    "valor_total_repassado_vendedor",
    "valor_total_estornado",
    "valor_total_comissao_liq",
    "valor_total_comissao_franquia",
    "valor_total_repasse_franquia",
    "tabela_id",
    "tabela_nome",
    "flag_aumento",
    "srcc",
    "seguro",
    "proposta_duplicada",
    "taxa",
    "usuariobanco",
    "franquia_id",
    "indicacao_id",
    "enviado_quali",
    "equipe_id",
    "equipe_nome",
    "franquia_nome",
    "origem",
    "origem_id",
    "status_id",
    "substatus",
    "status_nome",
    "tipo_cadastro",
    "data_status",
    "usuario_id",
    "vendedor_nome",
    "vendedor_id",
    "digitador_id",
    "digitador_nome",
    "vendedor_cargo_id",
    "vendedor_participante",
    "vendedor_participante_nome",
    "formalizador",
    "formalizador_nome",
    "cliente_id",
    "cliente_cpf",
    "cliente_sexo",
    "nascimento",
    "analfabeto",
    "nao_perturbe",
    "cliente_nome",
    "cep",
    "cidade",
    "estado",
    "telefone_id",
    "documento_id",
    "beneficio_id",
    "endereco_id",
    "matricula",
    "nome_mae",
    "renda",
    "especie",
    "ddb",
    "possui_representante",
    "logradouro",
    "endereco_numero",
    "bairro",
    "telefone_ddd",
    "telefone_numero",
    "banco_refinanciador",
    "beneficio",
    "id_proposta_banco"
];

async function upsert_data_vd(data) {
    if (!data || data.length === 0) {
        logging.info("Nenhum dado para inserir ou atualizar no MySQL.");
        return;
    }
    logging.info(`Inserindo ou atualizando ${data.length} registros no MySQL...`);

    const batch_size = 500;
    for (let i = 0; i < data.length; i += batch_size) {
        const batch = data.slice(i, i + batch_size);
        const rowsPlaceholders = batch
            .map(() => '(' + columns.map(() => '?').join(', ') + ')')
            .join(', ');
        const values = [];
        for (const item of batch) {
            for (const col of columns) {
                values.push(item[col]);
            }
        }
        const updateClause = columns
            .filter(col => col !== 'proposta_id')
            .map(col => `${col} = VALUES(${col})`)
            .join(', ');
        const query = `
            INSERT INTO cadastrados (${columns.join(', ')})
            VALUES ${rowsPlaceholders}
            ON DUPLICATE KEY UPDATE ${updateClause}
        `.trim();

        try {
            await pool.query(query, values);
            logging.info(`Lote ${Math.floor(i / batch_size) + 1} inserido/atualizado com sucesso.`);
        } catch (error) {
            logging.error(`Erro ao inserir lote ${Math.floor(i / batch_size) + 1}: ${error.message}`);
        }
    }
}

async function api_vd(start_date, end_date) {
    logging.info(`Iniciando API para o período: ${start_date} - ${end_date}`);
    const data = await fetch_data_vd(start_date, end_date);
    if (data && data.length > 0) {
        await upsert_data_vd(data);
    } else {
        logging.info("Nenhum dado retornado para inserção.");
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    try {
        const today = moment().toDate();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        let startDate = new Date(currentYear, currentMonth - 1, 1);
        let endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 14);

        if (endDate > today) {
            endDate = today;
        }

        const startDateStr = moment(startDate).format('YYYY-MM-DD');
        const endDateStr = moment(endDate).format('YYYY-MM-DD');

        logging.info(`Executando API de cadastrados para o período ${startDateStr} a ${endDateStr}...`);
        const data1 = await fetch_data_vd(startDateStr, endDateStr);
        await upsert_data_vd(data1);
        logging.info("🔹 Primeira execução finalizada!");
        await sleep(15000);

        startDate.setDate(startDate.getDate() + 15);
        endDate.setDate(startDate.getDate() + 14);

        if (endDate > today) {
            endDate = today;
        }

        const startDateStr2 = moment(startDate).format('YYYY-MM-DD');
        const endDateStr2 = moment(endDate).format('YYYY-MM-DD');

        logging.info(`Executando API de cadastrados para o período ${startDateStr2} a ${endDateStr2}...`);
        const data2 = await fetch_data_vd(startDateStr2, endDateStr2);
        await upsert_data_vd(data2);
        logging.info("🔹 Segunda execução finalizada!");
        
        logging.info("✅ Processamento finalizado! Indo para o próximo script...");
    } catch (error) {
        logging.error(`⚠️ Erro detectado: ${error.message}`);
    } finally {
        await pool.end();
    }
}

main().catch(err => logging.error(err));
