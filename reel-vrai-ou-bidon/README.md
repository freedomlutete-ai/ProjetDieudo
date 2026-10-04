# Reels « Vrai ou Bidon »

Vidéos verticales (1080×1920, 30 i/s) fabriquées avec Remotion pour la page « Vrai ou Bidon ».

## Contenu

- `src/scenes/communes.tsx` : scènes réutilisables pour chaque mythe (accroche avec le tampon, verdict VRAI/BIDON, appel à commenter).
- `src/scenes/grande-muraille.tsx` : scènes propres au mythe de la Grande Muraille.
- `src/GrandeMuraille.tsx` : l'enchaînement des scènes et leur durée.
- `public/` : le tampon et les polices (Anton, Inter).

## Commandes

```bash
npm i
npx remotion studio                      # aperçu
npx remotion render GrandeMuraille out/Reel-Grande-Muraille.mp4
```

Pour un nouveau mythe : copier `GrandeMuraille.tsx`, changer les textes de l'accroche, du verdict et de l'appel, et écrire les scènes du milieu.
