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
        
        /* Interface de Vidro OIO */
        #interface-oio { 
            position: absolute; bottom: 30px; left: 5%; width: 90%; height: 150px; 
            background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(50px); -webkit-backdrop-filter: blur(50px);
            border-radius: 40px; z-index: 10; display: flex; flex-direction: column; align-items: center;
        }
        .menu-apps { display: flex; gap: 15px; padding: 25px 15px; overflow-x: auto; width: 100%; scrollbar-width: none; }
        .app-icon { 
            min-width: 70px; height: 70px; background: rgba(255,255,255,0.1); 
            border-radius: 22px; display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 10px; flex-direction: column; border: 1px solid rgba(255,255,255,0.1);
        }
        #estrela-oio { 
            position: fixed; bottom: 200px; right: 30px; width: 60px; height: 60px; 
            background: radial-gradient(circle, #00f2fe, #4facfe); border-radius: 50%; 
            z-index: 30; display: flex; align-items: center; justify-content: center; font-size: 26px;
            box-shadow: 0 0 30px rgba(0, 242, 254, 0.6);
        }
    </style>
</head>
<body>
    <video id="camera" autoplay playsinline></video>
    <audio id="somMsg" src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3"></audio>

    <div id="estrela-oio" onclick="sentirOIO()">✨</div>

    <div id="interface-oio">
        <div style="width: 40px; height: 5px; background: rgba(255,255,255,0.3); margin-top: 15px; border-radius: 20px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="enviarVibe()">📩<br>Enviar</div>
            <div class="app-icon" onclick="location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon" onclick="iaCore()">🤖<br>OIO IA</div>
            <div class="app-icon" onclick="location.href='https://maps.google.com'">🗺️<br>Maps</div>
        </div>
        <p style="color: #00f2fe; font-size: 10px; font-weight: bold; letter-spacing: 2px;">OIO ONE • MICHEL DETILLI</p>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js"></script>
    <script>
        const firebaseConfig = { databaseURL: "https://vibe-app-bbba2-default-rtdb.firebaseio.com/" };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
            .then(s => document.getElementById('camera').srcObject = s);

        // ESCUTAR MENSAGENS EM TEMPO REAL
        db.ref('mensagens_vibe').on('child_added', (snapshot) => {
            const msg = snapshot.val();
            document.getElementById('somMsg').play(); // Toca o som ao chegar msg
            console.log("Nova mensagem de: " + msg.autor);
        });

        function enviarVibe() {
            const t = prompt("Digite sua mensagem para o outro celular:");
            if(t) db.ref('mensagens_vibe').push({ texto: t, autor: "Michel", data: Date.now() });
        }

        function iaCore() { alert("OIO IA: Analisando conexões..."); }
        function sentirOIO() { if(navigator.vibrate) navigator.vibrate(100); }
    </script>
</body>
</html>

