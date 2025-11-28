"use client"

import React from "react"

export type Detection = {
  label: string
  value: number
  x: number
  y: number
  width: number
  height: number
}

interface DetectionOverlayProps {
  detections: Detection[]
  modelInputSize: { width: number; height: number } | null
  videoSize: { width: number; height: number } | null
  debug?: boolean
}

export function DetectionOverlay({ detections, modelInputSize, videoSize, debug = true }: DetectionOverlayProps) {
  if (!debug || !modelInputSize || !videoSize || detections.length === 0) return null

  const canvasW = modelInputSize.width
  const canvasH = modelInputSize.height
  const videoW = videoSize.width
  const videoH = videoSize.height

  if (canvasW === 0 || canvasH === 0 || videoW === 0 || videoH === 0) return null

  const widthFactor = canvasW / videoW
  const heightFactor = canvasH / videoH

  return (
    <div className="absolute inset-0 pointer-events-none">
      {detections.map((det, index) => {
        const x = det.x / widthFactor
        const y = det.y / heightFactor
        const w = det.width / widthFactor
        const h = det.height / heightFactor

        return (
          <div
            key={index}
            className="absolute border-2 border-primary rounded-lg shadow-glow-primary/50"
            style={{ left: x, top: y, width: w, height: h }}
          >
            <div className="absolute -top-5 left-0 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">
              {det.label} {(det.value * 100).toFixed(0)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}
