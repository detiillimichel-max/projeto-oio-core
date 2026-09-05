/**
 * OIO Core — Indicador de digitação
 * Versão: 1.1.0
 * Status: módulo preparado, ainda não conectado ao CHAT.
 *
 * Objetivo:
 * - concentrar a lógica do indicador em um único arquivo;
 * - usar um elemento animado pequeno no lugar dos três pontinhos;
 * - não gravar estado no Turso;
 * - não criar dados falsos;
 * - permitir que o CHAT receba posteriormente um evento real de digitação.
 *
 * Importante:
 * Esta versão NÃO finge que outro usuário está digitando.
 * O indicador só deve ser exibido após um evento real do outro usuário.
 */

const OIO_DIGITANDO_VERSION = '1.1.0';
const OIO_DIGITANDO_ICON = '/assets/img/digitando-pombo.svg';

function criarIndicadorDigitando({ container, nome = 'Usuário' } = {}) {
  if (!container) {
    throw new Error('OIO Digitando: container é obrigatório.');
  }

  let ativo = false;
  let elemento = null;

  function mostrar() {
    if (ativo) return;

    elemento = document.createElement('div');
    elemento.className = 'oio-digitando';
    elemento.setAttribute('aria-live', 'polite');
    elemento.setAttribute('aria-label', `${nome} está digitando`);
    elemento.innerHTML = `
      <span>${nome} está digitando</span>
      <img
        class="oio-digitando-pombo"
        src="${OIO_DIGITANDO_ICON}"
        alt=""
        aria-hidden="true"
        width="32"
        height="18"
        style="width:32px;height:18px;object-fit:contain;display:inline-block;vertical-align:middle;"
      >
    `;

    container.appendChild(elemento);
    ativo = true;
  }

  function ocultar() {
    if (!elemento) return;
    elemento.remove();
    elemento = null;
    ativo = false;
  }

  function destruir() {
    ocultar();
  }

  return Object.freeze({
    mostrar,
    ocultar,
    destruir,
    estaAtivo: () => ativo,
    versao: OIO_DIGITANDO_VERSION
  });
}

/**
 * Contrato futuro de eventos reais.
 *
 * O módulo não escolhe banco, WebSocket ou outro transporte.
 * A camada de comunicação do CHAT poderá chamar:
 *
 *   indicador.mostrar()
 *   indicador.ocultar()
 *
 * somente após receber um evento real do outro usuário.
 */

export { OIO_DIGITANDO_VERSION, OIO_DIGITANDO_ICON, criarIndicadorDigitando };
