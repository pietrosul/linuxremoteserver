// Variabile globale
let serverAddress = '';
let streamInterval = null;
let isStreamActive = false;

// Constante pentru configurație
const CONFIG = {
    FETCH_TIMEOUT: 10000, // 10 secunde timeout pentru request-uri
    RETRY_ATTEMPTS: 3,    // Număr de încercări pentru request-uri eșuate
    STREAM_INTERVAL: 1000, // Intervalul de reîmprospătare a stream-ului (ms)
    PRELOAD_IMAGES: true,  // Preîncărcarea imaginilor pentru stream fluid
    MINIMUM_FRAME_DELAY: 200 // Delay minim între frame-uri (ms)
};

// Variable pentru setări utilizator
const userSettings = {
    rememberServer: true,
    autoReconnect: false
};

// Elemente DOM pentru acces rapid
const elements = {
    loginScreen: document.getElementById('login-screen'),
    dashboard: document.getElementById('dashboard'),
    serverAddressInput: document.getElementById('server-address'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.getElementById('login-btn'),
    loginMessage: document.getElementById('login-message'),
    logoutBtn: document.getElementById('logout-btn'),
    systemInfoContent: document.getElementById('system-info-content'),
    screen: document.getElementById('screen'),
    refreshScreenBtn: document.getElementById('refresh-screen'),
    startStreamBtn: document.getElementById('start-stream'),
    stopStreamBtn: document.getElementById('stop-stream'),
    loadingOverlay: document.getElementById('loading-overlay'),
    terminalOutput: document.getElementById('terminal-output'),
    commandInput: document.getElementById('command-input'),
    executeCommandBtn: document.getElementById('execute-command'),
    serverHost: document.getElementById('server-host'),
    checkConnectionBtn: document.getElementById('check-connection'),
    connectionStatus: document.getElementById('connection-status'),
    ngrokInfoContainer: document.getElementById('ngrok-info')
};

// La inițializare, verifică și setările salvate
document.addEventListener('DOMContentLoaded', () => {
    // Verificare dacă există o sesiune salvată
    const savedServer = localStorage.getItem('serverAddress');
    if (savedServer) {
        elements.serverAddressInput.value = savedServer;
    }
    
    // Verifică setările salvate
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            userSettings.rememberServer = parsedSettings.rememberServer !== undefined ? 
                parsedSettings.rememberServer : true;
            userSettings.autoReconnect = parsedSettings.autoReconnect !== undefined ? 
                parsedSettings.autoReconnect : false;
                
            // Actualizează UI-ul cu setările salvate
            document.getElementById('remember-server').checked = userSettings.rememberServer;
            document.getElementById('auto-reconnect').checked = userSettings.autoReconnect;
        } catch (error) {
            console.error('Eroare la parsarea setărilor salvate:', error);
        }
    }
    
    // Dezactivare buton login până la verificarea conexiunii
    elements.loginBtn.disabled = true;
    
    // Adăugare event listeners
    setupEventListeners();
    
    // Adăugăm efectul de ripple la butoane
    addRippleEffect();
    
    // Adaugă efect de scanare pentru imaginea ecranului
    addScanEffect();
    
    // Inițializare event listener pentru câmpul de parolă - aplicăm blur când încep să scriu
    if (elements.passwordInput) {
        elements.passwordInput.addEventListener('input', handlePasswordInput);
    }
});

// Configurare event listeners
function setupEventListeners() {
    // Event listener pentru opțiunea de memorare server
    document.getElementById('remember-server').addEventListener('change', function() {
        userSettings.rememberServer = this.checked;
        saveUserSettings();
    });
    
    // Event listener pentru opțiunea de auto-reconectare
    document.getElementById('auto-reconnect').addEventListener('change', function() {
        userSettings.autoReconnect = this.checked;
        saveUserSettings();
    });
    
    // Event listener pentru butonul de verificare conexiune
    elements.checkConnectionBtn.addEventListener('click', async function() {
        const serverAddress = elements.serverAddressInput.value.trim();
        
        if (!serverAddress) {
            ConnectionCheck.displayConnectionCheck({
                valid: false,
                message: 'Introduceți adresa serverului'
            }, 'connection-status');
            return;
        }
        
        // Afișează starea de "verificare..."
        const statusElement = document.getElementById('connection-status');
        statusElement.innerHTML = '<span style="color: var(--primary);"><i class="fas fa-spinner fa-spin"></i> Se verifică conexiunea...</span>';
        
        // Verifică conexiunea
        const result = await ConnectionCheck.checkConnection(serverAddress);
        ConnectionCheck.displayConnectionCheck(result, 'connection-status');
        
        // Dacă conexiunea este validă, activează butonul de login
        if (result.valid) {
            document.getElementById('login-btn').disabled = false;
        }
    });
    
    // Event listener pentru toggle-ul parolei
    const passwordField = document.getElementById('password');
    const passwordToggle = document.querySelector('.password-toggle');

    if (passwordToggle && passwordField) {
        passwordToggle.addEventListener('click', function() {
            // Dacă câmpul este gol, nu facem nimic
            if (!passwordField.value) return;
            
            if (passwordField.classList.contains('password-blur')) {
                // Arată parola (cu efect de fadeOut pentru blur)
                passwordField.classList.add('password-toggle-fade-out');
                
                // Dăm timp tranzițiilor să se aplice
                setTimeout(() => {
                    passwordField.classList.remove('password-blur');
                    passwordField.classList.add('password-clear');
                }, 10);
                
                // Schimbă iconița
                this.querySelector('i').classList.remove('fa-eye');
                this.querySelector('i').classList.add('fa-eye-slash');
                
                // Eliminăm clasa de tranziție după ce s-a terminat animația
                setTimeout(() => {
                    passwordField.classList.remove('password-toggle-fade-out');
                }, 350);
            } else {
                // Ascunde parola (cu efect de fadeIn pentru blur)
                passwordField.classList.add('password-toggle-fade-in');
                
                // Dăm timp tranzițiilor să se aplice 
                setTimeout(() => {
                    passwordField.classList.remove('password-clear');
                    passwordField.classList.add('password-blur');
                }, 10);
                
                // Schimbă iconița
                this.querySelector('i').classList.remove('fa-eye-slash');
                this.querySelector('i').classList.add('fa-eye');
                
                // Eliminăm clasa de tranziție după ce s-a terminat animația
                setTimeout(() => {
                    passwordField.classList.remove('password-toggle-fade-in');
                }, 350);
            }
        });
    }
    
    // Event listener pentru modificarea adresei serverului
    elements.serverAddressInput.addEventListener('input', () => {
        // Resetăm statusul conexiunii și dezactivăm butonul de login
        elements.connectionStatus.innerHTML = '';
        elements.loginBtn.disabled = true;
    });
    
    // Event listener pentru butonul de login
    elements.loginBtn.addEventListener('click', handleLogin);
    
    // Event listener pentru butonul de logout
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Event listener pentru apăsarea tastei Enter în câmpul de parolă
    elements.passwordInput.addEventListener('keypress', event => {
        if (event.key === 'Enter' && !elements.loginBtn.disabled) {
            handleLogin();
        }
    });
    
    // Event listeners pentru control ecran
    elements.refreshScreenBtn.addEventListener('click', refreshScreen);
    elements.startStreamBtn.addEventListener('click', startScreenStream);
    elements.stopStreamBtn.addEventListener('click', stopScreenStream);
    
    // Event listener pentru execuție comandă
    elements.executeCommandBtn.addEventListener('click', () => {
        const command = elements.commandInput.value.trim();
        if (command) {
            executeCommand(command);
            elements.commandInput.value = '';
        }
    });
    
    // Event listener pentru apăsarea tastei Enter în câmpul de comandă
    elements.commandInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            const command = elements.commandInput.value.trim();
            if (command) {
                executeCommand(command);
                elements.commandInput.value = '';
            }
        }
    });
    
    // Event listeners pentru butoanele de acțiune rapidă
    document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', () => {
            const command = button.getAttribute('data-command');
            if (command) {
                executeCommand(command);
            }
        });
    });
}

// Funcție pentru salvarea setărilor utilizatorului
function saveUserSettings() {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
}

// Funcție pentru verificarea conexiunii la server
async function checkServerConnection() {
    const serverAddress = elements.serverAddressInput.value.trim();
    
    if (!serverAddress) {
        ConnectionCheck.displayConnectionCheck({
            valid: false,
            message: 'Introduceți adresa serverului'
        }, 'connection-status');
        return { valid: false };
    }
    
    // Afișăm starea de "verificare..."
    elements.connectionStatus.innerHTML = '<span style="color: var(--primary);"><i class="fas fa-spinner fa-spin"></i> Se verifică conexiunea...</span>';
    
    try {
        // Verifică conexiunea
        const result = await ConnectionCheck.checkConnection(serverAddress);
        ConnectionCheck.displayConnectionCheck(result, 'connection-status');
        
        // Dacă conexiunea este validă, activăm butonul de login
        elements.loginBtn.disabled = !result.valid;
        
        // Verifică și afișează informațiile despre tunelul ngrok
        checkNgrokTunnel(serverAddress);
        
        return result;
    } catch (error) {
        // În caz de eroare, afișăm un mesaj și dezactivăm butonul
        ConnectionCheck.displayConnectionCheck({
            valid: false,
            message: `Eroare la verificarea conexiunii: ${error.message}`
        }, 'connection-status');
        elements.loginBtn.disabled = true;
        return { valid: false };
    }
}

// Funcție care adaugă timeout la fetch
async function fetchWithTimeout(url, options, timeout = CONFIG.FETCH_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
        ...options,
        signal: controller.signal
    });
    
    clearTimeout(id);
    return response;
}

// Funcție pentru autentificare
async function handleLogin() {
    const inputServerAddress = elements.serverAddressInput.value.trim();
    const password = elements.passwordInput.value.trim();
    
    if (!inputServerAddress) {
        showLoginError('Introduceți adresa serverului');
        return;
    }
    
    if (!password) {
        showLoginError('Introduceți parola');
        return;
    }
    
    // Normalizăm adresa serverului (eliminăm trailing slash dacă există)
    const normalizedAddress = inputServerAddress.replace(/\/$/, '');
    
    try {
        // Afișăm un indicator de încărcare
        const loginBtn = elements.loginBtn;
        const originalContent = loginBtn.innerHTML;
        loginBtn.innerHTML = '<span class="button-content"><i class="fas fa-spinner fa-spin"></i> Se conectează...</span>';
        loginBtn.disabled = true;
        
        // Verificăm conexiunea doar dacă nu există deja o verificare validă
        if (!elements.connectionStatus.textContent.includes('Conectat la server')) {
            const connectionResult = await checkServerConnection();
            if (!connectionResult.valid) {
                loginBtn.innerHTML = originalContent;
                loginBtn.disabled = false;
                return;
            }
        }
        
        // Verificăm autentificarea
        const response = await fetchWithTimeout(`${normalizedAddress}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Salvăm adresa serverului în localStorage doar dacă opțiunea este activată
            if (userSettings.rememberServer) {
                localStorage.setItem('serverAddress', normalizedAddress);
            }
            
            // Setăm adresa globală a serverului
            serverAddress = normalizedAddress;
            
            // Actualizăm informația despre server în dashboard
            updateServerInfo(normalizedAddress);
            
            // Ascundem ecranul de login și afișăm dashboard-ul cu animație
            elements.loginScreen.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => {
                elements.loginScreen.classList.add('hidden');
                elements.dashboard.classList.remove('hidden');
                elements.dashboard.style.animation = 'fadeIn 0.5s forwards';
            }, 500);
            
            // Încărcăm informațiile inițiale
            loadSystemInfo();
            refreshScreen();
            
            // Afișăm un mesaj de bun venit în terminal
            appendToTerminal(`Conectat la ${normalizedAddress}`, 'success');
            appendToTerminal("Pentru a vedea ecranul, apăsați pe butonul 'Reîmprospătare'", 'info');
        } else {
            showLoginError('Parolă incorectă');
            loginBtn.innerHTML = originalContent;
            loginBtn.disabled = false;
        }
    } catch (error) {
        // Gestionăm erori specifice
        if (error.name === 'AbortError') {
            showLoginError('Conexiune expirată. Serverul nu răspunde.');
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showLoginError('Nu s-a putut conecta la server. Verificați adresa și rețeaua.');
        } else {
            showLoginError(`Eroare de conexiune: ${error.message}`);
        }
        console.error("Eroare login:", error);
        
        // Dacă opțiunea de auto-reconectare este activată, încercăm să ne reconectăm
        if (userSettings.autoReconnect) {
            showLoginError('Se încearcă reconectarea automată...');
            setTimeout(handleLogin, 5000); // Încercăm din nou după 5 secunde
        } else {
            elements.loginBtn.innerHTML = '<span class="button-content"><i class="fas fa-sign-in-alt"></i> Conectare</span>';
            elements.loginBtn.disabled = false;
        }
    }
}

// Actualizează informația despre server în dashboard
function updateServerInfo(address) {
    try {
        // Extragem hostname-ul din adresă
        const url = new URL(address);
        elements.serverHost.textContent = `${url.hostname}:${url.port}`;
    } catch (error) {
        elements.serverHost.textContent = address;
    }
}

// Funcție pentru deconectare
function handleLogout() {
    // Oprim stream-ul dacă este activ
    stopScreenStream();
    
    // Resetăm câmpurile de input
    elements.passwordInput.value = '';
    
    // Ascundem dashboard-ul și afișăm ecranul de login
    elements.dashboard.classList.add('hidden');
    elements.loginScreen.classList.remove('hidden');
}

// Funcție pentru afișarea erorilor de login
function showLoginError(message) {
    elements.loginMessage.textContent = message;
    
    // Resetăm mesajul după 5 secunde
    setTimeout(() => {
        elements.loginMessage.textContent = '';
    }, 5000);
}

// Funcție pentru încărcarea informațiilor despre sistem
async function loadSystemInfo() {
    try {
        const response = await fetchWithTimeout(`${serverAddress}/api/system-info`);
        const data = await response.json();
        
        // Actualizăm informațiile despre sistem
        elements.systemInfoContent.innerHTML = `
            <p><strong>Hostname:</strong> ${data.hostname}</p>
            <p><strong>IP:</strong> ${data.ip}</p>
            <p><strong>Sistem de operare:</strong> ${data.os}</p>
            <p><strong>Utilizator:</strong> ${data.username}</p>
        `;
    } catch (error) {
        console.error('Eroare la încărcarea informațiilor despre sistem:', error);
        elements.systemInfoContent.innerHTML = '<p class="error">Eroare la încărcarea informațiilor de sistem</p>';
    }
}

// Adaugă clasa 'loaded' la imagine când se încarcă
function markScreenAsLoaded() {
    elements.screen.classList.add('loaded');
}

// Funcție îmbunătățită pentru reîmprospătarea capturii de ecran
function refreshScreen() {
    if (!CONFIG.PRELOAD_IMAGES) {
        // Metodă clasică - arată loading la fiecare frame
        elements.loadingOverlay.classList.remove('hidden');
        elements.screen.classList.remove('loaded');
        
        // Creem un timestamp pentru a evita cache-ul
        const timestamp = new Date().getTime();
        const imageUrl = `${serverAddress}/api/screenshot?t=${timestamp}`;
        
        // Adăugăm un event listener pentru a marca imaginea ca încărcată
        elements.screen.onload = markScreenAsLoaded;
        
        // Adăugăm un event listener pentru a gestiona erorile
        elements.screen.onerror = () => {
            elements.loadingOverlay.classList.remove('hidden');
            elements.loadingOverlay.querySelector('p').textContent = 'Eroare la încărcarea capturii';
        };
        
        // Setăm sursa imaginii
        elements.screen.src = imageUrl;
    } else {
        // Metodă optimizată - preîncarcă următoarea imagine
        // și o afișează doar când e complet încărcată
        const timestamp = new Date().getTime();
        const imageUrl = `${serverAddress}/api/screenshot?t=${timestamp}`;
        
        // Doar la prima încărcare arătăm overlay-ul
        if (!elements.screen.src || elements.screen.src === '') {
            elements.loadingOverlay.classList.remove('hidden');
        }
        
        // Creăm o imagine nouă și o încărcăm în fundal
        const newImage = new Image();
        
        // Când imaginea e încărcată, o afișăm
        newImage.onload = function() {
            // Arătăm noua imagine
            elements.screen.src = this.src;
            elements.screen.classList.add('loaded');
            elements.loadingOverlay.classList.add('hidden');
            
            // Adăugăm indicațiile pentru clasa scan-active
            const screenContainer = document.getElementById('screen-container');
            if (screenContainer) {
                screenContainer.classList.add('scan-active');
                setTimeout(() => {
                    screenContainer.classList.remove('scan-active');
                }, 300);
            }
        };
        
        // În caz de eroare
        newImage.onerror = () => {
            if (isStreamActive) {
                elements.loadingOverlay.classList.remove('hidden');
                elements.loadingOverlay.querySelector('p').textContent = 'Eroare la încărcarea capturii';
            }
        };
        
        // Inițializăm încărcarea
        newImage.src = imageUrl;
    }
}

// Funcție pentru pornirea stream-ului de capturi de ecran - îmbunătățită
function startScreenStream() {
    // Verificăm dacă stream-ul este deja activ
    if (isStreamActive) return;
    
    // Marcăm stream-ul ca activ
    isStreamActive = true;
    
    // Actualizăm UI-ul
    elements.startStreamBtn.classList.add('hidden');
    elements.stopStreamBtn.classList.remove('hidden');
    
    // Încărcăm prima captură
    refreshScreen();
    
    // Setăm intervalul pentru reîmprospătare cu gestionarea delay-ului minim
    let lastRefreshTime = Date.now();
    
    streamInterval = setInterval(() => {
        const currentTime = Date.now();
        const timeSinceLastRefresh = currentTime - lastRefreshTime;
        
        if (timeSinceLastRefresh >= CONFIG.MINIMUM_FRAME_DELAY) {
            refreshScreen();
            lastRefreshTime = currentTime;
        }
    }, CONFIG.STREAM_INTERVAL);
    
    // Adăugăm clasa pentru a arăta că stream-ul este activ
    const screenContainer = document.getElementById('screen-container');
    if (screenContainer) {
        screenContainer.classList.add('stream-active');
    }
    
    // Adăugăm un control pentru intervalul de reîmprospătare
    addStreamControls();
}

// Funcție pentru adăugarea controalelor de stream
function addStreamControls() {
    // Verificăm dacă există deja controalele
    if (document.getElementById('stream-controls')) {
        return;
    }
    
    // Creăm containerul pentru controale
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'stream-controls';
    controlsContainer.className = 'stream-controls';
    
    // Adăugăm un slider pentru ajustarea vitezei
    const speedControl = document.createElement('div');
    speedControl.className = 'speed-control';
    speedControl.innerHTML = `
        <label for="stream-speed">Viteză stream: <span id="speed-value">${CONFIG.STREAM_INTERVAL}ms</span></label>
        <input type="range" id="stream-speed" min="200" max="2000" step="100" value="${CONFIG.STREAM_INTERVAL}">
    `;
    
    // Adăugăm un checkbox pentru activarea preîncărcării
    const preloadControl = document.createElement('div');
    preloadControl.className = 'preload-control';
    preloadControl.innerHTML = `
        <label for="preload-images">
            <input type="checkbox" id="preload-images" ${CONFIG.PRELOAD_IMAGES ? 'checked' : ''}>
            Preîncărcare imagini (recomandat)
        </label>
    `;
    
    // Adăugăm controalele în container
    controlsContainer.appendChild(speedControl);
    controlsContainer.appendChild(preloadControl);
    
    // Adăugăm containerul în DOM
    const screenControls = document.querySelector('.screen-controls');
    if (screenControls) {
        screenControls.appendChild(controlsContainer);
        
        // Adăugăm event listener pentru slider
        document.getElementById('stream-speed').addEventListener('input', function() {
            const newValue = parseInt(this.value);
            CONFIG.STREAM_INTERVAL = newValue;
            document.getElementById('speed-value').textContent = `${newValue}ms`;
            
            // Restartăm intervalul cu noua viteză
            if (isStreamActive) {
                clearInterval(streamInterval);
                let lastRefreshTime = Date.now();
                
                streamInterval = setInterval(() => {
                    const currentTime = Date.now();
                    const timeSinceLastRefresh = currentTime - lastRefreshTime;
                    
                    if (timeSinceLastRefresh >= CONFIG.MINIMUM_FRAME_DELAY) {
                        refreshScreen();
                        lastRefreshTime = currentTime;
                    }
                }, CONFIG.STREAM_INTERVAL);
            }
        });
        
        // Adăugăm event listener pentru checkbox
        document.getElementById('preload-images').addEventListener('change', function() {
            CONFIG.PRELOAD_IMAGES = this.checked;
        });
    }
}

// Funcție pentru oprirea stream-ului de capturi de ecran - îmbunătățită
function stopScreenStream() {
    // Verificăm dacă stream-ul este activ
    if (!isStreamActive) return;
    
    // Marcăm stream-ul ca inactiv
    isStreamActive = false;
    
    // Oprim intervalul
    clearInterval(streamInterval);
    
    // Actualizăm UI-ul
    elements.stopStreamBtn.classList.add('hidden');
    elements.startStreamBtn.classList.remove('hidden');
    
    // Eliminăm controalele de stream
    const streamControls = document.getElementById('stream-controls');
    if (streamControls) {
        streamControls.remove();
    }
    
    // Eliminăm clasa pentru a arăta că stream-ul este inactiv
    const screenContainer = document.getElementById('screen-container');
    if (screenContainer) {
        screenContainer.classList.remove('stream-active');
    }
}

// Funcție pentru executarea unei comenzi
async function executeCommand(command) {
    try {
        // Afișăm comanda în terminal
        appendToTerminal(`$ ${command}`, 'command');
        
        // Executăm comanda pe server
        const response = await fetchWithTimeout(`${serverAddress}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command })
        });
        
        const data = await response.json();
        
        // Afișăm output-ul în terminal
        if (data.error) {
            appendToTerminal(data.error, 'error');
        } else {
            appendToTerminal(data.output || 'Comanda a fost executată fără output', 'output');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            appendToTerminal(`Eroare: Timeout la executarea comenzii`, 'error');
        } else {
            appendToTerminal(`Eroare: ${error.message}`, 'error');
        }
    }
}

// Modificare la funcția appendToTerminal pentru a aplica efectul de typing la ultima comandă
function appendToTerminal(text, type) {
    const element = document.createElement('div');
    
    // Îndepărtăm clasa typing de la ultima comandă anterioară
    const previousElements = document.querySelectorAll('#terminal-output div.typing');
    previousElements.forEach(el => el.classList.remove('typing'));
    
    if (type === 'command') {
        element.innerHTML = `<p><span style="color: var(--primary);">${text}</span></p>`;
        element.classList.add('typing'); // Adăugăm clasa typing pentru animație
    } else if (type === 'error') {
        element.innerHTML = `<p><span style="color: var(--accent-soft);">${text}</span></p>`;
    } else if (type === 'info') {
        element.innerHTML = `<p><span style="color: #f59e0b;">${text}</span></p>`;
    } else if (type === 'success') {
        element.innerHTML = `<p><span style="color: #10b981;">${text}</span></p>`;
    } else { // output
        element.innerHTML = `<pre>${text}</pre>`;
    }
    
    elements.terminalOutput.appendChild(element);
    
    // Scroll la sfârșitul terminalului
    elements.terminalOutput.scrollTop = elements.terminalOutput.scrollHeight;
}

// Adăugăm efect de ripple la butoane
function addRippleEffect() {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Adaugă efect de scanare pentru ecran
function addScanEffect() {
    const screenContainer = document.querySelector('.screen-container');
    if (screenContainer) {
        screenContainer.addEventListener('mouseenter', function() {
            this.classList.add('scan-active');
        });
        
        screenContainer.addEventListener('mouseleave', function() {
            this.classList.remove('scan-active');
        });
    }
}

// Funcție pentru gestionarea input-ului de parolă
function handlePasswordInput() {
    // Prima apăsare de tastă - aplicăm blur INSTANT fără niciun fade
    if (this.value && !this.classList.contains('password-clear') && !this.classList.contains('password-blur')) {
        this.classList.add('password-blur');
    } else if (this.value && !this.classList.contains('password-clear')) {
        // Dacă există deja text și nu este în modul clear, menținem blur-ul
        this.classList.add('password-blur');
    } else if (!this.value) {
        // Dacă câmpul este gol, eliminăm orice stil
        this.classList.remove('password-blur');
        this.classList.remove('password-clear');
        this.classList.remove('password-toggle-fade-in');
        this.classList.remove('password-toggle-fade-out');
    }
}

// Funcție pentru a verifica și afișa informații despre tunelul ngrok
async function checkNgrokTunnel(serverUrl) {
    try {
        const response = await fetchWithTimeout(`${serverUrl}/api/tunnel-info`);
        if (response.ok) {
            const data = await response.json();
            if (data.tunnel_url) {
                elements.ngrokInfoContainer.innerHTML = `
                    <div class="info-section">
                        <h3>Informații tunel</h3>
                        <p><strong>URL public:</strong> <a href="${data.tunnel_url}" target="_blank">${data.tunnel_url}</a></p>
                        <p><strong>URL local:</strong> ${data.local_url}</p>
                    </div>
                `;
                elements.ngrokInfoContainer.style.display = 'block';
                return true;
            }
        }
        elements.ngrokInfoContainer.style.display = 'none';
        return false;
    } catch (error) {
        elements.ngrokInfoContainer.style.display = 'none';
        console.log('Serverul nu are un tunel ngrok activ sau a apărut o eroare:', error);
        return false;
    }
} 