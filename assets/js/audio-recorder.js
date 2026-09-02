(() => {
  'use strict';

  const button = document.getElementById('audio-btn');
  const status = document.getElementById('audio-status');

  if (!button || !status) return;

  // Cloudinary: estes dois valores são públicos em uploads unsigned.
  // A API Secret NÃO é usada no frontend.
  const CLOUDINARY_CLOUD_NAME = 'hmnhqfco';
  const CLOUDINARY_UPLOAD_PRESET = 'oio_core_audio';
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

  let recorder = null;
  let chunks = [];
  let stream = null;

  function setStatus(text = '') {
    status.textContent = text;
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
    const oldPreview = status.querySelector('.audio-preview');
    oldPreview?.remove();
  }

  function mostrarPreview(url) {
    limparPreview();

    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'metadata';
    audio.className = 'audio-preview';
    audio.src = url;
    audio.style.display = 'block';
    audio.style.width = 'min(100%, 320px)';
    audio.style.height = '38px';
    audio.style.margin = '8px auto 0';

    status.appendChild(audio);
    status.style.display = 'block';
  }

  async function processarGravacao(blob) {
    const localUrl = URL.createObjectURL(blob);
    mostrarPreview(localUrl);

    try {
      const data = await enviarCloudinary(blob);

      if (data.secure_url) {
        mostrarPreview(data.secure_url);
      }

      // Deixa o áudio pronto para o botão ENVIAR do composer.
      window.oioPendingAudio = {
        url: data.secure_url,
        publicId: data.public_id || null,
        resourceType: data.resource_type || 'video',
        format: data.format || null,
        duration: data.duration || null,
        mimeType: blob.type || null
      };

      setStatus('Áudio pronto. Toque no botão ➤ para enviar ao chat.');
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
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = mimeType();
      recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunks = [];

      recorder.ondataavailable = event => {
        if (event.data?.size) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        processarGravacao(blob);

        stream?.getTracks().forEach(track => track.stop());
        stream = null;
      };

      recorder.start();
      button.classList.add('recording');
      button.setAttribute('aria-label', 'Parar gravação');
      setStatus('Gravando áudio... toque novamente para parar.');
    } catch (error) {
      console.error(error);
      setStatus('Não foi possível acessar o microfone.');
      stream?.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  function pararGravacao() {
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    button.classList.remove('recording');
    button.setAttribute('aria-label', 'Gravar áudio');
  }

  button.addEventListener('click', () => {
    if (recorder?.state === 'recording') pararGravacao();
    else iniciarGravacao();
  });
})();
