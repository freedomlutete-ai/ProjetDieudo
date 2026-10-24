# NutriPanier — spécification v1

## Objectif
Aider un adulte à suivre les calories qu'il mange et à préparer ses courses, sans compte ni serveur.

## Public
Adultes (18 ans et plus) qui veulent suivre leur alimentation. L'app n'est pas un dispositif médical.

## Écrans
1. **Avertissement santé** (premier lancement) : estimations indicatives, adultes uniquement, consulter un professionnel en cas de grossesse, maladie, trouble alimentaire ou régime prescrit.
2. **Aujourd'hui** : calories consommées, objectif, reste ou dépassement, liste des aliments du jour.
3. **Ajouter** : saisie manuelle (nom, kcal/100 g, quantité), aliments enregistrés, accès au scan.
4. **Scanner** : caméra (iOS/Android) ou saisie du code-barres ; recherche dans les aliments enregistrés puis dans Open Food Facts.
5. **Courses** : liste avec quantités, cases à cocher, retrait des articles cochés.
6. **Profil** : sexe, âge, taille, poids, activité, objectif ; estimation du besoin ; historique ; export CSV ; effacement total.
7. **Premium** : avantages, offres lues depuis le store, restauration des achats, liens légaux.

## Parcours principal
Premier lancement → avertissement → profil → ajout d'un repas (saisie ou scan) → suivi du reste sur « Aujourd'hui ».

## Calcul
- Métabolisme de base : équation de Mifflin-St Jeor (Mifflin et al., 1990).
- Dépense : multiplicateurs d'activité 1,2 / 1,375 / 1,55 / 1,725 / 1,9.
- Objectif : −15 % (perte), 0 % (maintien), +10 % (prise).
- Avertissement affiché si l'objectif passe sous le métabolisme de base estimé.

## Données (toutes sur l'appareil)
| Table | Contenu |
|---|---|
| `profile` | profil (JSON validé), acceptation de l'avertissement |
| `entries` | jour, nom, grammes, kcal/100 g, kcal |
| `foods` | aliments enregistrés (nom, kcal/100 g, code-barres) |
| `shopping` | articles, quantité, coché |

Base SQLite chiffrée avec SQLCipher sur iOS/Android ; clé aléatoire de 256 bits dans le trousseau (expo-secure-store, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Sauvegarde Android désactivée (`allowBackup: false`).

## Permissions
- Caméra : lecture des codes-barres uniquement.
- Internet : Open Food Facts et RevenueCat.
- Microphone, stockage externe, superposition d'écran : explicitement bloqués.

## Modèle économique
Gratuit + abonnement premium (voir `MONETIZATION.md`).

## Hors périmètre v1
- Base d'aliments intégrée (table Ciqual de l'Anses, licence Etalab 2.0 : téléchargement impossible depuis l'environnement de développement ; à ajouter en v2 avec la mention de source obligatoire).
- Compte, synchronisation, macronutriments, notifications, version web publique, tablettes.
