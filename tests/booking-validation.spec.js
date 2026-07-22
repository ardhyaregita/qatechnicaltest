/**
 * tests/booking-validation.spec.js
 * ----------------------------------------------------------------------
 * Automation test SEDERHANA untuk Studi Kasus 1 (price mismatch & double
 * booking), menggunakan Playwright HANYA sebagai test runner.
 *
 * File ini mengotomasi 2 poin dari Pengajuan Solusi:
 *   - Poin b: backend menolak booking baru pada slot yang sudah terisi
 *   - Poin e: audit berkala data existing terhadap master schedule
 *
 * Tidak ada server, tidak ada pemanggilan API/browser. Data
 * tabel `booking` dan `schedule` dari soal langsung ditulis di file ini
 * (hardcoded)
 *
 * ----------------------------------------------------------------------
 */

const { test, expect } = require("@playwright/test");

// ========================================================================
// 1. DATA (persis dari soal studi kasus)
// ========================================================================

// Tabel booking: data yang tersimpan di sistem, TERMASUK 2 data yang
// bermasalah sesuai soal (id 1001 price salah, id 1005 double booking
// dengan id 1001).
const bookings = [
  { id: 1001, venue_id: 15, user_id: 12, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00", price: 1200000 },
  { id: 1005, venue_id: 15, user_id: 12, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00", price: 1000000 },
];

// Tabel schedule: data MASTER / acuan harga yang seharusnya benar.
const schedule = [
  { id: 11, venue_id: 15, date: "2022-12-10", start_time: "07:00:00", end_time: "09:00:00", price: 800000 },
  { id: 12, venue_id: 15, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00", price: 1000000 },
  { id: 13, venue_id: 15, date: "2022-12-10", start_time: "11:00:00", end_time: "13:00:00", price: 1200000 },
  // 2 baris di bawah ini ditambahkan khusus untuk
  // membuktikan skenario POSITIF (booking berhasil), bukan cuma gagal
  // karena kebetulan master schedule-nya belum ada.
  { id: 20, venue_id: 16, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00", price: 950000 },
  { id: 21, venue_id: 15, date: "2022-12-11", start_time: "09:00:00", end_time: "11:00:00", price: 1000000 },
];

// ========================================================================
// 2. FUNGSI BANTU
// Karena belum ada backend sungguhan untuk kasus ini, maka saya tulis fungsi sederhana
// yang merepresentasikan logic yang seharusnya diterapkan backend
// ========================================================================

// Cari harga master di tabel schedule untuk venue+tanggal+jam tertentu.
function getExpectedPrice(venue_id, date, start_time, end_time) {
  const match = schedule.find(
    (s) => s.venue_id === venue_id && s.date === date && s.start_time === start_time && s.end_time === end_time
  );
  return match ? match.price : null;
}

// Cek apakah dua booking punya venue+tanggal+jam yang SAMA PERSIS.
function isSameSlot(a, b) {
  return a.venue_id === b.venue_id && a.date === b.date && a.start_time === b.start_time && a.end_time === b.end_time;
}

// Simulasi validasi yang SEHARUSNYA dijalankan backend saat ada request booking baru
// Fungsi ini tidak memanggil API mana pun -> murni fungsi JavaScript
// biasa, supaya mudah dites tanpa perlu server.
function validateNewBooking(newBooking, existingBookings) {
  // Cek dulu apakah slot sudah dipakai booking lain (double booking)
  const conflict = existingBookings.find((b) => isSameSlot(b, newBooking));
  if (conflict) {
    return { allowed: false, reason: "Slot sudah dibooking" };
  }

  // Ambil price dari master schedule, bukan dari input manual
  const price = getExpectedPrice(newBooking.venue_id, newBooking.date, newBooking.start_time, newBooking.end_time);
  if (price === null) {
    return { allowed: false, reason: "Jadwal/harga master tidak ditemukan" };
  }

  return { allowed: true, price };
}

// ========================================================================
// 3. TEST
// ========================================================================

test.describe("Audit Data Existing (mengecek data yang sudah ada di sistem)", () => {

  test("TC-03: Audit/regression: harga existing booking vs master schedule", () => {
    const mismatches = bookings.filter((b) => {
      const expected = getExpectedPrice(b.venue_id, b.date, b.start_time, b.end_time);
      return expected !== b.price;
    });

    // Kita berharap TIDAK ADA mismatch sama sekali. Karena data booking
    // id=1001 di atas memang sengaja dibuat salah (persis soal), test
    // ini SEHARUSNYA gagal (FAIL) -- itu justru bukti test-nya berhasil
    // menangkap bug tersebut, bukan berarti ada yang salah dengan test-nya.
    expect(mismatches).toEqual([]);
  });

  test("TC-05: Audit/regression: deteksi double booking pada data existing", () => {
    const conflicts = [];
    for (let i = 0; i < bookings.length; i++) {
      for (let j = i + 1; j < bookings.length; j++) {
        if (isSameSlot(bookings[i], bookings[j])) {
          conflicts.push([bookings[i].id, bookings[j].id]);
        }
      }
    }

    // Sama seperti TC-01, test ini SEHARUSNYA gagal pada data di soal,
    // karena booking id 1001 & 1005 memang double booking.
    expect(conflicts).toEqual([]);
  });
});

test.describe("Validasi Pembuatan Booking Baru (logic yang seharusnya dijalankan backend)", () => {

  test("TC-02: Vlidasi Harga booking baru diambil otomatis dari master schedule", () => {
    // Slot 11:00-13:00 masih kosong, harga master-nya 1.200.000
    const newBooking = { venue_id: 15, user_id: 77, date: "2022-12-10", start_time: "11:00:00", end_time: "13:00:00" };

    const result = validateNewBooking(newBooking, bookings);

    expect(result.allowed).toBe(true);
    expect(result.price).toBe(1200000);
  });

  test("TC-04: Verifikasi sistem menolak booking baru pada slot yang sudah dibooking, walau user berbeda", () => {
    // Slot 09:00-11:00 sudah dipakai booking id 1001/1005 (user_id 12).
    // Di sini kita coba pakai user_id LAIN (99), untuk membuktikan
    // validasi tidak bergantung pada "user_id yang sama".
    const newBooking = { venue_id: 15, user_id: 99, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00" };

    const result = validateNewBooking(newBooking, bookings);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Slot sudah dibooking");
  });

  test("TC-06: Verifikasi user berhasil booking pada venue berbeda di jam yang sama", () => {
    // Venue 16 punya master schedule sendiri untuk jam 09:00-11:00 di
    // tanggal yang sama dengan booking id 1001/1005 (yang venue-nya 15).
    // Karena venue berbeda, seharusnya TIDAK dianggap konflik.
    const newBooking = { venue_id: 16, user_id: 50, date: "2022-12-10", start_time: "09:00:00", end_time: "11:00:00" };
 
    const result = validateNewBooking(newBooking, bookings);
 
    expect(result.allowed).toBe(true);
    expect(result.price).toBe(950000); // harga master khusus venue 16
  });
 
  test("TC-07: Verifikasi user berhasil booking pada venue sama di tanggal berbeda", () => {
    // Venue 15 di tanggal 2022-12-10 jam 09:00-11:00 sudah terisi, tapi
    // tanggal 2022-12-11 punya master schedule sendiri dan masih kosong.
    const newBooking = { venue_id: 15, user_id: 50, date: "2022-12-11", start_time: "09:00:00", end_time: "11:00:00" };
 
    const result = validateNewBooking(newBooking, bookings);
 
    expect(result.allowed).toBe(true);
    expect(result.price).toBe(1000000);
  });
 
  test("TC-08: Verifikasi user tidak dapat melakukan booking pada slot yang tidak punya master schedule/harga", () => {
    // Jam 15:00-17:00 tidak pernah didefinisikan di tabel schedule manapun.
    const newBooking = { venue_id: 15, user_id: 50, date: "2022-12-10", start_time: "15:00:00", end_time: "17:00:00" };
 
    const result = validateNewBooking(newBooking, bookings);
 
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Jadwal/harga master tidak ditemukan");
  });
});