import Phaser from 'phaser';

// ============================================
// BUNNY BASHERS - MEDIEVAL CASTLE THEME
// ============================================

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
  // Level 2: First obstacle - Learn to ricochet
  {
    ammo: 4,
    pandas: [{ x: 1000, y: 200 }, { x: 1000, y: 450 }],
    obstacles: [
      { x: 700, y: 325, w: 20, h: 350 }, // Vertical bamboo blocking direct shots
    ],
    movingObstacles: []
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
];

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

    if (data.level) {
      this.level = data.level;
    }
  }

  preload() {
    // Load character sprites
    this.load.image('bunny-hero', '/assets/bunny-hero.png');
    this.load.image('panda-jason', '/assets/panda-jason.png');
    this.load.image('panda-pennywise', '/assets/panda-pennywise.png');
    this.load.image('panda-freddy', '/assets/panda-freddy.png');
    this.load.image('panda-leatherface', '/assets/panda-leatherface.png');
    this.load.image('panda-beetlejuice', '/assets/panda-beetlejuice.png');
    this.load.image('logo', '/assets/logo.png');
    this.load.image('bamboo', '/assets/bamboo.png');
  }

  create() {
    // Reset time scale in case slow-mo was active
    this.time.timeScale = 1;
    this.physics.world.timeScale = 1;

    const levelConfig = LEVELS[Math.min(this.level - 1, LEVELS.length - 1)];
    this.ammoTotal = levelConfig.ammo;
    this.ammoRemaining = levelConfig.ammo;
    this.selectedAmmo = 1;
    this.gameTime = 0;
    this.movingWalls = [];

    // Plain black background
    this.cameras.main.setBackgroundColor(0x000000);

    // Create bamboo border walls
    this.createBambooWalls();

    // Create interior obstacles (static)
    this.createObstacles(levelConfig.obstacles);

    // Create moving obstacles
    if (levelConfig.movingObstacles) {
      this.createMovingObstacles(levelConfig.movingObstacles);
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

      // Physics hitbox matches visual exactly (no padding in image anymore)
      const hitboxThickness = visualThickness;

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

      // Physics body - match the visual bamboo size
      const isVertical = obs.h > obs.w;
      const hitboxW = isVertical ? visualThickness : length;
      const hitboxH = isVertical ? length : visualThickness;
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

    // Use the sprite image!
    const bunnySprite = this.add.image(0, 0, 'bunny-hero');
    bunnySprite.setScale(0.09); // Scale down to fit game
    bunnySprite.setOrigin(0.5, 1); // Origin at bottom center so feet touch floor

    // Ground shadow - positioned at the bunny's feet
    const shadow = this.add.ellipse(0, 0, 45, 12, 0x000000, 0.4);

    this.bunny.add([shadow, bunnySprite]);

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
      if (this.bulletFired || this.ammoRemaining <= 0 || this.levelEnded) return;

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

    // Skip to next level (N)
    this.input.keyboard.on('keydown-N', () => {
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
    if (!this.aimLine) return;

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

    const speed = power * 4;

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

    // Brief bright flash (steel striking)
    const impactFlash = this.add.circle(bx, by, 4, COLORS.torchYellow, 1);
    this.tweens.add({
      targets: impactFlash,
      scale: 2.5,
      alpha: 0,
      duration: 100,
      ease: 'Sine.easeOut',
      onComplete: () => impactFlash.destroy()
    });

    // Fire burst from flaming bolt
    const fireBurst = this.add.circle(bx, by, 8, COLORS.dragonFire, 0.7);
    this.tweens.add({
      targets: fireBurst,
      scale: 2,
      alpha: 0,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => fireBurst.destroy()
    });

    // Metal sparks (steel on stone)
    const velX = this.bullet.body.velocity.x;
    const velY = this.bullet.body.velocity.y;
    const sparkCount = 8 + Math.floor(Math.random() * 6);

    for (let i = 0; i < sparkCount; i++) {
      const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.7;
      const baseAngle = Math.atan2(-velY, -velX);
      const sparkAngle = baseAngle + spreadAngle;
      const sparkDist = 25 + Math.random() * 40;

      const sparkSize = 1 + Math.random() * 2;
      // Metal spark colors: bright yellow/white fading to orange
      const sparkColor = Math.random() > 0.4 ? COLORS.torchYellow : COLORS.torchOrange;

      const spark = this.add.circle(bx, by, sparkSize, sparkColor, 1);

      const endX = bx + Math.cos(sparkAngle) * sparkDist;
      const endY = by + Math.sin(sparkAngle) * sparkDist + (Math.random() * 20); // slight gravity

      this.tweens.add({
        targets: spark,
        x: endX,
        y: endY,
        scale: 0.1,
        alpha: 0,
        duration: 150 + Math.random() * 150,
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

    // Victory banner
    const banner = this.add.graphics();
    banner.fillStyle(0x8B0000);
    banner.fillRect(350, 200, 500, 80);
    banner.lineStyle(4, 0xFFD700);
    banner.strokeRect(350, 200, 500, 80);

    const victoryText = this.add.text(600, 240, 'SOULS FREED!', {
      fontSize: '44px',
      fontFamily: 'Georgia, serif',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const statsText = this.add.text(600, 320, `Ammo remaining: ${this.ammoRemaining}`, {
      fontSize: '22px',
      fontFamily: 'Georgia, serif',
      color: '#C9A86C',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const nextText = this.add.text(600, 380, 'Click or press N for next level', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    const restartText = this.add.text(600, 415, 'Press R to replay this level', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#888888'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: victoryText,
      scale: 1.05,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Epic celebration - gold confetti and fireworks!
    this.createVictoryCelebration();

    // Click to go to next level
    this.input.once('pointerdown', () => {
      const nextLevel = Math.min(this.level + 1, LEVELS.length);
      this.scene.restart({ level: nextLevel });
    });

    // Also allow N key for next level (R is handled by main input handler)
    this.input.keyboard.once('keydown-N', () => {
      const nextLevel = Math.min(this.level + 1, LEVELS.length);
      this.scene.restart({ level: nextLevel });
    });
  }

  onLevelFailed() {
    this.levelEnded = true;

    const overlay = this.add.rectangle(600, 325, 1200, 650, 0x000000, 0.85);

    const failText = this.add.text(600, 240, 'THE SHADOWS REMAIN...', {
      fontSize: '38px',
      fontFamily: 'Georgia, serif',
      color: '#8B0000',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const sadPanda = this.add.text(600, 320, '🐼⛓️', {
      fontSize: '48px'
    }).setOrigin(0.5);

    const retryText = this.add.text(600, 400, 'Press R or click to retry', {
      fontSize: '22px',
      fontFamily: 'Georgia, serif',
      color: '#C9A86C'
    }).setOrigin(0.5);

    const skipText = this.add.text(600, 290, 'Press N to skip level', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#6B6B6B'
    }).setOrigin(0.5);

    // Click to retry
    this.input.once('pointerdown', () => {
      this.scene.restart({ level: this.level });
    });

    // N key for next/skip level (R is handled by main input handler)
    this.input.keyboard.once('keydown-N', () => {
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
      gravity: { y: 0 }
    }
  },
  scene: GameScene
};

const game = new Phaser.Game(config);
