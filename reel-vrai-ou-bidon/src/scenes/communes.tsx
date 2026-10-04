// Scènes réutilisables pour chaque mythe : accroche, verdict et appel à commenter.
import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Apparition } from "../composants/Apparition";
import { Scene } from "../composants/Scene";
import { Tampon } from "../composants/Tampon";
import { couleurs, polices } from "../theme";

export const Accroche: React.FC<{
  readonly intro: string;
  readonly mythe: string;
}> = ({ intro, mythe }) => (
  <Scene>
    <Tampon taille={340} />
    <Apparition debut={14} style="texte" taille={50} marge={30}>
      {intro}
    </Apparition>
    <Apparition debut={22} taille={104} couleur={couleurs.jaune}>
      {mythe}
    </Apparition>
  </Scene>
);

export const Verdict: React.FC<{ readonly verdict: "VRAI" | "BIDON" }> = ({
  verdict,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const choc = spring({
    frame: frame - 8,
    fps,
    config: { damping: 8, stiffness: 220 },
  });
  const couleur = verdict === "BIDON" ? couleurs.rouge : couleurs.vert;

  return (
    <Scene fond={couleurs.jaune}>
      <Apparition taille={90} couleur={couleurs.marine}>
        Verdict
      </Apparition>
      <div
        style={{
          fontFamily: polices.titre,
          fontSize: 250,
          color: couleur,
          border: `22px solid ${couleur}`,
          borderRadius: 40,
          padding: "10px 60px 0",
          marginTop: 30,
          opacity: interpolate(frame, [8, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(choc, [0, 1], [3, 1]),
          rotate: interpolate(choc, [0, 1], ["-20deg", "-8deg"]),
        }}
      >
        {verdict}
      </div>
      <Apparition debut={30} marge={40}>
        <svg width={170} height={170} viewBox="0 0 100 100">
          <path
            d={verdict === "BIDON" ? "M20 20 L80 80 M80 20 L20 80" : "M15 55 L40 80 L85 22"}
            stroke={couleur}
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </Apparition>
    </Scene>
  );
};

export const Appel: React.FC<{ readonly question: string }> = ({
  question,
}) => {
  const frame = useCurrentFrame();
  return (
    <Scene>
      <Apparition taille={120} couleur={couleurs.jaune}>
        {question}
      </Apparition>
      <Apparition debut={14} style="texte" taille={58}>
        Dis-le en commentaire
      </Apparition>
      <svg
        width={130}
        height={150}
        viewBox="0 0 100 115"
        style={{
          marginTop: 20,
          translate: `0px ${Math.sin(frame / 5) * 14}px`,
          opacity: interpolate(frame, [20, 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <path
          d="M50 8 L50 100 M14 66 L50 102 L86 66"
          stroke={couleurs.jaune}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 420,
        }}
      >
        <Apparition debut={34} style="texte" taille={40} couleur="#C9D2F0">
          Vrai ou Bidon · Les mythes passent au détecteur
        </Apparition>
      </AbsoluteFill>
    </Scene>
  );
};
