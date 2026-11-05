// DOM Elementleri
const sourceLangSelect = document.getElementById('sourceLangSelect');
const targetLangSelect = document.getElementById('targetLangSelect');
const swapLangsBtn = document.getElementById('swapLangsBtn');

const domainSelect = document.getElementById('domainSelect');
const styleSelect = document.getElementById('styleSelect');
const toggleGlossaryBtn = document.getElementById('toggleGlossaryBtn');
const glossaryPanel = document.getElementById('glossaryPanel');
const glossaryInput = document.getElementById('glossaryInput');
const glossaryCountBadge = document.getElementById('glossaryCountBadge');

const sourceTextInput = document.getElementById('sourceTextInput');
const translationOutput = document.getElementById('translationOutput');
const translateBtn = document.getElementById('translateBtn');
const clearTextBtn = document.getElementById('clearTextBtn');
const copyResultBtn = document.getElementById('copyResultBtn');
const copyBtnText = document.getElementById('copyBtnText');

const charCount = document.getElementById('charCount');
const outputCharCount = document.getElementById('outputCharCount');
const footerStatus = document.getElementById('footerStatus');
const loadingOverlay = document.getElementById('loadingOverlay');

const alertBox = document.getElementById('alertBox');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const closeAlertBtn = document.getElementById('closeAlertBtn');

const sourceLangTitle = document.getElementById('sourceLangTitle');
const targetLangTitle = document.getElementById('targetLangTitle');

// Başlangıç durumu
let currentTranslationText = '';

// Dil başlıklarını dinamik güncelle
function updateTitles() {
  sourceLangTitle.textContent = `${sourceLangSelect.value} Metin`;
  targetLangTitle.textContent = `${targetLangSelect.value} Çevirisi`;
}

// Karakter Sayacı
sourceTextInput.addEventListener('input', () => {
  const len = sourceTextInput.value.length;
  charCount.textContent = `${len.toLocaleString('tr-TR')} karakter`;
});

// Kaynak ve Hedef Dilleri Değiştir (Swap)
swapLangsBtn.addEventListener('click', () => {
  const src = sourceLangSelect.value;
  const tgt = targetLangSelect.value;

  if (src === 'Otomatik Algıla') {
    // Otomatik seçiliyken swap yerine hedef dili kaynak yapalım
    sourceLangSelect.value = tgt;
    targetLangSelect.value = 'Türkçe';
  } else {
    sourceLangSelect.value = tgt;
    targetLangSelect.value = src;
  }

  // Eğer mevcut bir çeviri varsa yerlerini de değiştirelim
  if (currentTranslationText && sourceTextInput.value.trim()) {
    const tempText = sourceTextInput.value;
    sourceTextInput.value = currentTranslationText;
    currentTranslationText = tempText;
    renderTranslation(currentTranslationText);
    charCount.textContent = `${sourceTextInput.value.length.toLocaleString('tr-TR')} karakter`;
  }

  updateTitles();
});

sourceLangSelect.addEventListener('change', updateTitles);
targetLangSelect.addEventListener('change', updateTitles);

// Terimce Paneli Aç/Kapa
toggleGlossaryBtn.addEventListener('click', () => {
  const isHidden = glossaryPanel.classList.toggle('hidden');
  toggleGlossaryBtn.classList.toggle('active', !isHidden);
  if (!isHidden) {
    glossaryInput.focus();
  }
});

// Terimce sayısı göstergesi
glossaryInput.addEventListener('input', () => {
  const lines = glossaryInput.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l.includes('='));
  
  if (lines.length > 0) {
    glossaryCountBadge.textContent = lines.length;
    glossaryCountBadge.classList.remove('hidden');
  } else {
    glossaryCountBadge.classList.add('hidden');
  }
});

// Hata Gösterimi
function showError(title, message) {
  alertTitle.textContent = title;
  alertMessage.textContent = message;
  alertBox.classList.remove('hidden');
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  alertBox.classList.add('hidden');
}

closeAlertBtn.addEventListener('click', hideError);

// Metni Temizle
clearTextBtn.addEventListener('click', () => {
  sourceTextInput.value = '';
  charCount.textContent = '0 karakter';
  currentTranslationText = '';
  renderTranslation('');
  hideError();
  sourceTextInput.focus();
});

// Çeviri sonucunu ekrana bas
function renderTranslation(text) {
  currentTranslationText = text;
  if (!text) {
    translationOutput.textContent = 'Çeviri burada görünecektir...';
    translationOutput.classList.add('empty');
    outputCharCount.textContent = '0 karakter';
    footerStatus.textContent = 'Hazır';
  } else {
    translationOutput.textContent = text;
    translationOutput.classList.remove('empty');
    outputCharCount.textContent = `${text.length.toLocaleString('tr-TR')} karakter`;
    footerStatus.textContent = 'Çeviri tamamlandı';
  }
}

// Çevir Butonuna Tıklama ve İşlem
async function handleTranslate() {
  const text = sourceTextInput.value.trim();
  
  if (!text) {
    showError('Metin Eksik', 'Lütfen çevirmek istediğiniz metni sol taraftaki alana girin.');
    sourceTextInput.focus();
    return;
  }

  hideError();
  setLoading(true);

  try {
    const payload = {
      text: text,
      sourceLang: sourceLangSelect.value,
      targetLang: targetLangSelect.value,
      domain: domainSelect.value,
      style: styleSelect.value,
      glossary: glossaryInput.value
    };

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errMessage = data.error || 'Bilinmeyen bir hata oluştu.';
      showError('Çeviri Hatası', errMessage);
      renderTranslation('');
    } else {
      renderTranslation(data.translation);
    }
  } catch (error) {
    showError(
      'Bağlantı Hatası',
      'Sunucuya ulaşılamadı. Node.js sunucusunun açık olduğundan ve internet bağlantınızdan emin olun.'
    );
    console.error('Fetch error:', error);
  } finally {
    setLoading(false);
  }
}

// Yükleme durumu yönetimi
function setLoading(isLoading) {
  if (isLoading) {
    loadingOverlay.classList.remove('hidden');
    translateBtn.disabled = true;
    translateBtn.querySelector('.btn-text').textContent = 'Çevriliyor...';
    translateBtn.querySelector('.btn-spinner').classList.remove('hidden');
    translateBtn.querySelector('.btn-icon').classList.add('hidden');
    footerStatus.textContent = 'Gemini işliyor...';
  } else {
    loadingOverlay.classList.add('hidden');
    translateBtn.disabled = false;
    translateBtn.querySelector('.btn-text').textContent = 'Çevir';
    translateBtn.querySelector('.btn-spinner').classList.add('hidden');
    translateBtn.querySelector('.btn-icon').classList.remove('hidden');
  }
}

// Çevir düğmesi ve Ctrl+Enter kısayolu
translateBtn.addEventListener('click', handleTranslate);

sourceTextInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleTranslate();
  }
});

// Tek Tıkla Kopyalama
copyResultBtn.addEventListener('click', async () => {
  if (!currentTranslationText) {
    return;
  }

  try {
    await navigator.clipboard.writeText(currentTranslationText);
    copyResultBtn.classList.add('copied');
    copyBtnText.textContent = 'Kopyalandı!';
    
    setTimeout(() => {
      copyResultBtn.classList.remove('copied');
      copyBtnText.textContent = 'Kopyala';
    }, 2000);
  } catch (err) {
    // Eski tarayıcı fallback
    const tempInput = document.createElement('textarea');
    tempInput.value = currentTranslationText;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    copyResultBtn.classList.add('copied');
    copyBtnText.textContent = 'Kopyalandı!';
    setTimeout(() => {
      copyResultBtn.classList.remove('copied');
      copyBtnText.textContent = 'Kopyala';
    }, 2000);
  }
});

// Başlangıç ayarı
updateTitles();
