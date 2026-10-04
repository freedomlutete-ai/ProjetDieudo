import "./theme";
import { Composition } from "remotion";
import { GrandeMuraille } from "./GrandeMuraille";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GrandeMuraille"
        component={GrandeMuraille}
        durationInFrames={1500}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
