"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Play, RotateCcw, Volume2 } from "lucide-react"
import { createVoskRecognizer, getVoskModel } from "@/lib/vosk-client"

interface AudioRecorderProps {
  targetText: string
  label?: string
}

export function AudioRecorder({ targetText, label }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [feedback, setFeedback] = useState<"idle" | "good" | "try-again">("idle")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognizerRef = useRef<any | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [recognizedText, setRecognizedText] = useState("")
  const [partialText, setPartialText] = useState("")
  const [fluencyScore, setFluencyScore] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let cancelled = false
    let attempts = 0
    const maxAttempts = 50 // e.g. ~10s if interval is 200ms

    const tick = () => {
      if (cancelled) return
      attempts += 1

      const hasVosk = typeof (window as any).Vosk !== "undefined"
      if (hasVosk) {
        getVoskModel()
          .then(() => {
            console.log("[AudioRecorder] Vosk model preloaded")
          })
          .catch((e) => {
            console.error("[AudioRecorder] Failed to preload Vosk model", e)
          })
        return
      }

      if (attempts < maxAttempts) {
        setTimeout(tick, 200)
      } else {
        console.warn("[AudioRecorder] Vosk script not detected after waiting; will load on first record click")
      }
    }

    setTimeout(tick, 0)

    return () => {
      cancelled = true
    }
  }, [])

  const computeFluencyScore = (target: string, recognized: string): number => {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
    const targetTokens = normalize(target)
    const recTokens = normalize(recognized)
    if (!targetTokens.length || !recTokens.length) return 0
    const targetSet = new Set(targetTokens)
    let matches = 0
    for (const t of recTokens) {
      if (targetSet.has(t)) matches++
    }
    const ratio = matches / targetTokens.length
    return Math.max(0, Math.min(1, ratio)) * 100
  }

  const startRecording = async () => {
    try {
      console.log("[AudioRecorder] startRecording: begin")
      setIsPreparing(true)
      console.log("[AudioRecorder] requesting getUserMedia...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      })
      console.log("[AudioRecorder] getUserMedia resolved", {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      if (!recognizerRef.current) {
        try {
          console.log("[AudioRecorder] creating Vosk recognizer...")
          const recognizer = await createVoskRecognizer()
          console.log("[AudioRecorder] Vosk recognizer created")
          recognizer.on("result", (message: any) => {
            const text = message?.result?.text ?? ""
            setRecognizedText(text)
            setPartialText("")
            const score = computeFluencyScore(targetText, text)
            setFluencyScore(score)
            console.log("[AudioRecorder] Vosk result", { targetText, text, score })
            if (score >= 70) {
              setFeedback("good")
            } else {
              setFeedback("try-again")
            }
          })
          recognizer.on("partialresult", (message: any) => {
            const text = message?.result?.partial ?? ""
            setPartialText(text)
          })
          recognizerRef.current = recognizer
        } catch (e) {
          console.error("Failed to create Vosk recognizer", e)
          recognizerRef.current = null
        }
      }

      if (!recognizerRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setIsPreparing(false)
        alert("Speech recognition model is not available right now. Please check your connection and reload the page.")
        return
      }

      const audioContext = new AudioContext()
      console.log("[AudioRecorder] AudioContext created", { sampleRate: audioContext.sampleRate })
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processor.onaudioprocess = (event) => {
        if (!recognizerRef.current) return
        try {
          recognizerRef.current.acceptWaveform(event.inputBuffer)
        } catch (error) {
          console.error("acceptWaveform failed", error)
        }
      }
      source.connect(processor)
      processor.connect(audioContext.destination)

      audioContextRef.current = audioContext
      sourceRef.current = source
      processorRef.current = processor

      console.log("[AudioRecorder] starting MediaRecorder...")
      mediaRecorder.start()
      console.log("[AudioRecorder] MediaRecorder started")
      setIsRecording(true)
      setIsPreparing(false)
      setFeedback("idle")
      setRecognizedText("")
      setPartialText("")
      setFluencyScore(null)
    } catch (error) {
      console.error("[AudioRecorder] Error in startRecording:", error)
      alert("Unable to access microphone. Please check permissions.")
      setIsRecording(false)
      setIsPreparing(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (processorRef.current && audioContextRef.current) {
        processorRef.current.disconnect()
        sourceRef.current?.disconnect()
        audioContextRef.current.close().catch(() => {})
      }
      processorRef.current = null
      sourceRef.current = null
      audioContextRef.current = null
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }

  const playRecording = () => {
    // Big play button has been removed; rely on the native audio controls.
    // This function is kept only to avoid unused-code warnings if referenced.
  }

  const resetRecording = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch {}
    }
    setAudioUrl(null)
    setIsPlaying(false)
    setFeedback("idle")
    setRecognizedText("")
    setPartialText("")
    setFluencyScore(null)
  }

  const renderHighlightedTarget = () => {
    const normalizeToken = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
    const recTokens = new Set(
      targetText
        ? recognizedText
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(Boolean)
        : [],
    )

    const parts = targetText.split(/(\s+)/)

    return parts.map((part, idx) => {
      if (/^\s+$/.test(part)) {
        return part
      }
      const normalized = normalizeToken(part)
      const matched = normalized && recTokens.has(normalized)
      const baseColor =
        feedback === "good"
          ? "text-green-700"
          : feedback === "try-again"
            ? matched
              ? "text-green-700"
              : "text-foreground"
            : matched
              ? "text-green-700"
              : "text-foreground"
      return (
        <span key={idx} className={baseColor}>
          {part}
        </span>
      )
    })
  }

  const speakWord = () => {
    const utterance = new SpeechSynthesisUtterance(targetText)
    utterance.lang = "en-US"
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }

  const feedbackColors = {
    idle: "border-muted",
    good: "border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.3)]",
    "try-again": "border-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.3)]",
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Practice Pronunciation</h3>
        <button
          onClick={speakWord}
          className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          Listen
        </button>
      </div>

      {/* Main recording button */}
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          {/* Feedback ring */}
          <div
            className={`absolute -inset-2 rounded-full border-4 transition-all duration-500 ${feedbackColors[feedback]}`}
          />

          {/* Pulse animation when recording */}
          {isRecording && <div className="absolute -inset-4 rounded-full bg-destructive/20 animate-pulse-ring" />}

          {!audioUrl ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isPreparing}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? "bg-destructive scale-110"
                  : isPreparing
                    ? "bg-primary/70"
                    : "bg-primary hover:scale-105"
              }`}
            >
              {isRecording ? (
                <Square className="w-7 h-7 text-destructive-foreground" />
              ) : (
                <Mic className="w-8 h-8 text-primary-foreground" />
              )}
            </button>
          ) : null}
        </div>

        {/* Feedback message */}
        {feedback !== "idle" && audioUrl && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-2 ${
              feedback === "good" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            }`}
          >
            {feedback === "good" ? "Great pronunciation! 🎉" : "Try again! 💪"}
          </div>
        )}

        {/* Target text (what to speak) */}
        <p className="text-[11px] text-center text-muted-foreground mb-0.5">
          {label || "Target"}
        </p>
        <p
          className={`text-base text-center font-semibold mb-1 leading-snug ${
            feedback === "good"
              ? "text-green-700"
              : feedback === "try-again"
                ? "text-orange-700"
                : "text-foreground"
          }`}
        >
          {renderHighlightedTarget()}
        </p>

        <p className="text-sm text-center text-muted-foreground">
          {isPreparing
            ? "Preparing microphone..."
            : isRecording
              ? "Recording... Tap to stop"
              : audioUrl
                ? "Tap play to hear your recording"
                : "Tap the microphone to record yourself"}
        </p>
        {(recognizedText || partialText) && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Recognized: <span className="font-medium text-foreground">{recognizedText || partialText}</span>
          </p>
        )}
        {fluencyScore !== null && (
          <p className="text-xs text-center text-muted-foreground mt-1">
            Fluency score: <span className="font-semibold text-foreground">{Math.round(fluencyScore)}%</span>
          </p>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          controls
          className="w-full mt-2"
        />
      )}
    </div>
  )
}
