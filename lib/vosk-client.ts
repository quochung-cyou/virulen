// Simple Vosk-browser helper for lazy model loading and recognizer creation.
// Vosk is loaded via a CDN script and exposed as window.Vosk on the client.
// The actual model file is expected at "/vosk/model-en-small.tar.gz" under public/.

let modelPromise: Promise<any> | null = null

export function getVoskModel() {
  if (!modelPromise) {
    if (typeof window === "undefined") {
      throw new Error("Vosk model cannot be created on the server side")
    }
    const VoskGlobal = (window as any).Vosk
    if (!VoskGlobal) {
      throw new Error("window.Vosk is not available. Ensure the Vosk CDN script is loaded.")
    }
    modelPromise = VoskGlobal.createModel("/virulen/vosk/model-en-small.tar.gz")
  }
  return modelPromise
}

export async function createVoskRecognizer() {
  const model = await getVoskModel()
  const recognizer = new (model as any).KaldiRecognizer()
  return recognizer
}
