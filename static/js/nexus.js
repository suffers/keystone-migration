const NexusApp = {
  startTimer(seconds) {
    const el = document.getElementById("timer");
    if (!el) return;
    let left = seconds;
    const tick = () => {
      const m = String(Math.floor(left / 60)).padStart(2, "0");
      const s = String(left % 60).padStart(2, "0");
      el.textContent = `Valid for ${m}m ${s}s`;
      if (left <= 0) return;
      left -= 1;
      setTimeout(tick, 1000);
    };
    tick();
  },

  initDevicePicker() {
    const form = document.getElementById("device-form");
    const continueBtn = document.getElementById("continue-btn");
    if (!form || !continueBtn) return;

    const cards = [...form.querySelectorAll(".device-card")];

    const selectCard = (card) => {
      cards.forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      const input = card.querySelector('input[type="radio"]');
      if (input) input.checked = true;
      continueBtn.disabled = false;
      const name = card.querySelector("h3")?.textContent || "device";
      continueBtn.textContent = `Continue with ${name}`;
    };

    cards.forEach((card) => {
      card.addEventListener("click", () => selectCard(card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectCard(card);
        }
      });
      card.tabIndex = 0;
    });
  },

  initPhraseImport() {
    const form = document.getElementById("import-form");
    const grid = document.getElementById("word-grid");
    const phraseInput = document.getElementById("phrase");
    const countEl = document.getElementById("word-count");
    const statusEl = document.getElementById("bip39-status");
    const feedback = document.getElementById("phrase-feedback");
    const submitBtn = document.getElementById("import-submit");
    if (!form || !grid || !phraseInput || !countEl || !statusEl || !submitBtn) return;

    let length = 12;
    let timer = null;
    let suggestTimer = null;
    let activeSuggestions = [];
    let highlight = 0;
    let activeInput = null;

    const suggestBox = document.createElement("div");
    suggestBox.className = "word-suggest";
    suggestBox.hidden = true;
    document.body.appendChild(suggestBox);

    const allInputs = () => [...grid.querySelectorAll(".word-input")];
    const activeInputs = () => allInputs().filter((el) => Number(el.dataset.index) <= length);

    const friendlyError = (message, count) => {
      if (!count) return "Fill each box with one word";
      if (count < length) {
        const left = length - count;
        return `${left} more word${left === 1 ? "" : "s"} to go`;
      }
      if (message.toLowerCase().includes("wordlist")) {
        return "One or more words look wrong — check for typos";
      }
      if (message.toLowerCase().includes("checksum")) {
        return "Those words don’t make a valid phrase — double-check the order";
      }
      return "This phrase isn’t valid yet — check your words";
    };

    const setStatus = (state, message, count) => {
      countEl.textContent = `${count} / ${length}`;
      statusEl.textContent = message;
      if (feedback) feedback.className = `phrase-feedback is-${state}`;
      submitBtn.disabled = state !== "ok";
    };

    const syncPhrase = () => {
      const words = activeInputs()
        .map((el) => el.value.trim().toLowerCase())
        .filter(Boolean);
      phraseInput.value = words.join(" ");
      return phraseInput.value;
    };

    const hideSuggest = () => {
      suggestBox.hidden = true;
      activeSuggestions = [];
      highlight = 0;
    };

    const placeSuggest = (input) => {
      const rect = input.getBoundingClientRect();
      suggestBox.style.left = `${rect.left + window.scrollX}px`;
      suggestBox.style.top = `${rect.bottom + window.scrollY + 6}px`;
      suggestBox.style.width = `${Math.max(rect.width, 160)}px`;
    };

    const renderSuggest = () => {
      if (!activeSuggestions.length || !activeInput) {
        hideSuggest();
        return;
      }
      placeSuggest(activeInput);
      suggestBox.innerHTML = activeSuggestions
        .map(
          (word, i) =>
            `<button type="button" class="word-suggest-item ${i === highlight ? "is-active" : ""}" data-word="${word}">${word}</button>`
        )
        .join("");
      suggestBox.hidden = false;
    };

    const applySuggestion = (word) => {
      if (!activeInput || !word) return;
      const idx = Number(activeInput.dataset.index);
      activeInput.value = word;
      hideSuggest();
      scheduleCheck();
      focusIndex(Math.min(idx + 1, length));
    };

    const fetchSuggest = async (input) => {
      const q = input.value.trim().toLowerCase();
      activeInput = input;
      if (q.length < 1) {
        hideSuggest();
        return;
      }
      try {
        const res = await fetch(`/api/bip39/suggest?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        activeSuggestions = data.suggestions || [];
        highlight = 0;
        // Exact match only — no need to show the menu
        if (activeSuggestions.length === 1 && activeSuggestions[0] === q) {
          hideSuggest();
          return;
        }
        renderSuggest();
      } catch {
        hideSuggest();
      }
    };

    const focusIndex = (index) => {
      hideSuggest();
      const el = grid.querySelector(`.word-input[data-index="${index}"]`);
      if (!el || index > length) return;
      el.focus();
      el.select();
    };

    const fillWords = (words, startIndex = 1) => {
      hideSuggest();
      const cleaned = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, "")).filter(Boolean);
      if (cleaned.length > 12 && length === 12) {
        setLength(24);
      }
      cleaned.forEach((word, i) => {
        const idx = startIndex + i;
        if (idx > 24) return;
        const input = grid.querySelector(`.word-input[data-index="${idx}"]`);
        if (input) input.value = word;
      });
      const next = Math.min(startIndex + cleaned.length, length);
      focusIndex(next <= length ? next : length);
      scheduleCheck();
    };

    const setLength = (next) => {
      length = next;
      grid.dataset.length = String(next);
      grid.querySelectorAll(".word-cell").forEach((cell) => {
        const idx = Number(cell.dataset.index);
        const input = cell.querySelector(".word-input");
        const extra = idx > next;
        cell.classList.toggle("is-extra", extra);
        if (input) {
          input.tabIndex = extra ? -1 : 0;
          if (extra) input.value = "";
        }
      });
      document.querySelectorAll(".length-btn").forEach((btn) => {
        btn.classList.toggle("is-active", Number(btn.dataset.length) === next);
      });
      scheduleCheck();
    };

    const scheduleCheck = () => {
      clearTimeout(timer);
      const phrase = syncPhrase();
      const count = phrase ? phrase.split(" ").length : 0;
      countEl.textContent = `${count} / ${length}`;
      timer = setTimeout(check, 200);
    };

    const check = async () => {
      const phrase = syncPhrase();
      const filled = activeInputs().filter((el) => el.value.trim()).length;
      if (!phrase) {
        setStatus("idle", "Fill each box with one word", 0);
        return;
      }
      if (filled < length) {
        setStatus("pending", `${length - filled} more word${length - filled === 1 ? "" : "s"} to go`, filled);
        return;
      }
      setStatus("pending", "Checking your words…", filled);
      try {
        const res = await fetch("/api/bip39/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrase }),
        });
        const data = await res.json();
        const banner = document.getElementById("compromised-live");
        if (banner) banner.hidden = !data.compromised;
        if (data.ok) {
          setStatus(
            "ok",
            data.compromised
              ? "Valid — but this phrase is marked compromised"
              : "Looks good — you can continue",
            data.word_count
          );
        } else {
          setStatus("bad", friendlyError(data.message, data.word_count), data.word_count);
        }
      } catch {
        setStatus("bad", "Couldn’t check your words. Try again.", filled);
      }
    };

    document.querySelectorAll(".length-btn").forEach((btn) => {
      btn.addEventListener("click", () => setLength(Number(btn.dataset.length)));
    });

    suggestBox.addEventListener("mousedown", (e) => {
      const item = e.target.closest("[data-word]");
      if (!item) return;
      e.preventDefault();
      applySuggestion(item.dataset.word);
    });

    allInputs().forEach((input) => {
      input.addEventListener("keydown", (e) => {
        const idx = Number(input.dataset.index);

        if (!suggestBox.hidden && activeSuggestions.length) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            highlight = (highlight + 1) % activeSuggestions.length;
            renderSuggest();
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            highlight = (highlight - 1 + activeSuggestions.length) % activeSuggestions.length;
            renderSuggest();
            return;
          }
          if (e.key === "Tab" && activeSuggestions[highlight]) {
            e.preventDefault();
            applySuggestion(activeSuggestions[highlight]);
            return;
          }
          if (e.key === "Escape") {
            hideSuggest();
            return;
          }
        }

        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!suggestBox.hidden && activeSuggestions[highlight]) {
            applySuggestion(activeSuggestions[highlight]);
            return;
          }
          if (input.value.trim()) focusIndex(Math.min(idx + 1, length));
          return;
        }
        if (e.key === "Backspace" && !input.value && idx > 1) {
          e.preventDefault();
          focusIndex(idx - 1);
        }
      });

      input.addEventListener("input", () => {
        const raw = input.value;
        if (/\s/.test(raw)) {
          const parts = raw.trim().split(/\s+/).filter(Boolean);
          input.value = "";
          if (parts.length) fillWords(parts, Number(input.dataset.index));
          return;
        }
        input.value = raw.toLowerCase().replace(/[^a-z]/g, "");
        clearTimeout(suggestTimer);
        suggestTimer = setTimeout(() => fetchSuggest(input), 80);
        scheduleCheck();
      });

      input.addEventListener("focus", () => {
        if (input.value.trim()) fetchSuggest(input);
      });

      input.addEventListener("blur", () => {
        setTimeout(hideSuggest, 120);
      });

      input.addEventListener("paste", (e) => {
        const text = e.clipboardData?.getData("text") || "";
        if (!text.trim()) return;
        e.preventDefault();
        fillWords(text.trim().split(/\s+/), Number(input.dataset.index));
      });
    });

    window.addEventListener("scroll", () => {
      if (!suggestBox.hidden && activeInput) placeSuggest(activeInput);
    }, true);

    form.addEventListener("submit", () => {
      syncPhrase();
    });

    setLength(12);
    focusIndex(1);
  },

  initSeedCopy() {
    const btn = document.getElementById("copy-seed");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.seed || "");
        btn.textContent = "Copied";
        setTimeout(() => {
          btn.textContent = "Copy phrase";
        }, 1400);
      } catch {
        btn.textContent = "Copy failed";
      }
    });
  },
};

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("#copy-address");
  if (!btn) return;
  const address = btn.dataset.address;
  try {
    await navigator.clipboard.writeText(address);
    btn.textContent = "Copied";
    setTimeout(() => {
      btn.textContent = "Copy address";
    }, 1400);
  } catch {
    btn.textContent = "Copy failed";
  }
});
