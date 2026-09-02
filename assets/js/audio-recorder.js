(() => {
  'use strict';

  const button = document.getElementById('audio-btn');
  const status = document.getElementById('audio-status');
  const sendButton = document.getElementById('send-btn');

  if (!button || !status) return;

  const CLOUDINARY_CLOUD_NAME = 'hmnhqfco';
  const CLOUDINARY_UPLOAD_PRESET = 'oio_core_audio';
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

  let recorder = null;
  let chunks = [];
  let stream = null;
  let timer = null;
  let startedAt = 0;

  function setStatus(text = '') {
    const textNode = status.querySelector('.audio-status-text');
    if (textNode) textNode.textContent = text;
    else status.textContent = text;
    status.style.display = text ? 'block' : 'none';
  }

  function mimeType() {
    const options = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];
    return options.find(type => MediaRecorder.isTypeSupported(type)) || '';
  }

  function extensionFromMime(type = '') {
    if (type.includes('mp4')) return 'm4a';
    if (type.includes('ogg')) return 'ogg';
    if (type.includes('webm')) return 'webm';
    return 'audio';
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const min = Math.floor(total / 60);
    const sec = String(total % 60).padStart(2, '0');
    return `${min}:${sec}`;
  }

  function startTimer() {
    clearInterval(timer);
    startedAt = Date.now();
    timer = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setStatus(`Gravando áudio • ${formatTime(elapsed)} • toque novamente para parar`);
    }, 250);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  async function enviarCloudinary(blob) {
    setStatus('Enviando áudio ao Cloudinary...');

    const formData = new FormData();
    const extension = extensionFromMime(blob.type);
    formData.append('file', blob, `oio-audio-${Date.now()}.${extension}`);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || `Cloudinary HTTP ${response.status}`);
    }
    return data;
  }

  function limparPreview() {
    status.querySelector('.audio-compose')?.remove();
  }

  function criarAcao(label, icon, className, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className || '';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    const i = document.createElement('i');
    i.setAttribute('data-lucide', icon);
    btn.appendChild(i);
    btn.addEventListener('click', onClick);
    return btn;
  }

  function atualizarIcones() {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function mostrarPreview(url) {
    limparPreview();

    const wrap = document.createElement('div');
    wrap.className = 'audio-compose';

    const player = document.createElement('audio');
    player.controls = true;
    player.preload = 'metadata';
    player.className = 'compose-player';
    player.src = url;

    const actions = document.createElement('div');
    actions.className = 'compose-actions';

    const excluir = criarAcao('Excluir áudio', 'trash-2', 'compose-delete', () => {
      window.oioPendingAudio = null;
      limparPreview();
      setStatus('');
      button.classList.remove('recording');
      button.setAttribute('aria-label', 'Gravar áudio');
      window.dispatchEvent(new CustomEvent('oio:audio-cancelled'));
    });

    const continuar = criarAcao('Continuar gravando', 'mic', 'compose-continue', () => {
      window.oioPendingAudio = null;
      limparPreview();
      setStatus('');
      iniciarGravacao();
    });

    actions.append(excluir, continuar);
    wrap.append(player, actions);
    status.innerHTML = '';
    const text = document.createElement('div');
    text.className = 'audio-status-text';
    text.textContent = 'Áudio pronto — confira e toque em enviar ➤';
    status.append(text, wrap);
    status.style.display = 'block';
    atualizarIcones();
  }

  async function processarGravacao(blob) {
    const localUrl = URL.createObjectURL(blob);
    mostrarPreview(localUrl);

    try {
      const data = await enviarCloudinary(blob);
      if (data.secure_url) mostrarPreview(data.secure_url);

      window.oioPendingAudio = {
        url: data.secure_url,
        publicId: data.public_id || null,
        resourceType: data.resource_type || 'video',
        format: data.format || null,
        duration: data.duration || null,
        mimeType: blob.type || null
      };

      setStatus('Áudio pronto — confira e toque em enviar ➤');
      window.dispatchEvent(new CustomEvent('oio:audio-ready', {
        detail: window.oioPendingAudio
      }));
    } catch (error) {
      console.error('Erro no upload para Cloudinary:', error);
      window.oioPendingAudio = null;
      setStatus('Áudio gravado, mas não foi enviado ao Cloudinary.');
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  }

  async function iniciarGravacao() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus('Este navegador não suporta gravação de áudio.');
      return;
    }

    try {
      window.oioPendingAudio = null;
      limparPreview();
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = mimeType();
      recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunks = [];

      recorder.ondataavailable = event => {
        if (event.data?.size) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        stopTimer();
        processarGravacao(blob);
        stream?.getTracks().forEach(track => track.stop());
        stream = null;
      };

      recorder.start();
      button.classList.add('recording');
      button.setAttribute('aria-label', 'Parar gravação');
      startTimer();
      setStatus('Gravando áudio • 0:00 • toque novamente para parar');
    } catch (error) {
      console.error(error);
      stopTimer();
      setStatus('Não foi possível acessar o microfone.');
      stream?.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  function pararGravacao() {
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    stopTimer();
    button.classList.remove('recording');
    button.setAttribute('aria-label', 'Gravar áudio');
  }

  button.addEventListener('click', () => {
    if (recorder?.state === 'recording') pararGravacao();
    else iniciarGravacao();
  });

  window.addEventListener('oio:audio-sent', () => {
    limparPreview();
    setStatus('');
  });

  window.addEventListener('oio:audio-cancelled', () => {
    if (sendButton) sendButton.setAttribute('aria-label', 'Enviar mensagem');
  });
})();
