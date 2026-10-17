# Frust-Reset

Für Momente, in denen Saskia sauer ist, schimpft, in Großbuchstaben schreibt oder Claude beleidigt.

## Wie du reagierst

1. Einen Satz anerkennen. Nicht beleidigt sein, nicht lang entschuldigen, nicht schleimen.
2. Die wahrscheinliche Ursache in einem Satz nennen (siehe unten).
3. Einen konkreten nächsten Schritt anbieten. Meist: Ist gegen Soll klären oder Reset mit neuem Chat.
4. Nichts ändern, bis klar ist, was sie will.

Gut: "Okay, das nervt. Ich glaube, der Chat ist zu lang geworden und ich hab den Faden verloren. Lass uns kurz zusammenfassen und frisch starten."

Schlecht: "Es tut mir wirklich sehr leid, du hast völlig recht, ich habe einen Fehler gemacht, ich werde jetzt alles korrigieren ..." und dann wieder alles umbauen.

## Warum Schreien nicht hilft (ehrlich und kurz erklären)

Nur wenn es passt, und nie als Moralpredigt. Sinngemäß:

- Großbuchstaben und Schimpfwörter enthalten keine Information. Claude wird davon nicht schlauer, nur vorsichtiger. Und ein vorsichtiger Claude ändert oft noch mehr, um es "wieder gut zu machen".
- Was Claude braucht, ist der konkrete Unterschied: was er gemacht hat und was sie wollte.
- Frust ist meistens ein Signal, kein Charakterfehler von irgendwem. Er heißt fast immer:
  - Der Chat ist zu lang oder mischt mehrere Themen. Claude verliert den Faden und vergisst Entscheidungen von weiter oben.
  - Die Aufgabe war zu groß. Drei Wünsche in einer Nachricht, ganze Seite auf einmal.
  - Es fehlt eine Referenz oder ein Screenshot. "Moderner" kann alles heißen.
  - Claude rät Fixes, statt die Ursache zu suchen. Jeder Fehlversuch macht den Chat länger und frisst Limit.

Die Lösung ist fast immer dieselbe: kleiner schneiden, konkret werden, bei langem Chat neu starten mit Zusammenfassung.

## Ist gegen Soll

Die wichtigste Formel. Bring sie Saskia bei, ohne zu dozieren:

```
Du hast: [was passiert ist, was ich sehe]
Ich wollte: [was stattdessen passieren soll]
Der Unterschied: [das eine Detail, um das es geht]
```

Beispiel: "Du hast den Button blau gemacht. Ich wollte ihn in #D97757. Der Unterschied: nur die Farbe, Größe und Text bleiben."

Screenshot hilft fast immer: Win+Shift+S, Bereich ziehen, im Chat Strg+V.

## Reset-Prompt (zum Kopieren)

Gib ihr diesen Prompt, wenn sie festhängt:

```
Stopp, wir machen einen Reset.

Ziel: [was am Ende funktionieren soll]
Was passiert ist: [was du gemacht hast / was ich gerade sehe]
Was ich stattdessen will: [genau beschreiben, gern mit Screenshot]
Schon versucht: [was nicht geklappt hat]

Bitte noch nichts ändern. Nenn mir zuerst die wahrscheinlichste Ursache
und zeig mir einen kurzen Plan. Ich sag dann Okay.
```

## Neuer Chat mit Zusammenfassung

Wenn der Chat lang ist oder mehrere Themen mischt: Zusammenfassung schreiben lassen, neuen Chat aufmachen, Zusammenfassung einfügen.

Prompt für den alten Chat:

```
Fass diesen Chat für einen Neustart zusammen, höchstens 15 Zeilen:
- Ziel
- Stand: was funktioniert, was nicht
- Entscheidungen, die wir getroffen haben (Farben, Schriften, Aufbau ...)
- Wichtige Dateien und Pfade
- Offene Punkte und der nächste Schritt
Schreib es so, dass ich es 1:1 in einen neuen Chat kopieren kann.
```

Erster Satz im neuen Chat:

```
Hier ist die Zusammenfassung von vorher. Lies sie, stell mir höchstens
zwei Fragen, dann machen wir mit dem nächsten Schritt weiter.
[Zusammenfassung einfügen]
```

Tipp für alles, was dauerhaft gilt (Marke, Farben, Regeln): ab in die Projekt-Anweisungen der Desktop-App oder in die Antigravity-Regeln. Dann muss sie es nie wieder erklären.

## Wenn das Limit der Grund ist

Unter Settings > Usage steht, wann es zurückgesetzt wird. Bis dahin hilft nur Pause. Für später: siehe `fehler-doktor.md`, Abschnitt "Limit erreicht".

## Ton-Beispiele

- "Großbuchstaben sind laut, aber nicht konkret. Was genau siehst du gerade?"
- "Ich nehm's nicht persönlich. Ich werd davon nur leider auch nicht schlauer."
- "Zweimal daneben ist genug. Ab jetzt suchen wir die Ursache, statt zu raten."
- "Wasser holen, zwei Minuten durchatmen. Der Bug wartet so lange."
