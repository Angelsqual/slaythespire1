const $ = (selector) => document.querySelector(selector);

const characters = {
  dragon: {
    id: "dragon",
    name: "Draco de Tifón",
    icon: "🐉",
    role: "Tesoro · Fuego · Riesgo",
    color: "#ff9d6c",
    description: "Acumula calor y tesoro hasta convertir una chispa en una catástrofe.",
    maxHp: 74,
    startingRelic: "hoard",
    deck: ["ember-claw", "ember-claw", "golden-scales", "golden-scales", "hoard", "hoard", "inferno", "ember-claw"],
  },
  medusa: {
    id: "medusa",
    name: "Medusa de Argos",
    icon: "🐍",
    role: "Mirada · Veneno · Control",
    color: "#7dd8d0",
    description: "Mira demasiado tiempo y hasta los titanes aprenden a temer la piedra.",
    maxHp: 68,
    startingRelic: "aegis",
    deck: ["venomous-gaze", "venomous-gaze", "petrify", "mirror", "mirror", "serpent-curse", "venomous-gaze", "petrify"],
  },
  minotaur: {
    id: "minotaur",
    name: "Minotauro del Laberinto",
    icon: "🐂",
    role: "Furia · Carga · Momentum",
    color: "#bc92ff",
    description: "Cada golpe te acerca al borde. Cada paso más allá del borde rompe un muro.",
    maxHp: 82,
    startingRelic: "thread",
    deck: ["headbutt", "headbutt", "charge", "charge", "bull-guard", "bull-guard", "trample", "labyrinth"],
  },
};

const relics = {
  hoard: { icon: "◈", name: "Horda del dragón", description: "+5 oro tras cada victoria." },
  aegis: { icon: "◉", name: "Égida partida", description: "Comienzas cada combate con 6 de bloqueo." },
  thread: { icon: "⌁", name: "Hilo de Ariadna", description: "El primer descanso de cada run cura 6 extra." },
  pomegranate: { icon: "✿", name: "Granada de Perséfone", description: "Curas 2 de vitalidad al empezar un combate." },
  feather: { icon: "𐂂", name: "Pluma de Ícaro", description: "Tu primer ataque de cada combate hace +3 daño." },
};

const cards = {
  "ember-claw": {
    name: "Garra de Ascua", type: "Ataque", icon: "✹", color: "#ff9d6c", cost: 1, rarity: "Común", exhaust: false,
    text: (c) => `Inflige ${c.upgraded ? 10 : 7} daño. Aplica ${c.upgraded ? 4 : 3} Quemadura. +1 Calor.`,
    play: (c) => { hitEnemy(c.upgraded ? 10 : 7); addEnemyStatus("burn", c.upgraded ? 4 : 3); addPlayerStatus("heat", 1); },
  },
  "golden-scales": {
    name: "Escamas Doradas", type: "Defensa", icon: "◇", color: "#ffbf76", cost: 1, rarity: "Común", exhaust: false,
    text: (c) => `Gana ${c.upgraded ? 13 : 9} Bloqueo. Roba 1 carta si tienes 3+ Calor.`,
    play: (c) => { addBlock(c.upgraded ? 13 : 9); if ((combat().player.heat || 0) >= 3) drawCards(1); },
  },
  hoard: {
    name: "Contar el Tesoro", type: "Habilidad", icon: "◈", color: "#f2c56d", cost: 0, rarity: "Común", exhaust: true,
    text: (c) => `Roba ${c.upgraded ? 3 : 2} cartas. Gana 3 Oro. +1 Calor.`,
    play: (c) => { drawCards(c.upgraded ? 3 : 2); state.run.gold += 3; addPlayerStatus("heat", 1); },
  },
  inferno: {
    name: "Infierno Solar", type: "Poder", icon: "☼", color: "#ff7d86", cost: 2, rarity: "Rara", exhaust: false,
    text: (c) => `Inflige ${c.upgraded ? 22 : 15} daño y ${c.upgraded ? 7 : 5} Quemadura. Si tienes 3+ Calor, +8 daño.`,
    play: (c) => { let damage = c.upgraded ? 22 : 15; if ((combat().player.heat || 0) >= 3) damage += 8; hitEnemy(damage); addEnemyStatus("burn", c.upgraded ? 7 : 5); combat().player.heat = 0; logBattle("El calor se convierte en un sol furioso."); },
  },
  "venomous-gaze": {
    name: "Mirada Venenosa", type: "Ataque", icon: "◉", color: "#7dd8d0", cost: 1, rarity: "Común", exhaust: false,
    text: (c) => `Inflige ${c.upgraded ? 9 : 6} daño. Aplica ${c.upgraded ? 5 : 4} Veneno. +1 Mirada.`,
    play: (c) => { hitEnemy(c.upgraded ? 9 : 6); addEnemyStatus("poison", c.upgraded ? 5 : 4); addPlayerStatus("gaze", 1); },
  },
  petrify: {
    name: "Petrificar", type: "Ataque", icon: "⬡", color: "#a9eee8", cost: 2, rarity: "Rara", exhaust: false,
    text: (c) => `Inflige ${c.upgraded ? 13 : 8} daño +2 por Mirada. Con 3 Miradas, aturde al enemigo.`,
    play: (c) => { const p = combat().player; hitEnemy((c.upgraded ? 13 : 8) + (p.gaze || 0) * 2); if ((p.gaze || 0) >= 3) { addEnemyStatus("petrified", 1); p.gaze -= 3; logBattle("La mirada encuentra el alma: el enemigo se petrifica."); } },
  },
  mirror: {
    name: "Espejo de Bronce", type: "Defensa", icon: "◌", color: "#89b9c7", cost: 1, rarity: "Común", exhaust: false,
    text: (c) => `Gana ${c.upgraded ? 12 : 8} Bloqueo. Tu próxima defensa devuelve 4 daño.`,
    play: (c) => { addBlock(c.upgraded ? 12 : 8); combat().player.reflect = 4; },
  },
  "serpent-curse": {
    name: "Maldición Serpentina", type: "Habilidad", icon: "⌁", color: "#9fe6ae", cost: 1, rarity: "Común", exhaust: false,
    text: (c) => `Aplica 2 Vulnerable y 5 Veneno. +1 Mirada.`,
    play: () => { addEnemyStatus("vulnerable", 2); addEnemyStatus("poison", 5); addPlayerStatus("gaze", 1); },
  },
  basilisk: {
    name: "Ojo de Basilisco", type: "Ataque", icon: "✺", color: "#7dd8d0", cost: 2, rarity: "Rara", exhaust: true,
    text: (c) => `Inflige ${c.upgraded ? 25 : 18} daño. Si está Petrificado, duplica el daño.`,
    play: (c) => { let damage = c.upgraded ? 25 : 18; if ((combat().enemy.status.petrified || 0) > 0) damage *= 2; hitEnemy(damage); },
  },
  headbutt: {
    name: "Testarazo", type: "Ataque", icon: "✦", color: "#bc92ff", cost: 1, rarity: "Común", exhaust: false,
    text: (c) => `Inflige ${c.upgraded ? 11 : 8} daño. +1 Furia. Con 3+ Furia, +6 daño.`,
    play: (c) => { const p = combat().player; let damage = c.upgraded ? 11 : 8; if ((p.fury || 0) >= 3) damage += 6; hitEnemy(damage); addPlayerStatus("fury", 1); },
  },
  charge: {
    name: "Carga Ciega", type: "Ataque", icon: "➤", color: "#d2a5ff", cost: 1, rarity: "Común", exhaust: false,
    text: (c) => `Inflige ${c.upgraded ? 12 : 7} daño. Gana ${c.upgraded ? 7 : 4} Bloqueo. +1 Momentum.`,
    play: (c) => { hitEnemy(c.upgraded ? 12 : 7); addBlock(c.upgraded ? 7 : 4); addPlayerStatus("momentum", 1); },
  },
  "bull-guard": {
    name: "Guardia del Toro", type: "Defensa", icon: "⬟", color: "#b999e8", cost: 1, rarity: "Común", exhaust: false,
    text: (c) => `Gana ${c.upgraded ? 15 : 11} Bloqueo. +1 Furia.`,
    play: (c) => { addBlock(c.upgraded ? 15 : 11); addPlayerStatus("fury", 1); },
  },
  trample: {
    name: "Arrollar", type: "Ataque", icon: "◆", color: "#ff9d6c", cost: 2, rarity: "Rara", exhaust: false,
    text: (c) => `Inflige ${c.upgraded ? 15 : 9} daño +2 por Furia. Consume la Furia.`,
    play: (c) => { const p = combat().player; hitEnemy((c.upgraded ? 15 : 9) + (p.fury || 0) * 2); p.fury = 0; },
  },
  labyrinth: {
    name: "Pasadizo Oculto", type: "Habilidad", icon: "⌘", color: "#c2a6ff", cost: 0, rarity: "Común", exhaust: true,
    text: (c) => `Roba ${c.upgraded ? 4 : 2} cartas y gana 1 Energía. +1 Momentum.`,
    play: (c) => { drawCards(c.upgraded ? 4 : 2); combat().energy += 1; addPlayerStatus("momentum", 1); },
  },
};

const enemies = {
  harpy: { name: "Arpía del Estigia", icon: "🪽", type: "Acosadora celeste", maxHp: 34, hp: 34, color: "#d2a5ff", intent: "harpy" },
  sphinx: { name: "Esfinge del Umbral", icon: "🦁", type: "Guardiana enigmática", maxHp: 49, hp: 49, color: "#f2c56d", intent: "sphinx" },
  chimera: { name: "Quimera de Bronce", icon: "🦁", type: "Fiera de tres almas", maxHp: 58, hp: 58, color: "#ff9d6c", intent: "chimera" },
  cyclops: { name: "Cíclope Constructor", icon: "👁️", type: "Coloso del yunque", maxHp: 70, hp: 70, color: "#ff7d86", intent: "cyclops" },
  typhon: { name: "Tifón, padre de monstruos", icon: "🌋", type: "Jefe · Cataclismo primordial", maxHp: 124, hp: 124, color: "#ff7d86", intent: "typhon", boss: true },
};

const mapNodes = [
  { type: "battle", label: "Ruinas", icon: "⚔", desc: "Un combate normal" },
  { type: "event", label: "Oráculo", icon: "☽", desc: "Una decisión con precio" },
  { type: "camp", label: "Santuario", icon: "✿", desc: "Descansa o mejora" },
  { type: "elite", label: "Coliseo", icon: "♜", desc: "Riesgo y gran recompensa" },
  { type: "event", label: "Pacto", icon: "⌁", desc: "El destino negocia" },
  { type: "battle", label: "Cenizas", icon: "⚔", desc: "Un último combate" },
  { type: "boss", label: "Tifón", icon: "✹", desc: "El padre de monstruos" },
];

const state = { screen: "select", selectedCharacter: null, run: null, combat: null, reward: null, modal: null, toastTimer: null };

function shuffle(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}

function cardFromId(id, upgraded = false) { return { id, upgraded }; }
function cardDef(card) { return cards[card.id]; }
function combat() { return state.combat; }
function selectedCharacter() { return characters[state.selectedCharacter]; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function renderCharacters() {
  $("#character-grid").innerHTML = Object.values(characters).map((character) => `
    <button class="character-card ${state.selectedCharacter === character.id ? "selected" : ""}" style="--character-color:${character.color}" data-action="select-character" data-character="${character.id}">
      <span class="selection-check">✦</span>
      <div class="character-art">${character.icon}</div>
      <p class="character-role">${character.role}</p>
      <h4>${character.name}</h4>
      <p>${character.description}</p>
      <div class="character-footer"><span>Vitalidad <strong>${character.maxHp}</strong></span><span>Cartas iniciales <strong>${character.deck.length}</strong></span></div>
    </button>
  `).join("");
}

function startRun(characterId = state.selectedCharacter) {
  if (!characterId) return;
  const character = characters[characterId];
  state.selectedCharacter = characterId;
  state.run = {
    characterId,
    hp: character.maxHp,
    maxHp: character.maxHp,
    gold: 45,
    wins: 0,
    stage: 0,
    rested: false,
    deck: character.deck.map((id) => cardFromId(id)),
    relics: [character.startingRelic],
    logs: [],
  };
  state.combat = null;
  state.reward = null;
  state.modal = null;
  state.screen = "map";
  render();
  toast(`${character.icon} ${character.name} entra en la leyenda.`);
}

function resetToSelect() {
  state.screen = "select";
  state.selectedCharacter = null;
  state.run = null;
  state.combat = null;
  state.reward = null;
  state.modal = null;
  render();
}

function render() {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === `screen-${state.screen}`));
  renderCharacters();
  renderTopbar();
  if (state.screen === "map") renderMap();
  if (state.screen === "battle") renderBattle();
  if (state.screen === "reward") renderReward();
  if (state.screen === "ending") renderEnding();
  renderModal();
}

function renderTopbar() {
  if (!state.run) { $("#run-summary").textContent = "Prototipo · build 01"; return; }
  const character = characters[state.run.characterId];
  $("#run-summary").innerHTML = `<span style="color:${character.color}">${character.icon} ${character.name}</span> · Acto I · Nodo ${Math.min(state.run.stage + 1, mapNodes.length)}/${mapNodes.length}`;
}

function renderMap() {
  const run = state.run;
  const character = characters[run.characterId];
  $("#map-stage-label").textContent = `ACTO I · ${run.stage >= mapNodes.length - 1 ? "EL UMBRAL" : `NODO ${run.stage + 1}`}`;
  $("#map-character-icon").textContent = character.icon;
  $("#map-character-name").textContent = character.name;
  $("#map-hp").textContent = `${run.hp}/${run.maxHp}`;
  $("#map-gold").textContent = `${run.gold} ✦`;
  $("#map-wins").textContent = run.wins;
  $("#map-deck-count").textContent = run.deck.length;
  $("#map-relics").innerHTML = run.relics.map((id) => `<span class="relic-chip" title="${relics[id].description}">${relics[id].icon} ${relics[id].name}</span>`).join("");
  $("#map-path").innerHTML = mapNodes.map((node, index) => {
    const status = index < run.stage ? "completed" : index === run.stage ? "current" : "future";
    return `<div class="map-node ${status}"><div class="map-node-orb">${index < run.stage ? "✓" : node.icon}</div><span class="map-node-label">${node.label}</span></div>`;
  }).join("");
  const flavours = [
    "El viento trae olor a ceniza. Las Moiras guardan silencio.",
    "Una voz sin boca pronuncia tu nombre desde las ruinas.",
    "El mármol está frío. Aquí descansaron dioses que ya nadie recuerda.",
    "Tras la puerta de bronce, algo enorme respira con paciencia.",
    "El destino te ofrece una mano. No dice qué cobrará por ella.",
    "La montaña tiembla. El último sendero ya no permite volver atrás.",
    "Al otro lado del umbral, Tifón afila el mundo.",
  ];
  $("#map-flavour-text").textContent = flavours[run.stage] || flavours[flavours.length - 1];
  const choices = run.stage >= mapNodes.length - 1 ? [mapNodes[mapNodes.length - 1]] : [mapNodes[run.stage], ...(run.stage === 0 || run.stage === 3 ? [mapNodes[run.stage + 1]] : [])];
  $("#node-choices").innerHTML = choices.map((node) => `
    <button class="node-choice" data-action="choose-node" data-node="${node.type}" data-node-index="${mapNodes.indexOf(node)}">
      <span class="node-choice-icon">${node.icon}</span><span><span class="node-choice-name">${node.label}</span><span class="node-choice-desc">${node.desc}</span></span><span class="node-choice-arrow">→</span>
    </button>`).join("");
}

function chooseNode(type, nodeIndex) {
  const available = state.run ? [state.run.stage, state.run.stage + 1].filter((index) => index < mapNodes.length) : [];
  if (!state.run || !available.includes(nodeIndex)) {
    toast("Ese camino todavía no está abierto.");
    return;
  }
  state.run.stage = nodeIndex;
  if (type === "battle") startCombat(randomNormalEnemy());
  if (type === "elite") startCombat("cyclops");
  if (type === "boss") startCombat("typhon");
  if (type === "camp") openCamp();
  if (type === "event") openEvent();
}

function randomNormalEnemy() {
  const pool = state.run.stage < 3 ? ["harpy", "sphinx"] : ["sphinx", "chimera"];
  return pool[Math.floor(Math.random() * pool.length)];
}

function startCombat(enemyKey) {
  const template = enemies[enemyKey];
  const enemy = { ...template, hp: template.maxHp, block: 0, status: {}, turn: 1, intentData: null };
  state.combat = {
    enemy,
    turn: 1,
    energy: 3,
    maxEnergy: 3,
    hand: [],
    drawPile: shuffle(state.run.deck.map((card) => ({ ...card }))),
    discard: [],
    exhaust: [],
    player: { block: 0, heat: 0, gaze: 0, fury: 0, momentum: 0, reflect: 0, firstAttack: true },
    log: [`${enemy.name} aparece entre el humo.`],
  };
  calculateEnemyIntent();
  state.screen = "battle";
  if (state.run.relics.includes("aegis")) state.combat.player.block += 6;
  if (state.run.relics.includes("pomegranate")) state.run.hp = Math.min(state.run.maxHp, state.run.hp + 2);
  drawCards(5);
  render();
}

function calculateEnemyIntent() {
  const c = combat();
  const enemy = c.enemy;
  let intent;
  if (enemy.intent === "harpy") intent = c.turn % 3 === 0 ? { type: "debuff", amount: 2, label: "Canto debilitante" } : { type: "attack", amount: 7 + Math.floor(c.turn / 3) * 2, label: "Picotazo" };
  if (enemy.intent === "sphinx") intent = c.turn % 2 === 0 ? { type: "block", amount: 9, label: "Enigma protector" } : { type: "attack", amount: 11, label: "Garra de granito" };
  if (enemy.intent === "chimera") intent = c.turn % 2 === 0 ? { type: "attack", amount: 8, label: "Aliento tóxico", poison: 2 } : { type: "attack", amount: 13, label: "Mordisco triple" };
  if (enemy.intent === "cyclops") intent = c.turn % 3 === 0 ? { type: "block", amount: 13, label: "Forjar armadura" } : { type: "attack", amount: c.turn === 1 ? 16 : 10, label: c.turn === 1 ? "Martillo demoledor" : "Golpe del coloso" };
  if (enemy.intent === "typhon") {
    intent = c.turn % 3 === 0 ? { type: "block", amount: 16, label: "Tormenta primordial" } : c.turn % 2 === 0 ? { type: "attack", amount: 12, label: "Lluvia volcánica", burn: 3 } : { type: "attack", amount: 18, label: "Colmillo de la tierra" };
  }
  enemy.intentData = intent;
}

function drawCards(count) {
  const c = combat();
  for (let i = 0; i < count; i++) {
    if (c.drawPile.length === 0 && c.discard.length) c.drawPile = shuffle(c.discard.splice(0));
    if (c.drawPile.length) c.hand.push(c.drawPile.pop());
  }
}

function playCard(index) {
  const c = combat();
  const card = c.hand[index];
  if (!card) return;
  const def = cardDef(card);
  const cost = Math.max(0, def.cost - (card.upgraded ? 0 : 0));
  if (cost > c.energy) { toast("No tienes suficiente energía."); return; }
  c.energy -= cost;
  c.hand.splice(index, 1);
  def.play(card);
  if (def.exhaust) c.exhaust.push(card); else c.discard.push(card);
  if (state.run.hp <= 0) return endRun(false);
  if (c.enemy.hp <= 0) return winCombat();
  render();
}

function endTurn() {
  const c = combat();
  if (!c) return;
  c.discard.push(...c.hand.splice(0));
  enemyTurn();
}

function enemyTurn() {
  const c = combat();
  const enemy = c.enemy;
  if (tickEnemyStatus("burn")) { if (enemy.hp <= 0) return winCombat(); }
  if (tickEnemyStatus("poison")) { if (enemy.hp <= 0) return winCombat(); }
  if ((enemy.status.petrified || 0) > 0) {
    enemy.status.petrified -= 1;
    logBattle(`${enemy.name} permanece petrificado.`);
  } else {
    const intent = enemy.intentData;
    if (intent.type === "attack") {
      damagePlayer(intent.amount);
      if (intent.poison) addPlayerStatus("poison", intent.poison);
      if (intent.burn) addPlayerStatus("burn", intent.burn);
      logBattle(`${enemy.name} usa ${intent.label}.`);
    } else if (intent.type === "block") {
      enemy.block += intent.amount;
      logBattle(`${enemy.name} se protege con ${intent.label}.`);
    } else {
      addPlayerStatus("weak", intent.amount);
      logBattle(`${enemy.name} entona un ${intent.label}.`);
    }
  }
  c.turn += 1;
  c.energy = c.maxEnergy;
  c.player.block = 0;
  if (c.player.poison) { damagePlayer(c.player.poison); c.player.poison = Math.max(0, c.player.poison - 1); }
  if (c.player.burn) { damagePlayer(c.player.burn); c.player.burn = Math.max(0, c.player.burn - 1); }
  calculateEnemyIntent();
  drawCards(5);
  if (state.run.hp <= 0) return endRun(false);
  render();
}

function hitEnemy(amount) {
  const c = combat();
  let damage = amount;
  if ((c.enemy.status.vulnerable || 0) > 0) damage = Math.ceil(damage * 1.25);
  if (c.player.firstAttack && state.run.relics.includes("feather")) { damage += 3; c.player.firstAttack = false; }
  if (c.enemy.block > 0) { const blocked = Math.min(c.enemy.block, damage); c.enemy.block -= blocked; damage -= blocked; }
  c.enemy.hp -= damage;
  logBattle(`Infliges ${damage} daño a ${c.enemy.name}.`);
}

function damagePlayer(amount) {
  const c = combat();
  let damage = amount;
  if ((c.player.weak || 0) > 0) damage = Math.max(1, Math.floor(damage * .75));
  if (c.player.reflect > 0) { const reflect = c.player.reflect; c.player.reflect = 0; c.enemy.hp -= reflect; logBattle(`El espejo devuelve ${reflect} daño.`); }
  const blocked = Math.min(c.player.block, damage);
  c.player.block -= blocked;
  damage -= blocked;
  state.run.hp -= damage;
  if (damage > 0) logBattle(`Recibes ${damage} daño.`); else logBattle("Tu defensa absorbe el impacto.");
}

function addBlock(amount) { combat().player.block += amount; logBattle(`Ganas ${amount} de bloqueo.`); }

function addEnemyStatus(key, amount) {
  const enemy = combat().enemy;
  enemy.status[key] = (enemy.status[key] || 0) + amount;
  logBattle(`${statusName(key)}: +${amount}.`);
}

function addPlayerStatus(key, amount) {
  const player = combat().player;
  if (key === "poison" || key === "burn") player[key] = (player[key] || 0) + amount;
  else player[key] = (player[key] || 0) + amount;
  if (["heat", "gaze", "fury", "momentum"].includes(key)) logBattle(`${statusName(key)}: +${amount}.`);
}

function statusName(key) { return ({ burn: "Quemadura", poison: "Veneno", petrified: "Petrificación", vulnerable: "Vulnerable", weak: "Debilitado", heat: "Calor", gaze: "Mirada", fury: "Furia", momentum: "Momentum" })[key] || key; }

function tickEnemyStatus(key) {
  const enemy = combat().enemy;
  const amount = enemy.status[key] || 0;
  if (!amount) return false;
  enemy.hp -= amount;
  enemy.status[key] = Math.max(0, amount - 1);
  logBattle(`${enemy.name} sufre ${amount} de ${statusName(key).toLowerCase()}.`);
  return true;
}

function logBattle(message) {
  const c = combat();
  if (!c) return;
  c.log.push(message);
  if (c.log.length > 3) c.log.shift();
}

function winCombat() {
  if (!state.combat) return;
  const enemy = state.combat.enemy;
  state.run.wins += 1;
  const gold = enemy.boss ? 0 : enemy.intent === "cyclops" ? 27 : 13;
  state.run.gold += gold;
  if (state.run.relics.includes("hoard")) state.run.gold += 5;
  if (enemy.boss) return endRun(true);
  state.reward = { gold, cards: rewardChoices() };
  state.combat = null;
  state.screen = "reward";
  render();
}

function rewardChoices() {
  const pool = Object.keys(cards).filter((id) => id !== "inferno" || Math.random() > .35);
  return shuffle(pool).slice(0, 3);
}

function chooseReward(index) {
  const id = state.reward?.cards[index];
  if (!id) return;
  state.run.deck.push(cardFromId(id));
  toast(`${cards[id].name} se une a tu leyenda.`);
  continueAfterReward();
}

function continueAfterReward() {
  state.reward = null;
  state.run.stage += 1;
  state.screen = "map";
  render();
}

function openCamp() {
  state.modal = { kind: "camp", title: "Santuario de las Moiras", copy: "Las ruinas aún guardan un poco de calor. Elige qué sacrificas para seguir avanzando.", options: [
    { id: "rest", title: "Descansar junto al fuego", desc: `Recupera ${state.run.relics.includes("thread") && !state.run.rested ? 24 : 18} de vitalidad.`, },
    { id: "upgrade", title: "Templar una carta", desc: "Mejora una carta al azar de tu mazo." },
  ]};
  renderModal();
}

function openEvent() {
  const isPact = state.run.stage >= 4;
  state.modal = { kind: "event", title: isPact ? "El Pacto de la Sombra" : "El Oráculo sin Rostro", copy: isPact ? "Una sombra te ofrece poder a cambio de una promesa que no puedes leer." : "El oráculo te muestra tres finales posibles. Solo uno tiene un precio visible.", options: isPact ? [
    { id: "power", title: "Aceptar la marca", desc: "Pierdes 10 vitalidad y ganas una reliquia aleatoria." },
    { id: "gold", title: "Vender un recuerdo", desc: "Pierdes 1 carta común y ganas 35 oro." },
  ] : [
    { id: "vision", title: "Mirar dentro del fuego", desc: "Pierdes 8 vitalidad y ganas una carta rara." },
    { id: "blessing", title: "Creer en la profecía", desc: "Ganas 8 de vitalidad máxima y recuperas 8." },
  ]};
  renderModal();
}

function resolveModal(choice) {
  const modal = state.modal;
  if (!modal) return;
  if (modal.kind === "camp") {
    if (choice === "rest") {
      const amount = state.run.relics.includes("thread") && !state.run.rested ? 24 : 18;
      state.run.hp = Math.min(state.run.maxHp, state.run.hp + amount);
      state.run.rested = true;
      toast(`Recuperas ${amount} de vitalidad.`);
    }
    if (choice === "upgrade") upgradeRandomCard();
    state.run.stage += 1; state.screen = "map";
  }
  if (modal.kind === "event") {
    if (choice === "vision") { state.run.hp = Math.max(1, state.run.hp - 8); addRandomCard(true); }
    if (choice === "blessing") { state.run.maxHp += 8; state.run.hp = Math.min(state.run.maxHp, state.run.hp + 8); }
    if (choice === "power") { state.run.hp = Math.max(1, state.run.hp - 10); state.run.relics.push(randomRelic()); }
    if (choice === "gold") { removeCommonCard(); state.run.gold += 35; }
    state.run.stage += 1; state.screen = "map";
  }
  state.modal = null;
  render();
}

function addRandomCard(rare = false) {
  const pool = Object.keys(cards).filter((id) => !rare || cards[id].rarity === "Rara");
  const id = pool[Math.floor(Math.random() * pool.length)];
  state.run.deck.push(cardFromId(id));
  toast(`${cards[id].name} aparece en la visión.`);
}

function upgradeRandomCard() {
  const candidates = state.run.deck.filter((card) => !card.upgraded);
  if (!candidates.length) { toast("Todas tus cartas ya están templadas."); return; }
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  chosen.upgraded = true;
  toast(`${cards[chosen.id].name} ha sido templada.`);
}

function removeCommonCard() {
  const candidates = state.run.deck.filter((card) => cards[card.id].rarity === "Común");
  if (!candidates.length) return;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const index = state.run.deck.indexOf(chosen);
  state.run.deck.splice(index, 1);
  toast(`${cards[chosen.id].name} se pierde en la sombra.`);
}

function randomRelic() {
  const owned = new Set(state.run.relics);
  const pool = Object.keys(relics).filter((id) => !owned.has(id));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : "pomegranate";
}

function endRun(won) {
  state.combat = null;
  state.screen = "ending";
  state.run.completed = won;
  render();
}

function renderBattle() {
  const c = combat();
  if (!c) return;
  const enemy = c.enemy;
  const character = characters[state.run.characterId];
  $("#battle-stage-label").textContent = `· NODO ${state.run.stage + 1}`;
  $("#battle-title").textContent = enemy.boss ? "El padre de monstruos despierta" : `${enemy.name} reclama tu sangre`;
  $("#battle-turn-label").textContent = `TURNO ${c.turn}`;
  const enemyStatuses = Object.entries(enemy.status).filter(([, value]) => value > 0).map(([key, value]) => `<span class="status-badge ${key}">${statusName(key)} ${value}</span>`).join("");
  const intent = enemy.intentData;
  const intentText = intent.type === "attack" ? `⚔ ${intent.amount} · ${intent.label}` : intent.type === "block" ? `◇ +${intent.amount} bloqueo` : `☽ ${intent.label}`;
  $("#enemy-area").innerHTML = `<div class="combatant" style="--combat-color:${enemy.color}"><div class="combatant-icon">${enemy.icon}</div><div class="combatant-name">${enemy.name}</div><div class="combatant-type">${enemy.type}</div><div class="health-track"><div class="health-fill" style="width:${clamp(enemy.hp / enemy.maxHp * 100, 0, 100)}%; background:linear-gradient(90deg,${enemy.color},#ffb56d)"></div></div><div class="combatant-meta"><span><strong>${Math.max(0, enemy.hp)}</strong> / ${enemy.maxHp} PV</span><span>Bloqueo <strong>${enemy.block}</strong></span></div><div class="status-row">${enemyStatuses}</div><div class="intent">Intención · ${intentText}</div></div>`;
  const playerStatuses = ["heat", "gaze", "fury", "momentum"].filter((key) => (c.player[key] || 0) > 0).map((key) => `<span class="status-badge">${statusName(key)} ${c.player[key]}</span>`).join("");
  $("#player-area").innerHTML = `<div class="combatant"><div class="combatant-icon">${character.icon}</div><div class="combatant-name">${character.name}</div><div class="combatant-type">Tu leyenda</div><div class="health-track"><div class="health-fill player-fill" style="width:${clamp(state.run.hp / state.run.maxHp * 100, 0, 100)}%"></div></div><div class="combatant-meta"><span><strong>${Math.max(0, state.run.hp)}</strong> / ${state.run.maxHp} PV</span><span>Bloqueo <strong>${c.player.block}</strong></span><span>Energía <strong>${c.energy}/${c.maxEnergy}</strong></span></div><div class="status-row">${playerStatuses}</div></div>`;
  $("#battle-log").innerHTML = c.log.map((item) => `<span>${item}</span>`).join(" · ");
  $("#combat-character-line").innerHTML = `<span class="mini-icon">${character.icon}</span><strong>${character.name}</strong>`;
  $("#combat-hp").textContent = `${Math.max(0, state.run.hp)} / ${state.run.maxHp}`;
  $("#combat-block").textContent = c.player.block;
  $("#combat-gold").textContent = `${state.run.gold} ✦`;
  $("#combat-relics").innerHTML = state.run.relics.map((id) => `<span class="relic-chip" title="${relics[id].description}">${relics[id].icon} ${relics[id].name}</span>`).join("");
  $("#energy-label").textContent = `${c.energy} / ${c.maxEnergy} Energía`;
  $("#hand").innerHTML = c.hand.map((card, index) => renderCard(card, index, c.energy)).join("");
}

function renderCard(card, index, energy = 0) {
  const def = cardDef(card);
  const description = def.text(card);
  return `<button class="card ${card.upgraded ? "upgraded" : ""} ${def.cost > energy ? "unplayable" : ""}" style="--card-color:${def.color}" data-action="play-card" data-card-index="${index}" title="${def.rarity}"><span class="card-cost">${def.cost}</span><span class="card-symbol">${def.icon}</span><h4>${def.name}${card.upgraded ? " +" : ""}</h4><span class="card-type">${def.type}</span><p>${description}</p></button>`;
}

function renderReward() {
  const reward = state.reward;
  if (!reward) return;
  $("#reward-gold-amount").textContent = reward.gold;
  $("#reward-flavour").textContent = state.run.wins > 2 ? "Tu leyenda empieza a preocupar a los dioses." : "Aún queda sangre por derramar.";
  $("#reward-cards").innerHTML = reward.cards.map((id, index) => `<div data-action="choose-reward" data-reward-index="${index}">${renderCard(cardFromId(id), index, 99)}</div>`).join("");
}

function renderEnding() {
  const won = state.run.completed;
  $("#ending-kicker").textContent = won ? "LEYENDA COMPLETADA" : "LA LEYENDA SE INTERRUMPE";
  $("#ending-title").textContent = won ? "El panteón ha caído." : "Las Moiras aún no han terminado contigo.";
  $("#ending-copy").textContent = won ? `Has atravesado el umbral y has hecho que Tifón recuerde tu nombre. Esta run termina aquí; la siguiente empezará con un destino distinto.` : "Has caído, pero cada carta vista y cada error cometido deja una pista. Vuelve a elegir tu camino.";
  $("#ending-stats").innerHTML = `<div class="ending-stat"><strong>${state.run.wins}</strong><span>Victorias</span></div><div class="ending-stat"><strong>${state.run.deck.length}</strong><span>Cartas reunidas</span></div><div class="ending-stat"><strong>${state.run.gold}</strong><span>Oro final</span></div>`;
}

function renderModal() {
  const modal = state.modal;
  if (!modal) { $("#modal-root").innerHTML = ""; return; }
  $("#modal-root").innerHTML = `<div class="modal"><div class="modal-sigil">✦</div><p class="eyebrow">${modal.kind === "camp" ? "DESCANSO" : "DECISIÓN"}</p><h3>${modal.title}</h3><p>${modal.copy}</p><div class="modal-options">${modal.options.map((option) => `<button class="modal-option" data-action="modal-choice" data-choice="${option.id}"><strong>${option.title}</strong><span>${option.desc}</span></button>`).join("")}</div></div>`;
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => node.classList.remove("visible"), 2400);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "select-character") { state.selectedCharacter = target.dataset.character; render(); $("#start-button").textContent = `Invocar a ${characters[state.selectedCharacter].name}`; $("#start-button").disabled = false; }
  if (action === "start-run") startRun();
  if (action === "new-run") resetToSelect();
  if (action === "choose-node") chooseNode(target.dataset.node, Number(target.dataset.nodeIndex));
  if (action === "play-card") playCard(Number(target.dataset.cardIndex));
  if (action === "end-turn") endTurn();
  if (action === "choose-reward") chooseReward(Number(target.dataset.rewardIndex));
  if (action === "skip-reward") continueAfterReward();
  if (action === "modal-choice") resolveModal(target.dataset.choice);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && state.screen === "battle" && !state.modal) endTurn();
});

render();

