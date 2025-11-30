/* =========================================
   js/core/navigation.js - EKRAN YÖNETİMİ (DÜZELTİLDİ)
   ========================================= */

import { activeGame, getData } from './utils.js';

// 1. EKRAN DEĞİŞTİRME
export function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
    
    // Ana Sayfa Butonu
    const homeBtn = document.querySelector('.home-btn');
    if (homeBtn) {
        homeBtn.style.display = (screenId === 'screen-hub') ? 'none' : 'block';
    }

    // Ses Butonu
    const soundBtn = document.getElementById('global-sound-btn');
    if (soundBtn) {
        soundBtn.style.display = (target && target.classList.contains('game-screen')) ? 'flex' : 'none';
    }

    // Sayaçları Durdur
    if (typeof window.stopMatchTimer === "function") window.stopMatchTimer();
    if (typeof window.stopMemTimer === "function") window.stopMemTimer();
}

// 2. OYUN BAŞLATICI
export function startGame() {
    if (getData().length === 0) { 
        alert("Oyun başlatılamadı: Veri yok! Lütfen soru ekleyin."); 
        return; 
    }
    
    const g = activeGame.current;
    
    if (g === 'quiz' && typeof window.startQuizShow === 'function') window.startQuizShow();
    else if (g === 'hangman' && typeof window.startHangman === 'function') window.startHangman();
    else if (g === 'match' && typeof window.startMatchGame === 'function') window.startMatchGame();
    else if (g === 'memory' && typeof window.startMemoryGame === 'function') window.startMemoryGame();
    else console.error("Başlatılacak oyun bulunamadı:", g);
}

// 3. ÖĞRENCİ MODU
export function enterStudentMode() {
    const style = document.createElement('style');
    style.innerHTML = `
        .btn-back { display: none !important; } 
        .screen-editor { display: none !important; }
        .home-btn { display: none !important; } 
    `;
    document.head.appendChild(style);
}