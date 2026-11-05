// Ortam değişkenlerini (.env dosyasını) yüklüyoruz
require('dotenv').config();

const express = require('express');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON istek gövdelerini ve statik web dosyalarını destekle
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Gemini API istemcisini başlatan yardımcı fonksiyon
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('BURAYA_GEMINI_API_KEY_YAPISTIRIN')) {
    const error = new Error('API_KEY_MISSING');
    error.statusCode = 400;
    throw error;
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

// Çeviri Endpoint'i
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang, domain, style, glossary } = req.body;

    // Metin doğrulama
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Lütfen çevrilecek bir metin girin.'
      });
    }

    // Gemini İstemcisini kontrol et
    let ai;
    try {
      ai = getGeminiClient();
    } catch (err) {
      if (err.message === 'API_KEY_MISSING') {
        return res.status(400).json({
          success: false,
          error: 'Gemini API anahtarı tanımlanmamış veya geçersiz! Lütfen projenizdeki .env dosyasına GEMINI_API_KEY değerini ekleyin ve sunucuyu yeniden başlatın.'
        });
      }
      throw err;
    }

    // Alan açıklamaları haritası
    const domainPrompts = {
      genel: 'Genel ve anlaşılır bir dil kullan.',
      hukuk: 'Hukuki terminolojiye, resmi yasal kavramlara ve hukuki jargona kesinlikle sadık kal.',
      tip: 'Tıbbi terminolojiye, anatomik ve klinik terimlere uygun profesyonel bir dil kullan.',
      teknik: 'Mühendislik, yazılım veya teknik alandaki standart teknik terimleri ve terminolojiyi tercih et.',
      edebi: 'Edebi ahengi, metaforları ve sanatsal ifade zenginliğini koruyarak akıcı bir çeviri yap.'
    };

    // Üslup açıklamaları haritası
    const stylePrompts = {
      resmi: 'Resmi, mesafeli, profesyonel ve saygılı bir üslup kullan (siz dili).',
      gundelik: 'Gündelik, samimi, akıcı ve konuşma diline uygun doğal bir ton kullan.'
    };

    const selectedDomainDesc = domainPrompts[domain] || domainPrompts['genel'];
    const selectedStyleDesc = stylePrompts[style] || stylePrompts['resmi'];

    // Terimce (Glossary) çözümleme
    let glossaryInstructions = '';
    if (glossary && glossary.trim()) {
      const entries = glossary
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('='))
        .map(line => {
          const parts = line.split('=');
          const srcTerm = parts[0].trim();
          const trgTerm = parts.slice(1).join('=').trim();
          return `  - "${srcTerm}" terimini MUTLAKA "${trgTerm}" olarak çevir.`;
        });

      if (entries.length > 0) {
        glossaryInstructions = `\nZORUNLU TERİM LİSTESİ (GLOSSARY):\n${entries.join('\n')}\nMetinde bu terimler geçiyorsa harfiyen yukarıda belirtilen karşılıklarını kullan!`;
      }
    }

    // Profesyonel Çevirmen Sistem Talimatı:
    // Yapay, motamot ve parantez içi kaynak dil kalıntısı bırakan çevirileri engelleyen net kurallar
    const systemInstruction = `Sen hedef dili anadili gibi konuşan, son derece deneyimli ve profesyonel bir yeminli tercümansın.
Görevin: Verilen metni "${sourceLang || 'Otomatik Algıla'}" dilinden "${targetLang || 'Türkçe'}" diline en doğal, doğru ve akıcı biçimde çevirmektir.

TEMEL ÇEVİRİ İLKELERİ:
1. DOĞAL DİL VE AKICILIK: Motamot (kelimesi kelimesine) çeviri yapma. Hedef dilin doğal cümle yapısını, sözdizimini ve yerleşik deyimlerini kullan.
2. KAYNAK DİL KALINTILARINI ENGELLE: Kaynak dildeki yasal, idari veya yerel terimleri hedef metin içinde parantez açıp kaynak dildeki adıyla bırakma (örneğin Almancaya çevirirken araya Türkçe "(Kat Mülkiyeti)" veya İngilizceye çevirirken "(Tapu)" gibi eklemeler ASLA yapma). Bunların hedef dildeki tam yasal/kültürel karşılığını (ör. Almanca için "Eigentumswohnung" / "Wohnungseigentum") doğal bir cümle içinde kullan.
3. ALAN / TERMİNOLOJİ: ${selectedDomainDesc}
4. ÜSLUP / TON: ${selectedStyleDesc}
${glossaryInstructions}

ÇOK KATI ÇIKTI KURALLARI:
- SADECE hedef dildeki çevrilmiş metni döndür.
- Çıktıya asla açıklama, tırnak işareti, not, selamlama ("İşte çeviri:", "Here is the translation:" vb.) ekleme.
- Sadece saf çevrilmiş nihai metni ver.`;

    // Gemini 3.5 Flash: Yüksek anlama kapasitesi + thinkingBudget: 0 ile anlık yanıt (~1 sn)
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: text.trim(),
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });

    const translatedText = response.text ? response.text.trim() : '';

    return res.json({
      success: true,
      translation: translatedText
    });

  } catch (error) {
    console.error('Çeviri Hatası:', error);

    // Kullanıcı dostu hata yönetimi ve Türkçe çözüm önerileri
    let userFriendlyMessage = 'Çeviri yapılırken beklenmeyen bir hata oluştu.';
    const errorDetails = error.message || error.toString();

    if (errorDetails.includes('API_KEY_INVALID') || errorDetails.includes('invalid api key') || errorDetails.includes('403')) {
      userFriendlyMessage = 'Gemini API anahtarınız geçersiz veya eksik! Lütfen Google AI Studio üzerinden aldığınız anahtarı .env dosyasına doğru yapıştırdığınızdan emin olun.';
    } else if (errorDetails.includes('RESOURCE_EXHAUSTED') || errorDetails.includes('quota') || errorDetails.includes('429')) {
      userFriendlyMessage = 'API kullanım kotanız doldu veya çok sık istek gönderildi (Rate Limit). Lütfen biraz bekleyip tekrar deneyin veya Google AI Studio kotanızı kontrol edin.';
    } else if (errorDetails.includes('ENOTFOUND') || errorDetails.includes('fetch failed') || errorDetails.includes('ECONNREFUSED')) {
      userFriendlyMessage = 'İnternet bağlantısı kurulamadı veya Google sunucularına erişilemiyor. Lütfen internet bağlantınızı kontrol ediniz.';
    } else if (errorDetails.includes('SAFETY') || errorDetails.includes('blocked')) {
      userFriendlyMessage = 'Gönderilen metin güvenlik/içerik filtrelerine takıldı. Lütfen metni gözden geçirip tekrar deneyin.';
    }

    return res.status(500).json({
      success: false,
      error: userFriendlyMessage,
      debug: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Çeviri Uygulaması Başarıyla Çalıştırıldı!`);
  console.log(`👉 Tarayıcınızda açın: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
