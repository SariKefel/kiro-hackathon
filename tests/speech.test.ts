import { describe, expect, test } from "bun:test";
import {
  appendTranscript,
  describeSpeechError,
  getSpeechRecognitionConstructor,
  splitResults,
  type SpeechRecognitionConstructor,
} from "../src/features/voice/speech";
import { checkInPayloadSchema } from "../src/lib/validations/check-in";

const result = (transcript: string, isFinal: boolean) =>
  Object.assign([{ transcript }], { isFinal });

describe("dictation transcript handling", () => {
  test("adds the transcript after existing text with a single space", () => {
    expect(appendTranscript("Road blocked.", "  two   houses affected ").text).toBe(
      "Road blocked. two houses affected",
    );
    expect(appendTranscript("", "heavy flooding near the bridge").text).toBe(
      "heavy flooding near the bridge",
    );
  });
  test("leaves the message unchanged for empty speech", () => {
    expect(appendTranscript("Existing", "   ")).toEqual({ text: "Existing", truncated: false });
  });
  test("never exceeds the report limit and says when it shortened the text", () => {
    const out = appendTranscript("a".repeat(495), "word word word");
    expect(out.truncated).toBe(true);
    expect(out.text.length).toBeLessThanOrEqual(500);
    expect(
      checkInPayloadSchema.safeParse({
        userId: "demo-user-1",
        safetyStatus: "needs_help",
        message: out.text,
        latitude: null,
        longitude: null,
      }).success,
    ).toBe(true);
  });
  test("does not split an emoji at the limit", () => {
    const out = appendTranscript("a".repeat(498), "😀😀");
    expect(out.text.length).toBeLessThanOrEqual(500);
    expect(/[\uD800-\uDBFF]$/.test(out.text)).toBe(false);
  });
});

describe("speech recognition results and errors", () => {
  test("separates finalized text from text still being revised", () => {
    const parts = splitResults({
      resultIndex: 0,
      results: Object.assign([result("heavy flooding ", true), result("near the", false)], {}),
    });
    expect(parts).toEqual({ final: "heavy flooding", interim: "near the" });
  });
  test("ignores results the browser already delivered", () => {
    const parts = splitResults({
      resultIndex: 1,
      results: Object.assign([result("old text", true), result("new text", true)], {}),
    });
    expect(parts.final).toBe("new text");
  });
  test("maps failures to messages that point back to typing", () => {
    expect(describeSpeechError("aborted")).toBeNull();
    for (const code of ["not-allowed", "service-not-allowed"])
      expect(describeSpeechError(code)).toContain("blocked");
    expect(describeSpeechError("network")).toContain("still type");
    expect(describeSpeechError("audio-capture")).toContain("microphone");
    expect(describeSpeechError("something-new")).toContain("type your report");
  });
  test("detects standard and prefixed browser implementations", () => {
    const Fake = class {} as unknown as SpeechRecognitionConstructor;
    expect(getSpeechRecognitionConstructor({})).toBeNull();
    expect(getSpeechRecognitionConstructor({ webkitSpeechRecognition: Fake })).toBe(Fake);
    expect(getSpeechRecognitionConstructor({ SpeechRecognition: Fake })).toBe(Fake);
  });
});
