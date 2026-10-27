# PRIME AI Mobil — Android kabuğu

`prime-ai-mobil/` içindeki web uygulamasını tam ekran bir WebView'de çalıştıran
ince bir Android kabuğu. Uygulama internete ihtiyaç duymaz (API çağrıları
hariç): dosyalar APK'nın içindedir.

## Nasıl çalışır

- `MainActivity`, istekleri `https://appassets.androidplatform.net/` adresinden
  karşılar ve `assets/www/` altındaki dosyaları döndürür. Adres `https` olduğu
  için `localStorage` ve service worker normal bir sitedeki gibi çalışır.
- Dış bağlantılar (GitHub, AI Studio…) telefonda tarayıcıda açılır.
- Android geri tuşu açık paneli/sayfayı kapatır (`window.__primeBack`), hiçbir
  şey açık değilse uygulamadan çıkar.
- `PrimeAndroid.setDark(...)` ile durum çubuğu seçili temaya uyar; görsel
  seçici (`onShowFileChooser`) sohbetin görsel ekleme düğmesine bağlıdır.

## Gerekenler

- JDK 17 veya üstü (JDK 21 ile derlendi)
- Android SDK: `platforms;android-35`, `build-tools;35.0.0`, `platform-tools`
- Gradle 8.7 (AGP 8.5.2)

## Derleme

```bash
node scripts/mobil-assets.js          # prime-ai-mobil → assets/www
cd android
gradle :app:assembleDebug             # veya Android Studio ile aç
# çıktı: app/build/outputs/apk/debug/app-debug.apk
```

`android/local.properties` içinde `sdk.dir` SDK klasörünü göstermelidir (bu
dosya repoya eklenmez).

> **Windows uyarısı:** Android eklentisi proje yolunda Türkçe karakter
> kabul etmez. Proje yolu `Doğukan` gibi karakterler içeriyorsa derlemeyi kısa
> yol veya `subst` ile yapın:
>
> ```cmd
> subst P: C:\Users\DOUKAN~1\Desktop\primeAI
> cd /d P:\android
> gradle :app:assembleDebug
> ```
>
> SDK klasörü de Türkçe karakterli bir yolun altındaysa onu da bir sürücü
> harfine bağlayıp `local.properties` içine yazın:
>
> ```cmd
> subst S: C:\Users\DOUKAN~1\Desktop\primeAI\.tools\android-sdk
> ```
>
> ```properties
> sdk.dir=S:/android-sdk
> ```

APK, makinedeki **Android debug anahtarıyla** imzalanır. Aynı telefona yeni
sürüm yüklerken aynı anahtar gerekir; başka bir bilgisayarda üretilen APK'yı
yüklemek için önce uygulamayı kaldırmanız gerekir.

## Sürüm bilgisi

`app/build.gradle` içindeki `versionCode` ve `versionName` alanları; sürüm
artırırken ikisini birlikte güncelleyin.
