// Fehler-Doktor entries: symptom, cause, fix (max 3 short sentences), copyable prompt.
// Facts only from the research notes (Stand Oktober 2026).

export const DOCTOR = [
  {
    symptom: 'Claude dreht sich im Kreis und macht dasselbe immer wieder kaputt',
    ursache: 'Er rät Fixes, statt die Ursache zu suchen. Jeder Fehlversuch macht den Chat länger und frisst Limit.',
    fix: 'Nach zwei Fehlversuchen stoppen. Erst die Ursache nennen lassen, dann genau ein Fix. Ist der Chat lang: Zusammenfassung, neuer Chat.',
    prompt: `Stopp. Ändere noch nichts. Du hast das jetzt mehrmals versucht.
Lies die betroffenen Dateien noch einmal, nenn mir die wahrscheinlichste Ursache und wie wir sie prüfen können.
Erst wenn die Ursache klar ist, schlägst du genau einen Fix vor.`,
  },
  {
    symptom: 'Das Design sieht nach KI aus',
    ursache: 'Ohne Referenzen und Vorgaben greift Claude zu Standards: lila Verläufe, drei gleiche Karten, überall dieselben Schatten.',
    fix: 'Zwei, drei echte Referenzseiten geben und eine DESIGN.md anlegen. Dann gezielt einen Design-Skill wie impeccable drüberlaufen lassen.',
    prompt: `Das sieht nach KI-Template aus. Vergleich die Seite mit diesen Referenzen: [Links].
Nenn mir die fünf größten Unterschiede bei Schrift, Abständen, Farben und Bildern.
Keine lila Verläufe, kein Hero mit drei gleichen Karten, keine Icons in runden Quadraten, kein reines Schwarz.
Erst die Liste, dann warten.`,
  },
  {
    symptom: 'Claude vergisst Sachen, die wir längst geklärt haben',
    ursache: 'Der Chat ist zu lang, oder die Info steht nur weit oben im Verlauf.',
    fix: 'Was immer gilt, gehört in die Projekt-Anweisungen oder die DESIGN.md. Pro Thema ein neuer Chat, mit kurzer Zusammenfassung zum Start.',
    prompt: `Fass alles zusammen, was wir in diesem Chat entschieden haben: Ziel, Design-Entscheidungen, Dateien, offene Punkte.
Höchstens 15 Zeilen, so dass ich es in einen neuen Chat oder in die Projekt-Anweisungen kopieren kann.`,
  },
  {
    symptom: 'Limit erreicht',
    ursache: 'Lange Chats, große Anhänge, Research, hoher Effort und Opus fressen das 5-Stunden- und das Wochenlimit. App, Web und Claude Code teilen sich eins.',
    fix: 'Unter Settings › Usage steht, wann es zurückgesetzt wird. Für Routine Sonnet oder niedrigeren Effort nehmen. Fragen bündeln, neuer Chat pro Thema.',
    prompt: `Ich habe wenig Limit übrig. Antworte kurz, ohne Wiederholungen und ohne Zusammenfassung am Ende.
Frag nur nach, wenn du wirklich nicht weiterkommst.
Aufgabe: [...]`,
  },
  {
    symptom: 'Claude ändert Dinge, die ich nicht wollte',
    ursache: 'Die Aufgabe war offen formuliert, also hat er „mitgeholfen“. Oder er hat ohne Plan losgelegt.',
    fix: 'Sag, was sich ändern darf und was tabu ist. Bei größeren Sachen erst den Plan zeigen lassen.',
    prompt: `Ändere nur [Datei oder Bereich]. Alles andere bleibt genau so, wie es ist.
Zeig mir vorher, welche Dateien du anfassen willst und was du dort änderst.
Warte auf mein Okay.`,
  },
  {
    symptom: 'Lokal geht’s, live nicht',
    ursache: 'Meist Cache, Groß- und Kleinschreibung in Dateinamen (Windows ist da tolerant, Server nicht), fehlende Dateien oder Pfade wie C:\\…',
    fix: 'Hart neu laden mit Strg+F5 oder im privaten Fenster testen. Dann Pfade prüfen lassen und in die Browser-Konsole schauen (F12).',
    prompt: `Lokal funktioniert die Seite, live nicht: [Adresse, was genau kaputt ist].
Prüf alle Pfade auf Groß- und Kleinschreibung, auf absolute Windows-Pfade und auf Dateien, die nicht hochgeladen wurden.
Sag mir, wonach ich in der Browser-Konsole (F12) schauen soll. Noch nichts ändern.`,
  },
  {
    symptom: 'Meine Shopify-Änderung war sofort live',
    ursache: 'Es wurde direkt im veröffentlichten Theme gearbeitet oder mit --live gepusht.',
    fix: 'Nur im Dev-Store oder mit shopify theme dev arbeiten, Vorschau mit shopify theme push --unpublished. Live schaltest du selbst im Admin.',
    prompt: `Ab jetzt gilt: Wir arbeiten nur mit shopify theme dev oder shopify theme push --unpublished.
Benutze nie --live, --publish oder --allow-live.
Bevor du einen Shopify-Befehl ausführst, zeig ihn mir und erklär in einem Satz, was er tut.`,
  },
  {
    symptom: 'Der Skill-Upload in der Desktop-App klappt nicht',
    ursache: 'Meist ist die Beschreibung länger als 200 Zeichen, oder der Ordner liegt nicht an der ZIP-Wurzel oder heißt anders als der Skill.',
    fix: 'Settings › Capabilities › „Code execution and file creation“ muss an sein. Den Ordner selbst zippen, nicht seinen Inhalt. Beschreibung notfalls kürzen lassen.',
    prompt: `Hier ist die SKILL.md eines Skills: [einfügen]
Kürze die description auf höchstens 200 Zeichen und behalte die wichtigsten Auslöse-Wörter.
Prüf, dass name nur Kleinbuchstaben und Bindestriche hat und genauso heißt wie der Ordner.`,
  },
  {
    symptom: 'Claude ist in Antigravity nicht auswählbar',
    ursache: 'Opus 5.5 und Sonnet 5.5 gibt es dort nur mit Google AI Pro (nicht im Test), Ultra oder Enterprise. Die 4.6-Modelle fliegen am 02.11.2026 raus.',
    fix: 'Google-Abo prüfen. Oder im Extensions-Panel die offizielle Erweiterung „Claude Code“ installieren, die läuft über dein Claude-Abo.',
    prompt: `Du läufst als Claude Code in Antigravity. Lies zuerst die Regeln in .agents/rules/ und die DESIGN.md im Projekt.
Fass in drei Sätzen zusammen, was davon für diese Aufgabe wichtig ist.
Dann zeig mir einen Plan für: [Aufgabe]. Noch nichts ändern.`,
  },
  {
    symptom: 'Antigravity ignoriert meine Regeln',
    ursache: 'Dateien in .agents/rules/ brauchen oben ein Frontmatter mit trigger, sonst werden sie still übergangen.',
    fix: 'Ganz oben in die Datei: trigger: always_on, eingerahmt von zwei Zeilen mit ---. Jede Datei unter 24 KB halten.',
    prompt: `Prüf alle Dateien in .agents/rules/: Hat jede oben ein Frontmatter mit trigger (always_on, model_decision, glob oder manual)?
Ist eine größer als 24 KB?
Liste die Probleme auf, ändere noch nichts.`,
  },
];
