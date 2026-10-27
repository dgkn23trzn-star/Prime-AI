# PRIME AI Mobil

Telefon için yapılmış PRIME AI: Gemini tarzı sade bir sohbet ekranı, her an
ekranda duran asistan topu ve kendi API anahtarınla çalışan yapay zekâ.
Masaüstü sürümündeki hesap/veri mantığı yerine bu sürüm **tek cihazda**
çalışır: anahtarlar ve sohbetler yalnızca tarayıcının `localStorage`'ında durur,
hiçbir sunucuya gönderilmez.

Sunucusuz bir web uygulamasıdır (PWA). Derleme adımı yoktur: dosyaları bir
statik sunucuya koyup açmak yeterlidir.

## Telefonda açma

**Seçenek 1 — bir web sunucusuna koy (önerilir).** Klasörü herhangi bir statik
barındırmaya (GitHub Pages, Netlify, Cloudflare Pages…) yükle, telefonun
tarayıcısında aç. Chrome/Safari menüsünden **Ana ekrana ekle** dersen uygulama
gibi tam ekran açılır.

**Seçenek 2 — bilgisayarda dene.** Proje kökünde:

```bash
python -m http.server 8080
# sonra: http://localhost:8080/prime-ai-mobil/
```

Telefon ve bilgisayar aynı ağdaysa `http://BILGISAYARIN-IP:8080/prime-ai-mobil/`
adresini telefondan açabilirsin. (Servis çalışan HTTPS/localhost dışında PWA
kurulumu devre dışı kalır; sohbet yine çalışır.)

`index.html`'i doğrudan `file://` ile açmak da mümkündür ama bazı sağlayıcılar
CORS nedeniyle isteği reddedebilir; sunucu üzerinden açmak daha güvenilir.

## İlk açılış

İlk yüklemede 4 adımlı **API rehberi** açılır ve bir daha kendiliğinden
görünmez:

1. Hoş geldin.
2. API anahtarını yapıştır — ücretsiz **Google Gemini** anahtarı için
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
3. Kullanılabilir modelleri getir, birini seç.
4. Asistan topunun ekranda durup durmayacağını seç ve başla.

Rehber sonradan **Ayarlar → Hakkında → API rehberi** ile yeniden açılabilir.

## Neler var

- **Sohbet:** akış (streaming) yanıt, markdown/kod blokları, kopyala ve yeniden
  üret, görsel ekleme (en fazla 3), sesle yazma (destekleyen tarayıcılarda).
- **Asistan topu:** sohbetin üstünde durur; nefes alır, göz kırpar, yanıt
  gelince zıplayıp kıvılcım saçar. Dokununca küçük bir asistan paneli açılır ve
  kısa yanıt verir. **Ayarlar → Asistan → Ekranda görünsün** ile kapatılabilir.
- **Sohbetler:** soldaki menüde liste, yeni sohbet, sohbet silme.
- **Ayarlar:** tema (varsayılan **siyah-kırmızı**; ayrıca **beyaz** ve sistem
  teması), 8 vurgu rengi, asistan boyutu ve canlılığı, kısa yanıtlar, yanıt
  dili, yaratıcılık, ekstra talimat, API yönetimi (ekle / etkinleştir / sil /
  bağlantı testi), tuş sesi ve düzeyi, verileri temizleme.
- **Çevrimdışı kabuk:** `sw.js` arayüzü önbelleğe alır; internet yokken uygulama
  açılır, sohbet için bağlantı gerekir.

## Sağlayıcılar

Gemini, OpenAI, Anthropic (Claude), Groq, OpenRouter, Mistral, DeepSeek, xAI,
Together, Perplexity, Cerebras, Fireworks ve Ollama. Masaüstü sürümüyle aynı
istek gövdeleri kullanılır; anahtar biçiminden sağlayıcı otomatik tanınır.

## Dosyalar

| Dosya | İş |
| --- | --- |
| `index.html` | Ekranlar: sohbet, menü, ayarlar, API rehberi |
| `mobile.css` | Gemini tarzı mobil arayüz, animasyonlar |
| `mobile.js` | Sohbet, API, asistan topu, ayarlar, kayıt |
| `manifest.webmanifest` | Ana ekrana ekleme bilgileri |
| `sw.js` | Çevrimdışı kabuk önbelleği |
| `icons/` | 192/512 px uygulama simgeleri |

## Gizlilik

API anahtarları ve sohbetler cihazda saklanır; PRIME AI'ya ait bir sunucuya
gönderilmez. İstekler doğrudan seçtiğin sağlayıcıya gider. Ortak bir cihazda
kullanıyorsan **Ayarlar → Veriler → Her şeyi sıfırla** ile temizleyebilirsin.
