// playwright.config.js
// Konfigurasi paling minimal. Karena test ini tidak memanggil API atau
// membuka browser sama sekali (murni mengecek data & logic di JavaScript),
// kita tidak perlu bagian `webServer` atau `use.baseURL` seperti pada
// automation test berbasis API pada umumnya.

const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  reporter: [["list"], ["html", { open: "never" }]],
});
