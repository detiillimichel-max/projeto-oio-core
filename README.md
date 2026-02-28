<div id="janela-vibe" style="display:none; position:fixed; top:5%; left:5%; width:90%; height:65%; background:rgba(0,0,0,0.85); backdrop-filter:blur(20px); border-radius:30px; z-index:100; border:1px solid #00f2fe; padding:20px; flex-direction:column;">
    <div id="mensagens-vibe" style="flex:1; overflow-y:auto; color:white; font-size:20px; margin-bottom:15px;"></div>
    <input id="input-vibe" type="text" placeholder="Escreva aqui..." style="width:100%; padding:15px; border-radius:15px; border:none; font-size:18px;">
    <button onclick="enviarVibeReal()" style="width:100%; padding:18px; margin-top:10px; border-radius:15px; background:#00f2fe; color:black; font-weight:bold; font-size:20px;">ENVIAR AGORA</button>
    <button onclick="document.getElementById('janela-vibe').style.display='none'" style="color:gray; background:none; border:none; margin-top:10px;">FECHAR</button>
</div>

<script>
    // Função para abrir a sala real
    function abrirVibe() {
        document.getElementById('janela-vibe').style.display = 'flex';
        escutarMensagens();
    }

    // Função para enviar ao Firebase e tocar som
    function enviarVibeReal() {
        const msg = document.getElementById('input-vibe').value;
        if(msg) {
            db.ref('chat_vibe').push({ texto: msg, autor: "Michel", data: Date.now() });
            document.getElementById('input-vibe').value = "";
        }
    }

    // Escuta em tempo real
    function escutarMensagens() {
        db.ref('chat_vibe').limitToLast(10).on('value', (s) => {
            const container = document.getElementById('mensagens-vibe');
            container.innerHTML = "";
            s.forEach(child => {
                container.innerHTML += `<div style="background:rgba(0,242,254,0.1); padding:10px; border-radius:12px; margin-bottom:10px; border-left:4px solid #00f2fe;">${child.val().texto}</div>`;
            });
            document.getElementById('somMsg').play();
        });
    }
</script>
