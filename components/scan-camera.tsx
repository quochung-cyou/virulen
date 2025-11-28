"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import type { WordCard } from "@/lib/word-data"
import { getEdgeImpulseClassifier } from "@/lib/edge-impulse-browser"
import { packImageToEiFeatures } from "@/lib/ei-image"
import { DetectionOverlay, type Detection } from "@/components/detection-overlay"
import { findCardByLabel } from "@/lib/card-dictionary"
import { createWordCardInstance } from "@/lib/card-types"

interface ScanCameraProps {
  onWordFound?: (word: WordCard) => void
  onCurrentFrameCards?: (items: { card: WordCard; confidence: number; imageDataUrl?: string }[]) => void
}

export function ScanCamera({ onWordFound, onCurrentFrameCards }: ScanCameraProps) {
  const DEBUG_BOUNDING_BOXES = true
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [modelInputSize, setModelInputSize] = useState<{ width: number; height: number } | null>(null)
  const [autoScanEnabled] = useState(true)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewRef = useRef<HTMLDivElement | null>(null)
  const classifierRef = useRef<any | null>(null)
  const [viewSize, setViewSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    const setup = async () => {
      try {
        setScanError(null)

        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices ||
          typeof navigator.mediaDevices.getUserMedia !== "function"
        ) {
          setScanError("Camera not supported in this browser")
          return
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            const playPromise = videoRef.current.play()
            if (playPromise && typeof playPromise.then === "function") {
              await playPromise.catch((err: any) => {
                if (err?.name !== "AbortError") {
                  throw err
                }
              })
            }
          } catch (err) {
            console.warn("Video play() failed", err)
          }
          if (viewRef.current) {
            setViewSize({ width: viewRef.current.clientWidth, height: viewRef.current.clientHeight })
          }
        }

        const classifier = await getEdgeImpulseClassifier()
        classifierRef.current = classifier

        try {
          const props = classifier.getProperties()
          console.log("[Scan] classifier properties", props)

          if (props && props.input_width && props.input_height) {
            setModelInputSize({ width: props.input_width, height: props.input_height })
          }

          // Loosen object detection threshold so we get more boxes back
          if (typeof (classifier as any).setThreshold === "function" && Array.isArray(props?.thresholds)) {
            const odBlock = props.thresholds[0]
            if (odBlock && typeof odBlock.id !== "undefined") {
              try {
                ;(classifier as any).setThreshold({ id: odBlock.id, min_score: 0.1 })
                console.log("[Scan] setThreshold for block", odBlock.id, "min_score=0.1")
              } catch (err) {
                console.warn("[Scan] setThreshold failed", err)
              }
            }
          }
        } catch (e) {
          console.error("Failed to get classifier properties", e)
        }
      } catch (e: any) {
        console.error(e)
        setScanError(e?.message ?? "Unable to start camera or model")
      }
    }

    setup()

    const handleResize = () => {
      if (viewRef.current) {
        setViewSize({ width: viewRef.current.clientWidth, height: viewRef.current.clientHeight })
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const processDetectionsForCards = useCallback(
    (detectionsResult: Detection[], frameImageDataUrl?: string) => {
      if (!detectionsResult.length) return

      const frameItems: { card: WordCard; confidence: number; imageDataUrl?: string }[] = []
      const seenInFrame = new Set<string>()

      for (const d of detectionsResult) {
        const entry = findCardByLabel(d.label)
        if (!entry) continue

        const id = entry.id
        const card = createWordCardInstance(entry)

        if (!seenInFrame.has(id)) {
          seenInFrame.add(id)
          frameItems.push({ card, confidence: d.value, imageDataUrl: frameImageDataUrl })
        }

        if (onWordFound) {
          onWordFound(card)
        }
      }

      if (onCurrentFrameCards) {
        onCurrentFrameCards(frameItems)
      }
    },
    [onWordFound, onCurrentFrameCards],
  )

  // Simple per-label Non-Maximum Suppression to avoid overlapping boxes
  const applyNms = useCallback((input: Detection[]): Detection[] => {
    if (!input.length) return []

    // Group detections by label so different objects don't suppress each other
    const byLabel = new Map<string, Detection[]>()
    for (const d of input) {
      const arr = byLabel.get(d.label) ?? []
      arr.push(d)
      byLabel.set(d.label, arr)
    }

    const iou = (a: Detection, b: Detection) => {
      const ax1 = a.x
      const ay1 = a.y
      const ax2 = a.x + a.width
      const ay2 = a.y + a.height

      const bx1 = b.x
      const by1 = b.y
      const bx2 = b.x + b.width
      const by2 = b.y + b.height

      const ix1 = Math.max(ax1, bx1)
      const iy1 = Math.max(ay1, by1)
      const ix2 = Math.min(ax2, bx2)
      const iy2 = Math.min(ay2, by2)

      const iw = Math.max(0, ix2 - ix1)
      const ih = Math.max(0, iy2 - iy1)
      const inter = iw * ih

      if (inter <= 0) return 0

      const areaA = a.width * a.height
      const areaB = b.width * b.height
      const union = areaA + areaB - inter
      if (union <= 0) return 0

      return inter / union
    }

    const nmsThreshold = 0.5
    const kept: Detection[] = []

    for (const group of byLabel.values()) {
      const sorted = [...group].sort((a, b) => b.value - a.value)
      const localKept: Detection[] = []

      for (const det of sorted) {
        let overlapped = false
        for (const keptDet of localKept) {
          if (iou(det, keptDet) > nmsThreshold) {
            overlapped = true
            break
          }
        }
        if (!overlapped) {
          localKept.push(det)
        }
      }

      kept.push(...localKept)
    }

    return kept
  }, [])

  const runScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !classifierRef.current || !modelInputSize) {
      return
    }

    try {
      setIsScanning(true)
      setScanError(null)
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true } as any) as CanvasRenderingContext2D | null
      if (!ctx) {
        throw new Error("Unable to get canvas context")
      }

      const targetWidth = modelInputSize.width
      const targetHeight = modelInputSize.height

      canvas.width = targetWidth
      canvas.height = targetHeight

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight)

      let frameImageDataUrl: string | undefined
      try {
        frameImageDataUrl = canvas.toDataURL("image/jpeg", 0.85)
      } catch (err) {
        console.warn("[Scan] toDataURL failed", err)
      }

      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const features = packImageToEiFeatures(imageData, targetWidth, targetHeight)

      const result = classifierRef.current.classify(features)
      console.log("[Scan] classify result", result)

      const detectionsResult: Detection[] = Array.isArray(result?.results)
        ? result.results
            .filter((d: any) => typeof d.x === "number" && typeof d.y === "number")
            .map((d: any) => ({
              label: d.label,
              value: d.value,
              x: d.x,
              y: d.y,
              width: d.width,
              height: d.height,
            }))
        : []
      const nmsDetections = applyNms(detectionsResult)
      setDetections(nmsDetections)
      processDetectionsForCards(nmsDetections, frameImageDataUrl)
    } catch (e: any) {
      console.error(e)
      setScanError(e?.message ?? "Scan failed")
    } finally {
      setIsScanning(false)
    }
  }, [modelInputSize, processDetectionsForCards, applyNms])

  useEffect(() => {
    if (!autoScanEnabled) return

    let cancelled = false

    const loop = async () => {
      while (!cancelled) {
        await runScan()
        await new Promise((resolve) => setTimeout(resolve, 400))
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loop()

    return () => {
      cancelled = true
    }
  }, [autoScanEnabled, runScan])

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
      {/* Camera viewfinder background */}
      <div ref={viewRef} className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover opacity-60"
          playsInline
          autoPlay
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        <DetectionOverlay
          detections={detections}
          modelInputSize={modelInputSize}
          videoSize={viewSize}
          debug={DEBUG_BOUNDING_BOXES}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`relative w-48 h-48 transition-all duration-500 ${isScanning ? "animate-breathe" : ""}`}>
          {/* Corner brackets with glow - smaller */}
          <div
            className={`absolute -top-1 -left-1 w-10 h-10 border-t-[2px] border-l-[2px] rounded-tl-xl transition-all duration-300 ${
              isScanning ? "border-primary shadow-glow-primary" : "border-foreground/30"
            }`}
          />
          <div
            className={`absolute -top-1 -right-1 w-10 h-10 border-t-[2px] border-r-[2px] rounded-tr-xl transition-all duration-300 ${
              isScanning ? "border-primary shadow-glow-primary" : "border-foreground/30"
            }`}
          />
          <div
            className={`absolute -bottom-1 -left-1 w-10 h-10 border-b-[2px] border-l-[2px] rounded-bl-xl transition-all duration-300 ${
              isScanning ? "border-primary shadow-glow-primary" : "border-foreground/30"
            }`}
          />
          <div
            className={`absolute -bottom-1 -right-1 w-10 h-10 border-b-[2px] border-r-[2px] rounded-br-xl transition-all duration-300 ${
              isScanning ? "border-primary shadow-glow-primary" : "border-foreground/30"
            }`}
          />

          {/* Scan line */}
          {isScanning && (
            <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
          )}
        </div>
      </div>

      {/* Scanning status overlay */}
      {isScanning && (
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="glass px-4 py-2 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-medium text-foreground">Scanning...</span>
          </div>
        </div>
      )}

      {scanError && !isScanning && (
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="glass px-3 py-1.5 rounded-full text-[10px] text-destructive bg-background/80 border border-destructive/40">
            {scanError}
          </div>
        </div>
      )}

      {/* Shutter Button (now just a reset) */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
        {detections.length > 0 ? (
          <button
            onClick={() => setDetections([])}
            className="w-14 h-14 rounded-full glass flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <RotateCcw className="w-6 h-6 text-foreground" />
          </button>
        ) : (
          <div className="w-14 h-14 rounded-full glass flex items-center justify-center opacity-40">
            <div className="w-6 h-6 rounded-full bg-foreground/20" />
          </div>
        )}
      </div>

    </div>
  )
}
