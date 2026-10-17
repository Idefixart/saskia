# Fehler-Doktor

Für jedes Symptom: Ursache, Fix, Prompt zum Kopieren. Finde das passende Symptom, erklär die Ursache in einem Satz und gib ihr den Prompt.

## Claude dreht sich im Kreis und macht dasselbe immer wieder kaputt

**Ursache:** Er rät Fixes, statt die Ursache zu suchen. Jeder Fehlversuch macht den Chat länger, unübersichtlicher und frisst Limit.

**Fix:** Nach zwei Fehlversuchen stoppen. Ursache nennen lassen, dann genau ein Fix. Bei langem Chat: Zusammenfassung, neuer Chat (siehe `frust-reset.md`).

```
Stopp. Ändere noch nichts. Du hast das jetzt mehrmals versucht.
Lies die betroffenen Dateien noch einmal, nenn mir die wahrscheinlichste
Ursache und wie wir sie prüfen können. Erst wenn die Ursache klar ist,
schlägst du genau einen Fix vor.
```

## Das Design sieht nach KI aus

**Ursache:** Ohne Referenzen und Design-Vorgaben greift Claude zu Standards: lila Verläufe, Hero mit drei gleichen Karten, überall dieselben Schatten.

**Fix:** Zwei, drei echte Referenzen geben und eine DESIGN.md anlegen (siehe `website-workflow.md`). Dann gezielt einen Design-Skill wie impeccable oder taste-skill nutzen.

```
Das sieht nach KI-Template aus. Vergleich die Seite mit diesen Referenzen: [Links].
Nenn mir die fünf größten Unterschiede bei Schrift, Abständen, Farben und Bildern.
Keine lila Verläufe, kein Hero mit drei gleichen Karten, keine Icons in runden
Quadraten, kein reines Schwarz. Erst die Liste, dann warten.
```

## Claude vergisst Sachen, die wir längst geklärt haben

**Ursache:** Der Chat ist zu lang, oder die Info steht nur weit oben im Verlauf.

**Fix:** Was dauerhaft gilt, gehört in die Projekt-Anweisungen der Desktop-App, in die DESIGN.md oder in die Antigravity-Regeln. Pro Thema ein neuer Chat. Gespeichertes Memory kann sie unter Settings > Memory > Topics ansehen und bearbeiten.

```
Fass alles zusammen, was wir in diesem Chat entschieden haben: Ziel,
Design-Entscheidungen, Dateien, offene Punkte. Höchstens 15 Zeilen,
so dass ich es in einen neuen Chat oder in die Projekt-Anweisungen kopieren kann.
```

## Limit erreicht

**Ursache:** Es gibt ein 5-Stunden-Fenster und ein Wochenlimit. claude.ai, Desktop-App und Claude Code teilen sich das. Große Fresser: lange Chats, große Anhänge, Research, Websuche, hoher Effort, Opus und Fable, Artifacts, Agent-Aufgaben, Auto-Modus.

**Fix:** Unter Settings > Usage steht, wann es zurückgesetzt wird. Für Routine Sonnet oder niedrigeren Effort nehmen (Menü neben dem Senden-Knopf). Fragen bündeln, neuer Chat pro Thema, Dokumente, die immer wieder gebraucht werden, ins Projekt legen.

```
Ich habe wenig Limit übrig. Antworte kurz, ohne Wiederholungen und ohne
Zusammenfassung am Ende. Frag nur nach, wenn du wirklich nicht weiterkommst.
Aufgabe: [...]
```

## Claude ändert Dinge, die ich nicht wollte

**Ursache:** Die Aufgabe war offen formuliert, also hat er "mitgeholfen". Oder er hat ohne Plan losgelegt.

**Fix:** Sagen, was sich ändern darf und was tabu ist. Bei größeren Sachen erst den Plan zeigen lassen.

```
Ändere nur [Datei oder Bereich]. Alles andere bleibt genau so, wie es ist.
Zeig mir vorher, welche Dateien du anfassen willst und was du dort änderst.
Warte auf mein Okay.
```

## Lokal geht's, live nicht

**Ursache:** Meist der Cache, falsche Groß- und Kleinschreibung in Dateinamen (Windows ist da tolerant, die meisten Server nicht), Dateien, die nicht hochgeladen wurden, oder lokale Pfade wie `C:\...` im Code.

**Fix:** Hart neu laden mit Strg+F5 oder im privaten Fenster testen. Dann Pfade und Dateinamen prüfen lassen und in die Browser-Konsole schauen (F12).

```
Lokal funktioniert die Seite, live nicht: [Adresse, was genau kaputt ist].
Prüf alle Pfade auf Groß- und Kleinschreibung, auf absolute Windows-Pfade und
auf Dateien, die nicht hochgeladen wurden. Sag mir, wonach ich in der
Browser-Konsole (F12) schauen soll. Noch nichts ändern.
```

## Meine Shopify-Änderung war sofort live

**Ursache:** Es wurde direkt im veröffentlichten Theme gearbeitet oder mit `--live` gepusht.

**Fix:** Nur im Dev-Store oder mit `shopify theme dev` arbeiten. Vorschau mit `shopify theme push --unpublished`. Live schaltet sie selbst im Admin. Details: `shopify-workflow.md`.

```
Ab jetzt gilt: Wir arbeiten nur mit shopify theme dev oder
shopify theme push --unpublished. Benutze nie --live, --publish oder --allow-live.
Bevor du einen Shopify-Befehl ausführst, zeig ihn mir und erklär in einem Satz,
was er tut.
```

## Der Skill-Upload in der Desktop-App klappt nicht

**Ursache:** Meist ist die Beschreibung länger als 200 Zeichen, der Ordner liegt nicht an der ZIP-Wurzel oder heißt anders als der Skill. Auch möglich: ZIP zu groß, `SKILL.md` fehlt, ungültige Zeichen im Namen.

**Fix:** Unter Settings > Capabilities muss "Code execution and file creation" an sein. Den Ordner selbst zippen, nicht seinen Inhalt. Beschreibung notfalls kürzen lassen. Details: `skill-tipps.md`.

```
Hier ist die SKILL.md eines Skills: [einfügen]
Kürze die description auf höchstens 200 Zeichen und behalte die wichtigsten
Auslöse-Wörter. Prüf, dass name nur Kleinbuchstaben und Bindestriche hat,
höchstens 64 Zeichen lang ist und genauso heißt wie der Ordner.
```

## Claude ist in Antigravity nicht auswählbar

**Ursache:** Claude Opus 5.5 und Sonnet 5.5 (Thinking) gibt es in Antigravity nur mit Google AI Pro (nicht im Testzeitraum), Ultra oder Enterprise. Opus und Sonnet 4.6 laufen noch auf Free, Plus und Pro, fliegen aber am 02.11.2026 raus.

**Fix:** Google-Abo prüfen. Alternative: Im Extensions-Panel von Antigravity nach "Claude Code" suchen und die offizielle Erweiterung von Anthropic installieren. Die läuft über ihr bezahltes Claude-Abo, ohne API-Key. Notfalls Claude Code im Terminal.

```
Du läufst als Claude Code in Antigravity. Lies zuerst die Regeln in
.agents/rules/ und die DESIGN.md im Projekt. Fass in drei Sätzen zusammen,
was davon für diese Aufgabe wichtig ist. Dann zeig mir einen Plan für:
[Aufgabe]. Noch nichts ändern.
```

## Antigravity ignoriert meine Regeln

**Ursache:** Dateien in `.agents/rules/` brauchen oben ein Frontmatter mit `trigger`, sonst werden sie still übergangen. Außerdem gilt: höchstens 24 KB pro Datei, 20.000 Tokens insgesamt.

**Fix:** Ganz oben in die Datei:

```
---
trigger: always_on
---
```

Erlaubt sind `always_on`, `model_decision`, `glob` und `manual`.

```
Prüf alle Dateien in .agents/rules/: Hat jede oben ein Frontmatter mit trigger
(always_on, model_decision, glob oder manual)? Ist eine größer als 24 KB?
Liste die Probleme auf, ändere noch nichts.
```
