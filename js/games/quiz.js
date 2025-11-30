/* =========================================
   js/games/quiz.js - BİLGİ YARIŞMASI (SEÇENEK HATASI GİDERİLDİ)
   ========================================= */

let quizState = {
    mode: 'team', 
    scores: { a: 0, b: 0, single: 0 },
    timer: null,
    timeLeft: 20,
    streak: 0,
    isMuted: false
};

// 1. BAŞLATMA
function startQuizShow() {
    goToScreen('screen-quiz');
    
    document.getElementById('score-panel-team').style.display = 'none';
    document.getElementById('score-panel-single').style.display = 'none';

    const board = document.getElementById('quiz-board');
    board.style.display = 'block'; 
    board.style.gridTemplateColumns = 'none';

    board.innerHTML = `
        <div class="mode-wrapper">
            <div class="mode-btn" onclick="initQuizGame('single')">
                <span class="mode-icon">👤</span>
                <span class="mode-text">Tekli Mod</span>
                <div style="font-size:0.8rem; color:#ccc; margin-top:10px;">Otomatik Puan + Combo</div>
            </div>
            <div class="mode-btn" onclick="initQuizGame('team')">
                <span class="mode-icon">👥</span>
                <span class="mode-text">Takım Modu</span>
                <div style="font-size:0.8rem; color:#ccc; margin-top:10px;">Hoca Puan Verir</div>
            </div>
        </div>
    `;
}

// 2. OYUN KURULUMU
function initQuizGame(selectedMode) {
    quizState.mode = selectedMode;
    quizState.scores = { a: 0, b: 0, single: 0 };
    quizState.streak = 0;
    
    updateScoreDisplay();

    if(selectedMode === 'team') {
        document.getElementById('score-panel-team').style.display = 'flex';
        document.getElementById('score-panel-single').style.display = 'none';
    } else {
        document.getElementById('score-panel-team').style.display = 'none';
        document.getElementById('score-panel-single').style.display = 'block';
    }

    const board = document.getElementById('quiz-board');
    board.style.display = 'grid'; 
    board.innerHTML = ""; 
    
    // Havuz Sistemi
    let poolData = [...quizData];
    for (let i = poolData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [poolData[i], poolData[j]] = [poolData[j], poolData[i]];
    }

    const categories = {};
    poolData.forEach(item => {
        if(!categories[item.Kategori]) categories[item.Kategori] = [];
        if(categories[item.Kategori].length < 5) {
            categories[item.Kategori].push(item);
        }
    });

    const catKeys = Object.keys(categories);
    board.style.gridTemplateColumns = `repeat(${catKeys.length}, 1fr)`;

    catKeys.forEach(cat => {
        const div = document.createElement('div'); div.className = 'cat-header'; div.innerText = cat;
        board.appendChild(div);
    });

    for(let i=0; i<5; i++) {
        catKeys.forEach(cat => {
            const q = categories[cat][i];
            const cell = document.createElement('div'); cell.className = 'q-cell';
            if(q) {
                cell.innerText = q.Puan;
                cell.onclick = () => openQuizModal(q, cell);
            } else { 
                cell.style.visibility = "hidden";
            }
            board.appendChild(cell);
        });
    }
}

// 3. SORU PENCERESİ (BU KISIM KRİTİK)
function openQuizModal(q, cellEl) {
    if(cellEl.classList.contains('played')) return;

    document.getElementById('q-modal').style.display = 'flex';
    
    // Görsel Kontrolü
    let imageHTML = "";
    if(q.Resim && q.Resim.trim() !== "") {
        imageHTML = `<div class="quiz-image-container"><img src="${q.Resim}" class="quiz-image"></div>`;
    }

    document.getElementById('m-points').innerHTML = `
        <div class="modal-header-area">
            <span style="color:#fbbf24; font-size:1.5rem;">${q.Puan} PUAN</span>
            <div style="display:flex; gap:10px;">
                <button id="btn-joker-50" class="joker-btn" onclick="useFiftyFifty('${q.Cevap.replace(/'/g, "\\'")}')">⚡ %50</button>
                <button id="btn-joker-audience" class="joker-btn" style="background:linear-gradient(135deg, #ec4899, #db2777);" onclick="useAskAudience('${q.Cevap.replace(/'/g, "\\'")}')">📊 Seyirci</button>
            </div>
        </div>
        <div class="timer-bar-bg"><div id="q-timer-fill" class="timer-bar-fill"></div></div>
        <div id="audience-chart" class="audience-chart-area"></div>
    `;

    document.getElementById('m-question').innerHTML = imageHTML + q.Soru;
    document.getElementById('m-answer').innerText = q.Cevap;
    document.getElementById('m-answer').style.display = 'none';
    
    const optsArea = document.getElementById('m-options-area'); 
    optsArea.innerHTML = "";
    const revealBtn = document.getElementById('btn-reveal');

    startQuestionTimer();

    // --- HATA DÜZELTME BURADA ---
    // Verinin string olduğundan emin olalım ve boşlukları temizleyelim
    let rawOptions = q.Secenekler ? String(q.Secenekler).trim() : "";
    
    console.log("Soru:", q.Soru);
    console.log("Gelen Seçenek Verisi:", rawOptions); // Konsoldan kontrol et

    if(rawOptions.length > 0) {
        revealBtn.style.display = 'none'; // Klasik butonu gizle
        
        // 1. Ayır ve Temizle
        let opts = rawOptions.split('|').map(o => o.trim()).filter(o => o !== "");
        
        // 2. Doğru Cevabı Ekle (Eğer yoksa)
        const correct = String(q.Cevap).trim();
        const exists = opts.some(o => o.toLowerCase() === correct.toLowerCase());
        if (!exists) opts.push(correct);

        // 3. Karıştır
        opts.sort(() => Math.random() - 0.5);

        // 4. Butonları Bas
        opts.forEach((opt, index) => {
            const btn = document.createElement('button'); 
            btn.className = 'option-btn'; 
            const letter = String.fromCharCode(65 + index); 
            btn.innerText = `${letter}) ${opt}`;
            btn.dataset.val = opt; 
            
            btn.onclick = () => {
                clearInterval(quizState.timer);
                const isCorrect = btn.dataset.val.toLowerCase() === correct.toLowerCase();
                
                if(isCorrect) {
                    btn.style.background = "#059669"; 
                    confetti(); 
                    if(typeof playSound !== 'undefined') playSound('correct');
                    
                    quizState.streak++;
                    if(quizState.mode === 'single') {
                        let bonus = (quizState.streak > 1) ? (quizState.streak - 1) * 10 : 0;
                        modScore('single', parseInt(q.Puan) + bonus);
                        if(bonus > 0) showComboEffect(bonus);
                    }
                } else { 
                    btn.style.background = "#dc2626"; 
                    if(typeof playSound !== 'undefined') playSound('wrong');
                    quizState.streak = 0;
                }
                
                document.getElementById('m-answer').style.display = 'block';
                // Jokerleri gizle
                const j50 = document.getElementById('btn-joker-50');
                const jAud = document.getElementById('btn-joker-audience');
                if(j50) j50.style.display = 'none';
                if(jAud) jAud.style.display = 'none';
            };
            optsArea.appendChild(btn);
        });

    } else { 
        // --- KLASİK SORU (Seçenek Yoksa) ---
        console.log("Seçenek bulunamadı, klasik moda geçiliyor.");
        revealBtn.style.display = 'inline-block';
        
        // Jokerleri gizle
        const j50 = document.getElementById('btn-joker-50');
        const jAud = document.getElementById('btn-joker-audience');
        if(j50) j50.style.display = 'none';
        if(jAud) jAud.style.display = 'none';
        
        revealBtn.onclick = () => {
             clearInterval(quizState.timer);
             document.getElementById('m-answer').style.display = 'block';
             if(typeof playSound !== 'undefined') playSound('click');
        };
    }

    cellEl.classList.add('played'); 
    cellEl.innerText = "";
}

// ... (Diğer fonksiyonlar: closeModal, modScore vb. aynı kalacak) ...

function showComboEffect(bonus) {
    const scoreEl = document.getElementById('score-single');
    const comboSpan = document.createElement('span');
    comboSpan.style.color = "#ef4444";
    comboSpan.style.fontSize = "1rem";
    comboSpan.style.marginLeft = "10px";
    comboSpan.innerText = `🔥 ${quizState.streak}x Combo (+${bonus})`;
    scoreEl.parentNode.appendChild(comboSpan);
    setTimeout(() => { comboSpan.remove(); }, 2000);
}

function startQuestionTimer() {
    if(quizState.timer) clearInterval(quizState.timer);
    quizState.timeLeft = 20;
    const fill = document.getElementById('q-timer-fill');
    if(!fill) return; 
    fill.style.width = "100%";
    fill.style.background = "#10b981";

    quizState.timer = setInterval(() => {
        quizState.timeLeft--;
        const percent = (quizState.timeLeft / 20) * 100;
        fill.style.width = percent + "%";
        if(quizState.timeLeft < 10) fill.style.background = "#f59e0b";
        if(quizState.timeLeft < 5)  fill.style.background = "#ef4444";

        if(quizState.timeLeft <= 0) {
            clearInterval(quizState.timer);
            if(typeof playSound !== 'undefined') playSound('wrong');
            document.getElementById('m-answer').style.display = 'block';
            document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
            quizState.streak = 0;
        }
    }, 1000);
}

function useFiftyFifty(correctAnswer) {
    const btns = document.querySelectorAll('.option-btn');
    if(btns.length < 3) { alert("En az 3 şık gerekli!"); return; }
    if(typeof playSound !== 'undefined') playSound('click');
    let wrongBtns = [];
    btns.forEach(btn => {
        if(btn.dataset.val.toLowerCase() !== correctAnswer.toLowerCase()) wrongBtns.push(btn);
    });
    wrongBtns.sort(() => Math.random() - 0.5);
    for(let i=0; i < 2; i++) {
        if(wrongBtns[i]) {
            wrongBtns[i].style.opacity = "0.2";
            wrongBtns[i].disabled = true;
        }
    }
    document.getElementById('btn-joker-50').style.display = 'none';
}

function useAskAudience(correctAnswer) {
    const btns = document.querySelectorAll('.option-btn');
    if(btns.length === 0) return;
    if(typeof playSound !== 'undefined') playSound('click');
    const jokerBtn = document.getElementById('btn-joker-audience');
    jokerBtn.disabled = true;
    jokerBtn.style.opacity = "0.5";
    let correctIndex = -1;
    btns.forEach((btn, index) => {
        if(btn.dataset.val.toLowerCase() === correctAnswer.toLowerCase()) correctIndex = index;
    });
    let percentages = new Array(btns.length).fill(0);
    let remaining = 100;
    let correctPercent = Math.floor(Math.random() * 30) + 50; 
    percentages[correctIndex] = correctPercent;
    remaining -= correctPercent;
    for(let i=0; i < percentages.length; i++) {
        if(i !== correctIndex) {
            let share = Math.floor(Math.random() * (remaining / 2));
            if(share === 0 && remaining > 0) share = remaining;
            percentages[i] = share;
            remaining -= share;
        }
    }
    if(remaining > 0) percentages[Math.floor(Math.random()*percentages.length)] += remaining;
    const chartArea = document.getElementById('audience-chart');
    chartArea.innerHTML = "";
    chartArea.style.display = "flex";
    percentages.forEach((pct, i) => {
        const label = String.fromCharCode(65 + i);
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';
        barContainer.innerHTML = `<div class="chart-value">%${pct}</div><div class="chart-bar" style="height: 0%;"></div><div class="chart-label">${label}</div>`;
        chartArea.appendChild(barContainer);
        setTimeout(() => {
            barContainer.querySelector('.chart-bar').style.height = pct + "%";
            if(pct === Math.max(...percentages)) barContainer.querySelector('.chart-bar').style.backgroundColor = "#10b981";
        }, 100);
    });
}

function closeModal() { 
    clearInterval(quizState.timer);
    document.getElementById('q-modal').style.display = 'none'; 
}

function modScore(target, val) { 
    if(target === 'single') quizState.scores.single += val;
    else quizState.scores[target] += val; 
    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById('score-a').innerText = quizState.scores.a;
    document.getElementById('score-b').innerText = quizState.scores.b;
    document.getElementById('score-single').innerText = quizState.scores.single;
}

function revealQuizAnswer() { 
    document.getElementById('m-answer').style.display = 'block'; 
}