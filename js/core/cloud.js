/* =========================================
   js/core/cloud.js - VERİ VE DOSYA İŞLEMLERİ (MULTI-PROXY)
   ========================================= */

import { activeGame, setData, getData, extractSheetInfo } from './utils.js';
import { startGame, enterStudentMode } from './navigation.js';
import { renderEditorList } from './editor.js';

/* --- 1. GOOGLE SHEETS YÜKLEME (GARANTİ YÖNTEM) --- */
export async function loadFromGoogleSheet(externalID = null, externalGID = null, isAutoStart = false) {
    let sheetID = externalID;
    let sheetGID = externalGID;

    // Hoca panelindeysek inputtan al
    if (!sheetID) {
        const rawInput = document.getElementById('sheet-id-input').value.trim();
        const info = extractSheetInfo(rawInput);
        sheetID = info.id;
        sheetGID = info.gid;
    }
    
    if (!sheetID) { 
        if(!isAutoStart) alert("Lütfen geçerli bir Google Sheet linki girin!"); 
        return; 
    }

    const timestamp = new Date().getTime();
    if(!sheetGID) sheetGID = "0";

    // Hedef Google URL'i (CSV Formatında)
    const googleUrl = `https://docs.google.com/spreadsheets/d/${sheetID}/export?format=csv&gid=${sheetGID}&t=${timestamp}`;

    // --- PROXY LİSTESİ (Sırayla deneyecek) ---
    const proxies = [
        // 1. Yöntem: CorsProxy.io (Genelde en hızlısı)
        `https://corsproxy.io/?` + encodeURIComponent(googleUrl),
        // 2. Yöntem: AllOrigins (Yedek)
        `https://api.allorigins.win/raw?url=${encodeURIComponent(googleUrl)}`,
        // 3. Yöntem: Direkt Google (Bazı tarayıcılarda çalışır)
        googleUrl
    ];

    let csvText = null;
    let usedUrl = "";

    // --- BAĞLANTIYI DENE (Sırayla) ---
    for (const url of proxies) {
        try {
            console.log("Deniyor:", url);
            const response = await fetch(url);
            if (response.ok) {
                csvText = await response.text();
                usedUrl = url;
                console.log("✅ Bağlantı Başarılı:", url);
                break; // Başarılıysa döngüden çık
            }
        } catch (err) {
            console.warn("❌ Bu yöntem başarısız oldu:", url);
        }
    }

    // --- SONUÇ KONTROLÜ ---
    if (csvText) {
        // Veri geldiyse işle
        processCSV(csvText, isAutoStart);
    } else {
        if(!isAutoStart) alert("❌ BAĞLANTI BAŞARISIZ!\nGoogle Sheet 'Web'de Yayınla' ve 'Paylaş > Herkes' ayarlarını yaptığınızdan emin olun.\n\nFarklı bir tarayıcı veya gizli sekme ile deneyebilirsiniz.");
    }
}

// --- CSV İŞLEME FONKSİYONU ---
function processCSV(csvText, isAutoStart) {
    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const data = results.data;

            if (data && data.length > 0) {
                // Başlıkları temizle (Küçük harf yap)
                const headers = Object.keys(data[0]);
                const getValue = (row, col) => {
                    const k = Object.keys(row).find(key => key.trim().toLowerCase() === col.toLowerCase());
                    return k ? row[k] : "";
                };

                let formattedData = [];
                try {
                    if(activeGame.current === 'quiz') {
                        if(!headers.some(h=>h.toLowerCase().includes('soru'))) throw new Error("Tabloda 'Soru' sütunu yok. Lütfen 'Taslak İndir'ip o formatı kullanın.");
                        formattedData = data.map(i => ({
                            Kategori: getValue(i,'kategori')||"Genel", Puan: getValue(i,'puan')||100,
                            Soru: getValue(i,'soru'), Cevap: getValue(i,'cevap'),
                            Secenekler: getValue(i,'secenekler'), Resim: getValue(i,'resim')
                        }));
                    } 
                    else if(activeGame.current === 'hangman') {
                        if(!headers.some(h=>h.toLowerCase().includes('kelime'))) throw new Error("'Kelime' sütunu yok.");
                        formattedData = data.map(i => ({ Kelime: getValue(i,'kelime'), Ipucu: getValue(i,'ipucu') }));
                    }
                    else if(activeGame.current === 'match') {
                        if(!headers.some(h=>h.toLowerCase().includes('en'))) throw new Error("'En' sütunu yok.");
                        formattedData = data.map(i => ({ En: getValue(i,'en'), Tr: getValue(i,'tr') }));
                    }
                    else if(activeGame.current === 'memory') {
                        if(!headers.some(h=>h.toLowerCase().includes('a'))) throw new Error("'A' sütunu yok. Hafıza oyunu taslağını kullanın.");
                        formattedData = data.map(i => ({ A: getValue(i,'a'), B: getValue(i,'b') }));
                    }

                    setData(formattedData);

                    if (isAutoStart) {
                        startGame();
                    } else {
                        renderEditorList(); 
                        alert(`✅ Başarılı! ${formattedData.length} soru yüklendi.`);
                    }

                } catch (e) { 
                    alert("❌ Veri Format Hatası: " + e.message); 
                }
            } else { 
                if(!isAutoStart) alert("❌ Tablo boş görünüyor."); 
            }
        },
        error: (err) => {
            console.error(err);
            alert("❌ CSV Okuma Hatası.");
        }
    });
}


/* --- 2. LİNK OLUŞTURMA --- */
export function generateShareLink() {
    const raw = document.getElementById('sheet-id-input').value.trim();
    const { id, gid } = extractSheetInfo(raw);
    let finalUrl = "";

    if (id) {
        finalUrl = window.location.origin + window.location.pathname + `?g=${activeGame.current}&sheet=${id}&gid=${gid}`;
        navigator.clipboard.writeText(finalUrl).then(() => alert("✅ CANLI Link Kopyalandı!"));
    } else {
        let data = getData();
        if(data.length === 0) { alert("Veri yok! Önce soru ekleyin."); return; }
        const json = JSON.stringify(data);
        const enc = btoa(unescape(encodeURIComponent(json)));
        finalUrl = window.location.origin + window.location.pathname + `?g=${activeGame.current}&d=${enc}`;
        navigator.clipboard.writeText(finalUrl).then(() => alert("✅ PAKET Link Kopyalandı!"));
    }
}

/* --- 3. LOCAL EXCEL YÜKLEME --- */
export function handleExcel(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, {type: 'array'});
        const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if(jsonData.length > 0) {
            const current = getData();
            setData([...current, ...jsonData]);
            renderEditorList();
            alert("✅ Excel verileri eklendi!");
        }
    };
    reader.readAsArrayBuffer(file);
    input.value = "";
}

/* --- 4. TASLAK İNDİRME --- */
export function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    let data = [], sName = "Data";
    const g = activeGame.current;
    
    if(g === 'quiz') { 
        sName = "Yarisma"; 
        data = [
  { "Kategori": "Tarih", "Puan": 100, "Resim": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Gentile_Bellini_003.jpg/250px-Gentile_Bellini_003.jpg", "Soru": "Görseldeki padişah kimdir?", "Cevap": "Fatih Sultan Mehmet", "Secenekler": "Yavuz | Kanuni | Fatih" },
  { "Kategori": "Tarih", "Puan": 200, "Resim": "", "Soru": "Cumhuriyet ilanı?", "Cevap": "1923", "Secenekler": "1920 | 1923 | 1919" },
  { "Kategori": "Tarih", "Puan": 300, "Resim": "", "Soru": "Malazgirt Savaşı?", "Cevap": "1071", "Secenekler": "1453 | 1071 | 1299" },
  { "Kategori": "Genel", "Puan": 200, "Resim": "", "Soru": "Başkentimiz?", "Cevap": "Ankara", "Secenekler": "İstanbul | Ankara" },
  { "Kategori": "Coğrafya", "Puan": 100, "Resim": "", "Soru": "Türkiye'nin en yüksek dağı?", "Cevap": "Ağrı Dağı", "Secenekler": "Erciyes | Ağrı Dağı | Uludağ" },
  { "Kategori": "Genel", "Puan": 300, "Resim": "https://cdnuploads.aa.com.tr/uploads/Contents/2023/12/26/thumbs_b_c_8eb4cee5a71b46e90d4cd143e36b4736.jpg", "Soru": "İstiklal Marşı şairi?", "Cevap": "M. Akif Ersoy", "Secenekler": "Namık Kemal | Ziya Gökalp | M. Akif Ersoy" },
  { "Kategori": "Tarih", "Puan": 400, "Resim": "", "Soru": "İstanbul'un Fethi?", "Cevap": "1453", "Secenekler": "1453 | 1299 | 1071" },
  { "Kategori": "Bilim", "Puan": 200, "Resim": "", "Soru": "Güneşe en yakın gezegen?", "Cevap": "Merkür", "Secenekler": "Dünya | Mars | Merkür" },
  { "Kategori": "Spor", "Puan": 100, "Resim": "", "Soru": "Futbol takım oyuncu sayısı?", "Cevap": "11", "Secenekler": "10 | 11 | 12" },
  { "Kategori": "Tarih", "Puan": 500, "Resim": "", "Soru": "İlk Osmanlı Padişahı?", "Cevap": "Osman Bey", "Secenekler": "Orhan Bey | Osman Bey | Ertuğrul Gazi" },
  { "Kategori": "Genel", "Puan": 100, "Resim": "", "Soru": "İstanbul plaka kodu?", "Cevap": "34", "Secenekler": "06 | 35 | 34" },
  { "Kategori": "Coğrafya", "Puan": 300, "Resim": "", "Soru": "En büyük okyanus?", "Cevap": "Büyük Okyanus", "Secenekler": "Atlas | Hint | Büyük Okyanus" },
  { "Kategori": "Bilim", "Puan": 400, "Resim": "", "Soru": "Telefonun mucidi?", "Cevap": "Graham Bell", "Secenekler": "Edison | Tesla | Graham Bell" },
  { "Kategori": "Tarih", "Puan": 200, "Resim": "", "Soru": "Atatürk'ün Samsun'a çıkışı?", "Cevap": "1919", "Secenekler": "1919 | 1920 | 1923" },
  { "Kategori": "Genel", "Puan": 500, "Resim": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/250px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg", "Soru": "Mona Lisa'nın ressamı?", "Cevap": "Da Vinci", "Secenekler": "Picasso | Da Vinci | Van Gogh" },
  { "Kategori": "Coğrafya", "Puan": 200, "Resim": "", "Soru": "Türkiye'nin en büyük gölü?", "Cevap": "Van Gölü", "Secenekler": "Tuz Gölü | Van Gölü | Beyşehir" },
  { "Kategori": "Bilim", "Puan": 300, "Resim": "", "Soru": "Demirin simgesi?", "Cevap": "Fe", "Secenekler": "Fe | Au | Ag" },
  { "Kategori": "Tarih", "Puan": 400, "Resim": "", "Soru": "Hatay'ın anavatana katılışı?", "Cevap": "1939", "Secenekler": "1938 | 1939 | 1930" },
]; 
    }
    else if(g === 'hangman') { 
        sName = "AdamAsmaca"; 
        data = [
            {"Kelime": "CUMHURIYET", "Ipucu": "Yönetim şekli"}, {"Kelime": "SAMSUN", "Ipucu": "Milli Mücadele şehri"},
            {"Kelime": "ANKARA", "Ipucu": "Başkent"}, {"Kelime": "LAIKLIK", "Ipucu": "Din ve devlet"},
            {"Kelime": "NUTUK", "Ipucu": "Atatürk'ün eseri"}, {"Kelime": "TBMM", "Ipucu": "Meclis"},
            {"Kelime": "LOZAN", "Ipucu": "Barış antlaşması"}, {"Kelime": "HALKCILIK", "Ipucu": "Eşitlik"},
            {"Kelime": "INKILAP", "Ipucu": "Devrim"}, {"Kelime": "SAKARYA", "Ipucu": "Meydan muharebesi"}
        ]; 
    }
    else if(g === 'match') { 
        sName = "Eslestirme"; 
        data = [
            {"En": "Computer", "Tr": "Bilgisayar"}, {"En": "University", "Tr": "Üniversite"},
            {"En": "Library", "Tr": "Kütüphane"}, {"En": "Success", "Tr": "Başarı"},
            {"En": "Knowledge", "Tr": "Bilgi"}, {"En": "Science", "Tr": "Bilim"},
            {"En": "History", "Tr": "Tarih"}, {"En": "Freedom", "Tr": "Özgürlük"},
            {"En": "Art", "Tr": "Sanat"}, {"En": "Future", "Tr": "Gelecek"}
        ]; 
    }
    else { 
        sName = "Hafiza"; 
        data = [
            {"A": "Başkent", "B": "Ankara"}, {"A": "Cumhuriyet", "B": "1923"},
            {"A": "Su Formülü", "B": "H2O"}, {"A": "Pi Sayısı", "B": "3,14"},
            {"A": "Yazılım", "B": "Kodlama"},
            {"A": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/An%C4%B1tkabir_front_2018.jpg/300px-An%C4%B1tkabir_front_2018.jpg", "B": "Anıtkabir"},
            {"A": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/300px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg", "B": "Güneş"},
            {"A": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/200px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg", "B": "Mona Lisa"},
            {"A": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/200px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png", "B": "DNA"},
            {"A": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/250px-The_Earth_seen_from_Apollo_17.jpg", "B": "Dünya"}
        ]; 
    }

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sName);
    XLSX.writeFile(wb, `${g}_taslak.xlsx`);
}

/* --- 5. VERİ YÜKLEME HELPER --- */
export function setDataAndStart(data) {
    setData(data);
}