// ============================================================
// TAMAMON - Digital Monster Idle Game
// A Digivice-style idle game with Game Boy aesthetics
// ============================================================

// === CONSTANTS (GB, GB_CSS defined in creatures.js) ===

const SCREEN_SIZE = 304;
const PIXEL_SCALE = 4;
const LOGICAL_SIZE = Math.floor(SCREEN_SIZE / PIXEL_SCALE);

const EVO_STAGES = [
  { name: 'EGG',       clicksToHatch: 50,  spriteSize: 12, growthNeeded: 0 },
  { name: 'BABY',      clicksToHatch: 0,   spriteSize: 10, growthNeeded: 100 },
  { name: 'CHILD',     clicksToHatch: 0,   spriteSize: 14, growthNeeded: 500 },
  { name: 'ADULT',     clicksToHatch: 0,   spriteSize: 18, growthNeeded: 2500 },
  { name: 'PERFECT',   clicksToHatch: 0,   spriteSize: 22, growthNeeded: 15000 },
  { name: 'MEGA',      clicksToHatch: 0,   spriteSize: 26, growthNeeded: 100000 },
];

const UPGRADES = [
  {
    id: 'autoClicker',
    name: 'AUTO TAP',
    desc: 'Taps per second',
    baseCost: 15,
    costMult: 1.4,
    maxLevel: 50,
    effect: (lvl) => lvl * 0.5,
  },
  {
    id: 'clickPower',
    name: 'TAP POWER',
    desc: 'Data per tap',
    baseCost: 10,
    costMult: 1.35,
    maxLevel: 100,
    effect: (lvl) => 1 + lvl * 0.5,
  },
  {
    id: 'passiveIncome',
    name: 'DATA LINK',
    desc: 'Passive data/sec',
    baseCost: 50,
    costMult: 1.5,
    maxLevel: 50,
    effect: (lvl) => lvl * 0.3,
  },
  {
    id: 'trainBoost',
    name: 'TRAINING+',
    desc: 'Training efficiency',
    baseCost: 30,
    costMult: 1.45,
    maxLevel: 30,
    effect: (lvl) => 1 + lvl * 0.25,
  },
  {
    id: 'feedBoost',
    name: 'NUTRITION+',
    desc: 'Feed efficiency',
    baseCost: 25,
    costMult: 1.45,
    maxLevel: 30,
    effect: (lvl) => 1 + lvl * 0.25,
  },
];

// === SEEDED RNG ===
class SeededRNG {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextBool(prob = 0.5) {
    return this.next() < prob;
  }
}

// === NUMBER FORMATTING ===
function formatNumber(n) {
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1e6) return (n / 1e3).toFixed(1) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(1) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(1) + 'B';
  return (n / 1e12).toFixed(1) + 'T';
}

// === CREATURE PIXEL ART GENERATOR ===
class CreatureGenerator {

  static generateEgg(seed) {
    const rng = new SeededRNG(seed);
    const w = 12, h = 14;
    const pixels = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cx = (x - w / 2 + 0.5) / (w / 2);
        const cy = (y - h / 2 + 0.5) / (h / 2);
        const ellipse = (cx * cx) / 0.7 + (cy * cy) / 1.0;

        if (ellipse <= 1.0) {
          let color;
          // Outline
          if (ellipse > 0.82) {
            color = GB.DARKEST;
          } else {
            // Pattern based on seed
            const pattern = rng.nextInt(0, 3);
            let isPattern = false;

            if (pattern === 0) {
              isPattern = (y % 3 === 0) && rng.nextBool(0.6);
            } else if (pattern === 1) {
              isPattern = ((x + y) % 4 < 2) && rng.nextBool(0.5);
            } else if (pattern === 2) {
              isPattern = (Math.abs(cx) < 0.3 && y % 2 === 0);
            } else {
              isPattern = rng.nextBool(0.25);
            }

            if (isPattern) {
              color = GB.DARK;
            } else if (cx < -0.2 && cy < -0.1) {
              color = GB.LIGHTEST;
            } else {
              color = GB.LIGHT;
            }
          }
          pixels.push({ x, y, color });
        }
      }
    }

    return { pixels, width: w, height: h };
  }

  static generateCreature(seed, stage) {
    if (stage === 0) return this.generateEgg(seed);

    const rng = new SeededRNG(seed * 1000 + stage * 777);
    const size = EVO_STAGES[stage].spriteSize;
    const halfW = Math.ceil(size / 2);

    // Body type influences shape
    const bodyType = new SeededRNG(seed).nextInt(0, 4);

    // Generate half grid
    const grid = Array.from({ length: size }, () => Array(halfW).fill(0));

    // Fill body shape
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < halfW; x++) {
        const ny = y / (size - 1);
        const nx = x / (halfW - 1);
        let fill = false;

        switch (bodyType) {
          case 0: { // Round blob
            const dist = Math.sqrt(nx * nx * 0.8 + Math.pow(ny - 0.5, 2) * 1.0);
            fill = dist < 0.52 + rng.next() * 0.12;
            break;
          }
          case 1: { // Tall biped
            if (ny < 0.35) {
              fill = nx < 0.45 && ny > 0.05 + rng.next() * 0.05;
            } else if (ny < 0.65) {
              fill = nx < 0.55 + rng.next() * 0.15;
            } else if (ny < 0.85) {
              fill = nx < 0.35 + rng.next() * 0.1;
            } else {
              fill = nx < 0.3 + rng.next() * 0.15;
            }
            break;
          }
          case 2: { // Wide beast
            if (ny < 0.25) {
              fill = nx < 0.35 + rng.next() * 0.1;
            } else if (ny < 0.7) {
              fill = nx < 0.65 + rng.next() * 0.2;
            } else {
              fill = nx < 0.45 + rng.next() * 0.15 && rng.nextBool(0.8);
            }
            break;
          }
          case 3: { // Avian
            if (ny < 0.3) {
              fill = nx < 0.3 + rng.next() * 0.1;
            } else if (ny < 0.5) {
              fill = nx < 0.7 + rng.next() * 0.2;
            } else if (ny < 0.75) {
              fill = nx < 0.4 + rng.next() * 0.1;
            } else {
              fill = nx < 0.25;
            }
            break;
          }
          case 4: { // Serpent / dragon
            const wave = Math.sin(ny * Math.PI * 2) * 0.15;
            const bodyWidth = 0.35 + wave + rng.next() * 0.1;
            if (ny < 0.25) {
              fill = nx < 0.4 + rng.next() * 0.1;
            } else if (ny > 0.85) {
              fill = nx < 0.2 + rng.next() * 0.1;
            } else {
              fill = nx < bodyWidth;
            }
            break;
          }
        }

        grid[y][x] = fill ? 1 : 0;
      }
    }

    // Cellular automata smoothing
    for (let pass = 0; pass < 2; pass++) {
      const newGrid = grid.map(row => [...row]);
      for (let y = 1; y < size - 1; y++) {
        for (let x = 0; x < halfW; x++) {
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dy === 0 && dx === 0) continue;
              const nx = x + dx;
              const ny2 = y + dy;
              if (nx >= 0 && nx < halfW && ny2 >= 0 && ny2 < size) {
                neighbors += grid[ny2][nx];
              }
            }
          }
          if (grid[y][x]) {
            newGrid[y][x] = neighbors >= 2 ? 1 : 0;
          } else {
            newGrid[y][x] = neighbors >= 5 ? 1 : 0;
          }
        }
      }
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < halfW; x++) {
          grid[y][x] = newGrid[y][x];
        }
      }
    }

    // Add features based on evolution stage
    const features = this._addFeatures(grid, size, halfW, stage, rng, bodyType);

    // Convert to full-width mirrored pixel array with shading
    const pixels = [];
    const fullW = size;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < halfW; x++) {
        if (grid[y][x]) {
          // Left side pixel
          const color = this._getPixelColor(grid, y, x, size, halfW, false);
          pixels.push({ x, y, color });

          // Mirror to right side
          const mirrorX = fullW - 1 - x;
          if (mirrorX !== x) {
            const mirrorColor = this._getPixelColor(grid, y, x, size, halfW, true);
            pixels.push({ x: mirrorX, y, color: mirrorColor });
          }
        }
      }
    }

    // Add eyes
    this._addEyes(pixels, grid, size, halfW, stage, rng);

    return { pixels, width: fullW, height: size, bodyType, features };
  }

  static _addFeatures(grid, size, halfW, stage, rng, bodyType) {
    const features = [];

    // Higher stages get more features
    if (stage >= 2) {
      // Ears / Horns
      if (rng.nextBool(0.7)) {
        const hornLen = rng.nextInt(1, Math.min(3, stage));
        for (let i = 0; i < hornLen; i++) {
          const hx = rng.nextInt(1, Math.min(halfW - 2, 3));
          const hy = -1 - i;
          // Find topmost filled cell in this column
          let topY = -1;
          for (let y = 0; y < size; y++) {
            if (hx < halfW && grid[y][hx]) { topY = y; break; }
          }
          if (topY > 0 && topY + hy >= 0) {
            grid[topY + hy] = grid[topY + hy] || Array(halfW).fill(0);
            if (topY + hy >= 0 && topY + hy < size) {
              grid[topY + hy][hx] = 1;
            }
          }
        }
        features.push('horns');
      }
    }

    if (stage >= 3) {
      // Tail or spikes
      if (rng.nextBool(0.6)) {
        const tailLen = rng.nextInt(1, stage - 1);
        for (let i = 0; i < tailLen; i++) {
          let bottomY = -1;
          for (let y = size - 1; y >= 0; y--) {
            if (grid[y][halfW - 1]) { bottomY = y; break; }
          }
          if (bottomY > 0) {
            const ty = bottomY - i;
            if (ty >= 0 && ty < size && halfW - 1 >= 0) {
              grid[ty][Math.min(halfW - 1, halfW - 1)] = 1;
            }
          }
        }
        features.push('tail');
      }
    }

    if (stage >= 4) {
      // Wings
      if (bodyType !== 4 && rng.nextBool(0.5)) {
        const wingSize = rng.nextInt(2, 4);
        let midY = Math.floor(size * 0.35);
        for (let i = 0; i < wingSize; i++) {
          const wy = midY - i;
          if (wy >= 0 && wy < size) {
            grid[wy][Math.min(halfW - 1, halfW - 1)] = 1;
          }
        }
        features.push('wings');
      }
    }

    return features;
  }

  static _getPixelColor(grid, y, x, size, halfW, mirrored = false) {
    // Check if this is an edge pixel (outline)
    const isEdge = (
      y === 0 || y === size - 1 ||
      x === 0 || x === halfW - 1 ||
      (y > 0 && !grid[y - 1][x]) ||
      (y < size - 1 && !grid[y + 1][x]) ||
      (x > 0 && !grid[y][x - 1]) ||
      (x < halfW - 1 && !grid[y][x + 1])
    );

    if (isEdge) return GB.DARKEST;

    // Highlight (top-left area)
    if (!mirrored && y < size * 0.4 && x < halfW * 0.5) return GB.LIGHTEST;
    if (mirrored && y < size * 0.4 && x > halfW * 0.5) return GB.LIGHTEST;

    // Shadow (bottom-right area)
    if (mirrored && y > size * 0.6) return GB.DARK;
    if (!mirrored && y > size * 0.6 && x > halfW * 0.5) return GB.DARK;

    return GB.LIGHT;
  }

  static _addEyes(pixels, grid, size, halfW, stage, rng) {
    // Find a good Y position for eyes (upper-middle area of body)
    let eyeY = -1;
    const targetY = Math.floor(size * 0.3);

    for (let dy = 0; dy < size / 2; dy++) {
      const checkY = targetY + (dy % 2 === 0 ? dy / 2 : -Math.ceil(dy / 2));
      if (checkY >= 0 && checkY < size) {
        let filled = 0;
        for (let x = 0; x < halfW; x++) {
          if (grid[checkY][x]) filled++;
        }
        if (filled >= 2) {
          eyeY = checkY;
          break;
        }
      }
    }

    if (eyeY < 0) return;

    // Eye X position
    const eyeX = Math.max(1, Math.floor(halfW * 0.35));
    const fullW = size;
    const mirrorEyeX = fullW - 1 - eyeX;

    // Eye style based on stage
    if (stage <= 1) {
      // Simple dot eyes
      pixels.push({ x: eyeX, y: eyeY, color: GB.DARKEST });
      pixels.push({ x: mirrorEyeX, y: eyeY, color: GB.DARKEST });
    } else {
      // Bigger eyes with highlight
      pixels.push({ x: eyeX, y: eyeY, color: GB.DARKEST });
      pixels.push({ x: mirrorEyeX, y: eyeY, color: GB.DARKEST });
      if (eyeY + 1 < size) {
        pixels.push({ x: eyeX, y: eyeY + 1, color: GB.DARKEST });
        pixels.push({ x: mirrorEyeX, y: eyeY + 1, color: GB.DARKEST });
      }
      // Eye highlight
      pixels.push({ x: eyeX, y: eyeY, color: GB.LIGHTEST });
    }

    // Mouth for higher stages
    if (stage >= 2) {
      const mouthY = eyeY + Math.max(2, Math.floor(size * 0.15));
      if (mouthY < size) {
        const mouthW = rng.nextInt(1, 3);
        const mouthStartX = Math.floor(fullW / 2) - Math.floor(mouthW / 2);
        for (let mx = 0; mx < mouthW; mx++) {
          pixels.push({ x: mouthStartX + mx, y: mouthY, color: GB.DARKEST });
        }
      }
    }
  }

  static renderToTexture(creatureData, scale = PIXEL_SCALE) {
    const canvas = document.createElement('canvas');
    canvas.width = creatureData.width * scale;
    canvas.height = creatureData.height * scale;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    for (const p of creatureData.pixels) {
      const hex = p.color.toString(16).padStart(6, '0');
      ctx.fillStyle = '#' + hex;
      ctx.fillRect(p.x * scale, p.y * scale, scale, scale);
    }

    return PIXI.Texture.from(canvas);
  }
}

// === GAME STATE ===
class GameState {
  constructor() {
    this.speciesId = '';
    this.evoStage = 0;
    this.dataBits = 0;
    this.totalDataEarned = 0;
    this.growthPoints = 0;
    this.hatchProgress = 0;
    this.stats = { hp: 5, atk: 1, def: 1, spd: 1 };
    this.feedCount = 0;
    this.trainCount = 0;
    this.upgrades = {};
    for (const u of UPGRADES) {
      this.upgrades[u.id] = 0;
    }
    this.totalClicks = 0;
    this.lastSaveTime = Date.now();
    this.creationTime = Date.now();
    this.creaturesHatched = 0;
  }

  newEgg() {
    const eggs = EGG_SPECIES;
    this.speciesId = eggs[Math.floor(Math.random() * eggs.length)];
    this.evoStage = 0;
    this.hatchProgress = 0;
    this.growthPoints = 0;
    this.feedCount = 0;
    this.trainCount = 0;
    const base = CREATURE_DB[this.speciesId].baseStats;
    this.stats = { ...base };
  }

  getClickPower() {
    const upg = UPGRADES.find(u => u.id === 'clickPower');
    return upg.effect(this.upgrades.clickPower);
  }

  getAutoClickRate() {
    const upg = UPGRADES.find(u => u.id === 'autoClicker');
    return upg.effect(this.upgrades.autoClicker);
  }

  getPassiveIncome() {
    const upg = UPGRADES.find(u => u.id === 'passiveIncome');
    const base = upg.effect(this.upgrades.passiveIncome);
    const statBonus = (this.stats.hp + this.stats.atk + this.stats.def + this.stats.spd) * 0.02;
    return base + statBonus;
  }

  getTrainBoost() {
    const upg = UPGRADES.find(u => u.id === 'trainBoost');
    return upg.effect(this.upgrades.trainBoost);
  }

  getFeedBoost() {
    const upg = UPGRADES.find(u => u.id === 'feedBoost');
    return upg.effect(this.upgrades.feedBoost);
  }

  getUpgradeCost(upgradeId) {
    const upg = UPGRADES.find(u => u.id === upgradeId);
    return Math.floor(upg.baseCost * Math.pow(upg.costMult, this.upgrades[upgradeId]));
  }

  getFeedCost() {
    return Math.floor(8 * Math.pow(1.08, this.stats.hp));
  }

  getTrainCost() {
    const totalStats = this.stats.atk + this.stats.def + this.stats.spd;
    return Math.floor(12 * Math.pow(1.06, totalStats));
  }

  click() {
    if (this.evoStage === 0) {
      this.hatchProgress++;
      this.totalClicks++;
      if (this.hatchProgress >= EVO_STAGES[0].clicksToHatch) {
        this.hatch();
        return 'hatch';
      }
      return 'egg_click';
    }

    const data = this.getClickPower();
    this.dataBits += data;
    this.totalDataEarned += data;
    this.totalClicks++;
    return 'click';
  }

  hatch() {
    const nextId = resolveEvolution(this.speciesId, this);
    if (nextId && CREATURE_DB[nextId]) {
      this.speciesId = nextId;
      this.evoStage = CREATURE_DB[nextId].stage;
      const base = CREATURE_DB[nextId].baseStats;
      this.stats = { ...base };
    } else {
      this.evoStage = 1;
    }
    this.creaturesHatched++;
    this.growthPoints = 0;
    this.feedCount = 0;
    this.trainCount = 0;
  }

  feed() {
    const cost = this.getFeedCost();
    if (this.dataBits < cost || this.evoStage < 1) return false;

    this.dataBits -= cost;
    const boost = this.getFeedBoost();
    const hpGain = Math.floor((1 + Math.random() * 2) * boost);
    this.stats.hp += hpGain;
    this.growthPoints += Math.floor(3 * boost);
    this.feedCount++;
    return { hpGain };
  }

  train() {
    const cost = this.getTrainCost();
    if (this.dataBits < cost || this.evoStage < 1) return false;

    this.dataBits -= cost;
    const boost = this.getTrainBoost();

    const statChoice = Math.random();
    let result = {};
    if (statChoice < 0.33) {
      const gain = Math.floor((1 + Math.random()) * boost);
      this.stats.atk += gain;
      result = { atk: gain };
    } else if (statChoice < 0.66) {
      const gain = Math.floor((1 + Math.random()) * boost);
      this.stats.def += gain;
      result = { def: gain };
    } else {
      const gain = Math.floor((1 + Math.random()) * boost);
      this.stats.spd += gain;
      result = { spd: gain };
    }

    this.growthPoints += Math.floor(5 * boost);
    this.trainCount++;
    return result;
  }

  checkEvolution() {
    const species = CREATURE_DB[this.speciesId];
    if (!species || !species.evolvesTo || species.evolvesTo.length === 0) return false;
    if (this.evoStage < 1 || this.evoStage >= EVO_STAGES.length - 1) return false;

    const needed = EVO_STAGES[this.evoStage].growthNeeded;
    if (this.growthPoints >= needed) {
      const nextId = resolveEvolution(this.speciesId, this);
      if (nextId && CREATURE_DB[nextId]) {
        this.speciesId = nextId;
        this.evoStage = CREATURE_DB[nextId].stage;
        this.growthPoints = 0;
        this.feedCount = 0;
        this.trainCount = 0;
        // Stat boost on evolution
        this.stats.hp = Math.floor(this.stats.hp * 1.3);
        this.stats.atk = Math.floor(this.stats.atk * 1.3);
        this.stats.def = Math.floor(this.stats.def * 1.3);
        this.stats.spd = Math.floor(this.stats.spd * 1.3);
        return true;
      }
    }
    return false;
  }

  buyUpgrade(upgradeId) {
    const upg = UPGRADES.find(u => u.id === upgradeId);
    if (!upg) return false;
    if (this.upgrades[upgradeId] >= upg.maxLevel) return false;

    const cost = this.getUpgradeCost(upgradeId);
    if (this.dataBits < cost) return false;

    this.dataBits -= cost;
    this.upgrades[upgradeId]++;
    return true;
  }

  update(dt) {
    if (this.evoStage < 1) return;

    // Auto clicker
    const autoRate = this.getAutoClickRate();
    if (autoRate > 0) {
      const autoData = autoRate * this.getClickPower() * dt;
      this.dataBits += autoData;
      this.totalDataEarned += autoData;
    }

    // Passive income
    const passive = this.getPassiveIncome();
    if (passive > 0) {
      this.dataBits += passive * dt;
      this.totalDataEarned += passive * dt;
    }
  }

  save() {
    this.lastSaveTime = Date.now();
    const data = {
      version: 2,
      speciesId: this.speciesId,
      evoStage: this.evoStage,
      dataBits: this.dataBits,
      totalDataEarned: this.totalDataEarned,
      growthPoints: this.growthPoints,
      hatchProgress: this.hatchProgress,
      stats: { ...this.stats },
      feedCount: this.feedCount,
      trainCount: this.trainCount,
      upgrades: { ...this.upgrades },
      totalClicks: this.totalClicks,
      lastSaveTime: this.lastSaveTime,
      creationTime: this.creationTime,
      creaturesHatched: this.creaturesHatched,
    };
    localStorage.setItem('tamamon_save', JSON.stringify(data));
  }

  load() {
    const raw = localStorage.getItem('tamamon_save');
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);

      // Migration: old save (no version or version 1) → start fresh with new egg
      if (!data.version || data.version < 2 || !data.speciesId) {
        this.newEgg();
        // Preserve upgrades and currency from old save
        this.dataBits = data.dataBits || 0;
        this.totalDataEarned = data.totalDataEarned || 0;
        this.totalClicks = data.totalClicks || 0;
        this.creationTime = data.creationTime || Date.now();
        this.creaturesHatched = data.creaturesHatched || 0;
        for (const u of UPGRADES) {
          this.upgrades[u.id] = (data.upgrades && data.upgrades[u.id]) || 0;
        }
        return true;
      }

      this.speciesId = data.speciesId;
      this.evoStage = data.evoStage || 0;
      this.dataBits = data.dataBits || 0;
      this.totalDataEarned = data.totalDataEarned || 0;
      this.growthPoints = data.growthPoints || 0;
      this.hatchProgress = data.hatchProgress || 0;
      this.stats = data.stats || { hp: 5, atk: 1, def: 1, spd: 1 };
      this.feedCount = data.feedCount || 0;
      this.trainCount = data.trainCount || 0;
      this.totalClicks = data.totalClicks || 0;
      this.lastSaveTime = data.lastSaveTime || Date.now();
      this.creationTime = data.creationTime || Date.now();
      this.creaturesHatched = data.creaturesHatched || 0;

      for (const u of UPGRADES) {
        this.upgrades[u.id] = (data.upgrades && data.upgrades[u.id]) || 0;
      }

      // Validate speciesId exists in DB
      if (!CREATURE_DB[this.speciesId]) {
        this.newEgg();
        return true;
      }

      // Calculate offline progress
      const now = Date.now();
      const offlineSeconds = (now - this.lastSaveTime) / 1000;
      if (offlineSeconds > 5 && this.evoStage >= 1) {
        const offlineRate = (this.getAutoClickRate() * this.getClickPower() + this.getPassiveIncome()) * 0.5;
        const offlineEarnings = offlineRate * Math.min(offlineSeconds, 3600 * 8);
        if (offlineEarnings > 0) {
          this.dataBits += offlineEarnings;
          this.totalDataEarned += offlineEarnings;
          return { offlineEarnings, offlineSeconds };
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to load save:', e);
      return false;
    }
  }
}

// === PARTICLE SYSTEM ===
class Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy -= 30 * dt;
    this.life -= dt;
    return this.life > 0;
  }
}

// === MAIN GAME ===
class TamamonGame {
  constructor() {
    this.state = new GameState();
    this.app = null;
    this.creatureSprite = null;
    this.creatureContainer = null;
    this.particles = [];
    this.particleGraphics = null;
    this.bgGraphics = null;
    this.uiTexts = {};
    this.animTime = 0;
    this.evolving = false;
    this.evolveFlashTime = 0;
    this.flashOverlay = null;
    this.crackSprites = [];

    this.init();
  }

  async init() {
    // Init PixiJS
    this.app = new PIXI.Application({
      width: SCREEN_SIZE,
      height: SCREEN_SIZE,
      backgroundColor: GB.LIGHTEST,
      antialias: false,
      resolution: 1,
    });

    const container = document.getElementById('game-container');
    container.appendChild(this.app.view);
    this.app.view.style.width = SCREEN_SIZE + 'px';
    this.app.view.style.height = SCREEN_SIZE + 'px';

    // Background pattern (dot grid like LCD)
    this.bgGraphics = new PIXI.Graphics();
    this.app.stage.addChild(this.bgGraphics);
    this._drawBackground();

    // Creature container
    this.creatureContainer = new PIXI.Container();
    this.creatureContainer.x = SCREEN_SIZE / 2;
    this.creatureContainer.y = SCREEN_SIZE / 2 + 10;
    this.app.stage.addChild(this.creatureContainer);

    // Make creature clickable
    this.creatureContainer.eventMode = 'static';
    this.creatureContainer.cursor = 'pointer';
    this.creatureContainer.on('pointerdown', (e) => this._onCreatureClick(e));

    // Particle graphics
    this.particleGraphics = new PIXI.Graphics();
    this.app.stage.addChild(this.particleGraphics);

    // UI Text elements
    this._createUITexts();

    // Flash overlay for evolution
    this.flashOverlay = new PIXI.Graphics();
    this.flashOverlay.beginFill(GB.LIGHTEST);
    this.flashOverlay.drawRect(0, 0, SCREEN_SIZE, SCREEN_SIZE);
    this.flashOverlay.endFill();
    this.flashOverlay.alpha = 0;
    this.app.stage.addChild(this.flashOverlay);

    // Load save or start new
    const loadResult = this.state.load();
    if (!loadResult || !this.state.speciesId) {
      this.state.newEgg();
    } else if (typeof loadResult === 'object' && loadResult.offlineEarnings) {
      this._showToast(`Welcome back! +${formatNumber(loadResult.offlineEarnings)} DATA`);
    }

    this._updateCreatureSprite();
    this._setupButtons();

    // Game loop
    this.app.ticker.add((delta) => this._gameLoop(delta));

    // Auto save every 30 seconds
    setInterval(() => this.state.save(), 30000);

    // Save on page close
    window.addEventListener('beforeunload', () => this.state.save());
  }

  _drawBackground() {
    this.bgGraphics.clear();
    this.bgGraphics.beginFill(GB.LIGHTEST);
    this.bgGraphics.drawRect(0, 0, SCREEN_SIZE, SCREEN_SIZE);
    this.bgGraphics.endFill();

    // LCD dot pattern
    this.bgGraphics.lineStyle(0);
    for (let y = 0; y < SCREEN_SIZE; y += 8) {
      for (let x = 0; x < SCREEN_SIZE; x += 8) {
        this.bgGraphics.beginFill(GB.LIGHT, 0.15);
        this.bgGraphics.drawRect(x, y, 1, 1);
        this.bgGraphics.endFill();
      }
    }

    // Border frame
    this.bgGraphics.lineStyle(2, GB.DARK, 1);
    this.bgGraphics.drawRect(1, 1, SCREEN_SIZE - 2, SCREEN_SIZE - 2);
  }

  _createUITexts() {
    const textStyle = new PIXI.TextStyle({
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 10,
      fill: GB_CSS.DARKEST,
    });

    const smallStyle = new PIXI.TextStyle({
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 8,
      fill: GB_CSS.DARK,
    });

    // Data counter at top
    this.uiTexts.data = new PIXI.Text('DATA: 0', textStyle);
    this.uiTexts.data.x = 8;
    this.uiTexts.data.y = 8;
    this.app.stage.addChild(this.uiTexts.data);

    // Stage name
    this.uiTexts.stage = new PIXI.Text('EGG', smallStyle);
    this.uiTexts.stage.anchor.set(1, 0);
    this.uiTexts.stage.x = SCREEN_SIZE - 8;
    this.uiTexts.stage.y = 8;
    this.app.stage.addChild(this.uiTexts.stage);

    // Hatch / Growth progress bar label
    this.uiTexts.progress = new PIXI.Text('', smallStyle);
    this.uiTexts.progress.anchor.set(0.5, 0);
    this.uiTexts.progress.x = SCREEN_SIZE / 2;
    this.uiTexts.progress.y = SCREEN_SIZE - 48;
    this.app.stage.addChild(this.uiTexts.progress);

    // DPS display
    this.uiTexts.dps = new PIXI.Text('', new PIXI.TextStyle({
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 7,
      fill: GB_CSS.DARK,
    }));
    this.uiTexts.dps.x = 8;
    this.uiTexts.dps.y = 22;
    this.app.stage.addChild(this.uiTexts.dps);

    // Hint text
    this.uiTexts.hint = new PIXI.Text('TAP THE EGG!', new PIXI.TextStyle({
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 8,
      fill: GB_CSS.DARK,
    }));
    this.uiTexts.hint.anchor.set(0.5, 0);
    this.uiTexts.hint.x = SCREEN_SIZE / 2;
    this.uiTexts.hint.y = SCREEN_SIZE - 28;
    this.app.stage.addChild(this.uiTexts.hint);

    // Progress bar (graphics)
    this.progressBar = new PIXI.Graphics();
    this.progressBar.x = 40;
    this.progressBar.y = SCREEN_SIZE - 56;
    this.app.stage.addChild(this.progressBar);
  }

  _updateCreatureSprite() {
    // Clear old sprite
    this.creatureContainer.removeChildren();

    const species = CREATURE_DB[this.state.speciesId];
    const data = species ? species.sprite : CreatureGenerator.generateEgg(1);
    const texture = CreatureGenerator.renderToTexture(data, PIXEL_SCALE);
    this.creatureSprite = new PIXI.Sprite(texture);
    this.creatureSprite.anchor.set(0.5, 0.5);

    // Scale based on evo stage
    const baseScale = 1.0;
    this.creatureSprite.scale.set(baseScale);

    this.creatureContainer.addChild(this.creatureSprite);

    // Add interaction hitarea
    const bounds = this.creatureSprite.getBounds();
    const padding = 20;
    this.creatureContainer.hitArea = new PIXI.Rectangle(
      -bounds.width / 2 - padding,
      -bounds.height / 2 - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2
    );
  }

  _setupButtons() {
    document.getElementById('btn-a').addEventListener('click', () => this._onFeed());
    document.getElementById('btn-b').addEventListener('click', () => this._onTrain());
    document.getElementById('btn-c').addEventListener('click', () => this._toggleUpgradePanel());
    document.getElementById('close-upgrades').addEventListener('click', () => this._toggleUpgradePanel(false));
  }

  _onCreatureClick(event) {
    if (this.evolving) return;

    const result = this.state.click();

    if (result === 'egg_click') {
      // Egg wobble effect
      this._eggWobble();
      this._spawnClickParticles(event.global.x, event.global.y, 3);

      // Add cracks as progress increases
      const prog = this.state.hatchProgress / EVO_STAGES[0].clicksToHatch;
      if (prog > 0.3 && prog < 0.99) {
        this._spawnClickParticles(event.global.x, event.global.y, 2);
      }
    } else if (result === 'hatch') {
      this._playEvolutionAnimation();
    } else if (result === 'click') {
      this._spawnClickParticles(event.global.x, event.global.y, 5);
      this._creatureBounce();

      // Floating text
      const power = this.state.getClickPower();
      this._spawnFloatingText(event.global.x, event.global.y - 20, '+' + formatNumber(power));
    }
  }

  _onFeed() {
    if (this.state.evoStage < 1) return;

    const result = this.state.feed();
    if (result) {
      this._showToast(`HP +${result.hpGain}`);
      this._creatureBounce();
      this._spawnClickParticles(SCREEN_SIZE / 2, SCREEN_SIZE / 2, 8);

      if (this.state.checkEvolution()) {
        this._playEvolutionAnimation();
      }
    } else {
      this._showToast('Not enough DATA!');
    }
  }

  _onTrain() {
    if (this.state.evoStage < 1) return;

    const result = this.state.train();
    if (result) {
      const statName = Object.keys(result)[0].toUpperCase();
      const statVal = Object.values(result)[0];
      this._showToast(`${statName} +${statVal}`);
      this._creatureShake();
      this._spawnClickParticles(SCREEN_SIZE / 2, SCREEN_SIZE / 2, 6);

      if (this.state.checkEvolution()) {
        this._playEvolutionAnimation();
      }
    } else {
      this._showToast('Not enough DATA!');
    }
  }

  _toggleUpgradePanel(forceState) {
    const panel = document.getElementById('upgrade-panel');
    const isHidden = panel.classList.contains('hidden');
    const shouldShow = forceState !== undefined ? forceState : isHidden;

    if (shouldShow) {
      this._renderUpgradePanel();
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  }

  _renderUpgradePanel() {
    const list = document.getElementById('upgrade-list');
    list.innerHTML = '';

    for (const upg of UPGRADES) {
      const level = this.state.upgrades[upg.id];
      const cost = this.state.getUpgradeCost(upg.id);
      const canAfford = this.state.dataBits >= cost && level < upg.maxLevel;
      const maxed = level >= upg.maxLevel;

      const item = document.createElement('div');
      item.className = 'upgrade-item' + (canAfford ? '' : ' cannot-afford');

      item.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-name">${upg.name}</div>
          <div class="upgrade-desc">${upg.desc}: ${upg.effect(level).toFixed(1)} → ${maxed ? 'MAX' : upg.effect(level + 1).toFixed(1)}</div>
        </div>
        <div class="upgrade-level">LV.${level}</div>
        <div class="upgrade-cost">${maxed ? 'MAX' : formatNumber(cost)}</div>
      `;

      if (!maxed) {
        item.addEventListener('click', () => {
          if (this.state.buyUpgrade(upg.id)) {
            this._showToast(`${upg.name} upgraded!`);
            this._renderUpgradePanel();
          }
        });
      }

      list.appendChild(item);
    }
  }

  // === ANIMATIONS ===

  _eggWobble() {
    if (!this.creatureSprite) return;
    const sprite = this.creatureSprite;
    const dir = Math.random() > 0.5 ? 1 : -1;
    let t = 0;
    const wobble = () => {
      t += 0.15;
      sprite.rotation = Math.sin(t * 8) * 0.15 * dir * Math.max(0, 1 - t);
      if (t < 1) requestAnimationFrame(wobble);
      else sprite.rotation = 0;
    };
    wobble();
  }

  _creatureBounce() {
    if (!this.creatureSprite) return;
    const sprite = this.creatureSprite;
    const baseY = 0;
    let t = 0;
    const bounce = () => {
      t += 0.08;
      sprite.y = baseY - Math.abs(Math.sin(t * Math.PI)) * 12 * Math.max(0, 1 - t);
      if (t < 1) requestAnimationFrame(bounce);
      else sprite.y = baseY;
    };
    bounce();
  }

  _creatureShake() {
    if (!this.creatureSprite) return;
    const sprite = this.creatureSprite;
    let t = 0;
    const shake = () => {
      t += 0.12;
      sprite.x = Math.sin(t * 20) * 4 * Math.max(0, 1 - t);
      if (t < 1) requestAnimationFrame(shake);
      else sprite.x = 0;
    };
    shake();
  }

  _playEvolutionAnimation() {
    this.evolving = true;
    this.evolveFlashTime = 0;

    const duration = 2.0;
    let elapsed = 0;
    const originalScale = this.creatureSprite ? this.creatureSprite.scale.x : 1;

    const animate = () => {
      elapsed += 1 / 60;

      // Flash effect
      const flashIntensity = Math.sin(elapsed * 15) * 0.5 + 0.5;
      this.flashOverlay.alpha = flashIntensity * 0.8;

      // Creature pulse
      if (this.creatureSprite) {
        const pulse = 1 + Math.sin(elapsed * 12) * 0.2;
        this.creatureSprite.scale.set(originalScale * pulse);
      }

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        // Evolution complete
        this.flashOverlay.alpha = 1;
        this._updateCreatureSprite();

        // Fade out flash
        let fadeTime = 0;
        const fadeOut = () => {
          fadeTime += 0.03;
          this.flashOverlay.alpha = Math.max(0, 1 - fadeTime);
          if (fadeTime < 1) requestAnimationFrame(fadeOut);
          else {
            this.flashOverlay.alpha = 0;
            this.evolving = false;
          }
        };
        fadeOut();

        const species = CREATURE_DB[this.state.speciesId];
        const name = species ? species.name : EVO_STAGES[this.state.evoStage].name;
        this._showToast(`EVOLVED TO ${name}!`);
      }
    };

    animate();
  }

  _spawnClickParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      const colors = [GB.DARKEST, GB.DARK, GB.LIGHT];
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + 30,
        0.5 + Math.random() * 0.5,
        colors[Math.floor(Math.random() * colors.length)],
        2 + Math.random() * 3
      ));
    }
  }

  _spawnFloatingText(x, y, text) {
    const style = new PIXI.TextStyle({
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 10,
      fill: GB_CSS.DARKEST,
      fontWeight: 'bold',
    });
    const txt = new PIXI.Text(text, style);
    txt.anchor.set(0.5, 0.5);
    txt.x = x + (Math.random() - 0.5) * 20;
    txt.y = y;
    this.app.stage.addChild(txt);

    let life = 1.0;
    const animate = () => {
      life -= 0.02;
      txt.y -= 1.5;
      txt.alpha = Math.max(0, life);
      if (life > 0) {
        requestAnimationFrame(animate);
      } else {
        this.app.stage.removeChild(txt);
        txt.destroy();
      }
    };
    animate();
  }

  _showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // === GAME LOOP ===

  _gameLoop(delta) {
    const dt = delta / 60;
    this.animTime += dt;

    // Update game state
    this.state.update(dt);

    // Creature idle animation
    if (this.creatureSprite && !this.evolving) {
      // Gentle bobbing
      const bob = Math.sin(this.animTime * 2) * 3;
      this.creatureContainer.y = SCREEN_SIZE / 2 + 10 + bob;
    }

    // Update particles
    this.particleGraphics.clear();
    this.particles = this.particles.filter(p => {
      const alive = p.update(dt);
      if (alive) {
        const alpha = p.life / p.maxLife;
        this.particleGraphics.beginFill(p.color, alpha);
        this.particleGraphics.drawRect(
          Math.floor(p.x - p.size / 2),
          Math.floor(p.y - p.size / 2),
          Math.ceil(p.size),
          Math.ceil(p.size)
        );
        this.particleGraphics.endFill();
      }
      return alive;
    });

    // Update UI
    this._updateUI();
  }

  _updateUI() {
    const s = this.state;

    // Data counter
    if (s.evoStage >= 1) {
      this.uiTexts.data.text = `DATA:${formatNumber(s.dataBits)}`;
    } else {
      this.uiTexts.data.text = 'DATA: ---';
    }

    // Stage name
    const stageSpecies = CREATURE_DB[s.speciesId];
    this.uiTexts.stage.text = stageSpecies ? EVO_STAGES[s.evoStage].name : 'EGG';

    // DPS
    if (s.evoStage >= 1) {
      const dps = s.getAutoClickRate() * s.getClickPower() + s.getPassiveIncome();
      this.uiTexts.dps.text = dps > 0 ? `${formatNumber(dps)}/s` : '';
    } else {
      this.uiTexts.dps.text = '';
    }

    // Progress bar
    this.progressBar.clear();
    const barWidth = SCREEN_SIZE - 80;
    const barHeight = 8;

    if (s.evoStage === 0) {
      // Hatch progress
      const prog = s.hatchProgress / EVO_STAGES[0].clicksToHatch;
      this.uiTexts.progress.text = `${s.hatchProgress}/${EVO_STAGES[0].clicksToHatch}`;

      this.progressBar.lineStyle(1, GB.DARKEST);
      this.progressBar.drawRect(0, 0, barWidth, barHeight);
      this.progressBar.beginFill(GB.DARK);
      this.progressBar.drawRect(1, 1, (barWidth - 2) * prog, barHeight - 2);
      this.progressBar.endFill();
    } else if (s.evoStage < EVO_STAGES.length - 1) {
      // Growth progress
      const needed = EVO_STAGES[s.evoStage].growthNeeded;
      const prog = Math.min(1, s.growthPoints / needed);
      this.uiTexts.progress.text = `GRW:${formatNumber(s.growthPoints)}/${formatNumber(needed)}`;

      this.progressBar.lineStyle(1, GB.DARKEST);
      this.progressBar.drawRect(0, 0, barWidth, barHeight);
      this.progressBar.beginFill(GB.DARK);
      this.progressBar.drawRect(1, 1, (barWidth - 2) * prog, barHeight - 2);
      this.progressBar.endFill();
    } else {
      this.uiTexts.progress.text = 'MAX STAGE';
    }

    // Hint text
    if (s.evoStage === 0) {
      this.uiTexts.hint.text = 'TAP THE EGG!';
    } else {
      const feedCost = s.getFeedCost();
      const trainCost = s.getTrainCost();
      this.uiTexts.hint.text = `A:${formatNumber(feedCost)} B:${formatNumber(trainCost)}`;
    }

    // Stats display (HTML)
    this._updateStatsPanel();

    // Button states
    const btnA = document.getElementById('btn-a');
    const btnB = document.getElementById('btn-b');
    const btnC = document.getElementById('btn-c');

    if (s.evoStage < 1) {
      btnA.disabled = true;
      btnB.disabled = true;
      btnC.disabled = true;
    } else {
      btnA.disabled = false;
      btnB.disabled = false;
      btnC.disabled = false;
    }
  }

  _updateStatsPanel() {
    const s = this.state;
    const display = document.getElementById('stats-display');
    const species = CREATURE_DB[s.speciesId];
    const speciesName = species ? species.name : '???';
    const speciesType = species ? species.type : '';

    if (s.evoStage < 1) {
      display.innerHTML = `
        <div class="stat-full">${speciesName}</div>
        <div class="stat-item">
          <span class="stat-label">TYPE</span>
          <span class="stat-value">${speciesType}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">STATUS</span>
          <span class="stat-value">INCUBATING</span>
        </div>
      `;
      return;
    }

    display.innerHTML = `
      <div class="stat-full">${speciesName}</div>
      <div class="stat-item">
        <span class="stat-label">TYPE</span>
        <span class="stat-value">${speciesType}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">HP</span>
        <span class="stat-value">${formatNumber(s.stats.hp)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">ATK</span>
        <span class="stat-value">${formatNumber(s.stats.atk)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">DEF</span>
        <span class="stat-value">${formatNumber(s.stats.def)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">SPD</span>
        <span class="stat-value">${formatNumber(s.stats.spd)}</span>
      </div>
    `;
  }
}

// === START GAME ===
window.addEventListener('DOMContentLoaded', () => {
  new TamamonGame();
});
