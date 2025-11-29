"use client"

import { useEffect } from "react"

export function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    // Register the custom service worker for PWA capabilities
    const basePath = window.location.pathname.startsWith("/virulen") ? "/virulen" : ""

    navigator.serviceWorker
      .register(`${basePath}/sw.js`)
      .catch((err) => {
        console.error("Service worker registration failed", err)
      })
  }, [])

  return null
}
