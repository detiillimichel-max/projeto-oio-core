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
        
        /* Janela de Mensagens com Letras Grandes */
        #vibe-chat {
            position: fixed; top: 5%; left: 5%; width: 90%; height: 60%;
            background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px);
            border-radius: 25px; z-index: 25; border: 1px solid rgba(255,255,255,0.2);
            display: none; flex-direction: column; padding: 20px;
        }
        #lista-msgs { flex: 1; overflow-y: auto; color: white; font-size: 18px; line-height: 1.5; }
        .balao { background: rgba(0, 242, 254, 0.2); padding: 12px; border-radius: 15px; margin-bottom: 12px; border-left: 4px solid #00f2fe; }

        /* Botão de Enviar Gigante para facilitar o toque */
        .btn-grande { width:100%; padding: 20px; border-radius: 20px; border:none; background:#00f2fe; font-size: 20px; font-weight: bold; color: #000; }

        /* Gaveta de Vidro OIO */
        #interface-oio { 
            position: absolute; bottom: 20px; left: 5%; width: 90%; height: 160px; 
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(50px);
            border-radius: 40px; z-index: 10; display: flex; flex-direction: column; align-items: center;
        }
        .menu-apps { display: flex; gap: 15px; padding: 20px; overflow-x: auto; width: 100%; scrollbar-width: none; }
        .app-icon { min-width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 22px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; flex-direction: column; border: 1px solid rgba(255,255,255,0.1); }
    </style>
</head>
<body>
    <video id="camera" autoplay playsinline></video>
    <audio id="somMsg" src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"></audio>

    <div id="vibe-chat">
        <div id="lista-msgs"></div>
        <button class="btn-grande" onclick="enviarVibe()">ENVIAR MENSAGEM</button>
        <button onclick="document.getElementById('vibe-chat').style.display='none'" style="background:none; color:white; border:none; margin-top:15px; font-size: 16px;">FECHAR</button>
    </div>

    <div id="interface-oio">
        <div style="width: 50px; height: 6px; background: rgba(255,255,255,0.4); margin-top: 15px; border-radius: 10px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="abrirVibe()">📩<br>Mensagens</div>
            <div class="app-icon" onclick="location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon" onclick="alert('OIO IA Ativa')">🤖<br>OIO IA</div>
        </div>
        <p style="color: #00f2fe; font-size: 12px; font-weight: bold;">OIO ONE • MICHEL DETILLI</p>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js"></script>
    <script>
        const firebaseConfig = { databaseURL: "https://vibe-app-bbba2-default-rtdb.firebaseio.com/" };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(s => document.getElementById('camera').srcObject = s);

        function abrirVibe() { document.getElementById('vibe-chat').style.display = 'flex'; }

        function enviarVibe() {
            const t = prompt("Sua mensagem:");
            if(t) db.ref('mensagens_vibe').push({ texto: t, autor: "Michel", data: Date.now() });
        }

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

