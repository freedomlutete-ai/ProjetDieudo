import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Couleurs reprises du tampon « Vrai ou Bidon »
export const couleurs = {
  jaune: "#FFD60A",
  marine: "#0B1A4A",
  marineFonce: "#060F2E",
  rouge: "#E5484D",
  vert: "#2F9E44",
  blanc: "#FFFFFF",
  papier: "#EAD9A8",
  encre: "#3B2A14",
};

export const polices = {
  titre: "Anton",
  texte: "Inter",
};

loadFont({ family: "Anton", url: staticFile("fonts/Anton.woff2") });
loadFont({
  family: "Inter",
  url: staticFile("fonts/Inter-500.woff2"),
  weight: "500",
});
loadFont({
  family: "Inter",
  url: staticFile("fonts/Inter-800.woff2"),
  weight: "800",
});
