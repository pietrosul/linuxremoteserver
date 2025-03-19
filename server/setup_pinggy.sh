#!/bin/bash

# Script de configurare Pinggy pentru Remote Access Tool
# Acest script configurează suportul pentru Pinggy în Remote Access Tool

echo "===== Configurare Pinggy pentru Remote Access Tool ====="
echo "Acest script va configura un tunel SSH pentru accesul la distanță."

# Verifică dacă SSH este instalat
if ! command -v ssh &> /dev/null; then
    echo "Eroare: SSH nu este instalat. Instalați-l folosind comanda 'apt-get install openssh-client' (pe Debian/Ubuntu) sau echivalentul pentru distribuția dvs."
    exit 1
fi

# Verifică dacă python3 este instalat
if ! command -v python3 &> /dev/null; then
    echo "Eroare: Python3 nu este instalat. Instalați-l înainte de a continua."
    exit 1
fi

# Creează un fișier temporar pentru a reține URL-ul
TEMP_URL_FILE="/tmp/pinggy_url.txt"
touch "$TEMP_URL_FILE"
chmod 600 "$TEMP_URL_FILE"

# Funcție pentru a extrage URL-ul din output-ul SSH
extract_url() {
    grep -o "https://[^ ]*\.pinggy\.io" "$1"
}

# Pornește tunelul Pinggy în fundal și capturează output-ul
echo "Pornire tunel Pinggy..."
ssh -R 0:localhost:8080 a.pinggy.io > "$TEMP_URL_FILE" 2>&1 &
TUNNEL_PID=$!

# Așteaptă ca URL-ul să fie generat
echo "Se așteaptă URL-ul..."
MAX_WAIT=30
WAIT_COUNT=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    URL=$(extract_url "$TEMP_URL_FILE")
    if [ -n "$URL" ]; then
        echo "URL public generat: $URL"
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT+1))
    echo -n "."
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "Timpul a expirat. Nu s-a putut genera URL-ul. Verificați conexiunea la internet."
    kill $TUNNEL_PID
    exit 1
fi

# Adaugă un hook pentru a opri tunelul la închiderea scriptului
trap "kill $TUNNEL_PID; rm $TEMP_URL_FILE; echo 'Tunel închis.'" EXIT

# Pornește serverul Remote Access Tool
echo "Se pornește Remote Access Tool..."
cd "$(dirname "$0")"
python3 remote_server.py

# Notă: Scriptul de mai sus nu se va termina niciodată normal pentru că remote_server.py va rula în prim-plan
# La apăsarea Ctrl+C, trap-ul va fi declanșat și va opri tunelul Pinggy 