<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OIO ONE PREMIUM</title>
    <style>
        * { box-sizing: border-box; outline: none; }
        body { margin: 0; background: #000; overflow: hidden; font-family: 'Segoe UI', Roboto, sans-serif; }
        
        /* Fundo com Câmera e Blur Suave */
        #camera { width: 100vw; height: 100vh; object-fit: cover; position: fixed; z-index: 1; filter: brightness(0.5) blur(3px); }

        /* Janela de Chat VIBE - Design de Vidro Escuro */
        #vibe-chat {
            position: fixed; top: 8%; left: 5%; width: 90%; height: 60%;
            background: rgba(15, 15, 15, 0.75); backdrop-filter: blur(25px);
            border-radius: 35px; z-index: 100; border: 1px solid rgba(0, 242, 254, 0.3);
            display: none; flex-direction: column; padding: 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.9);
        }
        #lista-msgs { flex: 1; overflow-y: auto; color: white; font-size: 18px; margin-bottom: 15px; padding-right: 5px; }
        #lista-msgs::-webkit-scrollbar { width: 4px; }
        #lista-msgs::-webkit-scrollbar-thumb { background: #00f2fe; border-radius: 10px; }

        .balao { background: rgba(255, 255, 255, 0.08); padding: 12px 18px; border-radius: 20px; margin-bottom: 12px; border-bottom: 1px solid rgba(0, 242, 254, 0.2); width: fit-content; max-width: 85%; }

        /* Campo de Digitação dentro do App */
        .input-area { display: flex; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.1); }
        #msg-input { flex: 1; background: none; border: none; color: white; font-size: 16px; padding-left: 10px; }
        .btn-send { background: #00f2fe; border: none; width: 45px; height: 45px; border-radius: 50%; color: black; font-weight: bold; font-size: 20px; display: flex; align-items: center; justify-content: center; }

        /* Gaveta de Vidro OIO (Menu Principal) */
        #interface-oio { 
            position: absolute; bottom: 25px; left: 5%; width: 90%; height: 140px; 
            background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(40px) saturate(150%);
            border-radius: 40px; z-index: 10; border: 1px solid rgba(255,255,255,0.15);
            display: flex; flex-direction: column; align-items: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);
        }
        .menu-apps { display: flex; gap: 15px; padding: 20px; overflow-x: auto; width: 100%; scrollbar-width: none; }
        .app-icon { min-width: 75px; height: 75px; background: rgba(255,255,255,0.05); border-radius: 24px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; flex-direction: column; border: 1px solid rgba(255,255,255,0.08); transition: 0.3s; }
        .app-icon:active { transform: scale(0.9); background: rgba(0, 242, 254, 0.2); }
    </style>
</head>
<body>
    <video id="camera" autoplay playsinline></video>
    <audio id="somMsg" src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"></audio>

    <div id="vibe-chat">
        <div style="text-align: center; color: #00f2fe; font-size: 12px; font-weight: bold; margin-bottom: 15px; letter-spacing: 2px;">VIBE CONNECT</div>
        <div id="lista-msgs"></div>
        <div class="input-area">
            <input type="text" id="msg-input" placeholder="Sua mensagem...">
            <button class="btn-send" onclick="enviarVibeReal()">➔</button>
        </div>
        <button onclick="document.getElementById('vibe-chat').style.display='none'" style="background:none; color:rgba(255,255,255,0.3); border:none; margin-top:15px; font-size:12px;">VOLTAR</button>
    </div>

    <div id="interface-oio">
        <div style="width: 40px; height: 4px; background: rgba(255,255,255,0.2); margin-top: 12px; border-radius: 10px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="abrirVibe()">📩<br>Mensagens</div>
            <div class="app-icon" onclick="location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon" onclick="alert('OIO IA: Reconhecendo Michel...')">🤖<br>OIO IA</div>
            <div class="app-icon" onclick="location.href='https://google.com'">🌐<br>Google</div>
        </div>
        <p style="color: rgba(255,255,255,0.25); font-size: 10px; font-weight: bold; letter-spacing: 1.5px; margin-top: 2px;">OIO ONE • MICHEL DETILLI</p>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js"></script>
    <script>
        const firebaseConfig = { databaseURL: "https://vibe-app-bbba2-default-rtdb.firebaseio.com/" };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(s => document.getElementById('camera').srcObject = s);

        function abrirVibe() { document.getElementById('vibe-chat').style.display = 'flex'; }

        function enviarVibeReal() {
            const input = document.getElementById('msg-input');
            const texto = input.value;
            if(texto) {
                db.ref('chat_geral').push({ texto: texto, autor: "Michel", data: Date.now() });
                input.value = ""; // Limpa o campo
            }
        }

        // Escuta a pasta chat_geral
        db.ref('chat_geral').limitToLast(20).on('value', (snapshot) => {
            const lista = document.getElementById('lista-msgs');
            lista.innerHTML = "";
            snapshot.forEach(item => {
            
