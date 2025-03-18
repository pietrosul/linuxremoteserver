#!/bin/bash

echo "===== Instalare Remote Access Tool ====="
echo "Acest script va configura un tool de acces de la distanță pentru acest sistem."
echo "IMPORTANT: Tool-ul este destinat exclusiv pentru utilizare pe propriile sisteme!"

# Verifică dacă scriptul rulează cu privilegii de root
if [ "$EUID" -ne 0 ]; then
  echo "Eroare: Rulează scriptul cu privilegii de root (sudo)."
  exit 1
fi

# Instalează dependențele necesare
echo "Instalare dependențe..."
apt-get update
apt-get install -y python3 python3-pip scrot x11-utils libopencv-dev

# Creează directorul pentru aplicație
INSTALL_DIR="/opt/remote_access"
echo "Creare director de instalare: $INSTALL_DIR"
mkdir -p $INSTALL_DIR

# Copiază scriptul principal
echo "Copiere fișiere..."
cp remote_server.py $INSTALL_DIR/

# Setează permisiunile
echo "Configurare permisiuni..."
chmod +x $INSTALL_DIR/remote_server.py

# Creează serviciul systemd pentru autostart
echo "Configurare serviciu autostart..."
cat > /etc/systemd/system/remote-access.service << EOL
[Unit]
Description=Remote Access Service
After=network.target

[Service]
ExecStart=/usr/bin/python3 $INSTALL_DIR/remote_server.py
WorkingDirectory=$INSTALL_DIR
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOL

# Activează și pornește serviciul
echo "Activare serviciu..."
systemctl daemon-reload
systemctl enable remote-access.service
systemctl start remote-access.service

# Obține adresa IP a sistemului
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo "===== Instalare finalizată cu succes! ====="
echo "Serviciul de acces la distanță rulează acum în fundal."
echo "Poți accesa dashboard-ul la: http://$IP_ADDRESS:8080"
echo "Parolă implicită: parola_secretă_puternică (schimbă această parolă în scriptul remote_server.py)" 