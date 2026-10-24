# NutriPanier

Application iOS et Android de suivi des calories avec liste de courses et scan de code-barres (Open Food Facts). Données uniquement sur l'appareil, base chiffrée. Expo SDK 58, TypeScript, Expo Router.

## Démarrer
```bash
cd nutripanier
npm install
cp .env.example .env        # facultatif en local ; valeurs publiques uniquement
npx expo start              # Expo Go : tout sauf les achats et la base chiffrée
```
Le scan, SQLCipher et les achats demandent un development build : `eas build --profile development`.

## Vérifications
```bash
npm run typecheck
npm run lint
npm test                                  # 81 tests unitaires
npm run export:web && node e2e/serve.js & # puis :
node e2e/run.js                           # 46 vérifications de bout en bout (Playwright)
node e2e/store-screenshots.js             # captures pour les stores
python3 scripts/make-icons.py             # icônes et visuels Play
```

## Structure
| Dossier | Contenu |
|---|---|
| `src/app/` | écrans (Expo Router) |
| `src/lib/` | logique : validation, calories, Open Food Facts, base, premium, CSV |
| `src/components/`, `src/hooks/`, `src/i18n/` | interface, hooks, textes FR/EN |
| `__tests__/` | tests unitaires |
| `e2e/` | serveur de test, scénario Playwright, captures |
| `docs/` | spécification, monétisation, fiche store, checklist, confidentialité, audit |
| `store/` | captures et visuels pour les stores |

## Documents
- [Spécification](docs/SPEC.md)
- [Monétisation](docs/MONETIZATION.md)
- [Fiche store](docs/STORE_LISTING.md)
- [Checklist de soumission](docs/SUBMIT_CHECKLIST.md)
- [Politique de confidentialité (brouillon)](docs/PRIVACY_POLICY.md)
- [Audit de sécurité](docs/SECURITY_AUDIT.md)

## Avertissement
Les estimations caloriques sont indicatives. NutriPanier n'est pas un dispositif médical. Faites relire l'app par un professionnel de santé et la politique de confidentialité par un juriste avant publication.

Données produits : © les contributeurs d'Open Food Facts, licence ODbL.
