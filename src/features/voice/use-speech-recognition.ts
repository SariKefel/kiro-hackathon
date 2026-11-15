"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  describeSpeechError,
  getSpeechRecognitionConstructor,
  splitResults,
  type SpeechRecognitionLike,
} from "@/features/voice/speech";

const subscribeNever = () => () => {};

export function useSpeechRecognition(onFinalTranscript: (text: string) => void) {
  // False on the server and during hydration, so markup matches before the browser is inspected.
  const supported = useSyncExternalStore(
    subscribeNever,
    () => getSpeechRecognitionConstructor(window) !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const latestCallback = useRef(onFinalTranscript);
  useEffect(() => {
    latestCallback.current = onFinalTranscript;
  });

  const start = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor(window);
    if (!Recognition || recognition.current) return;
    setError(null);
    setInterim("");
    const instance = new Recognition();
    instance.lang = navigator.language || "en-US";
    // One utterance per session is the most reliable setting on mobile browsers.
    instance.continuous = false;
    instance.interimResults = true;
    instance.maxAlternatives = 1;
    instance.onstart = () => setListening(true);
    instance.onresult = (event) => {
      const { final, interim: pending } = splitResults(event);
      if (final) latestCallback.current(final);
      setInterim(pending);
    };
    instance.onerror = (event) => {
      const message = describeSpeechError(event.error);
      if (message) setError(message);
    };
    instance.onend = () => {
      recognition.current = null;
      setListening(false);
      setInterim("");
    };
    recognition.current = instance;
    try {
      instance.start();
    } catch {
      recognition.current = null;
      setError("Voice input could not start. You can type your report instead.");
    }
  }, []);
  // stop() keeps what was already heard; abort() discards it.
  const stop = useCallback(() => recognition.current?.stop(), []);
  const abort = useCallback(() => recognition.current?.abort(), []);
  useEffect(
    () => () => {
      const active = recognition.current;
      if (!active) return;
      active.onresult = null;
      active.onerror = null;
      active.onend = null;
      active.abort();
      recognition.current = null;
    },
    [],
  );

  return { supported, listening, interim, error, start, stop, abort };
}
