import Phaser from 'phaser'
import { submitScore } from './supabase'

class PlayScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private platforms!: Phaser.Physics.Arcade.Group
  private spawnTimer!: Phaser.Time.TimerEvent
  private readonly laneYPositions: number[] = []
  private groundTile!: Phaser.GameObjects.TileSprite
  private collectibles!: Phaser.Physics.Arcade.Group
  private collectibleTimer!: Phaser.Time.TimerEvent
  private score: number = 0
  private scoreText!: Phaser.GameObjects.Text
  private enemies!: Phaser.Physics.Arcade.Group
  private enemyTimer!: Phaser.Time.TimerEvent
  private gameTime: number = 0
  private lives: number = 3
  private isFrozen: boolean = false
  private freezeTimer?: Phaser.Time.TimerEvent
  private gameOverState: boolean = false
  private gameStarted: boolean = false
  private countdownActive: boolean = false
  private countdownTime: number = 3
  private countdownText?: Phaser.GameObjects.Text
  private countdownTimer?: Phaser.Time.TimerEvent
  private playerSelectionActive: boolean = false
  private selectedPlayer: string = 'dj_right' // Default to DJ1
  private playerSelectionScreen?: Phaser.GameObjects.Image
  private dj1Button?: Phaser.GameObjects.Rectangle
  private dj2Button?: Phaser.GameObjects.Rectangle
  private livesText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private restartButton?: Phaser.GameObjects.Text
  private gameOverText?: Phaser.GameObjects.Text
  private therapyText?: Phaser.GameObjects.Text
  private zombieSprite?: Phaser.GameObjects.Sprite
  private introScreen?: Phaser.GameObjects.Image
  private startText?: Phaser.GameObjects.Text
  private taglineText?: Phaser.GameObjects.Text
  private endingScreen?: Phaser.GameObjects.Image
  private heartParticles?: Phaser.GameObjects.Particles.ParticleEmitter
  private sparkleParticles?: Phaser.GameObjects.Particles.ParticleEmitter
  private baseSpeed: number = 600 // Higher base speed for high-tempo gameplay
  private speedMultiplier: number = 1.0
  private levelSpeed: number = 1.0 // Speed multiplier for current level
  private currentLevel: number = 1 // Current level (1-3)
  private levelStartTime: number = 0 // Time when current level started
  private levelSpeedIncrease: number = 0.1 // Speed increase per second
  private maxLevelSpeed: number = 2.5 // Maximum speed multiplier per level
  private gameOverMusic?: Phaser.Sound.BaseSound
  private mainThemeMusic?: Phaser.Sound.BaseSound
  private introMusic?: Phaser.Sound.BaseSound
  private djSelectSound?: Phaser.Sound.BaseSound
  private deathSound?: Phaser.Sound.BaseSound
  private bossSpawnSound?: Phaser.Sound.BaseSound
  private bossDeathSound?: Phaser.Sound.BaseSound
  private skyBackground?: Phaser.GameObjects.TileSprite
  private isMuted: boolean = false
  private muteButton?: Phaser.GameObjects.Text
  
  // Leaderboard properties
  private leaderboardScreen?: Phaser.GameObjects.Container
  private leaderboardTimer?: Phaser.Time.TimerEvent
  private initialsInput?: Phaser.GameObjects.Text
  private emailInput?: Phaser.GameObjects.Text
  private submitButton?: Phaser.GameObjects.Text
  private currentInput: 'initials' | 'email' = 'initials'
  private initialsText: string = ''
  private emailText: string = ''
  private bosses!: Phaser.Physics.Arcade.Group
  private currentBoss?: Phaser.GameObjects.Sprite
  private bossHealth: number = 0
  private maxBossHealth: number = 3
  private bossDefeated: boolean = false
  private bossSpawnedAt: number[] = [1500, 3000, 4500] // Wellbeing milestones for boss spawns (Boss 1 at 1500, Boss 2 at 3000, Boss 3 at 4500)
  private bossesSpawned: boolean[] = [false, false, false] // Track which bosses have been spawned
  private lastBossDeathScore: number = 0 // Track score when last boss died
  private lastAutoEscape: number = 0 // Track last auto-escape to prevent spam
  private bossDirection: number = 1 // 1 for right, -1 for left
  private bossFloatTimer: number = 0
  private bossFloatSpeed: number = 0.002 // Speed of floating animation
  private bossAttackTimer: number = 0
  private bossAttackInterval: number = 3000 // Attack every 3 seconds
  private bossIsAttacking: boolean = false
  private bossLasers!: Phaser.Physics.Arcade.Group
  private laserSpeed: number = 800 // Faster laser speed
  private bossTrailParticles?: Phaser.GameObjects.Particles.ParticleEmitter
  private lastBossX: number = 0
  private lastBossY: number = 0
  private bossMusicParticles?: Phaser.GameObjects.Particles.ParticleEmitter
  private bossDrones!: Phaser.Physics.Arcade.Group
  private droneBombs!: Phaser.Physics.Arcade.Group
  private droneSpeed: number = 150
  private bombSpeed: number = 200

  constructor() {
    super('PlayScene')
  }

  preload() {
    // DJ1 sprites
    this.load.image('dj_left', 'assets/dj.png')
    this.load.image('dj_right', 'assets/djr.png')
    
    // DJ2 sprites
    this.load.image('dj2_left', 'assets/dj2.png')
    this.load.image('dj2_right', 'assets/dj2r.png')
    
    // Load running animation sprites for DJ1
    this.load.image('dj_run2_left', 'assets/dj_run2_left.png')
    this.load.image('dj_run3_left', 'assets/dj_run3_left.png')
    this.load.image('dj_run2_right', 'assets/dj_run2_right.png')
    this.load.image('dj_run3_right', 'assets/dj_run3_right.png')
    
    // Load running animation sprites for DJ2
    this.load.image('dj2_run2_left', 'assets/dj2_run2_left.png')
    this.load.image('dj2_run3_left', 'assets/dj2_run3_left.png')
    this.load.image('dj2_run2_right', 'assets/dj2_run2_right.png')
    this.load.image('dj2_run3_right', 'assets/dj2_run3_right.png')
    
    // Load collectible images
    this.load.image('c_common', 'assets/c_common.png')
    this.load.image('c_uncommon', 'assets/c_uncommon.png')
    this.load.image('c_rare', 'assets/c_rare.png')
    this.load.image('c_epic', 'assets/c_epic.png')
    this.load.image('c_legendary', 'assets/c_legendary.png')
    this.load.image('c_mythic', 'assets/c_mythic.png')
    this.load.image('c_life', 'assets/c_life.png') // Extra life collectible
    
    // Load enemy images
    this.load.image('enemy1', 'assets/enemy1.png')
    this.load.image('enemy2', 'assets/enemy2.png')
    
    // Load zombie images
    this.load.image('zombie_left', 'assets/zombie_left.png')
    this.load.image('zombie_right', 'assets/zombie_right.png')
    this.load.image('zombie2_left', 'assets/zombie2_left.png')
    this.load.image('zombie2_right', 'assets/zombie2_right.png')
    
    // Load ending screens
    this.load.image('endingscreen', 'assets/endingscreen.png')
    this.load.image('dj2endingscreen', 'assets/dj2endingscreen.png')
    
    // Load pixel art heart for collection effect
    this.load.image('heart', 'assets/heart.png')
    
    // Load main theme music
    try {
      this.load.audio('mainTheme', 'assets/mainTheme.mp3')
    } catch (error) {
      console.log('Could not load main theme music:', error)
    }
    
    // Load intro music
    try {
      this.load.audio('introMusic', 'assets/introloop.mp3')
    } catch (error) {
      console.log('Could not load intro music:', error)
    }
    
    // Load DJ selection sound effect
    try {
      this.load.audio('djSelectSound', 'assets/djselect.mp3')
    } catch (error) {
      console.log('Could not load DJ selection sound:', error)
    }
    
    // Load player death sound effect
    try {
      this.load.audio('deathSound', 'assets/death.mp3')
    } catch (error) {
      console.log('Could not load death sound:', error)
    }
    
    // Load boss spawn sound effect
    try {
      this.load.audio('bossSpawnSound', 'assets/spawnBoss.mp3')
    } catch (error) {
      console.log('Could not load boss spawn sound:', error)
    }
    
    // Load boss death sound effect
    try {
      this.load.audio('bossDeathSound', 'assets/bossdeath.mp3')
    } catch (error) {
      console.log('Could not load boss death sound:', error)
    }
    
    // Load game over music (optional)
    try {
      this.load.audio('gameOverMusic', 'assets/gameOverMusic.mp3')
    } catch (error) {
      console.log('Could not load game over music:', error)
    }

    // Load sound effects
    try {
      this.load.audio('enemyStomp', 'assets/enemyStomp.mp3')
      this.load.audio('collectible', 'assets/collectible.mp3')
      this.load.audio('lifeUp', 'assets/8-bit-powerup-6768.mp3')
    } catch (error) {
      console.log('Could not load sound effects:', error)
    }
    
    // Load sky background
    this.load.image('sky', 'assets/sky.png')
    
    // Load grass texture for ground
    this.load.image('grass', 'assets/grass.png')
    
    // Load intro screen
    this.load.image('introScreen', 'assets/introScreen.png')
    
    // Load player selection screen
    this.load.image('choosedj', 'assets/choosedj.png')
    
    // Load boss assets (left and right facing versions)
    this.load.image('boss1_left', 'assets/boss1_left.png')
    this.load.image('boss1_right', 'assets/boss1_right.png')
    this.load.image('boss2_left', 'assets/boss2_left.png')
    this.load.image('boss2_right', 'assets/boss2_right.png')
    this.load.image('boss3_left', 'assets/boss3_left.png')
    this.load.image('boss3_right', 'assets/boss3_right.png')
    
    // Load unique boss projectile assets
    this.load.image('boss1_laser', 'assets/boss1_laser.png')
    this.load.image('boss2_hat', 'assets/boss2_hat.png')
    this.load.image('boss3_laser', 'assets/boss3_laser.png')
    
    // Load drone and bomb assets for Boss 3
    this.load.image('drone', 'assets/drone.png')
    this.load.image('bomb', 'assets/bomb.png')
    
    // Load music note for boss 3 music effect
    this.load.image('musicNote', 'assets/musicNote.png')
    
    // Create sparkle texture for enemy death effect
    const sparkleGfx = this.make.graphics({ x: 0, y: 0 })
    sparkleGfx.fillStyle(0xffffff, 1) // White color
    sparkleGfx.fillRect(0, 0, 4, 4)
    sparkleGfx.fillRect(2, 0, 4, 4)
    sparkleGfx.fillRect(0, 2, 4, 4)
    sparkleGfx.fillRect(2, 2, 4, 4)
    sparkleGfx.generateTexture('sparkle', 8, 8)

    // Create ethereal sparkle texture for boss trail
    const etherealGfx = this.make.graphics({ x: 0, y: 0 })
    etherealGfx.fillStyle(0xffffff, 1.0) // Solid white
    etherealGfx.fillCircle(3, 3, 3)
    etherealGfx.generateTexture('ethereal', 6, 6)
  }

  create() {
    const width = this.scale.width
    const height = this.scale.height

    // Show intro screen
    this.introScreen = this.add.image(width / 2, height / 2, 'introScreen')
    this.introScreen.setOrigin(0.5, 0.5)
    this.introScreen.setScrollFactor(0)
    this.introScreen.setDisplaySize(width, height)
    this.introScreen.setDepth(1000) // High depth to appear on top
    
    // Start intro music (stop any existing first)
    if (this.introMusic) {
      this.introMusic.stop()
      this.introMusic.destroy()
      this.introMusic = undefined
    }
    
    try {
      this.introMusic = this.sound.add('introMusic', { loop: true, volume: 0.3 })
      this.introMusic.play()
    } catch (error) {
      console.log('Could not play intro music:', error)
    }
    
    // Show tagline
    this.taglineText = this.add.text(width / 2, height / 6, 'Collect your memories, escape the feed... before it\'s too late', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    })
    this.taglineText.setOrigin(0.5, 0.5)
    this.taglineText.setScrollFactor(0)
    this.taglineText.setDepth(1001) // Even higher depth than intro screen
    
    // Show start text
    this.startText = this.add.text(width / 2, height / 2 + 130, 'Press Any Key or Click to Start', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '24px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2,
    })
    this.startText.setOrigin(0.5, 0.5)
    this.startText.setScrollFactor(0)
    this.startText.setDepth(1002) // Even higher depth than intro screen
    
    // Add pulsing animation to start text
    this.tweens.add({
      targets: this.startText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Main theme music will start when the game actually begins (in finishCountdown)
    
    // Add any key listener for starting the game (only on intro screen)
    this.input.keyboard!.on('keydown', () => {
      // Only start game if we're on the intro screen (not during gameplay)
      if (!this.gameStarted && !this.playerSelectionActive && !this.countdownActive) {
        this.startGame()
      }
    })
    
    // Make intro screen clickable to start game
    this.introScreen.setInteractive()
    this.introScreen.on('pointerdown', () => {
      // Only start game if we're on the intro screen (not during gameplay)
      if (!this.gameStarted && !this.playerSelectionActive && !this.countdownActive) {
        this.startGame()
      }
    })
    
    // Ground (green grass)
    // Ground texture now loaded from grass.png

    const ground = this.physics.add.staticImage(width / 2, height - 20, 'grass')
    ground.setDisplaySize(width, 40)
    ground.refreshBody()
    ground.setVisible(false)

    // Sky background (parallax - scrolls slower than foreground)
    // Fill the top portion of screen, bottom edge above ground
    this.skyBackground = this.add.tileSprite(width / 2, 0, width, height - 40, 'sky')
    this.skyBackground.setOrigin(0.5, 0) // Top origin to fill from top
    this.skyBackground.setScrollFactor(0)
    this.skyBackground.setDepth(-100) // Behind everything else

    // Visual ground scroll (grass texture)
    this.groundTile = this.add.tileSprite(width / 2, height - 20, width, 40, 'grass')
    this.groundTile.setOrigin(0.5, 0.5)
    this.groundTile.setScrollFactor(0)

    // Define 3 vertical lanes above ground
    // Lanes computed so the lowest lane leaves headroom to run under, and
    // gaps between layers allow the 58px player to run between blocks.
    // Given: playerHeight=58, blockHeight=24, groundDisplayHeight=40, clearance=8
    const playerHeight = 58
    const blockHeight = 24
    const groundDisplayHeight = 40
    const clearance = 8
    const groundTopY = height - groundDisplayHeight
    const maxLaneCenterYForUnderpass = groundTopY - playerHeight - clearance - blockHeight / 2
    const bottomLane = Math.floor(maxLaneCenterYForUnderpass - 6) // small safety margin
    // Require vertical spacing so (deltaY - blockHeight) >= playerHeight + clearance
    const laneSpacing = playerHeight + clearance + blockHeight + 4 // +4px buffer
    const middleLane = bottomLane - laneSpacing
    const topLane = middleLane - laneSpacing
    this.laneYPositions.splice(0, this.laneYPositions.length, bottomLane, middleLane, topLane)

    // Platform blocks group (immovable, no gravity)
    const blockGfx = this.make.graphics({ x: 0, y: 0 })
    blockGfx.fillStyle(0x6b7280, 1)
    blockGfx.fillRect(0, 0, 48, 24)
    blockGfx.generateTexture('block', 48, 24)

    this.platforms = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    })

    // Collectibles group (no gravity, overlap to collect)
    this.collectibles = this.physics.add.group({
      allowGravity: true,
      immovable: false,
    })

    // Collectibles now use loaded images instead of generated textures

    // Enemies group
    this.enemies = this.physics.add.group({
      allowGravity: true,
      immovable: false,
    })

    // Bosses group
    this.bosses = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    })

    // Boss lasers group
    this.bossLasers = this.physics.add.group({
      allowGravity: false,
      immovable: false,
    })

    // Boss drones group
    this.bossDrones = this.physics.add.group({
      allowGravity: false,
      immovable: false,
    })

    // Drone bombs group
    this.droneBombs = this.physics.add.group({
      allowGravity: true,
      immovable: false,
    })

    // Enemies now use loaded images instead of generated textures

    // Create heart particle system for collection effects
    this.heartParticles = this.add.particles(0, 0, 'heart', {
      x: 0,
      y: 0,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      speedY: { min: -150, max: -100 },
      speedX: { min: -50, max: 50 },
      lifespan: 1500,
      quantity: 5,
      emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 20), quantity: 5 }
    })
    this.heartParticles.stop()

    // Create sparkle particle system for enemy death effects
    this.sparkleParticles = this.add.particles(0, 0, 'sparkle', {
      x: 0,
      y: 0,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      speed: { min: 80, max: 150 },
      lifespan: 800,
      quantity: 8,
      emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 15), quantity: 8 }
    })
    this.sparkleParticles.stop()

    // Create ethereal trail particle system for boss (vertical falling effect)
    this.bossTrailParticles = this.add.particles(0, 0, 'ethereal', {
      x: 0,
      y: 0,
      scale: { start: 0.6, end: 0.1 },
      alpha: { start: 0.9, end: 0.2 },
      speed: { min: 0, max: 0 }, // No random speed
      speedY: { min: 60, max: 80 }, // Strong downward movement only
      speedX: { min: 0, max: 0 }, // No horizontal movement
      lifespan: 2000, // Shorter lifespan for cleaner trails
      quantity: 12, // Good amount of particles
      emitting: false,
      frequency: 40, // Emit frequently
      gravityY: 80, // Strong gravity for straight vertical fall
      emitZone: { 
        type: 'edge', 
        source: new Phaser.Geom.Rectangle(-8, -4, 16, 8), // Smaller, more focused emit zone
        quantity: 12
      }
    })
    
    // Create music note particle system for Boss 3 (gentle upward drift like hearts)
    this.bossMusicParticles = this.add.particles(0, 0, 'musicNote', {
      x: 0,
      y: 0,
      scale: { start: 1.5, end: 0.4 }, // Much bigger and more visible
      alpha: { start: 1.0, end: 0.0 }, // Full opacity to start
      speed: { min: 20, max: 40 }, // Gentle speed like hearts
      speedY: { min: -60, max: -30 }, // Gentle upward drift
      speedX: { min: -20, max: 20 }, // Slight horizontal drift
      lifespan: 2000, // Moderate lifespan
      quantity: 3, // Fewer notes for gentle effect
      emitting: false,
      frequency: 600, // Less frequent for gentle effect
      gravityY: -20, // Slight upward gravity like hearts
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, -30, 10), // Emit from boss head area (above center)
        quantity: 3
      }
    })

    // Player (DJ) using loaded texture (default facing right) - positioned closer to center for mobile-friendly gameplay
    this.player = this.physics.add.sprite(width * 0.5, height - 100, 'dj_right')
    this.player.setBounce(0.0)
    this.player.setCollideWorldBounds(true)
    this.player.body.setSize(this.player.width, this.player.height)
    
    // Ensure player can play animations
    this.player.setTexture('dj_left')
    
    // Create running animations (using current assets as first frame)
    this.anims.create({
      key: 'run_left',
      frames: [
        { key: 'dj_left' },      // Current left asset as frame 1
        { key: 'dj_run2_left' }, // New frame 2
        { key: 'dj_run3_left' }  // New frame 3
      ],
      frameRate: 10,
      repeat: -1
    })
    
    this.anims.create({
      key: 'run_right',
      frames: [
        { key: 'dj_right' },      // Current right asset as frame 1
        { key: 'dj_run2_right' }, // New frame 2
        { key: 'dj_run3_right' }  // New frame 3
      ],
      frameRate: 10,
      repeat: -1
    })
    
    // Create running animations for DJ2
    this.anims.create({
      key: 'run2_left',
      frames: [
        { key: 'dj2_left' },      // DJ2 left asset as frame 1
        { key: 'dj2_run2_left' }, // New frame 2
        { key: 'dj2_run3_left' }  // New frame 3
      ],
      frameRate: 10,
      repeat: -1
    })
    
    this.anims.create({
      key: 'run2_right',
      frames: [
        { key: 'dj2_right' },      // DJ2 right asset as frame 1
        { key: 'dj2_run2_right' }, // New frame 2
        { key: 'dj2_run3_right' }  // New frame 3
      ],
      frameRate: 10,
      repeat: -1
    })

    this.physics.add.collider(this.player, ground)
    // Simple collision: player is affected by blocks, blocks are not affected by player
    this.physics.add.collider(this.player, this.platforms)
    // Collectibles can sit on platforms/ground visually if desired; keep no gravity so they slide
    this.physics.add.collider(this.collectibles, this.platforms)
    this.physics.add.collider(this.collectibles, ground)
    this.physics.add.overlap(this.player, this.collectibles, (_p, c) => this.collectCollectible(c as Phaser.GameObjects.Sprite))
    
    // Enemy collisions
    this.physics.add.collider(this.enemies, ground)
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.handleEnemyCollision(e as Phaser.GameObjects.Sprite))
    
    // Boss collisions (no platform collision - bosses float)
    this.physics.add.overlap(this.player, this.bosses, (_p, b) => this.handleBossCollision(b as Phaser.GameObjects.Sprite))
    
    // Boss laser collisions
    this.physics.add.overlap(this.player, this.bossLasers, (_p, l) => this.handleLaserCollision(l as Phaser.GameObjects.Sprite))
    
    // Drone bomb collisions
    this.physics.add.overlap(this.player, this.droneBombs, (_p, b) => this.handleBombCollision(b as Phaser.GameObjects.Sprite))

    this.cursors = this.input.keyboard!.createCursorKeys()

    // Spawn loop for endless blocks
    const spawnIntervalMs = 700
    this.spawnTimer = this.time.addEvent({
      delay: spawnIntervalMs,
      loop: true,
      callback: () => this.spawnBlock(),
    })
    
    // Main theme music will start when game begins

    // Camera follow disabled per request (static camera)

    // Wellbeing UI
    this.scoreText = this.add.text(12, 10, 'Wellbeing: 0', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    })
    this.scoreText.setScrollFactor(0)

    // Lives UI
    this.livesText = this.add.text(12, 35, 'Lives: 3', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    })
    this.livesText.setScrollFactor(0)
    
    // Level display
    this.levelText = this.add.text(12, 55, 'Level 1', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffff00',
    })
    this.levelText.setScrollFactor(0)
    
    // Mute button in top right
    this.muteButton = this.add.text(width - 20, 20, '🔊', {
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    })
    this.muteButton.setOrigin(1, 0)
    this.muteButton.setScrollFactor(0)
    this.muteButton.setInteractive()
    this.muteButton.on('pointerdown', () => this.toggleMute())

    // Collectible spawn loop
    this.collectibleTimer = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => this.spawnCollectible(),
    })

    // Enemy spawn loop
    this.enemyTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.spawnEnemy(),
    })
  }

  private startGame() {
    // Clean up keyboard handler
    this.input.keyboard!.off('keydown')
    
    // Hide intro screen
    if (this.introScreen) {
      this.introScreen.destroy()
      this.introScreen = undefined
    }
    if (this.startText) {
      this.startText.destroy()
      this.startText = undefined
    }
    if (this.taglineText) {
      this.taglineText.destroy()
      this.taglineText = undefined
    }
    
    // Show player selection screen
    this.showPlayerSelection()
  }

  private showPlayerSelection() {
    // Set player selection state
    this.playerSelectionActive = true
    
    // Create selection screen background
    this.playerSelectionScreen = this.add.image(this.scale.width / 2, this.scale.height / 2, 'choosedj')
    this.playerSelectionScreen.setOrigin(0.5, 0.5)
    this.playerSelectionScreen.setScrollFactor(0)
    this.playerSelectionScreen.setDisplaySize(this.scale.width, this.scale.height)
    this.playerSelectionScreen.setDepth(1000)
    
    // No title text needed - player can click anywhere on left/right half
    
    // Create invisible clickable areas for full screen selection
    // Left half of screen - DJ 1
    this.dj1Button = this.add.rectangle(this.scale.width / 4, this.scale.height / 2, this.scale.width / 2, this.scale.height, 0x000000, 0)
    this.dj1Button.setScrollFactor(0)
    this.dj1Button.setDepth(1002)
    this.dj1Button.setInteractive()
    this.dj1Button.on('pointerdown', () => this.selectPlayer('dj_right'))
    
    // Right half of screen - DJ 2
    this.dj2Button = this.add.rectangle(this.scale.width * 3 / 4, this.scale.height / 2, this.scale.width / 2, this.scale.height, 0x000000, 0)
    this.dj2Button.setScrollFactor(0)
    this.dj2Button.setDepth(1002)
    this.dj2Button.setInteractive()
    this.dj2Button.on('pointerdown', () => this.selectPlayer('dj2_right'))
    
    // Player can click anywhere on left half for DJ1 or right half for DJ2
    
    console.log('Player selection screen shown!')
  }

  private selectPlayer(playerType: string) {
    // Set selected player
    this.selectedPlayer = playerType
    
    // Clean up selection screen
    if (this.playerSelectionScreen) {
      this.playerSelectionScreen.destroy()
      this.playerSelectionScreen = undefined
    }
    if (this.dj1Button) {
      this.dj1Button.destroy()
      this.dj1Button = undefined
    }
    if (this.dj2Button) {
      this.dj2Button.destroy()
      this.dj2Button = undefined
    }
    
    // Update player sprite based on selection
    this.player.setTexture(playerType)
    
    // Play DJ selection sound effect
    try {
      this.djSelectSound = this.sound.add('djSelectSound', { volume: this.isMuted ? 0 : 0.5 })
      this.djSelectSound.play()
    } catch (error) {
      console.log('Could not play DJ selection sound:', error)
    }
    
    // Start countdown
    this.startCountdown()
  }

  private startCountdown() {
    // Set countdown state
    this.countdownActive = true
    this.countdownTime = 3
    
    // Ensure player is facing right during countdown
    this.player.setTexture('dj_right')
    
    // Create countdown text
    this.countdownText = this.add.text(this.scale.width / 2, this.scale.height / 2, '3', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '72px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
    })
    this.countdownText.setOrigin(0.5, 0.5)
    this.countdownText.setScrollFactor(0)
    this.countdownText.setDepth(3000) // High depth to appear on top
    
    // Start countdown timer
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.updateCountdown(),
    })
    
    // Stop intro music and start main theme music
    if (this.introMusic) {
      this.introMusic.stop()
      this.introMusic = undefined
    }
    
    // Start main theme music (only if not already playing)
    if (!this.mainThemeMusic) {
      try {
        this.mainThemeMusic = this.sound.add('mainTheme', { loop: true, volume: this.isMuted ? 0 : 0.5 })
        if (!this.isMuted) {
          this.mainThemeMusic.play()
        }
      } catch (error) {
        console.log('Could not play main theme music:', error)
      }
    }
    
    console.log('Countdown started!')
  }

  private updateCountdown() {
    this.countdownTime--
    
    if (this.countdownTime > 0) {
      // Update countdown text
      this.countdownText!.setText(this.countdownTime.toString())
    } else {
      // Countdown finished - start the game
      this.finishCountdown()
    }
  }

  private finishCountdown() {
    // Clean up countdown
    this.countdownActive = false
    if (this.countdownText) {
      this.countdownText.destroy()
      this.countdownText = undefined
    }
    if (this.countdownTimer) {
      this.countdownTimer.destroy()
      this.countdownTimer = undefined
    }
    
    // Start the actual game
    this.gameStarted = true
    
    // Restart timers for gameplay
    this.spawnTimer = this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => this.spawnBlock(),
    })
    
    this.collectibleTimer = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => this.spawnCollectible(),
    })
    
    this.enemyTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.spawnEnemy(),
    })
    
    // Main theme music is already playing from countdown
    
    console.log('Game started!')
  }

  private getAnimationKey(baseKey: string): string {
    // Return the correct animation key based on selected player
    if (this.selectedPlayer === 'dj2_right') {
      return baseKey.replace('run_', 'run2_')
    }
    return baseKey
  }

  private getLeftTexture(): string {
    // Return the correct left texture based on selected player
    if (this.selectedPlayer === 'dj2_right') {
      return 'dj2_left'
    }
    return 'dj_left'
  }

  private getZombieLeftTexture(): string {
    if (this.selectedPlayer === 'dj2_right') {
      return 'zombie2_left'
    }
    return 'zombie_left'
  }

  private getZombieRightTexture(): string {
    if (this.selectedPlayer === 'dj2_right') {
      return 'zombie2_right'
    }
    return 'zombie_right'
  }

  update(time: number, delta: number) {
    // Stop all game processing if game is over
    if (this.gameOverState) {
      return
    }
    
    // Allow player movement during countdown, but prevent spawning
    if (!this.gameStarted && !this.countdownActive) {
      return
    }
    
    this.gameTime += delta
    
    if (!this.isFrozen) {
      // Mobile-friendly player movement - enjoyable default pace
      const fastSpeed = 500 // Speed when actively moving
      const jumpVelocity = -420

      const onFloor = (this.player.body as Phaser.Physics.Arcade.Body).blocked.down
      const isJumping = (this.cursors.up?.isDown || (this.cursors.space?.isDown && this.gameStarted)) && onFloor

      if (isJumping) {
        // Jump - stop animation and show original sprite
        this.player.anims.stop()
        if (this.player.texture.key.includes('left')) {
          this.player.setTexture('dj_left')
        } else {
          this.player.setTexture('dj_right')
        }
        this.player.setVelocityY(jumpVelocity)
      } else if (this.cursors.left?.isDown) {
        // Move left - slower pace for better control
        this.player.setVelocityX(-fastSpeed * 0.7)
        if (onFloor) {
          this.player.play(this.getAnimationKey('run_left'), true)
        } else {
          this.player.anims.stop()
          this.player.setTexture(this.getLeftTexture())
        }
      } else if (this.cursors.right?.isDown) {
        // Move right - faster pace for attacking and collecting
        this.player.setVelocityX(fastSpeed)
        if (onFloor) {
          this.player.play(this.getAnimationKey('run_right'), true)
        } else {
          this.player.anims.stop()
          this.player.setTexture(this.selectedPlayer)
        }
      } else {
        // Default state - maintain comfortable distance from left edge
        const playerX = this.player.x
        const screenWidth = this.scale.width
        const minDistanceFromLeft = screenWidth * 0.25 // Keep player at least 25% from left edge
        
        // Only move left if player is far enough from left edge
        if (playerX > minDistanceFromLeft) {
          this.player.setVelocityX(-this.baseSpeed * this.speedMultiplier * this.levelSpeed * 0.1) // Very gentle left movement
        } else {
          // Stop leftward movement when too close to edge
          this.player.setVelocityX(0)
        }
        
        // Keep running animation for constant running look
        if (onFloor) {
          // During countdown, always face right
          if (this.countdownActive) {
            this.player.setTexture(this.selectedPlayer)
            this.player.play(this.getAnimationKey('run_right'), true)
          } else if (this.player.texture.key.includes('left')) {
            this.player.play(this.getAnimationKey('run_left'), true)
          } else {
            this.player.play(this.getAnimationKey('run_right'), true)
          }
        } else {
          // In air - show static sprite
          this.player.anims.stop()
          if (this.countdownActive) {
            // During countdown, always face right
            this.player.setTexture(this.selectedPlayer)
          } else if (this.player.texture.key.includes('left')) {
            this.player.setTexture(this.getLeftTexture())
          } else {
            this.player.setTexture(this.selectedPlayer)
          }
        }
      }
    } else {
      // Zombie mode - slow movement only
      const zombieSpeed = 100 // Much slower than normal
      const zombieJumpVelocity = -200 // Weaker jump

      const onFloor = (this.player.body as Phaser.Physics.Arcade.Body).blocked.down
      const isJumping = (this.cursors.up?.isDown || (this.cursors.space?.isDown && this.gameStarted)) && onFloor

      if (isJumping) {
        // Jump - stop animation and show original sprite
        this.player.anims.stop()
        if (this.player.texture.key.includes('left')) {
          this.player.setTexture('dj_left')
        } else {
          this.player.setTexture('dj_right')
        }
        this.player.setVelocityY(zombieJumpVelocity)
      } else if (this.cursors.left?.isDown) {
        this.player.setVelocityX(-zombieSpeed)
        // Only play running animation when on ground
        if (onFloor) {
          this.player.play(this.getAnimationKey('run_left'), true)
        } else {
          // In air - show static sprite
          this.player.anims.stop()
          this.player.setTexture(this.getLeftTexture())
        }
        // Update zombie sprite direction
        if (this.zombieSprite && this.zombieSprite.texture.key !== this.getZombieLeftTexture()) {
          this.zombieSprite.setTexture(this.getZombieLeftTexture())
        }
      } else if (this.cursors.right?.isDown) {
        this.player.setVelocityX(zombieSpeed)
        // Only play running animation when on ground
        if (onFloor) {
          this.player.play('run_right', true)
        } else {
          // In air - show static sprite
          this.player.anims.stop()
          this.player.setTexture('dj_right')
        }
        // Update zombie sprite direction
        if (this.zombieSprite && this.zombieSprite.texture.key !== this.getZombieRightTexture()) {
          this.zombieSprite.setTexture(this.getZombieRightTexture())
        }
      } else {
        this.player.setVelocityX(0)
        // Stop animation and show idle sprite
        this.player.anims.stop()
        if (this.player.texture.key.includes('left')) {
          this.player.setTexture('dj_left')
        } else {
          this.player.setTexture('dj_right')
        }
      }
    }

    // Recycle off-screen blocks - destroy before they reach left edge
    const leftBound = -50 // Destroy blocks before they reach the left screen edge
    this.platforms.getChildren().forEach((obj) => {
      const block = obj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
      if (block.x < leftBound) {
        block.destroy()
      }
    })

    // Prevent player from getting stuck at left edge - maintain comfortable distance
    const playerLeftEdge = this.player.x - this.player.displayWidth / 2
    const minSafeDistance = this.scale.width * 0.2 // 20% from left edge
    
    if (playerLeftEdge < minSafeDistance) {
      // Gently push player to the right to maintain safe distance
      this.player.setVelocityX(Math.max(this.player.body.velocity.x, 50))
      // Move player position to safe distance
      this.player.setX(Math.max(this.player.x, minSafeDistance + this.player.displayWidth / 2))
    }

    // Auto-escape mechanism: detect when player is about to get trapped
    this.checkForTrapSituation()

    // Update level-based speed system
    this.updateLevelSpeed(delta)
    const currentSpeed = this.baseSpeed * this.speedMultiplier * this.levelSpeed

    // Scroll ground visually to match world motion
    const dt = this.game.loop.delta
    this.groundTile.tilePositionX += (currentSpeed * dt) / 1000

    // Scroll sky background (parallax - slower than ground)
    if (this.skyBackground) {
      this.skyBackground.tilePositionX += (currentSpeed * dt) / 2000 // Half speed for parallax effect
    }

    // Update heart particle position to track with player
    if (this.heartParticles) {
      this.heartParticles.setPosition(this.player.x, this.player.y - 30)
    }

    // Check for boss spawning at wellbeing milestones
    this.bossSpawnedAt.forEach((milestone, index) => {
      // Check if we've reached the milestone, boss hasn't spawned yet, no current boss, and enough gap since last boss death
      const enoughGapSinceLastBoss = this.score >= this.lastBossDeathScore + 1000
      if (this.score >= milestone && !this.bossesSpawned[index] && !this.currentBoss && enoughGapSinceLastBoss) {
        console.log(`Spawning Boss ${index + 1} at wellbeing ${this.score} (gap: ${this.score - this.lastBossDeathScore})`)
        this.spawnBoss(index + 1) // Boss 1 at 1500, Boss 2 at 3000, Boss 3 at 4500
        this.bossesSpawned[index] = true
      }
    })

    // Update boss floating movement and attacks
    if (this.currentBoss) {
      this.updateBossMovement(delta)
      this.updateBossAttacks(delta)
      
      // Update trail particle position with movement-responsive effect
      if (this.bossTrailParticles) {
        const currentX = this.currentBoss.x
        const currentY = this.currentBoss.y
        
        // Calculate movement direction and speed
        const deltaX = currentX - this.lastBossX
        const deltaY = currentY - this.lastBossY
        const movementSpeed = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        
        // Update particle position to follow boss
        this.bossTrailParticles.setPosition(currentX, currentY)
        
        // Update music note particles for Boss 3
        if (this.currentBoss.getData('bossNumber') === 3 && this.bossMusicParticles) {
          this.bossMusicParticles.setPosition(currentX, currentY)
          // Manually emit particles from boss head area
          this.bossMusicParticles.emitParticleAt(currentX, currentY - 30)
        }
        
        // Emit particles falling vertically down for floating effect (Boss 1 and 2 only)
        const bossNumber = this.currentBoss.getData('bossNumber')
        if (bossNumber !== 3) { // Only Boss 1 and 2 get trail particles
          this.bossTrailParticles.emitParticleAt(currentX, currentY + 40) // Below boss
          this.bossTrailParticles.emitParticleAt(currentX - 10, currentY + 35) // Slightly left
          this.bossTrailParticles.emitParticleAt(currentX + 10, currentY + 35) // Slightly right
        }
        
        // Update last position
        this.lastBossX = currentX
        this.lastBossY = currentY
      }
    }

    // Update boss lasers (only check left side since they fire left)
    this.bossLasers.getChildren().forEach((laser) => {
      const laserSprite = laser as Phaser.GameObjects.Sprite
      const laserBody = laserSprite.body as Phaser.Physics.Arcade.Body
      
      // Manual movement if velocity isn't working
      if (laserBody.velocity.x === 0) {
        laserSprite.x -= this.laserSpeed * this.speedMultiplier * (delta / 1000)
      }
      
      // Rotate Boss 2's laser
      if (laserSprite.getData('isRotating')) {
        const rotationSpeed = laserSprite.getData('rotationSpeed')
        laserSprite.rotation += rotationSpeed
      }
      
      // Debug: Log laser position and velocity
      if (this.bossLasers.getChildren().length > 0) {
        console.log(`Laser at (${laserSprite.x.toFixed(1)}, ${laserSprite.y.toFixed(1)}) velocity: (${laserBody.velocity.x.toFixed(1)}, ${laserBody.velocity.y.toFixed(1)})`)
      }
      
      if (laserSprite.x < -50) {
        laserSprite.destroy()
      }
    })

    // Update boss drones
    this.bossDrones.getChildren().forEach((drone) => {
      const droneSprite = drone as Phaser.GameObjects.Sprite
      
      // Move drone up to top of screen
      if (droneSprite.y > 50) {
        droneSprite.y -= this.droneSpeed * this.speedMultiplier * (delta / 1000)
      } else {
        // Drone reached top - start hovering and dropping bombs
        this.updateDroneHovering(droneSprite, delta)
      }
      
      // Remove drone if off screen
      if (droneSprite.x < -50 || droneSprite.x > this.scale.width + 50) {
        droneSprite.destroy()
      }
    })

    // Update drone bombs
    this.droneBombs.getChildren().forEach((bomb) => {
      const bombSprite = bomb as Phaser.GameObjects.Sprite
      
      // Remove bomb if it hits the ground
      if (bombSprite.y > this.scale.height - 50) {
        bombSprite.destroy()
      }
    })

    // Recycle collectibles off-screen
    this.collectibles.getChildren().forEach((obj) => {
      const it = obj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
      if (it.x < -100) it.destroy()
    })

    // Update enemy AI and recycle off-screen
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
      
      // Despawn if off-screen left
      if (enemy.x < -100) {
        enemy.destroy()
        return
      }
      
      // Move toward player
      const playerX = this.player.x
      const enemyX = enemy.x
      const distance = Math.abs(playerX - enemyX)
      
      // Always move toward player, with occasional random pause
      if (Phaser.Math.Between(1, 100) <= 95) { // 95% chance to pursue
        const direction = playerX > enemyX ? 1 : -1
        enemy.setVelocityX(direction * 80 * this.speedMultiplier) // slower than player, scaled with speed
      } else {
        // 5% chance to pause briefly
        enemy.setVelocityX(0)
      }
    })
  }

  private spawnBlock() {
    // Don't spawn during countdown
    if (this.countdownActive) {
      return
    }
    
    const width = this.scale.width

    // Random lane and block length (1-3 units)
    const laneY = Phaser.Utils.Array.GetRandom(this.laneYPositions)
    const blockCount = Phaser.Math.Between(1, 3)
    const blockWidth = 48
    // Use current speed with multiplier
    const velocityX = -this.baseSpeed * this.speedMultiplier
    const gap = 4

    for (let i = 0; i < blockCount; i++) {
      const x = width + i * (blockWidth + gap)
      const block = this.platforms.create(x, laneY, 'block') as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
      block.setVelocityX(velocityX)
      block.setImmovable(true)
      block.body.allowGravity = false
    }
  }

  private spawnCollectible() {
    // Don't spawn during countdown
    if (this.countdownActive) {
      return
    }
    
    // Don't spawn collectibles if there's a boss on screen
    if (this.currentBoss) {
      return
    }
    
    const width = this.scale.width
    // Rarity weights and scores
    const defs = [
      { key: 'c_common', weight: 40, score: 10 },
      { key: 'c_uncommon', weight: 25, score: 20 },
      { key: 'c_rare', weight: 15, score: 40 },
      { key: 'c_epic', weight: 10, score: 80 },
      { key: 'c_legendary', weight: 7, score: 160 },
      { key: 'c_mythic', weight: 3, score: 320 },
      { key: 'c_life', weight: 1, score: 0, special: 'life' }, // Rarest - gives extra life
    ] as const

    const total = defs.reduce((s, d) => s + d.weight, 0)
    let r = Phaser.Math.Between(1, total)
    let chosen = defs[0] as typeof defs[number]
    for (const d of defs) {
      if ((r -= d.weight) <= 0) {
        chosen = d
        break
      }
    }

    // Spawn from top of screen (25% chance) or on lanes (75% chance) with more randomness
    let y: number
    if (Phaser.Math.Between(1, 10) <= 2.5) {
      // Fall from top of screen with slight randomness
      y = Phaser.Math.Between(15, 35)
    } else {
      // Choose lane or mid-air between lanes for variety with more randomness
      const laneOrMid = Phaser.Math.Between(0, 3)
      if (laneOrMid === 0) {
        // On a lane
        y = this.laneYPositions[Phaser.Math.Between(0, this.laneYPositions.length - 1)]
      } else if (laneOrMid === 1) {
        // halfway between bottom and middle
        y = Math.round((this.laneYPositions[0] + this.laneYPositions[1]) / 2)
      } else if (laneOrMid === 2) {
        // halfway between middle and top
        y = Math.round((this.laneYPositions[1] + this.laneYPositions[2]) / 2)
      } else {
        // Random position between lanes
        const minY = Math.min(...this.laneYPositions)
        const maxY = Math.max(...this.laneYPositions)
        y = Phaser.Math.Between(minY, maxY)
      }
    }

    // Add random X positioning for better spacing
    const randomX = width + Phaser.Math.Between(20, 80) // Random spawn distance from right edge
    const sprite = this.collectibles.create(randomX, y, chosen.key) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
    sprite.setData('score', chosen.score)
    if ('special' in chosen && chosen.special) {
      sprite.setData('special', chosen.special)
    }
    sprite.setVelocityX(-this.baseSpeed * this.speedMultiplier)
    sprite.setImmovable(false)
    sprite.body.allowGravity = true
    sprite.setBounce(0)
  }

  private collectCollectible(collectible: Phaser.GameObjects.Sprite) {
    const value = (collectible.getData('score') as number) ?? 0
    const special = collectible.getData('special') as string
    
    // Handle special collectibles
    if (special === 'life') {
      // Play life up sound effect
      try {
        this.sound.play('lifeUp', { volume: this.isMuted ? 0 : 0.4 })
      } catch (error) {
        console.log('Could not play life up sound:', error)
      }
      
      // Give extra life (max 5 lives)
      if (this.lives < 5) {
        this.lives++
        this.livesText.setText(`Lives: ${this.lives}`)
        console.log(`Extra life collected! Lives: ${this.lives}`)
      } else {
        // If at max lives, give bonus wellbeing instead
        this.score += 500
        this.scoreText.setText(`Wellbeing: ${this.score}`)
        console.log('Max lives reached! Bonus wellbeing: +500')
      }
    } else {
      // Play collectible sound effect (muted - too much)
      try {
        this.sound.play('collectible', { volume: 0 })
      } catch (error) {
        console.log('Could not play collectible sound:', error)
      }
      
      // Normal wellbeing collection
      this.score += value
      this.scoreText.setText(`Wellbeing: ${this.score}`)
    }
    
    // Show heart animation above player's head
    this.showCollectionEffect()
    
    collectible.destroy()
  }

  private showCollectionEffect() {
    if (this.heartParticles) {
      // Position particles above player's head (tracks with player)
      this.heartParticles.setPosition(this.player.x, this.player.y - 30)
      
      // Emit hearts with upward movement
      this.heartParticles.explode(5)
    }
  }

  private spawnEnemy() {
    // Don't spawn during countdown
    if (this.countdownActive) {
      return
    }
    
    // Don't spawn enemies if there's a boss on screen
    if (this.currentBoss) {
      return
    }
    
    const width = this.scale.width
    const height = this.scale.height
    
    // Choose enemy type (50/50)
    const enemyType = Phaser.Math.Between(1, 2) === 1 ? 'enemy1' : 'enemy2'
    
    // Spawn location: mostly ground level, occasionally from top
    let y: number
    const groundY = height - 60 // ground level - enemies should be on the ground, not buried
    const topSpawnChance = Math.min(0.3, this.gameTime / 60000) // increases over time, max 30%
    
    if (Phaser.Math.FloatBetween(0, 1) < topSpawnChance) {
      y = 20 // top of screen
    } else {
      y = groundY
    }
    
    const enemy = this.enemies.create(width + 50, y, enemyType) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
    enemy.setBounce(0.1)
    enemy.setCollideWorldBounds(false) // let them move off screen
    enemy.body.setSize(32, 32)
    
    // Initial random movement (scaled with speed multiplier)
    const direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1
    enemy.setVelocityX(direction * 60 * this.speedMultiplier)
    
    // Set data for enemy behavior
    enemy.setData('lastDirectionChange', 0)
    enemy.setData('enemyType', enemyType)
  }

  private handleEnemyCollision(enemy: Phaser.GameObjects.Sprite) {
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body
    
    // Check if player is jumping on enemy (more forgiving detection)
    const playerBottom = this.player.y + this.player.height / 2
    const enemyTop = enemy.y - enemy.height / 2
    const playerCenterX = this.player.x
    const enemyCenterX = enemy.x
    const horizontalDistance = Math.abs(playerCenterX - enemyCenterX)
    const enemyWidth = enemy.width || 32
    
    // More forgiving stomp detection - player can be anywhere above enemy and within expanded enemy width
    // Works for both jumping and falling (any downward velocity)
    const stompZoneWidth = enemyWidth * 1.5 // 50% bigger horizontal strike zone
    const stompZoneHeight = 35 // Increased vertical tolerance
    if (playerBottom <= enemyTop + stompZoneHeight && playerBody.velocity.y >= 0 && horizontalDistance <= stompZoneWidth) {
      // Player is stomping on enemy - kill enemy (jumping or falling)
      this.stompEnemy(enemy)
    } else if (!this.isFrozen) {
      // Player hit enemy from side - take damage
      this.takeDamage(enemy)
    }
  }


  private checkForTrapSituation() {
    const playerLeftEdge = this.player.x - this.player.displayWidth / 2
    const playerRightEdge = this.player.x + this.player.displayWidth / 2
    const playerY = this.player.y
    
    // Only check if player is close to left edge (within 80 pixels) - adjusted for centered player
    if (playerLeftEdge < 80) {
      // Look for approaching blocks that could trap the player
      const approachingBlocks = this.platforms.getChildren().filter((obj) => {
        const block = obj as Phaser.Types.Physics.Arcade.ImageWithDynamicBody
        const blockRightEdge = block.x + block.displayWidth / 2
        const blockY = block.y
        
        // Check if block is approaching from the right and at similar height
        const isApproaching = blockRightEdge > playerRightEdge && block.body.velocity.x < 0
        const isAtSimilarHeight = Math.abs(blockY - playerY) < 40 // Within 40 pixels vertically
        const isVeryClose = blockRightEdge - playerRightEdge < 30 // Within 30 pixels horizontally
        
        return isApproaching && isAtSimilarHeight && isVeryClose
      })
      
      if (approachingBlocks.length > 0) {
        // Player is about to get trapped - trigger auto-escape
        this.triggerAutoEscape()
      }
    }
  }

  private triggerAutoEscape() {
    const currentTime = this.time.now
    
    // Cooldown: only trigger once every 3 seconds
    if (currentTime - this.lastAutoEscape < 3000) {
      return
    }
    
    this.lastAutoEscape = currentTime
    
    // Don't mess with speed multiplier - just help the player escape
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    
    // Force player to jump if on ground
    if (playerBody.touching.down) {
      playerBody.setVelocityY(-300) // Moderate jump
      console.log('Auto-escape: Player forced to jump!')
    }
    
    // Push player to the right with moderate force
    playerBody.setVelocityX(Math.max(playerBody.velocity.x, 80))
    
    // Move player away from left edge slightly
    this.player.setX(Math.max(this.player.x, 30))
    
    console.log('Auto-escape triggered! Player moved.')
  }

  private stompEnemy(enemy: Phaser.GameObjects.Sprite) {
    // Player stomps enemy - kill it
    console.log('Enemy stomped!', enemy.getData('enemyType'))
    
    // Play stomp sound effect
    try {
      this.sound.play('enemyStomp', { volume: this.isMuted ? 0 : 0.3 })
    } catch (error) {
      console.log('Could not play stomp sound:', error)
    }
    
    // Show sparkle death effect at enemy position
    this.showEnemyDeathEffect(enemy.x, enemy.y)
    
    enemy.destroy()
    
    // Give player a small bounce
    this.player.setVelocityY(-200)
  }

  private showEnemyDeathEffect(x: number, y: number) {
    if (this.sparkleParticles) {
      // Position sparkles at enemy death location
      this.sparkleParticles.setPosition(x, y)
      
      // Emit sparkles in all directions
      this.sparkleParticles.explode(8)
    }
  }

  private takeDamage(enemy: Phaser.GameObjects.Sprite) {
    if (this.isFrozen) return // Already frozen, ignore additional hits
    
    this.lives--
    this.livesText.setText(`Lives: ${this.lives}`)
    
    console.log(`Player hit! Lives remaining: ${this.lives}`)
    
    // Only destroy the specific enemy that hit the player
    enemy.destroy()
    
    if (this.lives <= 0) {
      // Game over
      this.gameOver()
      return
    }
    
    // Freeze player for 2 seconds
    this.freezePlayer()
  }

  private freezePlayer() {
    this.isFrozen = true
    
    // Clear any existing freeze timer
    if (this.freezeTimer) {
      this.freezeTimer.destroy()
    }
    
    // Hide player and show zombie based on facing direction and selected player
    this.player.setVisible(false)
    const zombieTexture = this.player.texture.key.includes('left') ? this.getZombieLeftTexture() : this.getZombieRightTexture()
    this.zombieSprite = this.add.sprite(this.player.x, this.player.y, zombieTexture)
    this.zombieSprite.setOrigin(this.player.originX, this.player.originY)
    
    // Sync zombie position with player during freeze
    this.time.addEvent({
      delay: 16, // ~60fps
      loop: true,
      callback: () => {
        if (this.zombieSprite && this.isFrozen) {
          this.zombieSprite.setPosition(this.player.x, this.player.y)
        }
      },
    })
    
    // Stop enemy spawning temporarily (but don't clear existing enemies)
    this.enemyTimer.destroy()
    
    // Clear drones and bombs but keep boss alive
    this.bossDrones.clear(true, true)
    this.droneBombs.clear(true, true)
    
    // Set timer to unfreeze after 2 seconds
    this.freezeTimer = this.time.delayedCall(2000, () => {
      this.isFrozen = false
      this.player.setVisible(true)
      if (this.zombieSprite) {
        this.zombieSprite.destroy()
        this.zombieSprite = undefined
      }
      this.freezeTimer = undefined
      
      // Restart enemy spawning
      this.enemyTimer = this.time.addEvent({
        delay: 2000,
        loop: true,
        callback: () => this.spawnEnemy(),
      })
    })
  }

  private gameOver() {
    console.log('Game Over!')
    this.gameOverState = true
    
    // Start pixelate effect
    this.startPixelateEffect()
  }

  private startPixelateEffect() {
    // Play death sound effect
    try {
      this.deathSound = this.sound.add('deathSound', { volume: this.isMuted ? 0 : 0.7 })
      this.deathSound.play()
    } catch (error) {
      console.log('Could not play death sound:', error)
    }
    
    // Create a pixelated overlay that starts transparent and becomes opaque
    const pixelOverlay = this.add.graphics()
    pixelOverlay.setDepth(3000) // Highest depth
    pixelOverlay.setScrollFactor(0)
    pixelOverlay.setAlpha(0) // Start transparent
    
    // Animate pixelation by gradually increasing pixel size and opacity
    let currentPixelSize = 1
    const pixelateTween = this.tweens.addCounter({
      from: 1,
      to: 25, // Maximum pixel size
      duration: 300, // 0.3 seconds - much faster
      ease: 'Power2.easeIn',
      onUpdate: (tween) => {
        currentPixelSize = Math.floor(tween.getValue() || 0)
        const progress = tween.progress
        const alpha = Math.min(progress * 2, 1) // Fade in quickly
        
        pixelOverlay.clear()
        pixelOverlay.setAlpha(alpha)
        
        // Draw pixelated effect
        const newPixelWidth = this.scale.width / currentPixelSize
        const newPixelHeight = this.scale.height / currentPixelSize
        
        for (let x = 0; x < newPixelWidth; x++) {
          for (let y = 0; y < newPixelHeight; y++) {
            // Random color for each pixel (creates glitch effect)
            const randomColor = Phaser.Math.Between(0, 0xffffff)
            pixelOverlay.fillStyle(randomColor)
            pixelOverlay.fillRect(
              x * currentPixelSize, 
              y * currentPixelSize, 
              currentPixelSize, 
              currentPixelSize
            )
          }
        }
      },
      onComplete: () => {
        // After pixelation, show the game over screen
        this.showGameOverScreen()
        pixelOverlay.destroy()
      }
    })
  }

  private showGameOverScreen() {
    // Stop all timers
    this.spawnTimer.destroy()
    this.collectibleTimer.destroy()
    this.enemyTimer.destroy()
    if (this.freezeTimer) {
      this.freezeTimer.destroy()
    }
    
    // Stop all boss effects
    if (this.bossTrailParticles) {
      this.bossTrailParticles.stop()
    }
    if (this.bossMusicParticles) {
      this.bossMusicParticles.stop()
    }
    
    // Clear all game elements
    this.platforms.clear(true, true)
    this.collectibles.clear(true, true)
    this.enemies.clear(true, true)
    this.bosses.clear(true, true)
    this.bossLasers.clear(true, true)
    this.bossDrones.clear(true, true)
    this.droneBombs.clear(true, true)
    
    // Stop all particle effects
    if (this.heartParticles) {
      this.heartParticles.stop()
    }
    if (this.sparkleParticles) {
      this.sparkleParticles.stop()
    }
    
    // Hide player and UI elements
    this.player.setVisible(false)
    this.scoreText.setVisible(false)
    this.livesText.setVisible(false)
    this.levelText.setVisible(false)
    if (this.muteButton) {
      this.muteButton.setVisible(false)
    }
    
    // Show ending screen background (DJ-specific)
    const endingScreenKey = this.selectedPlayer === 'dj2_right' ? 'dj2endingscreen' : 'endingscreen'
    this.endingScreen = this.add.image(this.scale.width / 2, this.scale.height / 2, endingScreenKey)
    this.endingScreen.setOrigin(0.5, 0.5)
    this.endingScreen.setScrollFactor(0)
    this.endingScreen.setDisplaySize(this.scale.width, this.scale.height)
    this.endingScreen.setDepth(4000) // Higher depth than pixel effect
    // Ending screen click removed - leaderboard will handle restart
    
    // Clean up any existing text elements first
    if (this.therapyText) {
      this.therapyText.destroy()
      this.therapyText = undefined
    }
    if (this.restartButton) {
      this.restartButton.destroy()
      this.restartButton = undefined
    }
    
    // Show therapy message and restart button
    this.therapyText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, "Don't worry after some fresh air and therapy\nyou'll be ready to play again", {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
    })
    this.therapyText.setOrigin(0.5, 0.5)
    this.therapyText.setScrollFactor(0)
    this.therapyText.setDepth(4001) // Higher depth than pixel effect
    
    // Restart button removed - leaderboard will handle restart
    
    // Restart handler removed - leaderboard will handle restart after submission
    
    // Start 5-second timer before showing leaderboard
    this.leaderboardTimer = this.time.addEvent({
      delay: 5000, // 5 seconds
      callback: () => this.showLeaderboardScreen(),
      callbackScope: this
    })
    
    // Stop main theme and play game over music on loop (with error handling)
    try {
      if (this.mainThemeMusic) {
        this.mainThemeMusic.stop()
      }
      this.gameOverMusic = this.sound.add('gameOverMusic', { loop: true, volume: this.isMuted ? 0 : 0.5 })
      if (!this.isMuted) {
        this.gameOverMusic.play()
      }
    } catch (error) {
      console.log('Could not play game over music:', error)
    }
    
    // Stop player movement
    this.player.setVelocity(0, 0)
    this.isFrozen = true
  }

  private restartGame() {
    // Clean up game over screen elements first
    if (this.endingScreen) {
      this.endingScreen.destroy()
      this.endingScreen = undefined
    }
    if (this.therapyText) {
      this.therapyText.destroy()
      this.therapyText = undefined
    }
    if (this.restartButton) {
      this.restartButton.destroy()
      this.restartButton = undefined
    }
    
    // Clean up keyboard handler
    this.input.keyboard!.off('keydown')
    
    // Reset game state
    this.lives = 3
    this.score = 0
    this.isFrozen = false
    this.gameOverState = false
    this.gameStarted = false
    this.countdownActive = false
    this.playerSelectionActive = false
    this.selectedPlayer = 'dj_right' // Reset to default DJ
    
    // Reset player position and visibility
    this.player.setPosition(100, this.scale.height - 100)
    this.player.setVisible(true)
    this.player.clearTint()
    
    // Remove zombie sprite if exists
    if (this.zombieSprite) {
      this.zombieSprite.destroy()
      this.zombieSprite = undefined
    }
    
    // Stop game over music (with error handling)
    if (this.gameOverMusic) {
      try {
        this.gameOverMusic.stop()
        this.gameOverMusic.destroy()
      } catch (error) {
        console.log('Could not stop game over music:', error)
      }
      this.gameOverMusic = undefined
    }
    
    // Clear all enemies, bosses, lasers, drones, bombs, and collectibles
    this.enemies.clear(true, true)
    this.bosses.clear(true, true)
    this.collectibles.clear(true, true)
    this.platforms.clear(true, true)
    this.bossDrones.clear(true, true)
    this.droneBombs.clear(true, true)
    
    // Reset boss state
    this.currentBoss = undefined
    this.bossHealth = 0
    this.maxBossHealth = 3
    this.bossDefeated = false
    this.bossesSpawned = [false, false, false]
    this.lastBossDeathScore = 0
    
    // Reset speed and level
    this.speedMultiplier = 1.0
    this.levelSpeed = 1.0
    this.currentLevel = 1
    this.levelStartTime = 0
    
    // Update UI
    this.scoreText.setText(`Wellbeing: ${this.score}`)
    this.livesText.setText(`Lives: ${this.lives}`)
    this.levelText.setText(`Level: ${this.currentLevel}`)
    
    // Show UI elements again
    this.scoreText.setVisible(true)
    this.livesText.setVisible(true)
    this.levelText.setVisible(true)
    this.muteButton?.setVisible(true)
    
    // Restart game timers (they were destroyed in showGameOverScreen)
    this.spawnTimer = this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => this.spawnBlock(),
    })
    
    this.collectibleTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.spawnCollectible(),
    })
    
    this.enemyTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.spawnEnemy(),
    })
    
    // Reset game time
    this.gameTime = 0
    this.levelStartTime = 0
    
    // Recreate intro screen
    const width = this.scale.width
    const height = this.scale.height
    
    this.introScreen = this.add.image(width / 2, height / 2, 'introScreen')
    this.introScreen.setOrigin(0.5, 0.5)
    this.introScreen.setScrollFactor(0)
    this.introScreen.setDisplaySize(width, height)
    this.introScreen.setDepth(1000)
    this.introScreen.setInteractive()
    this.introScreen.on('pointerdown', () => {
      if (!this.gameStarted && !this.playerSelectionActive && !this.countdownActive) {
        this.startGame()
      }
    })
    
    // Recreate start text
    this.startText = this.add.text(width / 2, height / 2 + 130, 'Press Any Key or Click to Start', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '24px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2,
    })
    this.startText.setOrigin(0.5, 0.5)
    this.startText.setScrollFactor(0)
    this.startText.setDepth(1002)
    
    // Add pulsing animation to start text
    this.tweens.add({
      targets: this.startText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Recreate tagline
    this.taglineText = this.add.text(width / 2, height / 6, 'Collect your memories, escape the feed... before it\'s too late', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    })
    this.taglineText.setOrigin(0.5, 0.5)
    this.taglineText.setScrollFactor(0)
    this.taglineText.setDepth(1001)
    
    // Start intro music
    if (this.introMusic) {
      this.introMusic.stop()
      this.introMusic.destroy()
      this.introMusic = undefined
    }
    
    try {
      this.introMusic = this.sound.add('introMusic', { loop: true, volume: 0.3 })
      this.introMusic.play()
    } catch (error) {
      console.log('Could not play intro music:', error)
    }
    
    // Add keyboard listener
    this.input.keyboard!.on('keydown', () => {
      if (!this.gameStarted && !this.playerSelectionActive && !this.countdownActive) {
        this.startGame()
      }
    })
    
    console.log('Game restarted - Score reset to:', this.score)
  }

  private showLeaderboardScreen() {
    // Clean up timer
    if (this.leaderboardTimer) {
      this.leaderboardTimer.destroy()
      this.leaderboardTimer = undefined
    }
    
    // Create leaderboard screen container
    this.leaderboardScreen = this.add.container(this.scale.width / 2, this.scale.height / 2)
    this.leaderboardScreen.setDepth(5000) // Above everything else
    
    // Background
    const background = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8)
    this.leaderboardScreen.add(background)
    
    // Title
    const title = this.add.text(0, -200, 'You Made the Leaderboard!', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '32px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3,
    })
    title.setOrigin(0.5, 0.5)
    this.leaderboardScreen.add(title)
    
    // Score display
    const scoreText = this.add.text(0, -150, `Final Score: ${this.score}`, {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    })
    scoreText.setOrigin(0.5, 0.5)
    this.leaderboardScreen.add(scoreText)
    
    // Instructions
    const instructions = this.add.text(0, -100, 'Enter your details to submit your score:', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    })
    instructions.setOrigin(0.5, 0.5)
    this.leaderboardScreen.add(instructions)
    
    // Initials label
    const initialsLabel = this.add.text(0, -50, 'Enter Your Initials (3 letters):', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    })
    initialsLabel.setOrigin(0.5, 0.5)
    this.leaderboardScreen.add(initialsLabel)
    
    // Initials input box
    const initialsBox = this.add.rectangle(0, -20, 120, 40, 0x000000, 0.8)
    initialsBox.setStrokeStyle(2, 0x00ff00)
    this.leaderboardScreen.add(initialsBox)
    
    this.initialsInput = this.add.text(0, -20, '', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '24px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2,
    })
    this.initialsInput.setOrigin(0.5, 0.5)
    this.leaderboardScreen.add(this.initialsInput)
    
    // Email label
    const emailLabel = this.add.text(0, 20, 'Enter Your Email:', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    })
    emailLabel.setOrigin(0.5, 0.5)
    this.leaderboardScreen.add(emailLabel)
    
    // Email input box
    const emailBox = this.add.rectangle(0, 50, 300, 40, 0x000000, 0.8)
    emailBox.setStrokeStyle(2, 0xffffff)
    this.leaderboardScreen.add(emailBox)
    
    this.emailInput = this.add.text(0, 50, '', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    })
    this.emailInput.setOrigin(0.5, 0.5)
    this.leaderboardScreen.add(this.emailInput)
    
    // Submit button
    this.submitButton = this.add.text(0, 120, 'Submit Score', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '20px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2,
    })
    this.submitButton.setOrigin(0.5, 0.5)
    this.submitButton.setInteractive()
    this.submitButton.on('pointerdown', () => this.submitLeaderboardScore())
    this.leaderboardScreen.add(this.submitButton)
    
    // Skip button
    const skipButton = this.add.text(0, 160, 'Skip', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '16px',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2,
    })
    skipButton.setOrigin(0.5, 0.5)
    skipButton.setInteractive()
    skipButton.on('pointerdown', () => this.skipLeaderboard())
    this.leaderboardScreen.add(skipButton)
    
    // Set up keyboard input
    this.setupLeaderboardInput()
    
    console.log('Leaderboard screen shown! Initials field is active for immediate typing.')
  }

  private setupLeaderboardInput() {
    // Clear existing keyboard handlers
    this.input.keyboard!.off('keydown')
    
    // Set up keyboard input for leaderboard
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      // Prevent default behavior for certain keys
      if (event.key === 'Tab') {
        event.preventDefault()
      }
      
      // Handle input based on current input field
      if (this.currentInput === 'initials') {
        this.handleInitialsInput(event.key)
      } else if (this.currentInput === 'email') {
        this.handleEmailInput(event.key)
      }
    })
    
    // Set up click handlers to switch between inputs
    this.initialsInput!.setInteractive()
    this.initialsInput!.on('pointerdown', () => {
      this.currentInput = 'initials'
      this.updateInputHighlight()
    })
    
    this.emailInput!.setInteractive()
    this.emailInput!.on('pointerdown', () => {
      this.currentInput = 'email'
      this.updateInputHighlight()
    })
    
    // Initialize with initials input
    this.currentInput = 'initials'
    this.initialsText = ''
    this.emailText = ''
    this.updateInputHighlight()
  }

  private handleInitialsInput(key: string) {
    if (key === 'Backspace') {
      this.initialsText = this.initialsText.slice(0, -1)
    } else if (key.length === 1 && /[A-Za-z]/.test(key) && this.initialsText.length < 3) {
      this.initialsText += key.toUpperCase()
    } else if (key === 'Tab' || key === 'Enter') {
      this.currentInput = 'email'
      this.updateInputHighlight()
    }
    
    if (this.initialsInput) {
      this.initialsInput.setText(this.initialsText)
    }
  }

  private handleEmailInput(key: string) {
    if (key === 'Backspace') {
      this.emailText = this.emailText.slice(0, -1)
    } else if (key === 'Tab' || key === 'Enter') {
      this.currentInput = 'initials'
      this.updateInputHighlight()
    } else if (key.length === 1) {
      this.emailText += key
    }
    
    if (this.emailInput) {
      this.emailInput.setText(this.emailText)
    }
  }

  private updateInputHighlight() {
    if (this.currentInput === 'initials') {
      this.initialsInput!.setStyle({ color: '#00ff00' })
      this.emailInput!.setStyle({ color: '#ffffff' })
    } else {
      this.initialsInput!.setStyle({ color: '#ffffff' })
      this.emailInput!.setStyle({ color: '#00ff00' })
    }
  }

  private async submitLeaderboardScore() {
    if (this.initialsText.length !== 3 || this.emailText.length === 0) {
      console.log('Please enter 3 initials and an email')
      return
    }

    const success = await submitScore(this.initialsText, this.emailText, this.score)
    
    if (success) {
      console.log('Score submitted successfully!')
    } else {
      console.log('Failed to submit score')
    }
    
    this.cleanupLeaderboardScreen()
    this.restartGame()
  }

  private skipLeaderboard() {
    this.cleanupLeaderboardScreen()
    this.restartGame()
  }

  private cleanupLeaderboardScreen() {
    if (this.leaderboardScreen) {
      this.leaderboardScreen.destroy()
      this.leaderboardScreen = undefined
    }
    if (this.leaderboardTimer) {
      this.leaderboardTimer.destroy()
      this.leaderboardTimer = undefined
    }
    this.input.keyboard!.off('keydown')
  }

  // Missing boss-related methods
  private handleBossCollision(boss: Phaser.GameObjects.Sprite) {
    // Handle boss collision logic
    console.log('Boss collision detected')
  }

  private handleLaserCollision(laser: Phaser.GameObjects.Sprite) {
    // Handle laser collision logic
    console.log('Laser collision detected')
  }

  private handleBombCollision(bomb: Phaser.GameObjects.Sprite) {
    // Handle bomb collision logic
    console.log('Bomb collision detected')
  }

  private toggleMute() {
    // Toggle mute functionality
    this.isMuted = !this.isMuted
    console.log('Mute toggled:', this.isMuted)
  }

  private updateLevelSpeed(delta: number) {
    // Update level speed logic
    console.log('Level speed updated')
  }

  private spawnBoss(bossNumber: number) {
    // Spawn boss logic
    console.log('Boss spawned:', bossNumber)
  }

  private updateBossMovement(delta: number) {
    // Update boss movement logic
    console.log('Boss movement updated')
  }

  private updateBossAttacks(delta: number) {
    // Update boss attacks logic
    console.log('Boss attacks updated')
  }

  private updateDroneHovering(droneSprite: Phaser.GameObjects.Sprite, delta: number) {
    // Update drone hovering logic
    console.log('Drone hovering updated')
  }
}

// Initialize the game
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: PlayScene
}

new Phaser.Game(config)
