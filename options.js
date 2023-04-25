document.getElementById("save").addEventListener("click", () => {
    const apiKey = document.getElementById("api_key").value;
    chrome.storage.sync.set({ apiKey }, () => {
      console.log("API key saved.");
    });
  });
  
  chrome.storage.sync.get(["apiKey"], (result) => {
    document.getElementById("api_key").value = result.apiKey || "";
  });