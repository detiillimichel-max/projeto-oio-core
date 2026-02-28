<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OIO ONE CORE</title>
    <style>
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #000; overflow: hidden; font-family: 'Segoe UI', Roboto, sans-serif; }
        
        /* Fundo Dinâmico: Identidade Michel */
        #camera { width: 100vw; height: 100vh; object-fit: cover; position: fixed; z-index: 1; filter: brightness(0.4) blur(2px); transition: 0.5s; }

        /* Camada de Vidro Orgânica (Força o Processador) */
        #interface-oio { 
            position: absolute; bottom: 40px; left: 5%; width: 90%; height: 160px; 
            background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(50px) saturate(200%); -webkit-backdrop-filter: blur(50px) saturate(200%);
            border-radius: 45px; z-index: 10; display: flex; flex-direction: column; align-items: center;
            box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.1);
        }

        .menu-apps { display: flex; gap: 20px; padding: 25px 15px; overflow-x: auto; width: 100%; scrollbar-width: none; perspective: 1000px; }
        .menu-apps::-webkit-scrollbar { display: none; }

        /* Ícones 3D Flutuantes */
        .app-icon { 
            min-width: 75px; height: 75px; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
            border-radius: 26px; display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 11px; flex-direction: column; border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 10px 20px rgba(0,0,0,0.4); transform-style: preserve-3d; transition: 0.2s;
        }
        .app-icon:active { transform: scale(0.9) translateZ(-20px); background: rgba(0, 242, 254, 0.4); border-color: #00f2fe; }

        /* Estrela Inteligente (Vibe Core) */
        #estrela-oio { 
            position: fixed; bottom: 220px; right: 35px; width: 65px; height: 65px; 
            background: radial-gradient(circle at 30% 30%, #00f2fe, #4facfe); border-radius: 50%; 
            z-index: 30; display: flex; align-items: center; justify-content: center; font-size: 28px;
            box-shadow: 0 0 40px rgba(0, 242, 254, 0.8); animation: flutuar 3s infinite ease-in-out;
        }

        @keyframes flutuar { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-15px) scale(1.05); } }
    </style>
</head>
<body>
    <video id="camera" autoplay playsinline></video>
    <div id="estrela-oio" onclick="sentirOIO()">✨</div>

    <div id="interface-oio">
        <div style="width: 50px; height: 6px; background: rgba(255,255,255,0.25); margin-top: 15px; border-radius: 20px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="location.href='https://google.com'">🌐<br>Google</div>
            <div class="app-icon" onclick="location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon" onclick="abrirVibe()">📩<br>Mensagens</div>
            <div class="app-icon" onclick="iaCore()">🤖<br>OIO IA</div>
            <div class="app-icon" onclick="location.href='https://maps.google.com'">🗺️<br>Maps</div>
        </div>
        <p style="color: rgba(0, 242, 254, 0.8); font-size: 10px; font-weight: bold; letter-spacing: 2px;">OIO ONE • MICHEL DETILLI</p>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js"></script>
    <script>
        const firebaseConfig = { databaseURL: "https://vibe-app-bbba2-default-rtdb.firebaseio.com/" };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
            .then(s => document.getElementById('camera').srcObject = s);

        function sentirOIO() {
            if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
            document.getElementById('camera').style.filter = "brightness(0.8) blur(0px)";
            setTimeout(() => document.getElementById('camera').style.filter = "brightness(0.4) blur(2px)", 1000);
        }

        function abrirVibe() {
            const m = prompt("VIBE - Enviar Memória ao Firebase:");
            if(m) db.ref('memorias').push({ texto: m, autor: "Michel", data: Date.now() });
        }

        function iaCore() {
            const p = prompt("OIO IA - O que deseja analisar?");
            if(p) db.ref('ia_consultas').push({ pergunta: p, usuario: "Michel" });
        }
    </script>
</body>
</html>

