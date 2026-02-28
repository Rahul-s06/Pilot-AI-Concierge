import { useRef, useState, useCallback } from "react";

export type MouthShape = "rest" | "A" | "E" | "O" | "U" | "L";

interface MouthCue {
  start: number;
  end: number;
  value: MouthShape;
}

export function mapCue(value: string): MouthShape {
  switch (value) {
    case "A": return "A";
    case "B": return "A";
    case "C": return "E";
    case "D": return "A";
    case "E": return "E";
    case "F": return "U";
    case "G": return "O";
    case "H": return "L";
    case "X": return "rest";
    default: return "rest";
  }
}

function amplitudeToMouth(amplitude: number): MouthShape {
  if (amplitude < 0.05) return "rest";
  if (amplitude < 0.15) return "L";
  if (amplitude < 0.3) return "E";
  if (amplitude < 0.5) return "A";
  if (amplitude < 0.7) return "O";
  return "U";
}

export function useLipSync() {
  const [currentMouth, setCurrentMouth] = useState<MouthShape>("rest");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rhubarbCuesRef = useRef<MouthCue[] | null>(null);

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    setCurrentMouth("rest");
    setIsSpeaking(false);
    console.log("Speaking ended");
  }, []);

  const animateAmplitude = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);

    // Calculate RMS amplitude
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const amplitude = Math.min(rms * 3, 1); // amplify

    setCurrentMouth(amplitudeToMouth(amplitude));
    animFrameRef.current = requestAnimationFrame(animateAmplitude);
  }, []);

  const animateWithCues = useCallback((audio: HTMLAudioElement, cues: MouthCue[]) => {
    const tick = () => {
      const t = audio.currentTime;
      const cue = cues.find(c => t >= c.start && t < c.end);
      setCurrentMouth(cue ? cue.value : "rest");

      if (!audio.paused && !audio.ended) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const tryRhubarb = useCallback(async (audioBuffer: ArrayBuffer): Promise<MouthCue[] | null> => {
    try {
      const { Rhubarb } = await import("rhubarb-lip-sync-wasm");

      // Decode MP3 to PCM
      const ctx = new AudioContext();
      const decoded = await ctx.decodeAudioData(audioBuffer.slice(0));
      const pcmData = decoded.getChannelData(0);
      const pcmBuffer = Buffer.from(pcmData.buffer);

      const result = await Rhubarb.getLipSync(pcmBuffer);
      console.log("Rhubarb cue count:", result?.mouthCues?.length ?? 0);

      if (result?.mouthCues?.length) {
        return result.mouthCues.map((c: any) => ({
          start: c.start,
          end: c.end,
          value: mapCue(c.value),
        }));
      }
      return null;
    } catch (err) {
      console.warn("Rhubarb WASM unavailable, using amplitude fallback:", err);
      return null;
    }
  }, []);

  const speak = useCallback(async (audioArrayBuffer: ArrayBuffer) => {
    // Stop any ongoing playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    stopAnimation();

    console.log("TTS audio bytes length:", audioArrayBuffer.byteLength);

    // Try Rhubarb in background
    const rhubarbPromise = tryRhubarb(audioArrayBuffer);

    // Create audio and start playing immediately
    const blob = new Blob([audioArrayBuffer], { type: "audio/mpeg" });
    const blobUrl = URL.createObjectURL(blob);
    const audio = new Audio(blobUrl);
    audioRef.current = audio;

    // Set up Web Audio analyser for amplitude fallback
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    setIsSpeaking(true);
    console.log("Speaking started");

    audio.onended = () => {
      stopAnimation();
      URL.revokeObjectURL(blobUrl);
    };

    // Start playback
    await audio.play();

    // Start amplitude animation immediately
    animateAmplitude();

    // Check if Rhubarb succeeded — if so, switch to cue-based
    const cues = await rhubarbPromise;
    if (cues && cues.length > 0) {
      console.log("Switching to Rhubarb cues:", cues.length);
      rhubarbCuesRef.current = cues;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animateWithCues(audio, cues);
    }
  }, [stopAnimation, animateAmplitude, animateWithCues, tryRhubarb]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    stopAnimation();
  }, [stopAnimation]);

  return { currentMouth, isSpeaking, speak, stop };
}
