# Skill-Tipps

Welcher Skill wofür, und wie Saskia ihn in die Desktop-App oder in Antigravity bekommt.

## Laurins Regel

Nur Skills aus Repos mit mindestens 1.000 GitHub-Sternen installieren, und vorher die Skripte im Repo ansehen. Ausnahme: offizielle Repos von Anthropic oder Shopify.

```
Schau dir dieses Skill-Repo an, bevor ich es installiere: [Link]
- Wie viele Sterne hat es, wann war der letzte Commit?
- Gibt es Skripte (.sh, .ps1, .js, .py)? Was tun sie?
- Greifen sie aufs Netz oder auf Dateien außerhalb des Projekts zu?
Kurze Einschätzung: installieren ja oder nein.
```

## Welcher Skill wofür

| Aufgabe | Skill | Repo |
|---|---|---|
| Design planen, bevor Code entsteht | frontend-design | `anthropics/skills` |
| Seite kritisieren und polieren (critique, polish, typeset, animate, adapt, optimize, audit, bolder, quieter ...) | impeccable | `pbakaus/impeccable` |
| Ideen für Stil, Farben, Schriftpaare | ui-ux-pro-max | `nextlevelbuilder/ui-ux-pro-max-skill` |
| Gegen KI-Template-Look, alte Seite auffrischen | taste-skill (z. B. high-end-visual-design, redesign-existing-projects, minimalist-ui) | `Leonxlnx/taste-skill` |
| Design von einer URL oder einem Screenshot übernehmen, KI-Look-Audit | hallmark | `Nutlope/hallmark` |
| Besondere Landingpages, Scroll-Storytelling | no-ai-design-slop, build-awwwards-quality-sites | `MengTo/Skills` |
| UI-Feinschliff und Bewegung | emil-design-eng | `emilkowalski/skills` |
| Scroll- und Animationseffekte | GSAP-Skills | `greensock/gsap-skills` |
| Texte, die verkaufen | copywriting, cro, launch, signup, marketing-psychology | `coreyhaines31/marketingskills` |
| Qualität, Ladezeit, Barrierefreiheit, SEO | web-quality-audit, core-web-vitals, accessibility, seo | `addyosmani/web-quality-skills` |
| UI-Review mit Datei und Zeile | web-design-guidelines | `vercel-labs/agent-skills` |
| Sauber arbeiten: planen, debuggen, prüfen | brainstorming, writing-plans, executing-plans, systematic-debugging, verification-before-completion | `obra/superpowers` |
| Nichts kommt halb fertig zurück | unlazy | `Leonxlnx/unlazy` |
| Passende Skills finden | find-skills | `vercel-labs/skills` |
| Shopify: Doku, GraphQL, Liquid, Store-Aufgaben | shopify-ai-toolkit | `Shopify/shopify-ai-toolkit` |
| Shopify-Themes: Liquid, Standards, Barrierefreiheit | liquid-skills | `Shopify/liquid-skills` |

Laurins Favoriten: impeccable, frontend-design, superpowers, shopify-ai-toolkit, web-quality-skills.

Skills gezielt und in Reihenfolge nutzen, nicht alle auf einmal. Und: Der eigene Look der Marke schlägt generische Skill-Regeln.

## Installieren in der Claude-Desktop-App (Windows)

Voraussetzung: Settings > Capabilities > "Code execution and file creation" ist an. Skills gehen auf allen Plänen, auch Free, und bleiben privat im Account.

1. Skill-Ordner besorgen. Bei GitHub: "Code" > "Download ZIP", entpacken, den Ordner mit der `SKILL.md` darin suchen.
2. Prüfen:
   - Der Ordner heißt genauso wie `name` in der `SKILL.md`.
   - `name`: höchstens 64 Zeichen, nur Kleinbuchstaben und Bindestriche.
   - `description`: höchstens 200 Zeichen. Viele Skills von GitHub haben längere Beschreibungen. Dann vor dem Zippen von Claude kürzen lassen (Prompt unten).
3. Den Ordner selbst zippen, nicht seinen Inhalt. Im Explorer: Rechtsklick auf den Ordner > "Senden an" > "ZIP-komprimierter Ordner" (unter Windows 11 erst "Weitere Optionen anzeigen"). In der ZIP muss ganz oben der Ordner liegen, darin die `SKILL.md`.
4. In der App: Customize > Skills > "+" > "+ Create skill" > "Upload a skill" > ZIP wählen.

Prompt zum Kürzen:

```
Hier ist die SKILL.md eines Skills: [einfügen]
Kürze die description auf höchstens 200 Zeichen. Behalte die Wörter,
bei denen der Skill starten soll. Gib mir nur das neue Frontmatter zurück.
```

Typische Fehler beim Upload: ZIP zu groß, Ordner und Name passen nicht zusammen, `SKILL.md` fehlt, ungültige Zeichen.

## Installieren in Antigravity (Windows)

Variante 1, per Befehl im Terminal (PowerShell), global für alle Projekte:

```
npx skills add <owner>/<repo> -a antigravity -g -y --copy
```

`--copy` ist auf Windows sinnvoll, weil Symlinks dort oft nicht gehen. Bei Repos mit vielen Skills zeigt `--list` erst mal, was drin ist, und `--skill <name>` holt nur den einen:

```
npx skills add <owner>/<repo> --list
npx skills add <owner>/<repo> --skill <name> -a antigravity -g -y --copy
```

Variante 2, von Hand: den Skill-Ordner kopieren nach

- global: `C:\Users\<Name>\.gemini\config\skills\<skill>\`
- nur für ein Projekt: `<projekt>\.agents\skills\<skill>\`

Darin muss die `SKILL.md` liegen, mit `description` im Frontmatter (Pflicht).

Der Skill startet automatisch, wenn die Beschreibung passt, oder in der App mit `/<skill>`. Taucht er nicht auf: prüfen, ob er im richtigen Ordner gelandet ist, und notfalls Variante 2 nehmen.

Hinweis: Antigravity-Workflows hören am 19.10.2026 auf zu funktionieren. Keine neuen Workflows bauen. Alte mit `/migrate-workflows` zu Skills umziehen.

## Laurin-Helfer selbst

Liegt als ZIP auf der Geschenkseite: https://idefixart.github.io/saskia/#starterkit

- Desktop-App: ZIP direkt hochladen, wie oben ab Schritt 4.
- Antigravity: ZIP entpacken, den Ordner `laurin-helfer` nach `C:\Users\<Name>\.gemini\config\skills\` kopieren.
