# Fiche store — NutriPanier

Limites vérifiées (octobre 2026) :
- App Store : nom ≤ 30 caractères, sous-titre ≤ 30, mots-clés ≤ 100 octets, description ≤ 4000 ([Apple](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/), [Apple](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/)).
- Google Play : nom ≤ 30, description courte ≤ 80, description complète ≤ 4000 ([Google](https://support.google.com/googleplay/android-developer/answer/9859152)).

> Le nom « NutriPanier » n'a fait l'objet d'aucune recherche d'antériorité de marque. Vérifiez-le (INPI, EUIPO, stores) avant publication.

## Français

**Nom** : NutriPanier (11)
**Sous-titre (App Store)** : Calories et liste de courses (28)
**Description courte (Play)** : Suivez vos calories, scannez vos produits et préparez vos courses. (68)

**Description**
NutriPanier vous aide à suivre ce que vous mangez et à préparer vos courses, simplement.

• Journal du jour : ajoutez vos aliments et voyez les calories consommées et restantes.
• Objectif estimé à partir de votre profil (équation de Mifflin-St Jeor).
• Scan de code-barres : les calories sont proposées à partir de la base collaborative Open Food Facts. Vérifiez toujours l'étiquette.
• Mes aliments : enregistrez vos produits habituels pour les ajouter en un geste.
• Liste de courses avec quantités et cases à cocher.
• Vos données restent sur votre téléphone, dans une base chiffrée. Aucun compte, aucune publicité.

Premium (abonnement facultatif, renouvellement automatique, annulable à tout moment dans les réglages de votre compte) :
• Historique complet (version gratuite : 7 derniers jours)
• Export CSV de votre journal

NutriPanier fournit des estimations à titre indicatif. Ce n'est pas un dispositif médical. Réservé aux adultes. En cas de grossesse, de maladie, de trouble du comportement alimentaire ou de régime prescrit, consultez un professionnel de santé.

Données produits : Open Food Facts, licence ODbL.

**Mots-clés (App Store)** : calories,nutrition,régime,courses,code-barres,journal alimentaire,diététique (vérifier ≤ 100 octets : les accents comptent pour 2 octets)

**Catégorie** : Santé et forme (Health & Fitness). Attention : cette catégorie déclenche la déclaration « Regulated Medical Devices » pour l'UE/EEE, le Royaume-Uni et les États-Unis ([Apple](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/)). Alternative à étudier : « Alimentation et boissons ».

**Notes de version** : (non requises pour la première version sur l'App Store)

**URL support / confidentialité** : à fournir (pages publiques en https obligatoires). La page support doit mener à de vraies coordonnées.

## English

**Name**: NutriPanier
**Subtitle**: Calories and grocery list (25)
**Short description**: Track your calories, scan products and plan your grocery shopping. (66)

**Description**
NutriPanier helps you keep track of what you eat and plan your grocery shopping.

• Daily log: add foods and see calories eaten and remaining.
• Target estimated from your profile (Mifflin-St Jeor equation).
• Barcode scanning: calories are suggested from the collaborative Open Food Facts database. Always check the label.
• My foods: save your usual products and add them in one tap.
• Grocery list with quantities and checkboxes.
• Your data stays on your phone, in an encrypted database. No account, no ads.

Premium (optional subscription, renews automatically, cancel at any time in your account settings):
• Full history (free version: last 7 days)
• CSV export of your log

NutriPanier provides estimates for information only. It is not a medical device. Adults only. If you are pregnant, have a medical condition, an eating disorder or a prescribed diet, consult a health professional.

Product data: Open Food Facts, ODbL licence.

## Captures d'écran
Générées par `node e2e/store-screenshots.js` dans `store/screenshots/` (données de démonstration saisies dans l'app, aucune donnée réelle).

| Fichier | Taille | Usage |
|---|---|---|
| `play-1…5-*.png` | 1080 × 1920 (9:16, RVB sans transparence) | Google Play : au moins 4 captures d'au moins 1080 px pour les apps ([Google](https://support.google.com/googleplay/android-developer/answer/9866151)) |
| `iphone-1…5-*.png` | 1179 × 2556 | App Store : taille listée par Apple pour l'iPhone 15 Pro ([Apple](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)) |

Je ne peux pas confirmer quelle taille d'iPhone est obligatoire aujourd'hui : l'extrait lu de la page Apple demande « au moins une capture pour iPhone avec Dynamic Island ». Vérifiez dans App Store Connect au moment de l'envoi.

Les captures viennent de la version web : la barre d'état du téléphone et l'aspect natif des onglets diffèrent. Refaites-les depuis un build iOS/Android avant publication.

Éléments Google Play générés par `python3 scripts/make-icons.py` ([exigences Google](https://support.google.com/googleplay/android-developer/answer/9866151)) :
- `store/play-icon-512.png` : icône 512 × 512, sans transparence.
- `store/play-feature-1024x500.png` : image de présentation 1024 × 500.

L'icône de l'app (`assets/images/icon.png`, 1024 × 1024, sans transparence) est un dessin géométrique original généré par ce script (panier et feuille, aucun logo tiers). Faites-la retoucher par un graphiste si vous le souhaitez.
