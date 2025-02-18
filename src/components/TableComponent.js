import React, { useState, useRef, useEffect } from "react";
import { Table } from "react-bootstrap";
import TableRow from "./TableRow";
import { toast } from "react-toastify";
import ChangelogOverlay from "./ChangelogOverlay";
import Footer from "./Footer";

const TableComponent = () => {
  const [rows, setRows] = useState([]);
  const [globalToken, setGlobalToken] = useState("");
  const [tokenTimestamp, setTokenTimestamp] = useState(0);
  const [clientIP, setClientIP] = useState("");
  const rowsRef = useRef(rows);

  const [apiStatus, setApiStatus] = useState("Carregando...");
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const message = "Você perderá todos os dados não salvos! Tem certeza que quer sair?";
      event.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [rows]);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setClientIP(data.ip))
      .catch(() => setClientIP("127.0.0.1"));
  }, []);

  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        const token = await getToken();
        const response = await fetch("https://api.ajin.io/v3/query-inss-balances/finder/await", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            identity: "34327258172",
            benefitNumber: "1595992488",
            attemps: 3
          })
        });

        if (response.status === 200) {
          const data = await response.json();
          if (data.name) {
            setApiStatus("API OK");
          } else {
            setApiStatus("API Fora");
          }
        } else if (response.status === 500) {
          setApiStatus("API Fora");
        } else {
          setApiStatus("API Instavel");
        }
      } catch {
        setApiStatus("API Fora");
      }
    };

    checkAPIStatus();
    const intervalId = setInterval(checkAPIStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const getApiColor = (status) => {
    if (status === "API OK") return "green";
    if (status === "API Instavel") return "goldenrod";
    return "red";
  };

  const formatDateTime = (date) => {
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
      date.getMinutes()
    )}:${pad(date.getSeconds())}`;
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
      setRows((prev) => [...prev, newRow]);
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
    reader.onload = (e) => {
      const text = e.target.result;
      const separator = text.indexOf(";") !== -1 ? ";" : ",";
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      if (lines.length < 2) {
        toast.error("Arquivo sem dados suficientes.");
        return;
      }
      const header = lines[0].split(separator).map((h) => h.trim());
      if (header.indexOf("cpf") === -1 || header.indexOf("nb") === -1) {
        toast.error('O CSV precisa conter as colunas "cpf" e "nb".');
        return;
      }
      const cpfIndex = header.indexOf("cpf");
      const nbIndex = header.indexOf("nb");
      const data = lines.slice(1).map((line) => {
        const cols = line.split(separator);
        return {
          cpf: cols[cpfIndex] ? cols[cpfIndex].trim() : "",
          nb: cols[nbIndex] ? cols[nbIndex].trim() : ""
        };
      });
      const lote = file.name.replace(/[ _\-.]/g, "_");
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, lote, total: data.length, csvData: data } : row))
      );
    };
    reader.readAsText(file);
  };

  const getToken = async () => {
    const TEN_HOURS = 10 * 3600000;
    const now = Date.now();
    if (globalToken && tokenTimestamp && now - tokenTimestamp < TEN_HOURS) {
      return globalToken;
    }
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
    } catch {
      toast.error("Erro ao gerar token da API");
      return "";
    }
  };

  const processCsvData = async (rowId) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, processing: true, status: "carregando" } : row)));
    let token = await getToken();

    const processLine = async () => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id === rowId) {
            if (row.status !== "carregando" || row.currentIndex >= row.total) {
              return { ...row, processing: false, status: "idle" };
            }
          }
          return row;
        })
      );

      const currentRow = rowsRef.current.find((r) => r.id === rowId);
      if (!currentRow || currentRow.status !== "carregando") return;

      if (currentRow.currentIndex >= currentRow.total) {
        toast.success(`Processamento do arquivo ${currentRow.lote} concluído!`);
        setRows((prev) =>
          prev.map((row) => (row.id === rowId ? { ...row, processing: false, status: "idle" } : row))
        );
        return;
      }

      const currentData = currentRow.csvData[currentRow.currentIndex];
      try {
        const responseBalance = await fetch("https://api.ajin.io/v3/query-inss-balances/finder/await", {
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
        const dataBalance = await responseBalance.json();

        const isHigienizado = dataBalance.benefitNumber && dataBalance.name && dataBalance.documentNumber;
        const processedData = {
          id: dataBalance.id,
          numero_beneficio: dataBalance.benefitNumber,
          numero_documento: dataBalance.documentNumber,
          nome: dataBalance.name,
          estado: dataBalance.state,
          pensao: dataBalance.alimony,
          data_nascimento: dataBalance.birthDate,
          tipo_bloqueio: dataBalance.blockType,
          data_concessao: dataBalance.grantDate,
          tipo_credito: dataBalance.creditType,
          limite_cartao_beneficio: dataBalance.benefitCardLimit,
          saldo_cartao_beneficio: dataBalance.benefitCardBalance,
          status_beneficio: dataBalance.benefitStatus,
          data_fim_beneficio: dataBalance.benefitEndDate,
          limite_cartao_consignado: dataBalance.consignedCardLimit,
          saldo_cartao_consignado: dataBalance.consignedCardBalance,
          saldo_credito_consignado: dataBalance.consignedCreditBalance,
          saldo_total_maximo: dataBalance.maxTotalBalance,
          saldo_total_utilizado: dataBalance.usedTotalBalance,
          saldo_total_disponivel: dataBalance.availableTotalBalance,
          data_consulta: dataBalance.queryDate,
          data_retorno_consulta: dataBalance.queryReturnDate,
          tempo_retorno_consulta: dataBalance.queryReturnTime,
          nome_representante_legal: dataBalance.legalRepresentativeName,
          banco_desembolso: dataBalance.disbursementBankAccount ? dataBalance.disbursementBankAccount.bank : null,
          agencia_desembolso: dataBalance.disbursementBankAccount ? dataBalance.disbursementBankAccount.branch : null,
          numero_conta_desembolso: dataBalance.disbursementBankAccount ? dataBalance.disbursementBankAccount.number : null,
          digito_conta_desembolso: dataBalance.disbursementBankAccount ? dataBalance.disbursementBankAccount.digit : null,
          numero_portabilidades: dataBalance.numberOfPortabilities,
          ip_origem: clientIP,
          data_hora_registro: formatDateTime(new Date()),
          nome_arquivo: currentRow.lote
        };

        const responseInsert = await fetch("https://api-js-in100.vercel.app/api/insert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(processedData)
        });

        if (!responseInsert.ok) {
          if (responseInsert.status === 403) {
            toast.error(`IP Externo Bloqueado\nPasse o IP<strong>${clientIP}</strong> para o seu gerente Expande ou diretamente para o planejamento`);
            return;
          } else {
            toast.error("Erro ao inserir dados");
            return;
          }
        }
        

        setRows((prev) =>
          prev.map((row) => {
            if (row.id === rowId) {
              return {
                ...row,
                higienizados: row.higienizados + (isHigienizado ? 1 : 0),
                semRespostaAPI: row.semRespostaAPI + (isHigienizado ? 0 : 1),
                currentIndex: row.currentIndex + 1
              };
            }
            return row;
          })
        );
      } catch {
        setRows((prev) =>
          prev.map((row) =>
            row.id === rowId
              ? { ...row, semRespostaAPI: row.semRespostaAPI + 1, currentIndex: row.currentIndex + 1 }
              : row
          )
        );
      }

      const updatedRow = rowsRef.current.find((r) => r.id === rowId);
      if (updatedRow && updatedRow.status === "carregando" && updatedRow.currentIndex < updatedRow.total) {
        setTimeout(() => {
          processLine();
        }, 5000);
      } else {
        setRows((prev) =>
          prev.map((row) => (row.id === rowId ? { ...row, processing: false, status: "idle" } : row))
        );
      }
    };
    processLine();
  };

  const handleGenerateToken = (id) => {
    processCsvData(id);
  };

  const handlePause = (id) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: "pausado", processing: false } : row)));
  };

  const handleResume = (id) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: "carregando", processing: true } : row)));
    processCsvData(id);
  };

  const handleDeleteRow = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.")) {
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      await fetch(`https://api-js-in100.vercel.app/api/delete?nome_arquivo=${row.lote}`, { method: "DELETE" });
      setRows((prev) => prev.filter((row) => row.id !== id));
      toast.success("Arquivo excluído com sucesso do banco de dados!");
    }
  };

  const handleDownload = async (id) => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.lote === "Sem arquivo") return;
    const response = await fetch(`https://api-js-in100.vercel.app/api/download?nome_arquivo=${row.lote}`);
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
        const keys = Object.keys(data[0]).filter((key) => !excludeKeys.includes(key));
        const header = keys.join(delimiter);
        const csvRows = data.map((item) =>
          keys
            .map((key) => {
              let value = item[key] !== null && item[key] !== undefined ? item[key].toString() : "";
              if (numericKeys.includes(key)) {
                value = value.replace(/\./g, ",");
              }
              return `"${value.replace(/"/g, '""')}"`;
            })
            .join(delimiter)
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

  const calculateTotal = () => rows.reduce((acc, row) => acc + row.total, 0);
  const totalHigienizados = rows.reduce((acc, row) => acc + row.higienizados, 0);
  const totalErros = rows.reduce((acc, row) => acc + row.semRespostaAPI, 0);
  const totalIndex = rows.reduce((acc, row) => acc + row.currentIndex, 0);
  const totalRows = calculateTotal();
  const totalPercent = totalRows > 0 ? (totalIndex / totalRows) * 100 : 0;

  return (
    <div className="container mt-4">
      <h1>Vieira in100 v2.1 - Higienização</h1>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-primary" onClick={addRow}>
          + Adicionar
        </button>
        <div className="d-flex align-items-center">
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: getApiColor(apiStatus),
              marginRight: "8px"
            }}
          />
          <strong>{apiStatus}</strong>
        </div>
      </div>

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
          {rows.map((row) => (
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
          <tr>
            <td colSpan="2">Total:</td>
            <td>{totalRows}</td>
            <td>
              {totalHigienizados}/{totalErros}
            </td>
            <td>{totalPercent.toFixed(2)}%</td>
            <td></td>
          </tr>
        </tbody>
      </Table>

      {showOverlay && <ChangelogOverlay onClose={() => setShowOverlay(false)} />}
      <Footer />
    </div>
  );
};

export default TableComponent;
