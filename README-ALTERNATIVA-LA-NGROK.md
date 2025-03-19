# Alternative simple la ngrok pentru Remote Access Tool

Acest ghid prezintă alternative gratuite și simple la ngrok pentru a face serverul Remote Access Tool accesibil de pe internet fără a necesita configurarea routerului.

## 1. Pinggy - Cea mai simplă soluție

[Pinggy](https://pinggy.io) este un serviciu de tunneling gratuit care nu necesită instalare sau creare de cont.

### Avantaje Pinggy:
- Nu necesită instalare de software
- Nu necesită creare de cont
- Trafic nelimitat în versiunea gratuită
- Suportă HTTP, HTTPS și TCP
- Interfață în terminal cu cod QR

### Utilizare Pinggy cu Remote Access Tool:

1. SSH este deja instalat pe majoritatea sistemelor Linux. Pe Windows, poți folosi Git Bash sau WSL.

2. Deschide un terminal și rulează:
   ```bash
   ssh -R 0:localhost:8080 a.pinggy.io
   ```

3. Vei primi un URL similar cu `https://something.a.pinggy.io` - acesta este URL-ul public pentru serverul tău.

4. Intră pe acest URL de pe orice dispozitiv conectat la internet pentru a accesa Remote Access Tool.

## 2. Serveo - Alternativă bazată pe SSH

[Serveo](https://serveo.net) este o altă opțiune simplă, tot bazată pe SSH.

### Avantaje Serveo:
- Nu necesită instalare
- Nu necesită creare de cont
- Poți specifica un subdomeniu preferat (dacă este disponibil)
- Suportă HTTP și TCP

### Utilizare Serveo:

1. Pentru a crea un tunel cu un subdomeniu aleatoriu:
   ```bash
   ssh -R 80:localhost:8080 serveo.net
   ```

2. Pentru a crea un tunel cu un subdomeniu specific (dacă este disponibil):
   ```bash
   ssh -R 80:localhost:8080 nume-subdomeniu.serveo.net
   ```

3. Folosește URL-ul generat pentru a accesa Remote Access Tool.

## 3. LocalXpose - Un serviciu versatil

[LocalXpose](https://localxpose.io) oferă o versiune gratuită cu funcționalități echilibrate.

### Avantaje LocalXpose:
- Suportă HTTP, HTTPS, TCP și UDP
- Interfață web pentru gestionarea tunelurilor
- Suportă subdomeniile locale
- Oferă un client simplu de utilizat

### Utilizare LocalXpose:

1. Descarcă și instalează clientul LocalXpose de pe [site-ul oficial](https://localxpose.io/#download).

2. Rulează comanda:
   ```bash
   loclx tunnel http --to 127.0.0.1:8080
   ```

3. Folosește URL-ul generat pentru a accesa Remote Access Tool.

## 4. Bore - Soluție open-source

[Bore](https://github.com/ekzhang/bore) este o alternativă open-source simplă.

### Avantaje Bore:
- Complet open-source
- Ușor și rapid
- Nu necesită creare de cont
- Poți rula propriul server Bore dacă dorești

### Utilizare Bore:

1. Instalează Bore folosind cargo (Rust):
   ```bash
   cargo install bore-cli
   ```

2. Rulează serverul Bore (sau folosește un server public):
   ```bash
   # Într-un terminal separat sau pe un alt server, rulează:
   bore server
   ```

3. Creează un tunel către serverul tău local:
   ```bash
   bore local 8080 --to bore.server.address:2387
   ```

4. Folosește adresa și portul afișate pentru a accesa Remote Access Tool.

## Configurare automată cu Remote Access Tool

Pentru integrare automată, ai două opțiuni:

### 1. Utilizează script-ul nostru de configurare Pinggy

Am creat un script care adaugă suport pentru Pinggy în Remote Access Tool:

1. Descarcă script-ul:
   ```bash
   wget https://raw.githubusercontent.com/user/repository/master/setup_pinggy.sh
   ```

2. Fă-l executabil:
   ```bash
   chmod +x setup_pinggy.sh
   ```

3. Rulează-l:
   ```bash
   ./setup_pinggy.sh
   ```

4. Serverul va porni automat cu suport Pinggy și va afișa URL-ul public.

### 2. Modifică manual fișierul remote_server.py

Dacă preferi o abordare manuală, poți edita fișierul `remote_server.py` pentru a adăuga suport pentru Pinggy. Adăugați următorul cod:

```python
def start_pinggy_tunnel():
    try:
        import subprocess
        import threading
        import re
        
        def run_ssh_tunnel():
            process = subprocess.Popen(
                "ssh -R 0:localhost:8080 a.pinggy.io",
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Extrage URL-ul din output
            for line in process.stdout:
                match = re.search(r'https://[^\s]+\.pinggy\.io', line)
                if match:
                    url = match.group(0)
                    print(f"Server accesibil la URL-ul public: {url}")
                    system_info["public_url"] = url
                    break
        
        # Pornește tunelul într-un thread separat
        tunnel_thread = threading.Thread(target=run_ssh_tunnel)
        tunnel_thread.daemon = True
        tunnel_thread.start()
        
        return True
    except Exception as e:
        print(f"Eroare la pornirea tunelului Pinggy: {e}")
        return False
```

## Comparație rapidă a serviciilor

| Serviciu     | Instalare | Cont necesar | Limită trafic | Subdomeniu fix | Protocoale           |
|--------------|-----------|--------------|---------------|----------------|----------------------|
| Pinggy       | Nu        | Nu           | Nelimitat     | Nu             | HTTP, HTTPS, TCP     |
| Serveo       | Nu        | Nu           | Nelimitat     | Da (dacă e disponibil) | HTTP, TCP    |
| LocalXpose   | Da        | Da (gratuit) | 15 GB / lună  | Nu             | HTTP, HTTPS, TCP, UDP|
| Bore         | Da        | Nu           | Nelimitat     | Nu             | TCP                  |
| Ngrok        | Da        | Da           | 1 GB / lună   | Nu (în free)   | HTTP, HTTPS, TCP     |

## Recomandări de securitate

Indiferent de serviciul ales:

1. Folosește parole puternice pentru serverul Remote Access Tool.
2. Dezactivează tunelul când nu îl folosești.
3. Nu expune informații sensibile prin Remote Access Tool.
4. Utilizează doar pe sisteme proprii sau cu permisiune explicită.

---

Notă: Toate aceste servicii funcționează prin stabilirea unui tunel de la serverul tău local către un server de pe internet. Asigură-te că înțelegi implicațiile de securitate înainte de a le folosi pentru a accesa sisteme sensibile. 