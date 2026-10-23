# PRIME AI

Kendi API anahtarınızla çalışan yapay zeka sohbet uygulaması. **Masaüstü (.exe)** ve **tarayıcı** olarak çalışır.

---

## Kurulum (Windows .exe)

`dist/PRIME-AI-Setup-1.27.0.exe` dosyasına çift tıklayın ve kurulumu izleyin. Masaüstü ve başlangıç menüsüne **PRIME AI** kısayolu eklenir; exe simgesi uygulamanın logosudur.

Masaüstündeki kısayol **uygulamayı** açar (tarayıcıyı değil): kurulum masaüstüne `.lnk` kısayolu koyar.

PRIME AI **tek örnek** çalışır: uygulama tepside gizliyken ya da top hâlindeyken masaüstünden yeniden
açılırsa ikinci bir kopya başlamaz; **var olan pencere öne gelir** (top modundaysa uygulamaya döner).

Kurulum gerektirmeyen sürüm: `dist/win-unpacked/PRIME AI.exe` (masaüstündeki **PRIME AI** kısayolu bu sürümü açığır)

**`PRIME AI Ac.bat`** (proje klasörünün kökünde): çift tıklayınca klasördeki kopyayı açar. Yol
kendi konumuna göre hesaplanır (`%~dp0`), bu yüzden klasör taşınsa da çalışır; exe yoksa ne yapılacağını söyler.
Uygulama zaten açıksa ikinci kopya başlatmaz, **var olan pencereyi öne getirir**.

**Klasördeki kopyayı tek tuşla açma:** `scripts/kisayol-tusu.ps1` çalıştırıldığında Başlat menüsüne
**PRIME AI (klasör)** kısayolu eklenir ve kısayol tuşu **Ctrl + Alt + P** olur. Bu tuş, uygulama kapalıyken
de `dist/win-unpacked/PRIME AI.exe` kopyasını açar; uygulama zaten açıksa ikinci kopya başlatmaz ve
**var olan pencereyi öne getirir**. Kaldırmak için: `scripts/kisayol-tusu.ps1 -Kaldir`.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\kisayol-tusu.ps1
```

### Yeniden derleme

```bash
npm install
npm run dist        # → dist/PRIME-AI-Setup-<sürüm>.exe
node scripts/make-icon.js   # logodan yuvarlak 512x512 uygulama ikonu üretir
npx electron scripts/smoke.js   # görünmez pencerede açılış testi
npm start           # geliştirme modunda çalıştır
```

## Tarayıcıda çalıştırma

```bash
python -m http.server 5173
# sonra: http://localhost:5173
```

---

## Açılış animasyonu

Uygulama her açılışta kısa bir animasyon gösterir: logo dönerek belirir, **PRIME AI** harf harf yazılır,
altında bir ilerleme çubuğu dolar (~2 saniye). Tıklayarak veya bir tuşa basarak animasyon atlanabilir.
Animasyon bitince tema renkleriyle uyumlu şekilde giriş ekranına (veya doğrudan sohbete) yumuşak geçiş yapılır.

---

## Konsol (hatalar ve yapılan işler)

Üst çubuğun sağ üst köşesindeki tek düğme olan **konsol düğmesi** (🖥) uygulamanın günlüğünü açar. Amaç: bir istek hata verdiğinde
hata mesajını **uygulamanın içinden** okuyabilmek.

- **Hata olunca panel kendiliğinden açılır** ve hatanın tam metni (sunucudan gelen ayrıntı, HTTP kodu,
yığın izi) satırın altında gösterilir.
- Düğmede **hata rozeti** çıkar; başlıktaki sayaç toplam kayıt ve hata sayısını gösterir.
- **Sadece hatalar** süzgeci, **Temizle** ve **Kapat** düğmeleri vardır.
- Kayıtlar ne yaptığını da anlatır: istek gönderildi (sağlayıcı · model · uzunluk), yanıt tamamlandı,
  görsel arama ve kaynağı, bulunan videonun adı/kanalı, API kaydedildi/silindi,
  modeller getirildi, tema değişti, giriş/çıkış ve hesap işlemleri.
- Yakalanmayan JavaScript hataları, işlenmeyen söz (promise) hataları ve CSP engelleri de buraya düşer.
- Aynı satırlar masaüstü uygulamasının **geliştirici konsoluna** `[PRIME AI]` ön ekiyle yazılır.

---

## Masaüstü topu

Yazı kutusunun **solundaki gri top**, uygulamayı masaüstünde küçük bir topa indirir. Uygulama
büzülüp bulanıklaşarak kapanır, yerine top kalır — masaüstünün üstünde, görev çubuğunda görünmeden.

### Tepside çalışma ve asistanı çağırma

- **Gizli simgeler tepsisinde** PRIME AI simgesi durur; uygulama pencere kapansa da **arka planda çalışmaya devam eder**.
- Tepsi simgesine **sağ tıklayınca** menü açılır: en üstte **açık hesabın adı**, altında **“Uygulamayı aç”**, **“Asistanı çağır”**, **“Çıkış”**. Sol tıklama da uygulamayı açar.
- Ana pencerenin **kapat (×)** düğmesi uygulamayı kapatmaz; **tepsiye küçültür**. Tamamen çıkmak için tepsi menüsünden **Çıkış** seçilir.
- **“Asistanı çağır”** (tepsi menüsü ya da sohbete `asistanı çağır` / `topu aç` yazmak) asistanı çağırır: top **yandan küçükten büyüyerek** normal boyutuna gelir, **gülümser**, kısa bir kıvılcım saçar ve “**Kanka neler soracan gene?**” der.
- Top boştayken nefes alır gibi süzülür, ara sıra **iki kez üst üste kırpar** ya da **tek gözünü kırpar**; yanıt gelince kısa bir **sevinç zıplaması** ve kıvılcımlar çıkar, tıklayınca toptan dışa **halka** yayılır.
- **Ctrl + Shift + A:** asistanı her yerden çağırır. Top açıkken aynı tuş onu kapatır; kapatıp aynı tuşla geri çağırabilirsiniz (tuş atanmaz, kalıcıdır).
- **Ctrl + Alt + P:** klasördeki PRIME AI kopyasını (`dist/win-unpacked/PRIME AI.exe`) her yerden açar; uygulama kapalıyken de çalışır. Tuş Başlat menüsündeki **PRIME AI (klasör)** kısayoluna bağlıdır (`scripts/kisayol-tusu.ps1`). Uygulama açıkken basılırsa ikinci kopya açılmaz, pencere öne gelir.
- Asistanın sol üst köşesindeki **×** düğmesi topu kapatır; uygulama **tepside arka planda** kalır ve oradan yeniden açılabilir.

- **Sol tık:** topun üstünde yalnızca **metin girişi** açılır (renkler burada yoktur). Yazıp
  gönderdiğinizde kutu kapanır; top **aynı anahtar ve modelle** yanıtlar. Yanıt aynı yerde değil,
  topun üstünde ayrı bir **konuşma balonunda** akar; bir önceki yazışma gösterilmez, yalnızca son
  yanıt görünür. Beklerken top düşünür (halka döner, gözler kısılır, balonda üç nokta oynar).
- **Konuşma animasyonu:** yanıt yazılırken topun ağzı konuşur gibi açılıp kapanır, gövdesi hafifçe
  salınır; yanıt bitince durur.
- **Güler yüz:** top boştayken **hep gülümser** (kavisli ağız, mutlu gözler); ara sıra gözlerini
  kırpar, yerinde hafifçe sallanır ve zaman zaman iki kısa hopla enerjisini taşırır.
- **Duygular ve kaşlar:** topun **kaşları vardır** ve asistanın **kendi yanıtındaki kelimelere** göre
  oynar: sevinçte kaşlar havalanır ve gülümseme büyür, üzüntüde kaşların iç uçları kalkıp ağız aşağı
  kıvrılır, kızgınlıkta kaşlar çatılıp ağız düzleşir, şaşkınlıkta kaşlar yükselir, gözler büyür ve
  ağız “o” olur. **Konuşurken de** ağız duyguya uyar: şaşkın cümlede yuvarlak “o”, kızgın cümlede düz
  çizgi, üzüntülü cümlede aşağı kıvrık ağız konuşma animasyonuyla birlikte görünür; kaşlar o sırada
  çatık/yükselmiş/üzgün durur. Bir yanıtın içinde iki duygu varsa (ör. “Maalesef olmadı ama harika bir
  haberim var”) yüz **yavaşça** birinciden ikinciye geçer; geçiş yaklaşık 2 saniye sürer ve kesik
  kesik değildir.
- **Fareyi takip:** topun yüzü **arada sıra (hep değil)** gerçek fare imlecine döner. Ana süreç fare
  konumunu 120 ms'de bir topa bildirir; top yalnızca kendi “bakış” anında (yaklaşık 10–23 saniyede bir,
  2,5–4 saniyeliğine) bu konumu kullanır, sonra yeniden öne bakar. Yazı kutusu, cevap balonu ya da menü
  açıkken fare takibi durur.
- **Kendiliğinden sohbet:** top uzun süre boş kalırsa (yaklaşık 3–5 dakikada bir) kısa bir cümle söyler
  ve **uygulamanın adını** anar: “PRIME AI burada — bu uygulamada neler yapıyorsun bakalım?”, “PRIME AI
  seninle; neler kurcalıyoruz şu an?” gibi. Cümle birkaç saniye sonra kendiliğinden kapanır; siz bir şey
  yazınca hemen kaybolur. Uyurken, yorulurken ve balon açıkken bu cümleler gösterilmez.
- **Boşta:** top sık sık başını çevirip sağa, sola ve yukarı bakar; arada bir **yavaşça** kısa
  mesafe dolanır ama sürekli hareket etmez — her turda bir durak vardır. Dolanırken top hep
  **ekranın en altında**, görev çubuğunun üstündeki şeritte yürür; yukarı çıkmaz.
- **Yorulma ve uyku:** varsayılan olarak her **6–8 dakikada** bir yorulmaya başlar (gözleri sarkar,
  ağzı küçülür). Uyumaya **45 saniye** kala iyice ağırlaşır, son **12 saniyede** gözlerini neredeyse
  kapatır. Sonra yorgun bir sesle **“Ben uyuyacağım… bay bay…”** der, **esner** ve **yatağına yatar**;
  üstüne yorgan örtülür, arkasından **z z z** harfleri yükselip söner. Uykusu **1 dakika** sürer,
  sonunda **gerinerek uyanır** ve “Günaydın! Enerji dolu döndüm!” der. Uyurken herhangi bir
  dokunuş onu hemen uyandırır. Sıklık ve süre **Ayarlar → Asistan** bölümünden değiştirilebilir;
  oradan uyku tamamen kapatılabilir.
- **Yüz:** topun yüzü (göz boyutu/aralığı/renk, ağız genişliği/kavisi/renk) **Ayarlar → Asistan →
  Yüz tasarla** bölümünden şekillendirilip kaydedilir; **Ekstra yüzler** listesinden hazır yüzler
  (Mutlu, Uykucu, Şaşkın, Kurnaz, Robot) veya kendi kaydettiğiniz yüzler seçilebilir.
- **Aksesuar:** **mavi camlı gözlük** (iki cam, köprü ve saplar) ve **siyah gözlük** — mavi modelin
  birebir aynı biçimi, yalnızca tamamen siyah (mavi ton yok) — ayrıca **kovboy şapkası**,
  **beyzbol şapkası**, **kral tacı** ve
  **ağız maskesi**. Şapkalar kafaya oturur — tepesi başın üstünü örter, kenarı/siperi başın iki
  yanına taşar; yüzün üstünde boşluk kalmaz. Hepsi uyurken, konuşurken ve bakarken yüzle birlikte
  hareket eder. **Aksesuar yüze takılıdır:** top sağa/sola/yukarı baktığında ya da fareyi takip
  ettiğinde gözlük, şapka ve taç da yüzle **aynı yöne kayıp aynı açıyla döner**; bu sırada topun
  duruşu da o yöne hafifçe yatar (yaklaşık 3°), fare takibinde yatış bakış açısıyla orantılıdır.
  Seçim top menüsünden ya da **Ayarlar → Asistan → Aksesuarlar** bölümünden yapılır.
- **Sesli asistan:** **Ayarlar → Asistan → Sesli asistan sesi** bölümünden yanıtların sesli okunması
  açılır. **Ses sırası: ElevenLabs → Gemini → Windows.** Kendi **ElevenLabs API anahtarınızı**
  girerseniz (aynı bölümdeki **ElevenLabs API anahtarı** alanına yapıştırılır; yalnızca bu
  bilgisayarda saklanır) yanıtlar gerçek yapay zekâ sesleriyle ElevenLabs’ten üretilir; “**Sesleri
  getir**” düğmesi hesabınızdaki tüm sesleri listeye çeker. Anahtar yoksa **Gemini API anahtarıyla**
  çalışan **10 yeni kadın** ve **12 yeni erkek**
  sesi, ayrıca üç karışık mod vardır. Kadınlar: **Callirrhoe**, **Autonoe**, **Despina**,
  **Erinome**, **Laomedeia**, **Achernar**, **Gacrux**, **Pulcherrima**, **Vindemiatrix**, **Sulafat**.
  Erkekler: **Enceladus**, **Iapetus**, **Umbriel**, **Algieba**, **Algenib**, **Rasalgethi**,
  **Alnilam**, **Schedar**, **Achird**, **Zubenelgenubi**, **Sadachbia**, **Sadaltager**.
  Eski sekiz ses kaldırıldı. **Karışık** her yanıtta başka bir ses, **Karışık kadın** yalnızca kadın,
  **Karışık erkek** yalnızca erkek sesler arasından seçer (art arda aynı ses gelmez). Ses, Gemini TTS
  ile üretilip uygulamada çalınır; internet ve Gemini anahtarı gerekir. Gemini sesi üretilemezse (kota
  doldu ya da internet yok) asistan **sessiz kalmaz**: yanıt Windows’un kendi konuşma sesiyle okunur ve
  durum bir kez bildirilir. Yedek ses **seçilen AI sesinin cinsiyetini izler**: kadın ses seçilince
  kadın, erkek ses seçilince erkek Windows sesi kullanılır (o cinsiyette ses kuruluysa).
  Otomatik seslendirme **kısa tutulur** (en fazla birkaç cümle); sohbetteki
  **Sesli oku** düğmesi ise yanıtın tamamına yakınını (1200 karaktere kadar) okur.
- **Sesli okurken ağız:** Asistan sesli okumaya başladığında topun ağzı **hece gibi açılıp kapanır**,
  okuma bitince gülümsemesine döner. Duygu varsa ağız şekli korunur: üzgün okumada ağız aşağı kıvrık
  kalır, kızgında düz çizgi, şaşkında “o” biçiminde oynar. Top kapalıyken ağız hareketi görünmez,
  okuma yine sürer.
- **Sürükle:** sol tıkla basılı tutup taşıyabilirsiniz; bıraktığınız yerde kalır ve konum hesabınıza kaydedilir.
- **Sağ tık:** menü açılır — **Uygulamaya dön**, 9 renk (gri, kırmızı, sarı, mavi, siyah, mor,
  pembe, yeşil, turuncu) ve **aksesuarlar**: yok, gözlük, kovboy şapkası, şapka, siyah gözlük,
  kral tacı, ağız maskesi. Renk ve aksesuar seçimi doğrudan topa uygulanır ve hesabın ayarlarına
  yazılır; **Ayarlar → Asistan → Aksesuarlar** bölümü aynı listeyi gösterir, seçim iki yerde ortaktır.
- **Uygulamaya dön:** yanlışlıkla çıkmayı önlemek için **iki kez** basmak gerekir; ilk basışta düğme
  onay ister. Uygulama penceresi eskisi gibi açılır; top gizlenir (sohbeti hatırlar).
- **Erişim komutları:** Ayarlar → Uygulama Ayarları → **Erişim** bölümünden bir uygulama ya da
  klasör seçip ona isim verin. Top hâlindeyken **“aç isim”** yazarak açar, **“kapat isim”** yazarak
  kapatırsınız (ör. “aç Chrome”, “kapat Chrome'u”). Komutlar anahtar/model istemez ve yapay zekâya
  gitmez; sonuç topun balonunda görünür. Top, uygulama açılırken ya da kapanırken kısa süre **titrer**.
  Klasörler açılabilir; kapatma yalnızca uygulamalar içindir. Güvenlik için gezgin (Explorer) ve
  sistem süreçleri kapatılmaz; kapatma yalnızca seçtiğiniz yolla **birebir eşleşen** süreçleri sonlandırır.

Top ayrı, çerçevesiz ve saydam bir penceredir (`ball.html`); pencere tam olarak içeriği kadar büyür,
boş alanı masaüstü tıklamalarını engellemez. Yanıtlar uygulamanın kendi akışıyla üretilir — anahtarlar
ve sohbet geçmişi ana pencereye aittir, topun kısa geçmişi hesabın içinde ayrı tutulur.

### Asistan eylemleri (topa verilen komutlar)

Topa yalnızca sohbet değil, gerçek masaüstü komutları da verilebilir:

- **“aç <isim>” / “kapat <isim>”** — Ayarlar → Erişim bölümünde kayıtlı bir uygulama ya da klasör
  açılır/kapatılır. Bu komutlar anahtar ve model gerektirmez.
- **Açıldıktan sonra ekrana bakma** — Bir uygulama açıldığında, **görsel destekli bir model** seçiliyse
  asistan ekran görüntüsü alır, ekranda ne olduğunu 1-2 cümlede söyler ve uygulamanın içinde
  açılabilecek mantıklı bir şey (ör. bir URL) varsa **“Şunu da açayım mı?”** diye önerir.
- **“kendini kapat”** — Asistan kendini kapatır; top uygulamaya döner, açık uygulamalar etkilenmez.
- **Bilinmeyen emir** — Kayıtlı olmayan bir komut verildiğinde (ör. “saat kaç” değil de
  “şu url’yi aç” gibi) yapay zekâ güvenli bir eylem üretir. **Riskli eylemler** (komut çalıştırma,
  kayıtsız hedef) önce sorar; **“evet”** deyince uygulanır, **“hayır”** deyince vazgeçilir.

Ekran görüntüsü, URL açma ve komut çalıştırma yalnızca onayla tetiklenir; komut çalıştırma
25 sn zaman aşımı ve 1 MB çıktı sınırıyla çalışır.

---

## Sohbet eylemleri ve sesli okuma

Her asistan yanıtının **altında** üç düğme vardır: **Kopyala**, **Yeniden yaz** ve **Sesli oku**.
Yazma kutusunun üstünde ayrı bir eylem çubuğu ya da ses seçici yoktur; masaüstü asistanında (top)
bu düğmeler görünmez.

- **Sesli oku:** yanıtı okur. Okuma sırasında düğme **Durdur** olur; tekrar basınca susar.
  Otomatik seslendirme kapalı olsa bile çalışır (açık eylem). Uzun yanıtlar 1200 karaktere kadar
  cümle sınırında okunur. Gemini sesi üretilemezse Windows’un sesiyle okunur.
- **Kopyala:** yanıtı panoya kopyalar.
- **Yeniden yaz:** yalnızca son yanıtta bulunur; aynı soruya yeniden yanıt üretir.
- **Ses:** yeni yapay zekâ sesleri **Ayarlar → Sesli asistan sesi** bölümünde seçilir: **Karışık**,
  **Kadın sesler**, **Erkek sesler**. Seçim anında kaydedilir ve yanıt altındaki “Sesli oku” bu sesi kullanır.

---

## Mikrofon ve sesle yazma

**Mikrofon açık:** yazma yerinin solundaki mikrofon düğmesine basıp konuşun; konuşmanız **Gemini ile
konuşurken canlı olarak yazıya çevrilir** (Gemini uygulamasıyla aynı dinleme ve anlama) ve yazma
kutusunda görünür. **Sustuğunuzda metin kendiliğinden gönderilir ve yanıt gelir** — onaylamak için
ikinci kez tıklamanız gerekmez; düğme yalnızca dinlemeyi durdurur. Kayıt düğmeye bastığınızda başlar.

**Ayarlar → Uygulama Ayarları → Mikrofon ve sesle yazma** bölümünden mikrofon seçilir.
Bas-konuş tuşu yoktur: sesle yazma yalnızca mikrofon düğmesiyle açılır ve kapanır.

- **Mikrofon seçimi:** “Mikrofonları yenile” izin ister ve cihazları adlarıyla listeler; seçim hesabın
  ayarlarına yazılır. Cihaz kaybolursa varsayılan mikrofona dönülür.
- **Konuşma düğmeleri:** Yazma yerinin solundaki mikrofon düğmesine basıp konuşun; yazdıklarınız
  konuşurken kutuya yazılır, sustuğunuzda **kendiliğinden gönderilir** ve yanıt gelir. Durdurmak
  için düğmeye tekrar basın (o ana kadar söyledikleriniz yine gönderilir). Topun yazma kutusunda
  da aynı düğme vardır; dinlerken topun çevresinde kırmızı bir nabız halkası görünür. Mikrofon
  düğmeden başka bir yolla (kısayol, bas-konuş) açılmaz.
- **Sürekli dinleme (uygulama ve top):** Dinleme, siz kapatana kadar sürer; her konuşmanız yarıda
  kesilmeden canlı yazıya çevrilir.
  Konuşurken söyledikleriniz **mikrofon kapanmadan canlı olarak yazılır** (yazma kutusunda ya da
  cevap balonunun üstündeki şeritte). Konuşma bittikten sonra **3 saniye** ses gelmezse o konuşma
  yazıya çevrilip **doğrudan yapay zekâya gönderilir**. Cümle sonunda **“bitir”, “ilet” veya
  “gönder”** derseniz 3 saniye beklenmez: canlı metin hemen kapanır ve gönderim başlar. Gönderimden
  sonra yazma alanı kapanır, kırmızı dinleme halkası ve durdurma düğmesi geri gelir; mikrofon
  kapanmaz ve yeni konuşmayı dinlemeye devam eder. Sesli sorunun yanıtı bittikten sonra cevap balonu
  kapanır ve boş dinleme alanı kendiliğinden yeniden açılır (sesli sohbette bekleme yoktur). Yanıt
  balonu açıkken topun köşesindeki kırmızı kare düğme dinlemeyi durdurur. Canlı yazı görünürken
  3 saniyelik sessizlik ya da “bitir/ilet” metni gönderir; dinleme siz kapatana kadar sürer.
- **Asistanla sesli sohbet (Gemini mikrofon modu gibi):** Topun köşesindeki ya da yazma kutusundaki
  mikrofon düğmesine bir kez basın; konuşurken yazıya çevrilir, sustuğunuzda kendiliğinden gönderilir
  ve yanıt **sesli** okunur. Asistan konuşurken mikrofon kendi sesini yazıya çevirmez (bekletilir);
  okuma bitince dinleme kendiliğinden yeniden başlar, böylece kesintisiz sohbet edersiniz. Asistan
  konuşurken siz konuşmaya başlarsanız okuma **hemen kesilir** ve sözünüz dinlenir (barge-in).
- **Yazıya çevirme:** Sesle yazma **her zaman Gemini ile** çalışır: etkin sağlayıcı ne olursa olsun
  hazır bir Gemini anahtarı varsa kayıt 16 kHz mono WAV'a çevrilip Gemini'ye gönderilir (Gemini
  uygulamasıyla aynı dinleme ve anlama). Gemini anahtarı yoksa ve etkin sağlayıcı OpenAI ya da
  Groq ise kayıt doğrudan webm olarak whisper'e gider (`gpt-4o-transcribe` / `whisper-large-v3`;
  hesapta kapalıysa sıradaki model denenir). Türkçe karakterleri ve noktalamayı koruyan bir çeviri
  istemi gönderilir. Diğer sağlayıcılarda anlaşılır bir uyarı gösterilir. Topta canlı yazı için
  konuşma sürerken yaklaşık 1,5 saniyede bir ara çeviri isteği de gönderilir; bunlar yalnızca
  ekranda gösterilir, yapay zekâya gönderilmez.
- **Gizlilik:** Ses dosyası yalnızca yazıya çevrilmek üzere Gemini'ye (yedek olarak OpenAI/Groq'a)
  gönderilir; cihazda saklanmaz. Dinleme siz kapatana kadar sürer; her konuşma parçası ayrı ayrı
  çevrilir ve gönderilir.

---

## Bilgisayar etkinliği

Asistan, **hangi uygulamada ne kadar zaman geçirdiğinizi** bilir: öndeki uygulama, pencerenin
başlığı ve süre son 30 dakika için toplanır. Böylece yalnızca PRIME AI’da ne yaptığınızı sormaz;
Chrome’da bir video mu açtınız, VS Code’da mı çalışıyorsunuz — topun kendiliğinden soruları ve
yanıtları gerçek uygulamadan söz eder. “Ne yapıyorum?” diye sorduğunuzda yanıt da bu özete dayanır;
asistan samimi ve takılan bir dille (“neler yapıyon, ne işler peşindesin lan?” gibi) karşılık verir.

- **Toplananlar:** uygulama adı, pencere başlığı ve boşta kalma süresi. **Tuş ya da tıklama sayısı
  toplanmaz ve söylenmez.** Tuşların **içeriği**, yazdığınız metinler ve ekran görüntüsü hiçbir zaman okunmaz.
- **Saklama ve gönderim:** Özet yalnızca bellekte tutulur, cihazda kaydedilmez. Yanıt üretilirken
  seçtiğiniz yapay zekâ sağlayıcısına bağlam olarak gönderilir.
- **Kapatma:** **Ayarlar → Asistan → Bilgisayar etkinliği** anahtarı kapatılınca toplama hemen durur
  ve özet istemden çıkar.
- **Windows yardımcısı:** `electron/activity.ps1` PowerShell ile çalışır; yalnızca öndeki pencereyi ve
  boşta kalma süresini örnekler. Ayrı bir kurulum ya da yönetici izni gerekmez.

---

## Hesap

Uygulama açılırken bir giriş ekranı gelir; **Hesap oluştur** veya **Giriş yap** seçilir.

Hesaplar **yalnızca bu cihazda** saklanır (şifreler tuzlanmış SHA-256 özeti olarak). Sunucuya hiçbir şey gönderilmez. **Her hesabın sohbetleri ve API anahtarları birbirinden tamamen ayrıdır.** Sol menünün altındaki kullanıcı satırındaki hesap değiştirme ikonundan başka bir hesaba geçilir (şifre sorulur), çıkış yapılır; PRIME AI Ayarları → Hesap bölümünden hesap silinebilir.

Aynı bölümden **profil fotoğrafı** yüklenebilir: seçilen JPG/PNG/WebP görsel cihazda ortadan kırpılıp 256×256 JPEG'e küçültülür (≈8 KB), hesabın kendi ayarlarına yazılır ve kenar çubuğu ile hesap satırında baş harfin yerine görünür. Fotoğraf yalnızca bu cihazda kalır; **Fotoğrafı kaldır** ile silinir.

> Not: Yerel hesap, cihazdaki diğer kişilere karşı gizlilik sağlar; uzaktan erişime karşı korumaz. Aynı bilgisayarı paylaşan kişiler uygulama verilerine erişebilir.

---

## Kamera (beta)

> Kamera bölümü **beta** aşamasındadır; sol menüdeki düğmede ve ayarlarda **BETA** etiketiyle görünür.

### İzin: kamera yalnızca onayla açılır

- Kamera kullanılmadan önce ekranın ortasında **“Kamera kullanılacak. İzin veriyor musunuz?”** sorusu çıkar;
  altında **3 saniyelik geri sayım** işler ve **“İzin ver”** düğmesi durur.
- **“İzin ver”**e basılmazsa (ya da **“Hayır”** / `Esc` / arka plana tıklama seçilirse) soru **3 saniyede kendiliğinden kapanır**
  ve kamera **hiç açılmaz**.
- İzin verilmedikçe **hiçbir kamera işi yapılmaz**: canlı görüntü, yaratıcı kontrolü, kamera yakalama ve yokluk kaydı başlamaz.
- İzin verilince hatırlanır; **Ayarlar → Kamera** sekmesi ancak o zaman görünür. İzinden önce bu sekme **hiç görünmez**.
- İzni geri almak için **Ayarlar → Kamera** üstündeki **“Kamera iznini geri al”** bağlantısı kullanılır:
  kamera kapanır, izleme durur ve kamera bölümü yeniden gizlenir.

Ayarlar → **Kamera** sekmesi üç işi bir arada yapar:

- **Sol menüdeki Kamera düğmesi** (Ayarlar’ın hemen üstünde): küçük canlı önizleme gösterir. Düğmeye tıklayınca kamera **ekranın ortasında büyük** açılır.
- **Büyük görünüm:** solda yapay zekâ sohbeti, sağda büyük kamera görüntüsü. “Bu kişi ne yapıyor?” gibi sorular sorulur; kameradaki son kare görsel modele gönderilir. `Esc`, çarpı veya arka plana tıklama kapatır; “Kamerayı kapat” akışı durdurur.
- **Ayarlar → Kamera** yalnızca ayarları barındırır: kamera aygıtı seçimi/yenileme, yaratıcı belleği (kareyi kaydet veya fotoğraf yükle) ve güvenlik. Canlı görüntü ve sohbet ayarlarda yer almaz.

### Kişi tanıma, “Yaratıcı” etiketi ve yakalamalar

Kamera açıkken tanıma sonucu **sohbetin içinde kart olarak** görünür:

- Kare önce **bulanık** gösterilir; üzerinde dönen bir **yüklenme animasyonu** ve “Tanımlanıyor…” yazar.
- Yaratıcı olup olmadığı **30 saniyede bir** kontrol edilir; her kontrolde karşılaştırma **yalnızca bir kez** yapılır ve her zaman **bellekteki yaratıcı fotoğrafıyla** yapılır. Model yüz şekli, gözler, burun, ağız, çene, saç çizgisi, ten, sakal ve gözlük gibi ayırt edici hatlara ayrıntılı bakar; kararsız kaldığında “tanınmadı” der.
- Sonuç gelince bulanıklık ve animasyon kalkar. **Eşleşince sohbette kameradan alınan kare değil, bellekte duran onaylı yaratıcı fotoğrafı yeşil ışıkla** gösterilir ve rozet **“YARATICI”** olur. Tanınmayan kişide canlı kare **kırmızı ışıklı** çerçeveye geçer.
- **Büyük kamera görünümünde** eşleşen kişi için alt köşede yeşil **“Yaratıcı”** etiketi çıkar; başlık altı **“Kamerası açık · Yaratıcı”** olur. Tanınmayan kişide etiket kırmızı **“Tanınmayan kişi”** olur.
- Eşleşme başladığında sohbete bir kez **“Yaratıcı kamerada.”** yazılır. Kamera sohbetinde yapay zekâya “kameradaki kişi yaratıcıdır” bilgisi verilir; bu kişiden bahsederken ona **“Yaratıcı”** der, “kişi/biri” demez. Tanınmayan kişide ise “tanınmayan kişi” ifadesini kullanır.
- Kırmızı kart göründükten **yaklaşık 1 saniye sonra** geri sayım/uyarı başlar; böylece önce kim olduğu görülür.
- Karede **insan yoksa** kart kaldırılır ve görüntü saklanmaz.

### Kamera yakalama

- Kamera bir insan gördüğünde kare yakalanır; yaratıcı kontrolü **30 saniyede bir** yapıldığı için aynı kişi için de en çok bu aralıkla yeni yakalama alınır. İnsan yokken buraya fotoğraf eklenmez.
- **Aynı görünen kareler tekrarlanmaz:** her yeni kare son 8 kayıtla görsel olarak karşılaştırılır; benzer çıkarsa listeye ve klasöre yazılmaz. Yalnızca gerçekten değişen kareler saklanır.
- **Boşta kapatma:** kimse görülmezse ve görüntü değişmezse kamera **10 dakika** sonra kendiliğinden kapanır (Güvenlik → “Boşta kamerayı kapat”; 0 = hiç kapanmasın).
- Yakalamalar **Ayarlar → Kamera → Kamera yakalama** bölümünde tarih ve saatle listelenir (en fazla **36**). Yeşil çerçeve yaratıcıyı, kırmızı çerçeve tanınmayan kişiyi gösterir.
- Başlığa veya **“Tümünü gör”** düğmesine tıklayınca **bütün yakalamalar** tek görüntüleyicide açılır; oklar/klavye ile gezilir.
- Her yakalama ayrıca bilgisayarda **Resimler → PRIME AI → Kamera Yakalamalari** klasörüne JPEG olarak yazılır. **“Klasörü aç”** bu klasörü açar; görseller oradan kopyalanabilir. “Görüntüleri temizle” yalnızca uygulamadaki listeyi boşaltır, klasördeki dosyaları silmez.

### Yokluk

- **Ayarlar → Kamera → Yokluk** bölümü, kamerada **insan olmayan** zamanları gösterir.
- Böyle bir kare en fazla **1 dakikada bir** alınır ve tarih/saat ile listelenir (en fazla 36 kayıt). Aynı görünen boş oda kareleri tekrar yazılmaz.
- **İnsan görüldüğünde yokluk kaydı alınmaz**; insan kareleri yalnızca “Kamera yakalama” bölümüne gider.
- “Tümünü gör” bütün yokluk kayıtlarını birlikte açar. Kayıtlar **Resimler → PRIME AI → Yokluk** klasörüne de JPEG olarak yazılır; “Klasörü aç” ile ulaşılır.

### Güvenlik uyarısı

**Tanınmayan kişide kırmızı uyarı** açıkken kamera **30 saniyede bir** kontrol edilir: yeni kare, bellekteki yaratıcı fotoğrafıyla görsel model üzerinden karşılaştırılır. Eşleşme yoksa **ekranın çevresi kırmızı yanıp söner**, “**Sen şüpelisin!**” yazar ve geri sayım başlar. Geri sayım (varsayılan **5 saniye**) bitince uygulama kendini kapatır. Karşılaştırma için **görsel destekli bir model** gerekir; ağ/anahtar hatasında uyarı verilmez.

### Açılış

Uygulama açılırken **kamera veya şifre sorulmaz**; doğrudan sohbet ekranı gelir. Kamera görünümü, yaratıcı belleği ve güvenlik uyarısı çalışmaya devam eder.

---

## Üç ayar bölümü

Ayarlar penceresi üç sekmeye ayrıldı:

### 🔑 API Yeri

Kullandığınız sağlayıcıların anahtarları burada yönetilir.

**Kota bitince otomatik geçiş:** etkin anahtar “kota bitti / 429 / limit” hatası verirse uygulama o kaydı
24 saat kenara alır, **sıradaki hazır ve kullanılmamış anahtara kendiliğinden geçer** ve aynı soruyu hiç metin
akmadan yeni anahtarla yeniden dener. Hangi kayda geçildiği bildirim ve günlükte yazar; API kartında
**kota bitti** etiketi görünür. Anahtarı yeniden kaydetmek ya da “Bu API'yi kullan” demek işareti kaldırır.
Metin akmaya başladıktan sonra kota biterse yazı çiftlenmesin diye istek yeniden denenmez, yalnızca
sıradaki sohbet için diğer anahtar etkinleşir.

- **Her API ayrı bir kayıttır (kutu).** Aynı yapay zekadan istediğiniz kadar API ekleyebilirsiniz
  (örn. iki farklı Groq anahtarı veya aynı sağlayıcıda farklı modeller).
- Kutular hazır/eksik durumunu, model adını ve hangi kaydın **AKTİF** olduğunu gösterir.
- **Her kutunun sağ üst köşesinde bir çöp kutusu vardır**: o kaydı tek dokunuşta kaldırır. Kutuya
  dokunmak kaydı düzenletir; çöp kutusuna dokunmak yalnızca siler (form açılmaz).
- Listenin sonunda her zaman bir **＋ Yeni API** kutucuğu vardır: bir API ekledikten sonra yeniden görünür,
  böylece aynı yapay zekadan arka arkaya kayıt eklenebilir. **Anahtar ekleme yalnızca buradan yapılır**
  (eskiden sağ üstte duran kırmızı “Anahtar ekle” düğmesi kaldırıldı).
- **Anahtarı yapıştırmanız yeterli:** uygulama anahtarın biçiminden sağlayıcıyı tanır (örn. `AIza…` → Google
  Gemini, `gsk_…` → Groq, `sk-ant-…` → Anthropic), sağlayıcıyı **kendiliğinden seçer** ve model listesini
  otomatik getirip en uygun modeli seçer.
- **Bu API'yi kullan** kaydı etkinleştirir; **Bu anahtarı sil** (formun içinde) ya da kutunun
  köşesindeki **çöp kutusu** kaydı kaldırır. Son kayıt da silinebilir: “Yeni API” kutucuğu yerinde kalır.
- **Adres (base URL) sorulmaz** — her sağlayıcının adresi tanımlıdır.
- **modelleri getir** düğmesi sağlayıcıdan canlı model listesini çeker ve en uygun modeli otomatik seçer.
- **Ortak model:** API kutularının altındaki seçici, kayıtlı bütün anahtarların modellerini sağlayıcıya göre
  gruplayarak listeler. Bir model seçtiğinizde **aynı sağlayıcıdaki bütün API kayıtları** o modeli kullanır ve
  seçilen kayıt etkin olur; böylece bütün sohbetler aynı modelle çalışır. Farklı sağlayıcıların model adları
  farklı olduğu için seçim yalnızca o sağlayıcının kayıtlarına uygulanır. **Tüm modelleri getir** düğmesi her
  kayıtlı anahtarın eksiksiz model listesini çeker, var olanları silmeden birleştirir; sohbet dışı modeller de
  (embedding, ses, görsel) listede görünür.
- **Google Görseller (isteğe bağlı):** Google'ın resmi görsel aramasını bağlamak için API anahtarı +
  arama motoru kimliği (cx) girilir. Boş bırakılırsa anahtarsız kaynaklarla arama yapılır.

### ⚙️ PRIME AI Ayarları

- **Dil:** Türkçe · English — arayüz ve yapay zekânın yanıt dili birlikte değişir.
- **Tema:** Siyah · Beyaz · Sistem
- **Geçişli renkler:** Alev, Gün batımı, Okyanus, Orman, Mor, Altın, Buz
- **Sohbet davranışı:** sistem talimatı, yaratıcılık, maksimum yanıt uzunluğu
- **Ek özellikler:** emoji kullanımı, fotoğraf gösterme, video ile anlatma (video her zaman
  uygulamanın içinde oynar; isteyen oynatıcı çubuğundan *Tarayıcıda aç* bağlantısını kullanır)
- **Hesap:** aktif kullanıcı ve hesap silme

### 🎥 Kamera

- Kamera aygıtı seçimi ve yaratıcı belleği (izin verildikten sonra görünür)
- Sol menüdeki kamera düğmesi: küçük canlı önizleme, tıklayınca ortada büyük görünüm (solda sohbet)
- Tanınmayan kişide kırmızı uyarı, geri sayım ve otomatik kapatma
- **“Kamerayı kapat”** düğmesi: kamera açıkken ayarlardan görünür; akışı ve izlemeyi durdurur (izin
  yerinde kalır). Yeniden açmak için sol menüdeki **Kamera** düğmesine basılır.

### 🟣 Asistan (uyku ve yüz)

- **Asistanın uykusu:** uyusun/upmasın; ne kadar sık uyusun (dakika) ve bir uykunun ne kadar
  sürsün (saniye) ayarlanır. Değişiklikler hemen kaydedilir; top bir sonraki açılışında uygular.
- **Yüz tasarla:** göz boyutu, göz aralığı, göz rengi, ağız genişliği, ağız kavisi, ağız rengi ve
  yuvarlak ağız seçenekleriyle canlı önizlemeli yüz tasarlanır; isim verilip **“Yüzümü kaydet”**
  denince kaydedilir ve hemen kullanılmaya başlanır.
- **Ekstra yüzler:** hazır yüzler (Varsayılan, Mutlu, Uykucu, Şaşkın, Kurnaz, Robot) ve kaydettiğiniz
  özel yüzler listeden seçilir; karttaki çöp kutusuyla silinir (en fazla 24 özel yüz saklanır).
- **Aksesuarlar:** yok, gözlük, kovboy şapkası, şapka, siyah gözlük, kral tacı ve ağız maskesi.
  Seçilen aksesuar topun yüzüne takılır; top menüsündeki seçimle ortaktır.
- **Sesli asistan sesi:** yanıtları seslendir (aç/kapa). Önce **ElevenLabs API anahtarı** alanına
  kendi anahtarınızı girin; sesler doğrudan ElevenLabs’ten alınır (model: Flash v2.5 ya da
  Multilingual v2; “Sesleri getir” ile hesabınızdaki sesler listelenir). Anahtar yoksa listeden
  **AI sesler** (Gemini) tınısı seçilir: karışık modlar, **10 kadın** ve **12 erkek** yeni Gemini sesi
  (Gemini anahtarıyla çalışır). Karışık modlarda her yanıt başka sesle okunur. Sistem sesi motoru ve ton/hız
  kaydırıcıları kaldırıldı. Ayar anında kaydedilir; “Sesi dene” seçili tınıyı hemen okur; otomatik
  seslendirme cümle sınırında kısaltılır. Okuma sırasında yeni bir yanıt gelirse önceki okuma kesilir.
  Aynı seçim sohbetin altındaki **Ses** düğmesinden de yapılabilir.

**Uygulama Ayarları → Klavye sesi** bölümünden yazma sesi açılıp kapanır ve düzeyi %0–%100 arasında ayarlanır; **Sesi dinle** düğmesi seçili düzeyde bir örnek çalar. Kapatıldığında hiçbir tuş sesi duyulmaz. Ayar hesaba kaydedilir.

**Uygulama Ayarları → Nasıl yazsın? → Kısa yanıtlar** varsayılan olarak açıktır: yapay zekâ uzun giriş, tekrar ve gereksiz özet yazmadan doğrudan birkaç cümleyle yanıtlar, yanıt bu yüzden daha çabuk biter. Ayrıntı, adım adım anlatım ya da uzun kod istediğinizde yine gerektiği kadar uzun yazar. Anahtar kapatılırsa eski uzun yanıtlar geri gelir; seçim hesaba kaydedilir.

Tema bu bölümdeki **Siyah · Beyaz · Sistem** seçiminden değişir; üst çubukta ayrı bir tema düğmesi yoktur (sağ üstte yalnızca konsol düğmesi durur). Seçilen renk geçişi gönder düğmesinde, başlıkta, kenar çubuğu vurgusunda ve logodaki "AI" yazısında kullanılır. Tema ve renk, sayfa açılırken titreme olmadan uygulanır.

---

## Dil: Türkçe · English · Deutsch · Русский · 日本語

**Uygulama Ayarları → Dil** bölümünden tek dokunuşla değişir. Seçim cihazda saklanır.

- **Arayüz dili:** kenar çubuğu, üst çubuk, karşılama ekranı, yazı kutusu, ayarların tamamı,
  hakkında penceresi, konsol başlıkları, video kartı ve fotoğraf görüntüleyici çevrilir.
- **Yapay zekânın yanıt dili:** seçilen dil sistem istemine eklenir; kullanıcı açıkça başka bir dil
  istemedikçe model o dilde yanıt verir (Türkçe seçiliyken Türkçe, English seçiliyken İngilizce).
- **Video arama dili:** seçilen dil YouTube arayüz dilini belirler, ama **video dili zorunlu değildir** —
  Türkçe soruya İngilizce anlatım, İngilizce soruya Türkçe anlatım gelebilir. Doğru ve öğretici video
  hangi dildeyse o seçilir.
- **Çevrilmeyenler:** kullanıcı sohbet başlıkları/mesajları ve modelin yanıtı (onlar sizin içeriğiniz),
  ayrıca tanılama amaçlı **konsol günlük satırları** Türkçe kalır; seviye etiketleri (INFO/WARN/ERROR)
  seçilen dile uyar.

---

## Desteklenen sağlayıcılar (13)

| Sağlayıcı | API türü | Not |
|---|---|---|
| **Google Gemini** | Kendi API'si | Ücretsiz katman |
| **Anthropic (Claude)** | Messages API | Tarayıcı erişim başlığı otomatik |
| **OpenAI** | OpenAI uyumlu | |
| **Groq** | OpenAI uyumlu | Ücretsiz katman |
| **OpenRouter** | OpenAI uyumlu | Ücretsiz: `openrouter/free` |
| **Mistral AI** | OpenAI uyumlu | |
| **DeepSeek** | OpenAI uyumlu | |
| **xAI (Grok)** | OpenAI uyumlu | |
| **Together AI** | OpenAI uyumlu | |
| **Perplexity** | OpenAI uyumlu | |
| **Cerebras** | OpenAI uyumlu | Çok hızlı |
| **Fireworks AI** | OpenAI uyumlu | |
| **Ollama** | OpenAI uyumlu | **Yerel**, anahtar gerekmez |

Anahtar sayfaları uygulamada, her sağlayıcının altında bağlantı olarak gösterilir.

### Yerel model (Ollama)

```bash
ollama serve
ollama pull llama3.2
```

Sonra API Yeri → **Ollama** → *modelleri getir*. Tarayıcıdan erişim için `OLLAMA_ORIGINS` ayarı gerekebilir.

---

## Fotoğraf gösterme ve görüntüleyici

Sohbette fotoğraf/resim istendiğinde (örn. *"bana kırmızı pandanın fotoğrafını göster"*) uygulama:

1. İsteği algılar ve arama sözcüğünü çıkarır (Türkçe çekim eklerini temizler: *"pandanın" → "panda"*).
2. Sırayla **Google Görseller** (ayarlardan bağlandıysa) → **Wikimedia Commons** → **Openverse** kaynaklarını dener.
   Anahtarsız kaynaklar her zaman çalışır.
3. Bulunan fotoğrafları sohbetin içinde, yanıt metninin üstünde ızgara halinde gösterir.
4. Bulunan görselleri modele bildirir; model fotoğrafları kısaca tanıtır.

### Görüntüleyici (lightbox)

Sohbetteki bir fotoğrafa tıklayınca açılır:

- **Arka plan bulanıklaşır**, seçilen fotoğraf ekranın ortasında **net** (tam çözünürlükte) durur.
- **Zoom:** fare tekerleği veya `+` / `−` düğmeleri; **çift tıklama** yakınlaştırır. Yakınlaştırma
  imlecin altındaki noktayı sabit tutar.
- **Gezinme:** fotoğrafı fareyle (veya parmakla) sürükleyin — her yöne, çaprazlar dahil.
  Ekrana sığmıyorsa kenarlara kadar kaydırılabilir.
- **⟲** sıfırlar, **← →** fotoğraflar arasında gezer, **Kaynak** görselin bulunduğu sayfayı açar, `Esc` kapatır.

*"kendi fotoğrafını göster"* denildiğinde PRIME AI logosu gösterilir. Görsel arama PRIME AI Ayarları'ndan kapatılabilir.

## Emoji

Asistanın **kendi yazdığı metinde emoji yok**: model emoji üretse bile yazıya yazılmadan önce
temizlenir (sohbette ve topta). Emoji yalnızca **sizin** mesajlarınızda kalır — yazı alanının
yanındaki 🙂 düğmesiyle 70 emojilik panelden imlecin olduğu yere emoji eklenebilir. Eski
“Emoji kullansın” ayarı kaldırıldı.

---

## Konu yazılır, gerisi kendiliğinden

Konuyu **tıklayarak seçmeniz gerekmez**: ne yazarsanız PRIME AI konuyu oradan anlar ve o konuyla devam eder.
Açılıştaki hazır öneri kutucukları bu yüzden kaldırıldı; sohbet yazdığınız metinden ilerler.

Yeni sohbet ekranındaki **PRIME AI logosuna tıklayınca** logo titrer, hafifçe kızarır ve arkasından
duman çıkar. Duman taneleri her tıklamada yeniden üretilir ve animasyon bitince silinir;
hiçbir dosya yazılmaz, ağa istek gitmez. Sadece bir dokunuş sürprizi.

## Yardım isteyince gerçek video

Bir konuda yardım istediğinizde (*"Python ile dosya okumayı nasıl yaparım?"*, *"React öğrenmek istiyorum"*,
*"bana yılan oyunu yap"*) PRIME AI yanıtın altına **o konuyla ilgili gerçek bir video** koyar — arama sayfası değil:

1. **Metin önce yazılır**, video kartı altında belirir.
2. Konu, yazdıklarınızdan ayıklanır: soru/yardım sözcükleri (*nasıl, nereden, anlat, video at…*) ve
   Türkçe çekim ekleri temizlenir (*"okumayı" → "okuma"*).
3. Video **ana sürece** (Electron) sorulur: YouTube'da arama yapılır, sonuçlar puanlanır ve
   **en güvenilir/en uygun olan** seçilir. Anahtar gerekmez.
4. Seçilen video **oynatılabilir mi diye doğrulanır** (oEmbed), sonra kart gösterilir:
   **kapak fotoğrafı (thumbnail), başlık, kanal, süre, izlenme** ve *Videoyu aç ↗* düğmesi.
5. Karta dokununca video **uygulamanın içinde** oynar (gömülü oynatıcı + *Tarayıcıda aç* bağlantısı);
   nerede açılacağını soran ayar kaldırıldı.
   Oynatıcı, **yalnızca 127.0.0.1'e bağlı küçük bir yerel sayfa** üzerinden çalışır: YouTube `app://`
   adresinden gömülen videoları reddettiği için ("Hata 153") oynatma sayfası geçerli bir http kaynağı sağlar;
   bu sayfa tek bir oynatıcı döndürür, dosya sistemine erişemez ve video kimliği doğrulanır.
6. Kart sohbete kaydedilir; uygulamayı kapatıp açsanız da yerinde durur.

**Puanlamada neler önemli:** başlıkta konu sözcükleri, doğrulanmış kanal, eğitim/rehber kanalı olması,
90 sn – 25 dk arası anlatım süresi, izlenme sayısı ve tazelik. Bağıran-başlık, emoji dolu, şaka/magazin
veya Shorts tipi videolar elenir; süresiz (canlı) yayınlar alınmaz. **Sızıntı/klik tuzağı** başlıklar
(*leak, gizli kod, ifşa, bedava kod…*) ağır ceza alır.

**Dil artık zorunlu değil:** eskiden Türkçe sorularda yabancı dildeki videolar cezalandırılıyordu; bu kaldırıldı.
Arayüz diliyle aynı dildeki başlık yalnızca **+3 küçük bonus** alır, farklı dildeki video **ceza almaz**.
Böylece Türkçe bir soruya en iyi anlatım İngilizceyse o gelir (ör. *Corey Schafer — Python CSV*), İngilizce
soruya Türkçe bir anlatım da gelebilir.

Kartın başlığı hep aynı samimi tondadır: **“Al sana yardım ediyom 😎 · bu videoya bak”** (İngilizce arayüzde
*“Here’s a hand 😎 · check this video”*). Bu özellik **Uygulama Ayarları → Ek özellikler → Video ile anlatsın**
ile kapatılabilir.

> Tarayıcıda çalıştırıldığında gerçek video seçimi yalnızca bir Google anahtarı girilmişse yapılabilir;
> video arama ana sürece bağlıdır (masaüstü uygulaması).

## Bir şey çalışmıyorsa: “video ile mi, yazıyla mı?”

*"uygulamam açılmıyor"*, *"kod hata veriyor"*, *"çalışmıyor"* gibi bir şey yazdığınızda PRIME AI
konuyu anlar, olası nedeni kısaca söyler ve **sorusunu yazarak sorar**:

> “İstersen bu konuda bir video bulup atayım, istersen adım adım ben anlatayım — hangisi olsun?”

Ekranda **düğme yoktur**; cevabı siz yazarsınız:

- **“video at”**, *“video bul”*, *“video gönder”*, *“video ile anlat”* → o konuda gerçek bir video bulunur
  ve metnin altına kart olarak eklenir.
- **“anlat”**, *“sen anlat”*, *“yazıyla anlat”*, *“sadece anlat”* → video eklenmez; adım adım, anlaşılır
  bir yazıyla anlatılır.

Seçim yaptığınızda konu **önceki mesajdan** alınır, konuyu yeniden yazmanız gerekmez. Yanlışlıkla seçim
gibi görünen bir cümle yazmaktan korkmayın: seçimler yalnızca kısa mesajlarda aranır.

---

## Görsel ekleme: fotoğrafı göster, ne olduğunu söylesin

Sohbete fotoğraf ekleyebilirsiniz — diğer yapay zekâlardaki gibi:

- **Ekleme yolları:** yazı kutusunun solundaki **görsel düğmesi**, panodan **Ctrl+V** ile yapıştırma ya da
  pencereye **sürükleyip bırakma**. Bir mesajda en çok **3 görsel** eklenebilir; şeritteki **×** ile vazgeçilir.
- Görsel gönderilmeden önce **uzun kenarı 1024 px** olacak şekilde küçültülür (saydam PNG korunur, gerekirse
  JPEG'e çevrilir). Böylece istek hızlı gider ve cihazda az yer kaplar.
- Gönderilen görsel mesaj balonunda **küçük resim** olarak durur; tıklayınca tam ekran büyütülür.
- Yapay zekâ görseli **gerçekten inceler**: nesnenin/ürünün/bitkinin adını, ne işe yaradığını ve ayırt edici
  özelliklerini söyler; ekran görüntüsündeki yazıyı veya hata satırını okur. Emin olmadığı yerde bunun bir
  tahmin olduğunu belirtir, okuyamadığı marka/model numarasını **uydurmaz**. Görsel bulanıksa hangi açıdan yeni
  bir fotoğraf gerektiğini söyler.
- Soru yazmanız şart değil: yalnızca fotoğrafı gönderirseniz ne olduğunu anlatır ve nasıl yardımcı
  olabileceğini sorar. "bu ne?", "bu hatayı nasıl çözerim?" gibi bir soru yazarsanız doğrudan ona cevap verir.
- Görsel **görsel destekleyen bir model** ister. Seçili model desteklemiyorsa istek reddedilir ve uygulama
  ne yapılacağını yazar (ör. Gemini flash, GPT-4o mini, Llama 4).
- Her sağlayıcıya kendi beklediği biçimde gönderilir: **Gemini** `inline_data`, **OpenAI uyumlu** sağlayıcılar
  `image_url` (data URL), **Anthropic** `image` + base64.
- **Yeniden dene** görseli de yeniden gönderir; görseller sohbetle birlikte yerel olarak saklanır.

> Görseller sohbetle aynı yerde, yalnızca bu cihazda tutulur. Depolama dolarsa uygulama uyarır; eski
> sohbetleri silmek yeri boşaltır.

---

## Diğer özellikler

- **Görsel ile soru sorma:** fotoğraf ekle (düğme · yapıştırma · sürükle-bırak), yapay zekâ görseldeki
  şeyi tanısın, yazıyı okusun, sorunu anlatsın.
- **Yazma animasyonu (klasik ama PRIME AI'ya özel):** sade bir üç nokta — ama noktalar tek renk değil,
  uygulamanın kendi geçişli rengini taşır ve soldan sağa doğru sırayla yükselip parlar. Abartısız,
  küçük ve tamamen CSS (resim/gif yok), tema rengini alır. Yanıt yazılırken metnin üstünde durur,
  yanıt bitince bulanıklaşıp kaybolur.
- **Hızlı yanıt:** eskiden video araması için 1,2 sn, görsel araması için 0,9 sn bekleniyordu; bu beklemeler
  kaldırıldı. Video/görsel aramaları **yanıtı hiç bekletmez** — ilk kelime hemen akar, kart sonra dolar.
- **Dil:** Türkçe / English — arayüz, ayarlar ve yapay zekânın yanıt dili birlikte değişir.
- **Video uygulamanın içinde:** karta dokununca gömülü oynatıcı açılır (kapak fotoğrafı, başlık, kanal, süre
  kartta durur); tarayıcıda açmak isteyen oynatıcı çubuğundaki *Tarayıcıda aç* bağlantısını kullanır.
- **Ayarlar soldan açılır** (ortada değil) ve sade dille yazılır: *Yapay Zekâ Anahtarı* ve *Uygulama Ayarları*.
- **Yalnızca sohbet:** PRIME AI bilgisayarınıza dosya yazmaz; dosya sistemi köprüsü hiç açılmaz.
- **Birden çok API** — aynı sağlayıcıdan istediğiniz kadar; aralarında tek tıkla geçiş.
- **Anahtardan otomatik sağlayıcı + model seçimi.**
- **Akışlı yanıtlar** (SSE) — yanıt ortasında durdurulabilir.
- **Markdown** — başlık, liste, tablo, alıntı, bağlantı, satır içi kod, kopyalanabilir kod blokları.
- **Sohbet geçmişi** — hesaba bağlı, başlıklandırılır ve silinebilir.
- **Yeniden dene** — son yanıtı, kullanıcı mesajını çoğaltmadan yeniden üretir.
- Klavye kısayolları: `Ctrl/Cmd+K` yeni sohbet, `Ctrl/Cmd+,` ayarlar, `Esc` kapat.

## Güvenlik

- **Content-Security-Policy** tanımlı; satır içi script çalıştırılmaz.
- Electron'da `contextIsolation` açık, `nodeIntegration` kapalı; sayfa `app://` özel şemasından yüklenir ve dizin dışına çıkış engellenir.
- Renderer'a açılan köprü **sürüm/platform bilgisi, video arama, masaüstü topu, Erişim komutları ve mikrofon** taşır. Erişim tarafında dosya seçimi yalnızca işletim sisteminin kendi seçicisiyle yapılır; renderer dosya okuyup yazamaz. Açma/kapatma isteği uygulama tarafından yalnızca Erişim listesindeki yollar için gönderilir; kapatma, yolu birebir eşleşen süreçlerle sınırlıdır.
- Mikrofon izni yalnızca `app://` sayfalarına verilir; ses kaydı sadece mikrofon düğmesine basıldığında açılır. Uygulama kutusunda yazıya çevrilince kapanır; topta siz kapatana kadar açık kalır (3 saniyelik sessizlik ya da “bitir/ilet” yalnızca metni gönderir).
- Dış bağlantılar uygulama içinde değil, sistem tarayıcısında açılır.
- Anahtarlar yalnızca yerel depolamada tutulur; arada bir sunucu yoktur.

## Gizlilik

API anahtarları ve sohbetler yalnızca bu cihazda, hesabınıza bağlı olarak saklanır ve istekler doğrudan sağlayıcıya gönderilir. Ortak kullanılan bir bilgisayarda çıkış yapın veya anahtarları silin.

**Kamera:** yaratıcı fotoğrafı, şifre fotoğrafı ve kamera şifresi yalnızca bu cihazda saklanır. Yüz karşılaştırması ve kamera sohbeti için alınan kareler, seçtiğiniz yapay zekâ sağlayıcısına gönderilir; başka bir yere iletilmez. Kamerayı kapattığınızda görüntü akışı ve izleme durur.

## Dosyalar

| Dosya | Görev |
|---|---|
| `index.html` | Arayüz iskeleti, giriş ekranı, ayarlar |
| `styles.css` | Temalar, geçişli renkler, düzen, açılış ve yazma animasyonları, konsol çekmecesi |
| `theme-boot.js` | İlk boyamadan önce tema uygulama |
| `i18n.js` | Türkçe · İngilizce · Almanca · Rusça · Japonca arayüz sözlüğü (dil değiştirme) |
| `app.js` | Hesaplar, sağlayıcılar, akış, markdown, görsel ekleme/arama, konsol, topa yanıt verme, sesle yazma |
| `ball.html` | Masaüstü topunun saydam penceresi: baloncuk, menü, top |
| `ball.css` | Topun 9 rengi, düşünme halkası, güler yüz, yatak ve yorgan, yatma/uyanma animasyonları, uyku zzz animasyonu, baloncuk/menü görünümü |
| `ball.js` | Top davranışı: yazma, renk, sürükleme, titreme, mikrofon, dinlemeyi durdurma, 6–8 dakikalık yorulma ve 1 dakikalık uyku turu, yanıt akışı |
| `electron/main.js` | Masaüstü ana süreç, `app://` şeması, pencere, video arama, top, Erişim, aksesuar, sesli asistan ve yedek Windows sesi köprüsü |
| `electron/preload.js` | Açılan köprü: sürüm/platform, video arama, top, Erişim, mikrofon ve tepsideki hesap adı (dosya sistemi yok) |
| `electron/youtube.js` | YouTube'da arama, sonuçları puanlama ve oynatılabilirliği doğrulama |
| `scripts/make-icon.js` | Logodan yuvarlak uygulama ikonu (köşeleri şeffaf, masaüstünde daire gibi görünür) |
| `scripts/kisayol-tusu.ps1` | Başlat menüsüne **Ctrl + Alt + P** tuşlu **PRIME AI (klasör)** kısayolu koyar/kaldırır |
| `scripts/smoke.js` | Görünmez pencerede uçtan uca duman testi (animasyon, kaldırma tuşu, video kartı, konsol, ayarlar) |
| `assets/typing/` | Referans kayıttan kesilmiş 21 tuş vuruşu (yazma sesi) |
| `assets/logo.svg` | Logo ve favicon |
| `assets/logo.png` | Orijinal logo dosyası |
