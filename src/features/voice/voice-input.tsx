"use client";
import { useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/features/voice/use-speech-recognition";

// Optional dictation for the message field. It only fills the field. Saving stays with the form.
export function VoiceInput({
  onTranscript,
  online,
  disabled,
}: {
  onTranscript: (text: string) => void;
  online: boolean | null;
  disabled: boolean;
}) {
  const { supported, listening, interim, error, start, stop, abort } =
    useSpeechRecognition(onTranscript);
  useEffect(() => {
    if (disabled) abort();
  }, [disabled, abort]);
  // Browsers without speech recognition simply keep the normal text field.
  if (!supported) return null;
  const offline = online === false;
  return (
    <div className="mt-3">
      <Button
        type="button"
        variant={listening ? "destructive" : "outline"}
        className="min-h-11 w-full"
        aria-pressed={listening}
        disabled={disabled || (offline && !listening)}
        onClick={listening ? stop : start}
      >
        {listening ? <Square className="size-4" /> : <Mic className="size-4" />}
        {listening ? "Stop recording" : "Dictate message"}
      </Button>
      <div role="status" aria-live="polite" className="mt-2 text-xs leading-5">
        {listening && (
          <p className="font-semibold text-red-800 dark:text-red-300">
            <span
              aria-hidden="true"
              className="mr-2 inline-block size-2 rounded-full bg-red-600 motion-safe:animate-pulse"
            />
            Recording. Speak now, then tap Stop.
          </p>
        )}
        {listening && interim && <p className="mt-1 text-muted-foreground">Hearing: {interim}</p>}
      </div>
      {offline && !listening && (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Voice input needs a connection. You can still type your report.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-300">
          {error}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
        Your browser&apos;s speech service may process the audio online. The text is added above for
        you to review. Nothing is saved until you save the check-in.
      </p>
    </div>
  );
}
