/* =========================================
   js/main.js - BAŞLATICI (FİNAL - LINK FIX)
   ========================================= */

import * as Utils from './core/utils.js';
import * as Nav from './core/navigation.js';
import * as Editor from './core/editor.js';
import * as Cloud from './core/cloud.js';

// --- HTML ERİŞİMLERİ ---
window.goToScreen = Nav.goToScreen;
window.startGame = Nav.startGame;
window.openEditor = Editor.openEditor;
window.addEmptyItem = Editor.addEmptyItem;
window.deleteItem = Editor.deleteItem;
window.clearAllData = Editor.clearAllData;
window.convertGame = Editor.convertGame;
window.loadFromGoogleSheet = Cloud.loadFromGoogleSheet;
window.handleExcel = Cloud.handleExcel;
window.downloadTemplate = Cloud.downloadTemplate;
window.generateShareLink = Cloud.generateShareLink;
window.toggleGlobalSound = Utils.toggleGlobalSound;
window.playSound = Utils.playSound;

// --- VERİ KÖPRÜLERİ ---
Object.defineProperty(window, 'quizData', { get: () => Utils.gameData.quiz });
Object.defineProperty(window, 'hangmanData', { get: () => Utils.gameData.hangman });
Object.defineProperty(window, 'matchData', { get: () => Utils.gameData.match });
Object.defineProperty(window, 'memoryData', { get: () => Utils.gameData.memory });
Object.defineProperty(window, 'activeGame', { get: () => Utils.activeGame.current, set: (v) => Utils.activeGame.current = v });

// --- BAŞLATMA ---
window.onload = () => {
    Utils.loadFromLocal();
    checkUrlForGame(); // Link kontrolü artık burada!
    initDraggableButton();
    setupAutoLoader();
};

// --- URL KONTROLÜ (BURAYA TAŞINDI) ---
function checkUrlForGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const g = urlParams.get('g');
    const s = urlParams.get('sheet');
    const d = urlParams.get('d');
    const gid = urlParams.get('gid');

    if (g) {
        Utils.activeGame.current = g; // Oyunu seç
        
        if (s) {
            // Google Sheet Linki
            console.log("Google Sheet Linki Algılandı:", s);
            Nav.enterStudentMode();
            Cloud.loadFromGoogleSheet(s, gid, true); 
        } else if (d) {
            // Paket Link
            console.log("Paket Linki Algılandı");
            try {
                const jsonStr = decodeURIComponent(escape(atob(d)));
                const loadedData = JSON.parse(jsonStr);
                
                // Veriyi yükle
                Utils.setData(loadedData);
                
                Nav.enterStudentMode();
                Nav.startGame();
            } catch (e) { 
                console.error(e);
                alert("Link bozuk veya hatalı!"); 
            }
        }
    }
}

// --- OTOMATİK YÜKLEYİCİ ---
function setupAutoLoader() {
    const input = document.getElementById('sheet-id-input');
    if (!input) {
        if(document.getElementById('screen-editor').style.display === 'block') {
            setTimeout(setupAutoLoader, 500);
        }
        return;
    }
    
    let debounceTimer;
    const handleInput = (e) => {
        let val = e.type === 'paste' ? (e.clipboardData || window.clipboardData).getData('text') : e.target.value;
        val = val.trim();
        if(val === "") return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const { id, gid } = Utils.extractSheetInfo(val);
            if (id) {
                input.style.borderColor = "#10b981"; input.style.backgroundColor = "rgba(16, 185, 129, 0.1)";
                Cloud.loadFromGoogleSheet(id, gid);
            } else { input.style.borderColor = "#ef4444"; }
        }, 800);
    };
    input.addEventListener('input', handleInput);
    input.addEventListener('paste', handleInput);
}

// --- SES BUTONU SÜRÜKLEME ---
function initDraggableButton() {
    const btn = document.getElementById('global-sound-btn');
    if(btn) {
        let isDragging = false;
        const dragStart = (e) => {
            isDragging = false;
            const sx = e.touches?e.touches[0].clientX:e.clientX;
            const sy = e.touches?e.touches[0].clientY:e.clientY;
            const move = (ev) => {
                const t = ev.touches?ev.touches[0]:ev;
                if(Math.abs(t.clientX-sx)>5 || Math.abs(t.clientY-sy)>5) {
                    isDragging = true;
                    btn.style.left = (t.clientX-25)+'px'; 
                    btn.style.top = (t.clientY-25)+'px'; 
                    btn.style.right = 'auto';
                }
            };
            const stop = () => { 
                document.removeEventListener('mousemove',move); document.removeEventListener('touchmove',move);
                document.removeEventListener('mouseup',stop); document.removeEventListener('touchend',stop);
                if(isDragging) { btn.setAttribute('data-drag','1'); setTimeout(()=>btn.removeAttribute('data-drag'),100); }
            };
            document.addEventListener('mousemove',move); document.addEventListener('touchmove',move);
            document.addEventListener('mouseup',stop); document.addEventListener('touchend',stop);
        };
        btn.onmousedown = btn.ontouchstart = dragStart;
    }
}