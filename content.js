const API_URL = "https://api.openai.com/v1/completions";
let apiKey = "";

chrome.storage.sync.get(["apiKey"], (result) => {
  apiKey = result.apiKey || "";
});


function createDialog(suggestion, textField) {
    const dialog = document.createElement("div");
    dialog.id = "chatgpt-dialog";
    dialog.style.position = "fixed";
    dialog.style.top = "50%";
    dialog.style.left = "50%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.backgroundColor = "white";
    dialog.style.border = "1px solid black";
    dialog.style.borderRadius = "5px";
    dialog.style.padding = "20px";
    dialog.style.zIndex = "10000";
    dialog.style.width = "400px";
    dialog.style.boxSizing = "border-box";
  
    const suggestionText = document.createElement("p");
    suggestionText.innerText = suggestion;
    suggestionText.style.marginBottom = "10px";
    dialog.appendChild(suggestionText);
  
    const pasteButton = document.createElement("button");
    pasteButton.innerText = "Paste";
    pasteButton.addEventListener("click", () => {
      insertSuggestion(suggestion, textField);
      dialog.remove();
    });
    dialog.appendChild(pasteButton);
  
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.marginLeft = "10px";
    closeButton.addEventListener("click", () => {
      dialog.remove();
    });
    dialog.appendChild(closeButton);
  
    return dialog;
  }
  
// Check if the target element is a text field or a textarea
function isTextField(element) {
    return (
      (element.tagName === "INPUT" && element.type === "text") ||
      element.tagName === "TEXTAREA" ||
      element.isContentEditable
    );
  }
  
  
  // Get text from a text field or a textarea
  function getText(element) {
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      return element.value;
    } else if (element.isContentEditable) {
      return element.textContent;
    }
  }
  
  
  // Set text for a text field or a textarea
  function setText(element, text) {
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      element.value = text;
    } else if (element.isContentEditable) {
      element.textContent = text;
    }
  }
  
  function setCursorPosition(element, position) {
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      element.selectionStart = element.selectionEnd = position;
    } else if (element.isContentEditable) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(element.firstChild, position);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
  

  function setLoadingIndicator(textField, visible) {
    const existingIndicator = document.getElementById("chatgpt-loading-indicator");
  
    if (visible) {
      if (!existingIndicator) {
        const indicator = document.createElement("img");
        indicator.id = "chatgpt-loading-indicator";
        indicator.src = "icon48.png";
        indicator.style.position = "absolute";
        indicator.style.zIndex = "10001";
        indicator.style.width = "30px";
        indicator.style.height = "30px";
  
        // Add animation style
        indicator.style.animation = "chatgpt-spin 1s linear infinite";
  
        const rect = textField.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
        indicator.style.top = rect.top + scrollTop + "px";
        indicator.style.left = rect.right + scrollLeft - indicator.clientWidth + "px";
  
        document.body.appendChild(indicator);
  
        // Add keyframes for the spin animation
        const style = document.createElement("style");
        style.innerHTML = `
          @keyframes chatgpt-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      if (existingIndicator) {
        existingIndicator.remove();
      }
    }
  }
  
  
  

  async function fetchSuggestions(prompt) {
    if (!apiKey) {
      return Promise.reject(new Error("API key not set"));
    }
  
    console.log("Fetching suggestions for prompt:", prompt);
  
    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 1000,
        n: 1,
        stop: null,
        temperature: 0.5,
      }),
    });
  
    if (response.ok) {
        console.log(response);
      return await response.json();
    } else {
      const errorData = await response.json();
      throw { status: response.status, data: errorData };
    }
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
    if (isTextField(textField)) {
      const currentValue = getText(textField);
      const hasAiTrigger = currentValue.match(/^\/ai\s.*\s\/$/);
  
      if (hasAiTrigger) {
        const prompt = currentValue.match(/^\/ai\s(.*\S)\s\/$/)[1]; // Extract prompt text
        setLoadingIndicator(textField, true); // Show the loading indicator
        try {
          const response = await fetchSuggestions(prompt);
          const suggestion = response.choices[0].text.trim();
          if (suggestion.length > 0) {
            const newText = currentValue.replace(/^\/ai\s.*\s\/$/, suggestion);
            setText(textField, newText);
            setCursorPosition(textField, newText.length);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        } finally {
          setLoadingIndicator(textField, false); // Hide the loading indicator
        }
      }
    }
  });
  
  
  
  
