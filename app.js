(() => {
  "use strict";

  const STORAGE_KEY = "gruenzeug.plants.v1";
  const DAY_MS = 24 * 60 * 60 * 1000;

  /** @typedef {{
   *  id: string,
   *  name: string,
   *  room: string,
   *  icon: string,
   *  waterIntervalDays: number,
   *  fertIntervalDays: number,
   *  lastWatered: string,   // ISO date (yyyy-mm-dd)
   *  lastFert: string | null
   * }} Plant
   */

  const DEFAULT_ICON = "generic";

  const PLANT_ICONS = {
    generic: {
      label: "Generisch",
      markup: `
        <path d="M256 322 L256 236" stroke="#F6F7F1" stroke-width="12" stroke-linecap="round"/>
        <path d="M256 236 C 210 236 176 206 172 158 C 224 160 256 196 256 236 Z" fill="#F6F7F1"/>
        <path d="M256 236 C 302 236 336 206 340 158 C 288 160 256 196 256 236 Z" fill="#F6F7F1"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
    monstera: {
      label: "Monstera",
      markup: `
        <path d="M256 150 C 320 170 340 240 300 300 C 280 330 256 350 256 350 C 256 350 232 330 212 300 C 172 240 192 170 256 150 Z" fill="#F6F7F1"/>
        <path d="M348 190 L275 222 L346 258 Z" fill="#4B6B3A"/>
        <path d="M166 205 L226 228 L170 252 Z" fill="#4B6B3A"/>
        <circle cx="252" cy="278" r="17" fill="#4B6B3A"/>
        <circle cx="290" cy="240" r="11" fill="#4B6B3A"/>
        <line x1="256" y1="172" x2="256" y2="330" stroke="#4B6B3A" stroke-width="6" opacity="0.35"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
    "monkey-leaf": {
      label: "Monkey Leaf",
      markup: `
        <path d="M256 145 C 290 155 305 200 298 245 C 293 285 275 315 256 325 C 237 315 219 285 214 245 C 207 200 222 155 256 145 Z" fill="#F6F7F1"/>
        <circle cx="240" cy="190" r="8" fill="#4B6B3A"/>
        <circle cx="272" cy="195" r="7" fill="#4B6B3A"/>
        <circle cx="250" cy="223" r="9" fill="#4B6B3A"/>
        <circle cx="278" cy="228" r="6" fill="#4B6B3A"/>
        <circle cx="238" cy="258" r="8" fill="#4B6B3A"/>
        <circle cx="268" cy="262" r="7" fill="#4B6B3A"/>
        <circle cx="256" cy="290" r="6" fill="#4B6B3A"/>
        <line x1="256" y1="325" x2="256" y2="332" stroke="#F6F7F1" stroke-width="8"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
    kaktus: {
      label: "Kaktus",
      markup: `
        <path d="M226 260 C 196 260 176 244 176 214 C 176 194 190 182 206 186 L206 214 C 206 232 214 244 226 248 Z" fill="#F6F7F1"/>
        <path d="M286 230 C 316 230 336 214 336 184 C 336 164 322 152 306 156 L306 184 C 306 202 296 214 286 218 Z" fill="#F6F7F1"/>
        <rect x="226" y="195" width="60" height="140" rx="28" fill="#F6F7F1"/>
        <line x1="241" y1="212" x2="241" y2="328" stroke="#4B6B3A" stroke-width="5" opacity="0.3"/>
        <line x1="271" y1="212" x2="271" y2="328" stroke="#4B6B3A" stroke-width="5" opacity="0.3"/>
        <circle cx="256" cy="182" r="14" fill="#C08A2E"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
    avocado: {
      label: "Avocado Pflanze",
      markup: `
        <line x1="256" y1="320" x2="256" y2="150" stroke="#F6F7F1" stroke-width="8" stroke-linecap="round"/>
        <path d="M256 180 C 240 160 238 120 256 95 C 274 120 272 160 256 180 Z" fill="#F6F7F1"/>
        <path d="M256 225 C 225 215 195 225 178 250 C 200 258 228 250 244 232 Z" fill="#F6F7F1"/>
        <path d="M256 255 C 287 245 317 255 334 280 C 312 288 284 280 268 262 Z" fill="#F6F7F1"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
    drachenbaum: {
      label: "Drachenbaum",
      markup: `
        <rect x="246" y="258" width="20" height="72" rx="7" fill="#F6F7F1"/>
        <path d="M256 260 C 250 220 250 160 256 108 C 262 160 262 220 256 260 Z" fill="#F6F7F1" transform="rotate(-60 256 260)"/>
        <path d="M256 260 C 250 220 250 160 256 118 C 262 160 262 220 256 260 Z" fill="#F6F7F1" transform="rotate(-32 256 260)"/>
        <path d="M256 260 C 250 220 250 160 256 108 C 262 160 262 220 256 260 Z" fill="#F6F7F1" transform="rotate(-6 256 260)"/>
        <path d="M256 260 C 250 220 250 160 256 118 C 262 160 262 220 256 260 Z" fill="#F6F7F1" transform="rotate(20 256 260)"/>
        <path d="M256 260 C 250 220 250 160 256 108 C 262 160 262 220 256 260 Z" fill="#F6F7F1" transform="rotate(48 256 260)"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
    "madagaskar-drachenbaum": {
      label: "Madagaskar-Drachenbaum",
      markup: `
        <rect x="222" y="228" width="14" height="102" rx="6" fill="#F6F7F1"/>
        <rect x="268" y="258" width="14" height="72" rx="6" fill="#F6F7F1"/>
        <path d="M229 230 C 224 202 224 168 229 136 C 234 168 234 202 229 230 Z" fill="#F6F7F1" transform="rotate(-42 229 230)"/>
        <path d="M229 230 C 224 202 224 168 229 128 C 234 168 234 202 229 230 Z" fill="#F6F7F1" transform="rotate(-12 229 230)"/>
        <path d="M229 230 C 224 202 224 168 229 136 C 234 168 234 202 229 230 Z" fill="#F6F7F1" transform="rotate(20 229 230)"/>
        <path d="M229 230 C 224 202 224 168 229 148 C 234 168 234 202 229 230 Z" fill="#F6F7F1" transform="rotate(48 229 230)"/>
        <path d="M275 260 C 271 238 271 210 275 184 C 279 210 279 238 275 260 Z" fill="#F6F7F1" transform="rotate(-26 275 260)"/>
        <path d="M275 260 C 271 238 271 210 275 178 C 279 210 279 238 275 260 Z" fill="#F6F7F1" transform="rotate(4 275 260)"/>
        <path d="M275 260 C 271 238 271 210 275 190 C 279 210 279 238 275 260 Z" fill="#F6F7F1" transform="rotate(30 275 260)"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
    bogenhanf: {
      label: "Bogenhanf",
      markup: `
        <path d="M246 320 L246 130 L256 108 L266 130 L266 320 Z" fill="#F6F7F1"/>
        <path d="M214 320 L216 155 L224 138 L232 155 L234 320 Z" fill="#F6F7F1" transform="rotate(-13 224 320)"/>
        <path d="M278 320 L280 155 L288 138 L296 155 L298 320 Z" fill="#F6F7F1" transform="rotate(13 288 320)"/>
        <path d="M186 320 L188 190 L196 175 L204 190 L206 320 Z" fill="#F6F7F1" transform="rotate(-26 196 320)"/>
        <path d="M306 320 L308 190 L316 175 L324 190 L326 320 Z" fill="#F6F7F1" transform="rotate(26 316 320)"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
    "aloe-vera": {
      label: "Aloe Vera",
      markup: `
        <path d="M244 320 C 240 260 248 190 258 150 C 268 190 272 260 268 320 Z" fill="#F6F7F1"/>
        <path d="M244 320 C 240 268 246 210 256 178 C 264 210 268 268 264 320 Z" fill="#F6F7F1" transform="rotate(-26 256 320)"/>
        <path d="M244 320 C 240 268 246 210 256 178 C 264 210 268 268 264 320 Z" fill="#F6F7F1" transform="rotate(26 256 320)"/>
        <path d="M248 320 C 246 280 252 232 260 205 C 266 232 270 280 266 320 Z" fill="#F6F7F1" transform="rotate(-50 256 320)"/>
        <path d="M248 320 C 246 280 252 232 260 205 C 266 232 270 280 266 320 Z" fill="#F6F7F1" transform="rotate(50 256 320)"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
    orchidee: {
      label: "Orchidee",
      markup: `
        <path d="M256 320 C 230 310 220 280 228 250 C 244 270 256 295 256 320 Z" fill="#F6F7F1"/>
        <path d="M256 320 C 262 275 295 250 312 205 C 320 180 316 155 302 140" fill="none" stroke="#F6F7F1" stroke-width="8" stroke-linecap="round"/>
        <circle cx="283" cy="203" r="8" fill="#F6F7F1"/>
        <ellipse cx="302" cy="104" rx="14" ry="21" fill="#F6F7F1"/>
        <ellipse cx="302" cy="104" rx="14" ry="21" fill="#F6F7F1" transform="rotate(72 302 128)"/>
        <ellipse cx="302" cy="104" rx="14" ry="21" fill="#F6F7F1" transform="rotate(144 302 128)"/>
        <ellipse cx="302" cy="104" rx="14" ry="21" fill="#F6F7F1" transform="rotate(216 302 128)"/>
        <ellipse cx="302" cy="104" rx="14" ry="21" fill="#F6F7F1" transform="rotate(288 302 128)"/>
        <circle cx="302" cy="128" r="8" fill="#C08A2E"/>
        <rect x="192" y="316" width="128" height="16" rx="7" fill="#F6F7F1"/>
        <path d="M200 332 L312 332 L294 396 L218 396 Z" fill="#F6F7F1"/>`,
    },
  };

  function iconMarkup(key) {
    const icon = PLANT_ICONS[key] || PLANT_ICONS[DEFAULT_ICON];
    return `<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="115" fill="#4B6B3A"/>${icon.markup}</svg>`;
  }

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
    iconPicker: document.getElementById("iconPicker"),
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
  let selectedIcon = DEFAULT_ICON;

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
    } else {
      const totalLabel = `${plants.length} ${plants.length === 1 ? "Pflanze" : "Pflanzen"}`;
      let statusLabel;
      if (overdueCount > 0) {
        statusLabel = `${overdueCount} ${overdueCount === 1 ? "wartet" : "warten"} schon länger aufs Gießen`;
      } else if (dueTodayCount > 0) {
        statusLabel = `${dueTodayCount} ${dueTodayCount === 1 ? "ist" : "sind"} heute dran`;
      } else {
        statusLabel = "alles versorgt";
      }
      els.summary.textContent = `${totalLabel} · ${statusLabel}`;
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

    const avatar = document.createElement("div");
    avatar.className = "plant__icon";
    avatar.innerHTML = iconMarkup(p.icon);
    row.appendChild(avatar);

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

  function buildIconPicker() {
    Object.keys(PLANT_ICONS).forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "icon-option";
      btn.dataset.icon = key;
      btn.title = PLANT_ICONS[key].label;
      btn.innerHTML = iconMarkup(key);
      btn.addEventListener("click", () => selectIcon(key));
      els.iconPicker.appendChild(btn);
    });
  }

  function selectIcon(key) {
    selectedIcon = key;
    Array.from(els.iconPicker.children).forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.icon === key);
    });
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
    selectIcon(DEFAULT_ICON);
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
    selectIcon(p.icon || DEFAULT_ICON);
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
      p.icon = selectedIcon;
      p.waterIntervalDays = waterIntervalDays;
      p.lastWatered = lastWatered;
      p.fertIntervalDays = fertIntervalDays;
      p.lastFert = lastFert;
    } else {
      plants.push({
        id: crypto.randomUUID(),
        name,
        room,
        icon: selectedIcon,
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
  buildIconPicker();

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
