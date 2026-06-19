// ============================================================
// TAMAMON - Creature Database & Evolution System
// ============================================================

// === GB COLOR PALETTE (shared with game.js) ===
const GB = {
  LIGHTEST: 0x9BBC0F,
  LIGHT:    0x8BAC0F,
  DARK:     0x306230,
  DARKEST:  0x0F380F,
};

const GB_CSS = {
  LIGHTEST: '#9BBC0F',
  LIGHT:    '#8BAC0F',
  DARK:     '#306230',
  DARKEST:  '#0F380F',
};

const TYPES = {
  VIRUS:   'VIRUS',
  DATA:    'DATA',
  VACCINE: 'VACCINE',
  MACHINE: 'MACHINE',
  DRAGON:  'DRAGON',
  HOLY:    'HOLY',
};

// Helper: full grid sprite (D=darkest, d=dark, L=light, l=lightest, .=empty)
function spriteFromGrid(lines) {
  const colorMap = { D: GB.DARKEST, d: GB.DARK, L: GB.LIGHT, l: GB.LIGHTEST };
  const pixels = [];
  const height = lines.length;
  let width = 0;
  for (let y = 0; y < height; y++) {
    if (lines[y].length > width) width = lines[y].length;
    for (let x = 0; x < lines[y].length; x++) {
      const c = colorMap[lines[y][x]];
      if (c !== undefined) pixels.push({ x, y, color: c });
    }
  }
  return { pixels, width, height };
}

// Helper: symmetric sprite from LEFT half lines.
// Mirrors left→right. On right side: l↔d swap for shading, D and L stay same.
// fullWidth must be even. Each half line has fullWidth/2 chars.
function symSprite(halfLines, fullWidth) {
  const colorMap = { D: GB.DARKEST, d: GB.DARK, L: GB.LIGHT, l: GB.LIGHTEST };
  const mirrorMap = { D: GB.DARKEST, d: GB.LIGHTEST, L: GB.LIGHT, l: GB.DARK };
  const pixels = [];
  const height = halfLines.length;
  for (let y = 0; y < height; y++) {
    const row = halfLines[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (colorMap[ch] !== undefined) {
        pixels.push({ x, y, color: colorMap[ch] });
        const mx = fullWidth - 1 - x;
        if (mx !== x) pixels.push({ x: mx, y, color: mirrorMap[ch] });
      }
    }
  }
  return { pixels, width: fullWidth, height };
}

const EGG_SPECIES = ['egg_pyro', 'egg_byte', 'egg_lumi'];
const CREATURE_DB = {};

// ===========================
// EGGS (12x14, full grid)
// ===========================

CREATURE_DB['egg_pyro'] = {
  id: 'egg_pyro', name: 'PYRO EGG', stage: 0, type: TYPES.DRAGON,
  baseStats: { hp: 5, atk: 1, def: 1, spd: 1 },
  evolvesTo: [{ speciesId: 'pyromon', condition: 'hatch' }],
  sprite: spriteFromGrid([
    '....DDDD....',
    '...DllllD...',
    '..DlLLLLlD..',
    '.DlLLddLLlD.',
    '.DLLdLLdLLD.',
    '.DLdLLLLdLD.',
    '.DLLLLLLLLd.',
    '.DLLdLLdLLd.',
    '.DLdLLLLdLd.',
    '.DLLLLLLLLd.',
    '..DLLddLLd..',
    '..DLLLLLLd..',
    '...DLLLLd...',
    '....DDDD....',
  ]),
};

CREATURE_DB['egg_byte'] = {
  id: 'egg_byte', name: 'BYTE EGG', stage: 0, type: TYPES.DATA,
  baseStats: { hp: 5, atk: 1, def: 1, spd: 1 },
  evolvesTo: [{ speciesId: 'bytemon', condition: 'hatch' }],
  sprite: spriteFromGrid([
    '....DDDD....',
    '...DllllD...',
    '..DlLLLLlD..',
    '.DlLDDLLLlD.',
    '.DLDDDDLLLD.',
    '.DLLDDLLLLd.',
    '.DLLLLLLLLd.',
    '.DLLDDLLLLd.',
    '.DLDDDDLLd.',
    '.DLLDDLLLLd.',
    '..DLLLLLLd..',
    '..DLLLLLLd..',
    '...DLLLLd...',
    '....DDDD....',
  ]),
};

CREATURE_DB['egg_lumi'] = {
  id: 'egg_lumi', name: 'LUMI EGG', stage: 0, type: TYPES.VACCINE,
  baseStats: { hp: 5, atk: 1, def: 1, spd: 1 },
  evolvesTo: [{ speciesId: 'lumimon', condition: 'hatch' }],
  sprite: spriteFromGrid([
    '....DDDD....',
    '...DllllD...',
    '..DlLlLLlD..',
    '.DlLLlLLLlD.',
    '.DLLLlLLLLD.',
    '.DLLllllLLd.',
    '.DLLLlLLLLd.',
    '.DLLLLlLLLd.',
    '.DLLLLLlLLd.',
    '.DLLllllLLd.',
    '..DLLlLLLd..',
    '..DLLLlLLd..',
    '...DLLLLd...',
    '....DDDD....',
  ]),
};

// ===========================
// PYRO LINE - Dragon
// ===========================

// PYROMON - Baby (10x10) - Small round flame creature
CREATURE_DB['pyromon'] = {
  id: 'pyromon', name: 'PYROMON', stage: 1, type: TYPES.DRAGON,
  baseStats: { hp: 8, atk: 3, def: 2, spd: 2 },
  evolvesTo: [{ speciesId: 'flamemon', condition: 'default' }],
  sprite: symSprite([
    '....D', // flame tip
    '...DL', // flame base
    '..DlL', // head top
    '.DlLL', // head
    '.DLDL', // eyes
    '.DLLL', // face
    '.DLLL', // body
    '..DLL', // narrow
    '..DLD', // legs
    '..D.D', // feet
  ], 10),
};

// FLAMEMON - Child (14x14) - Young dragon with horns
CREATURE_DB['flamemon'] = {
  id: 'flamemon', name: 'FLAMEMON', stage: 2, type: TYPES.DRAGON,
  baseStats: { hp: 12, atk: 5, def: 3, spd: 3 },
  evolvesTo: [
    { speciesId: 'drakemon', condition: { stat: 'atk', op: '>=', threshold: 'def' } },
    { speciesId: 'shelldramon', condition: 'default' },
  ],
  sprite: symSprite([
    '......D', // horn tip
    '.....DL', // horn
    '....DlL', // head top
    '...DlLL', // head
    '...DLDL', // eyes
    '...DLLL', // face
    '....DLL', // neck
    '...DLLL', // body
    '..DLLLL', // shoulders/wings
    '..DLLLL', // body
    '...DLLL', // taper
    '...DLLD', // legs
    '....D.D', // feet
    '....D.D', // feet base
  ], 14),
};

// DRAKEMON - Adult ATK (18x18) - Fierce winged dragon
CREATURE_DB['drakemon'] = {
  id: 'drakemon', name: 'DRAKEMON', stage: 3, type: TYPES.DRAGON,
  baseStats: { hp: 20, atk: 10, def: 5, spd: 7 },
  evolvesTo: [{ speciesId: 'gigadrakemon', condition: 'default' }],
  sprite: symSprite([
    '........D', // horn
    '.......DL', // horn
    '......DlL', // head top
    '.....DlLL', // head
    '.....DLDL', // eyes
    '.....DLLL', // face
    '.....DLLL', // jaw
    '......DLL', // neck
    '....DLLLL', // shoulders
    '..DLLLLLL', // wings wide
    '.DLLLLLLL', // widest
    '.DLLLLLLL', // wings
    '..DLLLLLL', // taper wings
    '....DLLLL', // body
    '.....DLLL', // narrow
    '.....DLLD', // legs
    '.....D..D', // feet
    '.....D..D', // feet
  ], 18),
};

// SHELLDRAMON - Adult DEF (18x18) - Armored dragon
CREATURE_DB['shelldramon'] = {
  id: 'shelldramon', name: 'SHELLDRAMON', stage: 3, type: TYPES.DRAGON,
  baseStats: { hp: 22, atk: 5, def: 12, spd: 4 },
  evolvesTo: [{ speciesId: 'fortdramon', condition: 'default' }],
  sprite: symSprite([
    '.........', //
    '....DDDDD', // shell top (wide)
    '...DdddDD', // shell detail
    '...DDDDDD', // shell base
    '...DlLLLL', // head
    '...DLDLLL', // eyes
    '...DLLLLL', // face
    '...DDDDDD', // armor collar
    '..DLLLLLL', // body
    '..DLDLDLL', // armor pattern
    '..DLLLLLL', // body
    '..DLDLDLL', // armor pattern
    '..DLLLLLL', // body
    '...DLLLLL', // taper
    '...DDLLLD', // legs armored
    '....DD.DD', // feet boxy
    '....DD.DD', // feet
    '.........', //
  ], 18),
};

// GIGADRAKEMON - Perfect ATK (22x22) - Huge fierce dragon
CREATURE_DB['gigadrakemon'] = {
  id: 'gigadrakemon', name: 'GIGADRAKEMON', stage: 4, type: TYPES.DRAGON,
  baseStats: { hp: 35, atk: 20, def: 10, spd: 14 },
  evolvesTo: [{ speciesId: 'pyrexmon', condition: 'default' }],
  sprite: symSprite([
    '..........D', // horn
    '.........DL', // horn
    '........DlL', // head top
    '.......DlLL', // head
    '.......DLDL', // eyes
    '.......DLLL', // face
    '.......DLLL', // jaw
    '........DLL', // neck
    '......DLLLL', // shoulders
    '...DDDLLLL', // wing arm
    '..DlLDLLLL', // wing body
    '.DlLLDLLLL', // wing wide
    '.DlLLDLLLL', // wing
    '..DLLDLLLL', // wing lower
    '...DDDLLLL', // wing base
    '......DLLL', // body
    '.......DLL', // narrow
    '.......DLD', // legs
    '......DD.D', // claws
    '......D..D', // feet
    '......D..D', // feet
    '...........', //
  ], 22),
};

// FORTDRAMON - Perfect DEF (22x22) - Fortress dragon
CREATURE_DB['fortdramon'] = {
  id: 'fortdramon', name: 'FORTDRAMON', stage: 4, type: TYPES.DRAGON,
  baseStats: { hp: 40, atk: 12, def: 25, spd: 8 },
  evolvesTo: [{ speciesId: 'bastionmon', condition: 'default' }],
  sprite: symSprite([
    '...........', //
    '.....DDDDDD', // shell crown
    '....DddddDD', // shell detail
    '....DDDDDDD', // shell base
    '.....DlLLLL', // head
    '.....DLDLLL', // eyes
    '.....DLLLLL', // face
    '....DDDDDDD', // armor collar
    '...DDLLLLLL', // body wide
    '...DLDLDLLL', // armor pattern
    '...DDLLLLLL', // body
    '...DLDLDLLL', // armor pattern
    '...DDLLLLLL', // body
    '...DLDLDLLL', // armor
    '...DDLLLLLL', // body
    '....DLLLLLL', // taper
    '....DDDLLLD', // legs armored
    '.....DDD.DD', // boxy feet
    '.....DDD.DD', // feet
    '...........', //
    '...........', //
    '...........', //
  ], 22),
};

// PYREXMON - Mega ATK (26x26) - Ultimate dragon
CREATURE_DB['pyrexmon'] = {
  id: 'pyrexmon', name: 'PYREXMON', stage: 5, type: TYPES.DRAGON,
  baseStats: { hp: 60, atk: 40, def: 20, spd: 28 },
  evolvesTo: [],
  sprite: symSprite([
    '............D', // crown horn
    '...........DL', // horn
    '..........DlL', // head top
    '.........DlLL', // head
    '.........DLDL', // eyes
    '.........DLLL', // face
    '.........DLLL', // jaw
    '..........DLL', // neck
    '........DLLLL', // shoulders
    '.....DDDLLLL', // wing arm
    '...DlLLDLLLL', // wing body
    '..DlLLLDLLLL', // wing wide
    '.DlLLLLDLLLL', // wing widest
    '.DlLLLLDLLLL', // wing
    '..DlLLLDLLLL', // wing lower
    '...DLLLDLLLL', // wing taper
    '....DDDLLLLL', // wing base
    '........DLLL', // body
    '.........DLL', // narrow
    '.........DLD', // legs
    '........DD.D', // claws
    '........D..D', // feet
    '........D..D', // feet
    '.............', //
    '.............', //
    '.............', //
  ], 26),
};

// BASTIONMON - Mega DEF (26x26) - Ultimate fortress
CREATURE_DB['bastionmon'] = {
  id: 'bastionmon', name: 'BASTIONMON', stage: 5, type: TYPES.DRAGON,
  baseStats: { hp: 70, atk: 22, def: 45, spd: 15 },
  evolvesTo: [],
  sprite: symSprite([
    '.............', //
    '.......DDDDDD', // crown
    '......DdddddD', // crown detail
    '......DDDDDDD', // crown base
    '.......DlLLLL', // head
    '.......DLDLLL', // eyes
    '.......DLLLLL', // face
    '......DDDDDDD', // armor collar
    '.....DDLLLLLL', // body
    '....DDLDLDLLL', // armor pattern wide
    '....DDLLLLLL', // body
    '....DDLDLDLLL', // armor pattern
    '....DDLLLLLL', // body
    '....DDLDLDLLL', // armor
    '....DDLLLLLL', // body
    '....DDLDLDLLL', // armor
    '....DDLLLLLL', // body
    '.....DLLLLLL', // taper
    '.....DDDDLLD', // legs armored
    '......DDDD.DD', // boxy feet
    '......DDD..DD', // feet
    '.............', //
    '.............', //
    '.............', //
    '.............', //
    '.............', //
  ], 26),
};

// ===========================
// BYTE LINE - Data/Virus/Machine
// ===========================

// BYTEMON - Baby (10x10) - Small digital blob
CREATURE_DB['bytemon'] = {
  id: 'bytemon', name: 'BYTEMON', stage: 1, type: TYPES.DATA,
  baseStats: { hp: 7, atk: 2, def: 2, spd: 3 },
  evolvesTo: [{ speciesId: 'circuitmon', condition: 'default' }],
  sprite: symSprite([
    '..D.D', // antennae
    '..DDD', // connect
    '.DlLL', // head
    '.DLDL', // eyes
    '.DLLL', // face
    '.DDDD', // collar (boxy)
    '..DLL', // body
    '..DLL', // body
    '.DD.D', // boxy legs
    '.DD.D', // feet
  ], 10),
};

// CIRCUITMON - Child (14x14) - Digital humanoid
CREATURE_DB['circuitmon'] = {
  id: 'circuitmon', name: 'CIRCUITMON', stage: 2, type: TYPES.DATA,
  baseStats: { hp: 11, atk: 4, def: 4, spd: 5 },
  evolvesTo: [
    { speciesId: 'hackmon', condition: { stat: 'atk', op: '>=', threshold: 'def' } },
    { speciesId: 'guardmon', condition: 'default' },
  ],
  sprite: symSprite([
    '....D.D', // antennae
    '....DDD', // connect
    '...DDDD', // head top boxy
    '...DlLL', // head
    '...DLDL', // eyes
    '...DLLL', // face
    '...DDDD', // collar
    '....DLL', // body
    '...DLLL', // body wider
    '...DLLL', // body
    '...DDDD', // belt
    '...DLLD', // legs
    '...DD.D', // feet boxy
    '...DD.D', // feet
  ], 14),
};

// HACKMON - Adult Virus ATK (18x18) - Sleek digital predator
CREATURE_DB['hackmon'] = {
  id: 'hackmon', name: 'HACKMON', stage: 3, type: TYPES.VIRUS,
  baseStats: { hp: 18, atk: 11, def: 5, spd: 9 },
  evolvesTo: [{ speciesId: 'viralmon', condition: 'default' }],
  sprite: symSprite([
    '.......DD', // spike
    '......DlL', // spike base
    '.....DlLL', // head top
    '....DlLLL', // head wide
    '....DLDLL', // eyes
    '....DLLLL', // face
    '.....DLLL', // neck
    '....DLLLL', // body
    '..DDDLLLL', // arm spikes
    '.DlLDLLLL', // arms extend
    '.DlLDLLLL', // arms
    '..DDDLLLL', // arms base
    '....DLLLL', // body
    '.....DLLL', // taper
    '.....DLLD', // legs
    '.....D..D', // feet
    '.....D..D', // feet
    '.........', //
  ], 18),
};

// GUARDMON - Adult Machine DEF (18x18) - Bulky robot
CREATURE_DB['guardmon'] = {
  id: 'guardmon', name: 'GUARDMON', stage: 3, type: TYPES.MACHINE,
  baseStats: { hp: 22, atk: 6, def: 12, spd: 5 },
  evolvesTo: [{ speciesId: 'metalguardmon', condition: 'default' }],
  sprite: symSprite([
    '.........', //
    '....DDDDD', // flat head top
    '...DDDDDD', // head wider
    '...DlLLLL', // head
    '...DLDLLL', // eyes
    '...DLLLLL', // face
    '...DDDDDD', // collar
    '..DLLLLLL', // body wide
    '..DLDLDLL', // armor detail
    '..DLLLLLL', // body
    '..DLDLDLL', // armor detail
    '..DLLLLLL', // body
    '..DDDDDDD', // belt
    '..DLLL.LL', // legs
    '..DDDD.DD', // feet boxy
    '..DDDD.DD', // feet
    '.........', //
    '.........', //
  ], 18),
};

// VIRALMON - Perfect Virus (22x22)
CREATURE_DB['viralmon'] = {
  id: 'viralmon', name: 'VIRALMON', stage: 4, type: TYPES.VIRUS,
  baseStats: { hp: 32, atk: 22, def: 10, spd: 18 },
  evolvesTo: [{ speciesId: 'omegavirus', condition: 'default' }],
  sprite: symSprite([
    '.........DD', // spike
    '........DlL', // spike
    '.......DlLL', // head top
    '......DlLLL', // head
    '......DLDLL', // eyes
    '......DLLLL', // face
    '......DLLLL', // jaw
    '.......DLLL', // neck
    '......DLLLL', // body
    '...DDDDLLLL', // arm extend
    '..DlLLDLLLL', // arms
    '.DlLLLDLLLL', // arms wide
    '.DlLLLDLLLL', // arms
    '..DlLLDLLLL', // arms
    '...DDDDLLLL', // arms base
    '......DLLLL', // body
    '.......DLLL', // taper
    '.......DLLD', // legs
    '.......D..D', // feet
    '.......D..D', // feet
    '...........', //
    '...........', //
  ], 22),
};

// METALGUARDMON - Perfect Machine (22x22)
CREATURE_DB['metalguardmon'] = {
  id: 'metalguardmon', name: 'METALGUARDMON', stage: 4, type: TYPES.MACHINE,
  baseStats: { hp: 42, atk: 14, def: 28, spd: 10 },
  evolvesTo: [{ speciesId: 'chromemon', condition: 'default' }],
  sprite: symSprite([
    '...........', //
    '......DDDDD', // head top
    '.....DDDDDD', // head wider
    '.....DDDDDD', // head plate
    '.....DlLLLL', // head
    '.....DLDLLL', // eyes
    '.....DLLLLL', // face
    '....DDDDDDD', // collar
    '...DDLLLLLL', // body
    '...DDLDLDLL', // armor
    '...DDLLLLLL', // body
    '...DDLDLDLL', // armor
    '...DDLLLLLL', // body
    '...DDLDLDLL', // armor
    '...DDLLLLLL', // body
    '...DDDDDDD', // belt
    '...DDLLL.LL', // legs
    '...DDDDD.DD', // feet
    '...DDDDD.DD', // feet
    '...........', //
    '...........', //
    '...........', //
  ], 22),
};

// OMEGAVIRUS - Mega Virus (26x26)
CREATURE_DB['omegavirus'] = {
  id: 'omegavirus', name: 'OMEGAVIRUS', stage: 5, type: TYPES.VIRUS,
  baseStats: { hp: 55, atk: 42, def: 18, spd: 35 },
  evolvesTo: [],
  sprite: symSprite([
    '...........DD', // crown spike
    '..........DlL', // spike
    '.........DlLL', // head top
    '........DlLLL', // head
    '........DLDLL', // eyes
    '........DLLLL', // face
    '........DLLLL', // jaw
    '.........DLLL', // neck
    '........DLLLL', // body
    '.....DDDDLLLL', // arm
    '...DlLLLDLLLL', // arm extend
    '..DlLLLLDLLLL', // arm wide
    '.DlLLLLLDLLLL', // arm widest
    '.DlLLLLLDLLLL', // arm
    '..DlLLLLDLLLL', // arm
    '...DlLLLDLLLL', // arm taper
    '....DDDDDLLLL', // arm base
    '........DLLLL', // body
    '.........DLLL', // taper
    '.........DLLD', // legs
    '.........D..D', // feet
    '.........D..D', // feet
    '.............', //
    '.............', //
    '.............', //
    '.............', //
  ], 26),
};

// CHROMEMON - Mega Machine (26x26)
CREATURE_DB['chromemon'] = {
  id: 'chromemon', name: 'CHROMEMON', stage: 5, type: TYPES.MACHINE,
  baseStats: { hp: 70, atk: 25, def: 48, spd: 18 },
  evolvesTo: [],
  sprite: symSprite([
    '.............', //
    '........DDDDD', // head
    '.......DDDDDD', // head wider
    '.......DDDDDD', // head plate
    '.......DlLLLL', // head
    '.......DLDLLL', // eyes
    '.......DLLLLL', // face
    '......DDDDDDD', // collar
    '.....DDLLLLLL', // body
    '....DDDLDLDLL', // armor wide
    '....DDLLLLLLL', // body
    '....DDDLDLDLL', // armor
    '....DDLLLLLLL', // body
    '....DDDLDLDLL', // armor
    '....DDLLLLLLL', // body
    '....DDDLDLDLL', // armor
    '....DDLLLLLLL', // body
    '....DDDDDDDDD', // belt
    '.....DDLLLL.LL', // legs
    '.....DDDDDD.DD', // feet
    '.....DDDDDD.DD', // feet
    '.............', //
    '.............', //
    '.............', //
    '.............', //
    '.............', //
  ], 26),
};

// ===========================
// LUMI LINE - Vaccine/Holy/Virus
// ===========================

// LUMIMON - Baby (10x10) - Glowing diamond creature
CREATURE_DB['lumimon'] = {
  id: 'lumimon', name: 'LUMIMON', stage: 1, type: TYPES.VACCINE,
  baseStats: { hp: 7, atk: 2, def: 2, spd: 3 },
  evolvesTo: [{ speciesId: 'starmon', condition: 'default' }],
  sprite: symSprite([
    '...Dl', // glow top
    '..DlL', // upper
    '.DlLL', // head
    'DlLLL', // widest
    'DLDLL', // eyes
    'DlLLL', // body
    '.DlLL', // taper
    '..DlL', // narrow
    '...Dl', // bottom glow
    '....D', // point
  ], 10),
};

// STARMON - Child (14x14) - Star-shaped being
CREATURE_DB['starmon'] = {
  id: 'starmon', name: 'STARMON', stage: 2, type: TYPES.VACCINE,
  baseStats: { hp: 10, atk: 4, def: 4, spd: 6 },
  evolvesTo: [
    { speciesId: 'seraphmon', condition: { feedCount: '>=', value: 15 } },
    { speciesId: 'phantomon', condition: 'default' },
  ],
  sprite: symSprite([
    '......D', // top point
    '.....Dl', // glow
    '....DlL', // upper
    '...DlLL', // head
    '..DlLLL', // wider
    '.DlDLLL', // eyes + arms
    'DlLLLLL', // widest (arms out)
    '.DlLLLL', // arms base
    '..DlLLL', // body
    '...DlLL', // taper
    '....DlL', // narrow
    '.....Dl', // bottom
    '......D', // point
    '.......', //
  ], 14),
};

// SERAPHMON - Adult Holy (18x18) - Winged angel
CREATURE_DB['seraphmon'] = {
  id: 'seraphmon', name: 'SERAPHMON', stage: 3, type: TYPES.HOLY,
  baseStats: { hp: 20, atk: 8, def: 8, spd: 8 },
  evolvesTo: [{ speciesId: 'archangmon', condition: 'default' }],
  sprite: symSprite([
    '......DlD', // halo
    '.......DL', // head top
    '......DlL', // head
    '......DLL', // head
    '......DLD', // eyes
    '......DLL', // face
    '.......DL', // neck
    '......DLL', // body
    '...DLLDLL', // wing + body
    '..DlLDLLL', // wing extend
    '.DlLLDLLL', // wing wide
    '.DlLLDLLL', // wing
    '..DlLDLLL', // wing
    '...DDLLLL', // wing base
    '.....DLLL', // body
    '.....DLLD', // legs
    '......D.D', // feet
    '......D.D', // feet
  ], 18),
};

// PHANTOMON - Adult Virus (18x18) - Ghost creature
CREATURE_DB['phantomon'] = {
  id: 'phantomon', name: 'PHANTOMON', stage: 3, type: TYPES.VIRUS,
  baseStats: { hp: 16, atk: 10, def: 6, spd: 10 },
  evolvesTo: [{ speciesId: 'spectremon', condition: 'default' }],
  sprite: symSprite([
    '.........', //
    '......DDD', // head top
    '.....DlLL', // head
    '....DlLLL', // head wider
    '....DLDLL', // eyes
    '....DLLLL', // face
    '.....DLLL', // narrow
    '....DLLLL', // body
    '...DLLLLL', // wider
    '..DLLLLLL', // widest (flowing)
    '..DlLLLLL', // body
    '...DlLLLL', // taper
    '....DlLLL', // flowing
    '.....DlLL', // tail
    '......DlL', // tail thin
    '.......Dl', // tail tip
    '........D', // point
    '.........', //
  ], 18),
};

// ARCHANGMON - Perfect Holy (22x22)
CREATURE_DB['archangmon'] = {
  id: 'archangmon', name: 'ARCHANGMON', stage: 4, type: TYPES.HOLY,
  baseStats: { hp: 38, atk: 18, def: 18, spd: 18 },
  evolvesTo: [{ speciesId: 'divinemon', condition: 'default' }],
  sprite: symSprite([
    '.......DllD', // halo
    '........DLL', // head top
    '.......DlLL', // head
    '.......DLLL', // head
    '.......DLDL', // eyes
    '.......DLLL', // face
    '........DLL', // neck
    '.......DLLL', // body
    '.....DDLLLL', // wing arm
    '...DlLDLLLL', // wing
    '..DlLLDLLLL', // wing wide
    '.DlLLLDLLLL', // wing widest
    '.DlLLLDLLLL', // wing
    '..DlLLDLLLL', // wing
    '...DLLDLLLL', // wing base
    '.....DDLLLL', // body
    '.......DLLL', // taper
    '.......DLLD', // legs
    '........D.D', // feet
    '........D.D', // feet
    '...........', //
    '...........', //
  ], 22),
};

// SPECTREMON - Perfect Virus (22x22)
CREATURE_DB['spectremon'] = {
  id: 'spectremon', name: 'SPECTREMON', stage: 4, type: TYPES.VIRUS,
  baseStats: { hp: 30, atk: 22, def: 12, spd: 22 },
  evolvesTo: [{ speciesId: 'abyssmon', condition: 'default' }],
  sprite: symSprite([
    '...........', //
    '........DDD', // head
    '.......DlLL', // head
    '......DlLLL', // head wider
    '......DLDLL', // eyes
    '......DLLLL', // face
    '.......DLLL', // neck
    '......DLLLL', // body
    '.....DLLLLL', // wider
    '....DLLLLLL', // wide
    '...DlLLLLLL', // widest (flowing)
    '...DlLLLLLL', // body
    '....DlLLLLL', // taper
    '.....DlLLLL', // flowing
    '......DlLLL', // taper
    '.......DlLL', // tail
    '........DlL', // thin
    '.........Dl', // tip
    '..........D', // point
    '...........', //
    '...........', //
    '...........', //
  ], 22),
};

// DIVINEMON - Mega Holy (26x26)
CREATURE_DB['divinemon'] = {
  id: 'divinemon', name: 'DIVINEMON', stage: 5, type: TYPES.HOLY,
  baseStats: { hp: 65, atk: 35, def: 35, spd: 35 },
  evolvesTo: [],
  sprite: symSprite([
    '........DlllD', // halo wide
    '.........DlLD', // halo
    '..........DLL', // head top
    '.........DlLL', // head
    '.........DLLL', // head
    '.........DLDL', // eyes
    '.........DLLL', // face
    '..........DLL', // neck
    '.........DLLL', // body
    '......DDDLLLL', // wing arm
    '....DlLLDLLLL', // wing
    '..DlLLLLDLLLL', // wing wide
    '.DlLLLLLDLLLL', // wing widest
    '.DlLLLLLDLLLL', // wing
    '..DlLLLLDLLLL', // wing
    '...DlLLLDLLLL', // wing taper
    '....DLLLDDLLL', // wing base
    '......DDDLLLL', // body
    '.........DLLL', // taper
    '.........DLLD', // legs
    '..........D.D', // feet
    '..........D.D', // feet
    '.............', //
    '.............', //
    '.............', //
    '.............', //
  ], 26),
};

// ABYSSMON - Mega Virus (26x26)
CREATURE_DB['abyssmon'] = {
  id: 'abyssmon', name: 'ABYSSMON', stage: 5, type: TYPES.VIRUS,
  baseStats: { hp: 50, atk: 42, def: 22, spd: 40 },
  evolvesTo: [],
  sprite: symSprite([
    '.............', //
    '..........DDD', // head
    '.........DlLL', // head
    '........DlLLL', // head wider
    '........DLDLL', // eyes
    '........DLLLL', // face
    '.........DLLL', // neck
    '........DLLLL', // body
    '.......DLLLLL', // wider
    '......DLLLLLL', // wide
    '.....DlLLLLLL', // wider
    '...DlLLLLLLLL', // widest (flowing cloak)
    '...DlLLLLLLLL', // body
    '....DlLLLLLLL', // taper
    '.....DlLLLLLL', // flowing
    '......DlLLLLL', // taper
    '.......DlLLLL', // tail
    '........DlLLL', // thin
    '.........DlLL', // thinner
    '..........DlL', // tip
    '...........Dl', // point
    '............D', // point
    '.............', //
    '.............', //
    '.............', //
    '.............', //
  ], 26),
};

// ===========================
// EVOLUTION RESOLVER
// ===========================

function resolveEvolution(speciesId, gameState) {
  const species = CREATURE_DB[speciesId];
  if (!species || !species.evolvesTo || species.evolvesTo.length === 0) return null;

  for (const branch of species.evolvesTo) {
    const cond = branch.condition;

    if (cond === 'hatch' || cond === 'default') {
      return branch.speciesId;
    }

    if (typeof cond === 'object') {
      if (cond.stat && cond.op && cond.threshold) {
        const statVal = gameState.stats[cond.stat] || 0;
        const threshVal = typeof cond.threshold === 'string'
          ? (gameState.stats[cond.threshold] || 0)
          : cond.threshold;
        if (cond.op === '>=' && statVal >= threshVal) return branch.speciesId;
        if (cond.op === '>' && statVal > threshVal) return branch.speciesId;
        if (cond.op === '<=' && statVal <= threshVal) return branch.speciesId;
        if (cond.op === '<' && statVal < threshVal) return branch.speciesId;
      }

      if (cond.feedCount !== undefined) {
        const fc = gameState.feedCount || 0;
        if (cond.feedCount === '>=' && fc >= cond.value) return branch.speciesId;
        if (cond.feedCount === '>' && fc > cond.value) return branch.speciesId;
      }

      if (cond.trainCount !== undefined) {
        const tc = gameState.trainCount || 0;
        if (cond.trainCount === '>=' && tc >= cond.value) return branch.speciesId;
        if (cond.trainCount === '>' && tc > cond.value) return branch.speciesId;
      }
    }
  }

  return null;
}
