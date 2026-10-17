# Website-Workflow

Acht Stationen, immer in dieser Reihenfolge: Brief, Referenzen, DESIGN.md, bauen, Polish-Schleife, QA, Rechtliches, live. Wenn Saskia mittendrin einsteigt, finde die Station, an der sie steht, und mach von dort weiter.

## Welches Tool wofür

- **Claude-Desktop-App:** denken, planen, Brief, Texte, Recherche, Design-Richtung. Ein Projekt pro Website ("+ New Project" > "Set project instructions", dazu Wissensdateien). Jedes Projekt hat sein eigenes Memory.
- **Claude Design** (in jedem Chat und im Artifacts-Tab): Entwürfe ausprobieren, Export als HTML oder ZIP, Übergabe an Claude Code möglich.
- **Antigravity mit Claude:** bauen, Code, Dateien im Projektordner. Claude Opus 5.5 oder Sonnet 5.5 (Thinking) im Dropdown unter dem Eingabefeld. Regeln in `.agents\rules\`, Skills in `.agents\skills\` oder global.
- **Code-Tab der Desktop-App:** Claude Code ohne Terminal, mit Browser-Vorschau der laufenden Seite. Gute Alternative zum Bauen.

Projektordner auf Windows, zum Beispiel: `C:\Users\<Name>\Websites\<projekt>\`

## 1. Brief

Siehe `brief-builder.md`. Ohne Brief kein Code. Neues Projekt, neuer Chat.

## 2. Referenzen

Drei bis fünf echte Seiten, und zu jeder: was genau gefällt. Screenshots direkt in den Chat (Win+Shift+S, dann Strg+V).

```
Hier sind meine Referenzen: [Links oder Screenshots]
Beschreib für jede in drei Stichpunkten, was sie ausmacht:
Schrift, Abstände, Farben, Bildstil, Bewegung.
Dann sag mir, was davon zu meinem Brief passt und was nicht.
```

## 3. DESIGN.md

Eine Datei im Projektordner, die festhält, wie die Seite aussieht. Sie ist die Quelle der Wahrheit, für Claude in der App und in Antigravity.

```
Schreib eine DESIGN.md für das Projekt, basierend auf Brief, Referenzen
und der gewählten Richtung. Inhalt:
- Farben als Tokens mit Hex-Werten (kein reines Schwarz)
- Schriften (selbst gehostet, keine Google-Fonts-Links wegen DSGVO), Größen-Skala
- Abstände, Ecken, Schatten (bewusst unterschiedlich, nicht überall gleich)
- Bildstil
- Bewegung: was sich bewegt, wie schnell, was nie
- Komponenten: Buttons, Karten, Navigation
- No-Gos
Kurz und konkret, keine Prosa.
```

## 4. Bauen

- Erst Plan, dann Code. Im Code-Tab gibt es dafür den Plan-Modus.
- Eine Section nach der anderen. Zuerst das Hero, und zwar als echtes, fertiges Hero, nicht als Skizze.
- Mobil zuerst. Nach jeder Section im Browser anschauen.

```
Lies DESIGN.md. Bau nur das Hero der Startseite, mobil zuerst.
Zeig mir vorher, welche Dateien du anlegst.
Danach stoppst du, ich schau es mir im Browser an.
```

## 5. Polish-Schleife

Mit dem Skill impeccable, in dieser Reihenfolge, eins pro Runde: critique, polish, typeset, animate, adapt, optimize. Nach jeder Runde im Browser prüfen.

```
Nutze impeccable mit critique auf die Startseite.
Gib mir die fünf wichtigsten Punkte, sortiert nach Wirkung.
Noch nichts ändern.
```

Danach: "Setz Punkt 1 bis 3 um, nichts anderes." Dann die nächste Runde.

Der eigene Look der Marke schlägt die Skill-Regeln. Wenn ein Skill etwas vorschlägt, was der DESIGN.md widerspricht, gewinnt die DESIGN.md.

## 6. QA

- Breiten 320, 375, 768, 1024 und 1440 px, hell und dunkel, falls es einen Dark Mode gibt.
- Kein seitliches Scrollen am Handy.
- Am echten Handy anschauen, nicht nur im Browser-Gerätemodus (F12, dann Strg+Shift+M).
- Qualität, Ladezeit, Barrierefreiheit und SEO mit dem Skill web-quality-audit prüfen.
- Cache: hart neu laden mit Strg+F5 oder im privaten Fenster testen.

```
Prüf die Seite vor dem Livegang:
- Breiten 320, 375, 768, 1024, 1440 px: seitliches Scrollen, abgeschnittene Texte, zu kleine Klickflächen
- Bilder: Größe, Breite und Höhe gesetzt, lazy loading unterhalb des ersten Bildschirms
- Kontraste und Tastaturbedienung
- Title und Description auf jeder Seite
Liste die Probleme mit Datei und Zeile auf. Sag mir auch, was du nicht prüfen konntest.
```

## 7. Rechtliches

- Impressum und Datenschutzerklärung auf jeder Website.
- Beim Shop zusätzlich AGB, Widerruf und Versandinfos.
- Schriften selbst hosten, keine externen Font-Links (DSGVO).
- Rechtstexte nicht von Claude erfinden lassen. Besser aus einer Kanzlei-App oder vom Anwalt. Claude darf sie einbauen und formatieren.

## 8. Live

- In einer Kopie oder einem Branch arbeiten, nie direkt an der Live-Seite.
- Komplett in einem Rutsch live, nicht stückchenweise.
- Danach auf der echten Adresse am Handy prüfen. Cache leeren.
- Wenn lokal alles geht und live nicht: `fehler-doktor.md`, Abschnitt "Lokal geht's, live nicht".

## Arbeitsregeln, die immer gelten

- Feature: Plan, umsetzen, prüfen. Bug: Ursache finden, fixen, prüfen.
- Erst lesen, dann ändern. Nur das ändern, was gefragt ist.
- Nie "fertig" sagen ohne Prüfung im Browser. Sagen, was nicht geprüft wurde.
- Keine Geheimnisse, Passwörter oder `.env`-Dateien in Git.
