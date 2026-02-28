import { type MouthShape } from "@/hooks/useLipSync";

const MOUTH_IMAGES: Record<MouthShape, string> = {
  rest: "/avatar/mouth_rest.svg",
  A: "/avatar/mouth_A.svg",
  E: "/avatar/mouth_E.svg",
  O: "/avatar/mouth_O.svg",
  U: "/avatar/mouth_U.svg",
  L: "/avatar/mouth_L.svg",
};

interface AvatarStageProps {
  currentMouth: MouthShape;
  isSpeaking: boolean;
}

const AvatarStage = ({ currentMouth, isSpeaking }: AvatarStageProps) => {
  return (
    <div className="relative w-full max-w-xs mx-auto select-none">
      {/* Hands behind head */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[70%]">
        <img
          src="/avatar/hands.svg"
          alt=""
          className={`w-full transition-transform ${
            isSpeaking ? "animate-hand-gesture" : ""
          }`}
          draggable={false}
        />
      </div>

      {/* Head */}
      <div className="relative z-10">
        <img
          src="/avatar/head.svg"
          alt="Avatar"
          className="w-full"
          draggable={false}
        />

        {/* Mouth overlay — positioned on the face */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "60%", width: "27%" }}>
          <img
            src={MOUTH_IMAGES[currentMouth]}
            alt=""
            className="w-full transition-opacity duration-75"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};

export default AvatarStage;
