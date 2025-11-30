/* =========================================
   js/core/utils.js - YARDIMCI ARAÇLAR & VERİ YÖNETİMİ
   ========================================= */

// 1. GLOBAL VERİ HAVUZU
export const gameData = {
    quiz: [],
    hangman: [],
    match: [],
    memory: []
};

// Aktif oyunu tutan obje
export const activeGame = { current: "" };

// 2. GOOGLE SHEET ID ve GID AYIKLAYICI
export function extractSheetInfo(rawInput) {
    if (!rawInput) return { id: null, gid: null };
    
    let id = null;
    const idMatch = rawInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
    
    if (idMatch) {
        id = idMatch[1];
    } else if (!rawInput.includes("/")) {
        id = rawInput.trim();
    }

    let gid = "0"; 
    const gidMatch = rawInput.match(/gid=(\d+)/);
    if (gidMatch) gid = gidMatch[1];

    return { id, gid };
}

// 3. MERKEZİ SES YÖNETİMİ
let isGlobalMuted = false;

export function toggleGlobalSound(btn) {
    if (btn.hasAttribute('data-drag')) return;

    isGlobalMuted = !isGlobalMuted;
    
    const soundBtn = document.getElementById('global-sound-btn');
    if (soundBtn) {
        soundBtn.innerHTML = isGlobalMuted ? '🔇' : '🔊';
        soundBtn.style.background = isGlobalMuted ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)';
    }
}

export function playSound(type) {
    if (isGlobalMuted) return;

    const soundIds = {
        'correct': 'sound-correct',
        'wrong': 'sound-wrong',
        'win': 'sound-win',
        'click': 'sound-click'
    };

    const audio = document.getElementById(soundIds[type]);
    if (audio) { 
        audio.currentTime = 0; 
        audio.play().catch(() => {}); 
    }
}

// 4. VERİ ERİŞİM YARDIMCILARI
export function getData() { 
    return gameData[activeGame.current] || []; 
}

export function setData(data) { 
    gameData[activeGame.current] = data; 
}

// 5. LOCAL STORAGE (OTOMATİK KAYIT SİSTEMİ)

export function saveToLocal() {
    const saveData = {
        quiz: gameData.quiz,
        hangman: gameData.hangman,
        match: gameData.match,
        memory: gameData.memory
    };
    localStorage.setItem('UZEM_GameData', JSON.stringify(saveData));
}

export function loadFromLocal() {
    const saved = localStorage.getItem('UZEM_GameData');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameData.quiz = parsed.quiz || [];
            gameData.hangman = parsed.hangman || [];
            gameData.match = parsed.match || [];
            gameData.memory = parsed.memory || [];
            return true;
        } catch (e) {
            console.error("Kayıt okuma hatası", e);
            return false;
        }
    }
    return false;
}