// Scènes propres au mythe « La Grande Muraille se voit depuis l'espace ».
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  random,
  useCurrentFrame,
} from "remotion";
import { Apparition } from "../composants/Apparition";
import { Scene } from "../composants/Scene";
import { couleurs } from "../theme";

const fige = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Tracé en zigzag de la Muraille, dessiné progressivement.
const TRACE =
  "M0 120 L90 70 L170 110 L250 40 L330 95 L420 55 L500 115 L590 60 L680 100 L760 45 L860 90";

export const Retournement: React.FC = () => (
  <Scene>
    <Apparition taille={170}>Problème…</Apparition>
    <Apparition debut={24} style="texte" taille={66} couleur={couleurs.jaune}>
      les astronautes ne sont pas d'accord
    </Apparition>
  </Scene>
);

export const Histoire: React.FC = () => (
  <Scene>
    <Apparition taille={300} couleur={couleurs.jaune}>
      2003
    </Apparition>
    <Apparition debut={12} taille={120}>
      Yang Liwei
    </Apparition>
    <Apparition debut={20} style="texte" taille={48} couleur="#C9D2F0">
      premier astronaute chinois
    </Apparition>
    <Apparition debut={110} style="texte" taille={60} marge={50}>
      « Alors, tu l'as vue ? »
    </Apparition>
    <Apparition debut={175} taille={130} couleur={couleurs.rouge}>
      Non. Rien du tout.
    </Apparition>
  </Scene>
);

export const Explication: React.FC = () => {
  const frame = useCurrentFrame();

  // 0-140 : longue mais étroite / 140-280 : même couleur que le paysage / 280-420 : 400 km
  const paysage = interpolateColors(frame, [140, 200], [couleurs.marine, "#7A6A4F"]);
  const couleurMuraille = interpolateColors(
    frame,
    [150, 230],
    [couleurs.jaune, "#857457"],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: frame < 280 ? paysage : couleurs.marineFonce }}>
      {frame < 280 ? (
        <Scene fond="transparent">
          <svg width={900} height={170} viewBox="-20 0 900 170">
            <path
              d={TRACE}
              stroke={couleurMuraille}
              strokeWidth={interpolate(frame, [70, 110], [22, 6], fige)}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={1200}
              strokeDashoffset={interpolate(frame, [0, 45], [1200, 0], {
                ...fige,
                easing: Easing.bezier(0.33, 1, 0.68, 1),
              })}
            />
          </svg>
          {frame < 140 ? (
            <>
              <Apparition debut={20} taille={92}>
                Très longue…
              </Apparition>
              <Apparition debut={70} taille={92} couleur={couleurs.jaune}>
                mais quelques mètres de large
              </Apparition>
            </>
          ) : (
            <>
              <Apparition debut={150} taille={92}>
                Pierre et terre…
              </Apparition>
              <Apparition debut={190} taille={92} couleur={couleurs.jaune}>
                de la même couleur que le paysage
              </Apparition>
            </>
          )}
        </Scene>
      ) : (
        <Scene fond="transparent">
          <Apparition debut={285} taille={260} couleur={couleurs.jaune}>
            400 km
          </Apparition>
          <Apparition debut={295} style="texte" taille={50}>
            l'altitude de la Station spatiale
          </Apparition>
          <Apparition debut={340} taille={88} marge={50}>
            = voir un cheveu à plusieurs kilomètres
          </Apparition>
        </Scene>
      )}
      {frame >= 280 ? (
        // La Terre vue d'en haut : un grand arc en bas de l'image
        <div
          style={{
            position: "absolute",
            left: -460,
            width: 2000,
            height: 2000,
            borderRadius: "50%",
            top: interpolate(frame, [280, 330], [2000, 1560], {
              ...fige,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            background: "radial-gradient(circle at 50% 10%, #3A7BD5, #123A7A 60%)",
            boxShadow: "0 -20px 80px rgba(80,160,255,0.55)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const Mythe1930: React.FC = () => (
  <Scene fond={couleurs.papier}>
    <Apparition style="texte" taille={64} couleur={couleurs.encre}>
      Le plus fou ?
    </Apparition>
    <Apparition debut={20} taille={110} couleur={couleurs.encre}>
      Ce mythe circulait déjà dans les années
    </Apparition>
    <Apparition debut={34} taille={240} couleur={couleurs.rouge}>
      1930
    </Apparition>
    <Apparition debut={90} style="texte" taille={54} couleur={couleurs.encre}>
      bien avant le premier humain dans l'espace
    </Apparition>
  </Scene>
);

const lumieres = new Array(140).fill(true).map((_, i) => ({
  x: random(`x${i}`) * 1080,
  y: 1100 + random(`y${i}`) * 800,
  taille: 3 + random(`t${i}`) * 7,
  delai: random(`d${i}`) * 40,
}));

export const CeQuOnVoit: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: couleurs.marineFonce }}>
      {lumieres.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: l.x,
            top: l.y,
            width: l.taille,
            height: l.taille,
            borderRadius: "50%",
            backgroundColor: "#FFC857",
            boxShadow: "0 0 12px #FFB020",
            opacity: interpolate(frame, [l.delai, l.delai + 12], [0, 0.9], fige),
          }}
        />
      ))}
      <Scene fond="transparent" justifier="flex-start">
        <Apparition taille={96}>Ce qu'on voit vraiment de là-haut</Apparition>
        <Apparition debut={30} style="texte" taille={64} couleur={couleurs.jaune} marge={40}>
          les villes la nuit
        </Apparition>
        <Apparition debut={60} style="texte" taille={64} couleur={couleurs.jaune}>
          les autoroutes
        </Apparition>
        <Apparition debut={90} style="texte" taille={64} couleur={couleurs.jaune}>
          les aéroports
        </Apparition>
      </Scene>
    </AbsoluteFill>
  );
};
