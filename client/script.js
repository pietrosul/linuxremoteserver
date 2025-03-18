// Variabile globale
let serverAddress = '';
let streamInterval = null;
let isStreamActive = false;

// Constante pentru configurație
const CONFIG = {
    FETCH_TIMEOUT: 10000, // 10 secunde timeout pentru request-uri
    RETRY_ATTEMPTS: 3,    // Număr de încercări pentru request-uri eșuate
    STREAM_INTERVAL: 1000 // Intervalul de reîmprospătare a stream-ului (ms)
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
    connectionStatus: document.getElementById('connection-status')
};

// Inițializare după încărcarea paginii
document.addEventListener('DOMContentLoaded', () => {
    // Verificare dacă există o sesiune salvată
    const savedServer = localStorage.getItem('serverAddress');
    if (savedServer) {
        elements.serverAddressInput.value = savedServer;
    }
    
    // Dezactivare buton login până la verificarea conexiunii
    elements.loginBtn.disabled = true;
    
    // Adăugare event listeners
    setupEventListeners();
});

// Configurare event listeners
function setupEventListeners() {
    // Event listener pentru butonul de verificare conexiune
    elements.checkConnectionBtn.addEventListener('click', checkServerConnection);
    
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

// Funcție pentru verificarea conexiunii la server
async function checkServerConnection() {
    const serverAddress = elements.serverAddressInput.value.trim();
    
    if (!serverAddress) {
        ConnectionCheck.displayConnectionCheck({
            valid: false,
            message: 'Introduceți adresa serverului'
        }, 'connection-status');
        return;
    }
    
    // Afișăm starea de "verificare..."
    elements.connectionStatus.innerHTML = '<span style="color: #3498db;">Se verifică conexiunea...</span>';
    
    // Verifică conexiunea
    const result = await ConnectionCheck.checkConnection(serverAddress);
    ConnectionCheck.displayConnectionCheck(result, 'connection-status');
    
    // Dacă conexiunea este validă, activăm butonul de login
    elements.loginBtn.disabled = !result.valid;
    
    return result;
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
        elements.loginBtn.innerHTML = 'Se conectează...';
        elements.loginBtn.disabled = true;
        
        // Verificăm conexiunea doar dacă nu există deja o verificare validă
        if (!elements.connectionStatus.textContent.includes('Conectat la server')) {
            const connectionResult = await checkServerConnection();
            if (!connectionResult.valid) {
                elements.loginBtn.innerHTML = 'Conectare';
                elements.loginBtn.disabled = false;
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
            // Salvăm adresa serverului în localStorage
            localStorage.setItem('serverAddress', normalizedAddress);
            
            // Setăm adresa globală a serverului
            serverAddress = normalizedAddress;
            
            // Actualizăm informația despre server în dashboard
            updateServerInfo(normalizedAddress);
            
            // Ascundem ecranul de login și afișăm dashboard-ul
            elements.loginScreen.classList.add('hidden');
            elements.dashboard.classList.remove('hidden');
            
            // Încărcăm informațiile inițiale
            loadSystemInfo();
            refreshScreen();
            
            // Afișăm un mesaj de bun venit în terminal
            appendToTerminal(`Conectat la ${normalizedAddress}`, 'success');
            appendToTerminal("Pentru a vedea ecranul, apăsați pe butonul 'Reîmprospătare'", 'info');
        } else {
            showLoginError('Parolă incorectă');
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
    } finally {
        // Resetăm butonul de login
        elements.loginBtn.innerHTML = 'Conectare';
        elements.loginBtn.disabled = false;
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

// Funcție pentru reîmprospătarea ecranului
function refreshScreen() {
    // Afișăm indicatorul de încărcare
    elements.loadingOverlay.classList.remove('hidden');
    
    // Setăm sursa imaginii cu un timestamp pentru a evita cache-ul
    const timestamp = new Date().getTime();
    elements.screen.src = `${serverAddress}/api/screenshot?t=${timestamp}`;
    
    // Ascundem indicatorul de încărcare când imaginea s-a încărcat
    elements.screen.onload = () => {
        elements.loadingOverlay.classList.add('hidden');
    };
    
    // Ascundem indicatorul de încărcare dacă apare o eroare
    elements.screen.onerror = () => {
        elements.loadingOverlay.classList.add('hidden');
        // Adăugăm un mesaj de eroare
        appendToTerminal("Eroare la încărcarea capturii de ecran. Verificați conexiunea.", 'error');
    };
}

// Funcție pentru pornirea stream-ului de ecran
function startScreenStream() {
    if (isStreamActive) return;
    
    // Ascundem butonul de pornire și afișăm butonul de oprire
    elements.startStreamBtn.classList.add('hidden');
    elements.stopStreamBtn.classList.remove('hidden');
    
    // Setăm flag-ul de stream activ
    isStreamActive = true;
    
    // Pornim un interval pentru reîmprospătarea ecranului
    streamInterval = setInterval(refreshScreen, CONFIG.STREAM_INTERVAL);
    
    // Afișăm un mesaj în terminal
    appendToTerminal("Stream live pornit", 'info');
}

// Funcție pentru oprirea stream-ului de ecran
function stopScreenStream() {
    if (!isStreamActive) return;
    
    // Ascundem butonul de oprire și afișăm butonul de pornire
    elements.stopStreamBtn.classList.add('hidden');
    elements.startStreamBtn.classList.remove('hidden');
    
    // Setăm flag-ul de stream inactiv
    isStreamActive = false;
    
    // Oprim intervalul de reîmprospătare
    clearInterval(streamInterval);
    
    // Afișăm un mesaj în terminal
    appendToTerminal("Stream live oprit", 'info');
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

// Funcție pentru adăugarea de conținut în terminal
function appendToTerminal(text, type) {
    const element = document.createElement('div');
    
    if (type === 'command') {
        element.innerHTML = `<p><span style="color: #3498db;">${text}</span></p>`;
    } else if (type === 'error') {
        element.innerHTML = `<p><span style="color: #e74c3c;">${text}</span></p>`;
    } else if (type === 'info') {
        element.innerHTML = `<p><span style="color: #f39c12;">${text}</span></p>`;
    } else if (type === 'success') {
        element.innerHTML = `<p><span style="color: #2ecc71;">${text}</span></p>`;
    } else { // output
        element.innerHTML = `<pre>${text}</pre>`;
    }
    
    elements.terminalOutput.appendChild(element);
    
    // Scroll la sfârșitul terminalului
    elements.terminalOutput.scrollTop = elements.terminalOutput.scrollHeight;
} 