<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OIO ONE - Michel</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: 'Segoe UI', sans-serif; }
        #camera { width: 100vw; height: 100vh; object-fit: cover; position: fixed; z-index: 1; filter: brightness(0.7); }
        #interface-oio { 
            position: absolute; bottom: 0; width: 100%; height: 35%; 
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px);
            border-radius: 30px 30px 0 0; z-index: 10; border-top: 1px solid rgba(255,255,255,0.2);
            display: flex; flex-direction: column; align-items: center;
        }
        .menu-apps { display: flex; gap: 20px; padding: 25px; overflow-x: auto; width: 90%; }
        .app-icon { 
            min-width: 65px; height: 65px; background: rgba(255,255,255,0.15); 
            border-radius: 18px; display: flex; align-items: center; justify-content: center;
            color: white; font-size: 11px; flex-direction: column; cursor: pointer;
        }
        #estrela-oio { 
            position: fixed; bottom: 40%; right: 8%; width: 55px; height: 55px; 
            background: linear-gradient(45deg, #00f2fe, #4facfe); border-radius: 50%; 
            z-index: 30; display: flex; align-items: center; justify-content: center; font-size: 24px;
        }
    </style>
</head>
<body>
    <video id="camera" autoplay playsinline></video>
    <div id="estrela-oio" onclick="sentirOIO()">✨</div>
    <div id="interface-oio">
        <div style="width: 45px; height: 4px; background: rgba(255,255,255,0.3); margin: 12px; border-radius: 10px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="window.location.href='https://google.com'">🌐<br>Google</div>
            <div class="app-icon" onclick="window.location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon" onclick="abrirChat()">📩<br>Mensagens</div>
            <div class="app-icon" onclick="perguntarIA()">🤖<br>OIO IA</div>
        </div>
        <p style="color: rgba(255,255,255,0.6); font-size: 12px;">OIO ONE • Autoria Michel Detilli</p>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js"></script>

    <script>
        const firebaseConfig = { databaseURL: "https://vibe-app-bbba2-default-rtdb.firebaseio.com/" };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        const v = document.getElementById('camera');
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
            .then(s => v.srcObject = s).catch(e => console.log("Câmera pendente"));

        function sentirOIO() {
            if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
            alert("OIO ONE: Identidade Michel Confirmada.");
        }

        function abrirChat() {
            const msg = prompt("Digite sua memória para o OIO:");
            if(msg) {
                db.ref('memorias').push({ texto: msg, autor: "Michel", data: Date.now() });
                alert("Memória gravada no Firebase!");
            }
        }

        async function perguntarIA() {
            const p = prompt("O que deseja saber do OIO CORE?");
            if(p) {
                db.ref('ia_consultas').push({ pergunta: p, usuario: "Michel", status: "analisando" });
                alert("OIO IA: Michel, recebi sua mensagem. Analisando seu DNA de dados...");
            }
        }
    </script>
</body>
</html>
