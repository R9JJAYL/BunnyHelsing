# Bunny Helsing - Project Instructions for Claude

## Project Overview
Bunny Helsing is a Phaser 3 ricochet shooting game where players shoot bullets that bounce off bamboo walls to hit panda enemies.

## Key Rules

### Deployment
- **NEVER push to live/remote unless explicitly asked** - make changes locally for preview first
- When asked to "push live", commit and push to the remote repository
- Preview mode is accessed via `?edit=true` URL parameter

### Code Style
- This is a vanilla JavaScript project using Phaser 3
- Main game logic is in `/src/main.js`
- Keep code in existing patterns - don't refactor unless asked

### File Structure
- `/src/main.js` - Main game file with all scenes and logic
- `/public/assets/` - Game assets (images, sounds)
- `/index.html` - Entry point with UI modals

## Game Architecture

### Key Classes/Scenes
- `MainMenuScene` - Title screen with play button and character display
- `GameScene` - Main gameplay scene

### Important Config Objects
- `BUNNY_SKINS` - Array of skin configs with offsetX, offsetY, scale, gunX, gunY
- `LEVELS` - Array of level configurations with ammo, pandas, obstacles

### Level Editor (Edit Mode)
- Access with `?edit=true` URL parameter
- Keyboard controls:
  - Arrow keys: resize (up/down = length, left/right = rotate)
  - F/T: make fatter/thinner
  - N: spawn new bamboo
  - P: toggle practice mode
  - Backspace: delete selected

### Physics Notes
- Bamboo hitboxes use Arcade physics rectangles
- Axis-aligned angles (0, 90, 180, 270) use single rectangle hitboxes
- Non-axis-aligned angles use overlapping segment hitboxes
- Bullet bounce debounce is 150ms to prevent double-hits

## Common Tasks

### Adding a new level
1. Add config to `LEVELS` array with: ammo, pandas[], obstacles[], movingObstacles[]
2. Obstacles need: x, y, w, h, and optional angle

### Adjusting skin positions
- Modify `BUNNY_SKINS` array - offsetX/offsetY control character position
- Positive offsetY moves down, negative moves up
- gunX/gunY control where bullets fire from

### Debugging hitboxes
- In edit mode, hitboxes show as red semi-transparent rectangles
- Set `hitboxAlpha` to 0.3 to see hitboxes in normal play

---

## Known Bugs & Fixes (Self-Healing Reference)

### Bug: Bullet bouncing back in same direction
**Cause:** Multiple hitbox segments on angled bamboo causing edge collisions
**Fix:** Use single rectangle hitboxes for axis-aligned angles (0, 90, 180, 270). Check `isAxisAligned = angle % 90 === 0`

### Bug: Bullet going through walls
**Cause:** Bullet moving too fast (tunneling) or hitbox gaps
**Fix:** Cap bullet speed (`Math.min(power * 4, 600)`), ensure hitbox thickness is at least 20px

### Bug: Double bounce counting
**Cause:** Multiple collision callbacks firing for same hit
**Fix:** Debounce in `onBulletBounce()` - ignore bounces within 150ms of each other

### Bug: Modal closes and shoots
**Cause:** Click event propagating through modal to game
**Fix:** Set `this.settingsOverlay` flag and check it before allowing shots

### Bug: Bamboo visual doesn't match hitbox
**Cause:** Using `setScale()` instead of `setDisplaySize()` or wrong rotation
**Fix:** Use `setDisplaySize(length, thickness)` then rotate. For vertical bamboo (h > w), add 90° base rotation

### Bug: Tutorial message appears while bullet still moving
**Cause:** Timer-based trigger instead of event-based
**Fix:** Trigger tutorial steps in `destroyBullet()` not in `onBulletBounce()`

### Bug: Skin positions misaligned
**Cause:** Different artwork positions within same-size images
**Fix:** Adjust `offsetX` and `offsetY` in `BUNNY_SKINS` config for each skin

### Bug: Spawned bamboo looks wrong size
**Cause:** Using scale instead of display size
**Fix:** Use `setDisplaySize(length, thickness)` in `updateBambooVisual()` matching `createObstacles()`

---

## Code Patterns to Follow

### Adding collision handlers
```javascript
// Use static group to prevent multiple callbacks
const wallGroup = this.physics.add.staticGroup();
this.walls.forEach(wall => wallGroup.add(wall));
this.physics.add.collider(this.bullet, wallGroup, () => {
  this.onBulletBounce();
});
```

### Creating bamboo obstacles
```javascript
// Visual
const bamboo = this.add.image(x, y, 'bamboo');
bamboo.setDisplaySize(length, thickness);
bamboo.setAngle(baseAngle + customAngle);

// Hitbox (axis-aligned)
const wall = this.add.rectangle(x, y, w, h, 0x000000, 0);
this.physics.add.existing(wall, true);
```

### Checking edit mode
```javascript
this.editMode = new URLSearchParams(window.location.search).get('edit') === 'true';
```

### Safe bullet operations
```javascript
if (!this.bullet || !this.bullet.body) return;
```

---

## Testing Checklist
Before pushing live, verify:
- [ ] Tutorial completes without errors
- [ ] All 3 levels playable
- [ ] Bounces work correctly on all walls
- [ ] Skins switch properly and align correctly
- [ ] No console errors
- [ ] Modals don't trigger shots when closing
