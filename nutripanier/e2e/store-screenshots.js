// Captures pour les fiches store, avec des données de démonstration saisies dans l'app.
// Play : 9:16, au moins 1080×1920. App Store (iPhone) : 1179×2556 (page Apple « Screenshot specifications »).
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:8099';
const OUT = path.join(__dirname, '..', 'store', 'screenshots');
const fixture = fs.readFileSync(path.join(__dirname, '..', '__tests__', 'fixtures', 'off-nutella-v3.json'), 'utf8');
const FORMATS = [
  { name: 'play', width: 360, height: 640, scale: 3 }, // 1080×1920
  { name: 'iphone', width: 393, height: 852, scale: 3 }, // 1179×2556
];

(async () => {
  const browser = await chromium.launch();
  for (const f of FORMATS) {
    const ctx = await browser.newContext({ viewport: { width: f.width, height: f.height }, deviceScaleFactor: f.scale, locale: 'fr-FR' });
    const page = await ctx.newPage();
    page.setDefaultTimeout(15000);
    await page.route('https://world.openfoodfacts.org/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: fixture }));
    const id = (t) => page.getByTestId(t);
    await page.goto(BASE);
    await id('accept-disclaimer').click();
    await page.goto(`${BASE}/profile`);
    await id('age').fill('34'); await id('height').fill('170'); await id('weight').fill('68');
    await id('save-profile').click();
    await id('profile-message').filter({ hasText: 'Enregistré' }).waitFor();
    for (const [name, kcal, grams] of [['Flocons d’avoine', '370', '50'], ['Pomme', '52', '150'], ['Riz complet cuit', '120', '180']]) {
      await page.goto(`${BASE}/add`);
      await id('food-name').fill(name); await id('food-kcal').fill(kcal); await id('food-grams').fill(grams);
      await id('add-and-save').click();
      await id('form-message').filter({ hasText: 'Ajouté' }).waitFor();
    }
    await page.goto(`${BASE}/shopping`);
    for (const [item, q] of [['Yaourts nature', '4'], ['Pommes', '6'], ['Lentilles', '1']]) {
      await id('item-name').fill(item); await id('item-qty').fill(q); await id('add-item').click();
      await page.getByText(`${item} × ${q}`).waitFor();
    }
    const shots = [
      ['1-aujourdhui', '/', 'today', 'Pomme'],
      ['2-ajouter', '/add', 'add', 'Riz complet cuit'],
      ['3-courses', '/shopping', 'shopping', 'Lentilles × 1'],
      ['4-profil', '/profile', 'profile', 'Estimation'],
    ];
    for (const [file, url, screen, text] of shots) {
      await page.goto(BASE + url);
      await id(screen).getByText(text).first().waitFor();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, `${f.name}-${file}.png`) });
    }
    await page.goto(`${BASE}/scan?barcode=3017624010701`);
    await id('product-name').waitFor();
    await page.screenshot({ path: path.join(OUT, `${f.name}-5-scan.png`) });
    await ctx.close();
  }
  await browser.close();
  console.log('captures écrites dans', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
