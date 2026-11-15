// Pure helpers for browser speech recognition. They have no React or DOM dependency,
// so the behavior that matters for reports can be tested without a browser.

// The DOM library does not ship SpeechRecognition types, so describe the small surface we use.
export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string };
}
export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionConstructor(
  scope: object,
): SpeechRecognitionConstructor | null {
  const candidate = scope as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

// Separates text the engine has finalized from text it may still revise.
export function splitResults(event: SpeechRecognitionEventLike) {
  let final = "";
  let interim = "";
  for (let i = event.resultIndex; i < event.results.length; i += 1) {
    const result = event.results[i];
    const text = result[0]?.transcript ?? "";
    if (result.isFinal) final += text;
    else interim += text;
  }
  return { final: final.trim(), interim: interim.trim() };
}

// Appends dictated text to what the responder already wrote, never exceeding the report limit.
export function appendTranscript(current: string, transcript: string, maxLength = 500) {
  const addition = transcript.replace(/\s+/g, " ").trim();
  if (!addition) return { text: current, truncated: false };
  const base = current.trimEnd();
  const joined = base ? `${base} ${addition}` : addition;
  if (joined.length <= maxLength) return { text: joined, truncated: false };
  let cut = joined.slice(0, maxLength);
  // Do not leave half of a surrogate pair at the end.
  if (/[\uD800-\uDBFF]$/.test(cut)) cut = cut.slice(0, -1);
  return { text: cut.trimEnd(), truncated: true };
}

// Returns a plain-language message, or null for events that are not errors for the user.
export function describeSpeechError(code: string): string | null {
  switch (code) {
    case "aborted":
      return null;
    case "no-speech":
      return "No speech was heard. Tap the microphone and try again, or type your report.";
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. Allow it in your browser's site settings, or type your report.";
    case "audio-capture":
      return "No microphone was found. You can type your report instead.";
    case "network":
      return "Voice input needs an internet connection. You can still type your report and save it on this device.";
    case "language-not-supported":
      return "Your browser cannot transcribe this language. You can type your report instead.";
    default:
      return "Voice input stopped unexpectedly. You can type your report instead.";
  }
}
