# Ghid pentru utilizarea Remote Access Tool cu Ngrok

## Ce este Ngrok?

Ngrok este un serviciu care permite expunerea unui server local pe internet printr-un tunel securizat. Acest lucru permite accesarea Remote Access Tool-ului de pe orice dispozitiv conectat la internet, fără a fi nevoie de configurarea porturilor în router sau firewall.

## Configurare Ngrok

### 1. Crearea unui cont Ngrok

- Accesează [https://ngrok.com/](https://ngrok.com/) și creează un cont gratuit.
- După autentificare, mergi la [dashboard](https://dashboard.ngrok.com/) și copiază token-ul de autentificare.

### 2. Instalarea Ngrok pe server

Remote Access Tool-ul are suport integrat pentru Ngrok, dar dacă dorești să folosești Ngrok separat, urmează acești pași:

1. Descarcă Ngrok pentru sistemul tău:
   - Linux: `wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip`
   - Windows: Descarcă de pe [site-ul oficial](https://ngrok.com/download)

2. Extrage arhiva:
   - Linux: `unzip ngrok-stable-linux-amd64.zip`
   - Windows: Extrage arhiva folosind Windows Explorer sau WinRAR

3. Adaugă token-ul de autentificare:
   ```
   ./ngrok authtoken <token-ul-tău>
   ```

4. Pornește un tunel către serverul Remote Access Tool:
   ```
   ./ngrok http 8080
   ```

## Utilizarea Remote Access Tool cu Ngrok

### Utilizarea integrării automate

Remote Access Tool are o integrare automată cu Ngrok. Pentru a o utiliza:

1. Asigură-te că ai instalat dependența pyngrok:
   ```
   pip install pyngrok
   ```

2. Configurează token-ul Ngrok:
   ```
   ngrok authtoken <token-ul-tău>
   ```

3. Pornește serverul Remote Access Tool:
   ```
   python3 remote_server.py
   ```

4. Serverul va porni automat un tunel Ngrok și va afișa URL-ul public în consolă.
   
5. Accesează Remote Access Tool folosind URL-ul public afișat.

6. Pe dashboard-ul Remote Access Tool, vei vedea informații despre tunelul Ngrok în secțiunea "Informații tunel".

### Limitări ale versiunii gratuite Ngrok

Versiunea gratuită a Ngrok are câteva limitări:

1. Număr limitat de conexiuni simultane
2. Conexiunile expiră după 2 ore (trebuie repornit)
3. URL-ul se schimbă la fiecare repornire
4. Fără suport pentru subdomenii personalizate

## Alternative la Ngrok

Dacă Ngrok nu îndeplinește nevoile tale, poți folosi alte servicii similare:

1. **Pinggy**: O alternativă simplă care nu necesită instalare. Se folosește prin SSH:
   ```
   ssh -R 0:localhost:8080 a.pinggy.io
   ```

2. **Localtunnel**: Instalabil prin npm:
   ```
   npm install -g localtunnel
   lt --port 8080
   ```

3. **Serveo**: Nu necesită instalare, folosește SSH:
   ```
   ssh -R 80:localhost:8080 serveo.net
   ```

## Securitate și considerații

1. **Atenție**: Prin utilizarea Ngrok, serverul tău devine accesibil de pe internet. Asigură-te că ai setat o parolă puternică în `remote_server.py`.

2. Închide tunelul Ngrok când nu îl folosești.

3. Folosește Remote Access Tool doar pe sisteme proprii sau pe sisteme pentru care ai permisiunea explicită de a le accesa.

4. Pentru utilizare în medii sensibile, consideră versiunea premium a Ngrok care oferă funcții avansate de securitate.

## Depanare

1. **Eroare "pyngrok not found"**: Instalează librăria cu `pip install pyngrok`.

2. **Eroare "Ngrok authtoken not found"**: Rulează `ngrok authtoken <token-ul-tău>` manual.

3. **Eroare "Connection failed"**: Verifică dacă ai token-ul corect și dacă serverul Remote Access Tool rulează.

4. **Eroarea "Your account has reached its connection limit"**: Acest lucru se întâmplă când atingi limita de conexiuni a contului gratuit. Așteaptă să se elibereze conexiunile sau upgradează contul.

---

Amintește-ți că acest tool este creat doar pentru scopuri educaționale și pentru utilizare pe sisteme proprii. Utilizarea Remote Access Tool pentru a accesa sisteme fără permisiune este ilegală și neetică. 