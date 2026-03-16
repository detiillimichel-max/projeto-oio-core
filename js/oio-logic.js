// OIO ONE - DNA de Movimento (Ergonomia Dinâmica)
let toqueInicialY = 0;
let toqueFinalY = 0;

// Captura onde o dedo encosta na tela
document.addEventListener('touchstart', e => {
    toqueInicialY = e.changedTouches[0].screenY;
}, false);

// Captura onde o dedo sai da tela
document.addEventListener('touchend', e => {
    toqueFinalY = e.changedTouches[0].screenY;
    analisarGesto();
}, false);

function analisarGesto() {
    const sensibilidade = 50;
    const distancia = toqueInicialY - toqueFinalY;

    // Gesto de deslizar para cima: ABRE A GAVETA (HUB)
    if (distancia > sensibilidade) {
        if (navigator.vibrate) navigator.vibrate(20);
        console.log("Salto Quântico: Abrindo Hub...");
        window.location.href = 'vibe_hub.html';
    }

    // Gesto de deslizar para baixo: VOLTA PARA A IDENTIDADE (INDEX)
    if (distancia < -sensibilidade) {
        if (navigator.vibrate) navigator.vibrate([10, 30]);
        console.log("Retornando à Identidade...");
        window.location.href = 'index.html';
    }
}

// Ergonomia Dinâmica: Atalho de toque duplo para trocar o lado do botão
document.addEventListener('dblclick', () => {
    const controles = document.querySelector('.controles');
    if (controles) {
        controles.style.flexDirection = controles.style.flexDirection === 'row-reverse' ? 'row' : 'row-reverse';
        if (navigator.vibrate) navigator.vibrate(50);
        alert("Modo Canhoto/Destro Alternado ⭐");
    }
});
