let nutzerListe = [];

async function zeigeNutzerVerwaltung() {
  const container = document.getElementById("admin-aktionsbereich");
  container.innerHTML = "<h2>👥 Nutzerverwaltung</h2>";

  try {
    const response = await fetch(`${API_BASE}/api/users`);
    nutzerListe = await response.json();
  } catch (err) {
    console.error("Fehler beim Laden der Nutzer:", err);
    container.innerHTML += "<p>Fehler beim Laden der Nutzerdaten.</p>";
    return;
  }

  const tabelle = document.createElement("table");
  tabelle.style.width = "100%";
  tabelle.style.borderCollapse = "collapse";

  const header = `
    <tr style="background-color:#eee;">
      <th>Name</th>
      <th>Rolle</th>
      <th>Klasse</th>
      <th>XP</th>
      <th>Aktion</th>
    </tr>`;
  tabelle.innerHTML = header;

  nutzerListe.forEach(nutzer => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${nutzer.name}</td>
      <td>${nutzer.rolle}</td>
      <td>${nutzer.schuljahr ?? '-'}</td>
      <td>${nutzer.xp ?? 0}</td>
      <td><button onclick="bearbeiteNutzer(${nutzer.id})">Bearbeiten</button></td>
    `;
    tabelle.appendChild(tr);
  });

  container.appendChild(tabelle);
}

function bearbeiteNutzer(id) {
  const nutzer = nutzerListe.find(n => n.id === id);
  if (!nutzer) return;

  const container = document.getElementById("admin-aktionsbereich");
  container.innerHTML = `<h2>🔧 ${nutzer.name} bearbeiten</h2>`;

  const level = Math.floor((nutzer.xp || 0) / 25) + 1;
  const lernzeit = nutzer.lernzeit || 0;
  const minuten = Math.floor(lernzeit / 60);
  const sekunden = lernzeit % 60;

  const infoBox = document.createElement("div");
  infoBox.innerHTML = `
    <p><strong>Level:</strong> ${level}</p>
    <p><strong>Lernzeit:</strong> ${minuten} min ${sekunden} sek</p>
    <p><strong>XP:</strong> ${nutzer.xp ?? 0}</p>
    <p><strong>Klasse:</strong> ${nutzer.schuljahr ?? '-'}</p>
    <button class="login-button" onclick="zeigeBelohnungenVon(${nutzer.id})">🎁 Belohnungen anzeigen</button>
    <br><br>
    <button class="antwort-button" onclick="zeigeNutzerVerwaltung()">⬅ Zurück</button>
  `;

  container.appendChild(infoBox);
}

function zeigeBelohnungenVon(id) {
  const nutzer = nutzerListe.find(n => n.id === id);
  if (!nutzer) return;

  const container = document.getElementById("admin-aktionsbereich");
  container.innerHTML = `<h2>🎁 Belohnungen von ${nutzer.name}</h2>`;

  const belohnungen = nutzer.praemien || [];
  if (belohnungen.length === 0) {
    container.innerHTML += `<p>Dieser Nutzer hat noch keine Belohnungen freigeschaltet.</p>`;
  } else {
    const liste = document.createElement("ul");
    liste.className = "belohnungsliste";

    belohnungen.forEach(b => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${b.name}</strong> – ${b.beschreibung} <br><small>am ${b.datum}</small>`;
      liste.appendChild(li);
    });

    container.appendChild(liste);
  }

  const zurueckButton = document.createElement("button");
  zurueckButton.innerText = "⬅ Zurück";
  zurueckButton.className = "antwort-button";
  zurueckButton.onclick = zeigeNutzerVerwaltung;
  container.appendChild(zurueckButton);
}


function zeigeAufgabenVerwaltung() {
  const container = document.getElementById("admin-aktionsbereich");
  container.innerHTML = "<h2>📚 Aufgabenverwaltung</h2>";

  const beschreibung = document.createElement("p");
  beschreibung.innerText = "Wähle eine Option, um neue Aufgaben nach Klasse und Fach hinzuzufügen:";
  container.appendChild(beschreibung);

  const option1 = document.createElement("button");
  option1.innerText = "✍️ Manuell Aufgaben hinzufügen";
  option1.className = "login-button";
  option1.onclick = () => zeigeManuelleAufgabenEingabe();
  container.appendChild(option1);

  const option2 = document.createElement("button");
  option2.innerText = "🤖 Automatisch generieren (bald verfügbar)";
  option2.className = "login-button";
  option2.disabled = true; // vorerst deaktiviert
  container.appendChild(option2);

  const zurueck = document.createElement("button");
  zurueck.innerText = "⬅ Zurück";
  zurueck.className = "antwort-button";
  zurueck.style.marginTop = "20px";
  zurueck.onclick = () => zeigeNutzerVerwaltung();
  container.appendChild(zurueck);
}

function zeigeManuelleAufgabenEingabe() {
  const container = document.getElementById("admin-aktionsbereich");
  container.innerHTML = "<h3>✍️ Manuelle Aufgaben-Eingabe</h3>";

  // Klassen-Dropdown
  window.klassenDropdown = document.createElement("select");
  klassenDropdown.id = "klasse-auswahl";
  klassenDropdown.style.marginBottom = "10px";
  container.appendChild(klassenDropdown);

  // Fach-Dropdown
  window.fachDropdown = document.createElement("select");
  fachDropdown.id = "fach-auswahl";
  fachDropdown.style.marginBottom = "10px";
  container.appendChild(fachDropdown);

  // Eingabefelder
  const frageInput = document.createElement("input");
  frageInput.placeholder = "Frage";
  frageInput.id = "frage-eingabe";
  frageInput.style.display = "block";
  container.appendChild(frageInput);

  const richtigeAntwortInput = document.createElement("input");
  richtigeAntwortInput.placeholder = "Richtige Antwort";
  richtigeAntwortInput.id = "richtige-antwort";
  richtigeAntwortInput.style.display = "block";
  container.appendChild(richtigeAntwortInput);

  for (let i = 1; i <= 3; i++) {
    const falschInput = document.createElement("input");
    falschInput.placeholder = `Falsche Antwort ${i}`;
    falschInput.className = "falsche-antwort";
    falschInput.style.display = "block";
    container.appendChild(falschInput);
  }

  // Dropdowns befüllen
  ermittleVerfuegbareKlassen().then(klassen => {
    klassen.forEach(klasse => {
      const option = document.createElement("option");
      option.value = klasse;
      option.innerText = `Klasse ${klasse}`;
      klassenDropdown.appendChild(option);
    });

    klassenDropdown.addEventListener("change", async () => {
      const klasse = window.klassenDropdown.value;

      const res = await fetch(`${API_BASE}/api/aufgaben/${klasse}`);
      const daten = await res.json();
      const faecher = Object.keys(daten.faecher || {});

      fachDropdown.innerHTML = '';
      faecher.forEach(fach => {
        const opt = document.createElement("option");
        opt.value = fach;
        opt.innerText = fach;
        fachDropdown.appendChild(opt);
      });

      aktualisiereVorschau();
    });

    fachDropdown.addEventListener("change", aktualisiereVorschau);
    klassenDropdown.dispatchEvent(new Event("change"));
  });

  // Speichern-Button
  const speichern = document.createElement("button");
  speichern.innerText = "💾 Aufgabe speichern";
  speichern.className = "login-button";
  speichern.style.marginTop = "15px";
  speichern.onclick = async () => {
    const klasse = window.klassenDropdown.value;
    const fach = window.fachDropdown.value;
    const frage = frageInput.value.trim();
    const richtigeAntwort = richtigeAntwortInput.value.trim();
    const falscheAntworten = Array.from(document.getElementsByClassName("falsche-antwort")).map(e => e.value.trim());

    if (!klasse || !fach || !frage || !richtigeAntwort || falscheAntworten.some(f => !f)) {
      alert("Bitte alle Felder ausfüllen!");
      return;
    }

    const neueAufgabe = {
      frage,
      antworten: [...falscheAntworten, richtigeAntwort].sort(() => Math.random() - 0.5),
      richtigeAntwort
    };

    try {
      const response = await fetch(`${API_BASE}/api/aufgaben/${klasse}`);
      const daten = await response.json();

      if (!daten.faecher[fach]) {
        alert("❌ Fach nicht gefunden.");
        return;
      }

      daten.faecher[fach].push(neueAufgabe);

      await fetch(`${API_BASE}/api/aufgaben/${klasse}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(daten)
      });

      frageInput.value = "";
      richtigeAntwortInput.value = "";
      document.querySelectorAll(".falsche-antwort").forEach(f => f.value = "");

      aktualisiereVorschau();
      zeigeErfolgPopup(`✅ Aufgabe gespeichert für ${fach} in Klasse ${klasse}`);
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Fehler beim Speichern.");
    }
  };
  const urspruenglichSpeichern = speichern.onclick;
  container.appendChild(speichern);

  // Zurück-Button
  const zurueck = document.createElement("button");
  zurueck.innerText = "⬅ Zurück";
  zurueck.className = "antwort-button";
  zurueck.style.marginTop = "20px";
  zurueck.onclick = zeigeAufgabenVerwaltung;
  container.appendChild(zurueck);

  // Vorschau unter den Buttons
  const vorschauBox = document.createElement("div");
  vorschauBox.id = "vorschau-box";
  vorschauBox.style.marginTop = "30px";
  container.appendChild(vorschauBox);

  // Vorschau-Funktion
  async function aktualisiereVorschau() {
    const klasse = window.klassenDropdown.value;
    const fach = window.fachDropdown.value;

    if (!klasse || !fach) return;

    try {
      const res = await fetch(`${API_BASE}/api/aufgaben/${klasse}`);
      const daten = await res.json();
      const aufgaben = daten.faecher[fach] || [];

      if (aufgaben.length === 0) {
        vorschauBox.innerHTML = `<h4>📋 Vorschau: ${fach} (Klasse ${klasse})</h4><p><em>Keine Aufgaben vorhanden.</em></p>`;
        return;
      }

      vorschauBox.innerHTML = `<h4>📋 Vorschau: ${fach} (Klasse ${klasse})</h4>`;
      const liste = document.createElement("ul");
      aufgaben.forEach((a, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${i + 1}.</strong> ${a.frage}<br><em>✔ ${a.richtigeAntwort}</em>`;

      const bearbeitenBtn = document.createElement("button");
      bearbeitenBtn.innerText = "✏️ Bearbeiten";
      bearbeitenBtn.className = "antwort-button";
      bearbeitenBtn.style.marginRight = "10px";
      bearbeitenBtn.onclick = () => frageBearbeiten(i, a);

      const loeschenBtn = document.createElement("button");
      loeschenBtn.innerText = "🗑️ Löschen";
      loeschenBtn.className = "antwort-button";
      loeschenBtn.onclick = () => frageLoeschen(i);

      li.appendChild(document.createElement("br"));
      li.appendChild(bearbeitenBtn);
      li.appendChild(loeschenBtn);
      liste.appendChild(li);
    });

      vorschauBox.appendChild(liste);
    } catch (err) {
      console.error("Fehler beim Laden der Vorschau:", err);
      vorschauBox.innerHTML = "<p style='color:red;'>Fehler beim Laden der Vorschau</p>";
    }
  }
}


  // Erfolgspopup-Funktion
  function zeigeErfolgPopup(nachricht) {
    let popup = document.getElementById("admin-erfolg-popup");
    if (!popup) {
      popup = document.createElement("div");
      popup.id = "admin-erfolg-popup";
      popup.style.position = "fixed";
      popup.style.top = "50%";
      popup.style.left = "50%";
      popup.style.transform = "translate(-50%, -50%)";
      popup.style.background = "#e0ffe0";
      popup.style.padding = "20px 30px";
      popup.style.border = "2px solid #66cc66";
      popup.style.borderRadius = "10px";
      popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
      popup.style.fontWeight = "bold";
      popup.style.fontSize = "1.1rem";
      popup.style.zIndex = 9999;
      document.body.appendChild(popup);
    }

    popup.innerText = nachricht;
    popup.style.display = "block";

    setTimeout(() => {
      popup.style.display = "none";
    }, 3000);
  }

let aktuelleBearbeitung = { index: null, daten: null };

function frageBearbeiten(index, aufgabe) {
  aktuelleBearbeitung.index = index;

  document.getElementById("bearbeite-frage").value = aufgabe.frage;
  document.getElementById("bearbeite-richtig").value = aufgabe.richtigeAntwort;

  const falschInputs = document.getElementsByClassName("bearbeite-falsch");
  const falsche = aufgabe.antworten.filter(a => a !== aufgabe.richtigeAntwort);

  for (let i = 0; i < falschInputs.length; i++) {
    falschInputs[i].value = falsche[i] || "";
  }

  document.getElementById("bearbeiten-popup").classList.remove("hidden");
}

async function speichereBearbeitung() {
  const klasse = document.getElementById("klasse-auswahl").value;
  const fach = document.getElementById("fach-auswahl").value;

  const frage = document.getElementById("bearbeite-frage").value.trim();
  const richtig = document.getElementById("bearbeite-richtig").value.trim();
  const falsch = Array.from(document.getElementsByClassName("bearbeite-falsch")).map(f => f.value.trim());

  if (!frage || !richtig || falsch.some(f => !f)) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/aufgaben/${klasse}`);
    const daten = await res.json();

    daten.faecher[fach][aktuelleBearbeitung.index] = {
      frage,
      antworten: [...falsch, richtig].sort(() => Math.random() - 0.5),
      richtigeAntwort: richtig
    };

    await fetch(`${API_BASE}/api/aufgaben/${klasse}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(daten)
    });

    zeigeErfolgPopup("✅ Aufgabe gespeichert");
    document.getElementById("bearbeiten-popup").classList.add("hidden");
    aktuelleBearbeitung.index = null;
    aktualisiereVorschau();
  } catch (err) {
    console.error("Fehler beim Speichern:", err);
    alert("Fehler beim Speichern.");
  }
}

function schliesseBearbeitenPopup() {
  document.getElementById("bearbeiten-popup").classList.add("hidden");
  aktuelleBearbeitung.index = null;
}


async function frageLoeschen(index) {
  if (!confirm("Diese Aufgabe wirklich löschen?")) return;

  const klasse = window.klassenDropdown.value;
  const fach = window.fachDropdown.value;


  const res = await fetch(`${API_BASE}/api/aufgaben/${klasse}`);
  const daten = await res.json();

  daten.faecher[fach].splice(index, 1);

  await fetch(`${API_BASE}/api/aufgaben/${klasse}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(daten)
  });

  zeigeErfolgPopup("🗑️ Aufgabe gelöscht");
  aktualisiereVorschau();
}

// 
async function zeigeBelohnungsModal() {
  const container = document.getElementById("admin-aktionsbereich");
  container.innerHTML = "<h2>🎁 Belohnungsverwaltung</h2>";

  const buttonArea = document.createElement("div");
  buttonArea.className = "button-area";

  const btnNutzer = document.createElement("button");
  btnNutzer.innerText = "🎁 Nutzer-Belohnungen anzeigen";
  btnNutzer.className = "login-button";
  btnNutzer.onclick = zeigeBelohnungen;
  buttonArea.appendChild(btnNutzer);

  const btnVerteilen = document.createElement("button");
  btnVerteilen.innerText = "✨ Belohnung anlegen";
  btnVerteilen.className = "login-button";
  btnVerteilen.onclick = verwalteBelohnungenAnlegen;
  buttonArea.appendChild(btnVerteilen);


  const btnAlle = document.createElement("button");
  btnAlle.innerText = "📜 Alle verfügbaren Belohnungen";
  btnAlle.className = "login-button";
  btnAlle.onclick = zeigeAlleBelohnungenPopup;
  buttonArea.appendChild(btnAlle);

  container.appendChild(buttonArea);
}

async function verwalteBelohnungenAnlegen() {
  const container = document.getElementById("admin-aktionsbereich");
  container.innerHTML = "<h3>✨ Neue Belohnung anlegen</h3>";

  // Felder erstellen
  const felder = [
    { id: "neue-belohnung-name", label: "Titel (z. B. Neues Avatar)" },
    { id: "neue-belohnung-beschreibung", label: "Beschreibung" },
    { id: "neue-belohnung-typ", label: "Typ (z. B. avatar, item, bonus, geld)" },
    { id: "neue-belohnung-wert", label: "Wert (z. B. avatar-01, 2€, pause-5min)" }
  ];

  felder.forEach(f => {
    const label = document.createElement("label");
    label.innerText = f.label;
    container.appendChild(label);

    const input = document.createElement("input");
    input.type = "text";
    input.id = f.id;
    input.placeholder = f.label;
    input.style.display = "block";
    input.style.marginBottom = "15px";
    input.style.width = "100%";
    container.appendChild(input);
  });

  const speichernBtn = document.createElement("button");
  speichernBtn.innerText = "💾 Belohnung speichern";
  speichernBtn.className = "login-button";
  speichernBtn.onclick = async () => {
    // Eingaben auslesen
    const name = document.getElementById("neue-belohnung-name").value.trim();
    const beschreibung = document.getElementById("neue-belohnung-beschreibung").value.trim();
    const typ = document.getElementById("neue-belohnung-typ").value.trim();
    const wert = document.getElementById("neue-belohnung-wert").value.trim();

    if (!name || !beschreibung || !typ || !wert) {
      alert("Bitte alle Felder ausfüllen.");
      return;
    }

    // Bestehende Belohnungen laden
    let belohnungen = [];
    try {
      const res = await fetch(`${API_BASE}/api/belohnungen`);
      belohnungen = await res.json();
    } catch (err) {
      console.error("Fehler beim Laden der Belohnungen:", err);
      alert("Fehler beim Laden der bestehenden Belohnungen.");
      return;
    }

    // Freies Level ermitteln
    const belegteLevel = new Set(belohnungen.map(b => b.level));
    let level = 1;
    while (belegteLevel.has(level)) level++;

    const neueBelohnung = { level, name, beschreibung, typ, wert };
    belohnungen.push(neueBelohnung);

    // Neue Liste an Server senden
    try {
      await fetch(`${API_BASE}/api/belohnungen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(belohnungen, null, 2)
      });

      alert(`✅ Belohnung für Level ${level} gespeichert.`);
      zeigeBelohnungsModal();
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Fehler beim Speichern der Belohnung.");
    }
  };

  container.appendChild(speichernBtn);
}


// ➤ Nutzer-Belohnungen anzeigen
async function zeigeBelohnungen() {
  const container = document.getElementById("admin-aktionsbereich");
  container.innerHTML = "<h2>🎁 Nutzer-Belohnungen</h2>";

  let nutzerListe = [];
  let belohnungsListe = [];

  try {
    const nutzerResponse = await fetch(`${API_BASE}/api/users`);
    nutzerListe = await nutzerResponse.json();

    const belohnungResponse = await fetch(`${API_BASE}/api/belohnungen`);
    belohnungsListe = await belohnungResponse.json();
  } catch (err) {
    console.error("Fehler beim Laden der Daten:", err);
    container.innerHTML += "<p>Fehler beim Laden der Nutzer- oder Belohnungsdaten.</p>";
    return;
  }

  // Nur Schüler auswählen
  const schuelerListe = nutzerListe.filter(nutzer => nutzer.rolle === "schüler");

  if (schuelerListe.length === 0) {
    container.innerHTML += "<p>Keine Schüler mit Belohnungen gefunden.</p>";
    return;
  }

  const tabelle = document.createElement("table");
  tabelle.style.width = "100%";
  tabelle.style.borderCollapse = "collapse";
  tabelle.innerHTML = `
    <tr style="background-color:#eee;">
      <th>Name</th>
      <th>Level</th>
      <th>Erhaltene Belohnungen</th>
    </tr>`;

  schuelerListe.forEach(nutzer => {
    const level = Math.floor((nutzer.xp || 0) / 25) + 1;
    const belohnungen = nutzer.praemien || [];

    const belohnungsHTML = belohnungen.length
      ? `<ul class="belohnungsliste">${belohnungen.map(p => `<li>${p.name} <small>(${p.datum})</small></li>`).join("")}</ul>`
      : "<em>Keine</em>";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${nutzer.name}</td>
      <td>${level}</td>
      <td>${belohnungsHTML}</td>
    `;
    tabelle.appendChild(row);
  });

  container.appendChild(tabelle);
}

// ➤ Belohnungen automatisch verteilen
async function automatischeBelohnungVerteilen() {
  try {
    const [nutzerRes, belohnungRes] = await Promise.all([
      fetch(`${API_BASE}/api/users`),
      fetch(`${API_BASE}/belohnungen`)
    ]);
    const nutzerListe = await nutzerRes.json();
    const belohnungen = await belohnungRes.json();

    for (const nutzer of nutzerListe) {
      const level = Math.floor((nutzer.xp || 0) / 25) + 1;
      const vorhandene = new Set((nutzer.praemien || []).map(p => p.name));
      const neue = belohnungen.filter(b => b.level <= level && !vorhandene.has(b.name))
                              .map(b => ({ ...b, datum: new Date().toISOString().split("T")[0] }));

      if (neue.length > 0) {
        nutzer.praemien = [...(nutzer.praemien || []), ...neue];
        await fetch(`${API_BASE}/api/users`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nutzer)
        });
      }
    }

    alert("✅ Alle passenden Belohnungen wurden vergeben.");
    zeigeBelohnungsModal();
  } catch (err) {
    console.error("Fehler beim automatischen Verteilen:", err);
    alert("Fehler beim Verteilen.");
  }
}

// ➤ Popup mit allen Belohnungen
async function zeigeAlleBelohnungenPopup() {
  try {
    const res = await fetch(`${API_BASE}/api/belohnungen`);
    const belohnungen = await res.json();

    const popup = document.createElement("div");
    popup.id = "belohnung-popup";
    popup.className = "popup";
    popup.innerHTML = `
      <h3>🎁 Alle verfügbaren Belohnungen</h3>
      <ul class='belohnungsliste'>
        ${belohnungen.map(b => `<li><strong>${b.name}</strong> (Level ${b.level})<br>${b.beschreibung}</li>`).join("")}
      </ul>
    `;

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 8000);
  } catch (err) {
    console.error("Fehler beim Laden der Belohnungen:", err);
    alert("Fehler beim Anzeigen der Belohnungen.");
  }
}

async function zeigeKlassenUebersicht() {
  const container = document.getElementById("admin-aktionsbereich");
  container.innerHTML = "<h2>📊 Klassenübersicht</h2>";

  try {
    const response = await fetch(`${API_BASE}/api/verfuegbare-klassen`);
    const { klassen } = await response.json();

    if (!klassen.length) {
      container.innerHTML += "<p>Keine Klassendateien gefunden.</p>";
      return;
    }

    const tabelle = document.createElement("table");
    tabelle.style.width = "100%";
    tabelle.style.borderCollapse = "collapse";
    tabelle.innerHTML = `
      <tr style="background-color:#eee;">
        <th>Klasse</th>
        <th>Fach</th>
        <th>Aufgaben</th>
      </tr>`;

    for (const klasse of klassen) {
      const aufgabenRes = await fetch(`${API_BASE}/api/aufgaben/${klasse}`);
      const daten = await aufgabenRes.json();

      const faecher = Object.entries(daten.faecher || {});
      if (faecher.length === 0) {
        tabelle.innerHTML += `<tr><td>Klasse ${klasse}</td><td colspan="2"><em>Keine Fächer gefunden</em></td></tr>`;
      } else {
        for (const [fach, fragen] of faecher) {
          tabelle.innerHTML += `
            <tr>
              <td>${klasse}</td>
              <td>${fach}</td>
              <td>${fragen.length}</td>
            </tr>`;
        }
      }
    }

    container.appendChild(tabelle);
  } catch (err) {
    console.error("Fehler beim Laden der Klassenübersicht:", err);
    container.innerHTML += "<p>Fehler beim Laden der Übersicht.</p>";
  }

  const zurueck = document.createElement("button");
  zurueck.innerText = "⬅ Zurück";
  zurueck.className = "antwort-button";
  zurueck.style.marginTop = "20px";
  zurueck.onclick = zeigeNutzerVerwaltung;
  container.appendChild(zurueck);
}

