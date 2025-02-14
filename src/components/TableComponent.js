import React, { useState, useRef, useEffect } from "react";
import { Table } from "react-bootstrap";
import TableRow from "./TableRow";
import { toast } from "react-toastify";

const TableComponent = () => {
  const [rows, setRows] = useState([]);
  const [globalToken, setGlobalToken] = useState("");
  const [tokenTimestamp, setTokenTimestamp] = useState(0);
  const [clientIP, setClientIP] = useState("");
  const rowsRef = useRef(rows);

  useEffect(() => { rowsRef.current = rows; }, [rows]);

  // Confirm before unload (reloading or closing the page)
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const message = "Você perderá todos os dados não salvos! Tem certeza que quer sair?";
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [rows]);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setClientIP(data.ip))
      .catch(() => setClientIP("127.0.0.1"));
  }, []);

  const formatDateTime = (date) => {
    const pad = n => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const addRow = () => {
    if (rows.length < 10) {
      const newRow = {
        id: Date.now(),
        lote: "Sem arquivo",
        total: 0,
        csvData: [],
        currentIndex: 0,
        higienizados: 0,
        semRespostaAPI: 0,
        processing: false,
        status: "idle"
      };
      setRows(prev => [...prev, newRow]);
    } else {
      toast.error("Limite de 10 linhas atingido! Não é possível adicionar mais.");
    }
  };

  const handleFileUpload = (event, id) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("O arquivo deve ser do tipo CSV.");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const separator = text.indexOf(";") !== -1 ? ";" : ",";
      const lines = text.split("\n").filter(line => line.trim() !== "");
      if (lines.length < 2) { toast.error("Arquivo sem dados suficientes."); return; }
      const header = lines[0].split(separator).map(h => h.trim());
      if (header.indexOf("cpf") === -1 || header.indexOf("nb") === -1) {
        toast.error('O CSV precisa conter as colunas "cpf" e "nb".');
        return;
      }
      const cpfIndex = header.indexOf("cpf");
      const nbIndex = header.indexOf("nb");
      const data = lines.slice(1).map(line => {
        const cols = line.split(separator);
        return {
          cpf: cols[cpfIndex] ? cols[cpfIndex].trim() : "",
          nb: cols[nbIndex] ? cols[nbIndex].trim() : ""
        };
      });
      const lote = file.name.replace(/[ _\-.]/g, "_");
      setRows(prev => prev.map(row => row.id === id ? { ...row, lote, total: data.length, csvData: data } : row));
    };
    reader.readAsText(file);
  };

  const getToken = async () => {
    const TEN_HOURS = 10 * 3600000;
    const now = Date.now();
    if (globalToken && tokenTimestamp && now - tokenTimestamp < TEN_HOURS) return globalToken;
    try {
      const response = await fetch("https://api.ajin.io/v3/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessId: "kamorim.vieiracred@qualiconsig.com.br",
          password: "Nova@25*",
          authKey: "",
          type: "",
          stayConnected: false
        })
      });
      const data = await response.json();
      setGlobalToken(data.token);
      setTokenTimestamp(Date.now());
      return data.token;
    } catch (error) {
      toast.error("Erro ao gerar token da API");
      return "";
    }
  };

  const processCsvData = async (rowId) => {
    setRows(prev => prev.map(row => row.id === rowId ? { ...row, processing: true, status: "carregando" } : row));
    let token = await getToken();
    const processLine = async () => {
      setRows(prev => prev.map(row => {
        if (row.id === rowId) {
          if (row.status !== "carregando" || row.currentIndex >= row.total) {
            return { ...row, processing: false, status: "idle" };
          }
        }
        return row;
      }));

      const currentRow = rowsRef.current.find(r => r.id === rowId);
      if (!currentRow || currentRow.status !== "carregando") return;
      if (currentRow.currentIndex >= currentRow.total) {
        toast.success(`Processamento do arquivo ${currentRow.lote} concluído!`);
        setRows(prev => prev.map(row => row.id === rowId ? { ...row, processing: false, status: "idle" } : row));
        return;
      }
      const currentData = currentRow.csvData[currentRow.currentIndex];
      try {
        const response = await fetch("https://api.ajin.io/v3/query-inss-balances/finder/await", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            identity: currentData.cpf,
            benefitNumber: currentData.nb,
            attemps: 3
          })
        });
        const data = await response.json();
        const isHigienizado = data.benefitNumber && data.name && data.documentNumber;
        const processedData = {
          id: data.id,
          numero_beneficio: data.benefitNumber,
          numero_documento: data.documentNumber,
          nome: data.name,
          estado: data.state,
          pensao: data.alimony,
          data_nascimento: data.birthDate,
          tipo_bloqueio: data.blockType,
          data_concessao: data.grantDate,
          tipo_credito: data.creditType,
          limite_cartao_beneficio: data.benefitCardLimit,
          saldo_cartao_beneficio: data.benefitCardBalance,
          status_beneficio: data.benefitStatus,
          data_fim_beneficio: data.benefitEndDate,
          limite_cartao_consignado: data.consignedCardLimit,
          saldo_cartao_consignado: data.consignedCardBalance,
          saldo_credito_consignado: data.consignedCreditBalance,
          saldo_total_maximo: data.maxTotalBalance,
          saldo_total_utilizado: data.usedTotalBalance,
          saldo_total_disponivel: data.availableTotalBalance,
          data_consulta: data.queryDate,
          data_retorno_consulta: data.queryReturnDate,
          tempo_retorno_consulta: data.queryReturnTime,
          nome_representante_legal: data.legalRepresentativeName,
          banco_desembolso: data.disbursementBankAccount ? data.disbursementBankAccount.bank : null,
          agencia_desembolso: data.disbursementBankAccount ? data.disbursementBankAccount.branch : null,
          numero_conta_desembolso: data.disbursementBankAccount ? data.disbursementBankAccount.number : null,
          digito_conta_desembolso: data.disbursementBankAccount ? data.disbursementBankAccount.digit : null,
          numero_portabilidades: data.numberOfPortabilities,
          ip_origem: clientIP,
          data_hora_registro: formatDateTime(new Date()),
          nome_arquivo: currentRow.lote
        };
        await fetch("https://45.179.91.180:5000/api/insert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(processedData)
        });
        setRows(prev => prev.map(row => {
          if (row.id === rowId) {
            return {
              ...row,
              higienizados: row.higienizados + (isHigienizado ? 1 : 0),
              semRespostaAPI: row.semRespostaAPI + (isHigienizado ? 0 : 1),
              currentIndex: row.currentIndex + 1
            };
          }
          return row;
        }));
      } catch (error) {
        setRows(prev => prev.map(row =>
          row.id === rowId ? { ...row, semRespostaAPI: row.semRespostaAPI + 1, currentIndex: row.currentIndex + 1 } : row
        ));
      }
      const updatedRow = rowsRef.current.find(r => r.id === rowId);
      if (updatedRow && updatedRow.status === "carregando" && updatedRow.currentIndex < updatedRow.total) {
        setTimeout(() => { processLine(); }, 3000);
      } else {
        setRows(prev => prev.map(row => row.id === rowId ? { ...row, processing: false, status: "idle" } : row));
      }
    };
    processLine();
  };

  const handleGenerateToken = id => { processCsvData(id); };

  const handlePause = id => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, status: "pausado", processing: false } : row));
  };

  const handleResume = id => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, status: "carregando", processing: true } : row));
    processCsvData(id);
  };

  const handleDeleteRow = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.")) {
      const row = rows.find(r => r.id === id);
      if (!row) return;
      await fetch(`https://45.179.91.180:5000/api/delete?nome_arquivo=${row.lote}`, { method: "DELETE" });
      setRows(prev => prev.filter(row => row.id !== id));
      toast.success("Arquivo excluído com sucesso do banco de dados!");
    }
  };

  const handleDownload = async id => {
    const row = rows.find(r => r.id === id);
    if (!row || row.lote === "Sem arquivo") return;
    const response = await fetch(`https://45.179.91.180:5000/api/download?nome_arquivo=${row.lote}`);
    const result = await response.json();
    if (result.success && result.data && result.data.length > 0) {
      const excludeKeys = ["id", "ip_origem", "data_hora_registro", "nome_arquivo"];
      const numericKeys = [
        "limite_cartao_beneficio",
        "saldo_cartao_beneficio",
        "limite_cartao_consignado",
        "saldo_cartao_consignado",
        "saldo_credito_consignado",
        "saldo_total_maximo",
        "saldo_total_utilizado",
        "saldo_total_disponivel"
      ];
      const convertToCSV = (data, delimiter = ";") => {
        const keys = Object.keys(data[0]).filter(key => !excludeKeys.includes(key));
        const header = keys.join(delimiter);
        const csvRows = data.map(item =>
          keys.map(key => {
            let value = item[key] !== null && item[key] !== undefined ? item[key].toString() : "";
            if (numericKeys.includes(key)) {
              value = value.replace(/\./g, ",");
            }
            return `"${value.replace(/"/g, '""')}"`;
          }).join(delimiter)
        );
        return header + "\n" + csvRows.join("\n");
      };
      const csvString = convertToCSV(result.data, ";");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${row.lote}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.info(`Download realizado para o arquivo ${row.lote}`);
    } else {
      toast.error("Erro ao realizar download ou nenhum dado encontrado.");
    }
  };

  // Calculando o total
  const calculateTotal = () => {
    return rows.reduce((acc, row) => acc + row.total, 0);
  };

  return (
    <div className="container mt-4">
      <h1>Vieira in100 v2.1 - Higienização</h1>
      <button className="btn btn-primary mb-3" onClick={addRow}>+ Adicionar</button>
      <Table bordered striped responsive>
        <thead>
          <tr>
            <th>Arquivo</th>
            <th>Lote</th>
            <th>Total</th>
            <th>Higienizados/Erros</th>
            <th>% Carregado</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <TableRow
              key={row.id}
              row={row}
              handleFileUpload={handleFileUpload}
              handleGenerateToken={handleGenerateToken}
              handlePause={handlePause}
              handleResume={handleResume}
              handleDeleteRow={handleDeleteRow}
              handleDownload={handleDownload}
            />
          ))}
          {/* Linha total */}
          <tr>
            <td colSpan="2">Total:</td>
            <td>{calculateTotal()}</td>
            <td colSpan="3"></td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default TableComponent;
