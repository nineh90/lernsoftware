let ausgewaehlterNutzer = null;
const API_BASE = window.location.origin;


async function ladeNutzer() {
  try {
    const response = await fetch(`${API_BASE}/api/users`);
    const nutzerListe = await response.json();
    const container = document.querySelector('.user-list');
    if (!container) return;

    container.innerHTML = '';

    for (const nutzer of nutzerListe) {
      const gespeicherteXP = nutzer.xp || 0;
      const level = Math.floor(gespeicherteXP / 25) + 1;
      const restXP = gespeicherteXP % 25;
      const prozent = (restXP / 25) * 100;
      const avatarUrl = nutzer.avatarId
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nutzer.avatarId}.png`
        : 'assets/default-avatar.png';
      const box = document.createElement('div');
      box.className = 'user-box';
      box.innerHTML = `
        <img class="avatar" src="${avatarUrl}" alt="${nutzer.name}">
        <div class="kleine-fleisssterne">
         ${[1, 2, 3].map(n =>
         ` <img src="assets/stern_${nutzer.fleisssterne >= n ? 'gold' : 'grau'}.png" class="mini-stern" alt="Stern ${n}">`
         ).join('')}
         </div>
        <h3 class="username">${nutzer.name}</h3>
        <div class="rolle">${nutzer.rolle}</div>
        <div class="level">Level ${level}</div>
        <div class="xp">XP: ${gespeicherteXP}</div>
        <div class="xp-bar">
          <div class="xp-progress" style="width: ${prozent}%;"></div>
        </div>
      `;

      box.addEventListener('click', () => {
        ausgewaehlterNutzer = nutzer;
        markiereAktivenNutzer(box);
        nutzer.rolle === "admin" ? zeigePasswortFeld() : versteckePasswortFeld();
      });

      container.appendChild(box);
    }
  } catch (error) {
    console.error("Fehler beim Laden der Nutzer:", error);
  }
}


function markiereAktivenNutzer(box) {
  document.querySelectorAll('.user-box').forEach(el => el.classList.remove('active'));
  box.classList.add('active');
}

function zeigePasswortFeld() {
  document.getElementById('passwort-bereich')?.classList.remove('hidden');
}

function versteckePasswortFeld() {
  document.getElementById('passwort-bereich')?.classList.add('hidden');
}

function anmelden() {
  if (!ausgewaehlterNutzer) {
    alert("Bitte Nutzer auswählen!");
    return;
  }

  if (ausgewaehlterNutzer.rolle === "admin") {
    const eingabe = document.getElementById('admin-passwort').value;
    if (eingabe !== ausgewaehlterNutzer.passwort) {
      alert("Falsches Passwort!");
      return;
    }
    localStorage.setItem("aktuellerUser", JSON.stringify(ausgewaehlterNutzer));
    window.location.href = "admin.html";
  } else {
    localStorage.setItem("aktuellerUser", JSON.stringify(ausgewaehlterNutzer));
    öffneSchuelerModal(ausgewaehlterNutzer);
  }
}

function öffneSchuelerModal(user) {
  const nameEl = document.getElementById("schueler-name");
  const xpEl = document.getElementById("schueler-xp");
  const avatarEl = document.getElementById("schueler-avatar");
  const levelEl = document.getElementById("schueler-level");
  const klasseEl = document.getElementById("schueler-klasse");

  if (!nameEl || !xpEl || !avatarEl || !levelEl || !klasseEl) {
    console.error("Ein oder mehrere DOM-Elemente fehlen für das Schülermodal.");
    return;
  }

  const gespeicherteXP = user.xp || 0;
  const level = Math.floor(gespeicherteXP / 25) + 1;
  const restXP = gespeicherteXP % 25;
  const prozent = (restXP / 25) * 100;

  nameEl.innerText = user.name;
  xpEl.innerText = `XP: ${gespeicherteXP}`;
  avatarEl.src = user.avatarId
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${user.avatarId}.png`
    : 'assets/default-avatar.png';
  levelEl.innerText = level;
  klasseEl.innerText = user.schuljahr ? `Klasse ${user.schuljahr}` : "";

  const xpProgress = document.querySelector("#schueler-modal .xp-progress");
  if (xpProgress) xpProgress.style.width = `${prozent}%`;

  document.querySelector(".login-container")?.classList.add("hidden");
  document.getElementById("logout-button")?.classList.remove("hidden");
  document.getElementById("schueler-modal")?.classList.remove("hidden");

  zeigeStartmenue(user);
  aktualisiereFleißsterne(user.lernzeit || 0);
}

async function waehleFach() {
  const user = JSON.parse(localStorage.getItem("aktuellerUser"));
if (!user || !user.schuljahr) {
  alert("Schuljahr nicht vorhanden.");
  return;
}

  if (!lernTimerAktiv) starteLernTimer();

  const aktionsbereich = document.getElementById("aktionsbereich");
  aktionsbereich.innerHTML = '';

  // const begruessung = document.createElement('h3');
  // begruessung.innerText = `Was möchtest du machen, ${user.name}?`;
  // begruessung.style.marginBottom = "15px";
  // begruessung.style.fontWeight = "bold";
  // aktionsbereich.appendChild(begruessung);

  try {
    const response = await fetch(`${API_BASE}/api/aufgaben/${user.schuljahr}`);
    const klassenDaten = await response.json();

    const faecher = Object.keys(klassenDaten.faecher);

    faecher.forEach(fach => {
      const button = document.createElement("button");
      button.innerText = fach;
      button.className = "login-button";

      button.onclick = () => {
        zeigeAufgaben(klassenDaten.faecher[fach], fach);
      };

      aktionsbereich.appendChild(button);
    });
  } catch (error) {
    console.error("Fehler beim Laden der Klassendaten:", error);
    aktionsbereich.innerHTML = "Fächer konnten nicht geladen werden.";
  }

}

function zeigeAufgaben(aufgaben, fach, user = null) {
  if (user) ausgewaehlterNutzer = user;
  starteLernTimer();

  const aktionsbereich = document.getElementById("aktionsbereich");
  aktionsbereich.innerHTML = '';

  const MAX_FRAGEN = 25;
  const fragenPool = [...aufgaben].sort(() => Math.random() - 0.5).slice(0, MAX_FRAGEN);
  let fragenQueue = [...fragenPool];
  const falschBeantwortet = new Set();

  function speichereXP(punkte) {
  if (!ausgewaehlterNutzer) return;

  const alteXP = ausgewaehlterNutzer.xp || 0;
  const neueXP = alteXP + punkte;

  const vorherigesLevel = Math.floor(alteXP / 25) + 1;
  const neuesLevel = Math.floor(neueXP / 25) + 1;

  ausgewaehlterNutzer.xp = neueXP;

  // Punkte pro Fach
  if (!ausgewaehlterNutzer.punkteByFach) ausgewaehlterNutzer.punkteByFach = {};
  if (!ausgewaehlterNutzer.punkteByFach[fach]) ausgewaehlterNutzer.punkteByFach[fach] = 0;
  ausgewaehlterNutzer.punkteByFach[fach] += punkte;

  // Neue XP-Berechnung
  const restXP = neueXP % 25;
  const prozent = (restXP / 25) * 100;

  // DOM-Elemente holen
  const xpAnzeige = document.getElementById("schueler-xp");
  const levelAnzeige = document.getElementById("schueler-level");
  const xpBar = document.querySelector("#schueler-modal .xp-bar .xp-progress");
  const avatar = document.getElementById("schueler-avatar");

  // DOM aktualisieren
  if (xpAnzeige) xpAnzeige.innerText = `XP: ${neueXP}`;
  if (levelAnzeige) {
    levelAnzeige.innerText = neuesLevel;

    if (neuesLevel > vorherigesLevel) {
      levelAnzeige.classList.add("level-boost");
      setTimeout(() => levelAnzeige.classList.remove("level-boost"), 600);
    }
  }

  if (xpBar) {
    xpBar.style.width = `${prozent}%`;

    if (neuesLevel > vorherigesLevel) {
      xpBar.classList.add("level-up");
      setTimeout(() => xpBar.classList.remove("level-up"), 1200);
    }
  }

  // 🐾 Avatar-Hop bei XP-Gewinn
  if (avatar) {
    avatar.classList.add("avatar-hop");
    setTimeout(() => avatar.classList.remove("avatar-hop"), 800);
  }

  // Belohnung prüfen
  if (neuesLevel > vorherigesLevel) {
    pruefeBelohnung(neuesLevel);
  }

  // Server speichern
  fetch(`${API_BASE}/api/users`, {
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ausgewaehlterNutzer)
  }).catch(err => console.error("Fehler beim Speichern der XP:", err));
}

  function zeigeAbschluss() {
    aktionsbereich.innerHTML = `<strong>Super, du hast alle Aufgaben in ${fach} geschafft! 🎓</strong>`;

    if (falschBeantwortet.size > 0) {
      const fehlerBox = document.createElement("div");
      fehlerBox.style.marginTop = "10px";
      fehlerBox.innerText = `Du hast ${falschBeantwortet.size} Aufgaben beim ersten Versuch falsch beantwortet.`;
      aktionsbereich.appendChild(fehlerBox);
    }

    const zurueckButton = document.createElement("button");
    zurueckButton.innerText = "⬅ Zurück zum Menü";
    zurueckButton.className = "antwort-button";
    zurueckButton.style.marginTop = "20px";
    zurueckButton.onclick = zurueckZumSchuelerModal;
    aktionsbereich.appendChild(zurueckButton);
  }

  function zeigeFrage() {
    if (fragenQueue.length === 0) {
      zeigeAbschluss();
      return;
    }

    const frage = fragenQueue.shift();
    aktionsbereich.innerHTML = '';

    const frageText = document.createElement("h3");
    frageText.innerText = frage.frage;
    frageText.style.marginBottom = "10px";
    aktionsbereich.appendChild(frageText);

    frage.antworten.forEach(antwort => {
      const button = document.createElement("button");
      button.innerText = antwort;
      button.className = "antwort-button";

button.onclick = () => {
  // Alle Antwort-Buttons deaktivieren
  const alleButtons = document.querySelectorAll(".antwort-button");
  alleButtons.forEach(b => b.disabled = true);

  const korrekt = antwort === frage.richtigeAntwort;
  zeigePopup(korrekt ? "Richtig! 🎉" : "Falsch! 😕", korrekt, 1600);

  const avatar = document.getElementById("schueler-avatar"); // Avatar holen

  if (korrekt) {
    speichereXP(1);
    // ggf. Hop-Animation bleibt wie gehabt
  } else {
    // ❌ Avatar wackelt bei falscher Antwort
    if (avatar) {
      avatar.classList.add("avatar-shake");
      setTimeout(() => avatar.classList.remove("avatar-shake"), 600);
    }

    const frageHash = frage.frage + "|" + frage.richtigeAntwort;
    if (!falschBeantwortet.has(frageHash)) {
      falschBeantwortet.add(frageHash);
      fragenQueue.push(frage); // nur einmalige Wiederholung
    }
  }

  setTimeout(zeigeFrage, 1600);
};

      aktionsbereich.appendChild(button);
    });

    const zurueckButton = document.createElement("button");
    zurueckButton.innerText = "⬅ Zurück";
    zurueckButton.className = "antwort-button";
    zurueckButton.style.marginTop = "20px";
    zurueckButton.onclick = zurueckZumSchuelerModal;
    aktionsbereich.appendChild(zurueckButton);
  }

  zeigeFrage();
}


let popupTimeout;

function zeigePopup(text, korrekt = false, dauer = 1500) {
  const popup = document.getElementById("feedback-popup");
  popup.innerText = text;
  popup.className = korrekt ? "richtig" : "falsch";
  popup.classList.remove("hidden");

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    popup.classList.add("hidden");
  }, dauer);
}

function berechneFleißsterne(lernzeitSekunden) {
  if (lernzeitSekunden >= 9000) return 3;
  if (lernzeitSekunden >= 4500) return 2;
  if (lernzeitSekunden >= 900) return 1;
  return 0;
}



function aktualisiereFleißsterne(lernzeitSekunden) {
  const aktuelleSterne = berechneFleißsterne(lernzeitSekunden);

  // Versuche DOM-Elemente zu holen
  const sterne = [1, 2, 3].map(n => document.getElementById(`stern-${n}`));
  if (sterne.some(s => !s)) {
    setTimeout(() => aktualisiereFleißsterne(lernzeitSekunden), 500);
    return;
  }

  // DOM-Anzeige aktualisieren
  sterne.forEach((stern, index) => {
    if (index < aktuelleSterne) {
      stern.classList.add("aktiv");
      stern.src = "assets/stern_gold.png";
    } else {
      stern.classList.remove("aktiv");
      stern.src = "assets/stern_grau.png";
    }
  });

  // Nur speichern und belohnen, wenn sich die Anzahl geändert hat
  if (ausgewaehlterNutzer && ausgewaehlterNutzer.fleisssterne !== aktuelleSterne) {
    ausgewaehlterNutzer.fleisssterne = aktuelleSterne;

    // Belohnung anzeigen und speichern
    pruefeZeitBelohnung(aktuelleSterne, lernzeitSekunden);

    fetch(`${API_BASE}/api/users`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ausgewaehlterNutzer)
    }).catch(err => console.error("Fehler beim Speichern der Fleißsterne:", err));

    localStorage.setItem("aktuellerUser", JSON.stringify(ausgewaehlterNutzer));
  }
}



async function pruefeBelohnung(level) {
  const response = await fetch(`${API_BASE}/api/belohnungen`);
  const belohnungen = await response.json();
console.log("Geladene Belohnungen vom Server:", belohnungen);

  const passende = belohnungen.find(b => b.level === level);


  if (passende && !ausgewaehlterNutzer.praemien?.some(p => p.name === passende.name)) {
    const datum = new Date().toISOString().split("T")[0];
    ausgewaehlterNutzer.praemien = [...(ausgewaehlterNutzer.praemien || []), { ...passende, datum }];

    // 👉 Zeige Belohnung in eigenem Popup
    const belohnungPopup = document.getElementById("belohnung-popup");
    if (belohnungPopup) {
      belohnungPopup.innerText = `🎁 Level-Up! "${passende.name}" freigeschaltet!`;
      belohnungPopup.classList.add("richtig");
      belohnungPopup.classList.remove("hidden");

      setTimeout(() => {
        belohnungPopup.classList.add("hidden");
      }, 5000);
    }

    await fetch(`${API_BASE}/api/users`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ausgewaehlterNutzer)
    });
  }
}

async function pruefeZeitBelohnung(stufe, lernzeitSekunden) {
  try {
    const res = await fetch(`${API_BASE}/api/zeitbelohnungen`);
    const belohnungen = await res.json();

    const passende = belohnungen.find(b => b.stufe === stufe);
    if (!passende) return;

    // Schon erhalten?
    const hatSchon = ausgewaehlterNutzer.praemien?.some(p => p.name === passende.name);
    if (hatSchon) return;

    // Speichern
    const datum = new Date().toISOString().split("T")[0];
    ausgewaehlterNutzer.praemien = [...(ausgewaehlterNutzer.praemien || []), { ...passende, datum }];

    await fetch(`${API_BASE}/api/users`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ausgewaehlterNutzer)
    });

    localStorage.setItem("aktuellerUser", JSON.stringify(ausgewaehlterNutzer));

    // Lernzeit
    const stunden = Math.floor(lernzeitSekunden / 3600);
    const minuten = Math.floor((lernzeitSekunden % 3600) / 60);
    const sekunden = lernzeitSekunden % 60;

    const nachricht = `🎉 Glückwunsch! Du hast ${stunden} Stunden ${minuten} Minuten ${sekunden} Sekunden gelernt. 
\n\n${passende.beschreibung}`;

    const popup = document.getElementById("belohnung-popup");
    if (popup) {
      popup.innerText = nachricht;
      popup.classList.add("richtig");
      popup.classList.remove("hidden");

      setTimeout(() => {
        popup.classList.add("hidden");
      }, 6000);
    }

  } catch (err) {
    console.error("Fehler bei Zeitbelohnung:", err);
  }
}




function zurueckZumSchuelerModal() {
  if (!ausgewaehlterNutzer) return;

  // Zeige das Schüler-Modal
  const modal = document.getElementById("schueler-modal");
  modal?.classList.remove("hidden");

  // Zeige wieder den Avatar
  const avatar = document.getElementById("schueler-avatar");
  avatar?.classList.remove("hidden");

  // Verstecke den Timer
  const timerRing = document.querySelector(".timer-ring");
  timerRing?.classList.add("hidden");

  // Menü neu aufbauen
  zeigeStartmenue(ausgewaehlterNutzer);
  aktualisiereFleißsterne(ausgewaehlterNutzer.lernzeit || 0);
}



function zeigeErfolge() {
  const container = document.getElementById('aktionsbereich');
  container.innerHTML = '';

  // const titel = document.createElement("h2");
  // titel.innerText = "Deine freigeschalteten Belohnungen 🏆";
  // container.appendChild(titel);

  const belohnungen = ausgewaehlterNutzer.praemien || [];

  if (belohnungen.length === 0) {
    const info = document.createElement("p");
    info.innerText = "Du hast noch keine Belohnungen freigeschaltet.";
    container.appendChild(info);
  } else {
    const liste = document.createElement("ul");
    liste.className = "belohnungsliste";

    belohnungen.forEach(eintrag => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${eintrag.name}</strong> – freigeschaltet am ${eintrag.datum}`;
      liste.appendChild(li);
    });

    container.appendChild(liste);
  }

  const zurueckButton = document.createElement('button');
  zurueckButton.innerText = '⬅ Zurück';
  zurueckButton.className = 'antwort-button';
  zurueckButton.onclick = zurueckZumSchuelerModal;
  container.appendChild(zurueckButton);
}



function schliesseAvatarAuswahl() {
  document.getElementById("avatar-bearbeiten-modal").classList.add("hidden");
}


async function zeigeFaecherMenue(user) {
  const container = document.getElementById('aktionsbereich');
  if (!container) return;

  // 👇 Timer-Anzeige aktualisieren
  if (lernTimerAktiv) {
    // document.getElementById("schueler-avatar")?.classList.add("hidden");
    document.querySelector(".timer-ring")?.classList.remove("hidden");
  }

  container.innerHTML = '';

  // const begruessung = document.createElement("h4");
  // begruessung.innerText = `Welches Fach möchtest du lernen, ${user.name}?`;
  // container.appendChild(begruessung);

  try {
    const response = await fetch(`${API_BASE}/api/aufgaben/${user.schuljahr}`);
    const klassenDaten = await response.json();
    const faecher = Object.keys(klassenDaten.faecher);

    faecher.forEach(fach => {
      const button = document.createElement('button');
      button.className = 'fach-button';
      button.innerText = fach;

      button.addEventListener('click', () => {
        starteFach(fach, user); // ⬅ deine bestehende Logik
      });

      container.appendChild(button);
    });
  } catch (err) {
    console.error("Fehler beim Laden der Fächer:", err);
    container.innerHTML = "<p>Fächer konnten nicht geladen werden.</p>";
  }

  const zurueckButton = document.createElement("button");
  zurueckButton.innerText = "⬅ Zurück";
  zurueckButton.className = "antwort-button";
  zurueckButton.style.marginTop = "20px";
  zurueckButton.onclick = zurueckZumSchuelerModal;
  container.appendChild(zurueckButton);
}

function zeigeStartmenue(user) {
  document.getElementById("schueler-avatar")?.classList.remove("avatar-pulsierend");
  const container = document.getElementById('aktionsbereich');
  if (!container) return;

  container.innerHTML = '';

  // const begruessung = document.createElement("h3");
  // begruessung.innerText = `Was möchtest du machen, ${user.name}?`;
  // container.appendChild(begruessung);

  const buttons = [
    { text: "Fach wählen", handler: () => zeigeFaecherMenue(user) },
    { text: "Erfolge anzeigen", handler: () => zeigeErfolge() },
    { text: "Schulklasse", handler: () => bearbeiteKlasse() },
    { text: "Avatar bearbeiten", handler: () => bearbeiteAvatar() },
    { text: "Vokabeltrainer", handler: () => zeigeVokabelmenue() }
  ];

  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.className = 'antwort-button';
    button.innerText = btn.text;
    button.onclick = btn.handler;
    container.appendChild(button);
  });
}

function zeigeVokabelmenue() {
  const container = document.getElementById("aktionsbereich");
  container.innerHTML = '';

  const titel = document.createElement("h2");
  titel.innerText = "🧠 Vokabeltrainer";
  container.appendChild(titel);

  const abfragenButton = document.createElement("button");
  abfragenButton.innerText = "📖 Vokabeln abfragen";
  abfragenButton.onclick = () => {
    // TODO: Vokabelabfrage starten
    alert("Funktion 'Vokabeln abfragen' kommt bald!");
  };

  const einpflegenButton = document.createElement("button");
  einpflegenButton.innerText = "✍️ Vokabeln einpflegen";
  einpflegenButton.onclick = () => {
    // TODO: Eingabemaske für neue Vokabeln
    alert("Funktion 'Vokabeln einpflegen' kommt bald!");
  };

  const zurueckButton = document.createElement("button");
  zurueckButton.innerText = "⬅ Zurück";
  zurueckButton.onclick = () => zeigeStartmenue(ausgewaehlterNutzer);

  [abfragenButton, einpflegenButton, zurueckButton].forEach(btn => {
    btn.className = "antwort-button";
    container.appendChild(btn);
  });
}




function starteFach(fach, user) {
  // Schuljahr prüfen (kann auch direkt vom user kommen)
  if (!user.schuljahr) {
    alert("Schuljahr nicht vorhanden.");
    return;
  }

  fetch(`${API_BASE}/api/aufgaben/${user.schuljahr}`)
    .then(response => response.json())
    .then(klassenDaten => {
      const aufgaben = klassenDaten.faecher[fach];
      if (!aufgaben) {
        alert(`Keine Aufgaben für das Fach "${fach}" gefunden.`);
        return;
      }
      zeigeAufgaben(aufgaben, fach, user);
    })
    .catch(err => {
      console.error("Fehler beim Laden der Aufgaben:", err);
    });

}

let lernTimerAktiv = false;
let istPause = false;
let verbleibend = 600; // 10 Minuten Lernzeit
let timerInterval;

function starteLernTimer() {
  stoppeTimer(); // vorherigen Timer sicher stoppen
  lernTimerAktiv = true;

  const avatar = document.getElementById("schueler-avatar");
  const timerRing = document.querySelector(".timer-ring");
  if (timerRing) timerRing.classList.remove("hidden");

  timerInterval = setInterval(() => {
    verbleibend--;

    // 🧠 Lernzeit hochzählen (nicht in der Pause)
    if (!istPause && ausgewaehlterNutzer) {
      ausgewaehlterNutzer.lernzeit = (ausgewaehlterNutzer.lernzeit || 0) + 1;
      aktualisiereFleißsterne(ausgewaehlterNutzer.lernzeit);
      fetch(`${API_BASE}/api/users`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ausgewaehlterNutzer)
      }).catch(err => console.error("Fehler beim Speichern der Lernzeit:", err));
    }

    // ⏱ Anzeige aktualisieren
    aktualisiereTimerText(verbleibend);
    aktualisiereRing(verbleibend, istPause ? 300 : 600);

    if (verbleibend <= 0) {
      if (!istPause) {
        document.getElementById("schueler-avatar")?.classList.add("avatar-pulsierend");
        istPause = true;
        verbleibend = 300; // ⏸ 5 Minuten Pause
        zeigePauseAnzeige();
      } else {
        document.getElementById("schueler-avatar")?.classList.remove("avatar-pulsierend");
        istPause = false;
        verbleibend = 600; // ▶️ 10 Minuten Lernen
        zeigeStartmenue(ausgewaehlterNutzer); // zurück ins Schülermenü
      }
    }

  }, 1000);
}

function zeigePauseAnzeige() {
  document.getElementById("schueler-avatar")?.classList.add("avatar-pulsierend");
  const aktionsbereich = document.getElementById("aktionsbereich");
  aktionsbereich.innerHTML = `
    <h2>🧘 Pausezeit!</h2>
    <p>Jetzt ist Zeit zum Entspannen. In 5 Minuten geht's weiter.</p>
  `;

  // Optional: Timer anzeigen
  const timerAnzeigen = document.createElement("p");
  timerAnzeigen.id = "pause-countdown";
  aktionsbereich.appendChild(timerAnzeigen);

  const countdownUpdate = setInterval(() => {
    const min = Math.floor(verbleibend / 60).toString().padStart(2, '0');
    const sec = (verbleibend % 60).toString().padStart(2, '0');
    timerAnzeigen.textContent = `⏳ ${min}:${sec}`;
    if (verbleibend <= 0) clearInterval(countdownUpdate);
  }, 1000);
}


function aktualisiereTimerText(sekunden) {
  const min = Math.floor(sekunden / 60).toString().padStart(2, '0');
  const sec = (sekunden % 60).toString().padStart(2, '0');
  document.getElementById("timer-text").textContent = `${min}:${sec}`;
}

function aktualisiereRing(zeit, max) {
  const ring = document.querySelector('.ring-progress');
  const kreisumfang = 2 * Math.PI * 45; // Radius 45
  const fortschritt = 1 - zeit / max;
  const offset = kreisumfang * fortschritt;
  ring.style.strokeDashoffset = offset;
}




// bei Logout oder Abschluss
function stoppeTimer() {
  clearInterval(timerInterval);
} 


function starteTimerRing(dauerInSekunden) {
  const ring = document.querySelector('.ring-progress');
  const totalLength = 283; // definiert in CSS stroke-dasharray

  let start = Date.now();

  function aktualisiereRing() {
    const vergangen = (Date.now() - start) / 1000;
    const fortschritt = Math.min(vergangen / dauerInSekunden, 1);
    const offset = totalLength * (1 - fortschritt);
    ring.style.strokeDashoffset = offset;

    if (fortschritt < 1) {
      requestAnimationFrame(aktualisiereRing);
    }
  }

  aktualisiereRing();
}
async function bearbeiteKlasse() {
  if (!ausgewaehlterNutzer) return;

  const aktionsbereich = document.getElementById("aktionsbereich");
  aktionsbereich.innerHTML = '';

  const titel = document.createElement("h3");
  titel.innerText = "Wähle Schulklasse:";
  aktionsbereich.appendChild(titel);

  const dropdown = document.createElement("select");
  dropdown.className = "fach-button";

  const klassen = await ermittleVerfuegbareKlassen();
  klassen.forEach(klasse => {
    const option = document.createElement("option");
    option.value = klasse;
    option.text = `Klasse ${klasse}`;
    if (ausgewaehlterNutzer.schuljahr == klasse) option.selected = true;
    dropdown.appendChild(option);
  });

  aktionsbereich.appendChild(dropdown);

  const speichernButton = document.createElement("button");
  speichernButton.innerText = "Speichern";
  speichernButton.className = "antwort-button";
  speichernButton.onclick = async () => {
    const neueKlasse = parseInt(dropdown.value);
    ausgewaehlterNutzer.schuljahr = neueKlasse;
    try {
      await fetch(`${API_BASE}/api/users`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ausgewaehlterNutzer)
      });

      localStorage.setItem("aktuellerUser", JSON.stringify(ausgewaehlterNutzer));
      zeigePopup(`Klasse geändert zu ${neueKlasse}.`, true);
      öffneSchuelerModal(ausgewaehlterNutzer);
    } catch (err) {
      console.error("Fehler beim Speichern der Klasse:", err);
      zeigePopup("Fehler beim Speichern.", false);
    }
  };
  aktionsbereich.appendChild(speichernButton);

  const zurueckButton = document.createElement("button");
  zurueckButton.innerText = "⬅ Zurück";
  zurueckButton.className = "antwort-button";
  zurueckButton.style.marginTop = "20px";
  zurueckButton.onclick = zurueckZumSchuelerModal;
  aktionsbereich.appendChild(zurueckButton);
}

function bearbeiteAvatar() {
  const modal = document.getElementById("avatar-bearbeiten-modal");
  const container = document.getElementById("avatar-auswahl");
  if (!modal || !container || !ausgewaehlterNutzer) return;

  container.innerHTML = "";

  for (let i = 1; i <= 25; i++) {
    const img = document.createElement("img");
    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`;
    img.alt = `Avatar ${i}`;
    img.style.cursor = "pointer";

    img.addEventListener("click", async () => {
      ausgewaehlterNutzer.avatarId = i;

      try {
        await fetch(`${API_BASE}/api/users`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ausgewaehlterNutzer)
        });

        localStorage.setItem("aktuellerUser", JSON.stringify(ausgewaehlterNutzer));

        const avatarElement = document.getElementById("schueler-avatar");
        if (avatarElement) avatarElement.src = img.src;

        modal.classList.add("hidden");
      } catch (err) {
        console.error("Avatar konnte nicht gespeichert werden:", err);
        alert("Fehler beim Speichern des Avatars.");
      }
    });

    container.appendChild(img);
  }

  modal.classList.remove("hidden");
}

async function ermittleVerfuegbareKlassen() {
  try {
    const antwort = await fetch(`${API_BASE}/api/verfuegbare-klassen`);
    const daten = await antwort.json();
    return daten.klassen;
  } catch (err) {
    console.error("Fehler beim Ermitteln der Klassen:", err);
    return [];
  }
}

async function neuerNutzer() {
  const container = document.querySelector('.login-container');
  container.innerHTML = '<h2>Neuen Nutzer erstellen</h2>';

  const form = document.createElement('form');
  form.style.textAlign = "left";
  form.style.marginTop = "20px";

  form.innerHTML = `
    <label>Name:</label><br>
    <input type="text" id="neuer-name" required style="width:100%;"><br><br>

    <label>Rolle:</label><br>
    <select id="neue-rolle" style="width:100%;">
      <option value="schüler">Schüler</option>
      <option value="admin">Admin</option>
    </select><br><br>

    <div id="klassen-bereich">
      <label>Klasse (nur bei Schülern):</label><br>
      <select id="neue-klasse" style="width:100%;"></select><br><br>
    </div>


    <label>Avatar-ID (1–100):</label><br>
    <input type="number" id="neuer-avatar" min="1" max="100" style="width:100%;"><br>
    <div id="avatar-vorschau" style="text-align:center; margin:10px 0;">
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png" 
           alt="Avatar Vorschau" id="avatar-img" style="width:80px; height:80px;">
    </div><br>

    <label>Passwort (nur für Admins):</label><br>
    <input type="password" id="neues-passwort" style="width:100%;"><br><br>

    <button type="submit" class="login-button">✔ Nutzer anlegen</button>
    <button type="button" class="antwort-button" onclick="window.location.reload()">⬅ Zurück</button>
  `;

  form.onsubmit = async (e) => {
    e.preventDefault();

    const name = document.getElementById("neuer-name").value.trim();
    const rolle = document.getElementById("neue-rolle").value;
    const schuljahr = parseInt(document.getElementById("neue-klasse").value) || null;
    const avatarId = parseInt(document.getElementById("neuer-avatar").value) || 1;
    const passwort = document.getElementById("neues-passwort").value;

    if (!name) return alert("Bitte gib einen Namen ein.");
    if (rolle === "admin" && !passwort) return alert("Admins brauchen ein Passwort.");

    const neuerUser = {
      name,
      rolle,
      avatarId,
      xp: 0,
      lernzeit: 0,
      praemien: [],
      schuljahr: rolle === "schüler" ? schuljahr : null,
      ...(rolle === "schüler" ? { punkteByFach: {} } : {}),
      ...(rolle === "admin" ? { passwort } : {})
    };

    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(neuerUser)
      });

      if (!res.ok) throw new Error("Fehler beim Speichern");
      alert("✅ Nutzer wurde erfolgreich angelegt!");
      window.location.reload();
    } catch (err) {
      console.error("Fehler:", err);
      alert("❌ Fehler beim Anlegen des Nutzers.");
    }
  };

  container.appendChild(form);

  
const klassenDropdown = document.getElementById("neue-klasse");
const klassenBereich = document.getElementById("klassen-bereich");
const rolleSelect = document.getElementById("neue-rolle");

if (klassenDropdown) {
  const klassen = await ermittleVerfuegbareKlassen();
  klassen.forEach(klasse => {
    const opt = document.createElement("option");
    opt.value = klasse;
    opt.innerText = `Klasse ${klasse}`;
    klassenDropdown.appendChild(opt);
  });
}

// Sichtbarkeit anpassen
rolleSelect.addEventListener("change", () => {
  klassenBereich.style.display = rolleSelect.value === "schüler" ? "block" : "none";
});

// Initialstatus prüfen
rolleSelect.dispatchEvent(new Event("change"));



  // Avatar-Live-Vorschau aktualisieren
  const avatarInput = document.getElementById("neuer-avatar");
  const avatarImage = document.getElementById("avatar-img");
  avatarInput.addEventListener("input", () => {
    const id = parseInt(avatarInput.value);
    if (id >= 1 && id <= 100) {
      avatarImage.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    } else {
      avatarImage.src = `assets/default-avatar.png`;
    }
  });
}


function logout() {
  localStorage.removeItem("aktuellerUser");
  window.location.href = "index.html";
}


window.onload = () => {
  ladeNutzer();

  const gespeicherterUser = JSON.parse(localStorage.getItem("aktuellerUser"));
  if (gespeicherterUser?.rolle === "schüler") {
    öffneSchuelerModal(gespeicherterUser);
  } else if (gespeicherterUser?.rolle === "admin") {
    window.location.href = "admin.html";
  }
};
