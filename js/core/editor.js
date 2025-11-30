/* js/core/editor.js */
import { activeGame, getData, setData, saveToLocal } from './utils.js';
import { goToScreen } from './navigation.js';
// utils.js import satırına 'saveToLocal' ekle


export function openEditor(gameType) {
    activeGame.current = gameType;
    goToScreen('screen-editor');
    const titles = { 
        'quiz': "🏆 Bilgi Yarışması Düzenle", 
        'hangman': "🤠 Adam Asmaca Düzenle", 
        'match': "🧩 Eşleştirme Düzenle", 
        'memory': "🧠 Hafıza Oyunu Düzenle" 
    };
    document.getElementById('editor-title').innerText = titles[gameType] || "Editör";
    
    const sheetInput = document.getElementById('sheet-id-input');
    if(sheetInput) sheetInput.value = "";
    
    renderEditorList();
}

export function renderEditorList() {
    const listEl = document.getElementById('editor-list');
    listEl.innerHTML = "";
    const data = getData();

    if (data.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding:30px; color:#9ca3af; border:2px dashed #4b5563; border-radius:10px;">Henüz içerik yok.<br>Yukarıdan <b>+ Yeni Soru</b> ekleyin.</div>`;
        return;
    }

    data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'editor-item';
        div.style.position = 'relative'; 
        
        // SİLME BUTONU
        const delBtn = document.createElement('button');
        delBtn.className = 'del-item-btn';
        delBtn.innerText = 'Sil 🗑️';
        // Doğrudan fonksiyon bağlama (En garantisi)
        delBtn.onclick = function() { deleteItem(index); };
        div.appendChild(delBtn);

        // --- BAŞLIK EKLEME (HATA BURADAYDI, DÜZELDİ) ---
        // innerHTML += kullanmak butonun özelliğini siliyordu.
        // Artık element oluşturarak ekliyoruz.
        const header = document.createElement('h4');
        
        if (activeGame.current === 'quiz') {
            header.innerText = `Soru ${index+1}`;
            div.appendChild(header); // Güvenli ekleme

            div.appendChild(createInput("Görsel URL (Opsiyonel):", item.Resim, val => item.Resim = val));
            div.appendChild(createInput("Soru Metni:", item.Soru, val => item.Soru = val));
            
            const row = document.createElement('div'); row.style.display='flex'; row.style.gap='10px';
            row.appendChild(createInput("Kategori:", item.Kategori||"Genel", val=>item.Kategori=val));
            row.appendChild(createInput("Puan:", item.Puan||100, val=>item.Puan=val));
            div.appendChild(row);
            
            div.appendChild(createInput("Doğru Cevap:", item.Cevap, val => item.Cevap = val));

            // SEÇENEK YÖNETİMİ
            const optLabel = document.createElement('label');
            optLabel.style.cssText = "display:block; color:#94a3b8; font-size:0.85rem; margin:10px 0 5px; font-weight:600;";
            optLabel.innerText = "SEÇENEKLER (Yanlış cevapları ekleyin)";
            div.appendChild(optLabel);

            const optWrapper = document.createElement('div');
            div.appendChild(optWrapper);

            let optsArray = item.Secenekler ? item.Secenekler.toString().split('|').filter(x => x.trim() !== "") : [];

            const redrawOptions = () => {
                optWrapper.innerHTML = "";
                optsArray.forEach((optTxt, i) => {
                    const row = document.createElement('div');
                    row.className = 'opt-row';
                    
                    const inp = document.createElement('input');
                    inp.type = "text";
                    inp.className = 'form-input';
                    inp.value = optTxt;
                    inp.placeholder = `Seçenek ${i+1}`;
                    inp.oninput = (e) => {
                        optsArray[i] = e.target.value;
                        item.Secenekler = optsArray.join('|');
                    };

                    const btnDelOpt = document.createElement('button');
                    btnDelOpt.type = "button";
                    btnDelOpt.className = 'btn-mini btn-del-opt';
                    btnDelOpt.innerText = '✖';
                    btnDelOpt.onclick = () => {
                        optsArray.splice(i, 1);
                        item.Secenekler = optsArray.join('|');
                        redrawOptions();
                    };

                    row.appendChild(inp);
                    row.appendChild(btnDelOpt);
                    optWrapper.appendChild(row);
                });
            };
            redrawOptions();

            const btnAddOpt = document.createElement('button');
            btnAddOpt.type = "button";
            btnAddOpt.className = 'btn-mini btn-add-opt';
            btnAddOpt.innerText = '+ Seçenek Ekle';
            btnAddOpt.style.marginTop = "10px";
            btnAddOpt.style.width = "100%";
            btnAddOpt.onclick = () => {
                optsArray.push("");
                item.Secenekler = optsArray.join('|');
                redrawOptions();
            };
            div.appendChild(btnAddOpt);

        } else if (activeGame.current === 'hangman') {
            header.innerText = `Kelime ${index+1}`;
            div.appendChild(header);
            div.appendChild(createInput("Kelime:", item.Kelime, val => item.Kelime = val.toUpperCase()));
            div.appendChild(createInput("İpucu:", item.Ipucu, val => item.Ipucu = val));

        } else if (activeGame.current === 'match') {
            header.innerText = `Eşleştirme ${index+1}`;
            div.appendChild(header);
            const row = document.createElement('div'); row.style.display='flex'; row.style.gap='10px';
            row.appendChild(createInput("İngilizce:", item.En, val=>item.En=val));
            row.appendChild(createInput("Türkçe:", item.Tr, val=>item.Tr=val));
            div.appendChild(row);

        } else if (activeGame.current === 'memory') {
            header.innerText = `Kart Çifti ${index+1}`;
            div.appendChild(header);
            const row = document.createElement('div'); row.style.display='flex'; row.style.gap='10px';
            div.appendChild(createInput("Kart A (Metin/URL):", item.A, val=>item.A=val));
            div.appendChild(createInput("Kart B (Eşi):", item.B, val=>item.B=val));
            div.appendChild(row);
        }

        listEl.appendChild(div);
    });
}

// Yardımcı Input Oluşturucu
function createInput(lbl, val, cb) {
    const d = document.createElement('div'); 
    d.className = 'input-group';
    d.innerHTML = `<label>${lbl}</label>`;
    
    const i = document.createElement('input'); 
    i.className = 'form-input'; 
    i.type = "text";
    i.value = val || "";
    
    i.oninput = (e) => cb(e.target.value);
    d.appendChild(i); 
    return d;
}

export function addEmptyItem() {
    const d = getData();
    if (activeGame.current === 'quiz') d.push({ Kategori: "Genel", Puan: 100, Resim: "", Soru: "", Cevap: "", Secenekler: "" });
    else if (activeGame.current === 'hangman') d.push({ Kelime: "", Ipucu: "" });
    else if (activeGame.current === 'match') d.push({ En: "", Tr: "" });
    else if (activeGame.current === 'memory') d.push({ A: "", B: "" });
    
    renderEditorList();
    
    setTimeout(() => {
        const container = document.querySelector('.editor-container');
        if(container) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
}

export function deleteItem(index) {
    if (!confirm('Bu maddeyi silmek istediğinize emin misiniz?')) return;
    getData().splice(index, 1);
    renderEditorList();
}

export function clearAllData() {
    if (!confirm('Tüm listeyi silmek istiyor musunuz?')) return;
    setData([]);
    renderEditorList();
}

export function convertGame() {
    const target = document.getElementById('convert-select').value;
    if(target === activeGame.current || getData().length===0) return;
    if(!confirm(`"${target}" moduna dönüştürülsün mü?`)) return;

    let src = getData();
    let pairs = src.map(i => {
        if(activeGame.current==='quiz') return {a:i.Soru, b:i.Cevap};
        if(activeGame.current==='hangman') return {a:i.Kelime, b:i.Ipucu};
        if(activeGame.current==='match') return {a:i.En, b:i.Tr};
        if(activeGame.current==='memory') return {a:i.A, b:i.B};
        return {a:"",b:""};
    });

    let newData = pairs.map(p => {
        if(target==='quiz') return {Kategori:"Genel", Puan:100, Soru:p.a, Cevap:p.b, Secenekler:"", Resim:""};
        if(target==='hangman') return {Kelime:String(p.a).replace(/\s/g,'').toUpperCase(), Ipucu:p.b||"Bul"};
        if(target==='match') return {En:p.a, Tr:p.b};
        if(target==='memory') return {A:p.a, B:p.b};
        return {};
    });

    activeGame.current = target;
    setData(newData);
    openEditor(target);
}