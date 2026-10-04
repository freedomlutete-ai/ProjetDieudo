import type React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { couleurs, polices } from "../theme";

type Props = {
  readonly children: React.ReactNode;
  /** Image (frame) à laquelle le texte apparaît, relative à la scène */
  readonly debut?: number;
  readonly taille?: number;
  readonly couleur?: string;
  readonly style?: "titre" | "texte";
  readonly marge?: number;
};

// Un texte qui surgit avec un petit rebond : la brique de base de chaque scène.
export const Apparition: React.FC<Props> = ({
  children,
  debut = 0,
  taille = 96,
  couleur = couleurs.blanc,
  style = "titre",
  marge = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rebond = spring({
    frame: frame - debut,
    fps,
    config: { damping: 12, stiffness: 160 },
  });

  return (
    <div
      style={{
        fontFamily: style === "titre" ? polices.titre : polices.texte,
        fontWeight: style === "titre" ? 400 : 800,
        fontSize: taille,
        lineHeight: style === "titre" ? 1.05 : 1.2,
        color: couleur,
        textAlign: "center",
        textTransform: style === "titre" ? "uppercase" : "none",
        marginTop: marge,
        opacity: interpolate(frame, [debut, debut + 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        scale: interpolate(rebond, [0, 1], [0.6, 1]),
        translate: interpolate(rebond, [0, 1], ["0px 60px", "0px 0px"]),
      }}
    >
      {children}
    </div>
  );
};
