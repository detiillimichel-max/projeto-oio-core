/**
 * OIO Core — Indicador de digitação
 * Versão: 1.0.0
 * Status: módulo preparado, ainda não conectado ao CHAT.
 *
 * Objetivo:
 * - concentrar toda a lógica visual/estado de "digitando" em um único arquivo;
 * - não gravar estado no Turso;
 * - não criar dados falsos;
 * - permitir que o CHAT receba posteriormente um evento real de digitação.
 *
 * Importante:
 * Esta versão NÃO finge que outro usuário está digitando.
 * O estado remoto só deve ser exibido quando o CHAT receber um evento real.
 */

const OIO_DIGITANDO_VERSION = '1.0.0';

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
      <span class="oio-digitando-pontos" aria-hidden="true">•••</span>
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
 * OIO Core — contrato futuro de eventos reais.
 *
 * O módulo não escolhe banco, websocket ou outro transporte.
 * A camada de comunicação do CHAT poderá chamar:
 *
 *   indicador.mostrar()
 *   indicador.ocultar()
 *
 * somente após receber um evento real do outro usuário.
 */

export { OIO_DIGITANDO_VERSION, criarIndicadorDigitando };
