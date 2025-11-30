/* =========================================
   js/games/hangman.js - ADAM ASMACA MODÜLÜ
   ========================================= */

// Oyunun anlık durumunu tutan obje
let hangState = { 
    word: "",       // Seçilen kelime
    hidden: [],     // Kelimenin gizli hali ( _ _ A _ )
    mistakes: 0,    // Yapılan hata sayısı
    maxMistakes: 6  // Maksimum hata hakkı
};

// Oyunu başlatan ana fonksiyon
function startHangman() {
    goToScreen('screen-hangman'); // Adam asmaca ekranını aktif et
    nextHangmanWord();            // Yeni bir kelime seçip oyunu kur
}

// Yeni kelime seçme ve tahtayı hazırlama fonksiyonu
function nextHangmanWord() {
    // 1. Main.js'deki global hangmanData dizisinden rastgele bir veri seç
    const rnd = Math.floor(Math.random() * hangmanData.length);
    const item = hangmanData[rnd];

    // 2. Seçilen kelimeyi büyük harfe çevirip kaydet
    hangState.word = item.Kelime.toString().toUpperCase();
    
    // 3. Kelimenin uzunluğu kadar alt çizgi (_) oluştur
    hangState.hidden = Array(hangState.word.length).fill("_");
    
    // 4. Hata sayısını sıfırla
    hangState.mistakes = 0;

    // 5. Arayüzü (HTML) güncelle
    document.getElementById('hang-hint').innerText = item.Ipucu || ""; // İpucu varsa yaz
    document.getElementById('hang-msg').innerText = "";               // Mesaj kutusunu temizle
    document.getElementById('hang-word').innerText = hangState.hidden.join(" "); // Gizli kelimeyi ekrana bas
    
    // 6. Klavyeyi oluştur
    const kb = document.getElementById('hang-keyboard'); 
    kb.innerHTML = ""; // Önceki klavyeyi temizle

    // Kullanılacak harf listesi
    "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZXWQ1234567890".split("").forEach(char => {
        // Her harf için bir buton oluştur
        const btn = document.createElement('button'); 
        btn.className = 'key'; 
        btn.innerText = char;

        // Butona tıklanma olayı
        btn.onclick = () => {
            btn.disabled = true; // Tıklanan harfi pasif yap (tekrar basılmasın)

            // Harf kelimenin içinde var mı?
            if(hangState.word.includes(char)) {
                // --- DOĞRU TAHMİN ---
                playSound('click'); // 🔊 SES: Normal tık sesi

                // Kelimeyi tarayıp eşleşen harfleri açığa çıkar
                for(let i=0; i<hangState.word.length; i++) {
                    if(hangState.word[i] === char) hangState.hidden[i] = char;
                }
                // Güncel kelimeyi ekrana bas
                document.getElementById('hang-word').innerText = hangState.hidden.join(" ");

                // KAZANMA KONTROLÜ (Hiç _ kalmadıysa)
                if(!hangState.hidden.includes("_")) { 
                    document.getElementById('hang-msg').innerText = "KAZANDINIZ!"; 
                    document.getElementById('hang-msg').style.color="#10b981"; // Yeşil renk
                    confetti(); // Konfeti efekti
                    playSound('win'); // 🔊 SES: Kazanma sesi
                    disableKeys(); // Klavyeyi kilitle
                }
            } else {
                // --- YANLIŞ TAHMİN ---
                playSound('wrong'); // 🔊 SES: Hata sesi
                
                hangState.mistakes++; // Hata sayısını artır
                drawMan(hangState.mistakes); // Adamın bir parçasını çiz
                
                // KAYBETME KONTROLÜ (6 hataya ulaşıldıysa)
                if(hangState.mistakes >= 6) { 
                    document.getElementById('hang-msg').innerText = "KAYBETTİNİZ: " + hangState.word; 
                    document.getElementById('hang-msg').style.color="#ef4444"; // Kırmızı renk
                    disableKeys(); // Klavyeyi kilitle
                }
            }
        };
        kb.appendChild(btn); // Butonu klavye alanına ekle
    });
    
    // 7. Adam çizimini sıfırla (görünmez yap)
    drawMan(0);
}

// Tüm klavye tuşlarını kilitleyen yardımcı fonksiyon
function disableKeys() { 
    document.querySelectorAll('.key').forEach(k => k.disabled = true); 
}

// SVG Adam çizimini yöneten fonksiyon
function drawMan(err) {
    // Çizimin parçalarının ID listesi
    const parts = ['hang-head', 'hang-body', 'hang-larm', 'hang-rarm', 'hang-lleg', 'hang-rleg'];
    
    // Önce hepsini gizle
    parts.forEach(p => document.getElementById(p).style.display = 'none');
    
    // Hata sayısı kadar parçayı görünür yap
    for(let i=0; i<err; i++) {
        if(parts[i]) document.getElementById(parts[i]).style.display = 'block';
    }
}