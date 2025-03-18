# Ghid de depanare pentru Remote Access Tool

Acest ghid vă ajută să diagnosticați și să rezolvați problemele comune întâlnite la utilizarea Remote Access Tool-ului.

## Probleme de conectare

### Eroarea "Failed to fetch"

Dacă primiți eroarea "Failed to fetch" la încercarea de a vă conecta la server, verificați următoarele:

1. **Verificați adresa serverului**:
   - Asigurați-vă că ați inclus protocolul `http://` la începutul adresei
   - Verificați dacă portul este specificat corect (de obicei 8080)
   - Exemplu corect: `http://192.168.1.100:8080`

2. **Verificați dacă serverul rulează**:
   - Pe laptop-ul țintă, verificați dacă scriptul server rulează cu comanda:
     ```bash
     systemctl status remote-access
     ```
   - Dacă serviciul nu rulează, porniți-l cu:
     ```bash
     sudo systemctl start remote-access
     ```

3. **Verificați firewall-ul**:
   - Asigurați-vă că portul 8080 este deschis în firewall:
     ```bash
     sudo ufw status
     ```
   - Dacă este necesar, deschideți portul:
     ```bash
     sudo ufw allow 8080/tcp
     ```

4. **Verificați conexiunea la rețea**:
   - Asigurați-vă că ambele dispozitive (laptop-ul țintă și cel de control) sunt în aceeași rețea
   - Verificați conectivitatea cu comanda ping:
     ```bash
     ping adresa_ip_a_laptop-ului_tinta
     ```

5. **Verificați adresa IP a serverului**:
   - Adresa IP a laptop-ului poate fi schimbată dacă folosiți DHCP
   - Verificați adresa IP curentă cu:
     ```bash
     ip a
     ```

### Conexiune lentă sau întreruperi de stream

1. **Reduceți rata de refresh a stream-ului**:
   - Deschideți fișierul `client/script.js`
   - Modificați valoarea `STREAM_INTERVAL` (de exemplu, de la 1000 la 2000 pentru refresh la 2 secunde)

2. **Reduceți calitatea imaginii**:
   - Deschideți fișierul `server/remote_server.py`
   - Găsiți linia cu `cv2.IMWRITE_JPEG_QUALITY, 70` și reduceți valoarea calității (de exemplu, la 50)

## Probleme cu dependențele

### Instalarea dependențelor durează prea mult

1. **Verificați starea instalării**:
   - Procesul de instalare a dependențelor poate dura mai mult la prima rulare, mai ales pe un sistem mai vechi
   - Lăsați procesul să se finalizeze

2. **Instalați manual dependențele**:
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-opencv scrot x11-utils
   pip3 install flask flask-cors pyautogui numpy
   ```

### Eroare la importul modulelor

Dacă primiți erori despre module care nu pot fi importate:
```
ImportError: No module named 'flask'
```

Instalați manual modulul lipsă:
```bash
pip3 install flask flask-cors pyautogui numpy opencv-python
```

## Probleme de permisiuni

### Eroare la captura de ecran

Dacă serverul nu poate captura ecranul, asigurați-vă că rulează cu permisiunile necesare pentru X server:

1. **Rulați ca utilizatorul corect**:
   ```bash
   sudo nano /etc/systemd/system/remote-access.service
   ```
   
   Modificați linia `User=root` cu `User=numele_utilizatorului_cu_sesiune_X`
   
2. **Acordați acces la afișajul X**:
   ```bash
   xhost +local:
   ```

3. **Setați variabila de mediu DISPLAY**:
   Adăugați această linie în `/etc/systemd/system/remote-access.service` sub secțiunea `[Service]`:
   ```
   Environment=DISPLAY=:0
   ```
   
   După modificări, reîncărcați și reporniți serviciul:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart remote-access
   ```

## Probleme de browser

### Pagina este goală sau nu se încarcă corect

1. **Verificați consola browser-ului**:
   - Deschideți uneltele de dezvoltator (F12 în majoritatea browser-elor)
   - Verificați mesajele de eroare din consolă

2. **Dezactivați Content Security Policy**:
   - Folosiți o extensie precum "Disable Content-Security-Policy" pentru teste

3. **Verificați cerințele browser-ului**:
   - Folosiți un browser modern (Chrome, Firefox, Edge)
   - Asigurați-vă că JavaScript este activat

### Erori CORS

Dacă vedeți erori legate de CORS (Cross-Origin Resource Sharing) în consola browser-ului:

1. **Verificați header-ele de răspuns ale serverului**:
   - Asigurați-vă că fișierul `server/remote_server.py` include header-ele CORS corecte
   - Verificați funcționarea middleware-ului CORS din Flask

2. **Rulați clientul local**:
   - Deschideți fișierele direct în browser (fără a folosi un server local)

## Restartarea serverului de la zero

Dacă întâmpinați probleme persistente, uneori cea mai bună soluție este să restartați complet serviciul:

```bash
sudo systemctl stop remote-access
sudo systemctl disable remote-access
sudo rm /etc/systemd/system/remote-access.service
sudo systemctl daemon-reload

# Reinstalați serviciul
cd /path/to/server/
sudo ./setup.sh
```

## Contactare suport

Dacă problemele persistă după ce ați parcurs acest ghid, consultați documentația completă sau căutați asistență pentru probleme specifice online. 

Rețineți că acest tool este destinat exclusiv pentru utilizare pe propriile sisteme și în scopuri educaționale! 