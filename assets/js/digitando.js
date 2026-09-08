/**
 * OIO Core — Indicador de digitação
 * Versão: 1.2.0
 * Status: módulo pronto para receber eventos reais via Ably.
 *
 * Transporte:
 * - Ably carrega somente eventos pequenos de typing.
 * - O pombo é um GIF local do aplicativo.
 * - Nenhuma imagem, avatar ou Base64 é enviado ao Ably.
 * - Estado de typing não é gravado no Turso.
 */

const OIO_DIGITANDO_VERSION = '1.2.0';
const OIO_DIGITANDO_ICON = '/assets/img/digitando-pombo.gif';
const OIO_DIGITANDO_CHANNEL_PREFIX = 'oio:typing:';
const OIO_ABLY_SDK_URL = 'https://cdn.ably.com/lib/ably.min-2.js';

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

function carregarAblySdk() {
  if (window.Ably?.Realtime) return Promise.resolve(window.Ably);

  return new Promise((resolve, reject) => {
    const existente = document.querySelector('script[data-oio-ably-sdk="true"]');
    if (existente) {
      existente.addEventListener('load', () => resolve(window.Ably), { once: true });
      existente.addEventListener('error', () => reject(new Error('Falha ao carregar o SDK Ably.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = OIO_ABLY_SDK_URL;
    script.async = true;
    script.dataset.oioAblySdk = 'true';
    script.onload = () => window.Ably?.Realtime
      ? resolve(window.Ably)
      : reject(new Error('SDK Ably carregado sem Realtime.'));
    script.onerror = () => reject(new Error('Falha ao carregar o SDK Ably.'));
    document.head.appendChild(script);
  });
}

/**
 * Conecta o indicador ao canal de typing do destinatário.
 *
 * O servidor vincula o token ao OIO ID autenticado e entrega:
 * - subscribe somente no canal próprio;
 * - publish somente no canal do destinatário.
 *
 * O evento enviado contém apenas IDs e estado de digitação.
 * Nome, avatar, foto, GIF e Base64 permanecem locais.
 */
async function conectarDigitandoAbly({
  container,
  nome = 'Usuário',
  input,
  meuOioId,
  destinatarioOioId
} = {}) {
  if (!container) throw new Error('OIO Digitando: container é obrigatório.');
  if (!input) throw new Error('OIO Digitando: input é obrigatório.');
  if (!meuOioId) throw new Error('OIO Digitando: meuOioId é obrigatório.');
  if (!destinatarioOioId) throw new Error('OIO Digitando: destinatarioOioId é obrigatório.');
  if (String(meuOioId) === String(destinatarioOioId)) {
    throw new Error('OIO Digitando: remetente e destinatário precisam ser diferentes.');
  }

  const Ably = await carregarAblySdk();
  const indicador = criarIndicadorDigitando({ container, nome });
  const authUrl = `/api/ably-token?recipient=${encodeURIComponent(String(destinatarioOioId))}`;

  const realtime = new Ably.Realtime({
    authUrl,
    authMethod: 'GET'
  });

  const meuCanal = realtime.channels.get(`${OIO_DIGITANDO_CHANNEL_PREFIX}${meuOioId}`);
  const canalDestino = realtime.channels.get(`${OIO_DIGITANDO_CHANNEL_PREFIX}${destinatarioOioId}`);

  let timerParada = null;
  let digitando = false;

  async function publicar(nomeEvento) {
    try {
      await canalDestino.publish(nomeEvento, {
        senderOioId: String(meuOioId),
        recipientOioId: String(destinatarioOioId),
        state: nomeEvento === 'typing:start' ? 'typing' : 'stopped'
      });
    } catch (error) {
      console.error('OIO Ably typing publish error:', error);
    }
  }

  async function iniciarDigitacao() {
    if (digitando) return;
    digitando = true;
    await publicar('typing:start');
  }

  async function pararDigitacao() {
    if (!digitando) return;
    digitando = false;
    await publicar('typing:stop');
  }

  await meuCanal.subscribe(['typing:start', 'typing:stop'], message => {
    const data = message?.data || {};
    if (String(data.senderOioId || message.clientId) !== String(destinatarioOioId)) return;
    if (String(data.recipientOioId) !== String(meuOioId)) return;

    if (message.name === 'typing:start') {
      indicador.mostrar();
    } else if (message.name === 'typing:stop') {
      indicador.ocultar();
    }
  });

  const onInput = () => {
    if (timerParada) clearTimeout(timerParada);

    if (!input.value.trim()) {
      pararDigitacao();
      return;
    }

    iniciarDigitacao();
    timerParada = setTimeout(() => {
      pararDigitacao();
      timerParada = null;
    }, 1200);
  };

  const onBlur = () => {
    if (timerParada) {
      clearTimeout(timerParada);
      timerParada = null;
    }
    pararDigitacao();
  };

  input.addEventListener('input', onInput);
  input.addEventListener('blur', onBlur);

  realtime.connection.on('failed', change => {
    console.error('OIO Ably typing connection failed:', change?.reason || change);
  });

  return Object.freeze({
    realtime,
    indicador,
    canalEntrada: meuCanal,
    canalSaida: canalDestino,
    desconectar() {
      if (timerParada) clearTimeout(timerParada);
      input.removeEventListener('input', onInput);
      input.removeEventListener('blur', onBlur);
      indicador.destruir();
      realtime.close();
    }
  });
}

export {
  OIO_DIGITANDO_VERSION,
  OIO_DIGITANDO_ICON,
  OIO_DIGITANDO_CHANNEL_PREFIX,
  criarIndicadorDigitando,
  conectarDigitandoAbly
};
