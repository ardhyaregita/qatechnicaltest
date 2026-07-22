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
│   ├── booking-validation.spec.js      
├── playwright.config.js
└── package.json
```


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

## 5. Melihat Laporan yang Lebih Enak Dilihat (opsional)

```bash
npx playwright show-report
```