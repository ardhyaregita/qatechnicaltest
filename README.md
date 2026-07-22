# Cara Menggunakan Automation Test Ini

Automation test sederhana pakai **Playwright**, dibuat berdasarkan poin-poin
Pengajuan Solusi pada Studi Kasus 1 (price mismatch & double booking).

Test ini **tidak butuh aplikasi/API sungguhan** — datanya sudah ditulis
langsung di dalam file test (sama seperti tabel di soal), jadi bisa
langsung dijalankan tanpa setup tambahan.

---

## 1. Isi Folder & Pemetaan ke Poin Solusi

```
.
├── tests/
│   ├── booking-validation.spec.js      # Poin b & e -> BISA dijalankan
│   ├── concurrency-simulation.spec.js  # Poin c      -> BISA dijalankan
│   └── ui-regression.template.js       # Poin a & d  -> contoh saja, TIDAK bisa dijalankan
├── playwright.config.js
└── package.json
```

| Poin Solusi | File | Status |
|---|---|---|
| a. Dropdown + price otomatis dari master | `ui-regression.template.js` | Butuh aplikasi/UI asli, lihat catatan di bagian 6 |
| b. Backend tolak double booking, siapapun usernya | `booking-validation.spec.js` (TC-03, TC-04) | ✅ Bisa dijalankan sekarang |
| c. Concurrency test (banyak request bersamaan) | `concurrency-simulation.spec.js` (TC-05, TC-06) | ✅ Bisa dijalankan sekarang (simulasi) |
| d. Regression UI vs data master | `ui-regression.template.js` | Butuh aplikasi/UI asli, lihat catatan di bagian 6 |
| e. Audit berkala data existing di production | `booking-validation.spec.js` (TC-01, TC-02) | ✅ Bisa dijalankan sekarang, tinggal dijadwalkan (lihat bagian 7) |

---

## 2. Yang Perlu Disiapkan

- Node.js sudah terinstall di komputer (cek dengan mengetik `node -v` di terminal).

## 3. Cara Install (dilakukan sekali di awal)

```bash
npm install
```

## 4. Cara Menjalankan Test

```bash
npx playwright test
```

## 5. Cara Membaca Hasilnya

Akan muncul 6 hasil test:

| Test | File | Hasil | Kenapa |
|---|---|---|---|
| TC-01: price booking sesuai master | booking-validation | ❌ **FAIL** (disengaja) | Booking id 1001 di soal memang salah harga — bukti audit berhasil mendeteksi. |
| TC-02: tidak ada double booking | booking-validation | ❌ **FAIL** (disengaja) | Booking id 1001 & 1005 di soal memang double booking. |
| TC-03: price booking baru otomatis dari master | booking-validation | ✅ PASS | Membuktikan logic poin a berjalan benar. |
| TC-04: booking baru pada slot terisi ditolak, walau user beda | booking-validation | ✅ PASS | Membuktikan logic poin b berjalan benar. |
| TC-05: tanpa locking, banyak request bisa sama-sama lolos | concurrency-simulation | ✅ PASS | Sengaja membuktikan masalahnya nyata (nunjukin kenapa poin c dibutuhkan). |
| TC-06: dengan locking, cuma 1 dari banyak request yang berhasil | concurrency-simulation | ✅ PASS | Membuktikan solusi poin c (locking/antrian) berhasil mencegah race condition. |

**Hasil normal yang diharapkan: 2 FAIL (TC-01, TC-02), 4 PASS lainnya.**
2 FAIL itu bukan error, melainkan bukti automation berhasil menangkap
kedua bug yang dilaporkan di studi kasus.

## 6. Tentang `ui-regression.template.js` (Poin a & d)

File ini **sengaja tidak diberi akhiran `.spec.js`**, supaya tidak ikut
dijalankan Playwright — karena isinya butuh aplikasi/halaman booking
sungguhan (buka browser, klik dropdown, baca teks di layar), yang belum
kita punya di technical test ini.

File tersebut tetap saya sertakan sebagai **contoh struktur test**, untuk
menunjukkan bagaimana poin a (dropdown & price otomatis) dan poin d
(regression UI vs master) bisa diautomasi nanti kalau sudah ada aplikasi
sungguhan — tinggal ganti URL & selector di dalamnya, lalu ubah nama
file jadi `.spec.js`.

## 7. Tentang Audit Berkala di Production (Poin e)

`TC-01` dan `TC-02` di atas mewakili logic audit-nya. Supaya benar-benar
"berjalan berkala di production" seperti di poin e, script ini perlu
dijadwalkan, misalnya:
- Dijalankan otomatis tiap malam lewat **cron job** atau **scheduled pipeline** (GitHub Actions/GitLab CI/Jenkins ada fitur schedule).
- Kalau ada test yang FAIL, kirim notifikasi ke tim (Slack/email) lewat integrasi CI-nya.

Bagian penjadwalan ini di luar scope automation script (karena tergantung
tools CI/CD yang dipakai perusahaan), tapi logic pengecekannya (TC-01,
TC-02) sudah siap pakai.

## 8. Melihat Laporan yang Lebih Enak Dilihat (opsional)

```bash
npx playwright show-report
```

## 9. Kalau Mau Coba-coba/Modifikasi

Data ada di bagian atas `tests/booking-validation.spec.js` (variabel
`bookings` dan `schedule`). Ubah angkanya untuk lihat hasil test
berubah — misalnya perbaiki price booking id 1001 jadi 1000000, lalu
jalankan lagi, TC-01 akan berubah jadi PASS.
