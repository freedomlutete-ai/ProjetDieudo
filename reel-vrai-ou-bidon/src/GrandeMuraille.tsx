import type React from "react";
import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { Accroche, Appel, Verdict } from "./scenes/communes";
import {
  CeQuOnVoit,
  Explication,
  Histoire,
  Mythe1930,
  Retournement,
} from "./scenes/grande-muraille";

// Reel « La Grande Muraille de Chine se voit depuis l'espace ? » – 50 s à 30 i/s.
// Les durées suivent le script (dossier Drive « Page Facebook – Vrai ou Bidon »).
export const GrandeMuraille: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence name="Accroche" durationInFrames={120} premountFor={fps}>
          <Accroche
            intro="On te l'a forcément dit à l'école :"
            mythe="La Grande Muraille de Chine se voit depuis l'espace"
          />
        </Series.Sequence>
        <Series.Sequence name="Retournement" durationInFrames={90} premountFor={fps}>
          <Retournement />
        </Series.Sequence>
        <Series.Sequence name="Histoire" durationInFrames={270} premountFor={fps}>
          <Histoire />
        </Series.Sequence>
        <Series.Sequence name="Explication" durationInFrames={420} premountFor={fps}>
          <Explication />
        </Series.Sequence>
        <Series.Sequence name="Mythe 1930" durationInFrames={210} premountFor={fps}>
          <Mythe1930 />
        </Series.Sequence>
        <Series.Sequence name="Ce qu'on voit" durationInFrames={180} premountFor={fps}>
          <CeQuOnVoit />
        </Series.Sequence>
        <Series.Sequence name="Verdict" durationInFrames={90} premountFor={fps}>
          <Verdict verdict="BIDON" />
        </Series.Sequence>
        <Series.Sequence name="Appel" durationInFrames={120} premountFor={fps}>
          <Appel question={"Et toi, tu y croyais\u00a0?"} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
