import Phaser from 'phaser';

// ============================================
// BUNNY BASHERS - MEDIEVAL CASTLE THEME
// ============================================

// Available bunny skins with position offsets to align them
const BUNNY_SKINS = [
  { id: 'bunny-hero', name: 'Classic', offsetX: 0, offsetY: 0, scale: 0.09 },
  { id: 'bunny-mobster', name: 'Mobster', offsetX: 0, offsetY: 25, scale: 0.09 },  // No ears, needs Y offset
  { id: 'bunny-crimson', name: 'Crimson', offsetX: 0, offsetY: 0, scale: 0.09 }
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

// Level configurations - Much harder with angles and moving parts
// Game area is now 1200x650 landscape (bamboo frame fills entire canvas)
// Bunny is at bottom-left around x:150, y:580
// Bamboo obstacles scale uniformly - longer bamboo = proportionally thicker
// For good visibility use lengths of 250-400px
const LEVELS = [
  // Level 1: Tutorial - Simple open shot, learn the basics
  {
    ammo: 3,
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
  // Level 3: Angled bamboo - Learn angle shots
  {
    ammo: 5,
    pandas: [{ x: 1050, y: 150 }, { x: 1050, y: 500 }],
    obstacles: [
      { x: 550, y: 280, w: 350, h: 20, angle: 20 }, // Angled bamboo for ricochet practice
      { x: 800, y: 325, w: 20, h: 250 }, // Vertical blocker
    ],
    movingObstacles: []
  },
  // Level 4: First moving obstacle
  {
    ammo: 5,
    pandas: [{ x: 1000, y: 200 }, { x: 1000, y: 450 }, { x: 650, y: 325 }],
    obstacles: [
      { x: 450, y: 200, w: 300, h: 20, angle: 15 },
      { x: 450, y: 450, w: 300, h: 20, angle: -15 },
    ],
    movingObstacles: [
      { x: 750, y: 325, w: 20, h: 200, moveX: 0, moveY: 80, speed: 0.7 }
    ]
  },
  // Level 5: The corridor - Timing challenge
  {
    ammo: 6,
    pandas: [{ x: 1050, y: 150 }, { x: 1050, y: 325 }, { x: 1050, y: 500 }],
    obstacles: [
      { x: 500, y: 325, w: 20, h: 400 }, // Long vertical bamboo
      { x: 750, y: 150, w: 20, h: 200 },
      { x: 750, y: 500, w: 20, h: 200 },
    ],
    movingObstacles: [
      { x: 750, y: 325, w: 250, h: 18, moveX: 0, moveY: 100, speed: 0.8 }
    ]
  },
  // Level 6: The gauntlet - Multiple paths
  {
    ammo: 7,
    pandas: [{ x: 1050, y: 120 }, { x: 1050, y: 325 }, { x: 1050, y: 530 }, { x: 700, y: 220 }],
    obstacles: [
      { x: 400, y: 200, w: 300, h: 18, angle: 25 },
      { x: 400, y: 450, w: 300, h: 18, angle: -25 },
      { x: 850, y: 325, w: 18, h: 280 },
    ],
    movingObstacles: [
      { x: 600, y: 325, w: 18, h: 180, moveX: 0, moveY: 70, speed: 1.0 },
      { x: 600, y: 150, w: 200, h: 16, moveX: 60, moveY: 0, speed: 0.6 },
    ]
  },
  // Level 7: The Maze - Complex ricochet puzzle (from design doc)
  // Game area: 1200x650, playable area ~1160x610 (20px bamboo border)
  // Grid reference: ~24 cols x 12 rows, each cell ~48x50px
  {
    ammo: 8,
    pandas: [
      // Panda 1: Behind left vertical bar - moved left to avoid top-left bamboo (x=400)
      // Panda hitbox ~45px radius, need 60px+ clearance
      { x: 320, y: 180 },
      // Panda 2: Top right area - clear of right upper bamboo (x=920)
      { x: 1050, y: 150 },
      // Panda 3: Center - moved up to avoid lower-center horizontal (y=430)
      { x: 640, y: 340 },
      // Panda 4: Bottom right - clear of obstacles
      { x: 1050, y: 530 }
    ],
    obstacles: [
      // 1. Left vertical bamboo - connects to left wall, ~col 5, rows 3-9
      // Position: x=240, y=325 (center), height ~300px
      { x: 240, y: 325, w: 20, h: 300 },

      // 2. Top-left vertical bamboo - ~col 8, rows 1-4
      // Position: x=385, y=130, height ~180px
      { x: 400, y: 140, w: 20, h: 200 },

      // 3. Top-center vertical bamboo - ~col 12, rows 1-4
      // Position: x=575, y=130, height ~180px
      { x: 590, y: 140, w: 20, h: 200 },

      // 4. Center-right vertical bamboo - ~col 15, rows 3-7
      // Position: x=720, y=260, height ~200px
      { x: 740, y: 280, w: 20, h: 220 },

      // 5. Middle-left horizontal bamboo - ~cols 5-8, row 6
      // Position: x=290, y=325, width ~150px (connects to left vertical)
      { x: 310, y: 325, w: 150, h: 20 },

      // 6. Center vertical bamboo (small) - ~col 11, rows 7-9
      // Position: x=530, y=420, height ~140px
      { x: 545, y: 430, w: 20, h: 160 },

      // 7. Lower-center horizontal bamboo - ~cols 10-14, row 8
      // Position: x=575, y=420, width ~200px
      { x: 590, y: 430, w: 180, h: 20 },

      // 8. Bottom horizontal bamboo - ~cols 12-16, row 11
      // Position: x=670, y=560, width ~200px
      { x: 680, y: 570, w: 200, h: 20 },

      // 9. Right upper vertical bamboo - ~col 19, rows 2-5
      // Position: x=910, y=180, height ~180px
      { x: 920, y: 190, w: 20, h: 200 },

      // 10. Right lower vertical bamboo - ~col 19, rows 9-12
      // Position: x=910, y=500, height ~180px
      { x: 920, y: 510, w: 20, h: 200 },
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
    const bunny = this.add.image(220, 330, currentSkin);
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
    this.bullet = null;
    this.bunny = null;
    this.pandas = [];
    this.walls = [];
    this.movingWalls = [];
    this.obstacleImages = []; // Store bamboo obstacle images
    this.chandeliers = []; // Store chandelier objects
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

    if (data.level) {
      this.level = data.level;
    }
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
  }

  create() {
    // Show UI elements when game starts
    document.getElementById('sidebar').classList.add('visible');
    document.getElementById('bottom-bar').classList.add('visible');

    // Setup sidebar button handlers
    this.setupSidebarButtons();

    // Reset time scale in case slow-mo was active
    this.time.timeScale = 1;
    this.physics.world.timeScale = 1;

    const levelConfig = LEVELS[Math.min(this.level - 1, LEVELS.length - 1)];
    this.ammoTotal = levelConfig.ammo;
    this.ammoRemaining = levelConfig.ammo;
    this.selectedAmmo = 1;
    this.gameTime = 0;
    this.movingWalls = [];

    // Set background - use level-specific or default to black
    this.cameras.main.setBackgroundColor(0x000000);

    // Create starry sky background
    this.createStarryBackground();

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

    // Add ambient particles (dust/embers)
    this.createAmbientParticles();

    // Create aim line graphics (always visible)
    this.aimLine = this.add.graphics();
    this.trajectoryDots = [];
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
    obstacles.forEach(obs => {
      const angle = obs.angle || 0;
      const angleRad = Phaser.Math.DegToRad(angle);
      const length = Math.max(obs.w, obs.h);

      // Bamboo image is 3390x70 (tightly cropped, no transparent padding)
      const BAMBOO_WIDTH = 3390;
      const BAMBOO_HEIGHT = 70;

      // Draw bamboo obstacle - scale uniformly based on desired length
      const bamboo = this.add.image(obs.x, obs.y, 'bamboo');
      const scale = length / BAMBOO_WIDTH;
      // Visual thickness = 70 * scale (e.g., 350px bamboo = 70 * 0.103 = ~7px thick)
      const visualThickness = BAMBOO_HEIGHT * scale;
      bamboo.setScale(scale);
      // Rotate: if vertical (h > w), rotate 90. Then add any angle offset.
      const baseAngle = obs.h > obs.w ? 90 : 0;
      bamboo.setAngle(baseAngle + angle);
      // Store reference to prevent any issues
      this.obstacleImages.push(bamboo);

      // Physics hitbox - minimum 20px thick to prevent bullet tunneling
      const hitboxThickness = Math.max(visualThickness, 20);

      if (angle === 0) {
        // Simple case: no rotation, single physics body
        const isVertical = obs.h > obs.w;
        const hitboxW = isVertical ? hitboxThickness : length;
        const hitboxH = isVertical ? length : hitboxThickness;
        const wall = this.add.rectangle(obs.x, obs.y, hitboxW, hitboxH, 0x000000, 0);
        this.physics.add.existing(wall, true);
        this.walls.push(wall);
      } else {
        // Angled obstacle: create NON-overlapping colliders along the length
        // This approximates the angled shape since Arcade physics doesn't support rotation
        const numSegments = Math.ceil(length / 20);
        const segmentLength = length / numSegments;

        for (let i = 0; i < numSegments; i++) {
          const t = (i + 0.5) / numSegments - 0.5; // -0.5 to 0.5
          const segX = obs.x + Math.cos(angleRad) * (t * length);
          const segY = obs.y + Math.sin(angleRad) * (t * length);

          // Use calculated hitbox thickness
          const segment = this.add.rectangle(segX, segY, segmentLength, hitboxThickness, 0x000000, 0);
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

    // Store gun offset for bullet firing - at the tip of the gun barrel
    // The bunny sprite faces right with gun extended
    // Sprite origin is at bottom center (0.5, 1), so negative Y moves up from feet
    this.bunny.gunOffsetX = 65;  // At the gun barrel tip (right side)
    this.bunny.gunOffsetY = -75; // At the gun barrel height (up from feet)

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

  setupSidebarButtons() {
    // Home button - return to main menu
    const homeBtn = document.getElementById('btn-home');
    homeBtn.onclick = () => {
      // Hide UI elements
      document.getElementById('sidebar').classList.remove('visible');
      document.getElementById('bottom-bar').classList.remove('visible');
      // Reset game state
      this.level = 1;
      this.score = 0;
      // Go to main menu
      this.scene.start('MainMenuScene');
    };

    // Settings button - show settings (placeholder for now)
    const settingsBtn = document.getElementById('btn-settings');
    settingsBtn.onclick = () => {
      this.showSettingsModal();
    };

    // Levels button - show level select
    const levelsBtn = document.getElementById('btn-levels');
    levelsBtn.onclick = () => {
      this.showLevelSelectModal();
    };

    // Controls button - show controls info
    const controlsBtn = document.getElementById('btn-controls');
    controlsBtn.onclick = () => {
      this.showControlsModal();
    };

    // Skins button - show skin selection
    const skinsBtn = document.getElementById('btn-skins');
    skinsBtn.onclick = () => {
      this.showSkinsModal();
    };
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
    const title = this.add.text(0, -120, 'SETTINGS', {
      fontSize: '24px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#FFD700'
    }).setOrigin(0.5);

    // Sound toggle (placeholder)
    const soundLabel = this.add.text(-80, -40, 'Sound:', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#CCCCCC'
    }).setOrigin(0, 0.5);

    const soundStatus = this.add.text(80, -40, 'ON', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#88CC88'
    }).setOrigin(0.5);

    // Music toggle (placeholder)
    const musicLabel = this.add.text(-80, 10, 'Music:', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#CCCCCC'
    }).setOrigin(0, 0.5);

    const musicStatus = this.add.text(80, 10, 'ON', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#88CC88'
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.container(0, 100);
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
      this.time.delayedCall(100, () => {
        this.settingsOverlay = null;
      });
    });

    this.settingsOverlay.add([bg, title, soundLabel, soundStatus, musicLabel, musicStatus, closeBtn]);
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

    // Control instructions
    const controls = [
      { key: 'CLICK', action: 'Shoot' },
      { key: '1-9', action: 'Select ammo' },
      { key: 'R', action: 'Restart level' },
      { key: 'S', action: 'Skip level' }
    ];

    const controlTexts = [];
    controls.forEach((ctrl, i) => {
      const keyText = this.add.text(-80, -50 + i * 35, ctrl.key, {
        fontSize: '16px',
        fontFamily: 'Cinzel, Georgia, serif',
        color: '#FFD700'
      }).setOrigin(0, 0.5);

      const actionText = this.add.text(80, -50 + i * 35, ctrl.action, {
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
      this.time.delayedCall(100, () => {
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
      this.time.delayedCall(100, () => {
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

  createAmmoUI() {
    // Restore ammo panel structure if it was replaced (e.g., by next level button)
    const ammoPanel = document.querySelector('.ammo-panel');
    if (ammoPanel && !document.getElementById('ammo-buttons')) {
      ammoPanel.innerHTML = `
        <span class="ammo-label">AMMO</span>
        <div class="ammo-buttons" id="ammo-buttons"></div>
      `;
    }

    // Create HTML ammo buttons
    const container = document.getElementById('ammo-buttons');
    container.innerHTML = '';

    for (let i = 1; i <= this.ammoTotal; i++) {
      const btn = document.createElement('button');
      btn.className = 'ammo-btn';
      btn.textContent = i;
      btn.dataset.value = i;
      btn.addEventListener('click', () => {
        if (i <= this.ammoRemaining) {
          this.selectedAmmo = i;
          this.updateAmmoUI();
        }
      });
      container.appendChild(btn);
    }

    this.updateAmmoUI();
  }

  updateAmmoUI() {
    const buttons = document.querySelectorAll('.ammo-btn');
    buttons.forEach((btn) => {
      const value = parseInt(btn.dataset.value);
      btn.classList.remove('selected', 'used');

      if (value <= this.ammoRemaining) {
        if (value <= this.selectedAmmo) {
          btn.classList.add('selected');
        }
      } else {
        btn.classList.add('used');
      }
    });
  }

  setupInput() {
    // Fire on mouse release - aim while holding, release to shoot
    this.input.on('pointerup', (pointer) => {
      if (this.bulletFired || this.ammoRemaining <= 0 || this.levelEnded || this.settingsOverlay) return;

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

    // Ammo selection keys
    this.input.keyboard.on('keydown-ONE', () => this.selectAmmo(1));
    this.input.keyboard.on('keydown-TWO', () => this.selectAmmo(2));
    this.input.keyboard.on('keydown-THREE', () => this.selectAmmo(3));
    this.input.keyboard.on('keydown-FOUR', () => this.selectAmmo(4));
    this.input.keyboard.on('keydown-FIVE', () => this.selectAmmo(5));

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
      this.scene.restart({ level: this.level });
    });

    // Skip to next level (S)
    this.input.keyboard.on('keydown-S', () => {
      const nextLevel = Math.min(this.level + 1, LEVELS.length);
      this.scene.restart({ level: nextLevel });
    });
  }

  selectAmmo(amount) {
    if (amount <= this.ammoRemaining && amount >= 1) {
      this.selectedAmmo = amount;
      this.updateAmmoUI();
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
    // Use time-based cooldown - ignore bounces within 100ms of each other
    const now = Date.now();
    if (this.bullet.lastBounceTime && now - this.bullet.lastBounceTime < 100) {
      return;
    }
    this.bullet.lastBounceTime = now;

    this.bullet.bounceCount++;

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

    if (this.bullet.bounceCount >= this.bullet.maxBounces) {
      this.destroyBullet();
    }
  }

  onPandaHit(panda) {
    if (!panda.active) return;

    const index = this.pandas.indexOf(panda);
    if (index > -1) {
      this.pandas.splice(index, 1);
    }

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
    if (this.bullet) {
      if (this.bullet.container) this.bullet.container.destroy();
      this.bullet.destroy();
      this.bullet = null;
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

    const statsText = this.add.text(600, 270, `Ammo remaining: ${this.ammoRemaining}`, {
      fontSize: '18px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#C9A86C'
    }).setOrigin(0.5);

    const nextText = this.add.text(600, 340, 'Click or press S for next level', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#CCCCCC'
    }).setOrigin(0.5);

    const restartText = this.add.text(600, 380, 'Press R to replay this level', {
      fontSize: '14px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#666666'
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

    // Transform ammo panel into "NEXT LEVEL" button
    this.showNextLevelButton();

    // Click to go to next level
    this.input.once('pointerdown', () => {
      const nextLevel = Math.min(this.level + 1, LEVELS.length);
      this.scene.restart({ level: nextLevel });
    });

    // Also allow S key for next level (R is handled by main input handler)
    this.input.keyboard.once('keydown-S', () => {
      const nextLevel = Math.min(this.level + 1, LEVELS.length);
      this.scene.restart({ level: nextLevel });
    });
  }

  showNextLevelButton() {
    const ammoPanel = document.querySelector('.ammo-panel');
    if (ammoPanel) {
      ammoPanel.innerHTML = `
        <button class="next-level-btn" id="next-level-btn">
          NEXT LEVEL →
        </button>
      `;
      const btn = document.getElementById('next-level-btn');
      btn.addEventListener('click', () => {
        const nextLevel = Math.min(this.level + 1, LEVELS.length);
        this.scene.restart({ level: nextLevel });
      });
    }
  }

  onLevelFailed() {
    this.levelEnded = true;

    const overlay = this.add.rectangle(600, 325, 1200, 650, 0x000000, 0.85);

    // Failure modal - matches new aesthetic
    const modalBg = this.add.rectangle(600, 300, 420, 280, 0x1A1714, 0.95);
    modalBg.setStrokeStyle(3, 0x8B4513);

    const failText = this.add.text(600, 200, 'THE SHADOWS REMAIN...', {
      fontSize: '28px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#8B0000'
    }).setOrigin(0.5);

    const sadPanda = this.add.text(600, 280, '🐼⛓️', {
      fontSize: '42px'
    }).setOrigin(0.5);

    const retryText = this.add.text(600, 350, 'Press R or click to retry', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#C9A86C'
    }).setOrigin(0.5);

    const skipText = this.add.text(600, 390, 'Press S to skip level', {
      fontSize: '14px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#666666'
    }).setOrigin(0.5);

    // Click to retry
    this.input.once('pointerdown', () => {
      this.scene.restart({ level: this.level });
    });

    // S key for next/skip level (R is handled by main input handler)
    this.input.keyboard.once('keydown-S', () => {
      const nextLevel = Math.min(this.level + 1, LEVELS.length);
      this.scene.restart({ level: nextLevel });
    });
  }

  restartLevel() {
    this.scene.restart({ level: this.level });
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
  width: 1200,
  height: 650,
  parent: 'game-container',
  backgroundColor: 0x1A1A1F,
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
