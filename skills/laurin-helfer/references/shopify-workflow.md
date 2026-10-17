# Shopify-Workflow

## Erst mal: Warum Shopify und nicht selbstgebaut

Laurins Haltung, charmant aber klar: Selbstgebaute Shops über Claude sind Quatsch. Claude kann einen Warenkorb bauen, aber Checkout, Zahlungen, Steuern und Sicherheit sind kein Wochenendprojekt. Wenn Saskia einen Shop selbst bauen will, sag ihr das freundlich, nenn zwei, drei Gründe von unten und biete den Shopify-Weg an. Besondere Wünsche löst man in Shopify mit eigenen Sections im Theme, nicht mit einem eigenen Checkout.

Was Shopify mitbringt (Stand Oktober 2026, Deutschland):

- Checkout pflegt Shopify, sicher nach PCI-DSS Level 1.
- SSL und Hosting sind inklusive.
- Shopify Payments in Deutschland: Basic 2,1 % + 0,30 € pro Zahlung, Klarna 2,99 % + 0,35 €. Fremde Zahlungsanbieter kosten auf Basic 2 % extra.
- Die Mehrwertsteuer rechnet Shopify automatisch. Abführen bleibt ihre Sache. OSS wird ab 10.000 € EU-Fernverkauf Thema.
- Seiten für Widerruf, AGB, Versand und Kontakt werden generiert. Das Impressum macht sie selbst. Deutsche Rechtstexte besser aus einer Kanzlei-App.
- Preise: Basic 36 € im Monat (27 € bei jährlicher Zahlung), Grow 105 € (79 €), Advanced 384 € (289 €).
- Testen: 3 Tage, danach 1 € im Monat für 3 Monate.

## Die goldene Regel

Nie am Live-Shop arbeiten. Nie live pushen. Arbeit nur im Dev-Store oder in einem unveröffentlichten Theme. Nie `--live`, `--publish` oder `--allow-live`. Live schaltet Saskia selbst im Shopify-Admin, und zwar komplett in einem Rutsch.

## Sicherer Theme-Workflow

1. **Dev-Store** zum Entwickeln nutzen, nicht den echten Shop.
2. **Theme holen:**
   ```
   shopify theme pull --store <shop>
   ```
3. **Lokal entwickeln** mit verstecktem Entwicklungs-Theme und Live-Reload:
   ```
   shopify theme dev --store <shop>
   ```
4. **Prüfen** mit Theme Check:
   ```
   shopify theme check
   ```
5. **Vorschau** als unveröffentlichtes Theme:
   ```
   shopify theme push --unpublished
   ```
6. **Live** schaltet Saskia selbst im Admin. Du nie.

Bevor du einen Shopify-Befehl ausführst: zeig ihn und erklär in einem Satz, was er tut.

## Werkzeuge, die Claude Shopify-schlau machen

### Shopify AI Toolkit (offiziell von Shopify, MIT)

Kann die Shopify-Doku durchsuchen, GraphQL und Liquid prüfen und Store-Aufgaben über die Shopify CLI erledigen.

- Antigravity (in PowerShell):
  ```
  npx skills add Shopify/shopify-ai-toolkit -a antigravity -g -y --copy
  ```
  Das `--copy` ist auf Windows sicherer, weil Symlinks dort oft nicht gehen.
- Claude Code (Code-Tab der Desktop-App über "+" > Plugins, oder im Terminal):
  ```
  claude plugin install shopify-ai-toolkit@claude-plugins-official
  ```
- Telemetrie abschalten: leere Datei `%APPDATA%\shopify-ai-toolkit\opt-out` anlegen.

Ebenfalls im offiziellen Plugin-Marketplace: `liquid-skills` (Liquid, Theme-Standards, Barrierefreiheit) und `liquid-lsp`.

### Shopify Dev MCP (lokal, ohne Login)

Lernt die Shopify-Doku und validiert Themes. Braucht Node.js auf dem Rechner. Eintrag im üblichen `mcpServers`-Format, auf Windows mit `cmd`:

```json
{
  "mcpServers": {
    "shopify-dev-mcp": {
      "command": "cmd",
      "args": ["/k", "npx", "-y", "@shopify/dev-mcp@latest"]
    }
  }
}
```

### Shopify-Connector in Claude (von Shopify, von Anthropic verifiziert)

In der Desktop-App unter Customize > Connectors. Er hat Schreib-Werkzeuge: Produkte anlegen und ändern, Lager, Rabatte. Deshalb: nur mit einem Dev-Store verbinden und testen, nie mit dem echten Shop, solange sie nicht genau weiß, was er tut.

## Prompts zum Kopieren

Sicherheitsregeln für eine Theme-Sitzung:

```
Wir arbeiten an meinem Shopify-Theme. Regeln für diese Sitzung:
- Nur Dev-Store oder unveröffentlichtes Theme.
- Erlaubt: shopify theme pull, shopify theme dev, shopify theme check,
  shopify theme push --unpublished.
- Verboten: --live, --publish, --allow-live. Live schalte ich selbst im Admin.
- Bevor du einen Befehl ausführst: zeig ihn mir und sag in einem Satz, was er tut.
Erste Aufgabe: [...]
```

Neue Section:

```
Bau mir eine neue Section für mein Theme: [was sie zeigen soll].
Halte dich an die Theme-Standards (Liquid, Barrierefreiheit) und prüf
den Liquid-Code mit dem Shopify AI Toolkit.
Texte, Bild und Farben sollen im Theme-Editor einstellbar sein.
Zeig mir erst den Plan: welche Dateien, welche Einstellungen. Dann warte.
```

Shop-Idee, die nach "selbst bauen" klingt:

```
Ich will in meinem Shop [besondere Funktion]. Prüf mit dem Shopify AI Toolkit,
ob Shopify das schon kann, ob es über eine eigene Section im Theme geht
oder ob man eine App braucht. Sag mir die einfachste Lösung zuerst.
```

## Wenn sie nach dem Admin fragt

Wenn sie wissen will, wo etwas im Shopify-Admin ist, und der Laurin-Buddy da ist: zeig es ihr Schritt für Schritt (siehe `buddy.md`). Sonst den Weg in Worten beschreiben und sagen, dass du die Admin-Oberfläche nicht live siehst.
