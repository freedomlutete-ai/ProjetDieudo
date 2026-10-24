// Scénario de bout en bout sur l'export web (Chromium, viewport mobile).
// Usage : node e2e/serve.js & node e2e/run.js
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:8099';
const SHOTS = process.env.SHOTS_DIR ?? path.join(__dirname, 'screenshots');
const fixture = fs.readFileSync(path.join(__dirname, '..', '__tests__', 'fixtures', 'off-nutella-v3.json'), 'utf8');

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  const consoleErrors = [];
  const pageErrors = [];
  const externalRequests = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('request', (r) => {
    if (!r.url().startsWith(BASE) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) {
      externalRequests.push(r.url());
    }
  });

  // Open Food Facts simulé (le conteneur de test n'a pas accès à Internet).
  let offMode = 'fixture';
  await page.route('https://world.openfoodfacts.org/**', (route) => {
    if (offMode === 'offline') return route.abort('internetdisconnected');
    if (offMode === 'hostile') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          product: {
            product_name: '<img src=x onerror="window.__xss=1">Piège',
            nutriments: { 'energy-kcal_100g': 120 },
          },
        }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: fixture });
  });

  const byId = (id) => page.getByTestId(id);
  const tab = (name) => page.getByRole('tab', { name }).or(page.getByRole('link', { name })).first();

  // 1. Avertissement santé au premier lancement
  await page.goto(BASE);
  await byId('disclaimer').waitFor({ timeout: 30000 });
  check('avertissement santé affiché au premier lancement', true);
  await page.screenshot({ path: path.join(SHOTS, '01-avertissement.png') });
  await byId('accept-disclaimer').click();
  await byId('today').waitFor();
  check('acceptation de l’avertissement', true);

  // 2. Profil : refus d'un mineur, puis profil valide
  await tab('Profil').click();
  await byId('age').fill('15');
  await byId('height').fill('165');
  await byId('weight').fill('60');
  await byId('save-profile').click();
  check('profil mineur refusé', (await byId('profile-message').textContent()).includes('hors limites'));
  await byId('age').fill('30');
  // Activité par défaut « légère » : 1320,25 × 1,375 = 1815 kcal
  const estimate = await byId('estimate').textContent();
  check('estimation Mifflin-St Jeor affichée', estimate.includes('1815'), estimate);
  await byId('save-profile').click();
  await byId('profile-message').filter({ hasText: 'Enregistré' }).waitFor({ timeout: 5000 }).catch(() => {});
  check('profil enregistré', (await byId('profile-message').textContent()) === 'Enregistré');
  await page.screenshot({ path: path.join(SHOTS, '02-profil.png') });

  // 3. Ajout manuel avec charge XSS
  await tab('Ajouter').click();
  const xss = '<img src=x onerror="window.__xss=1">Yaourt';
  await byId('food-name').fill(xss);
  await byId('food-kcal').fill('60');
  await byId('food-grams').fill('125');
  await byId('add-today').click();
  check('ajout manuel', (await byId('form-message').textContent()) === 'Ajouté');

  // 4. Entrées invalides
  for (const [kcal, grams, label] of [
    ['1e3', '100', 'notation exponentielle'],
    ['-5', '100', 'kcal négatives'],
    ['901', '100', 'kcal > 900'],
    ['50', '0', 'quantité nulle'],
    ['50', '99999', 'quantité énorme'],
  ]) {
    await byId('food-name').fill('Test');
    await byId('food-kcal').fill(kcal);
    await byId('food-grams').fill(grams);
    await byId('add-today').click();
    const msg = await byId('form-message').textContent();
    check(`entrée refusée : ${label}`, msg.startsWith('Vérifiez'), msg);
  }
  await byId('food-name').fill('   ');
  await byId('food-kcal').fill('50');
  await byId('food-grams').fill('100');
  await byId('add-today').click();
  check('nom vide refusé', (await byId('form-message').textContent()).startsWith('Vérifiez'));

  // 5. Journal du jour : texte affiché tel quel, aucun script exécuté
  await tab("Aujourd'hui").click();
  await page.getByText(xss, { exact: true }).waitFor();
  check('charge XSS affichée comme texte', true);
  check('aucun script injecté exécuté', (await page.evaluate(() => window.__xss)) === undefined);
  check('total du jour = 75 kcal (60 × 125 / 100)', (await byId('consumed').textContent()).includes('75'));
  // 1815 − 75 = 1740
  check('reste affiché', (await byId('remaining').textContent()).includes('1740'));
  await page.screenshot({ path: path.join(SHOTS, '03-aujourdhui.png') });

  // 6. Persistance après rechargement
  await page.reload();
  await byId('today').waitFor();
  check('données conservées après rechargement', await page.getByText(xss, { exact: true }).isVisible());

  // 7. Liste de courses + injection SQL
  await tab('Courses').click();
  const sqli = "Lait'); DROP TABLE shopping;--";
  await byId('item-name').fill(sqli);
  await byId('item-qty').fill('2');
  await byId('add-item').click();
  await page.getByText(`${sqli} × 2`).waitFor();
  check('injection SQL stockée comme simple texte', true);
  await byId('item-name').fill('Pommes');
  await byId('item-qty').fill('0');
  await byId('add-item').click();
  check('quantité 0 refusée', await page.getByText('Vérifiez').isVisible());
  await byId('item-qty').fill('6');
  await byId('add-item').click();
  await page.getByText('Pommes × 6').waitFor();
  check('la table existe toujours après la tentative d’injection', true);
  await page.getByRole('checkbox', { name: 'Pommes, 6' }).click();
  await page.getByText('Retirer les articles cochés').click();
  await page.waitForTimeout(300);
  check('article coché retiré', !(await page.getByText('Pommes × 6').isVisible()));
  await page.screenshot({ path: path.join(SHOTS, '04-courses.png') });

  // 8. Scan : code invalide, introuvable hors ligne, produit trouvé
  await tab('Ajouter').click();
  await byId('open-scan').click();
  await byId('scan').waitFor();
  await byId('manual-barcode').fill('abc123');
  check('le champ code-barres ne garde que les chiffres', (await byId('manual-barcode').inputValue()) === '123');
  await byId('lookup').click();
  check('code-barres trop court refusé', (await byId('scan-error').textContent()) === 'Code-barres invalide.');
  await byId('manual-barcode').fill('3017624010702');
  await byId('lookup').click();
  check('mauvaise clé de contrôle refusée', (await byId('scan-error').textContent()) === 'Code-barres invalide.');

  offMode = 'offline';
  await byId('manual-barcode').fill('3017624010701');
  await byId('lookup').click();
  await byId('scan-error').waitFor();
  check('réseau coupé : message clair, pas de plantage', (await byId('scan-error').textContent()).startsWith('Pas de connexion'));

  offMode = 'fixture';
  await byId('lookup').click();
  await byId('product-name').waitFor();
  check('produit trouvé via Open Food Facts', (await byId('product-name').textContent()).includes('Nutella'));
  check('kcal pré-remplies depuis l’API', (await byId('scan').getByTestId('food-kcal').inputValue()) === '539');
  await page.screenshot({ path: path.join(SHOTS, '05-scan.png') });
  await byId('scan').getByTestId('food-grams').fill('15');
  await byId('scan').getByTestId('add-and-save').click();
  await byId('add').getByText('Nutella').first().waitFor({ timeout: 5000 }).catch(() => {});
  check('produit enregistré dans « Mes aliments »', await byId('add').getByText('Nutella').first().isVisible());

  // 9. Liens profonds piégés
  const offCalls = [];
  page.on('request', (r) => r.url().includes('openfoodfacts') && offCalls.push(r.url()));
  for (const evil of ['../../cgi/search.pl', '3017624010701?fields=*', 'javascript:alert(1)', "1' OR '1'='1"]) {
    await page.goto(`${BASE}/scan?barcode=${encodeURIComponent(evil)}`);
    await byId('scan').waitFor();
    const err = await byId('scan-error').textContent().catch(() => null);
    check(`lien profond piégé refusé : ${evil}`, err === 'Code-barres invalide.', String(err));
  }
  check('aucune requête réseau pour les liens piégés', offCalls.length === 0, offCalls.join(' '));

  // Lien profond : après ajout, l'écran ne reste pas bloqué (pas d'historique)
  await page.goto(`${BASE}/scan?barcode=3017624010701`);
  await byId('product-name').waitFor();
  await byId('scan').getByTestId('add-today').click();
  await page.waitForURL(/\/add$/, { timeout: 5000 }).catch(() => {});
  check('lien profond : retour vers « Ajouter » après ajout', page.url().endsWith('/add'), page.url());

  // Produit déjà enregistré : servi depuis la base locale, sans réseau
  await page.goto(`${BASE}/scan?barcode=3017624010701`);
  await byId('product-name').waitFor();
  check('produit connu servi sans appel réseau', offCalls.length === 0);

  // 10. Réponse hostile de l'API
  offMode = 'hostile';
  await page.goto(`${BASE}/scan?barcode=96385074`);
  await byId('product-name').waitFor();
  check('réponse API hostile affichée comme texte', (await byId('product-name').textContent()).includes('<img'));
  check('réponse API hostile non exécutée', (await page.evaluate(() => window.__xss)) === undefined);

  // 11. Limite de 15 requêtes / minute
  offMode = 'fixture';
  // Codes EAN-13 valides générés (clé GS1 calculée) : 16 requêtes > limite de 15.
  const ean13 = (body) => {
    const sum = body.split('').reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
    return body + ((10 - (sum % 10)) % 10);
  };
  const codes = Array.from({ length: 16 }, (_, i) => ean13(String(200000000000 + i)));
  let rateLimited = false;
  for (const code of codes) {
    await byId('manual-barcode').fill(code);
    await byId('lookup').click();
    await page.waitForTimeout(150);
    // Lecture courte : une attente longue ferait glisser la fenêtre de 60 s du limiteur.
    const err = await byId('scan-error').textContent({ timeout: 300 }).catch(() => '');
    if (err.startsWith('Trop de recherches')) {
      rateLimited = true;
      break;
    }
  }
  check('limite Open Food Facts appliquée côté client', rateLimited);

  // 12. Premium sur le web : indisponible, export bloqué
  await page.goto(`${BASE}/profile`);
  await byId('profile').waitFor();
  await byId('export').click();
  await byId('premium').waitFor();
  check('export réservé au premium', true);
  check('achats indisponibles sur le web', await page.getByText('Achats indisponibles').isVisible());
  check('bouton « Restaurer les achats » présent', await page.getByText('Restaurer les achats').isVisible());
  await page.screenshot({ path: path.join(SHOTS, '06-premium.png') });

  // 13. Effacement total
  await page.goto(`${BASE}/profile`);
  await byId('profile').waitFor();
  page.once('dialog', (d) => d.dismiss());
  await byId('wipe').click();
  await page.goto(`${BASE}/`);
  await byId('today').waitFor();
  check('annulation de l’effacement : données conservées', await page.getByText(xss, { exact: true }).isVisible());
  await page.goto(`${BASE}/profile`);
  await byId('profile').waitFor();
  page.once('dialog', (d) => d.accept());
  await byId('wipe').click();
  await page.waitForTimeout(500);
  await page.goto(`${BASE}/`);
  await byId('disclaimer').or(byId('today')).first().waitFor();
  const stillThere = await page.getByText(xss, { exact: true }).isVisible().catch(() => false);
  check('effacement total : journal vidé', !stillThere);

  // 14. Bilan
  const external = [...new Set(externalRequests.map((u) => new URL(u).host))];
  check('aucun traceur : seul Open Food Facts est contacté', external.every((h) => h === 'world.openfoodfacts.org'), external.join(', '));
  check('aucune erreur JavaScript non gérée', pageErrors.length === 0, pageErrors.join(' | '));
  const realConsoleErrors = consoleErrors.filter((e) => !e.includes('net::ERR_INTERNET_DISCONNECTED'));
  check('aucune erreur console', realConsoleErrors.length === 0, realConsoleErrors.slice(0, 3).join(' | '));

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} vérifications réussies`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('ERREUR', e);
  process.exit(2);
});
