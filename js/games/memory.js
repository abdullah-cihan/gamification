/* =========================================
   js/games/memory.js - HAFIZA OYUNU (FİNAL V2 - İSİM ÇAKIŞMASI GİDERİLDİ)
   ========================================= */

let memState = {
    hasFlippedCard: false,
    lockBoard: false,
    firstCard: null,
    secondCard: null,
    matches: 0,
    totalPairs: 0,
    moves: 0,
    timer: null,
    seconds: 0
};

function startMemoryGame() {
    goToScreen('screen-memory');
    document.getElementById('memory-gameover').style.display = 'none';
    
    const grid = document.getElementById('memory-board');
    grid.innerHTML = "";
    
    let sourceData = (typeof memoryData !== 'undefined') ? memoryData : [];
    if(sourceData.length === 0) {
        grid.innerHTML = "<div style='color:white; text-align:center; grid-column:1/-1;'>Kart yok.</div>";
        return;
    }

    let cards = [];
    sourceData.forEach((item, index) => {
        cards.push({ id: index, content: item.A });
        cards.push({ id: index, content: item.B || item.A });
    });

    cards.sort(() => Math.random() - 0.5);

    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.classList.add('mem-card');
        cardEl.dataset.id = card.id;

        let contentHTML = card.content;
        if(card.content && card.content.toString().startsWith('http')) {
            contentHTML = `<img src="${card.content}" class="mem-img">`;
        }

        cardEl.innerHTML = `
            <div class="mem-front">${contentHTML}</div>
            <div class="mem-back">?</div>
        `;
        
        // İSİM DEĞİŞTİ: handleMemClick
        cardEl.addEventListener('click', handleMemClick);
        grid.appendChild(cardEl);
    });

    memState = { hasFlippedCard: false, lockBoard: false, firstCard: null, secondCard: null, matches: 0, moves: 0, totalPairs: sourceData.length };
    document.getElementById('mem-moves').innerText = "0";
    startMemTimer();
}

// Tıklama Fonksiyonu (İsmi Değişti)
function handleMemClick() {
    if (memState.lockBoard) return;
    if (this === memState.firstCard) return;

    this.classList.add('flip');
    if (typeof playSound === 'function') playSound('click');

    if (!memState.hasFlippedCard) {
        memState.hasFlippedCard = true;
        memState.firstCard = this;
        return;
    }

    memState.secondCard = this;
    memState.moves++;
    document.getElementById('mem-moves').innerText = memState.moves;
    
    // İSİM DEĞİŞTİ: checkMemMatch
    checkMemMatch();
}

// Eşleşme Kontrolü (İsmi Değişti)
function checkMemMatch() {
    let isMatch = memState.firstCard.dataset.id === memState.secondCard.dataset.id;

    if (isMatch) {
        disableMemCards();
    } else {
        unflipMemCards();
    }
}

// Kartları Pasifleştir (İsmi Değişti)
function disableMemCards() {
    memState.firstCard.removeEventListener('click', handleMemClick);
    memState.secondCard.removeEventListener('click', handleMemClick);
    
    memState.firstCard.classList.add('matched');
    memState.secondCard.classList.add('matched');

    if (typeof playSound === 'function') playSound('correct');
    memState.matches++;

    if(memState.matches === memState.totalPairs) {
        setTimeout(endMemoryGame, 800);
    }
    resetMemBoard();
}

// Kartları Geri Çevir (İsmi Değişti)
function unflipMemCards() {
    memState.lockBoard = true;
    if (typeof playSound === 'function') playSound('wrong');
    setTimeout(() => {
        memState.firstCard.classList.remove('flip');
        memState.secondCard.classList.remove('flip');
        resetMemBoard();
    }, 1000);
}

// Tahtayı Sıfırla (İsmi Değişti)
function resetMemBoard() {
    [memState.hasFlippedCard, memState.lockBoard] = [false, false];
    [memState.firstCard, memState.secondCard] = [null, null];
}

// Timer
function startMemTimer() {
    window.stopMemTimer();
    memState.seconds = 0;
    document.getElementById('mem-timer').innerText = "00:00";
    
    memState.timer = setInterval(() => {
        memState.seconds++;
        const mins = Math.floor(memState.seconds / 60).toString().padStart(2, '0');
        const secs = (memState.seconds % 60).toString().padStart(2, '0');
        document.getElementById('mem-timer').innerText = `${mins}:${secs}`;
    }, 1000);
}

window.stopMemTimer = function() {
    if(memState.timer) clearInterval(memState.timer);
};

function endMemoryGame() {
    window.stopMemTimer();
    const timeStr = document.getElementById('mem-timer').innerText;
    document.getElementById('final-mem-time').innerText = timeStr;
    document.getElementById('final-mem-moves').innerText = memState.moves + " Hamle";
    document.getElementById('memory-gameover').style.display = 'flex';
    if (typeof playSound === 'function') playSound('win');
    if (typeof confetti === 'function') confetti({ particleCount: 200, spread: 120 });
}

function restartMemory() {
    startMemoryGame();
}