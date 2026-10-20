(() => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("message");
  const chat = document.getElementById("chat");
  const notice = document.getElementById("notice");
  const sendButton = document.getElementById("send-button");
  const welcome = document.getElementById("welcome");
  const modeButtons = [...document.querySelectorAll("[data-mode]")];
  let mode = "openai";

  modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      mode = button.dataset.mode;
      modeButtons.forEach(item => {
        const selected = item === button;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
    });
  });

  function addCard(label, text, kind = "") {
    const card = document.createElement("article");
    card.className = `message-card ${kind}`.trim();
    if (label) {
      const heading = document.createElement("div");
      heading.className = "message-heading";
      heading.textContent = label;
      card.appendChild(heading);
    }
    const body = document.createElement("div");
    body.className = "message-body";
    body.textContent = text;
    card.appendChild(body);
    chat.appendChild(card);
    chat.scrollTop = chat.scrollHeight;
    return { card, body };
  }

  function showAIResult(label, result) {
    if (result?.answer) return addCard(label, result.answer);
    return addCard(label, result?.error || "No response received.", "error");
  }

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 140) + "px";
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || sendButton.disabled) return;

    welcome.hidden = true;
    notice.textContent = "";
    addCard("YOU", message, "user");
    input.value = "";
    input.style.height = "auto";
    sendButton.disabled = true;
    sendButton.textContent = "…";
    const loading = addCard("AI DUO", "Thinking…");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mode })
      });
      const data = await response.json().catch(() => ({}));
      loading.card.remove();

      if (!response.ok) {
        const details = data.details
          ? `\nChatGPT: ${data.details.openai || "No details"}\nGemini: ${data.details.gemini || "No details"}`
          : "";
        addCard("ERROR", (data.error || "Request failed.") + details, "error");
      } else if (data.mode === "both") {
        const grid = document.createElement("div");
        grid.className = "compare-grid";
        chat.appendChild(grid);
        const previousParent = chat;
        const first = makeCard("CHATGPT", data.openai);
        const second = makeCard("GEMINI", data.gemini);
        grid.append(first, second);
        previousParent.scrollTop = previousParent.scrollHeight;
      } else {
        showAIResult(data.mode === "gemini" ? "GEMINI" : "CHATGPT", data);
      }
    } catch (_error) {
      loading.card.remove();
      addCard("CONNECTION ERROR", "Could not reach the server. Check your internet connection or try again after the app is hosted.", "error");
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "➤";
      input.focus();
    }
  });

  function makeCard(label, result) {
    const card = document.createElement("article");
    card.className = "message-card";
    const heading = document.createElement("div");
    heading.className = "message-heading";
    heading.textContent = label;
    const body = document.createElement("div");
    body.className = "message-body";
    if (result?.answer) {
      body.textContent = result.answer;
    } else {
      body.classList.add("error");
      body.textContent = result?.error || "No response received.";
    }
    card.append(heading, body);
    return card;
  }
})();
