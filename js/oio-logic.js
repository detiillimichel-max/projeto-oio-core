/* Motor de Movimento OIO CORE */
let startY;
document.addEventListener('touchstart', e => startY = e.touches[0].pageY);
document.addEventListener('touchend', e => {
    let endY = e.changedTouches[0].pageY;
    let gaveta = document.querySelector('.camada-vidro');
    
    // Gesto para subir a gaveta (Módulo de Acoplamento)
    if(startY > endY + 60) {
        gaveta.style.bottom = '0';
    } 
    // Gesto para descer
    else if (startY < endY - 60) {
        gaveta.style.bottom = '-100%';
    }
});

