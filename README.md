<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OIO ONE - Michel Detilli</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: 'Segoe UI', sans-serif; }
        #camera { width: 100vw; height: 100vh; object-fit: cover; position: fixed; z-index: 1; filter: brightness(0.5); }
        
        /* Janela de Chat Real (VIBE) */
        #chat-container {
            position: fixed; top: 10%; left: 5%; width: 90%; height: 45%;
            background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(15px);
            border-radius: 20px; z-index: 20; display: none; flex-direction: column;
            border: 1px solid rgba(255,255,255,0.1);
        }
        #mensagens { flex: 1; overflow-y: auto; padding: 15px; color: white; font-size: 14px; }
        .msg-box { background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 12px; margin-bottom: 8px; width: fit-content; }

        /* Interface de Vidro */
        #interface-oio { 
            position: absolute; bottom: 20px; left: 5%; width: 90%; height: 140px; 
            background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(35px);
            border-radius: 35px; z-index: 10; border: 1px solid rgba(255,255,255,0.15);
            display: flex; flex-direction: column; align-items: center;
        }
        .menu-apps { display: flex; gap: 15px; padding: 20px; overflow-x: auto; width: 90%; scrollbar-width: none; }
        .app-icon { 
            min-width: 65px; height: 65px; background: rgba(255,255,255,0.05); 
            border-radius: 22px; display: flex; align-items: center; justify-content: center;
            color: white; font-size: 10px; flex-direction: column; border: 1px solid rgba(255,255,255,0.1);
        }
        #estrela-oio { 
            position: fixed; bottom: 180px; right: 25px; width: 55px; height: 55px; 
            background: radial-gradient(circle at 30% 30%, #4facfe, #00f2fe); border-radius: 50%; 
            z-index: 30; display: flex; align-items: center; justify-content: center; font-size: 22px;
            box-shadow: 0 0 30px rgba(0, 242, 254, 0.6);
        }
    </style>
</head>
<body>
    <video id="camera" autoplay playsinline></video>
    <div id="estrela-oio" onclick="sentirOIO()">✨</div>

    <div id="chat-container">
        <div id="mensagens"></div>
        <button onclick="enviarMensagem()" style="margin: 10px; padding: 10px; border-radius: 10px; border: none; background: #00f2fe;">Nova Mensagem</button>
        <button onclick="document.getElementById('chat-container').style.display='none'" style="background:none; color:white; border:none; padding-bottom:10px;">Fechar</button>
    </div>

    <div id="interface-oio">
        <div style="width: 35px; height: 4px; background: rgba(255,255,255,0.2); margin: 12px; border-radius: 10px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="location.href='https://google.com'">🌐<br>Google</div>
            <div class="app-icon" onclick="location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon" onclick="abrirChat()">📩<br>Mensagens</div>
            <div class="app-icon" onclick="perguntarIA()">🤖<br>OIO IA</div>
            <div class="app-icon" onclick="location.href='https://maps.google.com'">🗺️<br>Maps</div>
        </div>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js"></script>
    <script>
        const firebaseConfig = { databaseURL: "https://vibe-app-bbba2-default-rtdb.firebaseio.com/" };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        const v = document.getElementById('camera');
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(s => v.srcObject = s);

        function abrirChat() {
            document.getElementById('chat-container').style.display = 'flex';
            carregarMensagens();
        }

        function enviarMensagem() {
            const m = prompt("Sua mensagem:");
            if(m) db.ref('mensagens_vibe').push({ texto: m, autor: "Michel", data: Date.now() });
        }

        function carregarMensagens() {
            db.ref('mensagens_vibe').limitToLast(10).on('value', (s) => {
                const list = document.getElementById('mensagens');
                list.innerHTML = "";
                s.forEach(child => {
                    list.innerHTML += `<div class="msg-box"><b>${child.val().autor}:</b> ${child.val().texto}</div>`;
                });
            });
        }

        function sentirOIO() { alert("OIO ONE: Michel Identificado."); }
        function perguntarIA() { alert("OIO IA: Analisando DNA de dados..."); }
    </script>
</body>
</html>
