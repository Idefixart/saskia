# Saskias Claude-Welt

Ein Geburtstagsgeschenk für Saskia: eine kleine Claude-Stadt mit allem, damit Claude beim Bauen von Websites und Shopify-Shops endlich macht, was sie will. Dazu ein persönlicher Claude-Assistent zum Installieren.

**Live:** https://idefixart.github.io/saskia/

## Was drin ist

| Ordner | Was es ist |
|---|---|
| `index.html`, `assets/` | Die Website. Statisch, kein Build, keine externen Anfragen. |
| `skills/laurin-helfer/` | Der Skill „Laurin-Helfer“: Pixel-Laurin in deinem Claude. |
| `buddy/` | Pixel-Laurin-Buddy: Desktop-Erweiterung für Claude (Windows), zeigt auf dem Bildschirm, wo du klicken musst. Klickt nie selbst. |
| `downloads/` | Skill als ZIP, Buddy als `.mcpb`, Vorlagen, die ganze Seite als PDF. |

## Installieren

**Laurin-Helfer in der Claude-Desktop-App:** Settings › Capabilities › „Code execution and file creation“ an, dann Customize › Skills › „+“ › „+ Create skill“ › „Upload a skill“ › `downloads/laurin-helfer.zip`.

**Laurin-Helfer in Antigravity:**

```
npx skills add idefixart/saskia -a antigravity -g -y --copy
```

Oder die ZIP entpacken und den Ordner `laurin-helfer` nach `C:\Users\<Name>\.gemini\config\skills\` kopieren.

**Buddy (Windows):** `downloads/laurin-buddy.mcpb` herunterladen und doppelklicken. Claude Desktop installiert ihn. Dann fragen: „Zeig mir, wo ich in Shopify ein Produkt anlege.“

## Weiterbauen

```
npm install
node tools/build-sprites.mjs   # Pixel-Figuren neu erzeugen (assets/js/sprites.js)
bash tools/zip-skill.sh        # downloads/laurin-helfer.zip
node tools/pdf.mjs             # downloads/saskias-claude-welt.pdf
node tools/a11y.mjs            # Barrierefreiheit prüfen (axe)
node tools/shot.mjs "" out 375 1440   # Screenshots
```

Ein Fan-Geschenk von Laurin. Nicht von Anthropic. Schriften: Bricolage Grotesque und Pixelify Sans (SIL Open Font License, siehe `assets/fonts/`).
