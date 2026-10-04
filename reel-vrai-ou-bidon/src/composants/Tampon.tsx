import type React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  readonly taille?: number;
  readonly debut?: number;
};

// Le logo « Vrai ou Bidon » qui s'abat comme un tampon.
export const Tampon: React.FC<Props> = ({ taille = 380, debut = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const choc = spring({
    frame: frame - debut,
    fps,
    config: { damping: 9, stiffness: 200 },
  });

  return (
    <Img
      src={staticFile("logo-vrai-ou-bidon.png")}
      style={{
        width: taille,
        height: taille,
        opacity: interpolate(frame, [debut, debut + 3], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: interpolate(choc, [0, 1], [2.4, 1]),
        rotate: interpolate(choc, [0, 1], ["-25deg", "-6deg"]),
        filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.45))",
      }}
    />
  );
};
