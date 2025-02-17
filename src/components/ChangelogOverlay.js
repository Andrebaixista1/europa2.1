import React, { useEffect, useState } from "react";

const ChangelogOverlay = ({ onClose }) => {
  const [visible, setVisible] = useState(false);

  // Ao montar, ativa a animação para exibir o overlay
  useEffect(() => {
    setVisible(true);
  }, []);

  const overlayStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    opacity: visible ? 1 : 0,
    transition: "opacity 0.5s ease-in-out"
  };

  const overlayContentStyles = {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "600px",
    textAlign: "left"
  };

  return (
    <div style={overlayStyles}>
      <div style={overlayContentStyles}>
        <h2>Últimas Mudanças</h2>
        <br/>
        <div>Sua base não esta sendo higienizada ? Mande seu IP (<a href="https://meuip.com.br" target="_blank">https://meuip.com.br</a>) para o <b>Gerente Expande</b> ou <b>Planejamento </b>.</div>
        <br/>
        <ul>
          <li>17/02 - Nova tela de novidades.</li>
          <li>17/02 - Adicionada verificação de status da API.</li>
          <li>17/02 - Quantidade de total no final das colunas.</li>
          <li>17/02 - Agora teremos restrição de IP para sua segurança, se perceber<br/> que o arquivo não esta sendo higienizado entre em contato com o seu <b>Gerente Expande</b> ou com <b>Planejamento.</b> <br/></li>
        </ul>
        <br/>
        <div><b>Obs.:</b> <i>Envie o IP se nenhum nome estiver sendo higienizado !</i></div>
        <div className="text-right mt-3">
          <button className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangelogOverlay;
