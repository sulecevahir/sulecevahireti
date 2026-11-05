# 🌐 Gemini AI Makine Çevirisi Uygulaması

Google Gemini API (Gemini 2.5 Flash) kullanan, modern, koyu temalı ve mobil uyumlu bir Node.js makine çevirisi uygulaması.

---

## 🚀 Hızlı Kurulum ve Çalıştırma Rehberi

### Adım 1: API Anahtarını Tanımlama
Proje klasöründeki [`.env`](file:///c:/Users/PCLAB1/Desktop/Yeni%20klasör%20ide/.env) dosyasını açın ve Gemini API anahtarınızı yapıştırın:

```env
GEMINI_API_KEY=AIzaSy...SİZİN_API_ANAHTARINIZ...
PORT=3000
```
> **Not:** Ücretsiz bir Gemini API anahtarı almak için [Google AI Studio](https://aistudio.google.com/) adresine gidebilirsiniz.

### Adım 2: Bağımlılıkları Yükleme (Gerekirse)
Bağımlılıklar önceden kurulmuştur. Yeniden yüklemek isterseniz terminalde:
```bash
npm install
```
*(Windows PowerShell'de script izni hatası alırsanız `cmd` terminali açıp `npm install` çalıştırabilirsiniz.)*

### Adım 3: Uygulamayı Başlatma
Terminalinizde şu komutu çalıştırın:
```bash
npm start
```
Geliştirici modunda (otomatik yeniden başlatma) çalıştırmak isterseniz:
```bash
npm run dev
```

### Adım 4: Tarayıcıda Açma
Tarayıcınızı açın ve şu adrese gidin:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ✨ Özellikler

1. **Dil Seçimi ve Çift Yönlü Değiştirme (Swap):** 
   - İngilizce, Türkçe, Almanca, İspanyolca, Fransızca, İtalyanca, Rusça, Arapça, Çince, Japonca ve Otomatik Dil Algılama.
   - İki yönlü ok butonuyla kaynak ve hedef dili anında takas etme.
2. **Alan (Domain) Desteği:**
   - Genel, Hukuk, Tıp, Teknik (Yazılım/Mühendislik) ve Edebi çeviri modları.
3. **Üslup (Tone) Seçimi:**
   - Resmi (Siz dili, kurumsal) veya Gündelik (Samimi, doğal konuşma dili).
4. **Zorunlu Terimce (Glossary):**
   - Kullanıcı `kaynak = hedef` formatında özel terimler tanımlayabilir. Gemini bu eşleşmelere birebir uyar.
5. **Saf Çıktı:**
   - Model yalnızca çeviriyi verir; gereksiz giriş cümleleri veya tırnak işaretleri içermez.
6. **Tek Tıkla Kopyalama:**
   - Çeviri kutusundaki kopyalama butonuyla anında panoya aktarma.
7. **Türkçe Hata Yönetimi:**
   - Hatalı anahtar, kota aşımı, internet kesintisi gibi durumlarda net ve yönlendirici Türkçe uyarılar.
8. **Modern Koyu Tema & Mobil Uyumlu:**
   - Göz yormayan GitHub Dark tarzı renk paleti ve telefon ekranlarına uyumlu arayüz.
