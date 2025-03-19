#!/bin/bash

# Script de configurare pentru Remote Access Tool
# Acest script configurează un tunel local->public pentru accesul la distanță

echo "===== Configurare acces la distanță pentru Remote Access Tool ====="
echo "Acest script va configura un tunel pentru accesul de la distanță."

# Verifică dacă SSH este instalat
if ! command -v ssh &> /dev/null; then
    echo "Eroare: SSH nu este instalat. Instalați-l folosind comanda:"
    echo "apt-get install openssh-client (pe Debian/Ubuntu) sau echivalentul pentru distribuția dvs."
    exit 1
fi

# Verifică dacă python3 este instalat
if ! command -v python3 &> /dev/null; then
    echo "Eroare: Python3 nu este instalat. Instalați-l înainte de a continua."
    exit 1
fi

# Creează fișier temporar pentru a reține URL-ul
TEMP_URL_FILE="/tmp/tunnel_url.txt"
touch "$TEMP_URL_FILE"
chmod 600 "$TEMP_URL_FILE"

# Pornește serverul flask în fundal
echo "Pornire server Remote Access Tool în fundal..."
cd "$(dirname "$0")"
python3 remote_server.py > /dev/null 2>&1 &
SERVER_PID=$!

# Așteaptă un moment pentru a permite serverului să pornească
echo "Se așteaptă pornirea serverului..."
sleep 3

# Funcție pentru a verifica dacă serverul rulează
check_server_running() {
    if kill -0 $SERVER_PID 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Verifică dacă serverul a pornit corect
if ! check_server_running; then
    echo "Eroare: Serverul Remote Access Tool nu a pornit corect."
    exit 1
fi

echo "Server pornit cu succes! PID: $SERVER_PID"

# Folosește localhost.run în loc de Pinggy (mai fiabil, fără probleme de autentificare)
echo "Se creează tunelul pentru acces extern..."
echo "Acest proces poate dura până la 10 secunde."

# Rulăm localhost.run cu parametri care să evite interacțiunea cu utilizatorul
ssh -o StrictHostKeyChecking=accept-new -R 80:localhost:8080 localhost.run > "$TEMP_URL_FILE" 2>&1 &
TUNNEL_PID=$!

# Funcție pentru a extrage URL-ul din output
extract_url() {
    grep -o 'https://[a-zA-Z0-9.-]*\.lhrtunnel.link' "$1" | head -n 1
}

# Așteaptă generarea URL-ului
echo -n "Se așteaptă URL-ul public"
MAX_WAIT=15
WAIT_COUNT=0
URL=""

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    URL=$(extract_url "$TEMP_URL_FILE")
    if [ -n "$URL" ]; then
        echo
        echo "═══════════════════════════════════════════════════"
        echo "✓ Tunel creat cu succes!"
        echo "✓ URL public: $URL"
        echo "═══════════════════════════════════════════════════"
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT+1))
    echo -n "."
done

if [ -z "$URL" ]; then
    echo
    echo "Nu s-a putut obține un URL public. Serverul va fi disponibil doar local:"
    echo "http://localhost:8080 sau IP-ul local și portul 8080"
    
    # Încheiem procesul de tunel dacă nu s-a obținut URL-ul
    kill $TUNNEL_PID 2>/dev/null
fi

# Adăugăm un mesaj pentru informare
echo
echo "Serverul Remote Access Tool rulează acum."
echo "Pentru a opri serverul și tunelul, apasă CTRL+C"
echo

# Funcție pentru curățare la ieșire
cleanup() {
    echo "Se închid tunelul și serverul..."
    kill $TUNNEL_PID 2>/dev/null
    kill $SERVER_PID 2>/dev/null
    rm -f "$TEMP_URL_FILE"
    echo "Server oprit."
    exit 0
}

# Adaugă hook pentru a opri totul la ieșire
trap cleanup EXIT INT TERM

# Menține scriptul activ
while check_server_running; do
    sleep 5
done

echo "Serverul s-a oprit. Se închide tunelul..."
kill $TUNNEL_PID 2>/dev/null
rm -f "$TEMP_URL_FILE"
echo "Scriptul s-a terminat." 