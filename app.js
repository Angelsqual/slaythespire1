const $ = (selector) => document.querySelector(selector);

const characters = {
  dragon: {
    id: "dragon",
    name: "Draco de Tifón",
    icon: "🐉",
    portrait: "assets/dragon.png",
    portraitAlt: "Retrato pintado del Draco de Tifón",
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
    portrait: "assets/medusa.png",
    portraitAlt: "Retrato pintado de Medusa de Argos",
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
    portrait: "assets/minotaur.png",
    portraitAlt: "Retrato pintado del Minotauro del Laberinto",
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
  harpy: { name: "Arpía del Estigia", icon: "🪽", portrait: "assets/harpy.png", portraitAlt: "Retrato pintado de la Arpía del Estigia", type: "Acosadora celeste", maxHp: 34, hp: 34, color: "#d2a5ff", intent: "harpy" },
  sphinx: { name: "Esfinge del Umbral", icon: "🦁", portrait: "assets/sphinx.png", portraitAlt: "Retrato pintado de la Esfinge del Umbral", type: "Guardiana enigmática", maxHp: 49, hp: 49, color: "#f2c56d", intent: "sphinx" },
  chimera: { name: "Quimera de Bronce", icon: "🦁", portrait: "assets/chimera.png", portraitAlt: "Retrato pintado de la Quimera de Bronce", type: "Fiera de tres almas", maxHp: 58, hp: 58, color: "#ff9d6c", intent: "chimera" },
  cyclops: { name: "Cíclope Constructor", icon: "👁️", portrait: "assets/cyclops.png", portraitAlt: "Retrato pintado del Cíclope Constructor", type: "Coloso del yunque", maxHp: 70, hp: 70, color: "#ff7d86", intent: "cyclops" },
  typhon: { name: "Tifón, padre de monstruos", icon: "🌋", portrait: "assets/typhon.png", portraitAlt: "Retrato pintado de Tifón", type: "Jefe · Cataclismo primordial", maxHp: 124, hp: 124, color: "#ff7d86", intent: "typhon", boss: true },
};

const mapBlueprint = [
  {
    label: "La frontera del bosque",
    nodes: [
      { type: "battle", label: "Sendero de raíces", icon: "⚔", desc: "Un combate sencillo para probar tu mazo.", flavour: "Las raíces se apartan apenas lo suficiente para dejarte pasar. Algo te sigue desde la maleza." },
      { type: "event", label: "Altar cubierto", icon: "☽", desc: "Una ofrenda antigua pide una decisión.", flavour: "La piedra conserva el nombre de un dios que ya no tiene nadie que lo recuerde." },
      { type: "camp", label: "Claro de luciérnagas", icon: "✿", desc: "Descansa o templa una carta.", flavour: "Entre las luces doradas, el bosque parece respirar al ritmo de tu corazón." },
      { type: "battle", label: "Puerta de espinos", icon: "⚔", desc: "Abre paso entre raíces que sangran savia.", flavour: "Los espinos forman una muralla. Detrás, algo golpea el tronco desde dentro." },
      { type: "event", label: "Estanque susurrante", icon: "⌁", desc: "Escucha una pista sobre las rutas futuras.", flavour: "El agua repite tus pensamientos con una voz que no reconoces." },
    ],
  },
  {
    label: "Los caminos que se separan",
    nodes: [
      { type: "battle", label: "Puente hundido", icon: "⚔", desc: "Cruza un barranco guardado por arpías.", flavour: "El puente termina en el aire. Las arpías han hecho de la otra orilla su nido." },
      { type: "camp", label: "Cuenca de luna", icon: "✿", desc: "Recupera fuerzas en agua plateada.", flavour: "La luna se ha quedado atrapada en la cuenca. Beber de ella deja un recuerdo extraño." },
      { type: "event", label: "Pozo de los ecos", icon: "⌁", desc: "Pregunta al bosque, pero escucha el precio.", flavour: "Tu voz regresa con otra voz detrás. El pozo sabe una ruta que tú no ves." },
      { type: "battle", label: "Arboleda del ocaso", icon: "⚔", desc: "Un combate entre troncos teñidos de rojo.", flavour: "Las hojas caen aunque no sopla el viento. Cada una lleva una pequeña marca de garra." },
      { type: "elite", label: "Nido del basilisco", icon: "♜", desc: "Un duelo élite con botín excepcional.", flavour: "La maleza está cubierta de cristal. El basilisco duerme con un ojo abierto." },
    ],
  },
  {
    label: "La espesura antigua",
    nodes: [
      { type: "elite", label: "Guardia de bronce", icon: "♜", desc: "Un enemigo élite con una recompensa mayor.", flavour: "Las armaduras del viejo templo caminan sin nadie dentro. Una de ellas te señala." },
      { type: "event", label: "Jardín petrificado", icon: "◉", desc: "Arriesga vitalidad por una mejora poderosa.", flavour: "Cada estatua tiene unos ojos demasiado parecidos a los de Medusa." },
      { type: "battle", label: "Barranco de humo", icon: "⚔", desc: "Combate contra una criatura de la espesura.", flavour: "Una grieta humea bajo los helechos. El olor recuerda al hierro caliente." },
      { type: "camp", label: "Círculo de piedra", icon: "✿", desc: "Un descanso seguro junto a las ruinas.", flavour: "Los monolitos forman un reloj sin agujas. Aquí el tiempo parece más lento." },
      { type: "battle", label: "Vado de aguas negras", icon: "⚔", desc: "Cruza un río que no refleja tu rostro.", flavour: "El agua no moja, pero sí deja una sombra fría alrededor de tus tobillos." },
    ],
  },
  {
    label: "Las ruinas del panteón",
    nodes: [
      { type: "event", label: "Oráculo sin rostro", icon: "☽", desc: "Una visión puede cambiar tu construcción.", flavour: "La máscara del oráculo se gira sola hacia ti. No tiene ojos, pero te está mirando." },
      { type: "battle", label: "Galería de mármol", icon: "⚔", desc: "Un combate normal entre dioses caídos.", flavour: "Las columnas muestran victorias de héroes que ya no existen. La próxima inscripción está vacía." },
      { type: "elite", label: "Puerta del coloso", icon: "♜", desc: "El guardián más duro antes del umbral.", flavour: "La puerta no se abre: se inclina hacia delante, como si el edificio entero quisiera luchar." },
      { type: "battle", label: "Santuario colgante", icon: "⚔", desc: "Lucha sobre un puente suspendido.", flavour: "El santuario cuelga de cadenas oxidadas. Cada golpe hace temblar las campanas." },
      { type: "camp", label: "Cripta de hiedra", icon: "✿", desc: "Una sala tranquila entre raíces y mármol.", flavour: "Las raíces han protegido una pequeña llama durante siglos. Todavía reconoce a los vivos." },
    ],
  },
  {
    label: "El lago de ceniza",
    nodes: [
      { type: "battle", label: "Lago de ceniza", icon: "⚔", desc: "Una última batalla para afinar tu mazo.", flavour: "Bajo la ceniza flotan coronas, espadas y nombres. Algo se mueve debajo." },
      { type: "event", label: "Pacto de sombra", icon: "⌁", desc: "El destino ofrece una ventaja con un coste.", flavour: "Una sombra te ofrece la mano. En su palma está dibujado el mapa que acabas de recorrer." },
      { type: "camp", label: "Hoguera lunar", icon: "✿", desc: "Descansa antes de adentrarte en la montaña.", flavour: "La luna se refleja en las brasas. El camino de vuelta ha desaparecido." },
      { type: "elite", label: "Arena de bronce", icon: "♜", desc: "Un combate élite por una reliquia.", flavour: "El suelo de la arena está lleno de nombres. El tuyo empieza a aparecer solo." },
      { type: "event", label: "Hilo rojo", icon: "⌁", desc: "Cambia una carta por una oportunidad incierta.", flavour: "Un hilo rojo cruza el lago y desaparece bajo la montaña." },
    ],
  },
  {
    label: "El último ascenso",
    nodes: [
      { type: "battle", label: "Paso de la raíz celeste", icon: "⚔", desc: "Un combate contra guardianes del cielo.", flavour: "Una raíz atraviesa las nubes y forma un puente hacia la cima." },
      { type: "camp", label: "Último hogar", icon: "✿", desc: "Prepara tu mazo para el tramo final.", flavour: "Las cenizas dibujan el contorno de todos los que llegaron antes que tú." },
      { type: "event", label: "Corona de brasas", icon: "⌁", desc: "Una reliquia poderosa exige un sacrificio.", flavour: "La corona no pesa sobre la cabeza: pesa sobre la historia que llevas detrás." },
      { type: "elite", label: "Escalera de titanes", icon: "♜", desc: "El último gran combate antes del umbral.", flavour: "Cada escalón es una vértebra de un dios antiguo. La montaña te siente subir." },
      { type: "battle", label: "Observatorio roto", icon: "⚔", desc: "Rompe una última defensa del panteón.", flavour: "Los astrolabios apuntan a un cielo que todavía no existe." },
    ],
  },
  {
    label: "La garganta del mundo",
    nodes: [
      { type: "elite", label: "Custodio final", icon: "♜", desc: "Un élite de guardia ante la puerta del jefe.", flavour: "El custodio no protege la puerta: protege lo que ocurrirá si la abres." },
      { type: "camp", label: "Brasero del umbral", icon: "✿", desc: "Último descanso. Después no habrá vuelta atrás.", flavour: "La llama arde azul y no proyecta sombra. Tu mazo parece más pesado junto a ella." },
      { type: "event", label: "Pacto final", icon: "⌁", desc: "El destino ofrece su última ventaja.", flavour: "Una sombra te ofrece la mano. En su palma está dibujado el mapa que acabas de recorrer." },
      { type: "battle", label: "Garganta volcánica", icon: "⚔", desc: "El último combate normal antes de Tifón.", flavour: "El aire quema los pulmones. Desde el fondo llega un latido del tamaño de una montaña." },
      { type: "event", label: "Último oráculo", icon: "☽", desc: "Una visión final puede salvarte o quebrarte.", flavour: "El oráculo se quita la máscara. Debajo hay otra máscara que lleva tu nombre." },
    ],
  },
  {
    label: "El Umbral",
    nodes: [
      { type: "boss", label: "Tifón", icon: "✹", desc: "El padre de los monstruos. No hay otra salida.", flavour: "La montaña se abre. Tifón despierta y el cielo aprende a tener miedo." },
    ],
  },
];

function buildMap() {
  const rows = [8, 29, 50, 71, 92];
  const layers = mapBlueprint.map((layer, layerIndex) => layer.nodes.map((node, nodeIndex) => ({
    ...node,
    id: `node-${layerIndex}-${nodeIndex}`,
    layer: layerIndex,
    x: 6 + layerIndex / (mapBlueprint.length - 1) * 88,
    y: layer.nodes.length === 1 ? 50 : rows[nodeIndex],
    children: [],
  })));
  const edges = [];
  layers.forEach((layer, layerIndex) => {
    if (layerIndex === layers.length - 1) return;
    const nextLayer = layers[layerIndex + 1];
    layer.forEach((node, nodeIndex) => {
      const windowSize = Math.min(3, nextLayer.length);
      const windowStart = Math.max(0, Math.min(nodeIndex - 1, nextLayer.length - windowSize));
      const targetIndexes = Array.from({ length: windowSize }, (_, offset) => windowStart + offset);
      node.children = targetIndexes.map((index) => nextLayer[index].id);
      node.children.forEach((childId) => edges.push({ from: node.id, to: childId }));
    });
  });
  return { layers, nodes: layers.flat(), edges };
}

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
      <div class="character-art"><img src="${character.portrait}" alt="${character.portraitAlt}" /></div>
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
    map: buildMap(),
    mapLayer: 0,
    activeNodeId: null,
    availableNodeIds: [],
    completedNodeIds: [],
    rested: false,
    deck: character.deck.map((id) => cardFromId(id)),
    relics: [character.startingRelic],
    logs: [],
  };
  state.run.availableNodeIds = state.run.map.layers[0].map((node) => node.id);
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
  const progress = state.run.completedNodeIds.length;
  $("#run-summary").innerHTML = `<span style="color:${character.color}">${character.icon} ${character.name}</span> · Bosque de Nemea · ${progress}/36 hitos`;
}

function renderMap() {
  const run = state.run;
  const character = characters[run.characterId];
  const activeNode = run.map.nodes.find((node) => node.id === run.activeNodeId);
  const currentLayer = run.map.layers[run.mapLayer] || run.map.layers[0];
  $("#map-stage-label").textContent = `ACTO I · CAPA ${Math.min(run.mapLayer + 1, run.map.layers.length)}/${run.map.layers.length} · ${currentLayer[0].layer === run.map.layers.length - 1 ? "EL UMBRAL" : "BOSQUE"}`;
  $("#map-character-icon").innerHTML = `<img class="small-portrait" src="${character.portrait}" alt="${character.portraitAlt}" />`;
  $("#map-character-name").textContent = character.name;
  $("#map-hp").textContent = `${run.hp}/${run.maxHp}`;
  $("#map-gold").textContent = `${run.gold} ✦`;
  $("#map-wins").textContent = run.wins;
  $("#map-deck-count").textContent = run.deck.length;
  $("#map-relics").innerHTML = run.relics.map((id) => `<span class="relic-chip" title="${relics[id].description}">${relics[id].icon} ${relics[id].name}</span>`).join("");
  const edgeMarkup = run.map.edges.map((edge) => {
    const from = run.map.nodes.find((node) => node.id === edge.from);
    const to = run.map.nodes.find((node) => node.id === edge.to);
    const edgeState = run.completedNodeIds.includes(edge.from)
      ? "revealed"
      : run.availableNodeIds.includes(edge.from) ? "open" : "";
    return `<line class="map-edge ${edgeState}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
  }).join("");
  const nodeMarkup = run.map.nodes.map((node) => {
    const completed = run.completedNodeIds.includes(node.id);
    const available = run.availableNodeIds.includes(node.id);
    const current = run.activeNodeId === node.id;
    const status = completed ? "completed" : current ? "current" : available ? "available" : "future";
    return `<button class="map-node ${status}" style="--node-x:${node.x}%;--node-y:${node.y}%" data-action="choose-node" data-node-id="${node.id}" ${available ? "" : "disabled"} title="${node.desc}"><span class="map-node-orb">${completed ? "✓" : node.icon}</span><span class="map-node-label">${node.label}</span><span class="map-node-layer">${node.layer === run.map.layers.length - 1 ? "JEFE" : `CAPA ${node.layer + 1}`}</span></button>`;
  }).join("");
  $("#map-path").innerHTML = `<div class="map-graph"><svg class="map-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edgeMarkup}</svg>${nodeMarkup}</div>`;
  $("#map-flavour-text").textContent = activeNode?.flavour || "El bosque se abre en varias direcciones. Elige el camino que mejor encaje con tu mazo.";
  const choices = run.map.nodes.filter((node) => run.availableNodeIds.includes(node.id));
  $("#node-choices").innerHTML = choices.map((node) => `
    <button class="node-choice" data-action="choose-node" data-node-id="${node.id}">
      <span class="node-choice-icon">${node.icon}</span><span><span class="node-choice-name">${node.label}</span><span class="node-choice-desc">${node.desc}</span><span class="node-choice-kind">${node.type === "battle" ? "COMBATE" : node.type === "elite" ? "ÉLITE" : node.type === "camp" ? "DESCANSO" : node.type === "boss" ? "JEFE" : "EVENTO"}</span></span><span class="node-choice-arrow">→</span>
    </button>`).join("");
}

function chooseNode(nodeId) {
  const run = state.run;
  const node = run?.map.nodes.find((item) => item.id === nodeId);
  if (!run || !node || !run.availableNodeIds.includes(nodeId)) {
    toast("Ese camino todavía no está abierto.");
    return;
  }
  run.activeNodeId = node.id;
  run.mapLayer = node.layer;
  if (node.type === "battle") startCombat(randomNormalEnemy());
  if (node.type === "elite") startCombat("cyclops");
  if (node.type === "boss") startCombat("typhon");
  if (node.type === "camp") openCamp();
  if (node.type === "event") openEvent();
}

function randomNormalEnemy() {
  const pool = state.run.mapLayer < 2 ? ["harpy", "sphinx"] : ["sphinx", "chimera"];
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
  animateCombatant(".enemy-area .combatant", def.type === "Ataque" ? "hit" : "pulse");
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
  animateCombatant(".player-area .combatant", "hit");
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
  advanceAfterNode();
}

function advanceAfterNode() {
  const run = state.run;
  const node = run?.map.nodes.find((item) => item.id === run.activeNodeId);
  if (!run || !node) return;
  if (!run.completedNodeIds.includes(node.id)) run.completedNodeIds.push(node.id);
  run.availableNodeIds = node.children || [];
  run.activeNodeId = null;
  run.mapLayer = Math.min(node.layer + 1, run.map.layers.length - 1);
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
  const node = state.run.map.nodes.find((item) => item.id === state.run.activeNodeId);
  const isPact = (node?.layer || 0) >= 4;
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
    advanceAfterNode();
  }
  if (modal.kind === "event") {
    if (choice === "vision") { state.run.hp = Math.max(1, state.run.hp - 8); addRandomCard(true); }
    if (choice === "blessing") { state.run.maxHp += 8; state.run.hp = Math.min(state.run.maxHp, state.run.hp + 8); }
    if (choice === "power") { state.run.hp = Math.max(1, state.run.hp - 10); state.run.relics.push(randomRelic()); }
    if (choice === "gold") { removeCommonCard(); state.run.gold += 35; }
    advanceAfterNode();
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
  const node = state.run.map.nodes.find((item) => item.id === state.run.activeNodeId);
  $("#battle-stage-label").textContent = `· CAPA ${(node?.layer || 0) + 1}`;
  $("#battle-title").textContent = enemy.boss ? "El padre de monstruos despierta" : `${enemy.name} reclama tu sangre`;
  $("#battle-turn-label").textContent = `TURNO ${c.turn}`;
  const enemyStatuses = Object.entries(enemy.status).filter(([, value]) => value > 0).map(([key, value]) => `<span class="status-badge ${key}">${statusName(key)} ${value}</span>`).join("");
  const intent = enemy.intentData;
  const intentText = intent.type === "attack" ? `⚔ ${intent.amount} · ${intent.label}` : intent.type === "block" ? `◇ +${intent.amount} bloqueo` : `☽ ${intent.label}`;
  $("#enemy-area").innerHTML = `<div class="combatant enemy-combatant" style="--combat-color:${enemy.color}"><div class="enemy-portrait"><img src="${enemy.portrait}" alt="${enemy.portraitAlt}" /></div><div class="combatant-name">${enemy.name}</div><div class="combatant-type">${enemy.type}</div><div class="health-track"><div class="health-fill" style="width:${clamp(enemy.hp / enemy.maxHp * 100, 0, 100)}%; background:linear-gradient(90deg,${enemy.color},#ffb56d)"></div></div><div class="combatant-meta"><span><strong>${Math.max(0, enemy.hp)}</strong> / ${enemy.maxHp} PV</span><span>Bloqueo <strong>${enemy.block}</strong></span></div><div class="status-row">${enemyStatuses}</div><div class="intent">Intención · ${intentText}</div></div>`;
  const playerStatuses = ["heat", "gaze", "fury", "momentum"].filter((key) => (c.player[key] || 0) > 0).map((key) => `<span class="status-badge">${statusName(key)} ${c.player[key]}</span>`).join("");
  $("#player-area").innerHTML = `<div class="combatant player-combatant"><div class="combatant-portrait"><img src="${character.portrait}" alt="${character.portraitAlt}" /></div><div class="combatant-name">${character.name}</div><div class="combatant-type">Tu leyenda</div><div class="health-track"><div class="health-fill player-fill" style="width:${clamp(state.run.hp / state.run.maxHp * 100, 0, 100)}%"></div></div><div class="combatant-meta"><span><strong>${Math.max(0, state.run.hp)}</strong> / ${state.run.maxHp} PV</span><span>Bloqueo <strong>${c.player.block}</strong></span><span>Energía <strong>${c.energy}/${c.maxEnergy}</strong></span></div><div class="status-row">${playerStatuses}</div></div>`;
  $("#battle-log").innerHTML = c.log.map((item) => `<span>${item}</span>`).join(" · ");
  $("#combat-character-line").innerHTML = `<span class="mini-icon"><img class="mini-portrait" src="${character.portrait}" alt="" /></span><strong>${character.name}</strong>`;
  $("#combat-hp").textContent = `${Math.max(0, state.run.hp)} / ${state.run.maxHp}`;
  $("#combat-block").textContent = c.player.block;
  $("#combat-gold").textContent = `${state.run.gold} ✦`;
  $("#combat-relics").innerHTML = state.run.relics.map((id) => `<span class="relic-chip" title="${relics[id].description}">${relics[id].icon} ${relics[id].name}</span>`).join("");
  $("#energy-label").textContent = `${c.energy} / ${c.maxEnergy} Energía`;
  $("#hand").innerHTML = c.hand.map((card, index) => renderCard(card, index, c.energy)).join("");
}

function animateCombatant(selector, className) {
  requestAnimationFrame(() => {
    const node = $(selector);
    if (!node) return;
    node.classList.remove("hit", "pulse");
    void node.offsetWidth;
    node.classList.add(className);
    setTimeout(() => node.classList.remove(className), 520);
  });
}

const familyArt = {
  attack: '<svg class="family-svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 51 51 13M38 12l14 14M21 43l9 9M17 47l-4 4 4-1 4 4 1-4"/></svg>',
  defense: '<svg class="family-svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M32 6 52 14v17c0 13-8 22-20 28C20 53 12 44 12 31V14zM22 32l7 7 14-16"/></svg>',
  skill: '<svg class="family-svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m32 7 4.5 16.5L53 28l-16.5 4.5L32 49l-4.5-16.5L11 28l16.5-4.5zM50 45l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/></svg>',
  power: '<svg class="family-svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="32" r="11"/><path d="M32 5v10M32 49v10M5 32h10M49 32h10M13 13l7 7M44 44l7 7M51 13l-7 7M20 44l-7 7"/></svg>',
};

function renderCard(card, index, energy = 0, action = "play-card") {
  const def = cardDef(card);
  const description = def.text(card);
  const category = def.type === "Ataque" ? "attack" : def.type === "Defensa" ? "defense" : def.type === "Poder" ? "power" : "skill";
  const familyLabel = { attack: "ESPADA", defense: "ESCUDO", power: "PODER", skill: "HECHIZO" }[category];
  const actionMarkup = action === "choose-reward"
    ? `data-action="choose-reward" data-reward-index="${index}"`
    : `data-action="play-card" data-card-index="${index}"`;
  return `<button class="card ${category}-card ${card.upgraded ? "upgraded" : ""} ${def.cost > energy ? "unplayable" : ""}" style="--card-color:${def.color};--card-index:${index}" ${actionMarkup} title="${def.rarity}"><span class="card-cost">${def.cost}</span><span class="card-watermark">${familyArt[category]}</span><span class="card-symbol" aria-hidden="true">${familyArt[category]}</span><h4>${def.name}${card.upgraded ? " +" : ""}</h4><span class="card-type">${familyLabel} · ${def.type}</span><p>${description}</p></button>`;
}

function renderReward() {
  const reward = state.reward;
  if (!reward) return;
  $("#reward-gold-amount").textContent = reward.gold;
  $("#reward-flavour").textContent = state.run.wins > 2 ? "Tu leyenda empieza a preocupar a los dioses." : "Aún queda sangre por derramar.";
  $("#reward-cards").innerHTML = reward.cards.map((id, index) => renderCard(cardFromId(id), index, 99, "choose-reward")).join("");
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
  if (action === "choose-node") chooseNode(target.dataset.nodeId);
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

