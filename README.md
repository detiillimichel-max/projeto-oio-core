<div id="janela-vibe" style="display:none; position:fixed; top:10%; left:5%; width:90%; height:55%; background:rgba(0,0,0,0.8); backdrop-filter:blur(20px); border-radius:30px; z-index:100; border:1px solid #00f2fe; padding:20px; flex-direction:column;">
    <div id="caixa-mensagens" style="flex:1; overflow-y:auto; color:white; font-size:18px; margin-bottom:15px;"></div>
    <div style="display:flex; gap:10px;">
        <input id="campo-texto" type="text" placeholder="Sua mensagem..." style="flex:1; padding:15px; border-radius:15px; border:none; font-size:16px;">
        <button onclick="enviarVibeReal()" style="padding:15px; border-radius:15px; background:#00f2fe; border:none; font-weight:bold;">➔</button>
    </div>
    <button onclick="document.getElementById('janela-vibe').style.display='none'" style="color:gray; background:none; border:none; margin-top:10px;">FECHAR</button>
</div>

<script>
    // ESTA FUNÇÃO ABRE A JANELA E COMEÇA A "OUVIR" O OUTRO CELULAR
    function abrirVibe() {
        document.getElementById('janela-vibe').style.display = 'flex';
        // GARANTE QUE ESTAMOS LENDO A PASTA 'chat_geral' DO SEU FIREBASE
        db.ref('chat_geral').limitToLast(10).on('value', (snapshot) => {
            const caixa = document.getElementById('caixa-mensagens');
            caixa.innerHTML = "";
            snapshot.forEach(item => {
                caixa.innerHTML += `<div style="background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; margin-bottom:8px;"><b>${item.val().autor}:</b> ${item.val().texto}</div>`;
            });
            if(document.getElementById('somMsg')) document.getElementById('somMsg').play();
            caixa.scrollTop = caixa.scrollHeight;
        });
    }

    function enviarVibeReal() {
        const txt = document.getElementById('campo-texto').value;
        if(txt) {
            // ENVIA PARA A MESMA PASTA QUE O OUTRO CELULAR ESTÁ LENDO
            db.ref('chat_geral').push({ texto: txt, autor: "Michel", data: Date.now() });
            document.getElementById('campo-texto').value = "";
        }
    }
</script>
