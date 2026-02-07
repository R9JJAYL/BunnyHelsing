import Phaser from 'phaser';

// ============================================
// BUNNY BASHERS - MEDIEVAL CASTLE THEME
// ============================================

// ============================================
// SOUND SYSTEM - Web Audio API Generated Sounds
// ============================================
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    this.musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
    this.musicGain = null;
    this.musicOscillators = [];
  }

  init() {
    if (this.audioContext) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Resume on user interaction (required by browsers)
    document.addEventListener('click', () => {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    }, { once: true });
  }

  // Gunshot - punchy low sound
  playGunshot() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Crossbow twang - string release sound
    const twang = ctx.createOscillator();
    twang.type = 'sawtooth';
    twang.frequency.setValueAtTime(180, now);
    twang.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    const twangGain = ctx.createGain();
    twangGain.gain.setValueAtTime(0.25, now);
    twangGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    // Wooden thunk
    const thunk = ctx.createOscillator();
    thunk.type = 'sine';
    thunk.frequency.setValueAtTime(100, now);
    thunk.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    const thunkGain = ctx.createGain();
    thunkGain.gain.setValueAtTime(0.3, now);
    thunkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    // Filter for muffled castle sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    twang.connect(twangGain).connect(filter).connect(ctx.destination);
    thunk.connect(thunkGain).connect(ctx.destination);

    twang.start(now);
    thunk.start(now);
    twang.stop(now + 0.15);
    thunk.stop(now + 0.1);
  }

  // Ricochet - stone echo ping
  playRicochet() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Stone impact with reverb-like echoes
    const frequencies = [800, 600, 450]; // Descending echoes
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq + Math.random() * 100;

      const gain = ctx.createGain();
      const delay = i * 0.04;
      const volume = 0.12 - i * 0.03;
      gain.gain.setValueAtTime(volume, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.12);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 8;

      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    });
  }

  // Enemy hit - ghostly whoosh with thud
  playHit() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Ghostly whoosh
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(400, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.25);
    noiseFilter.Q.value = 2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    // Deep thud
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(80, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.25, now);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    thud.connect(thudGain).connect(ctx.destination);

    noise.start(now);
    thud.start(now);
    noise.stop(now + 0.3);
    thud.stop(now + 0.15);
  }

  // Victory - medieval horn fanfare
  playVictory() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Medieval perfect 5th intervals (more ancient sounding)
    const notes = [196, 294, 392, 294, 392]; // G3, D4, G4, D4, G4
    const durations = [0.2, 0.2, 0.15, 0.15, 0.4];
    let time = 0;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; // Brass-like

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.15, now + time + 0.03);
      gain.gain.setValueAtTime(0.15, now + time + durations[i] - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + durations[i]);

      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + durations[i]);

      time += durations[i];
    });
  }

  // Fail sound - ominous church bell toll
  playFail() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Bell-like tone with harmonics
    const fundamentals = [110, 138.6, 164.8]; // A2 and overtones
    fundamentals.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const vol = 0.15 - i * 0.04;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    });

    // Add slight vibrato for eeriness
    const vibrato = ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.value = 5;
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = 3;
  }

  // UI Click - stone button press
  playClick() {
    if (!this.enabled || !this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Short stone tap
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Magical theme tune - Harry Potter inspired
  startMusic() {
    if (!this.musicEnabled || !this.audioContext) return;
    if (this.musicOscillators.length > 0) return; // Already playing

    const ctx = this.audioContext;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.035; // Quiet but audible
    this.musicGain.connect(ctx.destination);

    // Soft pad filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    filter.connect(this.musicGain);

    // Soft string pad (E minor - magical key)
    const pad1 = ctx.createOscillator();
    pad1.type = 'sine';
    pad1.frequency.value = 82.4; // E2

    const pad2 = ctx.createOscillator();
    pad2.type = 'sine';
    pad2.frequency.value = 123.5; // B2

    const pad3 = ctx.createOscillator();
    pad3.type = 'triangle';
    pad3.frequency.value = 164.8; // E3

    // Gentle shimmer LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 1.5;
    lfo.connect(lfoGain).connect(pad3.frequency);

    // Pad gains
    const pad1Gain = ctx.createGain();
    pad1Gain.gain.value = 0.4;
    const pad2Gain = ctx.createGain();
    pad2Gain.gain.value = 0.3;
    const pad3Gain = ctx.createGain();
    pad3Gain.gain.value = 0.2;

    pad1.connect(pad1Gain).connect(filter);
    pad2.connect(pad2Gain).connect(filter);
    pad3.connect(pad3Gain).connect(filter);

    pad1.start();
    pad2.start();
    pad3.start();
    lfo.start();

    this.musicOscillators = [pad1, pad2, pad3, lfo];
    this.musicFilter = filter;
    this.audioContext = ctx;

    // Start the melodic theme
    this.melodyPosition = 0;
    this.playThemeMelody();
  }

  // Play the main theme melody - magical celesta-like
  playThemeMelody() {
    if (!this.musicEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Magical melody in E minor (like Hedwig's Theme style)
    // Pattern: mysterious, twinkling, with that "magical" interval jump
    const melody = [
      { note: 329.6, duration: 0.4 },  // E4
      { note: 392, duration: 0.2 },    // G4
      { note: 440, duration: 0.3 },    // A4
      { note: 392, duration: 0.5 },    // G4
      { note: 493.9, duration: 0.8 },  // B4 (hold)
      { note: 466.2, duration: 0.6 },  // A#4 (that magical half-step)
      { note: 392, duration: 0.8 },    // G4 (resolve)
      { note: 0, duration: 0.4 },      // rest
      { note: 329.6, duration: 0.4 },  // E4
      { note: 293.7, duration: 0.3 },  // D4
      { note: 329.6, duration: 0.5 },  // E4
      { note: 0, duration: 0.6 },      // rest
    ];

    const noteData = melody[this.melodyPosition];
    const noteDuration = noteData.duration;

    if (noteData.note > 0) {
      // Celesta-like bell tone
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = noteData.note;

      // Add sparkle overtone
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = noteData.note * 2; // Octave up

      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = noteData.note * 3; // 5th overtone

      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + noteDuration * 0.9);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.06, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + noteDuration * 0.7);

      const gain3 = ctx.createGain();
      gain3.gain.setValueAtTime(0.02, now);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + noteDuration * 0.5);

      osc1.connect(gain1).connect(this.musicGain);
      osc2.connect(gain2).connect(this.musicGain);
      osc3.connect(gain3).connect(this.musicGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(now + noteDuration);
      osc2.stop(now + noteDuration);
      osc3.stop(now + noteDuration);
    }

    // Move to next note
    this.melodyPosition = (this.melodyPosition + 1) % melody.length;

    // Add a longer pause after the melody completes before repeating
    const nextDelay = this.melodyPosition === 0 ? 2000 : noteDuration * 1000;

    this.melodyTimeout = setTimeout(() => {
      this.playThemeMelody();
    }, nextDelay);
  }

  stopMusic() {
    this.musicOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    this.musicOscillators = [];
    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled);
    return this.enabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('musicEnabled', this.musicEnabled);
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }
}

// Global sound manager instance
const soundManager = new SoundManager();

// Available bunny skins with gun offsets to align aim point
// gunOffsetX/Y determine where bullets fire from (relative to container at y=630)
const BUNNY_SKINS = [
  { id: 'bunny-hero', name: 'Classic', offsetX: 0, offsetY: 5, scale: 0.09, gunX: 65, gunY: -75 },
  { id: 'bunny-mobster', name: 'Mobster', offsetX: 15, offsetY: -15, scale: 0.09, gunX: 65, gunY: -55 },
  { id: 'bunny-crimson', name: 'Crimson', offsetX: 10, offsetY: 5, scale: 0.09, gunX: 65, gunY: -75 }
];

// Current selected skin (persisted in localStorage)
let currentSkin = localStorage.getItem('bunnySkin') || 'bunny-hero';

const COLORS = {
  // Castle stone colors
  stoneLight: 0x6B6B63,
  stoneMid: 0x4A4A45,
  stoneDark: 0x2D2D2A,
  stoneAccent: 0x3C3C35,
  mortar: 0x252520,

  // Atmosphere - Game of Thrones darker palette
  dungeonBg: 0x0D0D0F,
  torchOrange: 0xE85A25,
  torchYellow: 0xF0A030,
  torchGlow: 0xC04510,

  // Medieval accents - muted, aged
  bloodRed: 0x8B0000,
  dragonFire: 0xD4380D,
  valyrian: 0x4A6FA5,  // Steel blue
  oldGold: 0xC9A227,
  bronze: 0x8B6914,

  // Dark magic
  shadowPurple: 0x2D1B4E,
  ghostWhite: 0xE8E4D9,

  // UI
  white: 0xF5F5DC,  // Aged white/cream
  gold: 0xC9A227,
  softGray: 0x6B6B6B,
  parchment: 0xD4C4A8,
  steel: 0x71797E,
};

// ============================================
// LEVEL VALIDATOR - Tests if levels are solvable
// Run in browser console: validateAllLevels() or validateLevel(1)
// ============================================
function validateLevel(levelNum) {
  const level = LEVELS[levelNum - 1];
  if (!level) {
    console.error(`Level ${levelNum} not found`);
    return false;
  }

  console.log(`\n🎯 Validating Level ${levelNum}...`);
  console.log(`   Ammo: ${level.ammo}, Pandas: ${level.pandas.length}`);

  const bunnyX = 150;
  const bunnyY = 580;
  const pandaRadius = 40; // Hit detection radius

  // Wall bounds
  const leftBound = 35;
  const rightBound = 1165;
  const topBound = 35;
  const bottomBound = 615;

  // Parse obstacles into line segments for collision
  const obstacles = (level.obstacles || []).map(obs => ({
    x: obs.x,
    y: obs.y,
    w: obs.w || 20,
    h: obs.h || 100,
    angle: obs.angle || 0
  }));

  // Check if a point hits an obstacle
  function hitsObstacle(x, y) {
    for (const obs of obstacles) {
      // Simple AABB for non-rotated, rotated needs more complex check
      if (obs.angle === 0 || obs.angle === undefined) {
        const halfW = obs.w / 2;
        const halfH = obs.h / 2;
        if (x >= obs.x - halfW && x <= obs.x + halfW &&
            y >= obs.y - halfH && y <= obs.y + halfH) {
          return true;
        }
      } else if (obs.angle === 90) {
        // Swapped dimensions for 90 degree rotation
        const halfW = obs.h / 2;
        const halfH = obs.w / 2;
        if (x >= obs.x - halfW && x <= obs.x + halfW &&
            y >= obs.y - halfH && y <= obs.y + halfH) {
          return true;
        }
      }
    }
    return false;
  }

  // Simulate a shot and return which pandas it hits
  function simulateShot(angle, power, maxBounces) {
    const speed = Math.min(power * 4, 600);
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let x = bunnyX + 35; // Gun offset
    let y = bunnyY - 25;
    let bounces = 0;
    const hitPandas = new Set();

    for (let i = 0; i < 2000 && bounces <= maxBounces; i++) {
      x += vx * 0.005;
      y += vy * 0.005;

      // Wall bounces
      if (x < leftBound || x > rightBound) {
        vx *= -1;
        x = x < leftBound ? leftBound : rightBound;
        bounces++;
      }
      if (y < topBound || y > bottomBound) {
        vy *= -1;
        y = y < topBound ? topBound : bottomBound;
        bounces++;
      }

      // Obstacle collision (stop bullet)
      if (hitsObstacle(x, y)) {
        break;
      }

      // Check panda hits
      level.pandas.forEach((panda, idx) => {
        const dist = Math.sqrt((x - panda.x) ** 2 + (y - panda.y) ** 2);
        if (dist < pandaRadius) {
          hitPandas.add(idx);
        }
      });
    }

    return hitPandas;
  }

  // Try many angles and powers to find solutions
  const solutions = [];
  const pandaHitCount = new Array(level.pandas.length).fill(0);

  // Test range of angles (-PI to PI) and powers
  for (let angleDeg = -80; angleDeg <= 80; angleDeg += 2) {
    for (let power = 50; power <= 200; power += 10) {
      for (let bounces = 1; bounces <= Math.min(level.ammo, 5); bounces++) {
        const angle = (angleDeg * Math.PI) / 180;
        const hits = simulateShot(angle, power, bounces);

        if (hits.size > 0) {
          hits.forEach(idx => pandaHitCount[idx]++);

          // Store good solutions (multi-kills or single kills)
          if (hits.size >= 1) {
            solutions.push({
              angle: angleDeg,
              power,
              bounces,
              hits: Array.from(hits)
            });
          }
        }
      }
    }
  }

  // Check results
  const unreachable = [];
  level.pandas.forEach((panda, idx) => {
    if (pandaHitCount[idx] === 0) {
      unreachable.push({ idx: idx + 1, x: panda.x, y: panda.y });
    }
  });

  if (unreachable.length > 0) {
    console.log(`   ❌ IMPOSSIBLE! ${unreachable.length} panda(s) cannot be hit:`);
    unreachable.forEach(p => {
      console.log(`      Panda #${p.idx} at (${p.x}, ${p.y})`);
    });
    return false;
  }

  // Check if we have enough ammo
  // Find minimum shots needed (greedy: prioritize multi-kills)
  const sortedSolutions = solutions.sort((a, b) => b.hits.length - a.hits.length);
  const killablePandas = new Set();
  let shotsNeeded = 0;
  let ammoUsed = 0;

  for (const sol of sortedSolutions) {
    const newKills = sol.hits.filter(idx => !killablePandas.has(idx));
    if (newKills.length > 0) {
      shotsNeeded++;
      ammoUsed += sol.bounces;
      newKills.forEach(idx => killablePandas.add(idx));
    }
    if (killablePandas.size === level.pandas.length) break;
  }

  if (ammoUsed > level.ammo) {
    console.log(`   ⚠️  WARNING: May need ${ammoUsed} ammo but only ${level.ammo} given`);
    console.log(`   Best solution uses ${shotsNeeded} shots`);
  }

  console.log(`   ✅ SOLVABLE! Found ${solutions.length} valid shot combinations`);
  console.log(`   Min shots needed: ~${shotsNeeded}, Est. ammo: ${ammoUsed}/${level.ammo}`);

  // Show best solutions
  const bestMultiKill = sortedSolutions.find(s => s.hits.length > 1);
  if (bestMultiKill) {
    console.log(`   🎯 Best multi-kill: angle ${bestMultiKill.angle}°, power ${bestMultiKill.power}, ${bestMultiKill.bounces} bounces → kills ${bestMultiKill.hits.length} pandas`);
  }

  return true;
}

function validateAllLevels() {
  console.log('🔍 LEVEL VALIDATION REPORT');
  console.log('==========================');

  let passed = 0;
  let failed = 0;

  for (let i = 1; i <= LEVELS.length; i++) {
    if (validateLevel(i)) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n==========================');
  console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${LEVELS.length} levels`);

  return failed === 0;
}

// Make functions globally available
window.validateLevel = validateLevel;
window.validateAllLevels = validateAllLevels;

// Level configurations - Much harder with angles and moving parts
// Game area is now 1200x650 landscape (bamboo frame fills entire canvas)
// Bunny is at bottom-left around x:150, y:580
// Bamboo obstacles scale uniformly - longer bamboo = proportionally thicker
// For good visibility use lengths of 250-400px
const LEVELS = [
  // Level 1: Tutorial - Simple open shot, learn the basics
  {
    ammo: 3,
    tutorial: true, // Shows tutorial on this level
    pandas: [{ x: 900, y: 300 }],
    obstacles: [],
    movingObstacles: []
  },
  // Level 2: Chandelier drop - Learn environmental kills
  // Bamboo blocks the panda but gap at top lets you hit the chandelier
  {
    ammo: 3,
    pandas: [{ x: 1000, y: 450 }], // Only bottom panda
    obstacles: [
      { x: 700, y: 420, w: 20, h: 420 }, // Bamboo with gap at top - ricochet to hit chandelier!
    ],
    movingObstacles: [],
    chandeliers: [
      { x: 1000, y: 120 } // Chandelier above the panda - the only way to kill it
    ]
  },
  // Level 3: THE ULTIMATE CHALLENGE - One shot, 20 ricochets, 4 pandas
  {
    ammo: 20,
    lockedAmmo: true, // Forces player to use all 20 ricochets
    challengeLevel: true, // Shows challenge popup at start
    challengeTitle: "THE ULTIMATE CHALLENGE",
    challengeText: "One shot. 20 ricochets. 4 pandas.\nCan you do it?",
    pandas: [
      { x: 135, y: 156 },
      { x: 1045, y: 128 },
      { x: 804, y: 331 },
      { x: 1081, y: 511 }
    ],
    obstacles: [
      { x: 394, y: 452, w: 20, h: 110 },
      { x: 696, y: 529, w: 20, h: 210 },
      { x: 599, y: 223, w: 20, h: 250 },
      { x: 324, y: 253, w: 20, h: 160 },
      { x: 167, y: 326, w: 20, h: 300, angle: 90 },
      { x: 456, y: 501, w: 20, h: 110, angle: 90 },
      { x: 894, y: 118, w: 20, h: 200 },
      { x: 1081, y: 315, w: 20, h: 200, angle: 90 }
    ],
    movingObstacles: []
  },
];

// ============================================
// MAIN MENU SCENE - Supercell-inspired design
// ============================================

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
    this.editMode = new URLSearchParams(window.location.search).get('edit') === 'true';
    this.draggableElements = [];
  }

  preload() {
    this.load.image('logo', '/assets/logo.png');
    this.load.image('bunny-hero', '/assets/bunny-hero.png');
    this.load.image('bunny-mobster', '/assets/bunny-mobster.png');
    this.load.image('bunny-crimson', '/assets/bunny-crimson.png');
    this.load.image('panda-jason', '/assets/panda-jason.png');
    this.load.image('bamboo', '/assets/bamboo.png');
  }

  create() {
    const W = 1200, H = 650;
    const centerX = W / 2, centerY = H / 2;

    // === BACKGROUND ===
    // Dark outer background
    const outerBg = this.add.rectangle(centerX, centerY, W, H, 0x030306);
    outerBg.setDepth(-2);

    // Lighter inner area (inside bamboo frame) - grey
    const innerBg = this.add.rectangle(centerX, centerY, W - 40, H - 40, 0x2a2a32);
    innerBg.setDepth(-1);

    // Atmospheric fog particles (slow, dreamy)
    this.createAtmosphere();

    // === BAMBOO FRAME ===
    const bambooThickness = 20;
    [
      [W / 2, bambooThickness / 2, W, bambooThickness, 0],
      [W / 2, H - bambooThickness / 2, W, bambooThickness, 0],
      [bambooThickness / 2, H / 2, H, bambooThickness, 90],
      [W - bambooThickness / 2, H / 2, H, bambooThickness, 90]
    ].forEach(([x, y, w, h, angle]) => {
      const bamboo = this.add.image(x, y, 'bamboo');
      bamboo.setDisplaySize(w, h);
      if (angle) bamboo.setAngle(angle);
      bamboo.setDepth(100);
    });

    // === LOGO WITH GLOW ===
    // Logo glow effect
    const logoGlow = this.add.image(centerX, 130, 'logo');
    logoGlow.setScale(0.18);
    logoGlow.setTint(0xFFAA00);
    logoGlow.setAlpha(0.25);
    logoGlow.setBlendMode(Phaser.BlendModes.ADD);

    // Main logo
    const logo = this.add.image(centerX, 130, 'logo');
    logo.setScale(0.17);

    // Subtle logo pulse
    this.tweens.add({
      targets: [logoGlow],
      alpha: 0.12,
      scale: 0.19,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // === CHARACTERS ===
    // Bunny hero - left side (uses selected skin)
    const bunny = this.add.image(244, 320, currentSkin);
    bunny.setScale(0.10);

    // Bunny breathing animation
    this.tweens.add({
      targets: bunny,
      scaleY: 0.102,
      scaleX: 0.098,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Panda villain - right side, same scale
    const panda = this.add.image(980, 330, 'panda-jason');
    panda.setScale(0.10);

    // Panda float animation
    this.tweens.add({
      targets: panda,
      y: panda.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // === PLAY BUTTON - Supercell style ===
    const btnY = 330;
    const playBtn = this.add.container(centerX, btnY);

    // Button shadow (3D effect)
    const btnShadow = this.add.graphics();
    btnShadow.fillStyle(0x000000, 0.5);
    btnShadow.fillRoundedRect(-122, -28, 244, 72, 16);

    // Button base (dark)
    const btnBase = this.add.graphics();
    btnBase.fillStyle(0x1A1510, 1);
    btnBase.fillRoundedRect(-120, -32, 240, 68, 14);

    // Button gradient fill
    const btnFill = this.add.graphics();
    btnFill.fillGradientStyle(0xD4A84B, 0xD4A84B, 0xB8860B, 0xB8860B, 1);
    btnFill.fillRoundedRect(-115, -28, 230, 56, 12);

    // Button highlight (top shine)
    const btnShine = this.add.graphics();
    btnShine.fillGradientStyle(0xFFD700, 0xFFD700, 0xD4A84B, 0xD4A84B, 0.8);
    btnShine.fillRoundedRect(-110, -26, 220, 25, { tl: 10, tr: 10, bl: 0, br: 0 });

    // Button border
    const btnBorder = this.add.graphics();
    btnBorder.lineStyle(3, 0xFFE55C);
    btnBorder.strokeRoundedRect(-115, -28, 230, 56, 12);

    // Button text with shadow
    const btnTextShadow = this.add.text(2, 2, 'PLAY', {
      fontSize: '32px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.5);

    const btnText = this.add.text(0, 0, 'PLAY', {
      fontSize: '32px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#8B6914',
      strokeThickness: 2
    }).setOrigin(0.5);

    playBtn.add([btnShadow, btnBase, btnFill, btnShine, btnBorder, btnTextShadow, btnText]);

    // Hit area
    const hitArea = this.add.rectangle(0, 0, 240, 70, 0x000000, 0);
    playBtn.add(hitArea);
    hitArea.setInteractive({ useHandCursor: true });

    // Hover effects
    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: playBtn,
        scale: 1.08,
        duration: 100,
        ease: 'Back.easeOut'
      });
      btnBorder.clear();
      btnBorder.lineStyle(4, 0xFFFFAA);
      btnBorder.strokeRoundedRect(-115, -28, 230, 56, 12);
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: playBtn,
        scale: 1,
        duration: 100
      });
      btnBorder.clear();
      btnBorder.lineStyle(3, 0xFFE55C);
      btnBorder.strokeRoundedRect(-115, -28, 230, 56, 12);
    });

    hitArea.on('pointerdown', () => {
      // Press effect
      this.tweens.add({
        targets: playBtn,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.cameras.main.flash(150, 255, 215, 0);
          this.time.delayedCall(150, () => {
            this.scene.start('GameScene');
          });
        }
      });
    });

    // Subtle button glow pulse
    this.tweens.add({
      targets: playBtn,
      y: btnY - 3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // === INFO PANEL ===
    // Frosted glass panel for game description
    const infoPanel = this.add.graphics();
    infoPanel.fillStyle(0x000000, 0.4);
    infoPanel.fillRoundedRect(centerX - 240, 430, 480, 75, 10);
    infoPanel.lineStyle(1, 0x4A4A45, 0.5);
    infoPanel.strokeRoundedRect(centerX - 240, 430, 480, 75, 10);

    // Game description
    this.add.text(centerX, 455, 'The vampire pandas have risen. Only one bunny can stop them.', {
      fontSize: '13px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#CCCCCC'
    }).setOrigin(0.5);

    this.add.text(centerX, 480, 'Master the art of the ricochet shot across 7 deadly levels.', {
      fontSize: '11px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#888888'
    }).setOrigin(0.5);

    // === ENTRANCE ANIMATION ===
    this.cameras.main.fadeIn(500);

    // Stagger entrance for elements
    [bunny, panda, logo, logoGlow, playBtn].forEach((obj, i) => {
      obj.setAlpha(0);
      obj.y += 30;
      this.tweens.add({
        targets: obj,
        alpha: 1,
        y: obj.y - 30,
        duration: 400,
        delay: 200 + i * 100,
        ease: 'Back.easeOut'
      });
    });

    // Edit mode setup
    if (this.editMode) {
      this.setupEditMode(logo, bunny, panda, playBtn);
    }
  }

  setupEditMode(logo, bunny, panda, playBtn) {
    // Enable drag input on the scene
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = Math.round(dragX);
      gameObject.y = Math.round(dragY);
      if (gameObject.label) {
        gameObject.label.setPosition(gameObject.x, gameObject.y - 60);
      }
      this.updateCoordsDisplay(this.editElements);
    });

    // Coords display
    this.coordsText = this.add.text(10, 10, 'EDIT MODE - Drag elements', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#00FF00',
      backgroundColor: '#000000'
    }).setDepth(1000);

    // Make elements draggable
    this.editElements = [
      { obj: logo, name: 'logo' },
      { obj: bunny, name: 'bunny' },
      { obj: panda, name: 'panda' },
      { obj: playBtn, name: 'playBtn' }
    ];

    this.editElements.forEach(({ obj, name }) => {
      // For containers, set interactive with a hit area
      if (obj.type === 'Container') {
        obj.setSize(240, 70);
        obj.setInteractive({ draggable: true, useHandCursor: true });
      } else {
        obj.setInteractive({ draggable: true, useHandCursor: true });
      }

      // Label for each element
      const label = this.add.text(obj.x, obj.y - 60, name, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#FFFF00',
        backgroundColor: '#000000'
      }).setOrigin(0.5).setDepth(1001);

      obj.label = label;
    });

    this.updateCoordsDisplay(this.editElements);

    // Copy button
    const copyBtn = this.add.text(10, 600, '📋 COPY COORDS', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#000000',
      backgroundColor: '#00FF00',
      padding: { x: 10, y: 5 }
    }).setDepth(1000).setInteractive({ useHandCursor: true });

    copyBtn.on('pointerdown', () => {
      const coords = elements.map(({ obj, name }) => `${name}: { x: ${Math.round(obj.x)}, y: ${Math.round(obj.y)} }`).join('\n');
      navigator.clipboard.writeText(coords);
      copyBtn.setText('✅ COPIED!');
      this.time.delayedCall(1000, () => copyBtn.setText('📋 COPY COORDS'));
    });
  }

  updateCoordsDisplay(elements) {
    const coords = elements.map(({ obj, name }) => `${name}: (${Math.round(obj.x)}, ${Math.round(obj.y)})`).join('  |  ');
    this.coordsText.setText(`EDIT MODE - ${coords}`);
  }

  createAtmosphere() {
    // Slow floating dust particles
    this.time.addEvent({
      delay: 400,
      callback: () => {
        const particle = this.add.circle(
          Phaser.Math.Between(50, 1150),
          Phaser.Math.Between(100, 550),
          Phaser.Math.Between(1, 3),
          0xFFFFFF,
          Phaser.Math.FloatBetween(0.05, 0.15)
        );
        particle.setDepth(50);

        this.tweens.add({
          targets: particle,
          y: particle.y - Phaser.Math.Between(40, 80),
          x: particle.x + Phaser.Math.Between(-30, 30),
          alpha: 0,
          duration: Phaser.Math.Between(3000, 5000),
          onComplete: () => particle.destroy()
        });
      },
      repeat: -1
    });
  }

  createCornerFlourish(x, y, dir) {
    const g = this.add.graphics();
    g.lineStyle(1, 0x4A4A45, 0.4);

    // Simple corner lines
    g.beginPath();
    g.moveTo(x, y + dir * 20);
    g.lineTo(x, y);
    g.lineTo(x + dir * 20, y);
    g.strokePath();

    // Small diamond
    g.fillStyle(0xC9A86C, 0.3);
    g.fillCircle(x, y, 3);
  }
}

// ============================================
// MAIN GAME SCENE
// ============================================

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.editMode = new URLSearchParams(window.location.search).get('edit') === 'true';
    this.bullet = null;
    this.bunny = null;
    this.pandas = [];
    this.walls = [];
    this.movingWalls = [];
    this.obstacleImages = []; // Store bamboo obstacle images
    this.chandeliers = []; // Store chandelier objects
    this.editableObstacles = []; // For edit mode
    this.aimLine = null;
    this.trajectoryDots = [];
    this.bulletFired = false;
    this.ammoTotal = 5;
    this.ammoRemaining = 5;
    this.selectedAmmo = 1;
    this.level = 1;
    this.trails = [];
    this.ammoButtons = [];
    this.gameTime = 0;
    this.levelEnded = false;
    this.combo = 0;
    this.score = 0;
    this.slowMoActive = false;
  }

  init(data) {
    // Reset all state on scene restart
    this.bullet = null;
    this.bunny = null;
    this.pandas = [];
    this.walls = [];
    this.movingWalls = [];
    this.obstacleImages = []; // Store bamboo obstacle images
    this.aimLine = null;
    this.trajectoryDots = [];
    this.bulletFired = false;
    this.ammoTotal = 5;
    this.ammoRemaining = 5;
    this.selectedAmmo = 1;
    this.trails = [];
    this.ammoButtons = [];
    this.gameTime = 0;
    this.levelEnded = false;
    this.combo = 0;
    this.score = 0;
    this.slowMoActive = false;
    this.trailEvent = null;
    this.vignette = null;
    this.chandeliers = [];
    this.tutorialActive = false;
    this.tutorialBlockShoot = false;
    this.editableObstacles = [];

    if (data.level) {
      this.level = data.level;
    }
    this.isReplay = data.isReplay || false;
  }

  preload() {
    // Load character sprites
    this.load.image('bunny-hero', '/assets/bunny-hero.png');
    this.load.image('bunny-mobster', '/assets/bunny-mobster.png');
    this.load.image('bunny-crimson', '/assets/bunny-crimson.png');
    this.load.image('panda-jason', '/assets/panda-jason.png');
    this.load.image('panda-pennywise', '/assets/panda-pennywise.png');
    this.load.image('panda-freddy', '/assets/panda-freddy.png');
    this.load.image('panda-leatherface', '/assets/panda-leatherface.png');
    this.load.image('panda-beetlejuice', '/assets/panda-beetlejuice.png');
    this.load.image('logo', '/assets/logo.png');
    this.load.image('bamboo', '/assets/bamboo.png');
    this.load.image('test-backdrop', '/assets/test-backdrop.png');
  }

  create() {
    // Initialize sound system
    soundManager.init();
    soundManager.startMusic();

    // Show UI elements when game starts
    document.getElementById('sidebar')?.classList.add('visible');

    // Setup nav button handlers
    this.setupNavButtons();

    // Reset time scale in case slow-mo was active
    this.time.timeScale = 1;
    this.physics.world.timeScale = 1;

    const levelConfig = LEVELS[Math.min(this.level - 1, LEVELS.length - 1)];
    this.ammoTotal = levelConfig.ammo;
    this.ammoRemaining = levelConfig.ammo;
    this.lockedAmmo = levelConfig.lockedAmmo || false;
    this.selectedAmmo = this.lockedAmmo ? levelConfig.ammo : 1; // Lock to max if challenge level
    this.gameTime = 0;
    this.movingWalls = [];

    // Show challenge popup if this is a challenge level (but not on replay)
    if (levelConfig.challengeLevel && !this.isReplay) {
      this.showChallengePopup(levelConfig.challengeTitle, levelConfig.challengeText);
    }

    // Set background - use level-specific or default to black
    this.cameras.main.setBackgroundColor(0x000000);

    // Create starry sky background or use level backdrop
    if (levelConfig.backdrop) {
      const backdrop = this.add.image(600, 325, levelConfig.backdrop);
      backdrop.setDisplaySize(1200, 650);
      backdrop.setDepth(-10);
      backdrop.setAlpha(0.5); // Semi-transparent so you can see elements
    } else {
      this.createStarryBackground();
    }

    // Create bamboo border walls
    this.createBambooWalls();

    // Create interior obstacles (static)
    this.createObstacles(levelConfig.obstacles);

    // Create moving obstacles
    if (levelConfig.movingObstacles) {
      this.createMovingObstacles(levelConfig.movingObstacles);
    }

    // Create chandeliers (environmental hazards)
    if (levelConfig.chandeliers) {
      this.createChandeliers(levelConfig.chandeliers);
    }

    // Create pandas
    this.createPandas(levelConfig.pandas);

    // Create bunny
    this.createBunny();

    // Create UI
    this.createUI();

    // Input handling
    this.setupInput();

    // Show tutorial if this level has tutorial flag
    if (levelConfig.tutorial) {
      this.showTutorial();
    }

    // Add ambient particles (dust/embers)
    this.createAmbientParticles();

    // Create aim line graphics (always visible)
    this.aimLine = this.add.graphics();
    this.trajectoryDots = [];

    // Setup level editor if in edit mode
    if (this.editMode) {
      this.setupLevelEditor();
    }
  }

  setupLevelEditor() {
    // Start in edit mode (no shooting)
    this.levelEnded = true;
    this.practiceMode = false;

    // Set high ammo for practice
    this.ammoTotal = 99;
    this.ammoRemaining = 99;
    this.selectedAmmo = 20; // 20 ricochets by default

    // Enable drag input on scene level
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = Math.round(dragX);
      gameObject.y = Math.round(dragY);
      this.updateLevelEditorDisplay();
    });

    // Coords display
    this.editorText = this.add.text(50, 10, 'EDITOR: Drag=move | ↑↓=length | ←→=rotate | F/T=fat/thin | N=new | Del=remove | P=practice', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#00FF00',
      backgroundColor: '#000000'
    }).setDepth(1000);

    this.selectedObstacle = null;

    // Make obstacles directly draggable (no handles)
    this.editableObstacles.forEach((obsData, i) => {
      const bamboo = obsData.image;
      bamboo.editName = `bamboo${i + 1}`;
      bamboo.editData = obsData;

      // Create invisible drag handle at bamboo position
      const handle = this.add.circle(bamboo.x, bamboo.y, 25, 0xffff00, 0.3);
      handle.setDepth(1002);
      handle.setInteractive({ draggable: true, useHandCursor: true });
      handle.linkedBamboo = bamboo;
      handle.obsData = obsData;

      // Drag moves both handle and bamboo
      handle.on('drag', (pointer, dragX, dragY) => {
        handle.x = Math.round(dragX);
        handle.y = Math.round(dragY);
        bamboo.x = handle.x;
        bamboo.y = handle.y;
        this.updateLevelEditorDisplay();
      });

      // Click to select
      handle.on('pointerdown', () => {
        if (this.selectedObstacle && this.selectedObstacle.handle) {
          this.selectedObstacle.handle.setFillStyle(0xffff00, 0.3);
        }
        this.selectedObstacle = { bamboo, handle, data: obsData };
        handle.setFillStyle(0x00ff00, 0.6);
        this.updateLevelEditorDisplay();
      });
    });

    // Make pandas draggable with handles
    this.pandas.forEach((panda, i) => {
      const handle = this.add.circle(panda.x, panda.y, 25, 0xff00ff, 0.3);
      handle.setDepth(1002);
      handle.setInteractive({ draggable: true, useHandCursor: true });
      handle.linkedPanda = panda;

      handle.on('drag', (pointer, dragX, dragY) => {
        handle.x = Math.round(dragX);
        handle.y = Math.round(dragY);
        panda.x = handle.x;
        panda.y = handle.y;
        this.updateLevelEditorDisplay();
      });
    });

    // Arrow keys for selected obstacle
    // UP/DOWN = make longer/shorter
    // LEFT/RIGHT = rotate
    this.input.keyboard.on('keydown-UP', () => {
      if (this.selectedObstacle && this.selectedObstacle.data) {
        const data = this.selectedObstacle.data;
        // Make longer
        if (data.h > data.w) {
          data.h = data.h + 10;
        } else {
          data.w = data.w + 10;
        }
        this.updateBambooVisual(this.selectedObstacle.bamboo, data);
        this.updateLevelEditorDisplay();
      }
    });

    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.selectedObstacle && this.selectedObstacle.data) {
        const data = this.selectedObstacle.data;
        // Make shorter
        if (data.h > data.w) {
          data.h = Math.max(50, data.h - 10);
        } else {
          data.w = Math.max(50, data.w - 10);
        }
        this.updateBambooVisual(this.selectedObstacle.bamboo, data);
        this.updateLevelEditorDisplay();
      }
    });

    this.input.keyboard.on('keydown-LEFT', () => {
      if (this.selectedObstacle && this.selectedObstacle.data) {
        const data = this.selectedObstacle.data;
        data.angle = (data.angle || 0) - 5;
        // Update bamboo rotation
        const baseAngle = data.h > data.w ? 90 : 0;
        this.selectedObstacle.bamboo.setAngle(baseAngle + data.angle);
        this.updateLevelEditorDisplay();
      }
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      if (this.selectedObstacle && this.selectedObstacle.data) {
        const data = this.selectedObstacle.data;
        data.angle = (data.angle || 0) + 5;
        // Update bamboo rotation
        const baseAngle = data.h > data.w ? 90 : 0;
        this.selectedObstacle.bamboo.setAngle(baseAngle + data.angle);
        this.updateLevelEditorDisplay();
      }
    });

    // F = fatter, T = thinner (adjust thickness)
    this.input.keyboard.on('keydown-F', () => {
      if (this.selectedObstacle && this.selectedObstacle.data) {
        const data = this.selectedObstacle.data;
        // Make fatter (increase the smaller dimension)
        if (data.h > data.w) {
          data.w = data.w + 5;
        } else {
          data.h = data.h + 5;
        }
        this.updateBambooVisual(this.selectedObstacle.bamboo, data);
        this.updateLevelEditorDisplay();
      }
    });

    this.input.keyboard.on('keydown-T', () => {
      if (this.selectedObstacle && this.selectedObstacle.data) {
        const data = this.selectedObstacle.data;
        // Make thinner (decrease the smaller dimension)
        if (data.h > data.w) {
          data.w = Math.max(10, data.w - 5);
        } else {
          data.h = Math.max(10, data.h - 5);
        }
        this.updateBambooVisual(this.selectedObstacle.bamboo, data);
        this.updateLevelEditorDisplay();
      }
    });

    // N key to spawn new bamboo at center
    this.input.keyboard.on('keydown-N', () => {
      this.spawnNewBamboo();
    });

    // Delete/Backspace to remove selected obstacle
    this.input.keyboard.on('keydown-BACKSPACE', () => {
      if (this.selectedObstacle) {
        this.deleteSelectedObstacle();
      }
    });

    // P key to toggle practice mode (allows shooting)
    this.input.keyboard.on('keydown-P', () => {
      this.practiceMode = !this.practiceMode;
      this.levelEnded = !this.practiceMode;
      this.bulletFired = false;
      this.ammoRemaining = 99;
      this.selectedAmmo = 20;

      // Destroy existing bullet if any
      if (this.bullet) {
        if (this.bullet.container) this.bullet.container.destroy();
        this.bullet.destroy();
        this.bullet = null;
      }

      this.practiceModeText.setText(this.practiceMode ? '🎯 PRACTICE MODE (P to edit)' : '✏️ EDIT MODE (P to practice)');
      this.practiceModeText.setColor(this.practiceMode ? '#00FF00' : '#FFFF00');
    });

    // Practice mode indicator
    this.practiceModeText = this.add.text(900, 40, '✏️ EDIT MODE (P to practice)', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#FFFF00',
      backgroundColor: '#000000'
    }).setDepth(1000);

    // Copy button - position it better
    const copyBtn = this.add.text(900, 10, '📋 COPY LEVEL CONFIG', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#000000',
      backgroundColor: '#00FF00',
      padding: { x: 10, y: 5 }
    }).setDepth(1000).setInteractive({ useHandCursor: true });

    copyBtn.on('pointerdown', () => {
      const config = this.generateLevelConfig();
      navigator.clipboard.writeText(config).then(() => {
        copyBtn.setText('✅ COPIED!');
        this.time.delayedCall(1000, () => copyBtn.setText('📋 COPY LEVEL CONFIG'));
      }).catch(err => {
        console.log('Level config:', config);
        copyBtn.setText('📝 SEE CONSOLE');
        this.time.delayedCall(1000, () => copyBtn.setText('📋 COPY LEVEL CONFIG'));
      });
    });

    this.updateLevelEditorDisplay();
  }

  updateLevelEditorDisplay() {
    if (!this.editorText) return;

    let info = `LEVEL ${this.level} EDITOR\n`;

    info += 'OBSTACLES:\n';
    this.editableObstacles.forEach((obs, i) => {
      const bamboo = obs.image;
      const isSelected = this.selectedObstacle && this.selectedObstacle.bamboo === bamboo;
      const selected = isSelected ? ' [SELECTED]' : '';
      info += `  ${i + 1}: (${Math.round(bamboo.x)}, ${Math.round(bamboo.y)}) ${obs.w}x${obs.h}${obs.angle ? ' @' + obs.angle + '°' : ''}${selected}\n`;
    });

    info += 'PANDAS:\n';
    this.pandas.forEach((panda, i) => {
      info += `  ${i + 1}: (${Math.round(panda.x)}, ${Math.round(panda.y)})\n`;
    });

    this.editorText.setText(info);
  }

  updateBambooVisual(bamboo, data) {
    // Fixed thickness matching the frame bamboo (like createObstacles)
    const BAMBOO_THICKNESS = 20;
    const length = Math.max(data.w, data.h);
    bamboo.setDisplaySize(length, BAMBOO_THICKNESS);

    // Update rotation
    const baseAngle = data.h > data.w ? 90 : 0;
    bamboo.setAngle(baseAngle + (data.angle || 0));
  }

  generateLevelConfig() {
    const obstacles = this.editableObstacles.map(obs => {
      const config = {
        x: Math.round(obs.image.x),
        y: Math.round(obs.image.y),
        w: obs.w,
        h: obs.h
      };
      if (obs.angle) config.angle = obs.angle;
      return config;
    });

    const pandas = this.pandas.map(p => ({
      x: Math.round(p.x),
      y: Math.round(p.y)
    }));

    const levelConfig = {
      ammo: this.ammoTotal,
      pandas: pandas,
      obstacles: obstacles,
      movingObstacles: []
    };

    return JSON.stringify(levelConfig, null, 2);
  }

  spawnNewBamboo() {
    // Spawn full-size bamboo like the frame - resize it down as needed
    // w=20 matches frame thickness, h=300 for a good starting length
    const newObs = { x: 600, y: 325, w: 20, h: 300, angle: 0 };
    const i = this.editableObstacles.length;

    // Create bamboo image with proper scaling
    const bamboo = this.add.image(newObs.x, newObs.y, 'bamboo');

    // Use updateBambooVisual for consistent scaling
    const obsData = { image: bamboo, index: i, w: newObs.w, h: newObs.h, angle: 0 };
    this.updateBambooVisual(bamboo, obsData);

    bamboo.editName = `bamboo${i + 1}`;
    bamboo.editData = obsData;
    this.editableObstacles.push(obsData);

    // Create drag handle
    const handle = this.add.circle(bamboo.x, bamboo.y, 25, 0xffff00, 0.3);
    handle.setDepth(1002);
    handle.setInteractive({ draggable: true, useHandCursor: true });
    handle.linkedBamboo = bamboo;
    handle.obsData = obsData;

    handle.on('drag', (pointer, dragX, dragY) => {
      handle.x = Math.round(dragX);
      handle.y = Math.round(dragY);
      bamboo.x = handle.x;
      bamboo.y = handle.y;
      this.updateLevelEditorDisplay();
    });

    handle.on('pointerdown', () => {
      if (this.selectedObstacle && this.selectedObstacle.handle) {
        this.selectedObstacle.handle.setFillStyle(0xffff00, 0.3);
      }
      this.selectedObstacle = { bamboo, handle, data: obsData };
      handle.setFillStyle(0x00ff00, 0.6);
      this.updateLevelEditorDisplay();
    });

    // Auto-select the new bamboo
    if (this.selectedObstacle && this.selectedObstacle.handle) {
      this.selectedObstacle.handle.setFillStyle(0xffff00, 0.3);
    }
    this.selectedObstacle = { bamboo, handle, data: obsData };
    handle.setFillStyle(0x00ff00, 0.6);

    this.updateLevelEditorDisplay();
  }

  deleteSelectedObstacle() {
    if (!this.selectedObstacle) return;

    const { bamboo, handle, data } = this.selectedObstacle;

    // Remove from editableObstacles array
    const idx = this.editableObstacles.indexOf(data);
    if (idx > -1) {
      this.editableObstacles.splice(idx, 1);
    }

    // Destroy the bamboo and handle
    if (handle) handle.destroy();
    bamboo.destroy();

    this.selectedObstacle = null;
    this.updateLevelEditorDisplay();
  }

  clearTrajectory() {
    if (this.trajectoryDots) {
      this.trajectoryDots.forEach(dot => dot.destroy());
      this.trajectoryDots = [];
    }
    if (this.predictionDots) {
      this.predictionDots.forEach(dot => dot.destroy());
      this.predictionDots = [];
    }
  }

  update(time, delta) {
    this.gameTime += delta / 1000;

    // Update moving obstacles
    this.updateMovingObstacles();

    // Always show aim line when not firing (mouse anywhere)
    if (!this.bulletFired && this.ammoRemaining > 0) {
      const pointer = this.input.activePointer;
      this.updateAimLine(pointer);
    }

    // Track actual bullet trajectory in practice mode (shows path after shooting)
    if (this.practiceMode && this.bullet && this.bulletFired) {
      if (!this.trajectoryDots) this.trajectoryDots = [];
      if (this.trajectoryDots.length < 500) {
        const dot = this.add.circle(this.bullet.x, this.bullet.y, 3, 0xff0000, 1);
        dot.setDepth(2000);
        this.trajectoryDots.push(dot);
      }
    }

    // Check if bullet has slowed down too much (stuck)
    if (this.bullet && this.bulletFired && this.bullet.body) {
      const speed = Math.sqrt(
        this.bullet.body.velocity.x ** 2 +
        this.bullet.body.velocity.y ** 2
      );

      if (speed < 50) {
        this.destroyBullet();
      }

      // Make pandas react when bolt gets close!
      this.checkPandaProximity();
    }
  }

  checkPandaProximity() {
    if (!this.bullet || !this.bullet.body) return;

    const bulletX = this.bullet.body.x + this.bullet.body.width / 2;
    const bulletY = this.bullet.body.y + this.bullet.body.height / 2;

    this.pandas.forEach(panda => {
      if (!panda.active) return;

      const dist = Phaser.Math.Distance.Between(bulletX, bulletY, panda.x, panda.y);

      // Pandas get scared when bolt is close!
      if (dist < 120 && !panda.scared) {
        panda.scared = true;

        // Shake the panda
        this.tweens.add({
          targets: panda,
          x: panda.x + 3,
          duration: 50,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            panda.scared = false;
          }
        });

        // Show fear indicator
        const fearText = this.add.text(panda.x, panda.y - 45, '😨', {
          fontSize: '20px'
        }).setOrigin(0.5);

        this.tweens.add({
          targets: fearText,
          y: fearText.y - 20,
          alpha: 0,
          duration: 400,
          onComplete: () => fearText.destroy()
        });
      }
    });
  }

  createStarryBackground() {
    // Dark gradient background
    const bg = this.add.graphics();
    bg.setDepth(-10);

    // Very dark blue-black gradient
    bg.fillGradientStyle(0x050510, 0x050510, 0x0a0a18, 0x0a0a18, 1);
    bg.fillRect(0, 0, 1200, 650);

    // Add stars - mix of sizes and brightness
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(30, 1170);
      const y = Phaser.Math.Between(30, 620);
      const size = Math.random() < 0.8 ? 1 : (Math.random() < 0.9 ? 1.5 : 2);
      const alpha = 0.3 + Math.random() * 0.5;

      const star = this.add.circle(x, y, size, 0xFFFFFF, alpha);
      star.setDepth(-9);

      // Some stars twinkle
      if (Math.random() < 0.3) {
        this.tweens.add({
          targets: star,
          alpha: alpha * 0.3,
          duration: 1000 + Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }

    // Add a few brighter stars
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(50, 1150);
      const y = Phaser.Math.Between(50, 400);

      // Star glow
      const glow = this.add.circle(x, y, 4, 0xFFFFFF, 0.1);
      glow.setDepth(-9);

      // Star core
      const star = this.add.circle(x, y, 2, 0xFFFFFF, 0.8);
      star.setDepth(-8);

      // Twinkle
      this.tweens.add({
        targets: [star, glow],
        alpha: { from: star.alpha, to: star.alpha * 0.4 },
        scale: { from: 1, to: 0.8 },
        duration: 1500 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createBambooWalls() {
    this.walls = [];
    const wallThickness = 20;
    const gameWidth = 1200;
    const gameHeight = 650; // Reduced height - no UI panel at bottom anymore

    // Create invisible physics walls
    // Top
    const topWall = this.add.rectangle(gameWidth / 2, wallThickness / 2, gameWidth, wallThickness, 0x000000, 0);
    this.physics.add.existing(topWall, true);
    this.walls.push(topWall);

    // Bottom
    const bottomWall = this.add.rectangle(gameWidth / 2, gameHeight - wallThickness / 2, gameWidth, wallThickness, 0x000000, 0);
    this.physics.add.existing(bottomWall, true);
    this.walls.push(bottomWall);

    // Left
    const leftWall = this.add.rectangle(wallThickness / 2, gameHeight / 2, wallThickness, gameHeight, 0x000000, 0);
    this.physics.add.existing(leftWall, true);
    this.walls.push(leftWall);

    // Right
    const rightWall = this.add.rectangle(gameWidth - wallThickness / 2, gameHeight / 2, wallThickness, gameHeight, 0x000000, 0);
    this.physics.add.existing(rightWall, true);
    this.walls.push(rightWall);

    // Bamboo frame - bamboo image is 3390x70 (tightly cropped, no padding)
    const bambooThickness = 20;

    // Top bamboo (horizontal) - use setDisplaySize for exact dimensions
    const topBamboo = this.add.image(gameWidth / 2, bambooThickness / 2, 'bamboo');
    topBamboo.setDisplaySize(gameWidth, bambooThickness);
    topBamboo.setDepth(10);

    // Bottom bamboo (horizontal)
    const bottomBamboo = this.add.image(gameWidth / 2, gameHeight - bambooThickness / 2, 'bamboo');
    bottomBamboo.setDisplaySize(gameWidth, bambooThickness);
    bottomBamboo.setDepth(10);

    // Left bamboo (vertical) - use setDisplaySize then rotate
    const leftBamboo = this.add.image(bambooThickness / 2, gameHeight / 2, 'bamboo');
    leftBamboo.setDisplaySize(gameHeight, bambooThickness);
    leftBamboo.setAngle(90);
    leftBamboo.setDepth(5);

    // Right bamboo (vertical)
    const rightBamboo = this.add.image(gameWidth - bambooThickness / 2, gameHeight / 2, 'bamboo');
    rightBamboo.setDisplaySize(gameHeight, bambooThickness);
    rightBamboo.setAngle(90);
    rightBamboo.setDepth(5);
  }

  adjustColor(color, amount) {
    const r = Math.min(255, Math.max(0, ((color >> 16) & 0xFF) + amount));
    const g = Math.min(255, Math.max(0, ((color >> 8) & 0xFF) + amount));
    const b = Math.min(255, Math.max(0, (color & 0xFF) + amount));
    return (r << 16) | (g << 8) | b;
  }

  createObstacles(obstacles) {
    obstacles.forEach((obs, index) => {
      const angle = obs.angle || 0;
      const isVertical = obs.h > obs.w;
      const length = Math.max(obs.w, obs.h);
      const thickness = Math.min(obs.w, obs.h);

      // Draw bamboo - setDisplaySize(length, thickness) then rotate if vertical
      const bamboo = this.add.image(obs.x, obs.y, 'bamboo');
      bamboo.setDisplaySize(length, thickness);
      // Rotate 90 if vertical, then add any custom angle
      const baseAngle = isVertical ? 90 : 0;
      bamboo.setAngle(baseAngle + angle);
      this.obstacleImages.push(bamboo);

      // Store for edit mode
      if (this.editMode) {
        this.editableObstacles.push({
          image: bamboo,
          index: index,
          w: obs.w,
          h: obs.h,
          angle: angle
        });
      }

      // Physics hitbox - exact w,h from config, visible in red only in edit mode
      const hitboxAlpha = this.editMode ? 0.3 : 0;

      // Check if angle is axis-aligned (0, 90, 180, 270) - use single rectangle
      const isAxisAligned = angle % 90 === 0;

      if (isAxisAligned) {
        // Axis-aligned: single rectangle hitbox
        // For 90/270 angles, swap width and height
        const swapDimensions = angle === 90 || angle === 270;
        const hitboxW = swapDimensions ? obs.h : obs.w;
        const hitboxH = swapDimensions ? obs.w : obs.h;
        const wall = this.add.rectangle(obs.x, obs.y, hitboxW, hitboxH, 0xff0000, hitboxAlpha);
        this.physics.add.existing(wall, true);
        this.walls.push(wall);
      } else {
        // Non-axis-aligned: create overlapping colliders along the rotated length
        const totalAngle = baseAngle + angle;
        const totalAngleRad = Phaser.Math.DegToRad(totalAngle);
        const numSegments = Math.ceil(length / 10); // More segments, closer together

        for (let i = 0; i < numSegments; i++) {
          const t = (i + 0.5) / numSegments - 0.5; // -0.5 to 0.5
          const segX = obs.x + Math.cos(totalAngleRad) * (t * length);
          const segY = obs.y + Math.sin(totalAngleRad) * (t * length);

          // Larger overlapping segments to avoid gaps
          const segment = this.add.rectangle(segX, segY, thickness + 15, thickness + 15, 0xff0000, hitboxAlpha);
          this.physics.add.existing(segment, true);
          this.walls.push(segment);
        }
      }
    });
  }

  createMovingObstacles(movingObs) {
    movingObs.forEach(obs => {
      const container = this.add.container(obs.x, obs.y);

      // Bamboo image is 3390x70 (tightly cropped)
      const BAMBOO_WIDTH = 3390;
      const BAMBOO_HEIGHT = 70;
      const length = Math.max(obs.w, obs.h);
      const scale = length / BAMBOO_WIDTH;
      const visualThickness = BAMBOO_HEIGHT * scale;

      // Physics body - minimum 20px thick to prevent bullet tunneling
      const isVertical = obs.h > obs.w;
      const minThickness = Math.max(visualThickness, 20);
      const hitboxW = isVertical ? minThickness : length;
      const hitboxH = isVertical ? length : minThickness;
      const wall = this.add.rectangle(0, 0, hitboxW, hitboxH, 0x000000, 0);
      this.physics.add.existing(wall, true);

      // Visual - bamboo
      const bamboo = this.add.image(0, 0, 'bamboo');
      bamboo.setScale(scale);
      // Rotate if vertical
      bamboo.setAngle(isVertical ? 90 : 0);

      container.add([bamboo, wall]);

      // Store movement data
      const movingWall = {
        container,
        wall,
        baseX: obs.x,
        baseY: obs.y,
        moveX: obs.moveX || 0,
        moveY: obs.moveY || 0,
        speed: obs.speed || 1,
        offset: obs.offset || 0
      };

      this.movingWalls.push(movingWall);
      this.walls.push(wall);
    });
  }

  drawMovingObstacleGraphics(graphics, x, y, width, height) {
    // Darker, more menacing look for moving obstacles
    graphics.fillStyle(0x3A2020);
    graphics.fillRoundedRect(x, y, width, height, 4);

    graphics.fillStyle(0x5A3030);
    graphics.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, 3);

    // Metal edges
    graphics.lineStyle(2, COLORS.steel, 0.8);
    graphics.strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, 4);

    // Danger markings
    graphics.fillStyle(COLORS.bloodRed, 0.6);
    const stripeWidth = 8;
    for (let i = 0; i < width + height; i += stripeWidth * 2) {
      graphics.fillRect(x + i, y, stripeWidth, Math.min(4, height));
    }
  }

  updateMovingObstacles() {
    this.movingWalls.forEach(mw => {
      const t = this.gameTime * mw.speed + mw.offset * Math.PI * 2;
      const offsetX = Math.sin(t * Math.PI) * mw.moveX;
      const offsetY = Math.sin(t * Math.PI) * mw.moveY;

      mw.container.x = mw.baseX + offsetX;
      mw.container.y = mw.baseY + offsetY;

      // Update physics body position
      mw.wall.body.position.x = mw.container.x - mw.wall.width / 2;
      mw.wall.body.position.y = mw.container.y - mw.wall.height / 2;
    });
  }

  drawStoneObstacleGraphics(graphics, x, y, width, height, isHorizontal) {
    // Base
    graphics.fillStyle(COLORS.stoneDark);
    graphics.fillRoundedRect(x, y, width, height, 5);

    // Stone texture
    graphics.fillStyle(COLORS.stoneMid);
    graphics.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, 4);

    // Highlight
    graphics.fillStyle(COLORS.stoneLight, 0.4);
    if (isHorizontal) {
      graphics.fillRect(x + 5, y + 3, width - 10, 4);
    } else {
      graphics.fillRect(x + 3, y + 5, 4, height - 10);
    }

    // Cracks
    graphics.lineStyle(1, COLORS.mortar, 0.6);
    if (isHorizontal && width > 30) {
      const numCracks = Math.floor(width / 50);
      for (let i = 1; i <= numCracks; i++) {
        const cx = x + (i * width) / (numCracks + 1);
        graphics.beginPath();
        graphics.moveTo(cx, y + 2);
        graphics.lineTo(cx + Phaser.Math.Between(-5, 5), y + height - 2);
        graphics.strokePath();
      }
    } else if (height > 30) {
      const numCracks = Math.floor(height / 50);
      for (let i = 1; i <= numCracks; i++) {
        const cy = y + (i * height) / (numCracks + 1);
        graphics.beginPath();
        graphics.moveTo(x + 2, cy);
        graphics.lineTo(x + width - 2, cy + Phaser.Math.Between(-5, 5));
        graphics.strokePath();
      }
    }
  }

  createAmbientParticles() {
    // Floating dust particles
    this.time.addEvent({
      delay: 500,
      callback: () => {
        const dust = this.add.circle(
          Phaser.Math.Between(50, 750),
          Phaser.Math.Between(50, 500),
          1,
          0xFFFFFF,
          0.2
        );

        this.tweens.add({
          targets: dust,
          y: dust.y - 30,
          x: dust.x + Phaser.Math.Between(-20, 20),
          alpha: 0,
          duration: 3000,
          ease: 'Sine.easeInOut',
          onComplete: () => dust.destroy()
        });
      },
      repeat: -1
    });
  }

  createChandeliers(chandelierPositions) {
    this.chandeliers = [];
    chandelierPositions.forEach(pos => {
      const chandelier = this.createChandelier(pos.x, pos.y);
      this.chandeliers.push(chandelier);
    });
  }

  createChandelier(x, y) {
    const container = this.add.container(x, y);

    // Chain connecting to ceiling
    const chainGraphics = this.add.graphics();
    chainGraphics.lineStyle(3, 0x888888);
    chainGraphics.beginPath();
    chainGraphics.moveTo(0, -y + 20); // To top of screen
    chainGraphics.lineTo(0, 0);
    chainGraphics.strokePath();

    // Chain links
    for (let i = 0; i < (y - 20) / 15; i++) {
      const linkY = -y + 20 + i * 15;
      chainGraphics.fillStyle(0x666666);
      chainGraphics.fillEllipse(0, linkY + 7, 4, 6);
    }

    // Main chandelier body - ornate golden frame
    const frameGraphics = this.add.graphics();

    // Top crown
    frameGraphics.fillStyle(0xC9A227);
    frameGraphics.fillTriangle(-5, -25, 5, -25, 0, -35);

    // Main body ring
    frameGraphics.lineStyle(4, 0xC9A227);
    frameGraphics.strokeEllipse(0, 0, 60, 20);

    // Candle holders (5 candles)
    const candleAngles = [-60, -30, 0, 30, 60];
    candleAngles.forEach(angle => {
      const rad = Phaser.Math.DegToRad(angle);
      const cx = Math.sin(rad) * 30;
      const cy = Math.cos(rad) * 10;

      // Holder
      frameGraphics.fillStyle(0xC9A227);
      frameGraphics.fillRect(cx - 3, cy - 5, 6, 10);

      // Candle
      frameGraphics.fillStyle(0xF5F5DC);
      frameGraphics.fillRect(cx - 2, cy - 20, 4, 15);

      // Flame
      frameGraphics.fillStyle(0xFF6B35);
      frameGraphics.fillTriangle(cx - 3, cy - 20, cx + 3, cy - 20, cx, cy - 30);
      frameGraphics.fillStyle(0xFFD700);
      frameGraphics.fillTriangle(cx - 2, cy - 22, cx + 2, cy - 22, cx, cy - 28);
    });

    // Bottom ornament
    frameGraphics.fillStyle(0xC9A227);
    frameGraphics.fillTriangle(-8, 15, 8, 15, 0, 30);

    // Crystals hanging
    frameGraphics.fillStyle(0xADD8E6, 0.7);
    [-20, -10, 10, 20].forEach(offset => {
      frameGraphics.fillTriangle(offset - 3, 10, offset + 3, 10, offset, 25);
    });

    container.add([chainGraphics, frameGraphics]);

    // Add glow effect
    const glow = this.add.circle(0, -10, 50, 0xFFAA00, 0.15);
    container.add(glow);

    // Flicker animation for the glow
    this.tweens.add({
      targets: glow,
      alpha: 0.08,
      scale: 0.9,
      duration: 200 + Math.random() * 100,
      yoyo: true,
      repeat: -1
    });

    // Gentle sway animation
    this.tweens.add({
      targets: container,
      angle: 2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Physics body for the chandelier - OUTSIDE container so physics works
    const hitbox = this.add.circle(x, y, 25, 0xFF0000, 0); // Smaller hitbox - must hit the chandelier
    this.physics.add.existing(hitbox, true);

    // Physics body for the rope/chain - tall thin rectangle from ceiling to chandelier
    const ropeHitbox = this.add.rectangle(x, y / 2, 6, y - 20, 0x00FF00, 0); // Thin rope hitbox
    this.physics.add.existing(ropeHitbox, true);

    // Store references
    container.hitbox = hitbox;
    container.ropeHitbox = ropeHitbox;
    container.chainGraphics = chainGraphics;
    container.glow = glow;
    container.isFalling = false;
    container.startY = y;

    return container;
  }

  dropChandelier(chandelier) {
    if (chandelier.isFalling) return;
    chandelier.isFalling = true;

    // Stop the sway
    this.tweens.killTweensOf(chandelier);
    chandelier.angle = 0;

    // Snap the chain - visual effect
    chandelier.chainGraphics.clear();

    // Create falling chain pieces
    for (let i = 0; i < 5; i++) {
      const chainPiece = this.add.ellipse(
        chandelier.x + Phaser.Math.Between(-10, 10),
        chandelier.startY - 50 - i * 30,
        4, 8, 0x666666
      );
      this.tweens.add({
        targets: chainPiece,
        y: chainPiece.y + 200,
        x: chainPiece.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: 800,
        ease: 'Bounce.easeOut',
        onComplete: () => chainPiece.destroy()
      });
    }

    // Spark effect at break point
    for (let i = 0; i < 10; i++) {
      const spark = this.add.circle(
        chandelier.x,
        40,
        2,
        0xFFD700
      );
      this.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-40, 40),
        y: spark.y + Phaser.Math.Between(-20, 40),
        alpha: 0,
        duration: 300,
        onComplete: () => spark.destroy()
      });
    }

    // Make chandelier fall with physics
    chandelier.hitbox.body.enable = false; // Disable static body

    // Animate the fall
    this.tweens.add({
      targets: chandelier,
      y: 600, // Fall to near bottom
      angle: Phaser.Math.Between(-15, 15),
      duration: 800,
      ease: 'Bounce.easeOut',
      onUpdate: () => {
        // Check for panda collisions during fall
        this.checkChandelierPandaCollision(chandelier);
      },
      onComplete: () => {
        // Crash effect
        this.createChandelierCrash(chandelier.x, 580);
        chandelier.destroy();

        // Remove from array
        const index = this.chandeliers.indexOf(chandelier);
        if (index > -1) this.chandeliers.splice(index, 1);
      }
    });
  }

  checkChandelierPandaCollision(chandelier) {
    this.pandas.forEach(panda => {
      if (!panda.active) return;

      const dist = Phaser.Math.Distance.Between(
        chandelier.x, chandelier.y,
        panda.x, panda.y
      );

      // If chandelier is close enough and below its starting position
      if (dist < 70 && chandelier.y > chandelier.startY + 50) {
        this.onPandaHit(panda);
      }
    });
  }

  createChandelierCrash(x, y) {
    // Screen shake
    this.cameras.main.shake(200, 0.015);

    // Explosion of crystals and metal
    for (let i = 0; i < 20; i++) {
      const iscrystal = Math.random() > 0.5;
      const piece = this.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 10),
        iscrystal ? 4 : 3,
        iscrystal ? 0xADD8E6 : 0xC9A227
      );

      this.tweens.add({
        targets: piece,
        x: piece.x + Phaser.Math.Between(-80, 80),
        y: piece.y + Phaser.Math.Between(-60, 20),
        alpha: 0,
        scale: 0.3,
        duration: 600 + Math.random() * 400,
        ease: 'Sine.easeOut',
        onComplete: () => piece.destroy()
      });
    }

    // Fire burst
    for (let i = 0; i < 8; i++) {
      const flame = this.add.circle(
        x + Phaser.Math.Between(-30, 30),
        y + Phaser.Math.Between(-20, 0),
        8 + Math.random() * 8,
        Math.random() > 0.5 ? 0xFF6B35 : 0xFFD700,
        0.8
      );

      this.tweens.add({
        targets: flame,
        y: flame.y - 40,
        alpha: 0,
        scale: 2,
        duration: 400,
        onComplete: () => flame.destroy()
      });
    }

    // Smoke
    for (let i = 0; i < 5; i++) {
      const smoke = this.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y,
        15 + Math.random() * 10,
        0x333333,
        0.5
      );

      this.tweens.add({
        targets: smoke,
        y: smoke.y - 80,
        scale: 2.5,
        alpha: 0,
        duration: 1000,
        onComplete: () => smoke.destroy()
      });
    }
  }

  createPandas(pandaPositions) {
    this.pandas = [];
    this.pandaIndex = 0; // Track which panda sprite to use
    pandaPositions.forEach(pos => {
      const panda = this.createPanda(pos.x, pos.y);
      this.pandas.push(panda);
    });
  }

  createPanda(x, y) {
    const container = this.add.container(x, y);

    // Cycle through different villain pandas
    const pandaTypes = ['panda-jason', 'panda-pennywise', 'panda-freddy', 'panda-leatherface', 'panda-beetlejuice'];
    const pandaType = pandaTypes[this.pandaIndex % pandaTypes.length];
    this.pandaIndex++;

    // Shadow under panda
    const shadow = this.add.ellipse(0, 30, 40, 12, 0x000000, 0.4);

    // Use the sprite image!
    const pandaSprite = this.add.image(0, 0, pandaType);
    pandaSprite.setScale(0.08); // Slightly bigger for better visibility
    pandaSprite.setOrigin(0.5, 0.5); // Center origin

    container.add([shadow, pandaSprite]);

    // Physics - generous hitbox for easier hits
    this.physics.add.existing(container);
    container.body.setCircle(45);
    container.body.setOffset(-45, -45);
    container.body.setImmovable(true);

    // Menacing floating animation
    this.tweens.add({
      targets: container,
      y: y - 8,
      duration: 800 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return container;
  }

  createBunny() {
    const x = 100;
    const y = 630; // Bottom bamboo starts at y=630 (650-20), bunny feet should be exactly there

    this.bunny = this.add.container(x, y);

    // Use the selected skin with its specific offsets
    const skinConfig = BUNNY_SKINS.find(s => s.id === currentSkin) || BUNNY_SKINS[0];
    const bunnySprite = this.add.image(skinConfig.offsetX, skinConfig.offsetY, currentSkin);
    bunnySprite.setScale(skinConfig.scale);
    bunnySprite.setOrigin(0.5, 1); // Origin at bottom center so feet touch floor

    // Ground shadow - positioned at the bunny's feet
    const shadow = this.add.ellipse(0, 0, 45, 12, 0x000000, 0.4);

    this.bunny.add([shadow, bunnySprite]);
    this.bunny.skinConfig = skinConfig; // Store for reference

    // Store gun offset for bullet firing - uses per-skin values
    this.bunny.gunOffsetX = skinConfig.gunX;
    this.bunny.gunOffsetY = skinConfig.gunY;

    // Subtle idle bob
    this.tweens.add({
      targets: this.bunny,
      y: y - 3,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  setupNavButtons() {
    // Home button - return to main menu
    const homeBtn = document.getElementById('btn-home');
    if (homeBtn) {
      homeBtn.onclick = () => {
        // Hide UI elements
        document.getElementById('sidebar')?.classList.remove('visible');
        // Reset game state
        this.level = 1;
        this.score = 0;
        // Go to main menu
        this.scene.start('MainMenuScene');
      };
    }

    // Settings button - show settings
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
      settingsBtn.onclick = () => {
        this.showSettingsModal();
      };
    }

    // Levels button - show level select
    const levelsBtn = document.getElementById('btn-levels');
    if (levelsBtn) {
      levelsBtn.onclick = () => {
        this.showLevelSelectModal();
      };
    }

    // Skins button - show skin selection
    const skinsBtn = document.getElementById('btn-skins');
    if (skinsBtn) {
      skinsBtn.onclick = () => {
        this.showSkinsModal();
      };
    }

    // Update level/score display
    this.updateHtmlUI();
  }

  updateHtmlUI() {
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');
    if (levelDisplay) levelDisplay.textContent = `LEVEL ${this.level}`;
    if (scoreDisplay) scoreDisplay.textContent = `Score: ${this.score}`;
  }

  showChallengePopup(title, text) {
    // Block shooting while popup is visible
    this.challengePopupActive = true;

    // Create challenge overlay
    const overlay = this.add.rectangle(600, 325, 1200, 650, 0x000000, 0.85);
    overlay.setDepth(3000);

    const container = this.add.container(600, 325);
    container.setDepth(3001);

    // Glowing border box
    const boxBg = this.add.rectangle(0, 0, 500, 280, 0x1A1714, 0.95);
    boxBg.setStrokeStyle(3, 0xFFD700);

    // Title with dramatic styling
    const titleText = this.add.text(0, -80, title, {
      fontSize: '32px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Challenge description
    const descText = this.add.text(0, 0, text, {
      fontSize: '20px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#CCCCCC',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // "Tap to begin" prompt
    const tapText = this.add.text(0, 90, '[ Tap anywhere to begin ]', {
      fontSize: '14px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#888888'
    }).setOrigin(0.5);

    // Pulse animation on tap text
    this.tweens.add({
      targets: tapText,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    container.add([boxBg, titleText, descText, tapText]);

    // Dismiss on tap (use pointerup to prevent immediate shot)
    this.input.once('pointerup', () => {
      this.tweens.add({
        targets: [overlay, container],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          overlay.destroy();
          container.destroy();
          // Delay unblocking to prevent accidental shot
          this.time.delayedCall(100, () => {
            this.challengePopupActive = false;
          });
        }
      });
    });
  }

  showSettingsModal() {
    // Create settings overlay
    if (this.settingsOverlay) return; // Already open

    this.settingsOverlay = this.add.container(600, 325);
    this.settingsOverlay.setDepth(2000);

    // Dark background
    const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xC9A86C);

    // Title
    const title = this.add.text(0, -110, 'SETTINGS', {
      fontSize: '24px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFD700'
    }).setOrigin(0.5);

    // Sound toggle
    const soundLabel = this.add.text(-80, -50, 'Sound:', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#CCCCCC'
    }).setOrigin(0, 0.5);

    const soundStatus = this.add.text(80, -50, soundManager.enabled ? 'ON' : 'OFF', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: soundManager.enabled ? '#88CC88' : '#CC8888'
    }).setOrigin(0.5);

    soundStatus.setInteractive({ useHandCursor: true });
    soundStatus.on('pointerdown', () => {
      const enabled = soundManager.toggleSound();
      soundStatus.setText(enabled ? 'ON' : 'OFF');
      soundStatus.setColor(enabled ? '#88CC88' : '#CC8888');
      if (enabled) soundManager.playClick();
    });

    // Music toggle
    const musicLabel = this.add.text(-80, -5, 'Music:', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#CCCCCC'
    }).setOrigin(0, 0.5);

    const musicStatus = this.add.text(80, -5, soundManager.musicEnabled ? 'ON' : 'OFF', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: soundManager.musicEnabled ? '#88CC88' : '#CC8888'
    }).setOrigin(0.5);

    musicStatus.setInteractive({ useHandCursor: true });
    musicStatus.on('pointerdown', () => {
      const enabled = soundManager.toggleMusic();
      musicStatus.setText(enabled ? 'ON' : 'OFF');
      musicStatus.setColor(enabled ? '#88CC88' : '#CC8888');
      soundManager.playClick();
    });

    // Skin label centered
    const skinLabel = this.add.text(0, 35, 'Skin:', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#CCCCCC'
    }).setOrigin(0.5);

    // Create skin option buttons on line below, centered
    const skinButtons = [];
    const skinSpacing = 80;
    const totalWidth = (BUNNY_SKINS.length - 1) * skinSpacing;
    const skinStartX = -totalWidth / 2;

    BUNNY_SKINS.forEach((skin, i) => {
      const btnX = skinStartX + i * skinSpacing;
      const isSelected = currentSkin === skin.id;

      const skinText = this.add.text(btnX, 65, skin.name, {
        fontSize: '14px',
        fontFamily: 'Cinzel, Georgia, serif',
        color: isSelected ? '#FFD700' : '#888888'
      }).setOrigin(0.5);

      skinText.setInteractive({ useHandCursor: true });
      skinText.on('pointerover', () => {
        if (currentSkin !== skin.id) skinText.setColor('#C9A86C');
      });
      skinText.on('pointerout', () => {
        skinText.setColor(currentSkin === skin.id ? '#FFD700' : '#888888');
      });
      skinText.on('pointerdown', () => {
        currentSkin = skin.id;
        localStorage.setItem('bunnySkin', skin.id);
        // Update all skin button colors
        skinButtons.forEach((btn, idx) => {
          btn.setColor(BUNNY_SKINS[idx].id === currentSkin ? '#FFD700' : '#888888');
        });
        this.updateBunnySkin();
      });

      skinButtons.push(skinText);
    });

    // Close button
    const closeBtn = this.add.container(0, 115);
    const closeBg = this.add.rectangle(0, 0, 120, 40, 0x2A2520);
    closeBg.setStrokeStyle(2, 0x8B7355);
    const closeText = this.add.text(0, 0, 'CLOSE', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#C9A86C'
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeText]);

    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on('pointerover', () => {
      closeBg.setFillStyle(0x3A3530);
      closeText.setColor('#FFD700');
    });
    closeBg.on('pointerout', () => {
      closeBg.setFillStyle(0x2A2520);
      closeText.setColor('#C9A86C');
    });
    closeBg.on('pointerdown', () => {
      this.settingsOverlay.destroy();
      // Delay clearing the flag so the pointerup doesn't trigger a shot
      this.time.delayedCall(200, () => {
        this.settingsOverlay = null;
      });
    });

    this.settingsOverlay.add([bg, title, soundLabel, soundStatus, musicLabel, musicStatus, skinLabel, ...skinButtons, closeBtn]);
  }

  showControlsModal() {
    // Create controls overlay
    if (this.settingsOverlay) return; // Already open

    this.settingsOverlay = this.add.container(600, 325);
    this.settingsOverlay.setDepth(2000);

    // Dark background
    const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xC9A86C);

    // Title
    const title = this.add.text(0, -120, 'CONTROLS', {
      fontSize: '24px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFD700'
    }).setOrigin(0.5);

    // Column headers
    const buttonHeader = this.add.text(-80, -80, 'BUTTON', {
      fontSize: '14px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const actionHeader = this.add.text(80, -80, 'ACTION', {
      fontSize: '14px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#888888'
    }).setOrigin(0.5);

    // Control instructions
    const controls = [
      { key: 'CLICK', action: 'Shoot' },
      { key: '1-9', action: 'Select ammo' },
      { key: 'R', action: 'Restart level' },
      { key: 'S', action: 'Skip level' }
    ];

    const controlTexts = [buttonHeader, actionHeader];
    controls.forEach((ctrl, i) => {
      const keyText = this.add.text(-80, -45 + i * 35, ctrl.key, {
        fontSize: '16px',
        fontFamily: 'Cinzel, Georgia, serif',
        color: '#FFD700'
      }).setOrigin(0, 0.5);

      const actionText = this.add.text(80, -45 + i * 35, ctrl.action, {
        fontSize: '16px',
        fontFamily: 'Cinzel, Georgia, serif',
        color: '#CCCCCC'
      }).setOrigin(0.5);

      controlTexts.push(keyText, actionText);
    });

    // Close button
    const closeBtn = this.add.container(0, 110);
    const closeBg = this.add.rectangle(0, 0, 120, 40, 0x2A2520);
    closeBg.setStrokeStyle(2, 0x8B7355);
    const closeText = this.add.text(0, 0, 'CLOSE', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#C9A86C'
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeText]);

    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on('pointerover', () => {
      closeBg.setFillStyle(0x3A3530);
      closeText.setColor('#FFD700');
    });
    closeBg.on('pointerout', () => {
      closeBg.setFillStyle(0x2A2520);
      closeText.setColor('#C9A86C');
    });
    closeBg.on('pointerdown', () => {
      this.settingsOverlay.destroy();
      // Delay clearing the flag so the pointerup doesn't trigger a shot
      this.time.delayedCall(200, () => {
        this.settingsOverlay = null;
      });
    });

    this.settingsOverlay.add([bg, title, ...controlTexts, closeBtn]);
  }

  showSkinsModal() {
    // Create skins overlay
    if (this.settingsOverlay) return; // Already open

    this.settingsOverlay = this.add.container(600, 325);
    this.settingsOverlay.setDepth(2000);

    // Dark background
    const bg = this.add.rectangle(0, 0, 400, 250, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xC9A86C);

    // Title
    const title = this.add.text(0, -90, 'SELECT SKIN', {
      fontSize: '24px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFD700'
    }).setOrigin(0.5);

    const skinButtons = [];
    const skinBtnWidth = 100;
    const skinSpacing = 110;
    const startX = -((BUNNY_SKINS.length - 1) * skinSpacing) / 2;

    BUNNY_SKINS.forEach((skin, i) => {
      const btnX = startX + i * skinSpacing;
      const btnContainer = this.add.container(btnX, -20);

      const btnBg = this.add.rectangle(0, 0, skinBtnWidth, 40, 0x2A2520);
      btnBg.setStrokeStyle(2, currentSkin === skin.id ? 0xFFD700 : 0x8B7355);

      const btnText = this.add.text(0, 0, skin.name, {
        fontSize: '14px',
        fontFamily: 'Cinzel, Georgia, serif',
        color: currentSkin === skin.id ? '#FFD700' : '#C9A86C'
      }).setOrigin(0.5);

      btnContainer.add([btnBg, btnText]);

      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x3A3530);
      });
      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0x2A2520);
      });
      btnBg.on('pointerdown', () => {
        // Update skin
        currentSkin = skin.id;
        localStorage.setItem('bunnySkin', skin.id);

        // Update all button styles
        skinButtons.forEach((sb, idx) => {
          const isSelected = BUNNY_SKINS[idx].id === currentSkin;
          sb.bg.setStrokeStyle(2, isSelected ? 0xFFD700 : 0x8B7355);
          sb.text.setColor(isSelected ? '#FFD700' : '#C9A86C');
        });

        // Update bunny sprite immediately
        this.updateBunnySkin();
      });

      skinButtons.push({ container: btnContainer, bg: btnBg, text: btnText });
    });

    // Close button
    const closeBtn = this.add.container(0, 80);
    const closeBg = this.add.rectangle(0, 0, 120, 40, 0x2A2520);
    closeBg.setStrokeStyle(2, 0x8B7355);
    const closeText = this.add.text(0, 0, 'CLOSE', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#C9A86C'
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeText]);

    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on('pointerover', () => {
      closeBg.setFillStyle(0x3A3530);
      closeText.setColor('#FFD700');
    });
    closeBg.on('pointerout', () => {
      closeBg.setFillStyle(0x2A2520);
      closeText.setColor('#C9A86C');
    });
    closeBg.on('pointerdown', () => {
      this.settingsOverlay.destroy();
      // Delay resetting to null to prevent shot on pointerup
      this.time.delayedCall(200, () => {
        this.settingsOverlay = null;
      });
    });

    this.settingsOverlay.add([bg, title, ...skinButtons.map(sb => sb.container), closeBtn]);
  }

  updateBunnySkin() {
    if (this.bunny && this.bunny.list) {
      // Find and update the bunny sprite (it's the second item after shadow)
      const bunnySprite = this.bunny.list.find(child => child.type === 'Image');
      if (bunnySprite) {
        const skinConfig = BUNNY_SKINS.find(s => s.id === currentSkin) || BUNNY_SKINS[0];
        bunnySprite.setTexture(currentSkin);
        bunnySprite.setPosition(skinConfig.offsetX, skinConfig.offsetY);
        bunnySprite.setScale(skinConfig.scale);
        this.bunny.skinConfig = skinConfig;
        // Update gun offsets for aim line
        this.bunny.gunOffsetX = skinConfig.gunX;
        this.bunny.gunOffsetY = skinConfig.gunY;
      }
    }
  }

  showLevelSelectModal() {
    // Create level select overlay
    if (this.settingsOverlay) return; // Already have a modal open

    this.settingsOverlay = this.add.container(600, 325);
    this.settingsOverlay.setDepth(2000);

    // Dark background - larger for level grid
    const bg = this.add.rectangle(0, 0, 500, 380, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xC9A86C);

    // Title
    const title = this.add.text(0, -160, 'SELECT LEVEL', {
      fontSize: '24px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFD700'
    }).setOrigin(0.5);

    this.settingsOverlay.add([bg, title]);

    // Create level buttons in a grid (4 columns)
    const cols = 4;
    const btnSize = 70;
    const spacing = 85;
    const startX = -((cols - 1) * spacing) / 2;
    const startY = -80;

    for (let i = 0; i < LEVELS.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      const levelNum = i + 1;
      const isCurrentLevel = levelNum === this.level;

      // Level button container
      const levelBtn = this.add.container(x, y);

      // Button background
      const btnBg = this.add.rectangle(0, 0, btnSize, btnSize, isCurrentLevel ? 0x4A3A20 : 0x2A2520);
      btnBg.setStrokeStyle(2, isCurrentLevel ? 0xFFD700 : 0x5C4A3D);

      // Level number
      const levelText = this.add.text(0, 0, `${levelNum}`, {
        fontSize: '28px',
        fontFamily: 'Cinzel, Georgia, serif',
        color: isCurrentLevel ? '#FFD700' : '#C9A86C'
      }).setOrigin(0.5);

      levelBtn.add([btnBg, levelText]);

      // Make interactive
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x3A3530);
        btnBg.setStrokeStyle(2, 0xFFD700);
        levelText.setColor('#FFD700');
      });
      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(isCurrentLevel ? 0x4A3A20 : 0x2A2520);
        btnBg.setStrokeStyle(2, isCurrentLevel ? 0xFFD700 : 0x5C4A3D);
        levelText.setColor(isCurrentLevel ? '#FFD700' : '#C9A86C');
      });
      btnBg.on('pointerdown', () => {
        this.settingsOverlay.destroy();
        // Delay restart so pointerup doesn't fire a shot in the new level
        this.time.delayedCall(100, () => {
          this.settingsOverlay = null;
          // Go to selected level
          this.scene.restart({ level: levelNum });
        });
      });

      this.settingsOverlay.add(levelBtn);
    }

    // Close button
    const closeBtn = this.add.container(0, 150);
    const closeBg = this.add.rectangle(0, 0, 120, 40, 0x2A2520);
    closeBg.setStrokeStyle(2, 0x8B7355);
    const closeText = this.add.text(0, 0, 'CLOSE', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#C9A86C'
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeText]);

    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on('pointerover', () => {
      closeBg.setFillStyle(0x3A3530);
      closeText.setColor('#FFD700');
    });
    closeBg.on('pointerout', () => {
      closeBg.setFillStyle(0x2A2520);
      closeText.setColor('#C9A86C');
    });
    closeBg.on('pointerdown', () => {
      this.settingsOverlay.destroy();
      this.time.delayedCall(100, () => {
        this.settingsOverlay = null;
      });
    });

    this.settingsOverlay.add(closeBtn);
  }

  createUI() {
    // Level and Score are now in HTML sidebar - update them
    document.getElementById('level-display').textContent = `LEVEL ${this.level}`;
    document.getElementById('score-display').textContent = `Score: ${this.score}`;

    // Pandas remaining (top right, inside game area)
    this.pandasText = this.add.text(1160, 35, `🐼 ${this.pandas.length}`, {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(1, 0);

    // Combo streak display (hidden initially)
    this.comboContainer = this.add.container(200, 40);
    this.comboContainer.setAlpha(0);

    const comboBg = this.add.graphics();
    comboBg.fillStyle(0xFF6B35, 0.3);
    comboBg.fillRoundedRect(-40, -15, 100, 35, 8);
    comboBg.lineStyle(2, 0xFF6B35);
    comboBg.strokeRoundedRect(-40, -15, 100, 35, 8);

    this.comboStreakText = this.add.text(0, 0, '🔥 x2', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#FF6B35',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.comboContainer.add([comboBg, this.comboStreakText]);

    this.createAmmoUI();
  }

  showTutorial() {
    this.tutorialStep = 0;
    this.tutorialActive = true;

    // Block shooting during tutorial
    this.tutorialBlockShoot = true;

    // Tutorial tooltip that follows steps
    this.tutorialContainer = this.add.container(600, 200);
    this.tutorialContainer.setDepth(100);

    const bg = this.add.rectangle(0, 0, 450, 120, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xC9A86C);

    this.tutorialText = this.add.text(0, -15, '', {
      fontSize: '20px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFD700',
      align: 'center'
    }).setOrigin(0.5);

    this.tutorialSubtext = this.add.text(0, 25, '', {
      fontSize: '14px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#CCCCCC',
      align: 'center'
    }).setOrigin(0.5);

    this.tutorialContainer.add([bg, this.tutorialText, this.tutorialSubtext]);

    // Arrow pointer for highlighting
    this.tutorialArrow = this.add.text(0, 0, '👇', {
      fontSize: '32px'
    }).setOrigin(0.5).setDepth(101);
    this.tutorialArrow.setVisible(false);

    // Start tutorial sequence
    this.showTutorialStep(0);
  }

  showTutorialStep(step) {
    this.tutorialStep = step;

    // Stop any existing arrow animation
    this.tweens.killTweensOf(this.tutorialArrow);

    switch(step) {
      case 0:
        // Introduction
        this.tutorialContainer.setPosition(600, 200);
        this.tutorialText.setText('Welcome, Hunter!');
        this.tutorialSubtext.setText('Your mission: Free the cursed pandas!\nClick to continue...');
        this.tutorialArrow.setVisible(false);
        this.tutorialBlockShoot = true;

        this.input.once('pointerdown', () => {
          this.showTutorialStep(1);
        });
        break;

      case 1:
        // First, select ammo 2
        this.tutorialContainer.setPosition(600, 200);
        this.tutorialText.setText('Select 2');
        this.tutorialSubtext.setText('Tap AMMO in the sidebar\nso your bullet bounces twice!');

        // Show arrow pointing left towards sidebar
        this.tutorialArrow.setVisible(true);
        this.tutorialArrow.setText('👈');
        this.tutorialArrow.setPosition(350, 200);
        this.tutorialArrow.setDepth(200);
        this.tweens.add({
          targets: this.tutorialArrow,
          x: 330,
          duration: 500,
          yoyo: true,
          repeat: -1
        });

        // Flash the ammo section (don't auto-expand, let user do it)
        const ammoSection = document.getElementById('ammo-section');
        if (ammoSection) ammoSection.classList.add('flashing');

        // Flash the "2" button when it becomes visible
        const btn2 = document.querySelector('.ammo-btn[data-value="2"]');
        if (btn2) btn2.classList.add('flash-target');

        // Only accept 2
        this.tutorialWaitingForAmmo = 2;
        break;

      case 2:
        // Stop the flashing and arrow animation from step 1
        this.tweens.killTweensOf(this.tutorialArrow);
        const ammoSectionStep2 = document.getElementById('ammo-section');
        if (ammoSectionStep2) ammoSectionStep2.classList.remove('flashing');
        const btn2Step2 = document.querySelector('.ammo-btn[data-value="2"]');
        if (btn2Step2) btn2Step2.classList.remove('flash-target');

        // Now shoot the wall
        this.tutorialContainer.setPosition(600, 150);
        this.tutorialText.setText('Shoot the wall!');
        this.tutorialSubtext.setText('Click anywhere on the top wall\nWatch your bullet bounce twice!');

        // Arrow pointing at top wall
        this.tutorialArrow.setVisible(true);
        this.tutorialArrow.setText('👆');
        this.tutorialArrow.setPosition(400, 80);
        this.tweens.add({
          targets: this.tutorialArrow,
          y: 60,
          duration: 500,
          yoyo: true,
          repeat: -1
        });

        // Allow shooting after short delay
        this.time.delayedCall(200, () => {
          this.tutorialBlockShoot = false;
        });
        this.tutorialWaitingForBounce = true;
        break;

      case 3:
        // They saw the bounces - explain
        this.tutorialBlockShoot = true;
        this.tutorialContainer.setPosition(600, 250);
        this.tutorialText.setText('Nice! Your bullet bounced twice!');
        this.tutorialSubtext.setText('More ammo = more ricochets,\nbut also uses more of your bullets!\nClick to continue...');
        this.tutorialArrow.setVisible(false);

        this.input.once('pointerdown', () => {
          this.showTutorialStep(4);
        });
        break;

      case 4:
        // Block shooting initially to prevent click-through
        this.tutorialBlockShoot = true;

        // Now hit the panda
        this.tutorialContainer.setPosition(600, 150);
        this.tutorialText.setText("You've got one bullet left!");
        this.tutorialSubtext.setText('Shoot the panda!');

        // Arrow pointing at panda
        this.tutorialArrow.setVisible(true);
        this.tutorialArrow.setText('👇');
        this.tutorialArrow.setPosition(900, 260);
        this.tweens.add({
          targets: this.tutorialArrow,
          y: 280,
          duration: 500,
          yoyo: true,
          repeat: -1
        });

        // Allow shooting after short delay to prevent click-through
        this.time.delayedCall(200, () => {
          this.tutorialBlockShoot = false;
        });
        break;

      case 5:
        // Tutorial complete - show congrats then fade out
        this.tutorialBlockShoot = true;
        this.tutorialArrow.setVisible(false);
        this.tutorialContainer.setPosition(600, 300);
        this.tutorialText.setText('🎉 Nice work, Hunter!');
        this.tutorialSubtext.setText('You\'re ready to free some souls.\nGood luck!\n\nClick to continue...');

        this.input.once('pointerdown', () => {
          this.tutorialActive = false;
          this.tweens.add({
            targets: [this.tutorialContainer, this.tutorialArrow],
            alpha: 0,
            duration: 500,
            onComplete: () => {
              if (this.tutorialContainer) this.tutorialContainer.destroy();
              if (this.tutorialArrow) this.tutorialArrow.destroy();
            }
          });
        });
        break;
    }
  }

  createAmmoUI() {
    // Restore ammo panel structure if it was replaced (e.g., by next level button)
    const ammoPanel = document.querySelector('.ammo-panel');
    if (ammoPanel && !document.getElementById('ammo-buttons')) {
      ammoPanel.innerHTML = `
        <span class="ammo-label">AMMO</span>
        <div class="ammo-buttons" id="ammo-buttons"></div>
      `;
    }

    // Create HTML ammo buttons (for desktop)
    const container = document.getElementById('ammo-buttons');
    if (container) {
      container.innerHTML = '';

      for (let i = 1; i <= this.ammoTotal; i++) {
        const btn = document.createElement('button');
        btn.className = 'ammo-btn';
        btn.textContent = i;
        btn.dataset.value = i;
        btn.addEventListener('click', () => {
          this.selectAmmo(i);
          // Close ammo menu after selection
          const ammoButtons = document.getElementById('ammo-buttons');
          if (ammoButtons) ammoButtons.classList.remove('expanded');
        });
        container.appendChild(btn);
      }
    }

    this.updateAmmoUI();
  }

  updateAmmoUI() {
    // Update HTML buttons
    const buttons = document.querySelectorAll('.ammo-btn');
    buttons.forEach((btn) => {
      const value = parseInt(btn.dataset.value);
      btn.classList.remove('selected', 'used');

      if (value <= this.ammoRemaining) {
        // Only highlight the exact selected number
        if (value === this.selectedAmmo) {
          btn.classList.add('selected');
        }
      } else {
        btn.classList.add('used');
      }
    });

    // Update summary display (remaining/total and ricochet)
    const remainingEl = document.getElementById('ammo-remaining');
    const totalEl = document.getElementById('ammo-total');
    const ricochetEl = document.getElementById('ammo-ricochet');
    const ricochetLabel = document.querySelector('.ricochet-label');
    if (remainingEl) remainingEl.textContent = this.ammoRemaining;
    if (totalEl) totalEl.textContent = this.ammoTotal;
    if (ricochetEl) {
      ricochetEl.textContent = this.selectedAmmo;
      // Show locked indicator for challenge levels
      if (this.lockedAmmo) {
        ricochetEl.style.color = '#FFD700';
      }
    }
    if (ricochetLabel && this.lockedAmmo) {
      ricochetLabel.textContent = 'LOCKED';
      ricochetLabel.style.color = '#FFD700';
    }

    // Hide ammo expand button on locked levels
    const ammoSection = document.getElementById('ammo-section');
    if (ammoSection && this.lockedAmmo) {
      const expandArrow = ammoSection.querySelector('.expand-arrow');
      if (expandArrow) expandArrow.style.display = 'none';
    }
  }

  setupInput() {
    // Fire on mouse release - aim while holding, release to shoot
    this.input.on('pointerup', (pointer) => {
      if (this.bulletFired || this.ammoRemaining <= 0 || this.levelEnded || this.settingsOverlay) return;
      if (this.tutorialBlockShoot) return; // Block during tutorial
      if (this.challengePopupActive) return; // Block during challenge popup

      // Check minimum distance for a valid shot
      const dist = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.bunny.x, this.bunny.y
      );

      if (dist > 30) {
        this.fireBullet(pointer);
        this.clearAimLine();
      }
    });

    // Ammo selection keys (number row and numpad)
    this.input.keyboard.on('keydown-ONE', () => this.selectAmmo(1));
    this.input.keyboard.on('keydown-TWO', () => this.selectAmmo(2));
    this.input.keyboard.on('keydown-THREE', () => this.selectAmmo(3));
    this.input.keyboard.on('keydown-FOUR', () => this.selectAmmo(4));
    this.input.keyboard.on('keydown-FIVE', () => this.selectAmmo(5));
    this.input.keyboard.on('keydown-NUMPAD_ONE', () => this.selectAmmo(1));
    this.input.keyboard.on('keydown-NUMPAD_TWO', () => this.selectAmmo(2));
    this.input.keyboard.on('keydown-NUMPAD_THREE', () => this.selectAmmo(3));
    this.input.keyboard.on('keydown-NUMPAD_FOUR', () => this.selectAmmo(4));
    this.input.keyboard.on('keydown-NUMPAD_FIVE', () => this.selectAmmo(5));

    // Scroll wheel ammo selection
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (this.bulletFired) return;
      if (deltaY > 0) {
        this.selectAmmo(Math.max(1, this.selectedAmmo - 1));
      } else {
        this.selectAmmo(Math.min(this.ammoRemaining, this.selectedAmmo + 1));
      }
    });

    // Restart key (R) - works during gameplay and after level ends
    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart({ level: this.level, isReplay: true });
    });

    // Skip to next level (S)
    this.input.keyboard.on('keydown-S', () => {
      const nextLevel = Math.min(this.level + 1, LEVELS.length);
      this.scene.restart({ level: nextLevel });
    });
  }

  selectAmmo(amount) {
    // Don't allow changing ammo on locked challenge levels
    if (this.lockedAmmo) return;

    if (amount <= this.ammoRemaining && amount >= 1) {
      this.selectedAmmo = amount;
      this.updateAmmoUI();

      // If tutorial is waiting for specific ammo selection
      if (this.tutorialWaitingForAmmo && amount === this.tutorialWaitingForAmmo) {
        this.tutorialWaitingForAmmo = false;
        this.showTutorialStep(2);
      }
    }
  }

  updateAimLine(pointer) {
    if (!this.aimLine || this.settingsOverlay) return;

    this.aimLine.clear();

    // Get gun position
    const gunX = this.bunny.x + (this.bunny.gunOffsetX || 35);
    const gunY = this.bunny.y + (this.bunny.gunOffsetY || -25);

    // Direction FROM gun TO mouse
    const dx = pointer.x - gunX;
    const dy = pointer.y - gunY;
    const dist = Phaser.Math.Distance.Between(
      pointer.x, pointer.y, gunX, gunY
    );

    // Only show aim if there's some distance
    if (dist < 30) {
      this.trajectoryDots.forEach(dot => dot.destroy());
      this.trajectoryDots = [];
      return;
    }

    // Normalize direction
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Max distance for dots is 1/3 of the distance to pointer, capped at 100px
    const maxDotDist = Math.min(dist / 3, 100);

    // Animate dots moving in/out based on time
    const time = this.time.now / 200; // Slower animation
    const pulse = (Math.sin(time) + 1) / 2; // 0 to 1

    // Draw 3 dots that pulse in and out
    for (let i = 0; i < 3; i++) {
      // Base position for each dot (evenly spaced)
      const baseOffset = (i + 1) * (maxDotDist / 4);
      // Add pulsing offset
      const pulseOffset = pulse * 15;
      const dotDist = baseOffset + pulseOffset;

      const dotX = gunX + dirX * dotDist;
      const dotY = gunY + dirY * dotDist;

      // Fade dots based on distance (closer = more visible)
      const alpha = 0.7 - (i * 0.15);
      const size = 5 - i; // Closer dots are bigger

      this.aimLine.fillStyle(COLORS.oldGold, alpha);
      this.aimLine.fillCircle(dotX, dotY, size);
    }

    // Clear any old trajectory dots
    this.trajectoryDots.forEach(dot => dot.destroy());
    this.trajectoryDots = [];
  }

  drawTrajectory(angle, power, maxBounces, startX = null, startY = null) {
    this.trajectoryDots.forEach(dot => dot.destroy());
    this.trajectoryDots = [];

    const speed = power * 4;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    // Start from provided position (arrowhead) or bunny
    let x = startX !== null ? startX : this.bunny.x;
    let y = startY !== null ? startY : this.bunny.y;
    let bounces = 0;

    for (let i = 0; i < 100 && bounces <= maxBounces; i++) {
      x += vx * 0.015;
      y += vy * 0.015;

      if (x < 35 || x > 765) {
        vx *= -1;
        x = x < 35 ? 35 : 765;
        bounces++;
        if (bounces > maxBounces) break;

        // Bounce marker - bright and visible
        const bounceGlow = this.add.circle(x, y, 12, COLORS.torchOrange, 0.4);
        const bounceMarker = this.add.circle(x, y, 8, COLORS.dragonFire, 0.9);
        const bounceCore = this.add.circle(x, y, 4, COLORS.torchYellow, 1);
        this.trajectoryDots.push(bounceGlow, bounceMarker, bounceCore);
      }
      if (y < 35 || y > 540) {
        vy *= -1;
        y = y < 35 ? 35 : 540;
        bounces++;
        if (bounces > maxBounces) break;

        const bounceGlow = this.add.circle(x, y, 12, COLORS.torchOrange, 0.4);
        const bounceMarker = this.add.circle(x, y, 8, COLORS.dragonFire, 0.9);
        const bounceCore = this.add.circle(x, y, 4, COLORS.torchYellow, 1);
        this.trajectoryDots.push(bounceGlow, bounceMarker, bounceCore);
      }

      // Trajectory dots - brighter and larger
      if (i % 3 === 0) {
        const progress = i / 100;
        const alpha = (1 - progress) * 0.8;
        const size = 4 - progress * 2;
        const color = bounces < maxBounces ? COLORS.oldGold : COLORS.bloodRed;
        const dot = this.add.circle(x, y, Math.max(2, size), color, alpha);
        this.trajectoryDots.push(dot);
      }
    }
  }

  clearAimLine() {
    if (this.aimLine) {
      this.aimLine.clear();
    }
    this.trajectoryDots.forEach(dot => dot.destroy());
    this.trajectoryDots = [];
  }

  fireBullet(pointer) {
    if (this.bulletFired || this.ammoRemaining <= 0) return;

    // Clear trajectory from previous shot in practice mode
    if (this.editMode && this.practiceMode) {
      this.clearTrajectory();
    }

    // Get gun position
    const gunX = this.bunny.x + (this.bunny.gunOffsetX || 35);
    const gunY = this.bunny.y + (this.bunny.gunOffsetY || -25);

    // Direction FROM gun TO mouse (shoot toward mouse)
    const dx = pointer.x - gunX;
    const dy = pointer.y - gunY;
    const angle = Math.atan2(dy, dx);
    const power = Math.min(Phaser.Math.Distance.Between(
      pointer.x, pointer.y, gunX, gunY
    ), 200);

    if (power < 20) return;

    // Play gunshot sound
    soundManager.playGunshot();

    const speed = Math.min(power * 4, 600); // Cap max speed to prevent tunneling

    this.ammoRemaining -= this.selectedAmmo;
    const maxBounces = this.selectedAmmo;

    // === FLAMING BOLT - Precise Medieval Projectile ===
    // Start from the gun position (gunX and gunY already calculated above)
    const startX = gunX;
    const startY = gunY;

    // Create smaller, more precise physics body (5px radius for precision)
    this.bullet = this.add.circle(startX, startY, 5, COLORS.white, 0);
    this.physics.add.existing(this.bullet);
    this.bullet.body.setCircle(5);

    // Store the firing angle for bolt rotation
    this.bullet.fireAngle = angle;

    // Create a container for all visual elements (follows the physics bullet)
    const bulletContainer = this.add.container(startX, startY);

    // Rotate container to match firing direction
    bulletContainer.setRotation(angle);

    // Draw the bolt using graphics
    const boltGraphics = this.add.graphics();

    // Steel bolt shaft
    boltGraphics.fillStyle(COLORS.steel);
    boltGraphics.fillRect(-12, -2, 20, 4);

    // Arrowhead (triangle)
    boltGraphics.fillStyle(0x505560);
    boltGraphics.beginPath();
    boltGraphics.moveTo(12, 0);
    boltGraphics.lineTo(6, -4);
    boltGraphics.lineTo(6, 4);
    boltGraphics.closePath();
    boltGraphics.fillPath();

    // Fletching (back feathers)
    boltGraphics.fillStyle(COLORS.bloodRed);
    boltGraphics.beginPath();
    boltGraphics.moveTo(-12, 0);
    boltGraphics.lineTo(-18, -5);
    boltGraphics.lineTo(-14, 0);
    boltGraphics.closePath();
    boltGraphics.fillPath();
    boltGraphics.beginPath();
    boltGraphics.moveTo(-12, 0);
    boltGraphics.lineTo(-18, 5);
    boltGraphics.lineTo(-14, 0);
    boltGraphics.closePath();
    boltGraphics.fillPath();

    bulletContainer.add(boltGraphics);

    // Fire effect at the tip
    const fireTip = this.add.circle(8, 0, 6, COLORS.dragonFire, 0.9);
    const fireGlow = this.add.circle(8, 0, 10, COLORS.torchOrange, 0.4);
    const fireCore = this.add.circle(8, 0, 3, COLORS.torchYellow, 1);

    bulletContainer.add([fireGlow, fireTip, fireCore]);

    // Store references
    this.bullet.container = bulletContainer;
    this.bullet.boltGraphics = boltGraphics;
    this.bullet.fireTip = fireTip;
    this.bullet.fireGlow = fireGlow;
    this.bullet.fireCore = fireCore;

    // Subtle fire flicker
    this.tweens.add({
      targets: [fireTip, fireGlow],
      scale: { from: 1, to: 1.2 },
      alpha: { from: fireTip.alpha, to: fireTip.alpha * 0.7 },
      duration: 80,
      yoyo: true,
      repeat: -1
    });

    // Fire core pulse
    this.tweens.add({
      targets: fireCore,
      scale: { from: 0.8, to: 1.2 },
      duration: 60,
      yoyo: true,
      repeat: -1
    });

    this.bullet.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    this.bullet.body.setBounce(1, 1);
    this.bullet.body.setCollideWorldBounds(true);

    // Store the angle for trail direction
    this.bullet.angle = angle;

    this.bullet.bounceCount = 0;
    this.bullet.maxBounces = maxBounces;

    // Use a single collider group to prevent multiple collision callbacks
    // when bullet hits overlapping wall segments of angled obstacles
    const wallGroup = this.physics.add.staticGroup();
    this.walls.forEach(wall => {
      wallGroup.add(wall);
    });
    this.physics.add.collider(this.bullet, wallGroup, () => {
      this.onBulletBounce();
    });

    this.pandas.forEach(panda => {
      this.physics.add.overlap(this.bullet, panda, () => {
        this.onPandaHit(panda);
      });
    });

    // Chandelier collision - shoot chandelier OR rope to drop
    this.chandeliers.forEach(chandelier => {
      // Chandelier body hitbox
      if (chandelier.hitbox && chandelier.hitbox.body) {
        this.physics.add.overlap(this.bullet, chandelier.hitbox, () => {
          this.dropChandelier(chandelier);
        });
      }
      // Rope/chain hitbox
      if (chandelier.ropeHitbox && chandelier.ropeHitbox.body) {
        this.physics.add.overlap(this.bullet, chandelier.ropeHitbox, () => {
          this.dropChandelier(chandelier);
        });
      }
    });

    this.bulletFired = true;
    this.updateAmmoUI();

    // Bunny recoil animation!
    this.tweens.add({
      targets: this.bunny,
      x: this.bunny.x - Math.cos(angle) * 15,
      y: this.bunny.y - Math.sin(angle) * 10,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut'
    });

    // Muzzle flash!
    const flashX = startX + Math.cos(angle) * 30;
    const flashY = startY + Math.sin(angle) * 30;

    const muzzleFlash = this.add.circle(flashX, flashY, 20, COLORS.torchYellow, 1);
    const muzzleGlow = this.add.circle(flashX, flashY, 35, COLORS.dragonFire, 0.5);

    this.tweens.add({
      targets: [muzzleFlash, muzzleGlow],
      scale: 2,
      alpha: 0,
      duration: 120,
      ease: 'Sine.easeOut',
      onComplete: () => {
        muzzleFlash.destroy();
        muzzleGlow.destroy();
      }
    });

    // Sparks from firing
    for (let i = 0; i < 8; i++) {
      const sparkAngle = angle + (Math.random() - 0.5) * 0.8;
      const spark = this.add.circle(flashX, flashY, 2, COLORS.torchOrange, 1);

      this.tweens.add({
        targets: spark,
        x: flashX + Math.cos(sparkAngle) * (30 + Math.random() * 20),
        y: flashY + Math.sin(sparkAngle) * (30 + Math.random() * 20),
        alpha: 0,
        duration: 150,
        onComplete: () => spark.destroy()
      });
    }

    // Camera kick
    this.cameras.main.shake(80, 0.008);

    this.trailEvent = this.time.addEvent({
      delay: 25,
      callback: () => this.createTrail(),
      repeat: -1
    });

    // Ammo spent indicator
    const spentText = this.add.text(this.bunny.x, this.bunny.y - 60, `-${maxBounces}`, {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#C9A86C',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: spentText,
      y: spentText.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => spentText.destroy()
    });
  }

  createTrail() {
    if (!this.bullet || !this.bullet.active || !this.bullet.body) return;

    // Get the actual physics body position
    const bulletX = this.bullet.body.x + this.bullet.body.width / 2;
    const bulletY = this.bullet.body.y + this.bullet.body.height / 2;

    const velX = this.bullet.body.velocity.x;
    const velY = this.bullet.body.velocity.y;
    const speed = Math.sqrt(velX * velX + velY * velY);

    // Update container position AND rotation to follow velocity direction
    if (this.bullet.container) {
      this.bullet.container.x = bulletX;
      this.bullet.container.y = bulletY;
      // Rotate bolt to face direction of travel
      if (speed > 10) {
        this.bullet.container.rotation = Math.atan2(velY, velX);
      }
    }

    // === FIRE & SMOKE TRAIL ===
    if (speed > 10) {
      // Smoke trail (dark, rises)
      if (Math.random() > 0.3) {
        const smoke = this.add.circle(
          bulletX + Phaser.Math.Between(-3, 3),
          bulletY + Phaser.Math.Between(-3, 3),
          4 + Math.random() * 4,
          0x2A2A2A,
          0.4
        );

        this.tweens.add({
          targets: smoke,
          y: smoke.y - 20 - Math.random() * 15,
          x: smoke.x + Phaser.Math.Between(-10, 10),
          scale: 2,
          alpha: 0,
          duration: 400 + Math.random() * 200,
          ease: 'Sine.easeOut',
          onComplete: () => smoke.destroy()
        });
      }

      // Fire ember trail
      const ember = this.add.circle(
        bulletX,
        bulletY,
        3 + Math.random() * 2,
        Math.random() > 0.5 ? COLORS.dragonFire : COLORS.torchOrange,
        0.9
      );

      this.tweens.add({
        targets: ember,
        scale: 0.2,
        alpha: 0,
        duration: 150 + Math.random() * 100,
        onComplete: () => ember.destroy()
      });

      // Occasional bright spark
      if (Math.random() > 0.7) {
        const spark = this.add.circle(
          bulletX + Phaser.Math.Between(-5, 5),
          bulletY + Phaser.Math.Between(-5, 5),
          1 + Math.random() * 2,
          COLORS.torchYellow,
          1
        );

        this.tweens.add({
          targets: spark,
          y: spark.y + 15 + Math.random() * 20,
          x: spark.x + Phaser.Math.Between(-15, 15),
          alpha: 0,
          scale: 0,
          duration: 300,
          ease: 'Sine.easeIn',
          onComplete: () => spark.destroy()
        });
      }
    }
  }

  onBulletBounce() {
    if (!this.bullet || !this.bullet.body) return;

    // Debounce: prevent multiple bounces being counted for the same collision
    const now = Date.now();
    if (this.bullet.lastBounceTime && now - this.bullet.lastBounceTime < 150) {
      return;
    }
    this.bullet.lastBounceTime = now;

    this.bullet.bounceCount++;

    // Play ricochet sound
    soundManager.playRicochet();

    // Screen shake - steel hitting stone
    const shakeIntensity = 0.006 - (this.bullet.bounceCount * 0.001);
    this.cameras.main.shake(60, Math.max(0.002, shakeIntensity));

    // === STEEL ON STONE RICOCHET ===
    const bx = this.bullet.body.x + this.bullet.body.width / 2;
    const by = this.bullet.body.y + this.bullet.body.height / 2;

    // Brief bright flash (steel striking) - BIGGER
    const impactFlash = this.add.circle(bx, by, 8, COLORS.torchYellow, 1);
    this.tweens.add({
      targets: impactFlash,
      scale: 3,
      alpha: 0,
      duration: 120,
      ease: 'Sine.easeOut',
      onComplete: () => impactFlash.destroy()
    });

    // White core flash
    const coreFlash = this.add.circle(bx, by, 5, 0xFFFFFF, 1);
    this.tweens.add({
      targets: coreFlash,
      scale: 2,
      alpha: 0,
      duration: 80,
      ease: 'Sine.easeOut',
      onComplete: () => coreFlash.destroy()
    });

    // Fire burst from flaming bolt - BIGGER
    const fireBurst = this.add.circle(bx, by, 12, COLORS.dragonFire, 0.8);
    this.tweens.add({
      targets: fireBurst,
      scale: 2.5,
      alpha: 0,
      duration: 200,
      ease: 'Sine.easeOut',
      onComplete: () => fireBurst.destroy()
    });

    // Metal sparks (steel on stone) - MORE AND BIGGER
    const velX = this.bullet.body.velocity.x;
    const velY = this.bullet.body.velocity.y;
    const sparkCount = 12 + Math.floor(Math.random() * 8);

    for (let i = 0; i < sparkCount; i++) {
      const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.8;
      const baseAngle = Math.atan2(-velY, -velX);
      const sparkAngle = baseAngle + spreadAngle;
      const sparkDist = 35 + Math.random() * 50;

      const sparkSize = 2 + Math.random() * 3;
      // Metal spark colors: bright yellow/white fading to orange
      const sparkColor = Math.random() > 0.3 ? COLORS.torchYellow : (Math.random() > 0.5 ? 0xFFFFFF : COLORS.torchOrange);

      const spark = this.add.circle(bx, by, sparkSize, sparkColor, 1);

      const endX = bx + Math.cos(sparkAngle) * sparkDist;
      const endY = by + Math.sin(sparkAngle) * sparkDist + (Math.random() * 25); // slight gravity

      this.tweens.add({
        targets: spark,
        x: endX,
        y: endY,
        scale: 0.1,
        alpha: 0,
        duration: 200 + Math.random() * 200,
        ease: 'Sine.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    // Falling embers (gravity, slower)
    for (let i = 0; i < 4; i++) {
      const ember = this.add.circle(
        bx + Phaser.Math.Between(-4, 4),
        by + Phaser.Math.Between(-4, 4),
        2 + Math.random() * 2,
        Math.random() > 0.5 ? COLORS.dragonFire : COLORS.torchOrange,
        1
      );

      const emberEndX = bx + Phaser.Math.Between(-30, 30);
      const emberEndY = by + 25 + Math.random() * 35;

      this.tweens.add({
        targets: ember,
        x: emberEndX,
        y: emberEndY,
        alpha: 0,
        scale: 0.2,
        duration: 400 + Math.random() * 250,
        ease: 'Sine.easeIn',
        onComplete: () => ember.destroy()
      });
    }

    // Stone dust puff
    for (let i = 0; i < 3; i++) {
      const dust = this.add.circle(
        bx + Phaser.Math.Between(-3, 3),
        by + Phaser.Math.Between(-3, 3),
        5 + Math.random() * 5,
        0x555555,
        0.3
      );

      this.tweens.add({
        targets: dust,
        y: dust.y - 10 - Math.random() * 10,
        scale: 2,
        alpha: 0,
        duration: 300 + Math.random() * 150,
        ease: 'Sine.easeOut',
        onComplete: () => dust.destroy()
      });
    }

    // Remaining bounces indicator - muted gold
    const remaining = this.bullet.maxBounces - this.bullet.bounceCount;
    if (remaining >= 0) {
      const bounceText = this.add.text(bx, by - 20, `${remaining}`, {
        fontSize: '18px',
        fontFamily: 'Georgia, serif',
        color: remaining > 0 ? '#C9A227' : '#8B0000',
        stroke: '#1A1A1F',
        strokeThickness: 3
      }).setOrigin(0.5);

      this.tweens.add({
        targets: bounceText,
        y: bounceText.y - 25,
        alpha: 0,
        scale: 1.2,
        duration: 500,
        ease: 'Sine.easeOut',
        onComplete: () => bounceText.destroy()
      });
    }

    if (this.bullet.bounceCount > this.bullet.maxBounces) {
      this.destroyBullet();
    }
  }

  onPandaHit(panda) {
    if (!panda.active) return;

    // Tutorial: ignore panda hits until step 4 (hit the panda)
    if (this.tutorialActive && this.tutorialStep < 4) {
      return;
    }

    // Tutorial: complete when panda is hit
    if (this.tutorialActive && this.tutorialStep === 4) {
      this.showTutorialStep(5);
    }

    const index = this.pandas.indexOf(panda);
    if (index > -1) {
      this.pandas.splice(index, 1);
    }

    // Play hit sound
    soundManager.playHit();

    // COMBO SYSTEM
    this.combo++;
    const comboMultiplier = this.combo;
    const points = 100 * comboMultiplier;
    this.score += points;

    // Screen flash effect (doesn't affect positions)
    this.cameras.main.flash(100, 255, 200, 100, false);

    // Combo text popup
    this.showComboText(panda.x, panda.y, comboMultiplier, points);

    this.createSoulRelease(panda.x, panda.y);
    panda.destroy();

    // Update UI
    this.pandasText.setText(`🐼 ${this.pandas.length}`);
    document.getElementById('score-display').textContent = `Score: ${this.score}`;

    // Update combo display
    this.updateComboDisplay();

    if (this.pandas.length === 0) {
      this.time.delayedCall(500, () => this.onLevelComplete());
    }
  }

  triggerSlowMo() {
    if (this.slowMoActive) return;
    this.slowMoActive = true;

    // Create vignette effect
    if (!this.vignette) {
      this.vignette = this.add.graphics();
      this.vignette.setDepth(1000);
    }

    // Draw vignette (dark edges)
    this.vignette.clear();
    this.vignette.fillStyle(0x000000, 0.6);
    // Top edge
    this.vignette.fillRect(0, 0, 1200, 40);
    // Bottom edge
    this.vignette.fillRect(0, 660, 1200, 40);
    // Left edge
    this.vignette.fillRect(0, 0, 40, 650);
    // Right edge
    this.vignette.fillRect(1160, 0, 40, 650);

    // Fade in vignette
    this.vignette.setAlpha(0);
    this.tweens.add({
      targets: this.vignette,
      alpha: 1,
      duration: 100
    });

    // Slow down time
    this.time.timeScale = 0.3;
    this.physics.world.timeScale = 3; // Inverse for physics

    // Return to normal after a short time
    this.time.delayedCall(300, () => {
      this.tweens.add({
        targets: this.time,
        timeScale: 1,
        duration: 200,
        onComplete: () => {
          this.slowMoActive = false;
          this.physics.world.timeScale = 1;
        }
      });

      // Fade out vignette
      if (this.vignette) {
        this.tweens.add({
          targets: this.vignette,
          alpha: 0,
          duration: 200
        });
      }
    });
  }

  updateComboDisplay() {
    if (!this.comboContainer) return;

    if (this.combo >= 2) {
      // Show combo indicator
      this.comboStreakText.setText(`🔥 x${this.combo}`);
      this.comboContainer.setAlpha(1);

      // Pulse effect
      this.tweens.add({
        targets: this.comboContainer,
        scale: 1.2,
        duration: 100,
        yoyo: true
      });
    } else {
      // Hide when no combo
      this.comboContainer.setAlpha(0);
    }
  }

  showComboText(x, y, combo, points) {
    const comboTexts = ['', 'NICE!', 'DOUBLE!', 'TRIPLE!', 'MEGA!', 'ULTRA!', 'INSANE!'];
    const comboColors = ['#FFF', '#FFD700', '#FF6B35', '#FF2D95', '#00FFFF', '#9B59B6', '#FF0000'];

    const text = combo > 1 ? comboTexts[Math.min(combo, comboTexts.length - 1)] : '';
    const color = comboColors[Math.min(combo, comboColors.length - 1)];

    if (text) {
      const comboText = this.add.text(x, y - 40, text, {
        fontSize: `${28 + combo * 4}px`,
        fontFamily: 'Georgia, serif',
        color: color,
        stroke: '#000',
        strokeThickness: 6
      }).setOrigin(0.5);

      this.tweens.add({
        targets: comboText,
        y: comboText.y - 60,
        scale: 1.5,
        alpha: 0,
        duration: 800,
        ease: 'Back.easeOut',
        onComplete: () => comboText.destroy()
      });
    }

    // Points popup
    const pointsText = this.add.text(x, y - 10, `+${points}`, {
      fontSize: '22px',
      fontFamily: 'Georgia, serif',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pointsText,
      y: pointsText.y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeOut',
      onComplete: () => pointsText.destroy()
    });
  }

  createSoulRelease(x, y) {
    // Magical soul particles
    for (let i = 0; i < 20; i++) {
      const soul = this.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(4, 10),
        Math.random() > 0.5 ? COLORS.ghostWhite : COLORS.valyrian,
        0.8
      );

      this.tweens.add({
        targets: soul,
        y: soul.y - 150 - Math.random() * 100,
        x: soul.x + Phaser.Math.Between(-40, 40),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(800, 1500),
        ease: 'Sine.easeOut',
        onComplete: () => soul.destroy()
      });
    }

    // Chain break effect
    for (let i = 0; i < 6; i++) {
      const chainPiece = this.add.rectangle(
        x + Phaser.Math.Between(-30, 30),
        y + Phaser.Math.Between(-20, 20),
        8,
        4,
        0x888888
      );

      this.tweens.add({
        targets: chainPiece,
        y: chainPiece.y + 100,
        x: chainPiece.x + Phaser.Math.Between(-50, 50),
        rotation: Phaser.Math.Between(-3, 3),
        alpha: 0,
        duration: 1000,
        ease: 'Bounce.easeOut',
        onComplete: () => chainPiece.destroy()
      });
    }

    // "FREED" text
    const freedText = this.add.text(x, y, 'FREED!', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#00FFFF',
      stroke: '#1A1A1F',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.tweens.add({
      targets: freedText,
      y: y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Sine.easeOut',
      onComplete: () => freedText.destroy()
    });
  }

  destroyBullet() {
    if (!this.bullet) return;

    // Tutorial: show "Nice! Your bullet bounced twice!" after bullet is destroyed
    if (this.tutorialWaitingForBounce) {
      this.tutorialWaitingForBounce = false;
      this.showTutorialStep(3);
    }

    if (this.trailEvent) {
      this.trailEvent.destroy();
    }

    // Reset combo when bullet is destroyed without hitting anything new
    this.combo = 0;
    this.updateComboDisplay();

    // Final dissipation effect - get position from physics body
    const bx = this.bullet.body ? this.bullet.body.x + this.bullet.body.width / 2 : this.bullet.x;
    const by = this.bullet.body ? this.bullet.body.y + this.bullet.body.height / 2 : this.bullet.y;

    // Fading sparkles
    for (let i = 0; i < 10; i++) {
      const sparkle = this.add.circle(
        bx + Phaser.Math.Between(-10, 10),
        by + Phaser.Math.Between(-10, 10),
        3 + Math.random() * 3,
        Math.random() > 0.5 ? COLORS.torchOrange : COLORS.torchYellow,
        0.8
      );

      this.tweens.add({
        targets: sparkle,
        x: sparkle.x + Phaser.Math.Between(-30, 30),
        y: sparkle.y + Phaser.Math.Between(-30, 30),
        alpha: 0,
        scale: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Sine.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }

    // Destroy the container (which holds all glow elements)
    if (this.bullet.container) {
      this.tweens.add({
        targets: this.bullet.container,
        alpha: 0,
        scale: 0.1,
        duration: 200,
        onComplete: () => {
          if (this.bullet && this.bullet.container) {
            this.bullet.container.destroy();
          }
        }
      });
    }

    this.tweens.add({
      targets: this.bullet,
      alpha: 0,
      scale: 0.1,
      duration: 200,
      onComplete: () => {
        if (this.bullet) {
          this.bullet.destroy();
          this.bullet = null;
        }
        this.bulletFired = false;

        this.selectedAmmo = Math.min(this.selectedAmmo, this.ammoRemaining);
        if (this.selectedAmmo < 1 && this.ammoRemaining > 0) {
          this.selectedAmmo = 1;
        }
        this.updateAmmoUI();

        if (this.ammoRemaining <= 0 && this.pandas.length > 0) {
          this.time.delayedCall(500, () => this.onLevelFailed());
        }
      }
    });
  }

  onLevelComplete() {
    // Play victory sound
    soundManager.playVictory();

    if (this.bullet) {
      if (this.bullet.container) this.bullet.container.destroy();
      this.bullet.destroy();
      this.bullet = null;
    }

    // Hide tutorial if active
    if (this.tutorialActive) {
      this.tutorialActive = false;
      if (this.tutorialContainer) this.tutorialContainer.setVisible(false);
      if (this.tutorialArrow) this.tutorialArrow.setVisible(false);
    }

    this.levelEnded = true;

    const overlay = this.add.rectangle(600, 325, 1200, 650, 0x000000, 0.85);

    // Victory modal - matches new aesthetic
    const modalBg = this.add.rectangle(600, 300, 420, 280, 0x1A1714, 0.95);
    modalBg.setStrokeStyle(3, 0xC9A86C);

    const victoryText = this.add.text(600, 200, 'SOULS FREED!', {
      fontSize: '36px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFD700'
    }).setOrigin(0.5);

    const statsText = this.add.text(600, 260, `Ammo remaining: ${this.ammoRemaining}`, {
      fontSize: '18px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#C9A86C'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: victoryText,
      scale: 1.03,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Epic celebration - gold confetti and fireworks!
    this.createVictoryCelebration();

    // Create touch-friendly buttons
    this.createEndLevelButtons(true);

    // Also allow keyboard shortcuts
    this.input.keyboard.once('keydown-S', () => {
      const nextLevel = Math.min(this.level + 1, LEVELS.length);
      this.scene.restart({ level: nextLevel });
    });
  }

  createEndLevelButtons(isVictory) {
    const buttonY = isVictory ? 340 : 340;
    const buttonSpacing = 55;

    // Next Level / Skip button
    const nextBtn = this.add.container(600, buttonY);
    const nextBg = this.add.rectangle(0, 0, 180, 45, 0x2A2520);
    nextBg.setStrokeStyle(2, 0xC9A86C);
    nextBg.setInteractive({ useHandCursor: true });
    const nextLabel = this.add.text(0, 0, isVictory ? 'NEXT LEVEL →' : 'SKIP LEVEL →', {
      fontSize: '14px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFD700'
    }).setOrigin(0.5);
    nextBtn.add([nextBg, nextLabel]);

    nextBg.on('pointerover', () => {
      nextBg.setFillStyle(0x3A3530);
      nextBg.setStrokeStyle(2, 0xFFD700);
    });
    nextBg.on('pointerout', () => {
      nextBg.setFillStyle(0x2A2520);
      nextBg.setStrokeStyle(2, 0xC9A86C);
    });
    nextBg.on('pointerup', (pointer, localX, localY, event) => {
      event.stopPropagation();
      // Small delay to prevent click from triggering shot on next level
      this.time.delayedCall(50, () => {
        const nextLevel = Math.min(this.level + 1, LEVELS.length);
        this.scene.restart({ level: nextLevel });
      });
    });

    // Replay button
    const replayBtn = this.add.container(600, buttonY + buttonSpacing);
    const replayBg = this.add.rectangle(0, 0, 180, 45, 0x2A2520);
    replayBg.setStrokeStyle(2, 0x5C4A3D);
    replayBg.setInteractive({ useHandCursor: true });
    const replayLabel = this.add.text(0, 0, '↺ REPLAY', {
      fontSize: '14px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#C9A86C'
    }).setOrigin(0.5);
    replayBtn.add([replayBg, replayLabel]);

    replayBg.on('pointerover', () => {
      replayBg.setFillStyle(0x3A3530);
      replayBg.setStrokeStyle(2, 0x8B7355);
    });
    replayBg.on('pointerout', () => {
      replayBg.setFillStyle(0x2A2520);
      replayBg.setStrokeStyle(2, 0x5C4A3D);
    });
    replayBg.on('pointerup', (pointer, localX, localY, event) => {
      event.stopPropagation();
      // Small delay to prevent click from triggering shot on restart
      this.time.delayedCall(50, () => {
        this.scene.restart({ level: this.level, isReplay: true });
      });
    });

  }


  onLevelFailed() {
    // Play fail sound
    soundManager.playFail();

    this.levelEnded = true;

    // Hide tutorial if active
    if (this.tutorialActive) {
      this.tutorialActive = false;
      if (this.tutorialContainer) this.tutorialContainer.setVisible(false);
      if (this.tutorialArrow) this.tutorialArrow.setVisible(false);
    }

    const overlay = this.add.rectangle(600, 325, 1200, 650, 0x000000, 0.85);

    // Failure modal - matches new aesthetic
    const modalBg = this.add.rectangle(600, 300, 420, 280, 0x1A1714, 0.95);
    modalBg.setStrokeStyle(3, 0x8B4513);

    const failText = this.add.text(600, 200, 'THE SHADOWS REMAIN...', {
      fontSize: '28px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#8B0000'
    }).setOrigin(0.5);

    const sadPanda = this.add.text(600, 270, '🐼⛓️', {
      fontSize: '42px'
    }).setOrigin(0.5);

    // Create touch-friendly buttons
    this.createEndLevelButtons(false);

    // Also allow keyboard shortcuts
    this.input.keyboard.once('keydown-S', () => {
      const nextLevel = Math.min(this.level + 1, LEVELS.length);
      this.scene.restart({ level: nextLevel });
    });
  }

  restartLevel() {
    this.scene.restart({ level: this.level, isReplay: true });
  }

  createVictoryCelebration() {
    // Gold confetti shower
    for (let i = 0; i < 50; i++) {
      this.time.delayedCall(i * 40, () => {
        if (!this.levelEnded) return;

        const x = Phaser.Math.Between(50, 750);
        const colors = [0xFFD700, 0xFFA500, 0xFFFFFF, 0xC9A227, 0xFF6B35];
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Different confetti shapes
        let confetti;
        if (Math.random() > 0.5) {
          confetti = this.add.rectangle(x, -20, 8, 12, color);
        } else {
          confetti = this.add.circle(x, -20, 5, color);
        }

        const endX = x + Phaser.Math.Between(-100, 100);
        const duration = 2000 + Math.random() * 1500;

        this.tweens.add({
          targets: confetti,
          y: 650,
          x: endX,
          rotation: Phaser.Math.Between(-10, 10),
          duration: duration,
          ease: 'Sine.easeIn',
          onComplete: () => confetti.destroy()
        });

        // Add some flutter
        this.tweens.add({
          targets: confetti,
          scaleX: { from: 1, to: 0.3 },
          duration: 200,
          yoyo: true,
          repeat: Math.floor(duration / 400)
        });
      });
    }

    // Firework bursts
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 400 + 200, () => {
        if (!this.levelEnded) return;
        this.createFirework(
          Phaser.Math.Between(150, 650),
          Phaser.Math.Between(100, 300)
        );
      });
    }

    // Rising souls
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 100, () => {
        if (!this.levelEnded) return;

        const x = Phaser.Math.Between(100, 700);
        const soul = this.add.circle(x, 600, 6,
          Math.random() > 0.5 ? COLORS.ghostWhite : COLORS.valyrian, 0.8);

        this.tweens.add({
          targets: soul,
          y: -50,
          x: soul.x + Phaser.Math.Between(-50, 50),
          alpha: 0,
          duration: 2500,
          ease: 'Sine.easeOut',
          onComplete: () => soul.destroy()
        });
      });
    }
  }

  createFirework(x, y) {
    // Firework launch trail
    const trail = this.add.circle(x, 600, 3, COLORS.torchYellow, 1);

    this.tweens.add({
      targets: trail,
      y: y,
      duration: 400,
      ease: 'Sine.easeOut',
      onComplete: () => {
        trail.destroy();

        // Screen flash
        this.cameras.main.flash(80, 255, 215, 0, false);

        // Burst!
        const colors = [0xFFD700, 0xFF6B35, 0x00FFFF, 0xFF2D95, 0x9B59B6];
        const burstColor = colors[Math.floor(Math.random() * colors.length)];
        const sparkCount = 25 + Math.floor(Math.random() * 15);

        for (let i = 0; i < sparkCount; i++) {
          const angle = (i / sparkCount) * Math.PI * 2;
          const dist = 60 + Math.random() * 80;
          const spark = this.add.circle(x, y, 3 + Math.random() * 3, burstColor, 1);

          this.tweens.add({
            targets: spark,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist + 30, // slight gravity
            alpha: 0,
            scale: 0.1,
            duration: 600 + Math.random() * 400,
            ease: 'Sine.easeOut',
            onComplete: () => spark.destroy()
          });
        }

        // Center glow
        const glow = this.add.circle(x, y, 30, burstColor, 0.5);
        this.tweens.add({
          targets: glow,
          scale: 3,
          alpha: 0,
          duration: 400,
          onComplete: () => glow.destroy()
        });
      }
    });
  }
}

// ============================================
// GAME CONFIGURATION
// ============================================

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: 0x1A1A1F,
  scale: {
    mode: Phaser.Scale.FIT,
    width: 1200,
    height: 650,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 },
      fps: 120  // Higher physics framerate to prevent tunneling
    }
  },
  scene: [MainMenuScene, GameScene]
};

const game = new Phaser.Game(config);

// Expose game to window for resize handling
window.game = game;
