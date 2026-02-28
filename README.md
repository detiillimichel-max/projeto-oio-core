<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OIO ONE - Michel</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: 'Segoe UI', sans-serif; }
        /* Identidade: O Usuário é o Centro */
        #camera { width: 100vw; height: 100vh; object-fit: cover; position: fixed; z-index: 1; filter: brightness(0.7); }
        
        /* Camada de Interação: Gaveta de Vidro (30%) */
        #interface-oio { 
            position: absolute; bottom: 0; width: 100%; height: 35%; 
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(15px);
            border-radius: 30px 30px 0 0; z-index: 10; transition: 0.5s;
            border-top: 1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center;
        }

        /* Ergonomia Dinâmica: Menu de Apps Arrastável */
        .menu-apps { display: flex; gap: 20px; padding: 20px; overflow-x: auto; width: 90%; }
        .app-icon { 
            min-width: 60px; height: 60px; background: rgba(255,255,255,0.2); 
            border-radius: 15px; display: flex; align-items: center; justify-content: center;
            color: white; font-size: 10px; flex-direction: column; cursor: pointer;
        }

        /* Salto Quântico: Miniaturas Rápidas */
        #salto-quantico { position: fixed; top: 20px; right: 20px; z-index: 20; display: flex; gap: 10px; }
        .mini-tela { width: 40px; height: 70px; background: rgba(255,255,255,0.3); border: 1px solid #fff; border-radius: 5px; }

        /* Camada Sensorial: A Estrela */
        #estrela-oio { 
            position: fixed; bottom: 40%; right: 5%; width: 50px; height: 50px; 
            background: linear-gradient(45deg, #00f2fe, #4facfe); border-radius: 50%; 
            z-index: 30; display: flex; align-items: center; justify-content: center; 
            box-shadow: 0 0 20px rgba(79, 172, 254, 0.8); cursor: pointer;
        }
    </style>
</head>
<body>

    <video id="camera" autoplay playsinline></video>

    <div id="salto-quantico">
        <div class="mini-tela"></div>
        <div class="mini-tela" style="opacity: 0.5;"></div>
    </div>

    <div id="estrela-oio" onclick="sentirOIO()">✨</div>

    <div id="interface-oio">
        <div style="width: 40px; height: 5px; background: rgba(255,255,255,0.5); margin: 10px; border-radius: 10px;"></div>
        <div class="menu-apps">
            <div class="app-icon" onclick="window.location.href='https://google.com'">🌐<br>Google</div>
            <div class="app-icon" onclick="window.location.href='https://youtube.com'">📺<br>YouTube</div>
            <div class="app-icon">📩<br>Mensagens</div>
            <div class="app-icon">📞<br>Contatos</div>
            <div class="app-icon">🗺️<br>Maps</div>
        </div>
        <p style="color: white; font-size: 14px; margin-top: 10px;">OIO ONE - Autoria: Michel</p>
    </div>

    <script>
        // Ativa Identidade
        const v = document.getElementById('camera');
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(s => v.srcObject = s);

        // Camada Sensorial (Vibração OIO)
        function sentirOIO() {
            if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
            console.log("OIO ONE: Michel Identificado.");
        }
    </script>
</body>
</html>
