---
trigger: always_on
---

# Laurins Regeln für Saskias Projekte

Ablage: im Projekt als `.agents/rules/laurin.md` oder global für alle Projekte als `C:\Users\<Name>\.gemini\config\rules\laurin.md`. Die drei Zeilen mit `trigger` ganz oben müssen bleiben, sonst ignoriert Antigravity die Datei.

## Über mich

- Ich bin Saskia. Ich baue Websites und Shopify-Shops. Fortgeschritten, keine Grundlagen erklären.
- Windows: Befehle für PowerShell, Pfade mit Backslash.
- Antworten auf Deutsch, Du-Form, kurz. Rückfragen ans Ende, höchstens zwei.

## Arbeitsweise

- Erst lesen, dann ändern. Vor jeder Änderung die betroffenen Dateien ansehen.
- Vor größeren Änderungen (mehrere Dateien, Struktur, Löschen, Design-Umbau) einen kurzen Plan zeigen und auf mein Okay warten.
- Nur ändern, was ich gefragt habe. Nichts nebenbei umbenennen, aufräumen oder "verbessern".
- Eins nach dem anderen: eine Section oder ein Bug pro Schritt, danach stoppen und zeigen.
- Bug: erst Ursache finden, dann fixen, dann prüfen. Nach zwei Fehlversuchen stoppen, Ursache nennen, neuen Plan vorschlagen.
- Nie "fertig" sagen ohne Prüfung im Browser. Sagen, was nicht geprüft wurde.
- Keine Passwörter, API-Keys oder `.env`-Dateien committen.
- Nie direkt an einer Live-Seite arbeiten. Kopie oder Branch, dann in einem Rutsch live.

## Design

- Die `DESIGN.md` im Projekt ist die Quelle der Wahrheit für Farben, Schriften, Abstände und Bewegung. Vor jeder Design-Arbeit lesen.
- Der eigene Look der Marke schlägt generische Skill-Regeln.
- Mobil zuerst. Prüfen bei 320, 375, 768, 1024 und 1440 px, kein seitliches Scrollen.
- Schriften selbst hosten, keine externen Font-Links (DSGVO).
- Verboten: lila-blaue Verläufe, Hero plus drei gleiche Karten, überall dieselben runden Ecken und Schatten, Icons in runden Quadraten, Emoji-Aufzählungen, unverändertes Standard-Grau aus UI-Bibliotheken, Glas-Effekt aus Reflex, kleine Großbuchstaben-Überschriften über jeder Section, Pfeil auf jedem Button, Einblenden von unten auf jeder Section, Bounce-Easing, reines Schwarz.
- Polish in Runden, eins nach dem anderen: critique, polish, typeset, animate, adapt, optimize.
- Animationen nur über `transform` und `opacity`, `prefers-reduced-motion` respektieren.

## Shopify

- Nur Dev-Store oder unveröffentlichtes Theme.
- Erlaubt: `shopify theme pull`, `shopify theme dev --store <shop>`, `shopify theme check`, `shopify theme push --unpublished`.
- Verboten: `--live`, `--publish`, `--allow-live`. Live schaltet Saskia selbst im Admin.
- Jeden Shopify-Befehl vor dem Ausführen zeigen und in einem Satz erklären.

## Inhalte und Recht

- Keine erfundenen Zahlen, Bewertungen oder Kundenstimmen.
- Impressum und Datenschutz auf jeder Website, beim Shop auch AGB, Widerruf, Versand.
- Rechtstexte nicht erfinden, nur einbauen und formatieren. Die Texte kommen aus einer Kanzlei-App oder vom Anwalt.
