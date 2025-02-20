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
        <div>IP bloqueado ? Acesse (<a href="https://meuip.com.br" target="_blank">https://meuip.com.br</a>) e envie para o <b>Gerente Expande</b> ou <b>Planejamento </b>.</div>
        <br/>
        <ul>
          {/* <li>17/02 - Adicionada verificação de status da API.</li> */}
          <li>17/02 - Quantidade de total no final das colunas.</li>
          <li>17/02 - Agora teremos restrição de IP para sua segurança, se perceber<br/> que o arquivo não esta sendo higienizado entre em contato com o seu <b>Gerente Expande</b> ou com <b>Planejamento.</b> <br/></li>
          <li>18/02 - Agora temos uma nova notificação, caso seu IP esteja bloqueado você será avisado! Não se preocupe, mande seu IP Externo para o seu <b>Gerente Expande</b> e/ou <b>Planejamento</b> para que seja liberado</li>
          <li style={{ color: 'red', fontWeight: 'bold' }}>19/02 - Devido a uma instabilidade o sistema de in100 está fora!</li>
          <li>20/02 - Ajustes estão sendo realizados no sitema, entraremos em contato para mais atualizações em breve</li>
        </ul>
        <br/>
        {/* <div><b>Obs.:</b> <i>Envie o IP se nenhum nome estiver sendo higienizado !</i></div> */}
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
