<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OIO ONE - Michel Detilli</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: 'Segoe UI', sans-serif; }
        
        /* Identidade: O Usuário é o Centro */
        #camera { width: 100vw; height: 100vh; object-fit: cover; position: fixed; z-index: 1; filter: brightness(0.5) contrast(1.1); }

        /* Camada de Interação: Gaveta de Vidro (30%) */
        #interface-oio { 
            position: absolute; bottom: 20px; left: 5%; width: 90%; height: 140px; 
            background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(35px);
            border-radius: 35px; z-index: 10; border: 1px solid rgba(255,255,255,0.15);
            display: flex; flex-direction: column; align-items: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .menu-apps { display: flex; gap: 15px; padding: 20px; overflow-x: auto; width: 90%; scrollbar-width: none; }
        .menu-apps::-webkit-scrollbar { display: none; }

        /* Ícones Iluminados */
        .app-icon { 
            min-width: 65px; height: 65px; background: rgba(255,255,255,0.05); 
            border-radius: 22px; display: flex; align-items: center; justify-content: center;
            color: white; font-size: 10px; flex-direction: column; border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .app-icon:active { transform: scale(0.85); background: rgba(0, 242, 254, 0.2); border-color: #00f2fe; }
        .app-icon i { font-size: 24px; margin-bottom: 5px; }

        /* Estrela Sensorial */
        #estrela-oio { 
            position: fixed; bottom: 180px; right: 25px; width: 55px; height: 55px; 
            background: radial-gradient(circle at 30% 30%, #4facfe, #00f2fe); border-radius: 50%; 
            z-index: 30; display: flex; align-items: center; justify-content: center; font-size: 22px;
            box-shadow: 0 0 30px rgba(0, 242, 254, 0.6); animation: pulsar 3s infinite;
        }

        @keyframes pulsar { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
    </style>
</head>
<body>
    <video id="camera" autoplay playsinline></video>
    <div id="estrela-oio" onclick="sentirOIO()">✨</div>

    <div id="interface-oio">
        <div style="width: 35px; height: 4px; background: rgba(255,255,255,0.2); margin: 12px; border-radius: 10px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="location.href='https://google.com'">🌐<br>Google</div>
            <div class="app-icon" onclick="location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon" onclick="abrirChat()">📩<br>Mensagens</div>
            <div class="app-icon" onclick="perguntarIA()">🤖<br>OIO IA</div>
            <div class="app-icon" onclick="location.href='https://maps.google.com'">🗺️<br>Maps</div>
        </div>
        <p style="color: rgba(255,255,255,0.4); font-size: 9px; letter-spacing: 1px;">OIO ONE • MICHEL DETILLI</p>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js"></script>
    <script>
        const firebaseConfig = { databaseURL: "https://vibe-app-bbba2-default-rtdb.firebaseio.com/" };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        const v = document.getElementById('camera');
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(s => v.srcObject = s);

        function sentirOIO() {
            if(navigator.vibrate) navigator.vibrate([80, 40, 80]);
            alert("OIO ONE: Michel Identificado.");
        }

        function abrirChat() {
            const m = prompt("Gravar memória no Firebase:");
            if(m) {
                db.ref('memorias').push({ texto: m, autor: "Michel", data: Date.now() });
                document.body.style.opacity = "0.5";
                setTimeout(() => document.body.style.opacity = "1", 100);
            }
        }

        function perguntarIA() {
            const p = prompt("Análise OIO IA:");
            if(p) {
                db.ref('ia_consultas').push({ pergunta: p, usuario: "Michel" });
                alert("OIO IA: Processando DNA de dados...");
            }
        }
    </script>
</body>
</html>
