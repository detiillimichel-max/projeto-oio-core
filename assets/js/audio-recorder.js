(() => {
  'use strict';

  const button = document.getElementById('audio-btn');
  const status = document.getElementById('audio-status');

  if (!button || !status) return;

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
        const url = URL.createObjectURL(blob);

        // Fase 1: apenas captura e valida o áudio.
        // O upload para Cloudinary será ligado depois que o Upload Preset
        // do OIO Core estiver configurado. O Firebase não é tocado aqui.
        const audio = new Audio(url);
        audio.controls = true;
        audio.preload = 'metadata';
        audio.className = 'audio-preview';

        const oldPreview = document.querySelector('.audio-preview');
        oldPreview?.remove();
        document.querySelector('.input-row')?.appendChild(audio);
        setStatus('Áudio gravado. Próxima etapa: enviar ao Cloudinary.');

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
