/* =========================================
   js/games/match.js - EŞLEŞTİRME MODÜLÜ (FİNAL V2 - İSİM ÇAKIŞMASI GİDERİLDİ)
   ========================================= */

let matchState = {
    selectedCard: null,
    lockBoard: false,
    matchesFound: 0,
    totalPairs: 0,
    timer: null,
    seconds: 0
};

// 1. OYUNU BAŞLATMA
function startMatchGame() {
    goToScreen('screen-match');
    document.getElementById('match-gameover').style.display = 'none';
    
    const grid = document.getElementById('match-area');
    grid.innerHTML = "";
    
    // Veri Kontrolü
    let data = (typeof matchData !== 'undefined' && matchData.length > 0) ? matchData : [];
    
    if(data.length === 0) {
        grid.innerHTML = "<div style='color:white; text-align:center; grid-column:1/-1; padding:20px;'>⚠️ Veri yok. Lütfen editörden kelime ekleyin.</div>";
        return;
    }

    // Kartları Hazırla
    let cards = [];
    data.forEach((item, index) => {
        cards.push({ id: index, text: item.En, type: 'en' });
        cards.push({ id: index, text: item.Tr, type: 'tr' });
    });

    cards.sort(() => Math.random() - 0.5);

    cards.forEach(card => {
        const div = document.createElement('div');
        div.className = 'match-card';
        div.innerText = card.text;
        div.setAttribute('data-match-id', card.id);
        
        div.onclick = () => handleMatchClick(div);
        
        grid.appendChild(div);
    });

    matchState.selectedCard = null;
    matchState.lockBoard = false;
    matchState.matchesFound = 0;
    matchState.totalPairs = data.length;
    
    startMatchTimer();
}

// 2. KART TIKLAMA
function handleMatchClick(card) {
    if (matchState.lockBoard) return;
    if (card.classList.contains('matched')) return;
    
    if (card === matchState.selectedCard) {
        card.classList.remove('selected');
        matchState.selectedCard = null;
        return;
    }

    if (typeof playSound === 'function') playSound('click');
    
    card.classList.add('selected');

    if (!matchState.selectedCard) {
        matchState.selectedCard = card;
    } else {
        // İSİM DEĞİŞTİ: checkMatchPair
        checkMatchPair(card);
    }
}

// 3. EŞLEŞME KONTROLÜ (İSMİ DEĞİŞTİ)
function checkMatchPair(card2) {
    const card1 = matchState.selectedCard;
    matchState.lockBoard = true;

    const id1 = card1.getAttribute('data-match-id');
    const id2 = card2.getAttribute('data-match-id');

    const isMatch = (String(id1) === String(id2));

    if (isMatch) {
        if (typeof playSound === 'function') playSound('correct');
        if (typeof confetti === 'function') confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });

        card1.classList.add('matched');
        card2.classList.add('matched');
        
        card1.classList.remove('selected');
        card2.classList.remove('selected');

        matchState.matchesFound++;
        matchState.selectedCard = null;
        matchState.lockBoard = false;

        if(matchState.matchesFound === matchState.totalPairs) {
            setTimeout(endMatchGame, 500);
        }

    } else {
        if (typeof playSound === 'function') playSound('wrong');
        
        card1.classList.add('wrong');
        card2.classList.add('wrong');

        setTimeout(() => {
            card1.classList.remove('selected', 'wrong');
            card2.classList.remove('selected', 'wrong');
            
            matchState.selectedCard = null;
            matchState.lockBoard = false;
        }, 1000);
    }
}

// 4. ZAMANLAYICI
function startMatchTimer() {
    if(matchState.timer) clearInterval(matchState.timer);
    matchState.seconds = 0;
    const timerEl = document.getElementById('match-timer');
    if(timerEl) timerEl.innerText = "00:00";
    
    matchState.timer = setInterval(() => {
        matchState.seconds++;
        const mins = Math.floor(matchState.seconds / 60).toString().padStart(2, '0');
        const secs = (matchState.seconds % 60).toString().padStart(2, '0');
        if(timerEl) timerEl.innerText = `${mins}:${secs}`;
    }, 1000);
}

window.stopMatchTimer = function() {
    if(matchState.timer) clearInterval(matchState.timer);
};

// 5. OYUN BİTİŞİ
function endMatchGame() {
    window.stopMatchTimer();
    const timeStr = document.getElementById('match-timer').innerText;
    document.getElementById('final-time').innerText = timeStr;
    document.getElementById('match-gameover').style.display = 'flex';
    
    if (typeof playSound === 'function') playSound('win');
    if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 100 });
}

function restartMatch() {
    startMatchGame();
}