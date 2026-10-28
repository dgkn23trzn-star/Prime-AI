# PRIME AI Mobil

Telefon için yapılmış PRIME AI: Gemini tarzı sade bir sohbet ekranı ve kendi API
anahtarınla çalışan yapay zekâ. Sohbetin üstünde duran top yok; Android
uygulamasında asistan, **ana ekranda duran bir top** olarak çalışır (Ayarlar →
Asistan tuşu).
Masaüstü sürümündeki hesap/veri mantığı yerine bu sürüm **tek cihazda**
çalışır: anahtarlar ve sohbetler yalnızca tarayıcının `localStorage`'ında durur,
hiçbir sunucuya gönderilmez.

Sunucusuz bir web uygulamasıdır (PWA). Derleme adımı yoktur: dosyaları bir
statik sunucuya koyup açmak yeterlidir.

## Android uygulaması (APK)

Hazır APK: release sayfasındaki **PRIME-AI-Mobil-1.5.1.apk**.

1. Dosyayı telefona indir.
2. Dosyayı aç; Android “bilinmeyen kaynaklara izin ver” derse izin ver.
3. Kurulunca **PRIME AI** simgesi ana ekrana / uygulama çekmecesine eklenir.

APK, bu klasördeki web uygulamasını tam ekran bir WebView'de çalıştırır; arayüz
internetten bağımsız olarak açılır, yalnızca API çağrıları internet ister.
Kaynak ve yeniden derleme adımları: [`../android/README.md`](../android/README.md).

> APK, makinedeki Android debug anahtarıyla imzalandı. Aynı telefona yeni sürüm
> yüklerken aynı anahtar gerekir; başka bir bilgisayarda üretileni kurmadan önce
> eski uygulamayı kaldırman gerekebilir.

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

İlk yüklemede önce **dil ekranı** gelir: Türkçe, English, Deutsch, Русский,
日本語. Seçilen dil hem API rehberinin metinlerini hem yanıt dilini belirler;
sonradan **Ayarlar → Dil** ile değiştirilebilir.

Dil seçilince 4 adımlı **API rehberi** açılır (anahtar adımıyla başlar) ve bir
daha kendiliğinden görünmez:

1. Hoş geldin (rehber sonradan açıldığında görünür).
2. API anahtarını yapıştır — ücretsiz **Google Gemini** anahtarı için
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
3. Kullanılabilir modelleri getir, birini seç.
4. Asistan tuşunun (ana ekrandaki yüzen top) açık olup olmayacağını seç ve başla.

Rehber sonradan **Ayarlar → Hakkında → API rehberi** ile yeniden açılabilir.

## Neler var

- **Sohbet:** akış (streaming) yanıt, markdown/kod blokları, kopyala ve yeniden
  üret, görsel ekleme (en fazla 3), sesle yazma (destekleyen tarayıcılarda).
- **Model seçimi:** sohbetin üstündeki model rozetine dokununca etkin API
  anahtarının modelleri tam ekran listede açılır; seçim anında uygulanır ve API
  ayarlarına gitmek gerekmez. Aynı liste **Ayarlar → API** kartındaki sağlayıcı
  satırından da açılır; birden çok anahtar varsa üstteki sekmelerle geçilir,
  **Yenile** listeyi sağlayıcıdan yeniden çeker.
- **API düzenleme:** **Ayarlar → API** listesinde bir anahtara **iki kez dokununca**
  düzenleme sayfası açılır: sağlayıcı, anahtar ve model değiştirilir, anahtar silinir.
  Tek dokunuş model listesini açmaya devam eder.
- **Yanıt sigortası:** akış kurulamazsa (gövde yok, 5xx, 30 saniye veri gelmezse) istek
  bir kez akışsız gönderilir; seçili model o anahtarda yoksa sağlayıcının varsayılan
  modeli kendiliğinden seçilir. Böylece “anahtar ekledim ama yanıt gelmiyor” durumu kalmaz.
- **Kamera ile konuşma:** kamera düğmesi canlı önizlemeyi açar; yazarak ya da **Konuş** ile
  sorulur, o anki kare modele gider (ilk görsel kamera, sonrakiler bellek görselleri). Model
  ne olduğunu/rengini anlatır ve yanıtı sesli okur. AI konuşurken konuşmaya başlarsan susar.
- **Nesne belleği:** “bunun adı …” dendiğinde kare küçültülüp adıyla saklanır (en fazla 24,
  cihazda). Sonraki kamera sorularında adlar ve görseller modele gönderilir.
- **Ses:** `PrimeVoice` köprüsü TTS ve `SpeechRecognizer` sağlar; üç kadın + üç erkek ton,
  hız, “Yanıtları sesli oku”, dinleme dili, “Konuşunca gönder”, “Araya girince sus”.
- **Profil fotoğrafı:** profil avatarına dokunup galeriden seçilir; üst çubuk, menü ve
  ayarlarda görünür.
- **Asistan tuşu (ana ekranda top):** **Ayarlar → Asistan → Asistan tuşu**
  açılınca gerekli izinler istenir, uygulama kapanır ve top ana ekranda kalır.
  Topa dokununca mikrofon dinler, yanıt balonda akar ve sesli okunur; topu
  sürükleyip istediğin yere koyabilirsin. Balonda mikrofon, yazma, ses,
  uygulamayı açma ve topu kaldırma düğmeleri vardır; başka uygulamaların
  üstünde de çalışır. Boyut ve canlılık aynı ayar bölümünden değiştirilir.
- **Uygulama içi güncelleme:** yeni sürüm çıkınca ekranın ortasında, arkası bulanık bir
  pencere açılır; **Güncelle** APK'yı uygulamanın içinde indirir (yüzde gösterir), kurulum
  ekranını açar; yeni sürüm kurulunca açılır. Sürüm bilgisi depodaki
  [`update.json`](../update.json) dosyasından okunur. Android'de izin gerekirse ayarlar açılır
  ve izin verilince kurulum kendiliğinden başlar. Tarayıcıda/PWA'da düğme APK bağlantısını açar.
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
| `mobile.js` | Sohbet, API, asistan tuşu, ayarlar, kayıt |
| `assistant.html` | Ana ekrandaki top ve yanıt balonu sayfası |
| `assistant.css` | Topun ve balonun stilleri |
| `assistant.js` | Mikrofon, akış yanıt, sesli okuma (kod yazmaz) |
| `manifest.webmanifest` | Ana ekrana ekleme bilgileri |
| `sw.js` | Çevrimdışı kabuk önbelleği |
| `../update.json` | Sürüm bilgisi (masaüstü + mobil); güncelleme penceresi buradan beslenir |
| `icons/` | 192/512 px uygulama simgeleri |

## Gizlilik

API anahtarları ve sohbetler cihazda saklanır; PRIME AI'ya ait bir sunucuya
gönderilmez. İstekler doğrudan seçtiğin sağlayıcıya gider. Ortak bir cihazda
kullanıyorsan **Ayarlar → Veriler → Her şeyi sıfırla** ile temizleyebilirsin.
