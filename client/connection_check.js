/**
 * Script de verificare a conexiunii pentru Remote Access Tool
 * Verifică dacă serverul este accesibil și oferă diagnostice utile
 */

// Funcție pentru verificarea protocolului URL-ului
function checkUrlProtocol(url) {
    // Verifică dacă URL-ul are protocolul specificat
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return {
            valid: false,
            message: 'Protocolul lipsește sau este invalid. Adăugați http:// sau https:// la începutul adresei.'
        };
    }
    return { valid: true };
}

// Funcție pentru verificarea formatului adresei IP sau hostname-ului
function checkIpFormat(url) {
    try {
        const urlObj = new URL(url);
        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            message: 'Format URL invalid. Formatul corect este: http://adresa_ip:port'
        };
    }
}

// Funcție pentru verificarea portului
function checkPort(url) {
    try {
        const urlObj = new URL(url);
        if (!urlObj.port) {
            return {
                valid: false,
                message: 'Portul lipsește. Adăugați portul la adresă (ex: http://192.168.1.100:8080)'
            };
        }
        return { valid: true };
    } catch (error) {
        return { valid: false, message: 'Nu se poate verifica portul în adresa URL.' };
    }
}

// Funcție pentru a verifica dacă serverul răspunde
async function checkServerResponse(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${url}/api/system-info`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            return { 
                valid: true, 
                data: data,
                message: `Conectat la server ${data.hostname || ''}`
            };
        } else {
            return {
                valid: false,
                message: `Serverul a răspuns cu eroarea: ${response.status} ${response.statusText}`
            };
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            return {
                valid: false,
                message: 'Serverul nu a răspuns în timp util. Verificați adresa și asigurați-vă că serverul rulează.'
            };
        } else if (error.message.includes('Failed to fetch')) {
            return {
                valid: false,
                message: 'Nu s-a putut conecta la server. Verificați adresa, rețeaua și firewall-ul.'
            };
        } else {
            return {
                valid: false,
                message: `Eroare la conectare: ${error.message}`
            };
        }
    }
}

// Funcție pentru verificarea completă a conexiunii
async function checkConnection(serverUrl) {
    // Pas 1: Verifică protocolul
    const protocolCheck = checkUrlProtocol(serverUrl);
    if (!protocolCheck.valid) {
        return protocolCheck;
    }
    
    // Pas 2: Verifică formatul URL-ului
    const formatCheck = checkIpFormat(serverUrl);
    if (!formatCheck.valid) {
        return formatCheck;
    }
    
    // Pas 3: Verifică portul
    const portCheck = checkPort(serverUrl);
    if (!portCheck.valid) {
        return portCheck;
    }
    
    // Pas 4: Verifică răspunsul serverului
    return await checkServerResponse(serverUrl);
}

// Funcție pentru afișarea stării verificării conexiunii
function displayConnectionCheck(result, statusElementId) {
    const statusElement = document.getElementById(statusElementId);
    
    // Dacă nu avem rezultat sau statusElement, nu afișăm nimic
    if (!result || !statusElement) {
        statusElement.innerHTML = '';
        return;
    }
    
    // Dacă nu avem mesaj, nu afișăm nimic
    if (!result.message) {
        statusElement.innerHTML = '';
        return;
    }
    
    let color, icon;
    
    if (result.valid) {
        color = '#10b981'; // Verde
        icon = 'check-circle';
    } else {
        color = '#f72585'; // Roșu
        icon = 'exclamation-circle';
    }
    
    statusElement.innerHTML = `
        <span style="color: ${color};">
            <i class="fas fa-${icon}"></i> ${result.message}
        </span>
    `;
}

// Export pentru a putea folosi acest modul în alte scripturi
window.ConnectionCheck = {
    checkConnection,
    displayConnectionCheck
}; 