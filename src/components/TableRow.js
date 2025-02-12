import React from "react";
import { Button, OverlayTrigger, Tooltip, ProgressBar } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faPause, faPlay, faTrash, faDownload } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const TableRow = ({
  row,
  handleFileUpload,
  handleGenerateToken,
  handlePause,
  handleResume,
  handleDeleteRow,
  handleDownload,
}) => {
  return (
    <tr>
      {/* Coluna "Arquivo" */}
      <td>
        <input
          type="file"
          accept=".csv,.txt"
          className="form-control"
          onChange={(event) => handleFileUpload(event, row.id)}
          disabled={row.processing}
        />
      </td>
      {/* Coluna "Lote" */}
      <td>
        <input
          type="text"
          className="form-control"
          value={row.lote}
          readOnly
        />
      </td>
      {/* Coluna "Total" */}
      <td>
        <input
          type="text"
          className="form-control"
          value={row.total}
          readOnly
        />
      </td>
      {/* Coluna combinada "Higienizados/Erros" */}
      <td>
        <input
          type="text"
          className="form-control"
          value={`${row.higienizados} / ${row.semRespostaAPI}`}
          readOnly
        />
      </td>
      {/* Coluna "% Carregado" */}
      <td>
        <ProgressBar
          now={row.total > 0 ? (row.currentIndex / row.total) * 100 : 0}
          label={`${row.total > 0 ? ((row.currentIndex / row.total) * 100).toFixed(2) : 0}%`}
          animated
        />
      </td>
      {/* Coluna "Ação" */}
      <td className="d-flex gap-2">
        {row.processing ? (
          <OverlayTrigger overlay={<Tooltip>Pausar Higienização</Tooltip>}>
            <Button variant="warning" size="sm" onClick={() => handlePause(row.id)}>
              <FontAwesomeIcon icon={faPause} />
            </Button>
          </OverlayTrigger>
        ) : (
          row.currentIndex > 0 && row.currentIndex < row.total ? (
            <OverlayTrigger overlay={<Tooltip>Retomar Higienização</Tooltip>}>
              <Button variant="primary" size="sm" onClick={() => handleResume(row.id)}>
                <FontAwesomeIcon icon={faPlay} />
              </Button>
            </OverlayTrigger>
          ) : (
            <OverlayTrigger overlay={<Tooltip>Iniciar Higienização</Tooltip>}>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleGenerateToken(row.id)}
                disabled={row.lote === "Sem arquivo"}
              >
                <FontAwesomeIcon icon={faUpload} />
              </Button>
            </OverlayTrigger>
          )
        )}
        <OverlayTrigger overlay={<Tooltip>Excluir Linha</Tooltip>}>
          <Button variant="danger" size="sm" onClick={() => handleDeleteRow(row.id)} disabled={row.processing}>
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger overlay={<Tooltip>Baixar CSV</Tooltip>}>
          <Button
            variant="info"
            size="sm"
            onClick={() => handleDownload(row.id)}
            disabled={row.processing || row.lote === "Sem arquivo"}
          >
            <FontAwesomeIcon icon={faDownload} />
          </Button>
        </OverlayTrigger>
      </td>
    </tr>
  );
};

export default TableRow;
