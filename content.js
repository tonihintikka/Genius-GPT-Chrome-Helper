const API_URL = "https://api.openai.com/v1/engines/davinci-codex/completions";
let apiKey = "";

chrome.storage.sync.get(["apiKey"], (result) => {
  apiKey = result.apiKey || "";
});

function handleResponse(response) {
  return response.json().then((data) => {
    if (response.ok) {
      return data;
    } else {
      return Promise.reject({ status: response.status, data });
    }
  });
}

function fetchSuggestions(prompt) {
    if (!apiKey) {
      return Promise.reject(new Error("API key not set"));
    }
  
    return fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 50,
        n: 1,
        stop: null,
        temperature: 0.5,
      }),
    }).then(handleResponse);
  }

function insertSuggestion(suggestion, textField) {
  const cursorPosition = textField.selectionStart;
  const textBeforeCursor = textField.value.substring(0, cursorPosition);
  const textAfterCursor = textField.value.substring(cursorPosition);

  textField.value = textBeforeCursor + suggestion + textAfterCursor;
  textField.selectionStart = textField.selectionEnd = cursorPosition + suggestion.length;
}

document.addEventListener("input", async (event) => {
  const textField = event.target;
  if (textField.tagName.toLowerCase() === "textarea" || textField.type === "text") {
    const prompt = textField.value + " /ai";
    try {
      const response = await fetchSuggestions(prompt);
      const suggestion = response.choices[0].text.trim();
      if (suggestion.length > 0) {
        insertSuggestion(suggestion, textField);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  }
});
