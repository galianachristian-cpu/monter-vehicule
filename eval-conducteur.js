/* Évaluation du conducteur engin-pompe (COD1) — réservée à l'espace responsable.
   Chargé après le script principal : utilise ses fonctions (S, ACT, Store, queue, sheet, ico…).
   Chaque évaluation est un fichier JSON : evaluations/AAAA/MM/<horodatage>_<nom>.json */

/* ---------- contenu (repris des grilles d'autodiagnostic et du questionnaire COD1) ---------- */
const EV_SOCLE = [
  ['liaison', 'Comprendre les attentes hydrauliques de la mission', 'Établit une liaison permanente avec la chaîne de commandement', 1],
  ['secu', 'Manipuler les dispositifs hydrauliques ou générateurs', 'Sécurise son environnement de travail (pompes)', 1],
  ['dispo', '', 'Utilise correctement les dispositifs de l’engin (cran de pompe, accélération moteur, ouverture du retour cuve)', 0],
  ['dysf', '', 'Identifie et analyse un dysfonctionnement', 0],
  ['pression', 'Répondre aux besoins hydrauliques attendus', 'Définit une pression de refoulement correcte (longueur, section des tuyaux, dénivelé, pertes de charge diverses)', 1],
  ['pertes', '', 'Prend en compte l’évolution des pertes de charge', 0],
  ['suivi', '', 'Est impliqué dans le suivi opérationnel de la mission', 0],
  ['degrade', '', 'Sait utiliser les modes dégradés pour continuer la mission', 0]
].map(([k, g, t, c]) => ({ k, g, t, c: !!c }));

const EV_QUIZ = [
  ['Lors d’un accident corporel en VSAV, qui est pénalement responsable ?', 'Le conducteur ET le chef d’agrès (jurisprudence). Pas le SDIS.'],
  ['Les véhicules pompiers sont-ils prioritaires ?', 'Oui'],
  ['Citer les véhicules d’intérêt général prioritaires.', 'Pompiers, gendarmerie, police, douane, véhicules des unités hospitalières (SMUR, SAMU, certaines ambulances privées conventionnées), unités pénitentiaires, véhicules escortés par la police ou la gendarmerie.'],
  ['Un véhicule d’intérêt général prioritaire peut déroger à :', 'STOP, feu rouge, limitation de vitesse, ligne continue, ceinture, sens interdit (uniquement avec un arrêté municipal et selon l’urgence). PAS au poids, à la hauteur, aux ponts (ouvrages), ni aux passages à niveau.'],
  ['Pour tout accident, le conducteur doit remplir :', 'Un constat amiable ET un compte rendu.'],
  ['À quoi sert un turbocompresseur sur un engin incendie ?', 'Augmenter de 20 à 30 % la puissance du moteur sans modifier la cylindrée.'],
  ['Comment fonctionne un ralentisseur sur un engin SP ?', 'Ralentisseur à coupure sur échappement et injection : ralentit sans solliciter le frein principal. Une vanne pneumatique obture l’échappement, le temps d’échappement devient résistant. Point clé : la retenue moteur (contre-pression, le moteur travaille en compresseur).'],
  ['Comment s’appelle l’organe hydraulique qui permet l’aspiration d’eau ?', 'L’amorceur à anneau d’eau.'],
  ['À quoi sert la pompe incendie ?', 'Donner de la vitesse à l’eau, ce qui se traduit en pression.'],
  ['Citer les lois de pertes de charge.', '1. Inversement proportionnelles au diamètre du tuyau. 2. Proportionnelles à la longueur de l’établissement. 3. Proportionnelles au carré du débit. 4. Variables selon la rugosité interne. 5. Variables avec le dénivelé. 6. Indépendantes de la pression, seul le débit compte. (Point accordé avec au moins 4 lois sur 6.)'],
  ['Pertes de charge pour 100 m dans un tuyau de 45 à 250 l/min, puis de 70 à 500 l/min ?', '1,5 bar pour le 45 à 250 l/min. 0,55 bar pour le 70 à 500 l/min.'],
  ['Quels facteurs entrent dans le calcul de pression ?', 'Pertes de charge dans les tuyaux, pièces de jonction, dénivelé, pression de fonctionnement (lance, queue de paon, turbopompe, hydroéjecteur…).']
];

/* chaque étape : [texte, critique] */
const EV_MAN = [
  { id: 'p14', t: 'Prise d’eau au moyen de la caisse d’alimentation (P14)', steps: [
    ['Place la caisse d’alimentation selon la direction à atteindre'],
    ['Saisit la division d’alimentation et établit 1 ou 2 tuyaux de 70/20 m selon la distance'],
    ['Dépose la division d’alimentation à l’emplacement désigné par le chef d’agrès et vérifie la fermeture des vannes'],
    ['Raccorde l’autre demi-raccord d’un des tuyaux sur l’engin, en privilégiant le refoulement additif'],
    ['Ouvre l’eau']] },
  { id: 'etb42', t: 'Aspiration en milieu naturel (ETB 4.2)', steps: [
    ['Raccorde la crépine et le flotteur au premier aspiral (sauf bâche ou cuve DFCI)'],
    ['Connecte la commande à la crépine (même exception)'],
    ['Raccorde la ligne à l’orifice d’alimentation de la pompe'],
    ['Vérifie visuellement l’établissement (immersion suffisante de la crépine)'],
    ['Mise en aspiration : met le cran de pompe'],
    ['Mise en aspiration : vannes fermées (sauf alimentation tonne)'],
    ['Mise en aspiration : retour tonne fermé si milieu salin ou saumâtre'],
    ['Mise en aspiration : augmente le régime moteur'],
    ['Observe les indicateurs d’aspiration : vacuomètre, désamorçage de la roue amorceur, écrasement de la ligne'],
    ['Ouvre une vanne'],
    ['Vérifie visuellement l’établissement']] },
  { id: 'etb43', t: 'Alimentation par tuyaux en écheveaux 70/20 m (ETB 4.3)', steps: [
    ['Prépare le matériel PI ou BI pour le binôme'],
    ['Positionne le collecteur d’alimentation 100/2x65'],
    ['Y raccorde le demi-raccord donné par le chef du binôme'],
    ['Une fois l’engin alimenté, complète sa cuve avec le retour cuve']] },
  { id: 'etb45', t: 'Alimentation par l’établissement (ETB 4.5)', steps: [
    ['Positionne le collecteur d’alimentation 100/2x65'],
    ['Prépare le matériel PI ou BI pour le binôme'],
    ['Déroule si nécessaire 1 tuyau de 70/20 et raccorde les demi-raccords à son engin, en privilégiant le refoulement additif'],
    ['Ouvre l’eau, puis termine son alimentation']] },
  { id: 'm41', t: 'Poteau ou bouche d’incendie, engin à moins de 20 m (M4.1)', steps: [
    ['S’assure du bon fonctionnement de l’hydrant'],
    ['Positionne le véhicule à moins de 20 m'],
    ['Saisit la clé de PI ou BI, le sac à obturateurs, 1 tuyau de 110/20 m « couronne double » avec 2 tricoises de 100 mm'],
    ['Sur BI : 1 clé de barrage et 1 coude d’alimentation. Sur PI : 1 clé fédérale, 1 bouchon de 100 mm, 2 bouchons de 65 mm'],
    ['Sur BI : purge, installe le coude et raccorde le tuyau. Sur PI : purge, positionne les bouchons manquants et raccorde le tuyau'],
    ['Ouvre l’eau et ramène la clé à l’engin'],
    ['Vérifie visuellement l’établissement'],
    ['Ouvre sa vanne d’alimentation (sans électrovanne : ferme l’alimentation tonne)'],
    ['Veille au maintien de l’eau après ouverture', 1]] },
  { id: 'm44', t: 'Alimentation au moyen du dévidoir mobile (M4.4)', steps: [
    ['S’assure du bon fonctionnement de l’hydrant'],
    ['Prépare le matériel PI ou BI pour le binôme'],
    ['Positionne le collecteur 100/2x65 sur l’alimentation et y raccorde le demi-raccord donné par le chef du binôme'],
    ['Une fois l’engin alimenté, complète sa cuve avec la vanne de retour cuve'],
    ['Reste en contact (audio, visuel) avec ses binômes avant ouverture du PI ou BI', 1],
    ['Si 2e ligne : finit l’établissement avec un tuyau de 70/20 m plutôt qu’un autre de 70/40 m'],
    ['Vérifie visuellement l’établissement'],
    ['Veille au maintien de l’eau après ouverture', 1]] },
  { id: 'turbo', t: 'Mise en place du turbopompe', steps: [
    ['Saisit le turbopompe et 3 tuyaux de 70/20 m'],
    ['Met en place le turbopompe avec un binôme'],
    ['Amarre le turbopompe avec la commande, place un brin de celle-ci sur la purge'],
    ['Alimente le turbopompe et réalise un circuit fermé : retour branché sur le trou d’homme ou le remplissage extérieur'],
    ['Ajuste la pression nécessaire pour un rendement optimum du turbopompe'],
    ['Vérifie l’établissement']] },
  { id: 'citerne', t: 'Aspiration sur citerne souple, MPR en relais sur CCF', steps: [
    ['Sort le matériel nécessaire à l’aspiration'],
    ['Raccorde la ligne à l’orifice d’alimentation de la pompe et au poteau relais'],
    ['Vérifie visuellement l’établissement'],
    ['Mise en aspiration : remplissage ou amorçage de l’amorceur'],
    ['Mise en aspiration : vannes fermées'],
    ['Mise en aspiration : démarre la MPR'],
    ['Mise en aspiration : augmente le régime moteur'],
    ['Observe les indicateurs d’aspiration : vacuomètre, désamorçage de la roue amorceur, écrasement de la ligne'],
    ['Ouvre une vanne'],
    ['Vérifie visuellement l’établissement']] },
  { id: 'engin', t: 'Alimentation sur une prise d’eau, ici un autre engin', steps: [
    ['Positionne le véhicule à proximité de l’autre engin, en accord avec son chef d’agrès'],
    ['Coordonne ses actions avec le conducteur de l’autre engin', 1],
    ['Déroule un tuyau de 70'],
    ['Donne un demi-raccord au conducteur de l’autre engin'],
    ['Raccorde l’autre demi-raccord à son collecteur à clapet'],
    ['Demande l’ouverture de l’eau'],
    ['Ouvre sa vanne d’alimentation (sans électrovanne : ferme l’alimentation tonne)'],
    ['Ajuste sa pression en fonction de l’établissement', 1],
    ['Vérifie visuellement l’établissement'],
    ['Veille au maintien de l’eau après ouverture', 1]] }
];

const EV_DEC = {
  apte: ['Apte à conduire', 'ok'],
  reserves: ['Apte avec réserves', 'warn'],
  formation: ['Retour en formation', 'bad']
};
const EV_STEPS = ['Socle commun', 'Questionnaire', 'Manœuvres', 'Décision'];
const EV_RX = /^evaluations\/\d{4}\/\d{2}\/(\d{8}-\d{6})_([a-z0-9-]+)\.json$/;

(function () {
  const st = document.createElement('style');
  st.textContent = `
  .seg button.on.ev-a{background:#1c8a57;color:#fff}
  .seg button.on.ev-c{background:#9a3d0a;color:#fff}
  .evs{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid var(--line2);background:var(--field);width:100%;text-align:left;margin-bottom:8px;font-size:15px}
  .evs.on{border-color:rgba(39,207,124,.5);background:rgba(39,207,124,.1)}
  .evs .bx{width:26px;height:26px;border-radius:8px;border:2px solid var(--line2);display:grid;place-items:center;flex:none;color:#fff}
  .evs.on .bx{background:#1c8a57;border-color:#1c8a57}
  .evs .bx .ico{width:16px;height:16px}
  .evs.crit .tx{font-weight:800}
  .evq .ex{font-size:13px;color:var(--mut);margin:10px 0;padding:10px 12px;border-radius:12px;background:var(--field);border:1px solid var(--line2);white-space:pre-line}
  .evg{font:700 13px/1.2 var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--mut);margin:20px 2px 8px}
  .evb{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px}`;
  document.head.appendChild(st);
})();

/* ---------- état du brouillon ---------- */
let E = LS.get('mv.evdraft', null);
const evDraft = () => { if (E) LS.set('mv.evdraft', E); };

function evBlank(nom) {
  return { nom, step: 0, socle: {}, quizOn: false, quiz: {}, man: {}, open: null, dec: '', decManual: false, reserves: '', reeval: '', formation: '', obs: '' };
}

/* ---------- calcul de la décision (règle du document d'évaluation) ---------- */
function evCalc(e) {
  const complete = EV_SOCLE.every(s => e.socle[s.k]);
  const critKO = [], reasons = [];
  EV_SOCLE.forEach(s => { if (s.c && e.socle[s.k] && e.socle[s.k] !== 'a') critKO.push(s.t); });
  const encours = EV_SOCLE.filter(s => !s.c && e.socle[s.k] === 'c').map(s => s.t);
  const score = EV_QUIZ.reduce((n, _, i) => n + (e.quiz[i] ? 1 : 0), 0);
  const mans = EV_MAN.filter(m => (e.man[m.id] || {}).on).map(m => {
    const done = (e.man[m.id].s || []);
    const miss = m.steps.map((s, i) => ({ s, i })).filter(x => !done[x.i]);
    const missCrit = miss.filter(x => x.s[1]);
    missCrit.forEach(x => critKO.push(m.t + ' : ' + x.s[0]));
    return { m, miss: miss.length, missCrit: missCrit.length, list: miss.map(x => x.s[0]) };
  });
  const quizLow = e.quizOn && score < 6, quizMid = e.quizOn && score >= 6 && score < 9;
  const manBad = mans.filter(x => x.miss >= 3), manMid = mans.filter(x => x.miss > 0 && x.miss < 3);
  let auto = null;
  if (complete) {
    if (critKO.length || quizLow || manBad.length) auto = 'formation';
    else if (quizMid || manMid.length || encours.length) auto = 'reserves';
    else auto = 'apte';
  }
  if (critKO.length) reasons.push(critKO.length + ' point' + (critKO.length > 1 ? 's' : '') + ' critique' + (critKO.length > 1 ? 's' : '') + ' non validé' + (critKO.length > 1 ? 's' : ''));
  if (quizLow) reasons.push('questionnaire sous 6/12 (' + score + '/12)');
  if (quizMid) reasons.push('questionnaire entre 6 et 8/12 (' + score + '/12)');
  manBad.forEach(x => reasons.push(x.m.t + ' : ' + x.miss + ' étapes manquantes'));
  manMid.forEach(x => reasons.push(x.m.t + ' : ' + x.miss + ' étape' + (x.miss > 1 ? 's' : '') + ' manquante' + (x.miss > 1 ? 's' : '')));
  if (encours.length) reasons.push(encours.length + ' compétence' + (encours.length > 1 ? 's' : '') + ' du socle « en cours »');
  return { complete, auto, reasons, score, critKO, mans, encours };
}

/* ---------- navigation ---------- */
function evNew(nom) {
  if (E && E.nom !== nom && !confirm('Un brouillon existe pour ' + E.nom + '. Le remplacer ?')) return;
  if (!E || E.nom !== nom) E = evBlank(nom);
  evDraft(); closeSheet(); S.view = 'eval'; window.scrollTo(0, 0); render();
}
function viewEval() {
  if (!S.admin || !E) { S.view = 'reglages'; return shell(viewReglages()); }
  const c = evCalc(E);
  if (E.step === 3 && !E.decManual) E.dec = c.auto || '';
  const body = [evSocle, evQuiz, evMan, evDec][E.step](c);
  const last = E.step === 3;
  return `
  <div class="wz-top">
    <div class="row"><button class="btn sm ghost" style="padding:0 6px;min-height:40px" data-act="evQuit">${ico('x')}</button>
      <div class="grow"><h2>Évaluation conducteur</h2><div class="st">${esc(E.nom)} · étape ${E.step + 1}/4 · ${EV_STEPS[E.step]}</div></div></div>
    <div class="steps">${EV_STEPS.map((s, i) => `<i class="${i < E.step ? 's-done' : i === E.step ? 's-cur' : ''}"></i>`).join('')}</div>
  </div>
  <main class="pg">${body}</main>
  <div style="height:90px"></div>
  <div class="wz-bot"><div class="in">
    ${E.step ? `<button class="btn back" data-act="evPrev" aria-label="Précédent">${ico('back')}</button>` : ''}
    ${last ? `<button class="btn grn" data-act="evSend">${ico('check')} Enregistrer l’évaluation</button>` : `<button class="btn red" data-act="evNext">Suivant ${ico('chev')}</button>`}
  </div></div>`;
}

function evSocle() {
  const n = EV_SOCLE.filter(s => E.socle[s.k]).length;
  let g = '';
  return `<div class="wz-h">Socle commun</div><p class="wz-sub">${n}/${EV_SOCLE.length} évalués. À observer sur n’importe quelle manœuvre. Un point critique non acquis amène à un retour en formation.</p>
  ${EV_SOCLE.map(s => {
    const head = s.g && s.g !== g ? `<div class="evg">${esc(s.g)}</div>` : ''; if (s.g) g = s.g;
    const v = E.socle[s.k] || '';
    return head + `<div class="card" style="margin-bottom:10px"><div style="font-weight:${s.c ? 800 : 600};margin-bottom:10px">${esc(s.t)} ${s.c ? '<span class="pill bad" style="margin-left:6px">Critique</span>' : ''}</div>
    <div class="seg"><button class="${v === 'a' ? 'on ev-a' : ''}" data-act="evSoc" data-k="${s.k}" data-v="a">Acquis</button><button class="${v === 'c' ? 'on ev-c' : ''}" data-act="evSoc" data-k="${s.k}" data-v="c">En cours</button></div></div>`;
  }).join('')}`;
}

function evQuiz(c) {
  return `<div class="wz-h">Questionnaire</div><p class="wz-sub">Le pompier répond sur le questionnaire COD1 papier. Corrige ici avec la réponse attendue : 1 point par question.</p>
  <button class="evs ${E.quizOn ? 'on' : ''}" data-act="evQuizOn"><span class="bx">${E.quizOn ? ico('check') : ''}</span><span class="tx">Questionnaire passé</span></button>
  ${E.quizOn ? `<div class="card" style="margin:6px 0 14px;text-align:center"><div style="font:800 34px/1 var(--cond)">${c.score} / 12</div><div class="small muted">9 ou plus : apte · 6 à 8 : réserves · moins de 6 : retour en formation</div></div>
  ${EV_QUIZ.map(([q, a], i) => `<div class="card evq" style="margin-bottom:10px"><b>${i + 1}. ${esc(q)}</b><div class="ex">Réponse attendue :\n${esc(a)}</div>
    <button class="evs ${E.quiz[i] ? 'on' : ''}" style="margin:0" data-act="evQ" data-i="${i}"><span class="bx">${E.quiz[i] ? ico('check') : ''}</span><span class="tx">Réponse juste</span></button></div>`).join('')}` : '<p class="small muted" style="margin:10px 2px">Si le questionnaire n’est pas passé, il n’entre pas dans la décision.</p>'}`;
}

function evManState(m) {
  const d = E.man[m.id] || {}, done = (d.s || []).filter(Boolean).length;
  return { on: !!d.on, done, tot: m.steps.length };
}
function evMan() {
  if (E.open) {
    const m = EV_MAN.find(x => x.id === E.open), d = E.man[m.id] || { on: false, s: [] }, s = evManState(m);
    return `<button class="btn sm ghost" data-act="evManBack" style="margin:8px 0">${ico('back')} Toutes les manœuvres</button>
    <div class="wz-h" style="font-size:24px">${esc(m.t)}</div>
    <p class="wz-sub">${s.done}/${s.tot} étapes. Coche une étape seulement si elle est faite, dans l’ordre. Les étapes en gras sont critiques.</p>
    <button class="evs ${d.on ? 'on' : ''}" data-act="evManOn" data-m="${m.id}"><span class="bx">${d.on ? ico('check') : ''}</span><span class="tx">Manœuvre évaluée</span></button>
    <div class="evg">Étapes</div>
    ${m.steps.map(([t, crit], i) => { const ok = (d.s || [])[i]; return `<button class="evs ${ok ? 'on' : ''} ${crit ? 'crit' : ''}" data-act="evStep" data-m="${m.id}" data-i="${i}"><span class="bx">${ok ? ico('check') : ''}</span><span class="tx">${i + 1}. ${esc(t)}${crit ? ' <span class="pill bad" style="margin-left:4px">Critique</span>' : ''}</span></button>`; }).join('')}`;
  }
  const n = EV_MAN.filter(m => evManState(m).on).length;
  return `<div class="wz-h">Manœuvres</div><p class="wz-sub">${n} évaluée${n > 1 ? 's' : ''}. Ouvre uniquement celles que tu fais passer ; les autres n’entrent pas dans la décision.</p>
  <div class="list">${EV_MAN.map(m => { const s = evManState(m); const pill = !s.on ? '<span class="pill">Non évaluée</span>' : s.done === s.tot ? '<span class="pill ok">Acquise</span>' : `<span class="pill warn">${s.done}/${s.tot}</span>`;
    return `<button class="li" style="margin-bottom:8px" data-act="evManOpen" data-m="${m.id}"><div class="grow"><div class="lt">${esc(m.t)}</div><div class="ls">${s.tot} étapes</div></div>${pill}${ico('chev', 'chev')}</button>`; }).join('')}</div>`;
}

function evDec(c) {
  const d = EV_DEC[E.dec];
  return `<div class="wz-h">Décision</div>
  ${!c.complete ? `<div class="card" style="margin-bottom:12px"><b>Socle commun incomplet</b><div class="small muted" style="margin-top:4px">Évalue toutes les compétences du socle commun pour obtenir la décision.</div><button class="btn sm" style="margin-top:10px" data-act="evGo" data-s="0">Compléter le socle</button></div>` : ''}
  <div class="card" style="margin-bottom:12px">
    <div class="small muted">Résultat des règles</div>
    ${c.auto ? `<div style="margin:6px 0 8px"><span class="pill ${EV_DEC[c.auto][1]}">${EV_DEC[c.auto][0]}</span></div>` : ''}
    <div class="small">Socle : ${EV_SOCLE.filter(s => E.socle[s.k]).length}/${EV_SOCLE.length} évalués · ${c.critKO.length ? c.critKO.length + ' point(s) critique(s) non validé(s)' : 'points critiques validés'}</div>
    <div class="small">Questionnaire : ${E.quizOn ? c.score + '/12' : 'non passé'}</div>
    <div class="small">Manœuvres évaluées : ${c.mans.length}${c.mans.length ? ' (' + c.mans.filter(x => !x.miss).length + ' acquise' + (c.mans.filter(x => !x.miss).length > 1 ? 's' : '') + ')' : ''}</div>
    ${c.reasons.length ? `<ul class="small" style="margin:10px 0 0;padding-left:18px">${c.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    ${c.critKO.length ? `<div class="small muted" style="margin-top:8px">Critiques : ${c.critKO.map(esc).join(' · ')}</div>` : ''}
  </div>
  <div class="fld"><span>Ta décision (tu peux changer la proposition)</span>
    <div class="seg">${Object.entries(EV_DEC).map(([k, v]) => `<button class="${E.dec === k ? 'on def' : ''}" data-act="evDec" data-d="${k}">${v[0]}</button>`).join('')}</div></div>
  ${E.dec === 'reserves' ? `<label class="fld"><span>Points à reprendre</span><textarea class="inp" data-ev="reserves">${esc(E.reserves)}</textarea></label>
    <label class="fld"><span>Nouvelle évaluation le</span><input class="inp" type="date" data-ev="reeval" value="${esc(E.reeval)}"></label>` : ''}
  ${E.dec === 'formation' ? `<label class="fld"><span>Manœuvres ou points à retravailler</span><textarea class="inp" data-ev="formation" placeholder="${esc(c.mans.filter(x => x.miss).map(x => x.m.t).join(', '))}">${esc(E.formation)}</textarea></label>` : ''}
  <label class="fld"><span>Observations</span><textarea class="inp" data-ev="obs">${esc(E.obs)}</textarea></label>
  <p class="small muted">Évaluateur : ${esc(S.user.nom)}</p>`;
}

/* ---------- enregistrement ---------- */
function evBuild(e, c) {
  const now = new Date();
  return {
    version: 1, date: now.toISOString(),
    pompier: { nom: e.nom, grade: (pompiers().find(p => p.nom === e.nom) || {}).grade || '' },
    evaluateur: S.user.nom,
    socle: EV_SOCLE.map(s => ({ t: s.t, critique: s.c, etat: e.socle[s.k] || '' })),
    questionnaire: { passe: e.quizOn, score: e.quizOn ? c.score : null, total: EV_QUIZ.length },
    manoeuvres: c.mans.map(x => ({ id: x.m.id, titre: x.m.t, manquantes: x.miss,
      etapes: x.m.steps.map((s, i) => ({ t: s[0], critique: !!s[1], fait: !!((e.man[x.m.id] || {}).s || [])[i] })) })),
    critiquesNonValides: c.critKO, decision: e.dec, decisionAuto: c.auto,
    reserves: e.dec === 'reserves' ? e.reserves.trim() : '', reevaluation: e.dec === 'reserves' ? e.reeval : '',
    formation: e.dec === 'formation' ? e.formation.trim() : '', observation: e.obs.trim(), app: 'monter-vehicule eval 1'
  };
}
function evSend() {
  const c = evCalc(E);
  if (!c.complete) { toast('Complète d’abord le socle commun', true); E.step = 0; evDraft(); render(); return; }
  if (!E.dec) { toast('Choisis une décision', true); return; }
  const o = evBuild(E, c), d = new Date(o.date);
  const path = `evaluations/${d.getFullYear()}/${p2(d.getMonth() + 1)}/${stamp(d)}_${slug(E.nom)}.json`;
  const nom = E.nom;
  queue({ extra: [{ path, obj: o, msg: 'Évaluation conducteur — ' + nom }] });
  cachePut(path, 'local', o);
  E = null; LS.del('mv.evdraft');
  S.view = 'reglages'; render();
  toast('Évaluation enregistrée');
  evHistSheet(nom);
}

/* ---------- liste des pompiers, historique, fiche ---------- */
const evFiles = nom => S.tree.map(t => { const m = EV_RX.exec(t.p); return m ? { p: t.p, id: m[1], sl: m[2] } : null; })
  .filter(x => x && (!nom || x.sl === slug(nom))).sort((a, b) => b.id.localeCompare(a.id));
const evDateFr = id => fromStamp(id).toLocaleDateString('fr-FR');
const evPill = o => { const d = EV_DEC[o && o.decision]; return d ? `<span class="pill ${d[1]}">${d[0]}</span>` : ''; };

function evListRows(q) {
  const k = q && q.trim() ? norm(q) : '', L = pompiers().filter(p => !k || norm(p.nom).includes(k));
  if (!L.length) return '<div class="small muted" style="padding:10px 4px">Aucun nom ne correspond.</div>';
  return L.map(p => { const f = evFiles(p.nom)[0];
    return `<button class="li" style="margin-bottom:8px" data-act="evHist" data-n="${esc(p.nom)}"><div class="grow"><div class="lt">${esc(p.nom)}${p.grade ? ` <span class="gr">${esc(p.grade)}</span>` : ''}</div><div class="ls">${f ? 'Dernière évaluation le ' + evDateFr(f.id) : 'Jamais évalué'}</div></div><span data-evb="${f ? esc(f.p) : ''}"></span>${ico('chev', 'chev')}</button>`; }).join('');
}
async function evFillBadges(root) {
  for (const el of root.querySelectorAll('[data-evb]')) {
    const p = el.dataset.evb; if (!p) continue;
    try { const o = await readJSON(p); if (o) el.innerHTML = evPill(o); } catch (e) {}
  }
}
function evListSheet() {
  sheet(`<h3>Évaluation conducteur</h3><p class="muted small" style="margin-top:0">Choisis le pompier à évaluer. Réservé à l’espace responsable.</p>
  ${E ? `<button class="li" style="margin-bottom:12px" data-act="evNew" data-n="${esc(E.nom)}"><div class="lic">${ico('note')}</div><div class="grow"><div class="lt">Reprendre le brouillon</div><div class="ls">${esc(E.nom)}</div></div>${ico('chev', 'chev')}</button>` : ''}
  <input class="inp" id="ev-q" placeholder="Rechercher un pompier…" autocomplete="off" style="margin-bottom:10px">
  <div id="ev-list" style="max-height:52vh;overflow:auto">${evListRows('')}</div>
  <button class="btn ghost block" style="margin-top:8px" data-act="close">Fermer</button>`);
  evFillBadges(layer);
}
function evHistSheet(nom) {
  const L = evFiles(nom);
  sheet(`<h3>${esc(nom)}</h3><p class="muted small" style="margin-top:0">${L.length ? L.length + ' évaluation' + (L.length > 1 ? 's' : '') : 'Pas encore d’évaluation'}</p>
  <button class="btn red block" data-act="evNew" data-n="${esc(nom)}">${ico('plus')} ${E && E.nom === nom ? 'Reprendre le brouillon' : 'Nouvelle évaluation'}</button>
  <div style="margin-top:14px">${L.map(f => `<button class="li" style="margin-bottom:8px" data-act="evOpen" data-p="${esc(f.p)}"><div class="grow"><div class="lt">${evDateFr(f.id)}</div><div class="ls">Évaluation</div></div><span data-evb="${esc(f.p)}"></span>${ico('chev', 'chev')}</button>`).join('')}</div>
  <button class="btn ghost block" style="margin-top:6px" data-act="evList">Retour à la liste</button>`);
  evFillBadges(layer);
}
async function evViewSheet(p) {
  let o = null; try { o = await readJSON(p); } catch (e) {}
  if (!o) { toast('Évaluation illisible pour l’instant', true); return; }
  evViewSheet.cur = o;
  const manq = o.manoeuvres.filter(m => m.manquantes);
  sheet(`<h3>${esc(o.pompier.nom)}</h3><p class="muted small" style="margin-top:0">Évaluée le ${new Date(o.date).toLocaleDateString('fr-FR')} par ${esc(o.evaluateur)}</p>
  <div style="margin-bottom:12px">${evPill(o)}</div>
  <div class="card" style="margin-bottom:12px">
    <div class="small">Socle commun : ${o.socle.filter(s => s.etat === 'a').length}/${o.socle.length} acquis</div>
    <div class="small">Questionnaire : ${o.questionnaire.passe ? o.questionnaire.score + '/' + o.questionnaire.total : 'non passé'}</div>
    <div class="small">Manœuvres évaluées : ${o.manoeuvres.length}${o.manoeuvres.length ? ' (' + o.manoeuvres.filter(m => !m.manquantes).length + ' acquise(s))' : ''}</div>
    ${manq.length ? `<div class="small muted" style="margin-top:8px">À reprendre : ${manq.map(m => esc(m.titre)).join(' · ')}</div>` : ''}
    ${o.critiquesNonValides && o.critiquesNonValides.length ? `<div class="small muted" style="margin-top:8px">Points critiques non validés : ${o.critiquesNonValides.map(esc).join(' · ')}</div>` : ''}
    ${o.reserves ? `<div class="small" style="margin-top:8px"><b>Points à reprendre :</b> ${esc(o.reserves)}${o.reevaluation ? ' · nouvelle évaluation le ' + new Date(o.reevaluation).toLocaleDateString('fr-FR') : ''}</div>` : ''}
    ${o.formation ? `<div class="small" style="margin-top:8px"><b>À retravailler :</b> ${esc(o.formation)}</div>` : ''}
    ${o.observation ? `<div class="small" style="margin-top:8px"><b>Observations :</b> ${esc(o.observation)}</div>` : ''}
  </div>
  <button class="btn red block" data-act="evPrint">${ico('print')} Imprimer / enregistrer en PDF</button>
  <button class="btn block" style="margin-top:8px" data-act="evShare">${ico('send')} Partager le résumé</button>
  <button class="btn ghost block" style="margin-top:6px" data-act="evHist" data-n="${esc(o.pompier.nom)}">Retour</button>`);
}

/* ---------- fiche imprimable et partage ---------- */
function evSummary(o) {
  const d = EV_DEC[o.decision] || ['', ''];
  const l = [`Évaluation conducteur engin-pompe — ${o.pompier.nom}`, `Date : ${new Date(o.date).toLocaleDateString('fr-FR')} · Évaluateur : ${o.evaluateur}`, `Décision : ${d[0]}`,
    `Socle commun : ${o.socle.filter(s => s.etat === 'a').length}/${o.socle.length} acquis`,
    `Questionnaire : ${o.questionnaire.passe ? o.questionnaire.score + '/' + o.questionnaire.total : 'non passé'}`];
  o.manoeuvres.forEach(m => l.push(`Manœuvre « ${m.titre} » : ${m.manquantes ? m.manquantes + ' étape(s) manquante(s)' : 'acquise'}`));
  if (o.reserves) l.push('Points à reprendre : ' + o.reserves + (o.reevaluation ? ' (nouvelle évaluation le ' + new Date(o.reevaluation).toLocaleDateString('fr-FR') + ')' : ''));
  if (o.formation) l.push('À retravailler : ' + o.formation);
  if (o.observation) l.push('Observations : ' + o.observation);
  return l.join('\n');
}
function evPrintHtml(o) {
  const box = ok => ok ? '&#9745;' : '&#9744;';
  const d = EV_DEC[o.decision] || ['', ''];
  const logo = new URL('engins/logo-herault.png', location.href).href;
  const soc = o.socle.map(s => `<tr><td>${esc(s.t)}${s.critique ? ' <b>(critique)</b>' : ''}</td><td class="c">${box(s.etat === 'a')}</td><td class="c">${box(s.etat === 'c')}</td></tr>`).join('');
  const man = o.manoeuvres.map(m => `<h3>${esc(m.titre)} <span class="r">${m.manquantes ? m.manquantes + ' étape(s) manquante(s)' : 'Acquise'}</span></h3>
    <table class="st">${m.etapes.map((s, i) => `<tr><td class="n">${i + 1}</td><td>${s.critique ? '<b>' + esc(s.t) + '</b>' : esc(s.t)}</td><td class="c">${box(s.fait)}</td></tr>`).join('')}</table>`).join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Évaluation conducteur — ${esc(o.pompier.nom)}</title>
  <style>
    @page{size:A4;margin:12mm}
    *{box-sizing:border-box}
    body{margin:0;font:11pt/1.35 Arial,Helvetica,sans-serif;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .bar{padding:12px;text-align:center;background:#f3f3f3;font-size:14px}
    .bar button{font-size:16px;padding:10px 18px;border-radius:10px;border:0;background:#e5232c;color:#fff;font-weight:700}
    header{display:flex;align-items:center;gap:14px;border-bottom:2px solid #c8141c;padding-bottom:8px;margin-bottom:10px}
    header img{height:22mm}
    header b{display:block;font-size:15pt}
    header span{color:#555;font-size:10pt}
    table{width:100%;border-collapse:collapse;margin:6px 0 10px}
    td,th{border:1px solid #bbb;padding:4px 6px;vertical-align:top;text-align:left}
    th{background:#f0f0f0}
    td.c{text-align:center;width:18mm;font-size:13pt}
    td.n{width:8mm;text-align:center;color:#555}
    h2{font-size:12pt;margin:14px 0 4px;background:#c8141c;color:#fff;padding:3px 8px}
    h3{font-size:10.5pt;margin:10px 0 2px;display:flex;justify-content:space-between}
    h3 .r{font-weight:400;color:#555}
    .dec{font-size:13pt;font-weight:700;margin:6px 0}
    .sig td{height:22mm}
    .sec{break-inside:avoid;page-break-inside:avoid}
    @media print{.bar{display:none}}
  </style></head><body>
  <div class="bar">Fiche prête. <button onclick="print()">Imprimer ou enregistrer en PDF</button></div>
  <header><img src="${logo}" alt=""><div><b>Évaluation du conducteur engin-pompe (COD1)</b><span>SDIS 34 — Service départemental d’incendie et de secours de l’Hérault · ${esc(S.conf.centre || 'CS Cruzy / Quarante')}</span></div></header>
  <table><tr><th style="width:32mm">Stagiaire</th><td>${esc(o.pompier.nom)}${o.pompier.grade ? ' (' + esc(o.pompier.grade) + ')' : ''}</td><th style="width:26mm">Date</th><td>${new Date(o.date).toLocaleDateString('fr-FR')}</td></tr>
  <tr><th>Évaluateur</th><td colspan="3">${esc(o.evaluateur)}</td></tr></table>
  <h2>Socle commun</h2>
  <table><tr><th>Compétence observée</th><th class="c">Acquis</th><th class="c">En cours</th></tr>${soc}</table>
  <h2>Questionnaire théorique</h2>
  <p>${o.questionnaire.passe ? `Score : <b>${o.questionnaire.score} / ${o.questionnaire.total}</b>` : 'Non passé'}</p>
  <h2>Manœuvres évaluées</h2>
  ${man || '<p>Aucune manœuvre évaluée.</p>'}
  <div class="sec"><h2>Décision</h2>
  <div class="dec">${box(o.decision === 'apte')} Apte à conduire &nbsp;&nbsp; ${box(o.decision === 'reserves')} Apte avec réserves &nbsp;&nbsp; ${box(o.decision === 'formation')} Retour en formation</div>
  ${o.reserves ? `<p><b>Points à reprendre :</b> ${esc(o.reserves)}${o.reevaluation ? ' — nouvelle évaluation le ' + new Date(o.reevaluation).toLocaleDateString('fr-FR') : ''}</p>` : ''}
  ${o.formation ? `<p><b>À retravailler :</b> ${esc(o.formation)}</p>` : ''}
  ${o.observation ? `<p><b>Observations :</b> ${esc(o.observation)}</p>` : ''}
  <table class="sig"><tr><th></th><th>Nom</th><th>Date</th><th>Signature</th></tr><tr><th>Évaluateur</th><td>${esc(o.evaluateur)}</td><td>${new Date(o.date).toLocaleDateString('fr-FR')}</td><td></td></tr><tr><th>Stagiaire</th><td>${esc(o.pompier.nom)}</td><td></td><td></td></tr></table></div>
  </body></html>`;
}

/* ---------- actions ---------- */
Object.assign(ACT, {
  evList() { if (!S.admin) return; evListSheet(); },
  evHist(el) { if (!S.admin) return; evHistSheet(el.dataset.n); },
  evNew(el) { if (!S.admin) return; evNew(el.dataset.n); },
  evOpen(el) { if (!S.admin) return; evViewSheet(el.dataset.p); },
  evQuit() { if (confirm('Quitter ? Le brouillon est gardé sur ce téléphone.')) { evDraft(); S.view = 'reglages'; window.scrollTo(0, 0); render(); } },
  evPrev() { E.step = Math.max(0, E.step - 1); E.open = null; evDraft(); window.scrollTo(0, 0); render(); },
  evNext() { E.step = Math.min(3, E.step + 1); E.open = null; evDraft(); window.scrollTo(0, 0); render(); },
  evGo(el) { E.step = +el.dataset.s; evDraft(); window.scrollTo(0, 0); render(); },
  evSoc(el) { const k = el.dataset.k; E.socle[k] = E.socle[k] === el.dataset.v ? '' : el.dataset.v; evDraft(); render(); },
  evQuizOn() { E.quizOn = !E.quizOn; evDraft(); render(); },
  evQ(el) { const i = +el.dataset.i; E.quiz[i] = !E.quiz[i]; evDraft(); render(); },
  evManOpen(el) { E.open = el.dataset.m; evDraft(); window.scrollTo(0, 0); render(); },
  evManBack() { E.open = null; evDraft(); window.scrollTo(0, 0); render(); },
  evManOn(el) { const m = E.man[el.dataset.m] || (E.man[el.dataset.m] = { on: false, s: [] }); m.on = !m.on; evDraft(); render(); },
  evStep(el) { const m = E.man[el.dataset.m] || (E.man[el.dataset.m] = { on: false, s: [] }), i = +el.dataset.i; m.s[i] = !m.s[i]; if (m.s[i]) m.on = true; evDraft(); render(); },
  evDec(el) { E.dec = el.dataset.d; E.decManual = true; evDraft(); render(); },
  evSend,
  evPrint() {
    const o = evViewSheet.cur; if (!o) return;
    const w = window.open('', '_blank'); if (!w) { toast('Autorise l’ouverture des fenêtres pour imprimer', true); return; }
    w.document.open(); w.document.write(evPrintHtml(o)); w.document.close();
  },
  async evShare() {
    const o = evViewSheet.cur; if (!o) return; const t = evSummary(o);
    try { if (navigator.share) { await navigator.share({ title: 'Évaluation conducteur — ' + o.pompier.nom, text: t }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(t); toast('Résumé copié'); } catch (e) { toast('Copie impossible', true); }
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'ev-q' && document.getElementById('ev-list')) { const l = document.getElementById('ev-list'); l.innerHTML = evListRows(el.value); evFillBadges(l); return; }
  if (el.dataset && el.dataset.ev && E) { E[el.dataset.ev] = el.value; clearTimeout(document._evt); document._evt = setTimeout(evDraft, 400); }
});
