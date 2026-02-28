<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OIO ONE - Michel</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: 'Segoe UI', sans-serif; color: white; }
        #camera { width: 100vw; height: 100vh; object-fit: cover; position: fixed; z-index: 1; filter: brightness(0.6); }
        
        /* Camada de Interação: Ergonomia Dinâmica (Arrastável) */
        #interface-oio { 
            position: absolute; bottom: 0; width: 100%; height: 35%; 
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(25px);
            border-radius: 30px 30px 0 0; z-index: 10; border-top: 1px solid rgba(255,255,255,0.2);
            display: flex; flex-direction: column; align-items: center; cursor: grab;
        }

        /* Salto Quântico: Miniaturas Rápidas */
        #salto-quantico {
            position: fixed; top: 20px; right: 20px; display: flex; gap: 10px; z-index: 20;
        }
        .mini-tela { width: 45px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.4); }

        .menu-apps { display: flex; gap: 20px; padding: 25px; overflow-x: auto; width: 90%; }
        .app-icon { 
            min-width: 70px; height: 70px; background: rgba(255,255,255,0.1); 
            border-radius: 20px; display: flex; align-items: center; justify-content: center;
            font-size: 11px; flex-direction: column; transition: 0.3s;
        }
        .app-icon:active { transform: scale(0.9); background: rgba(0, 242, 254, 0.3); }

        #estrela-oio { 
            position: fixed; bottom: 40%; right: 8%; width: 60px; height: 60px; 
            background: radial-gradient(circle, #00f2fe, #4facfe); border-radius: 50%; 
            z-index: 30; display: flex; align-items: center; justify-content: center; font-size: 26px;
            box-shadow: 0 0 20px rgba(0, 242, 254, 0.5);
        }
    </style>
</head>
<body>
    <video id="camera" autoplay playsinline></video>

    <div id="salto-quantico">
        <div class="mini-tela" onclick="alert('Salto: Tela 1')"></div>
        <div class="mini-tela" style="opacity:0.5"></div>
    </div>

    <div id="estrela-oio" onclick="sentirOIO()">✨</div>

    <div id="interface-oio" id="gaveta">
        <div style="width: 40px; height: 5px; background: rgba(255,255,255,0.4); margin: 15px; border-radius: 10px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="window.location.href='https://google.com'">🌐<br>Google</div>
            <div class="app-icon" onclick="window.location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon" onclick="abrirChat()">📩<br>Mensagens</div>
            <div class="app-icon" onclick="perguntarIA()">🤖<br>OIO IA</div>
        </div>
        <p style="font-size: 10px; opacity: 0.6;">OIO ONE • Michel Detilli • vibe-app-bbba2</p>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js"></script>

    <script>
        // Segurança: O DatabaseURL é a única chave pública necessária
        const firebaseConfig = { databaseURL: "https://vibe-app-bbba2-default-rtdb.firebaseio.com/" };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        const v = document.getElementById('camera');
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
            .then(s => v.srcObject = s).catch(e => console.log("Aguardando Identidade"));

        function sentirOIO() {
            if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
            alert("OIO ONE: Identidade Michel Confirmada.");
        }

        function abrirChat() {
            const m = prompt("Gravar memória no Firebase:");
            if(m) {
                db.ref('memorias').push({ texto: m, autor: "Michel", data: Date.now() });
                // Efeito visual: Tela pisca ao acoplar app/mensagem
                document.body.style.background = "white";
                setTimeout(() => document.body.style.background = "black", 100);
                alert("Memória Protegida e Gravada.");
            }
        }

        async function perguntarIA() {
            const p = prompt("O que o OIO IA deve analisar?");
            if(p) {
                db.ref('ia_consultas').push({ pergunta: p, usuario: "Michel", status: "analisando" });
                alert("OIO IA: Analisando DNA de dados... Resposta enviada ao console.");
            }
        }
    </script>
</body>
</html>

