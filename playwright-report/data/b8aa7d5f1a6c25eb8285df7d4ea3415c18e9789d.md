# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-validation.spec.js >> Audit Data Existing (mengecek data yang sudah ada di sistem) >> TC-05: Audit/regression: deteksi double booking pada data existing
- Location: tests/booking-validation.spec.js:101:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 6

- Array []
+ Array [
+   Array [
+     1001,
+     1005,
+   ],
+ ]
```

# Test source

```ts
  13  |  * (hardcoded)
  14  |  *
  15  |  * ----------------------------------------------------------------------
  16  |  */
  17  | 
  18  | const { test, expect } = require("@playwright/test");
  19  | 
  20  | // ========================================================================
  21  | // 1. DATA (persis dari soal studi kasus)
  22  | // ========================================================================
  23  | 
  24  | // Tabel booking: data yang tersimpan di sistem, TERMASUK 2 data yang
  25  | // bermasalah sesuai soal (id 1001 price salah, id 1005 double booking
  26  | // dengan id 1001).
  27  | const bookings = [
  28  |   { id: 1001, venue_id: 15, user_id: 12, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00", price: 1200000 },
  29  |   { id: 1005, venue_id: 15, user_id: 12, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00", price: 1000000 },
  30  | ];
  31  | 
  32  | // Tabel schedule: data MASTER / acuan harga yang seharusnya benar.
  33  | const schedule = [
  34  |   { id: 11, venue_id: 15, date: "2022-12-10", start_time: "07:00:00", end_time: "09:00:00", price: 800000 },
  35  |   { id: 12, venue_id: 15, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00", price: 1000000 },
  36  |   { id: 13, venue_id: 15, date: "2022-12-10", start_time: "11:00:00", end_time: "13:00:00", price: 1200000 },
  37  |   // 2 baris di bawah ini ditambahkan khusus untuk
  38  |   // membuktikan skenario POSITIF (booking berhasil), bukan cuma gagal
  39  |   // karena kebetulan master schedule-nya belum ada.
  40  |   { id: 20, venue_id: 16, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00", price: 950000 },
  41  |   { id: 21, venue_id: 15, date: "2022-12-11", start_time: "09:00:00", end_time: "11:00:00", price: 1000000 },
  42  | ];
  43  | 
  44  | // ========================================================================
  45  | // 2. FUNGSI BANTU
  46  | // Karena belum ada backend sungguhan untuk kasus ini, maka saya tulis fungsi sederhana
  47  | // yang merepresentasikan logic yang seharusnya diterapkan backend
  48  | // ========================================================================
  49  | 
  50  | // Cari harga master di tabel schedule untuk venue+tanggal+jam tertentu.
  51  | function getExpectedPrice(venue_id, date, start_time, end_time) {
  52  |   const match = schedule.find(
  53  |     (s) => s.venue_id === venue_id && s.date === date && s.start_time === start_time && s.end_time === end_time
  54  |   );
  55  |   return match ? match.price : null;
  56  | }
  57  | 
  58  | // Cek apakah dua booking punya venue+tanggal+jam yang SAMA PERSIS.
  59  | function isSameSlot(a, b) {
  60  |   return a.venue_id === b.venue_id && a.date === b.date && a.start_time === b.start_time && a.end_time === b.end_time;
  61  | }
  62  | 
  63  | // Simulasi validasi yang SEHARUSNYA dijalankan backend saat ada request booking baru
  64  | // Fungsi ini tidak memanggil API mana pun -> murni fungsi JavaScript
  65  | // biasa, supaya mudah dites tanpa perlu server.
  66  | function validateNewBooking(newBooking, existingBookings) {
  67  |   // Cek dulu apakah slot sudah dipakai booking lain (double booking)
  68  |   const conflict = existingBookings.find((b) => isSameSlot(b, newBooking));
  69  |   if (conflict) {
  70  |     return { allowed: false, reason: "Slot sudah dibooking" };
  71  |   }
  72  | 
  73  |   // Ambil price dari master schedule, bukan dari input manual
  74  |   const price = getExpectedPrice(newBooking.venue_id, newBooking.date, newBooking.start_time, newBooking.end_time);
  75  |   if (price === null) {
  76  |     return { allowed: false, reason: "Jadwal/harga master tidak ditemukan" };
  77  |   }
  78  | 
  79  |   return { allowed: true, price };
  80  | }
  81  | 
  82  | // ========================================================================
  83  | // 3. TEST
  84  | // ========================================================================
  85  | 
  86  | test.describe("Audit Data Existing (mengecek data yang sudah ada di sistem)", () => {
  87  | 
  88  |   test("TC-03: Audit/regression: harga existing booking vs master schedule", () => {
  89  |     const mismatches = bookings.filter((b) => {
  90  |       const expected = getExpectedPrice(b.venue_id, b.date, b.start_time, b.end_time);
  91  |       return expected !== b.price;
  92  |     });
  93  | 
  94  |     // Kita berharap TIDAK ADA mismatch sama sekali. Karena data booking
  95  |     // id=1001 di atas memang sengaja dibuat salah (persis soal), test
  96  |     // ini SEHARUSNYA gagal (FAIL) -- itu justru bukti test-nya berhasil
  97  |     // menangkap bug tersebut, bukan berarti ada yang salah dengan test-nya.
  98  |     expect(mismatches).toEqual([]);
  99  |   });
  100 | 
  101 |   test("TC-05: Audit/regression: deteksi double booking pada data existing", () => {
  102 |     const conflicts = [];
  103 |     for (let i = 0; i < bookings.length; i++) {
  104 |       for (let j = i + 1; j < bookings.length; j++) {
  105 |         if (isSameSlot(bookings[i], bookings[j])) {
  106 |           conflicts.push([bookings[i].id, bookings[j].id]);
  107 |         }
  108 |       }
  109 |     }
  110 | 
  111 |     // Sama seperti TC-01, test ini SEHARUSNYA gagal pada data di soal,
  112 |     // karena booking id 1001 & 1005 memang double booking.
> 113 |     expect(conflicts).toEqual([]);
      |                       ^ Error: expect(received).toEqual(expected) // deep equality
  114 |   });
  115 | });
  116 | 
  117 | test.describe("Validasi Pembuatan Booking Baru (logic yang seharusnya dijalankan backend)", () => {
  118 | 
  119 |   test("TC-02: Vlidasi Harga booking baru diambil otomatis dari master schedule", () => {
  120 |     // Slot 11:00-13:00 masih kosong, harga master-nya 1.200.000
  121 |     const newBooking = { venue_id: 15, user_id: 77, date: "2022-12-10", start_time: "11:00:00", end_time: "13:00:00" };
  122 | 
  123 |     const result = validateNewBooking(newBooking, bookings);
  124 | 
  125 |     expect(result.allowed).toBe(true);
  126 |     expect(result.price).toBe(1200000);
  127 |   });
  128 | 
  129 |   test("TC-04: Verifikasi sistem menolak booking baru pada slot yang sudah dibooking, walau user berbeda", () => {
  130 |     // Slot 09:00-11:00 sudah dipakai booking id 1001/1005 (user_id 12).
  131 |     // Di sini kita coba pakai user_id LAIN (99), untuk membuktikan
  132 |     // validasi tidak bergantung pada "user_id yang sama".
  133 |     const newBooking = { venue_id: 15, user_id: 99, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00" };
  134 | 
  135 |     const result = validateNewBooking(newBooking, bookings);
  136 | 
  137 |     expect(result.allowed).toBe(false);
  138 |     expect(result.reason).toBe("Slot sudah dibooking");
  139 |   });
  140 | 
  141 |   test("TC-06: Verifikasi user berhasil booking pada venue berbeda di jam yang sama", () => {
  142 |     // Venue 16 punya master schedule sendiri untuk jam 09:00-11:00 di
  143 |     // tanggal yang sama dengan booking id 1001/1005 (yang venue-nya 15).
  144 |     // Karena venue berbeda, seharusnya TIDAK dianggap konflik.
  145 |     const newBooking = { venue_id: 16, user_id: 50, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00" };
  146 |  
  147 |     const result = validateNewBooking(newBooking, bookings);
  148 |  
  149 |     expect(result.allowed).toBe(true);
  150 |     expect(result.price).toBe(950000); // harga master khusus venue 16
  151 |   });
  152 |  
  153 |   test("TC-07: Verifikasi user berhasil booking pada venue sama di tanggal berbeda", () => {
  154 |     // Venue 15 di tanggal 2022-12-10 jam 09:00-11:00 sudah terisi, tapi
  155 |     // tanggal 2022-12-11 punya master schedule sendiri dan masih kosong.
  156 |     const newBooking = { venue_id: 15, user_id: 50, date: "2022-12-11", start_time: "09:00:00", end_time: "11:00:00" };
  157 |  
  158 |     const result = validateNewBooking(newBooking, bookings);
  159 |  
  160 |     expect(result.allowed).toBe(true);
  161 |     expect(result.price).toBe(1000000);
  162 |   });
  163 |  
  164 |   test("TC-08: Verifikasi user tidak dapat melakukan booking pada slot yang tidak punya master schedule/harga", () => {
  165 |     // Jam 15:00-17:00 tidak pernah didefinisikan di tabel schedule manapun.
  166 |     const newBooking = { venue_id: 15, user_id: 50, date: "2022-12-10", start_time: "15:00:00", end_time: "17:00:00" };
  167 |  
  168 |     const result = validateNewBooking(newBooking, bookings);
  169 |  
  170 |     expect(result.allowed).toBe(false);
  171 |     expect(result.reason).toBe("Jadwal/harga master tidak ditemukan");
  172 |   });
  173 | });
```