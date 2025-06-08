const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static Files ausliefern (Frontend-Ordner: ../public)
app.use(express.static(path.join(__dirname, '..', 'public')));

// JSON-Dateipfade
const userPath = path.join(__dirname, 'data', 'user.json');
const belohnungenPath = path.join(__dirname, 'data', 'belohnungen.json');
const aufgabenPath = (klasse) => path.join(__dirname, 'data', 'aufgaben', `klasse${klasse}.json`);

// API: Nutzer abrufen
app.get('/api/users', (req, res) => {
  const users = JSON.parse(fs.readFileSync(userPath));
  res.json(users);
});

// API: Nutzer speichern
app.put('/api/users', (req, res) => {
  const updatedUser = req.body;
  if (!updatedUser || !updatedUser.id) {
    return res.status(400).json({ fehler: "Ungültige Nutzerdaten" });
  }

  const users = JSON.parse(fs.readFileSync(userPath));
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index === -1) {
    return res.status(404).json({ fehler: "Nutzer nicht gefunden" });
  }

  users[index] = updatedUser;
  fs.writeFileSync(userPath, JSON.stringify(users, null, 2));
  res.json({ erfolg: true });
});

// API: Belohnungen abrufen (angepasst für beide Formate)
app.get('/api/belohnungen', (req, res) => {
  if (!fs.existsSync(belohnungenPath)) {
    return res.status(404).json({ fehler: "Nicht gefunden" });
  }

  const daten = JSON.parse(fs.readFileSync(belohnungenPath));
  const belohnungen = Array.isArray(daten) ? daten : daten.belohnungen;

  if (!belohnungen) {
    return res.status(500).json({ fehler: "Keine Belohnungen gefunden" });
  }

  res.json(belohnungen);
});

// API: Aufgaben für Klasse X
app.get('/api/aufgaben/:klasse', (req, res) => {
  const filePath = aufgabenPath(req.params.klasse);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ fehler: "Datei nicht gefunden" });
  }

  const daten = JSON.parse(fs.readFileSync(filePath));
  res.json(daten);
});

// API: verfügbare Klassen ermitteln
app.get('/api/verfuegbare-klassen', (req, res) => {
  const aufgabenOrdner = path.join(__dirname, 'data', 'aufgaben');
  if (!fs.existsSync(aufgabenOrdner)) {
    return res.json({ klassen: [] });
  }

  const dateien = fs.readdirSync(aufgabenOrdner);
  const klassen = dateien
    .filter(datei => datei.startsWith('klasse') && datei.endsWith('.json'))
    .map(datei => parseInt(datei.replace('klasse', '').replace('.json', '')))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

    res.json({ klassen });
});

app.post('/api/users', (req, res) => {
  const neuerUser = req.body;
  if (!neuerUser || !neuerUser.name || !neuerUser.rolle) {
    return res.status(400).json({ fehler: "Ungültige Eingabe" });
  }

  const users = JSON.parse(fs.readFileSync(userPath));
  const neueId = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  neuerUser.id = neueId;

  users.push(neuerUser);
  fs.writeFileSync(userPath, JSON.stringify(users, null, 2));
  res.json({ erfolg: true, id: neueId });
});

app.put('/api/aufgaben/:klasse', (req, res) => {
  const filePath = aufgabenPath(req.params.klasse);
  const neueDaten = req.body;

  if (!neueDaten || !neueDaten.faecher) {
    return res.status(400).json({ fehler: "Ungültige Datenstruktur" });
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(neueDaten, null, 2));
    res.json({ erfolg: true });
  } catch (err) {
    console.error("Fehler beim Schreiben:", err);
    res.status(500).json({ fehler: "Speichern fehlgeschlagen" });
  }
});

app.put('/api/belohnungen', (req, res) => {
  const neueListe = req.body;
  if (!Array.isArray(neueListe)) {
    return res.status(400).json({ fehler: "Belohnungsliste muss ein Array sein" });
  }

  fs.writeFileSync(belohnungenPath, JSON.stringify(neueListe, null, 2));
  res.json({ erfolg: true });
});

const zeitbelohnungenPath = path.join(__dirname, 'data', 'zeitbelohnungen.json');

app.get('/api/zeitbelohnungen', (req, res) => {
  if (!fs.existsSync(zeitbelohnungenPath)) {
    return res.status(404).json({ fehler: "Nicht gefunden" });
  }

  const belohnungen = JSON.parse(fs.readFileSync(zeitbelohnungenPath));
  res.json(belohnungen);
});




// Server starten
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
