// Import the Plasmo content script configuration type
import type { PlasmoCSConfig } from "plasmo"

// Import Plasmo's storage utility
import { Storage } from "@plasmohq/storage"

// Initialize storage to persist values across extension events
const storage = new Storage()

// Configure this content script to run on all URLs
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Function to get a word suggestion from the Groq API based on user input
const fetchGroqSuggestion = async (text: string) => {
  const GROQ_API_KEY =
    "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" // Replace with your actual API key

  console.log("Fetching suggestion from Groq for:", text)

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: text
            },
            {
              role: "system",
              content:
                "You are the world's most advanced auto-complete AI for the English language. Based on the given text, predict and suggest the next 1 to 5 words (it can be any number of words between 1 and 5) that form the most natural and contextually appropriate continuation. Provide only one concise, high-confidence suggestion without listing alternatives."
            }
          ],
          max_tokens: 30
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("Groq API Error:", data)
      return ""
    }

    if (data.choices && data.choices.length > 0) {
      console.log("Groq response:", data.choices[0].message.content)
      return data.choices[0].message.content
    }

    return ""
  } catch (error) {
    console.error("Error fetching from Groq:", error)
    return ""
  }
}

// Utility function to measure text width using a canvas
function measureTextWidth(text: string, font: string): number {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return 0
  ctx.font = font
  return ctx.measureText(text).width
}

/**
 * Creates a hidden mirror container for a textarea.
 * The mirror replicates the textarea’s style and wrapping,
 * but the actual mirrored text is hidden (its color is set to transparent).
 * The ghost suggestion (blue, italic text) is appended separately.
 */
function createGhostOverlayForTextarea(textarea: HTMLTextAreaElement) {
  const mirror = document.createElement("div")
  const mirrorText = document.createElement("span")
  const suggestionSpan = document.createElement("span")

  const style = window.getComputedStyle(textarea)

  // Set up the mirror div with matching style and dimensions.
  mirror.style.position = "absolute"
  mirror.style.top = textarea.offsetTop + "px"
  mirror.style.left = textarea.offsetLeft + "px"
  mirror.style.width = textarea.clientWidth + "px"
  mirror.style.height = textarea.clientHeight + "px"
  mirror.style.overflow = "hidden"
  mirror.style.whiteSpace = "pre-wrap"
  mirror.style.wordWrap = "break-word"
  mirror.style.padding = style.padding
  mirror.style.border = style.border
  mirror.style.fontSize = style.fontSize
  mirror.style.fontFamily = style.fontFamily
  mirror.style.lineHeight = style.lineHeight
  // Hide the mirror container itself (but we will use it for measurement)
  mirror.style.visibility = "hidden"

  // Set up mirrorText to hold the textarea's text but hide it.
  // mirrorText.style.color = "transparent" // hide the text
  // mirrorText.style.whiteSpace = "pre-wrap"
  // mirrorText.textContent = textarea.value

  // Set up the mirrorText span to hold the textarea's text.
  mirrorText.style.color = "transparent" // Hide the text while preserving layout
  mirrorText.style.whiteSpace = "pre-wrap"
  // Explicitly copy font-related styles:
  mirrorText.style.fontFamily = style.fontFamily
  mirrorText.style.fontSize = style.fontSize
  mirrorText.style.lineHeight = style.lineHeight
  mirrorText.textContent = textarea.value

  // Set up suggestionSpan for the ghost suggestion.
  // suggestionSpan.style.color = "blue"
  // suggestionSpan.style.opacity = "0.5"
  // suggestionSpan.style.fontStyle = "italic"
  // suggestionSpan.style.userSelect = "none"
  // suggestionSpan.style.whiteSpace = "pre"
  // suggestionSpan.textContent = ""

  // Set up the suggestion span with matching font properties.
  suggestionSpan.style.color = "gray"
  suggestionSpan.style.opacity = "0.5"
  suggestionSpan.style.fontStyle = "italic"
  suggestionSpan.style.userSelect = "none"
  suggestionSpan.style.whiteSpace = "pre"
  // Copy font-related styles from the textarea (optional, to match mirrorText)
  suggestionSpan.style.fontFamily = style.fontFamily
  suggestionSpan.style.fontSize = style.fontSize
  suggestionSpan.style.lineHeight = style.lineHeight
  suggestionSpan.textContent = ""

  // Append mirrorText and suggestionSpan to the mirror.
  mirror.appendChild(mirrorText)
  mirror.appendChild(suggestionSpan)

  // Append the mirror to the textarea's parent.
  textarea.parentElement?.appendChild(mirror)

  // Keep mirror dimensions in sync.
  const resizeObserver = new ResizeObserver(() => {
    mirror.style.width = textarea.clientWidth + "px"
    mirror.style.height = textarea.clientHeight + "px"
  })
  resizeObserver.observe(textarea)

  return { mirror, mirrorText, suggestionSpan }
}

/**
 * Creates a ghost overlay for <input> elements.
 * (For inputs, no mirror is needed since there's no soft wrapping.)
 */
const createGhostOverlay = (
  inputElement: HTMLInputElement | HTMLTextAreaElement
): HTMLSpanElement => {
  const overlay = document.createElement("span")
  overlay.style.position = "absolute"
  overlay.style.color = "blue"
  overlay.style.pointerEvents = "visible"
  overlay.style.opacity = "1"
  overlay.style.fontSize = window.getComputedStyle(inputElement).fontSize
  overlay.style.fontFamily = window.getComputedStyle(inputElement).fontFamily
  overlay.style.userSelect = "none"
  // Make overlay visible by default
  overlay.style.display = "inline"

  // Ensure the parent is positioned relatively.
  const parent = inputElement.parentElement
  if (parent) {
    const parentStyle = window.getComputedStyle(parent)
    if (parentStyle.position === "static") {
      parent.style.position = "relative"
    }
    parent.appendChild(overlay)
  }
  return overlay
}

// Update position for an <input> element.
function updateInputOverlayPosition(
  inputElement: HTMLInputElement,
  ghostOverlay: HTMLSpanElement
) {
  const rect = inputElement.getBoundingClientRect()
  const parent = inputElement.parentElement || document.body
  const parentRect = parent.getBoundingClientRect()
  const font = window.getComputedStyle(inputElement).font
  const textWidth = measureTextWidth(inputElement.value, font)

  console.log("Input rect.left:", rect.left)
  console.log("Parent rect.left:", parentRect.left)
  console.log("Text width:", textWidth)
  // Position the ghost overlay relative to the parent.
  ghostOverlay.style.left = `${rect.left - parentRect.left + textWidth + 5}px`
  ghostOverlay.style.top = `${rect.top - parentRect.top}px`
}

// Update position for a <textarea> using the hidden mirror.
function updateTextareaOverlayPosition(
  textarea: HTMLTextAreaElement,
  mirrorText: HTMLSpanElement,
  ghostOverlay: HTMLSpanElement
) {
  const style = window.getComputedStyle(textarea)
  const rect = textarea.getBoundingClientRect()
  const parent = textarea.parentElement || document.body
  const parentRect = parent.getBoundingClientRect()
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize)
  const paddingLeft = parseFloat(style.paddingLeft) || 0
  const paddingTop = parseFloat(style.paddingTop) || 0

  // Update mirrorText to match the textarea's content.
  mirrorText.textContent = textarea.value

  // Use a Range to measure the width of the last rendered line.
  const range = document.createRange()
  range.selectNodeContents(mirrorText)
  range.collapse(false) // collapse to the end
  const rects = range.getClientRects()
  let lastLineWidth = 0
  if (rects.length > 0) {
    lastLineWidth = rects[rects.length - 1].width
  }

  // Position the ghost overlay based on the mirror measurement.
  ghostOverlay.style.left = `${rect.left - parentRect.left + paddingLeft + lastLineWidth + 5}px`
  const numLines = mirrorText.textContent.split("\n").length
  ghostOverlay.style.top = `${rect.top - parentRect.top + paddingTop + (numLines - 1) * lineHeight}px`
}

window.addEventListener("load", () => {
  console.log("Plasmo extension active")

  const elements = document.querySelectorAll("input, textarea")
  elements.forEach((element) => {
    if (
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      )
    )
      return

    let ghostOverlay: HTMLSpanElement
    let currentSuggestion = ""
    let mirrorTextNode: HTMLSpanElement | null = null
    let mirrorContainer: HTMLDivElement | null = null

    if (element instanceof HTMLTextAreaElement) {
      // Use the hidden mirror approach for textareas.
      const { mirror, mirrorText, suggestionSpan } =
        createGhostOverlayForTextarea(element)
      mirrorContainer = mirror
      mirrorTextNode = mirrorText
      ghostOverlay = suggestionSpan

      // Optionally show the mirror on focus (it remains hidden because its text is transparent).
      element.addEventListener("focus", () => {
        mirrorContainer.style.visibility = "visible"
      })
      element.addEventListener("blur", () => {
        // You can hide the mirror if desired.
        // mirrorContainer.style.visibility = "hidden"
      })
    } else {
      ghostOverlay = createGhostOverlay(element)
    }

    // Show ghost overlay on focus.
    element.addEventListener("focus", () => {
      ghostOverlay.style.display = "inline"
    })
    // Optionally hide it on blur.
    element.addEventListener("blur", () => {
      ghostOverlay.style.display = "inline"
    })

    element.addEventListener("input", async (event: InputEvent) => {
      if (document.activeElement !== element) return
      const enteredText = element.value
      storage.set("entered-text", enteredText)

      if (enteredText.trim() === "") {
        ghostOverlay.textContent = ""
        return
      }

      // Update ghost overlay position based on element type.
      if (element instanceof HTMLInputElement) {
        updateInputOverlayPosition(element, ghostOverlay)
      } else if (element instanceof HTMLTextAreaElement && mirrorTextNode) {
        updateTextareaOverlayPosition(element, mirrorTextNode, ghostOverlay)
      }

      // When space is pressed, get suggestion from Groq API.
      if (event.inputType === "insertText" && event.data === " ") {
        console.log("Spacebar pressed! Sending text to Groq:", enteredText)
        currentSuggestion = await fetchGroqSuggestion(enteredText)
        console.log("Groq suggestion received:", currentSuggestion)
        storage.set("groq-suggestion", currentSuggestion)
        ghostOverlay.textContent = currentSuggestion

        // Update overlay position again after setting the suggestion.
        if (element instanceof HTMLInputElement) {
          updateInputOverlayPosition(element, ghostOverlay)
        } else if (element instanceof HTMLTextAreaElement && mirrorTextNode) {
          updateTextareaOverlayPosition(element, mirrorTextNode, ghostOverlay)
        }
      }
    })

    element.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Tab" && currentSuggestion) {
        event.preventDefault()
        element.value += " " + currentSuggestion
        ghostOverlay.textContent = ""
        currentSuggestion = ""
      }
    })

    storage.watch({
      "groq-suggestion": (change) => {
        ghostOverlay.textContent = change.newValue || ""
      }
    })
  })
})
