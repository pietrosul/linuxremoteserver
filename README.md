# Remote Access Tool (RAT) pentru Laptop Linux

Acest proiect oferă un sistem de acces la distanță (Remote Access Tool) pentru accesarea și controlarea unui laptop Linux prin intermediul unui browser web.

**IMPORTANT:** Acest tool este creat exclusiv pentru utilizare etică pe propriile sisteme. Utilizarea pe un sistem fără permisiune este ilegală.

## Caracteristici

- Acces securizat prin autentificare cu parolă
- Vizualizare ecran live (streaming)
- Terminal interactiv pentru executarea comenzilor
- Informații despre sistem (hostname, IP, utilizator, OS)
- Acțiuni rapide predefinite pentru operațiuni uzuale
- Control sistem (shutdown, restart, etc.)
- Interfață web responsive și modernă

## Structura proiectului

Proiectul constă din două componente principale:

1. **Server** - Script Python care rulează pe laptop-ul țintă
2. **Client** - Interfață web pentru controlul de la distanță

```
├── server/
│   ├── remote_server.py    # Script-ul principal al serverului
│   └── setup.sh            # Script de instalare pentru sistemul țintă
└── client/
    ├── index.html          # Pagina web a dashboard-ului
    ├── styles.css          # Stiluri CSS pentru interfață
    └── script.js           # Funcționalitatea JavaScript a dashboard-ului
```

## Instalare

### Pe laptop-ul țintă (Linux)

1. Copiază directorul `server/` pe laptop-ul țintă.
2. Deschide fișierul `remote_server.py` și modifică parola implicită:
   ```python
   PASSWORD = "parola_ta_secretă_aici"  # Schimbă cu o parolă puternică
   ```
3. Execută scriptul de instalare:
   ```bash
   cd server/
   chmod +x setup.sh
   sudo ./setup.sh
   ```
4. Serviciul va porni automat și va rula în fundal.

**Alternativ, pentru testare rapidă** poți rula direct scriptul:
```bash
cd server/
python3 remote_server.py
```

### Pe dispozitivul de control

1. Copiază directorul `client/` pe dispozitivul de control.
2. Deschide `index.html` în orice browser modern.
3. Introdu adresa IP a laptop-ului țintă și portul 8080 (ex: `http://192.168.1.100:8080`).
4. Introdu parola configurată anterior.

## Utilizare

### Conectare
1. Introdu adresa serverului în format `http://IP:8080`
2. Introdu parola configurată
3. Apasă butonul "Conectare"

### Funcționalități dashboard
- **Vizualizare ecran**: Poți reîmprospăta manual ecranul sau activa streaming live
- **Terminal**: Execută comenzi direct din dashboard
- **Acțiuni rapide**: Butoane predefinite pentru operațiuni uzuale
- **Control sistem**: Opțiuni pentru shutdown, restart, etc.

## Securitate

Acest tool nu folosește criptare pentru conexiuni, așa că este recomandat să fie utilizat doar în rețele private de încredere. Pentru mai multă securitate, poți implementa HTTPS folosind un proxy invers precum Nginx.

## Cerințe sistem

### Server (laptop țintă)
- Sistem de operare: Ubuntu/Debian sau alt sistem Linux
- Python 3.6+
- Dependențe Python: Flask, Flask-CORS, PyAutoGUI, OpenCV, NumPy

### Client (dispozitiv de control)
- Browser web modern (Chrome, Firefox, Safari, Edge)
- JavaScript activat

## Depanare

### Server
- Verifică dacă serviciul rulează: `systemctl status remote-access`
- Verifică log-urile: `journalctl -u remote-access -f`
- Verifică dacă portul 8080 este deschis: `netstat -tulpn | grep 8080`

### Client
- Verifică conectivitatea la server: `ping adresa_IP_a_serverului`
- Verifică consolă browser pentru erori JavaScript
- Asigură-te că adresa serverului include protocolul `http://`

## Dezvoltare viitoare

- Implementare criptare HTTPS pentru conexiuni securizate
- Adăugare suport pentru transfer de fișiere
- Adăugare suport pentru input de tastatură și mouse
- Optimizare streaming video pentru latență redusă
- Implementare autentificare cu doi factori

## Contribuții

Contribuțiile sunt binevenite! Dacă dorești să îmbunătățești acest proiect, poți:
1. Fork repository-ul
2. Creează un branch pentru funcționalitatea ta (`git checkout -b feature/amazing-feature`)
3. Commit modificările (`git commit -m 'Add some amazing feature'`)
4. Push către branch (`git push origin feature/amazing-feature`)
5. Deschide un Pull Request

## Limitări de responsabilitate

Acest proiect este destinat exclusiv pentru utilizare etică pe propriile sisteme. Autorul nu își asumă nicio responsabilitate pentru utilizarea necorespunzătoare sau ilegală a acestui tool. Utilizarea acestui tool pentru accesarea neautorizată a sistemelor altora poate constitui infracțiune.

## Licență

Acest proiect este licențiat sub [MIT License](LICENSE). 