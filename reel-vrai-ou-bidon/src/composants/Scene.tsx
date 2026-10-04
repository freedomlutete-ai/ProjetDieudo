import type React from "react";
import { AbsoluteFill } from "remotion";
import { couleurs } from "../theme";

type Props = {
  readonly children: React.ReactNode;
  readonly fond?: string;
  readonly justifier?: "center" | "flex-start";
};

// Cadre commun à toutes les scènes : fond et marges de sécurité pour le format
// vertical (le haut et le bas sont couverts par l'interface Facebook/TikTok).
export const Scene: React.FC<Props> = ({
  children,
  fond = couleurs.marine,
  justifier = "center",
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: fond,
      padding: "260px 90px 380px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: justifier,
      gap: 30,
    }}
  >
    {children}
  </AbsoluteFill>
);
