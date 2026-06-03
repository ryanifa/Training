// Genereert mobility-sessie JSON voor maand 7 (vanaf M7D7) uit de CSV.
// Output: één blok JSON-entries gescheiden door komma's, klaar om in
// "sessions": { ... } van de plan-editor te plakken.
const fs = require('fs');

const csv = fs.readFileSync('data/dynamic_triathlete_sessions.csv', 'utf8')
  .replace(/^﻿/, '');

// Heel simpele CSV-parser die quoted-velden ondersteunt
function parseCSVLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

const rows = csv.split(/\r?\n/).filter(l => l.trim());
const header = parseCSVLine(rows.shift());
const data = rows.map(parseCSVLine);

// Lookup-tabel voor m (spiergroep) en note (instructie) per oefening.
// Voor onbekende oefeningen geef ik een nette default op basis van de naam.
const EX = {
  '5 point sumo stretch': ['lies & heupen', 'Wijde squat-stand; voorover leunen, ellebogen tegen knieën drukken'],
  '90/90 stretch': ['heuprotatoren', 'Voorste been 90°, achterste 90°; voorover leunen voor meer stretch'],
  'adductor drop': ['adductoren / lies', 'Vanuit kikkerhouding of straddle, heup zijwaarts naar de grond zakken'],
  'bodyweight calf release': ['kuiten ontspannen', 'Hiel laag, gewicht op andere voet, kuit zacht laten zakken'],
  'calf stretch (using a wall)': ['kuit & achillespees', 'Handen aan muur; achterste hiel naar grond, knie gestrekt'],
  'chest and back fly': ['borst & bovenrug', 'Armen voor en achter laten openen/sluiten; thoracale flexie/extensie'],
  'chest stretch (using a wall)': ['borst', 'Arm tegen muur in 90°; lichaam wegdraaien voor borstrek'],
  'dynamic cactus': ['schouders + thoracale rug', 'Cactus-armen (ellebogen 90°); open en sluit voor borst'],
  'dynamic crossover stretch': ['IT-band + zijromp', 'Sta op één been; ander been kruist erover, leun naar gekruiste kant'],
  'dynamic cross over stretch': ['IT-band + zijromp', 'Sta op één been; ander been kruist erover, leun naar gekruiste kant'],
  'dynamic downward dog': ['hamstrings & kuit', 'Afwisselend hielen indrukken in soepele pedaal-beweging'],
  'dynamic forward fold': ['hamstrings & onderrug', 'Hangend voorover; afwisselend één been doorbuigen en strekken'],
  'dynamic frog stretch': ['liesgroep + binnenkant heup', 'Op handen en knieën, knieën breed; heupen rustig heen-en-weer wiegen'],
  'dynamic gate pose': ['zijromp & lies', 'Knielend, één been gestrekt zijwaarts; arm over hoofd, zij rekken'],
  'dynamic hamstring hook (using a strap)': ['hamstrings', 'Op rug; strap om voet; been omhoog en rustig naar zijkanten laten zakken'],
  'dynamic high lunge': ['heupbuiger & quad', 'Hoge uitval; rustig zakken in lunge, armen omhoog'],
  'dynamic overhead sequence': ['schouders & zijromp', 'Armen overhead; reach links/rechts/voor in vloeiende sequentie'],
  'dynamic seated split': ['adductoren + hamstrings', 'Zit met benen wijd; voorover leunen en naar elk been'],
  'elevated crossover stretch': ['IT-band', 'Voet op verhoging; been kruist over, lichaam wegdraaien'],
  'figure four (using a wall)': ['glutes + IT-band', 'Op rug, voeten op de muur, enkel op andere knie'],
  'foot and calf stretch': ['voet & kuit', 'Tenen tegen muur of opgekrulde voet; kuit langer maken'],
  'high lunge calf stretch': ['kuit + heupbuiger', 'Stap in high lunge; voorste voet platdrukken, kuit lang houden'],
  'kneeling wrist sequence': ['polsen', 'Op knieën; vingers verschillende kanten op; druk voor mobiliteit'],
  'lifted hamstring stretch (using a strap)': ['hamstrings', 'Op rug, strap om voet, been gestrekt omhoog'],
  'low lunge lean': ['heupbuiger + quad', 'Lage uitval, heup naar voor schuiven, eventueel arm omhoog'],
  'low lunge twist': ['heupbuiger + thoracale rug', 'Lage uitval; draai romp naar voorste been, arm omhoog'],
  'low lunge with chest stretch': ['heupbuiger & borst', 'Lage uitval; armen achter rug om borst te openen'],
  'low lunge with a chest stretch': ['heupbuiger & borst', 'Lage uitval; armen achter rug om borst te openen'],
  'lying glute stretch': ['glutes', 'Op rug, enkel op andere knie, dij omhoog trekken naar borst'],
  'modified pigeon stretch': ['glutes & heupopener', 'Voorste been 90° vóór je; achterste gestrekt, voorover leunen'],
  'modified pigeon pose': ['glutes & heupopener', 'Voorste been 90° vóór je; achterste gestrekt, voorover leunen'],
  'modified piegeon stretch': ['glutes & heupopener', 'Voorste been 90° vóór je; achterste gestrekt, voorover leunen'],
  'pretzel quad stretch': ['quadriceps + heupbuiger', 'Op zij; voorste knie 90°, achterste voet vasthouden'],
  'ptrezel quad stretch': ['quadriceps + heupbuiger', 'Op zij; voorste knie 90°, achterste voet vasthouden'],
  'reclined crisscross': ['glutes + IT-band', 'Op rug, benen over elkaar gekruist, knieën richting borst'],
  'reclined criss cross': ['glutes + IT-band', 'Op rug, benen over elkaar gekruist, knieën richting borst'],
  'reverse prayer pose': ['polsen & schouders', 'Handen op rug in omgekeerde gebedshouding; ellebogen naar achter'],
  'seated butterfly with neck stretch': ['lies + nek', 'Vlinder-zit met voetzolen tegen elkaar; oor naar schouder voor nekrek'],
  'seated butterfly with a neck stretch': ['lies + nek', 'Vlinder-zit met voetzolen tegen elkaar; oor naar schouder voor nekrek'],
  'seated glute stretch': ['glutes', 'Figure-4 zit: enkel op andere knie; licht voorover leunen'],
  'seated quad stretch': ['quadriceps', 'Zit op hielen; achterover leunen op handen voor quad-rek'],
  'seated twist and tuck': ['rug + buitenste heup', 'Zittend, één been gekruist, draai naar gekruiste kant'],
  'seated twist & tuck': ['rug + buitenste heup', 'Zittend, één been gekruist, draai naar gekruiste kant'],
  'side bend (using a wall)': ['zijromp', 'Sta naast muur, hand erop, lichaam afbuigen, andere arm overhead'],
  'standing quad stretch': ['quadriceps', 'Staand, één voet naar bil, knieën samen, heup naar voor duwen'],
  'standing shoulder stretch': ['schouders', 'Arm voor borst; trek met andere arm naar lichaam'],
  'standing side stretch': ['zijromp', 'Sta met armen overhead; lichaam zijwaarts buigen'],
  'tabletop thoracic twist': ['thoracale rotatie', 'Vanuit viervoet één arm onder lichaam doorsteken, dan omhoog naar plafond draaien'],
  'thoracic spine rotation': ['thoracale rotatie', 'Op knieën of zit; één hand achter hoofd; romp roteren omhoog']
};

function lookupExercise(name) {
  const key = name.toLowerCase().trim();
  if (EX[key]) return { m: EX[key][0], note: EX[key][1] };
  return { m: '', note: '' };
}

function parseDur(durStr) {
  const [mm, ss] = durStr.split(':').map(s => parseInt(s, 10));
  if (!isFinite(mm)) return null;
  return { totalMin: mm + (isFinite(ss) ? ss / 60 : 0) };
}

function jsonEsc(s) { return JSON.stringify(String(s || '')); }

const entries = [];
for (const r of data) {
  const maand = parseInt(r[0], 10);
  const dag = parseInt(r[1], 10);
  if (maand !== 7 || dag < 7) continue;
  const routine = r[2].trim();
  const durRaw = r[3].trim();
  const oef = r[4].split('•').map(s => s.trim()).filter(Boolean);
  const sid = 'mobility_m' + maand + 'd' + dag;
  const id = 'M' + maand + 'D' + dag;
  const dur = parseDur(durRaw);
  const labelTitle = id + ' ' + routine;
  const perStep = oef.length ? Math.max(1, Math.round((dur ? dur.totalMin : 16) / oef.length)) : 2;
  const items = oef.map(name => {
    const meta = lookupExercise(name);
    return '{"z":"sz1","n":' + jsonEsc(name) +
      ',"d":' + jsonEsc('~' + perStep + ' min') +
      ',"m":' + jsonEsc(meta.m) +
      ',"note":' + jsonEsc(meta.note) + '}';
  }).join(',');
  const durLabel = dur ? '±' + Math.round(dur.totalMin) + ' min' : '';
  const entry = jsonEsc(sid) + ': {' +
    '"type":"mobility",' +
    '"label":' + jsonEsc(labelTitle) + ',' +
    '"dur":' + jsonEsc(durLabel) + ',' +
    '"title":' + jsonEsc(labelTitle) + ',' +
    '"source":' + jsonEsc('Dynamic Triathlete ' + id) + ',' +
    '"steps":[{"sess":"","items":[' + items + ']}]' +
    '}';
  entries.push(entry);
}

// Schrijf naar bestand én print summary
fs.writeFileSync('data/m7d7-m7d28-sessions.json', entries.join(',\n'));
console.log('aantal sessies:', entries.length);
console.log('totaal bytes:', entries.join(',\n').length);
