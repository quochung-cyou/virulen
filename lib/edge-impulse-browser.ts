// Helper to load Edge Impulse WebAssembly classifier in the browser

let loadPromise: Promise<void> | null = null
let classifierInstance: any | null = null

function loadScript(src: string): Promise<void> {
  if (typeof document === "undefined") return Promise.reject(new Error("Document is not available"))

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") {
        resolve()
      } else {
        existing.addEventListener("load", () => resolve())
        existing.addEventListener("error", () => reject(new Error(`Failed to load script ${src}`)))
      }
      return
    }

    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => {
      script.setAttribute("data-loaded", "true")
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load script ${src}`))
    document.body.appendChild(script)
  })
}

async function ensureLoaded() {
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    await loadScript("/edge-impulse/edge-impulse-standalone.js")
    await loadScript("/edge-impulse/run-impulse.js")
  })()

  return loadPromise
}

export async function getEdgeImpulseClassifier(): Promise<any> {
  if (typeof window === "undefined") throw new Error("Edge Impulse is only available in the browser")

  await ensureLoaded()

  if (!classifierInstance) {
    // Edge Impulse's run-impulse.js defines `class EdgeImpulseClassifier { ... }` at
    // the top level of a classic script. That creates a global *lexical* binding,
    // which is not exposed as window.EdgeImpulseClassifier, but is still accessible
    // by name in the global scope. We use a Function-based lookup so we can
    // reference that binding without modifying the generated files.
    const ctor = (Function(
      'return typeof EdgeImpulseClassifier !== "undefined" ? EdgeImpulseClassifier : undefined;',
    ) as () => any)()

    if (!ctor) {
      throw new Error(
        "EdgeImpulseClassifier constructor not found. Ensure /edge-impulse/edge-impulse-standalone.js and /edge-impulse/run-impulse.js are both loaded.",
      )
    }

    classifierInstance = new ctor()

    if (typeof classifierInstance.init === "function") {
      await classifierInstance.init()
    }
  }

  return classifierInstance
}
