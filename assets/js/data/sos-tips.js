// Calming tips Clawd shows after the "Ich will Claude gerade anschreien" button.
// Clawd speaks in first person. Keep each text to 1–2 short sentences (phone cards).

export const SOS_TIPS = [
  {
    title: 'Laut ist nicht klar',
    text: 'Großbuchstaben lesen sich für mich lauter, aber nicht klarer. Sag mir lieber, was du siehst und was du sehen willst.',
  },
  {
    title: 'Ist gegen Soll',
    text: 'Ein Satz reicht: „Du hast X gemacht, ich wollte Y.“ Damit kann ich mehr anfangen als mit drei Ausrufezeichen.',
  },
  {
    title: 'Neuer Chat, neues Glück',
    text: 'Ist der Chat ellenlang, verliere ich den Faden. Lass mich zusammenfassen und fang frisch an.',
  },
  {
    title: 'Kleiner schneiden',
    text: 'Ganze Seite auf einmal geht gern schief. Gib mir eine Section, schau sie an, dann die nächste.',
  },
  {
    title: 'Zeig’s mir',
    text: 'Ein Screenshot sagt mehr als fünf Absätze. Win+Shift+S, dann Strg+V in den Chat.',
  },
  {
    title: 'Ursache statt Raten',
    text: 'Zweimal daneben? Dann lass mich erst die Ursache suchen, bevor ich den dritten Fix rate.',
  },
  {
    title: 'Zwei Minuten raus',
    text: 'Wasser holen, Fenster auf, einmal durchatmen. Der Bug wartet so lange, versprochen.',
  },
  {
    title: 'Ich bin nicht beleidigt',
    text: 'Ehrlich, ich nehm’s nicht persönlich. Ich werd davon nur leider auch nicht schlauer.',
  },
  {
    title: 'Erst den Plan',
    text: 'Schreib „noch nichts ändern, erst Plan zeigen“. Dann siehst du, ob ich dich verstanden hab, bevor ich was umbaue.',
  },
  {
    title: 'Link statt Adjektiv',
    text: '„Moderner“ kann alles heißen. Ein Link zu einer Seite, die du magst, sagt mir genau, was du meinst.',
  },
  {
    title: 'Eins nach dem anderen',
    text: 'Drei Wünsche in einer Nachricht? Ich erfülle gern alle, nur eben nacheinander.',
  },
  {
    title: 'Limit leer?',
    text: 'Unter Settings › Usage steht, wann es weitergeht. Bis dahin ist Kaffee die beste Strategie.',
  },
];

export const RESET_PROMPT = `Stopp, wir machen einen Reset.

Ziel: [was am Ende funktionieren soll]
Was passiert ist: [was du gemacht hast / was ich gerade sehe]
Was ich stattdessen will: [genau beschreiben, gern mit Screenshot]
Schon versucht: [was nicht geklappt hat]

Bitte noch nichts ändern. Nenn mir zuerst die wahrscheinlichste Ursache und zeig mir einen kurzen Plan. Ich sag dann Okay.`;
