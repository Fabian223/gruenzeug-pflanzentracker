(() => {
  "use strict";

  const STORAGE_KEY = "gruenzeug.plants.v1";
  const DAY_MS = 24 * 60 * 60 * 1000;

  /** @typedef {{
   *  id: string,
   *  name: string,
   *  room: string,
   *  waterIntervalDays: number,
   *  fertIntervalDays: number,
   *  lastWatered: string,   // ISO date (yyyy-mm-dd)
   *  lastFert: string | null
   * }} Plant
   */

  const els = {
    list: document.getElementById("plantList"),
    empty: document.getElementById("emptyState"),
    summary: document.getElementById("summary"),
    addButton: document.getElementById("addButton"),
    panel: document.getElementById("panel"),
    panelBackdrop: document.getElementById("panelBackdrop"),
    panelTitle: document.getElementById("panelTitle"),
    form: document.getElementById("plantForm"),
    fieldName: document.getElementById("fieldName"),
    fieldRoom: document.getElementById("fieldRoom"),
    fieldWaterInterval: document.getElementById("fieldWaterInterval"),
    fieldLastWatered: document.getElementById("fieldLastWatered"),
    fieldFertInterval: document.getElementById("fieldFertInterval"),
    fertDateField: document.getElementById("fertDateField"),
    fieldLastFert: document.getElementById("fieldLastFert"),
    deleteButton: document.getElementById("deleteButton"),
    cancelButton: document.getElementById("cancelButton"),
  };

  let plants = loadPlants();
  let editingId = null; // null => "add" mode

  // ---------- storage ----------

  function loadPlants() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Konnte gespeicherte Pflanzen nicht lesen:", err);
      return [];
    }
  }

  function savePlants() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
    } catch (err) {
      console.error("Konnte Pflanzen nicht speichern:", err);
      alert("Speichern hat nicht geklappt. Möglicherweise ist der Speicher voll.");
    }
  }

  // ---------- date helpers ----------

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysSince(isoDate) {
    const then = new Date(isoDate + "T00:00:00");
    const now = new Date(todayISO() + "T00:00:00");
    return Math.round((now - then) / DAY_MS);
  }

  function dueStatus(lastDoneISO, intervalDays) {
    const elapsed = daysSince(lastDoneISO);
    const remaining = intervalDays - elapsed;
    const fraction = Math.max(0, Math.min(1, remaining / intervalDays));

    let state, text;
    if (remaining < 0) {
      state = "overdue";
      text = remaining === -1 ? "1 Tag überfällig" : `${-remaining} Tage überfällig`;
    } else if (remaining === 0) {
      state = "due";
      text = "heute fällig";
    } else if (remaining === 1) {
      state = "soon";
      text = "morgen fällig";
    } else {
      state = "ok";
      text = `in ${remaining} Tagen`;
    }
    return { state, text, fraction, remaining };
  }

  // ---------- rendering ----------

  function colorFor(state, kind) {
    if (state === "overdue") return "var(--brick)";
    if (state === "due" || state === "soon") return "var(--ochre)";
    return kind === "fert" ? "var(--soil)" : "var(--moss)";
  }

  function render() {
    const hasPlants = plants.length > 0;
    els.empty.hidden = hasPlants;
    els.list.innerHTML = "";

    const enriched = plants.map((p) => {
      const water = dueStatus(p.lastWatered, p.waterIntervalDays);
      const fert = p.fertIntervalDays > 0 && p.lastFert
        ? dueStatus(p.lastFert, p.fertIntervalDays)
        : null;
      return { p, water, fert };
    });

    let overdueCount = 0;
    let dueTodayCount = 0;
    enriched.forEach(({ water }) => {
      if (water.state === "overdue") overdueCount++;
      else if (water.state === "due") dueTodayCount++;
    });

    if (!hasPlants) {
      els.summary.textContent = "";
    } else if (overdueCount > 0) {
      els.summary.textContent = `${overdueCount} ${overdueCount === 1 ? "Pflanze wartet" : "Pflanzen warten"} schon länger aufs Gießen`;
    } else if (dueTodayCount > 0) {
      els.summary.textContent = `${dueTodayCount} ${dueTodayCount === 1 ? "Pflanze ist" : "Pflanzen sind"} heute dran`;
    } else {
      els.summary.textContent = "Alles versorgt";
    }

    const groups = groupByRoom(enriched);
    if (groups.length <= 1) {
      const ul = document.createElement("ul");
      ul.className = "plant-list";
      (groups[0] ? groups[0].items : []).forEach(({ p, water, fert }) => {
        ul.appendChild(renderPlantRow(p, water, fert));
      });
      els.list.appendChild(ul);
    } else {
      groups.forEach((group) => els.list.appendChild(renderRoomGroup(group)));
    }
  }

  function groupByRoom(enriched) {
    const map = new Map();
    enriched.forEach((item) => {
      const room = (item.p.room || "").trim();
      const key = room || "__none__";
      if (!map.has(key)) map.set(key, { label: room || "Ohne Zimmer", items: [] });
      map.get(key).items.push(item);
    });

    const groups = Array.from(map.values());
    groups.forEach((g) => g.items.sort((a, b) => a.water.remaining - b.water.remaining));
    groups.sort((a, b) => {
      const aMin = Math.min(...a.items.map((i) => i.water.remaining));
      const bMin = Math.min(...b.items.map((i) => i.water.remaining));
      if (aMin !== bMin) return aMin - bMin;
      return a.label.localeCompare(b.label, "de");
    });
    return groups;
  }

  function renderRoomGroup(group) {
    const section = document.createElement("section");
    section.className = "room-group";

    const heading = document.createElement("h2");
    heading.className = "room-heading";
    heading.textContent = group.label;
    section.appendChild(heading);

    const ul = document.createElement("ul");
    ul.className = "plant-list";
    group.items.forEach(({ p, water, fert }) => {
      ul.appendChild(renderPlantRow(p, water, fert));
    });
    section.appendChild(ul);

    return section;
  }

  function renderPlantRow(p, water, fert) {
    const li = document.createElement("li");
    li.className = "plant";
    li.dataset.id = p.id;

    const row = document.createElement("div");
    row.className = "plant__row";

    const info = document.createElement("div");
    info.className = "plant__info";

    const nameBtn = document.createElement("button");
    nameBtn.type = "button";
    nameBtn.className = "plant__name";
    nameBtn.textContent = p.name;
    nameBtn.addEventListener("click", () => openEditPanel(p.id));
    info.appendChild(nameBtn);

    if (p.room) {
      const room = document.createElement("span");
      room.className = "plant__room";
      room.textContent = p.room;
      info.appendChild(room);
    }

    const actions = document.createElement("div");
    actions.className = "plant__actions";

    const waterBtn = document.createElement("button");
    waterBtn.type = "button";
    waterBtn.className = "action action--water";
    waterBtn.textContent = "Gießen";
    waterBtn.addEventListener("click", () => markDone(p.id, "water"));
    actions.appendChild(waterBtn);

    if (p.fertIntervalDays > 0) {
      const fertBtn = document.createElement("button");
      fertBtn.type = "button";
      fertBtn.className = "action action--fert";
      fertBtn.textContent = "Düngen";
      fertBtn.addEventListener("click", () => markDone(p.id, "fert"));
      actions.appendChild(fertBtn);
    }

    row.appendChild(info);
    row.appendChild(actions);
    li.appendChild(row);

    li.appendChild(renderGauge("Wasser", water, "water"));
    if (fert) {
      li.appendChild(renderGauge("Dünger", fert, "fert"));
    }

    return li;
  }

  function renderGauge(label, status, kind) {
    const wrap = document.createElement("div");
    wrap.className = "gauge";

    const labelRow = document.createElement("div");
    labelRow.className = "gauge__label";
    const left = document.createElement("span");
    left.textContent = label;
    const right = document.createElement("b");
    right.textContent = status.text;
    labelRow.appendChild(left);
    labelRow.appendChild(right);

    const track = document.createElement("div");
    track.className = "gauge__track";
    const fill = document.createElement("div");
    fill.className = "gauge__fill";
    const pct = status.state === "overdue" ? 100 : Math.round(status.fraction * 100);
    fill.style.width = pct + "%";
    fill.style.background = colorFor(status.state, kind);
    track.appendChild(fill);

    wrap.appendChild(labelRow);
    wrap.appendChild(track);
    return wrap;
  }

  // ---------- actions ----------

  function markDone(id, kind) {
    const p = plants.find((x) => x.id === id);
    if (!p) return;
    if (kind === "water") p.lastWatered = todayISO();
    else p.lastFert = todayISO();
    savePlants();
    render();
  }

  function toggleFertDateVisibility() {
    const active = parseInt(els.fieldFertInterval.value, 10) > 0;
    els.fertDateField.hidden = !active;
  }

  function openAddPanel() {
    editingId = null;
    els.panelTitle.textContent = "Neue Pflanze";
    els.deleteButton.hidden = true;
    els.form.reset();
    els.fieldLastWatered.value = todayISO();
    els.fieldFertInterval.value = "0";
    els.fieldLastFert.value = todayISO();
    toggleFertDateVisibility();
    showPanel();
  }

  function openEditPanel(id) {
    const p = plants.find((x) => x.id === id);
    if (!p) return;
    editingId = id;
    els.panelTitle.textContent = p.name;
    els.deleteButton.hidden = false;
    els.fieldName.value = p.name;
    els.fieldRoom.value = p.room || "";
    els.fieldWaterInterval.value = p.waterIntervalDays;
    els.fieldLastWatered.value = p.lastWatered;
    els.fieldFertInterval.value = p.fertIntervalDays || 0;
    els.fieldLastFert.value = p.lastFert || todayISO();
    toggleFertDateVisibility();
    showPanel();
  }

  function showPanel() {
    els.panel.hidden = false;
    els.panelBackdrop.hidden = false;
    els.panel.setAttribute("aria-hidden", "false");
    els.fieldName.focus();
  }

  function hidePanel() {
    els.panel.hidden = true;
    els.panelBackdrop.hidden = true;
    els.panel.setAttribute("aria-hidden", "true");
    editingId = null;
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    const name = els.fieldName.value.trim();
    const room = els.fieldRoom.value.trim();
    const waterIntervalDays = parseInt(els.fieldWaterInterval.value, 10);
    const fertIntervalDays = parseInt(els.fieldFertInterval.value, 10) || 0;
    const today = todayISO();
    const lastWatered = els.fieldLastWatered.value && els.fieldLastWatered.value <= today
      ? els.fieldLastWatered.value
      : today;
    const lastFert = fertIntervalDays > 0
      ? (els.fieldLastFert.value && els.fieldLastFert.value <= today ? els.fieldLastFert.value : today)
      : null;

    if (!name || !waterIntervalDays || waterIntervalDays < 1) return;

    if (editingId) {
      const p = plants.find((x) => x.id === editingId);
      p.name = name;
      p.room = room;
      p.waterIntervalDays = waterIntervalDays;
      p.lastWatered = lastWatered;
      p.fertIntervalDays = fertIntervalDays;
      p.lastFert = lastFert;
    } else {
      plants.push({
        id: crypto.randomUUID(),
        name,
        room,
        waterIntervalDays,
        fertIntervalDays,
        lastWatered,
        lastFert,
      });
    }

    savePlants();
    hidePanel();
    render();
  }

  function handleDelete() {
    if (!editingId) return;
    if (!confirm("Diese Pflanze wirklich löschen?")) return;
    plants = plants.filter((x) => x.id !== editingId);
    savePlants();
    hidePanel();
    render();
  }

  // ---------- wiring ----------

  els.fieldLastWatered.max = todayISO();
  els.fieldLastFert.max = todayISO();

  els.addButton.addEventListener("click", openAddPanel);
  els.cancelButton.addEventListener("click", hidePanel);
  els.panelBackdrop.addEventListener("click", hidePanel);
  els.deleteButton.addEventListener("click", handleDelete);
  els.form.addEventListener("submit", handleSubmit);
  els.fieldFertInterval.addEventListener("input", toggleFertDateVisibility);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.panel.hidden) hidePanel();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((err) => {
        console.warn("Service Worker konnte nicht registriert werden:", err);
      });
    });
  }

  render();
})();
