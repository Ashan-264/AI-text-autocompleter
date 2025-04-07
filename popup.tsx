// Import necessary React hooks
import { useEffect, useState } from "react"

// Import Plasmo's storage utility for persistent state across extension components
import { Storage } from "@plasmohq/storage"

// Create a new storage instance to interact with shared state
const storage = new Storage()

// Main popup component shown when the extension icon is clicked
function IndexPopup() {
  // React state to store the user's typed input
  const [data, setData] = useState("")

  // React state to store the AI's suggested next words
  const [suggestion, setSuggestion] = useState("")

  // Runs when the component is mounted
  useEffect(() => {
    // Async function to retrieve previously stored values from storage
    const fetchStoredData = async () => {
      const storedText = await storage.get("entered-text") // Get the user input
      const storedSuggestion = await storage.get("groq-suggestion") // Get the AI suggestion

      // Set local state from stored values or fallbacks
      setData(storedText || "")
      setSuggestion(storedSuggestion || "No suggestion yet.")
    }

    fetchStoredData()

    // Subscribe to updates in storage so we can live update the popup
    storage.watch({
      // Update state when the user input changes
      "entered-text": (change) => {
        setData(change.newValue)
      },
      // Update state when the suggestion changes
      "groq-suggestion": (change) => {
        setSuggestion(change.newValue)
      }
    })
  }, []) // Run only once on mount

  // Render the popup UI
  return (
    <div style={{ padding: 16 }}>
      <h2>Welcome to your Auto Text Completion Extension!</h2>

      {/* Display user's typed input */}
      <p>Text being typed on the webpage is:</p>
      <div style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
        {data || "No text entered yet."}
      </div>

      {/* Display AI's next word suggestion */}
      <p>Next Word Suggestion:</p>
      <div style={{ fontWeight: "bold", color: "green" }}>
        {suggestion || "Waiting for suggestion..."}
      </div>

      <p>Model being used: llama-3.3-70b-versatile </p>

      {/* Link to documentation */}
      <a
        href="https://docs.plasmo.com"
        target="_blank"
        rel="noopener noreferrer">
        Github Docs
      </a>
    </div>
  )
}

export default IndexPopup
