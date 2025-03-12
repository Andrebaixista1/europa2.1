// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: '45.179.91.180',
  port: 3306,
  user: 'planejamento',
  password: '899605aA@',
  database: 'inbis'
});

// Inserção com atualização se já existir o mesmo CPF e NB (supondo índice único em numero_documento e numero_beneficio)
app.post('/api/insert', (req, res) => {
  const data = req.body;
  const query = `
    INSERT INTO inss_higienizado (
      id,
      numero_beneficio,
      numero_documento,
      nome,
      estado,
      pensao,
      data_nascimento,
      tipo_bloqueio,
      data_concessao,
      tipo_credito,
      limite_cartao_beneficio,
      saldo_cartao_beneficio,
      status_beneficio,
      data_fim_beneficio,
      limite_cartao_consignado,
      saldo_cartao_consignado,
      saldo_credito_consignado,
      saldo_total_maximo,
      saldo_total_utilizado,
      saldo_total_disponivel,
      data_consulta,
      data_retorno_consulta,
      tempo_retorno_consulta,
      nome_representante_legal,
      banco_desembolso,
      agencia_desembolso,
      numero_conta_desembolso,
      digito_conta_desembolso,
      numero_portabilidades,
      ip_origem,
      data_hora_registro,
      nome_arquivo
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      nome = VALUES(nome),
      estado = VALUES(estado),
      pensao = VALUES(pensao),
      data_nascimento = VALUES(data_nascimento),
      tipo_bloqueio = VALUES(tipo_bloqueio),
      data_concessao = VALUES(data_concessao),
      tipo_credito = VALUES(tipo_credito),
      limite_cartao_beneficio = VALUES(limite_cartao_beneficio),
      saldo_cartao_beneficio = VALUES(saldo_cartao_beneficio),
      status_beneficio = VALUES(status_beneficio),
      data_fim_beneficio = VALUES(data_fim_beneficio),
      limite_cartao_consignado = VALUES(limite_cartao_consignado),
      saldo_cartao_consignado = VALUES(saldo_cartao_consignado),
      saldo_credito_consignado = VALUES(saldo_credito_consignado),
      saldo_total_maximo = VALUES(saldo_total_maximo),
      saldo_total_utilizado = VALUES(saldo_total_utilizado),
      saldo_total_disponivel = VALUES(saldo_total_disponivel),
      data_consulta = VALUES(data_consulta),
      data_retorno_consulta = VALUES(data_retorno_consulta),
      tempo_retorno_consulta = VALUES(tempo_retorno_consulta),
      nome_representante_legal = VALUES(nome_representante_legal),
      banco_desembolso = VALUES(banco_desembolso),
      agencia_desembolso = VALUES(agencia_desembolso),
      numero_conta_desembolso = VALUES(numero_conta_desembolso),
      digito_conta_desembolso = VALUES(digito_conta_desembolso),
      numero_portabilidades = VALUES(numero_portabilidades),
      ip_origem = VALUES(ip_origem),
      data_hora_registro = VALUES(data_hora_registro),
      nome_arquivo = VALUES(nome_arquivo)
  `;
  const params = [
    data.id,
    data.numero_beneficio,
    data.numero_documento,
    data.nome,
    data.estado,
    data.pensao,
    data.data_nascimento,
    data.tipo_bloqueio,
    data.data_concessao,
    data.tipo_credito,
    data.limite_cartao_beneficio,
    data.saldo_cartao_beneficio,
    data.status_beneficio,
    data.data_fim_beneficio,
    data.limite_cartao_consignado,
    data.saldo_cartao_consignado,
    data.saldo_credito_consignado,
    data.saldo_total_maximo,
    data.saldo_total_utilizado,
    data.saldo_total_disponivel,
    data.data_consulta,
    data.data_retorno_consulta,
    data.tempo_retorno_consulta,
    data.nome_representante_legal,
    data.banco_desembolso,
    data.agencia_desembolso,
    data.numero_conta_desembolso,
    data.digito_conta_desembolso,
    data.numero_portabilidades,
    data.ip_origem,
    data.data_hora_registro,
    data.nome_arquivo
  ];
  pool.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, results });
  });
});

// DELETE: exclui todos os registros com o mesmo nome_arquivo
app.delete('/api/delete', (req, res) => {
  const { nome_arquivo } = req.query;
  if (!nome_arquivo) return res.status(400).json({ success: false, message: "nome_arquivo é obrigatório" });
  const query = 'DELETE FROM inss_higienizado WHERE nome_arquivo = ?';
  pool.query(query, [nome_arquivo], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, results });
  });
});

// GET: retorna os registros com o mesmo nome_arquivo para download
app.get('/api/download', (req, res) => {
  const { nome_arquivo } = req.query;
  if (!nome_arquivo) return res.status(400).json({ success: false, message: "nome_arquivo é obrigatório" });
  const query = 'SELECT * FROM inss_higienizado WHERE nome_arquivo = ?';
  pool.query(query, [nome_arquivo], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: results });
  });
});

app.listen(3005, () => console.log("Server running on port 3005"));
