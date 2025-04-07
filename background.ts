// Import Plasmo's persistent storage utility
import { Storage } from "@plasmohq/storage"

// Initialize the storage instance to read and monitor stored values
const storage = new Storage()

// Set up watchers for changes to specific keys in storage
storage.watch({
  // When the "entered-text" value changes (user typed something), log the new text
  "entered-text": (change) => {
    console.log("User entered text:", change.newValue)
  },
  // When the "groq-suggestion" value changes (AI returned a suggestion), log it
  "groq-suggestion": (change) => {
    console.log("Groq suggestion:", change.newValue)
  }
})

// Indicate that the background script is active
console.log("Background script running.")
