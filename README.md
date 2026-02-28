<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OIO ONE CORE</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #000; overflow: hidden; font-family: sans-serif; }
        #camera { width: 100vw; height: 100vh; object-fit: cover; position: fixed; z-index: 1; filter: brightness(0.4) blur(2px); }
        
        /* Janela de Mensagens Real */
        #vibe-chat {
            position: fixed; top: 10%; left: 5%; width: 90%; height: 50%;
            background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(20px);
            border-radius: 25px; z-index: 25; border: 1px solid rgba(255,255,255,0.1);
            display: flex; flex-direction: column; padding: 15px; display: none;
        }
        #lista-msgs { flex: 1; overflow-y: auto; color: white; font-size: 14px; margin-bottom: 10px; }
        .balao { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 15px; margin-bottom: 8px; width: fit-content; max-width: 90%; }

        /* Gaveta de Vidro */
        #interface-oio { 
            position: absolute; bottom: 30px; left: 5%; width: 90%; height: 150px; 
            background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(50px); -webkit-backdrop-filter: blur(50px);
            border-radius: 40px; z-index: 10; display: flex; flex-direction: column; align-items: center;
        }
        .menu-apps { display: flex; gap: 15px; padding: 25px 15px; overflow-x: auto; width: 100%; scrollbar-width: none; }
        .app-icon { min-width: 70px; height: 70px; background: rgba(255,255,255,0.1); border-radius: 22px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; flex-direction: column; }
    </style>
</head>
<body>
    <video id="camera" autoplay playsinline></video>
    <audio id="somMsg" src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"></audio>

    <div id="vibe-chat">
        <div id="lista-msgs"></div>
        <button onclick="enviarVibe()" style="width:100%; padding:12px; border-radius:15px; border:none; background:#00f2fe; font-weight:bold;">ENVIAR MENSAGEM</button>
        <button onclick="document.getElementById('vibe-chat').style.display='none'" style="background:none; color:gray; border:none; margin-top:10px;">FECHAR</button>
    </div>

    <div id="interface-oio">
        <div style="width: 40px; height: 5px; background: rgba(255,255,255,0.3); margin-top: 15px; border-radius: 20px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="abrirVibe()">📩<br>Mensagens</div>
            <div class="app-icon" onclick="location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon" onclick="alert('IA Analisando...')">🤖<br>OIO IA</div>
        </div>
        <p style="color: #00f2fe; font-size: 10px; letter-spacing: 2px;">OIO ONE • MICHEL DETILLI</p>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js"></script>
    <script>
        const firebaseConfig = { databaseURL: "https://vibe-app-bbba2-default-rtdb.firebaseio.com/" };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(s => document.getElementById('camera').srcObject = s);

        function abrirVibe() {
            document.getElementById('vibe-chat').style.display = 'flex';
        }

        function enviarVibe() {
            const t = prompt("Sua mensagem:");
            if(t) db.ref('mensagens_vibe').push({ texto: t, autor: "Michel", data: Date.now() });
        }

        // ESCUTAR E EXIBIR NA TELA
        db.ref('mensagens_vibe').limitToLast(10).on('value', (snapshot) => {
            const lista = document.getElementById('lista-msgs');
            lista.innerHTML = "";
            snapshot.forEach(item => {
                lista.innerHTML += `<div class="balao"><b>${item.val().autor}:</b> ${item.val().texto}</div>`;
            });
            document.getElementById('somMsg').play();
            lista.scrollTop = lista.scrollHeight;
        });
    </script>
</body>
</html>
