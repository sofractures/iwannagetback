import Phaser from 'phaser'
import { submitScore, getLeaderboard } from './supabase'

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
  private playerWon: boolean = false
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
  private winnerScreen?: Phaser.GameObjects.Image
  private winnerText?: Phaser.GameObjects.Text
  private winnerSubText?: Phaser.GameObjects.Text
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
  private loseLifeSound?: Phaser.Sound.BaseSound
  private gameWinSound?: Phaser.Sound.BaseSound
  private bossSpawnSound?: Phaser.Sound.BaseSound
  private bossDeathSound?: Phaser.Sound.BaseSound
  private skyBackground?: Phaser.GameObjects.TileSprite
  private isMuted: boolean = false
  private muteButton?: Phaser.GameObjects.Text
  
  // Touch control properties
  private leftButton?: Phaser.GameObjects.Rectangle
  private rightButton?: Phaser.GameObjects.Rectangle
  private jumpButton?: Phaser.GameObjects.Rectangle
  private leftPressed: boolean = false
  private rightPressed: boolean = false
  private jumpPressed: boolean = false
  
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
  private currentBoss?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  private bossHealth: number = 0
  private maxBossHealth: number = 3
  private bossDefeated: boolean = false
  private bossSpawnedAt: number[] = [1000, 2250, 3350] // Wellbeing milestones for boss spawns (Boss 1 at 1000, Boss 2 at 2250, Boss 3 at 3350)
  private lastBossDeathScore: number = -1000 // Track score when last boss died (start negative to allow first boss at 1000)
  private defeatedBosses: Set<number> = new Set() // Track which bosses have been defeated
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
  // Boss hit system - no visual health bar needed

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
    
    // Load winner screens
    this.load.image('dj_winnerscreen', 'assets/dj_winnerscreen.jpg')
    this.load.image('dj2_winnerscreen', 'assets/dj2_winnerscreen.jpg')
    
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
    
    // Load lose life sound effect
    try {
      this.load.audio('loseLifeSound', 'assets/looselife.mp3')
    } catch (error) {
      console.log('Could not load lose life sound:', error)
    }
    
    // Load game win sound effect
    try {
      this.load.audio('gameWinSound', 'assets/gamewin.mp3')
    } catch (error) {
      console.log('Could not load game win sound:', error)
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
    // boss3_laser.png doesn't exist - Boss 3 uses drones instead
    
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

    // Create magical sparkle texture for boss trail
    const magicalGfx = this.make.graphics({ x: 0, y: 0 })
    magicalGfx.fillStyle(0x00ffff, 1.0) // Cyan magical color
    magicalGfx.fillCircle(4, 4, 4)
    magicalGfx.fillStyle(0xffffff, 0.8) // White center
    magicalGfx.fillCircle(4, 4, 2)
    magicalGfx.generateTexture('magical', 8, 8)
  }

  create() {
    const width = this.scale.width
    const height = this.scale.height

    // Supabase connection will be tested when submitting scores

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
    this.taglineText = this.add.text(width / 2, height / 6, 'Collect your memories... before its too late', {
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
    ground.setVisible(true)

    // Sky background (parallax - scrolls slower than foreground)
    // Fill the top portion of screen, bottom edge above ground
    this.skyBackground = this.add.tileSprite(width / 2, 0, width, height - 20, 'sky')
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

    // Create magical floating trail particle system for Boss 1 and 2
    this.bossTrailParticles = this.add.particles(0, 0, 'magical', {
      x: 0,
      y: 0,
      scale: { start: 1.0, end: 0.1 },
      alpha: { start: 1.0, end: 0.0 },
      speedY: { min: 50, max: 100 },
      speedX: { min: -30, max: 30 },
      lifespan: 2000,
      quantity: 5,
      emitting: false,
      frequency: 100,
      gravityY: 50,
      emitZone: { 
        type: 'edge', 
        source: new Phaser.Geom.Circle(0, 0, 10), 
        quantity: 5
      }
    })
    this.bossTrailParticles.setDepth(1000)
    
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
    this.player.body.setSize(this.player.width * 0.9, this.player.height * 0.95)
    this.player.setGravityY(700)
    
    // Ensure player can play animations
    this.player.setTexture('dj_right')
    
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
    
    // Create touch controls only on mobile devices
    if (this.isMobileDevice()) {
      this.createTouchControls()
    }

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
    
    // Player selection screen shown
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
    
    // Ensure player is facing right and running during countdown
    this.player.setTexture(this.selectedPlayer)
    this.player.play(this.getAnimationKey('run_right'), true)
    
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
    
    // Countdown started
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
    
    // Game started
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
      const jumpVelocity = -504

      const onFloor = (this.player.body as Phaser.Physics.Arcade.Body).touching.down
      const touchingPlatform = this.checkPlayerTouchingPlatform()
      const isJumping = (this.cursors.up?.isDown || (this.cursors.space?.isDown && this.gameStarted) || this.jumpPressed) && (onFloor || touchingPlatform)

      if (isJumping) {
        // Jump - stop animation and show original sprite
        this.player.anims.stop()
        if (this.player.texture.key.includes('left')) {
          this.player.setTexture(this.getLeftTexture())
        } else {
          this.player.setTexture(this.selectedPlayer)
        }
        this.player.setVelocityY(jumpVelocity)
      } else if (this.cursors.left?.isDown || this.leftPressed) {
        // Move left - slower pace for better control
        this.player.setVelocityX(-fastSpeed * 0.7)
        if (onFloor) {
          this.player.play(this.getAnimationKey('run_left'), true)
        } else {
          this.player.anims.stop()
          this.player.setTexture(this.getLeftTexture())
        }
      } else if (this.cursors.right?.isDown || this.rightPressed) {
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
      const zombieJumpVelocity = -220 // Weaker jump

      const onFloor = (this.player.body as Phaser.Physics.Arcade.Body).touching.down
      const touchingPlatform = this.checkPlayerTouchingPlatform()
      const isJumping = (this.cursors.up?.isDown || (this.cursors.space?.isDown && this.gameStarted)) && (onFloor || touchingPlatform)

      if (isJumping) {
        // Jump - stop animation and show original sprite
        this.player.anims.stop()
        if (this.player.texture.key.includes('left')) {
          this.player.setTexture(this.getLeftTexture())
        } else {
          this.player.setTexture(this.selectedPlayer)
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
          this.player.setTexture(this.selectedPlayer)
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
          this.player.setTexture(this.getLeftTexture())
        } else {
          this.player.setTexture(this.selectedPlayer)
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

    // Check for boss spawning based on gap since last boss death
    if (!this.currentBoss) {
      const gapSinceLastBoss = this.score - this.lastBossDeathScore
      
      // Determine which boss should spawn based on gap and defeated bosses
      let bossToSpawn = -1
      if (gapSinceLastBoss >= 1000) {
        // Find which boss milestone we should spawn based on total score and defeated bosses
        if (this.score >= 3350 && !this.defeatedBosses.has(3)) {
          bossToSpawn = 3 // Boss 3 at 3350+
        } else if (this.score >= 2250 && !this.defeatedBosses.has(2)) {
          bossToSpawn = 2 // Boss 2 at 2250+
        } else if (this.score >= 1000 && !this.defeatedBosses.has(1)) {
          bossToSpawn = 1 // Boss 1 at 1000+
        }
        
        if (bossToSpawn > 0) {
          // Spawning boss
          
          try {
            this.spawnBoss(bossToSpawn)
          } catch (error) {
            console.error(`❌ Error spawning boss ${bossToSpawn}:`, error)
          }
        }
      }
    }

    // Update boss floating movement and attacks
    if (this.currentBoss) {
      try {
        this.updateBossMovement(delta)
        this.updateBossAttacks(delta)
      } catch (error) {
        console.error('Error updating boss:', error)
      }
      
      // Update trail particle position with movement-responsive effect
      if (this.bossTrailParticles) {
        const currentX = this.currentBoss.x
        const currentY = this.currentBoss.y
        
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
      
      // Debug logging removed to prevent performance issues
      
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
      block.body.setSize(block.width, block.height * 1.2) // Make collision box slightly taller for easier landing
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
    // Only collect if game has started
    if (!this.gameStarted || this.gameOverState) {
      return
    }
    
    const value = (collectible.getData('score') as number) ?? 0
    const special = collectible.getData('special') as string
    
    // Handle special collectibles
    if (special === 'life') {
      // Play life up sound effect
      try {
        this.sound.play('lifeUp', { volume: this.isMuted ? 0 : 0.2 })
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
    // Only handle collisions if game has started
    if (!this.gameStarted || this.gameOverState) {
      return
    }
    
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    
    // Check if player is stomping - if so, check ALL nearby enemies for stomping
    if (playerBody.velocity.y >= 0) {
      // Player is falling/jumping - check for stompable enemies
      this.checkForStompableEnemies()
    } else if (!this.isFrozen) {
      // Player hit enemy from side - take damage
      this.takeDamage(enemy)
    }
  }

  private checkForStompableEnemies() {
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    const playerBottom = this.player.y + this.player.height / 2
    const playerCenterX = this.player.x
    
    // Get all enemies and check which ones can be stomped
    const enemies = this.enemies.getChildren() as Phaser.GameObjects.Sprite[]
    const stompableEnemies: Phaser.GameObjects.Sprite[] = []
    
    for (const enemy of enemies) {
      if (!enemy.active) continue
      
      const enemyTop = enemy.y - enemy.height / 2
      const enemyCenterX = enemy.x
      const horizontalDistance = Math.abs(playerCenterX - enemyCenterX)
      const enemyWidth = enemy.width || 32
      
      // More forgiving stomp detection - player can be anywhere above enemy and within expanded enemy width
      const stompZoneWidth = enemyWidth * 1.5 // 50% bigger horizontal strike zone
      const stompZoneHeight = 35 // Increased vertical tolerance
      
      if (playerBottom <= enemyTop + stompZoneHeight && playerBody.velocity.y >= 0 && horizontalDistance <= stompZoneWidth) {
        // This enemy can be stomped - add to list
        stompableEnemies.push(enemy)
      }
    }
    
    // Stomp all enemies that are in range (only once each)
    if (stompableEnemies.length > 0) {
      for (const enemy of stompableEnemies) {
        this.stompEnemy(enemy)
      }
      return // Don't take damage if we stomped any enemies
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
      playerBody.setVelocityY(-420) // Moderate jump
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
      this.sound.play('enemyStomp', { volume: this.isMuted ? 0 : 0.1 })
    } catch (error) {
      console.log('Could not play stomp sound:', error)
    }
    
    // Show sparkle death effect at enemy position
    this.showEnemyDeathEffect(enemy.x, enemy.y)
    
    enemy.destroy()
    
    // Give player a small bounce
    this.player.setVelocityY(-300)
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
      // Game over - play death sound
      this.gameOver()
      return
    }
    
    // Play lose life sound (player still alive)
    try {
      this.loseLifeSound = this.sound.add('loseLifeSound', { volume: this.isMuted ? 0 : 0.2 })
      this.loseLifeSound.play()
    } catch (error) {
      console.log('Could not play lose life sound:', error)
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
    console.log('🔄 FRESH RESTART - Refreshing browser')
    
    // Complete fresh start - just like refreshing the browser
    window.location.reload()
  }

  private cleanupAllScreens() {
    console.log('🧹 Cleaning up all screens and containers')
    
    // Clean up game over screen elements
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
    
    // Clean up winner screen elements
    if (this.winnerScreen) {
      this.winnerScreen.destroy()
      this.winnerScreen = undefined
    }
    if (this.winnerText) {
      this.winnerText.destroy()
      this.winnerText = undefined
    }
    if (this.winnerSubText) {
      this.winnerSubText.destroy()
      this.winnerSubText = undefined
    }
    
    // Clean up leaderboard screen elements
    this.cleanupLeaderboardScreen()
    
    // Clean up any remaining timers
    if (this.leaderboardTimer) {
      this.leaderboardTimer.destroy()
      this.leaderboardTimer = undefined
    }
    
    // Clean up keyboard handler
    this.input.keyboard!.off('keydown')
  }

  private resetAllGameState() {
    console.log('🔄 Resetting all game state')
    
    // Core game state
    this.lives = 3
    this.score = 0
    this.isFrozen = false
    this.gameOverState = false
    this.gameStarted = false
    this.countdownActive = false
    this.playerSelectionActive = false
    this.playerWon = false
    this.selectedPlayer = 'dj_right'
    
    // Leaderboard state
    this.currentInput = 'initials'
    if (this.initialsInput) this.initialsInput.text = ''
    if (this.emailInput) this.emailInput.text = ''
    
    // Boss state
    this.currentBoss = undefined
    this.defeatedBosses.clear()
    this.bossHealth = 0
    this.maxBossHealth = 1
    this.bossFloatTimer = 0
    this.bossFloatSpeed = 0.002
    this.bossAttackTimer = 0
    this.bossAttackInterval = 2000
    this.bossAttackTimer = 0
    this.bossAttackInterval = 3000
    
    // Clean up boss groups
    if (this.bossLasers) {
      this.bossLasers.clear(true, true)
    }
    if (this.bossDrones) {
      this.bossDrones.clear(true, true)
    }
    
  }

  private resetPlayerState() {
    console.log('🔄 Resetting player state')
    
    // Reset player position and visibility
    this.player.setPosition(100, this.scale.height - 100)
    this.player.setVisible(true)
    this.player.clearTint()
    this.player.setScale(1)
    this.player.setRotation(0)
    
    // Reset player physics
    this.player.setVelocity(0, 0)
    this.player.body!.setGravityY(0)
    this.player.body!.setSize(32, 48)
    this.player.body!.setOffset(16, 0)
    
    // Reset player animation
    this.player.anims.play('idle_right', true)
    
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
    this.lastBossDeathScore = -1000
    this.defeatedBosses.clear()
    
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
    this.taglineText = this.add.text(width / 2, height / 6, 'Collect your memories... before its too late', {
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
    // Set game over state to stop all game processing
    this.gameOverState = true
    console.log('🔄 Set game over state in showLeaderboardScreen')
    
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
    const instructions = this.add.text(0, -100, 'Enter your details to get your free download and free win merch', {
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
      
      // Check if we're showing the top 10 leaderboard (no input fields)
      if (!this.initialsInput || !this.emailInput || (this.currentInput !== 'initials' && this.currentInput !== 'email')) {
        // Press any key to continue
        this.restartGame()
        return
      }
      
      // Handle input based on current input field
      if (this.currentInput === 'initials') {
        this.handleInitialsInput(event.key)
      } else if (this.currentInput === 'email') {
        this.handleEmailInput(event.key)
      }
    })
    
    // Only set up click handlers if input fields exist
    if (this.initialsInput && this.emailInput) {
      this.initialsInput.setInteractive()
      this.initialsInput.on('pointerdown', () => {
        this.currentInput = 'initials'
        this.updateInputHighlight()
      })
      
      this.emailInput.setInteractive()
      this.emailInput.on('pointerdown', () => {
        this.currentInput = 'email'
        this.updateInputHighlight()
      })
      
      // Initialize with initials input
      this.currentInput = 'initials'
      this.initialsText = ''
      this.emailText = ''
      this.updateInputHighlight()
    } else {
      // For top 10 leaderboard, just set up basic input
      this.currentInput = 'initials'
      this.initialsText = ''
      this.emailText = ''
    }
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
    if (!this.initialsInput || !this.emailInput) {
      return // Don't try to update if input fields don't exist
    }
    
    if (this.currentInput === 'initials') {
      this.initialsInput.setStyle({ color: '#00ff00' })
      this.emailInput.setStyle({ color: '#ffffff' })
    } else {
      this.initialsInput.setStyle({ color: '#ffffff' })
      this.emailInput.setStyle({ color: '#00ff00' })
    }
  }

  private async submitLeaderboardScore() {
    if (this.initialsText.length !== 3 || this.emailText.length === 0) {
      console.log('Please enter 3 initials and an email')
      return
    }

    console.log('Submitting score:', {
      initials: this.initialsText,
      email: this.emailText,
      score: this.score,
      isWinner: this.playerWon,
      lives: this.lives,
      gameOverState: this.gameOverState
    })

    try {
      // Disable submit button to prevent multiple submissions
      if (this.submitButton) {
        this.submitButton.disableInteractive()
        this.submitButton.setText('Submitting...')
      }
      
      const success = await submitScore(this.initialsText, this.emailText, this.score)
      
      if (success) {
        console.log('✅ Score submitted successfully!')
        console.log('🎯 About to show top 10 leaderboard...')
        // Show top 10 leaderboard after successful submission
        await this.showTop10Leaderboard()
        console.log('✅ Top 10 leaderboard should now be visible')
      } else {
        console.log('❌ Failed to submit score')
        this.cleanupLeaderboardScreen()
        this.restartGame()
      }
    } catch (error) {
      console.error('❌ Error in submitLeaderboardScore:', error)
      this.cleanupLeaderboardScreen()
      this.restartGame()
    }
  }

  private skipLeaderboard() {
    this.cleanupLeaderboardScreen()
    this.restartGame()
  }

  private async showTop10Leaderboard() {
    console.log('🎯 showTop10Leaderboard called')
    
    // Set game over state to stop all game processing
    this.gameOverState = true
    console.log('🔄 Set game over state to stop game processing')
    
    // Hide all input form elements first
    if (this.initialsInput) {
      this.initialsInput.setVisible(false)
    }
    if (this.emailInput) {
      this.emailInput.setVisible(false)
    }
    if (this.submitButton) {
      this.submitButton.setVisible(false)
    }
    // Hide any error/success messages
    console.log('👁️ Hid all input form elements')
    
    // Clean up the current leaderboard screen
    this.cleanupLeaderboardScreen()
    console.log('🧹 Cleaned up previous leaderboard screen')
    
    // Stop any existing timers that might interfere
    if (this.leaderboardTimer) {
      this.leaderboardTimer.destroy()
      this.leaderboardTimer = undefined
    }
    
    // Clean up boss and other game elements
    if (this.currentBoss) {
      this.currentBoss.destroy()
      this.currentBoss = undefined
    }
    
    // Stop all game timers
    if (this.spawnTimer) {
      this.spawnTimer.destroy()
      this.spawnTimer = undefined
    }
    if (this.collectibleTimer) {
      this.collectibleTimer.destroy()
      this.collectibleTimer = undefined
    }
    if (this.enemyTimer) {
      this.enemyTimer.destroy()
      this.enemyTimer = undefined
    }
    if (this.freezeTimer) {
      this.freezeTimer.destroy()
      this.freezeTimer = undefined
    }
    
    // Stop all game groups
    this.enemies.clear(true, true)
    this.collectibles.clear(true, true)
    this.platforms.clear(true, true)
    this.bossLasers.clear(true, true)
    this.bossDrones.clear(true, true)
    this.droneBombs.clear(true, true)
    
    // Stop player movement
    this.player.setVelocity(0, 0)
    this.isFrozen = true
    
    // Create new leaderboard display
    this.leaderboardScreen = this.add.container(0, 0)
    this.leaderboardScreen.setDepth(10000) // Ensure it's on top
    console.log('📦 Created new leaderboard container')
    
    // Background - make it more opaque and ensure it covers the screen
    const background = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.95)
    background.setOrigin(0, 0)
    background.setDepth(10001) // Ensure background is on top
    this.leaderboardScreen.add(background)
    console.log('🖤 Background created')
    
    // Title - moved higher and smaller
    const title = this.add.text(this.cameras.main.width / 2, 50, 'TOP 10 LEADERBOARD', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '24px', // Reduced from 36px
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    })
    title.setOrigin(0.5, 0.5)
    title.setDepth(10002) // Ensure title is visible
    this.leaderboardScreen.add(title)
    console.log('📝 Title created')
    
    // Test text removed for cleaner look
    
    try {
      console.log('📡 Fetching top 10 scores from database...')
      // Fetch top 10 scores
      const topScores = await getLeaderboard(10)
      console.log('📊 Retrieved scores:', topScores)
      
      // If no scores, show a message
      if (!topScores || topScores.length === 0) {
        console.log('⚠️ No scores found, showing empty leaderboard')
        const noScoresText = this.add.text(this.cameras.main.width / 2, 200, 'No scores yet!', {
          fontFamily: 'ui, Arial, sans-serif',
          fontSize: '24px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        })
        noScoresText.setOrigin(0.5, 0.5)
        this.leaderboardScreen.add(noScoresText)
        return
      }
      
      // Display scores - centered with even smaller text
      const startY = 100 // Moved up from 140
      const centerX = this.cameras.main.width / 2
      const rankWidth = 35
      const initialsWidth = 70
      const scoreWidth = 70
      const spacing = 12
      
      console.log(`📊 Displaying ${topScores.length} scores...`)
      topScores.forEach((entry, index) => {
        const rank = index + 1
        const initials = entry.initials
        const score = entry.score
        const yOffset = startY + (index * 28) // Further reduced spacing
        console.log(`📊 Creating entry ${rank}: ${initials} - ${score}`)
        
        // Calculate centered positions
        const rankX = centerX - (rankWidth + initialsWidth + scoreWidth + spacing * 2) / 2
        const initialsX = rankX + rankWidth + spacing
        const scoreX = initialsX + initialsWidth + spacing
        
        // Rank
        const rankText = this.add.text(rankX, yOffset, `${rank}.`, {
          fontFamily: 'ui, Arial, sans-serif',
          fontSize: '16px', // Further reduced from 18px
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        })
        rankText.setOrigin(0, 0.5)
        rankText.setDepth(10002)
        this.leaderboardScreen.add(rankText)
        
        // Initials
        const initialsText = this.add.text(initialsX, yOffset, initials, {
          fontFamily: 'ui, Arial, sans-serif',
          fontSize: '16px', // Further reduced from 18px
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        })
        initialsText.setOrigin(0, 0.5)
        initialsText.setDepth(10002)
        this.leaderboardScreen.add(initialsText)
        
        // Score
        const scoreText = this.add.text(scoreX, yOffset, score.toString(), {
          fontFamily: 'ui, Arial, sans-serif',
          fontSize: '16px', // Further reduced from 18px
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        })
        scoreText.setOrigin(0, 0.5)
        scoreText.setDepth(10002)
        this.leaderboardScreen.add(scoreText)
        
        // Winner indicator removed - not available in current data structure
      })
      
      console.log('✅ Successfully displayed all scores')
      
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error)
      
      // Show error message
      const errorText = this.add.text(this.cameras.main.width / 2, 150, 'Error loading leaderboard', {
        fontFamily: 'ui, Arial, sans-serif',
        fontSize: '24px',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 2,
      })
      errorText.setOrigin(0.5, 0.5)
      this.leaderboardScreen.add(errorText)
    }
    
    // Continue button
    const continueButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 80, 'Press Any Key to Continue', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '22px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2,
    })
    continueButton.setOrigin(0.5, 0.5)
    continueButton.setDepth(10002) // Ensure continue button is visible
    continueButton.setInteractive()
    continueButton.on('pointerdown', () => {
      // Open Sound of Fractures pre-save page in new tab
      window.open('https://symphony.to/sound-of-fractures/i-wanna-get-back', '_blank')
      this.restartGame()
    })
    this.leaderboardScreen.add(continueButton)
    console.log('🔄 Continue button created')
    
    // Set up simple keyboard input for top 10 leaderboard
    this.setupTop10Input()
    console.log('🎮 Top 10 leaderboard setup complete - ready for input')
    
    // Add a small delay to ensure everything is rendered
    this.time.delayedCall(100, () => {
      console.log('✅ Leaderboard should now be fully visible')
      
      // Double-check that input form is hidden
      if (this.initialsInput && this.initialsInput.visible) {
        this.initialsInput.setVisible(false)
        console.log('🔧 Force-hid initials input')
      }
      if (this.emailInput && this.emailInput.visible) {
        this.emailInput.setVisible(false)
        console.log('🔧 Force-hid email input')
      }
      if (this.submitButton && this.submitButton.visible) {
        this.submitButton.setVisible(false)
        console.log('🔧 Force-hid submit button')
      }
    })
  }

  private setupTop10Input() {
    console.log('🎮 Setting up top 10 leaderboard input...')
    
    // Clear existing keyboard handlers
    this.input.keyboard!.off('keydown')
    
    // Add a delay before setting up input to prevent immediate triggering
    this.time.delayedCall(500, () => {
      // Set up simple keyboard input for top 10 leaderboard
      this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
        console.log('🎮 Key pressed on leaderboard, restarting game...')
        console.log('🎮 Key pressed:', event.key)
        // Open Sound of Fractures pre-save page in new tab
        window.open('https://symphony.to/sound-of-fractures/i-wanna-get-back', '_blank')
        // Press any key to continue - complete reset
        this.restartGame()
      })
      
      // Also set up click handler for the entire screen
      this.input.on('pointerdown', () => {
        console.log('🎮 Screen clicked on leaderboard, restarting game...')
        // Open Sound of Fractures pre-save page in new tab
        window.open('https://symphony.to/sound-of-fractures/i-wanna-get-back', '_blank')
        this.restartGame()
      })
      
      console.log('🎮 Keyboard and click input ready for leaderboard')
    })
  }

  private cleanupLeaderboardScreen() {
    console.log('🧹 Starting cleanup of leaderboard screen')
    console.trace('🧹 Cleanup called from:')
    
    if (this.leaderboardScreen) {
      this.leaderboardScreen.destroy()
      this.leaderboardScreen = undefined
      console.log('🧹 Destroyed leaderboard container')
    }
    if (this.leaderboardTimer) {
      this.leaderboardTimer.destroy()
      this.leaderboardTimer = undefined
      console.log('🧹 Destroyed leaderboard timer')
    }
    
    // Clean up individual input elements
    if (this.initialsInput) {
      this.initialsInput.destroy()
      this.initialsInput = undefined
      console.log('🧹 Destroyed initials input')
    }
    if (this.emailInput) {
      this.emailInput.destroy()
      this.emailInput = undefined
      console.log('🧹 Destroyed email input')
    }
    if (this.submitButton) {
      this.submitButton.destroy()
      this.submitButton = undefined
      console.log('🧹 Destroyed submit button')
    }
    // Clean up any error/success messages
    
    this.input.keyboard!.off('keydown')
    console.log('🧹 Cleaned up all leaderboard elements')
  }

  // Missing boss-related methods
  private handleBossCollision(boss: Phaser.GameObjects.Sprite) {
    // Only handle collisions if game has started
    if (!this.gameStarted || this.gameOverState) {
      return
    }
    
    // Check if player is stomping from above (player is above boss and falling down)
    const playerBottom = this.player.y + (this.player.height / 2)
    const bossTop = boss.y - (boss.height / 2)
    const playerFalling = (this.player.body as Phaser.Physics.Arcade.Body).velocity.y > 0
    const isStomping = playerBottom < bossTop + 20 && playerFalling
    
    if (isStomping) {
      // Player stomps boss from above
      this.bossHealth--
      // Boss hit system - no visual update needed
      
      // Flash boss red to show damage
      boss.setTint(0xff0000)
      this.time.delayedCall(100, () => {
        boss.clearTint()
      })
      
      // Bounce player up
      this.player.setVelocityY(-300)
      
      // Check if boss is defeated
      if (this.bossHealth <= 0) {
        this.defeatBoss()
      }
    } else {
      // Check if player is invulnerable (cooldown to prevent multiple hits)
      if (this.player.getData('invulnerable')) {
        return
      }
      
      // Player takes damage when touching boss from the side
      this.lives--
      this.livesText.setText(`Lives: ${this.lives}`)
      
      // Set invulnerability for 1 second to prevent multiple hits
      this.player.setData('invulnerable', true)
      this.time.delayedCall(1000, () => {
        this.player.setData('invulnerable', false)
      })
      
      // Flash player red to show damage
      this.player.setTint(0xff0000)
      this.time.delayedCall(200, () => {
        this.player.clearTint()
      })
      
      // Push player away from boss
      if (this.player.x < boss.x) {
        this.player.setVelocityX(-200)
      } else {
        this.player.setVelocityX(200)
      }
      
      if (this.lives <= 0) {
        this.gameOver()
      }
    }
  }

  private handleLaserCollision(laser: Phaser.GameObjects.Sprite) {
    // Only handle collisions if game has started
    if (!this.gameStarted || this.gameOverState) {
      return
    }
    
    // Player hit by boss laser
    this.lives--
    this.livesText.setText(`Lives: ${this.lives}`)
    
    // Flash player red to show damage
    this.player.setTint(0xff0000)
    this.time.delayedCall(200, () => {
      this.player.clearTint()
    })
    
    // Push player back
    this.player.setVelocityX(-200)
    
    // Destroy laser
    laser.destroy()
    
    // Check for game over
    if (this.lives <= 0) {
      this.gameOver()
    }
  }

  private handleBombCollision(bomb: Phaser.GameObjects.Sprite) {
    // Only handle collisions if game has started
    if (!this.gameStarted || this.gameOverState) {
      return
    }
    
    // Player hit by drone bomb
    this.lives--
    this.livesText.setText(`Lives: ${this.lives}`)
    
    // Flash player red to show damage
    this.player.setTint(0xff0000)
    this.time.delayedCall(200, () => {
      this.player.clearTint()
    })
    
    // Push player back
    this.player.setVelocityX(-200)
    
    // Destroy bomb
    bomb.destroy()
    
    // Check for game over
    if (this.lives <= 0) {
      this.gameOver()
    }
  }

  private toggleMute() {
    this.isMuted = !this.isMuted
    
    // Update mute button icon
    if (this.muteButton) {
      this.muteButton.setText(this.isMuted ? '🔇' : '🔊')
    }
    
    // Update music volumes
    if (this.introMusic) {
      (this.introMusic as any).setVolume(this.isMuted ? 0 : 0.3)
    }
    if (this.mainThemeMusic) {
      (this.mainThemeMusic as any).setVolume(this.isMuted ? 0 : 0.5)
    }
    if (this.gameOverMusic) {
      (this.gameOverMusic as any).setVolume(this.isMuted ? 0 : 0.5)
    }
    
    console.log('Mute toggled:', this.isMuted)
  }

  private updateLevelSpeed(delta: number) {
    // Level progression is now controlled by boss defeats, not time
    // This function is kept for potential future use but currently disabled
    // The levelSpeed is set in defeatBoss() based on score milestones
  }

  private checkPlayerTouchingPlatform(): boolean {
    // Check if player is touching any platform (ground or blocks)
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body
    
    // Check if touching ground
    if (playerBody.touching.down) {
      return true
    }
    
    // Check if touching any blocks
    const playerBounds = this.player.getBounds()
    const platforms = this.platforms.getChildren() as Phaser.Physics.Arcade.Image[]
    
    for (const platform of platforms) {
      const platformBounds = platform.getBounds()
      
      // Check if player is overlapping with platform
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, platformBounds)) {
        return true
      }
    }
    
    return false
  }

  private spawnBoss(bossNumber: number) {
    console.log(`Spawning Boss ${bossNumber} at wellbeing ${this.score}`)
    
    // Set boss health - all bosses now require 1 hit to kill
    this.maxBossHealth = 1 // All bosses: 1 hit to kill
    this.bossHealth = this.maxBossHealth
    this.bossDefeated = false
    
    // Create boss sprite
    const bossKey = `boss${bossNumber}_right`
    const spawnX = this.scale.width + 100
    const spawnY = this.scale.height / 2
    try {
      this.currentBoss = this.bosses.create(spawnX, spawnY, bossKey) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    } catch (error) {
      console.error(`Failed to create boss sprite with key: ${bossKey}`, error)
      return
    }
    
    // Set boss properties
    this.currentBoss.setScale(1.5)
    this.currentBoss.setDepth(1000) // Ensure boss is visible on top
    this.currentBoss.setVelocityX(-100) // Move left slowly
    
    // Set boss physics
    this.currentBoss.body.setSize(this.currentBoss.width * 0.8, this.currentBoss.height * 0.8)
    this.currentBoss.body.setImmovable(true)
    
    // Set boss data for trail particles
    this.currentBoss.setData('bossNumber', bossNumber)
    
    // Initialize last position for trail tracking
    this.lastBossX = this.currentBoss.x
    this.lastBossY = this.currentBoss.y
    
    // Play boss spawn sound
    try {
      this.bossSpawnSound = this.sound.add('bossSpawnSound', { volume: this.isMuted ? 0 : 0.8 })
      this.bossSpawnSound.play()
    } catch (error) {
      console.log('Could not play boss spawn sound:', error)
    }
    
    // Boss uses hit system (no visible health bar)
    
    // Start magical trail particles for Boss 1 and 2
    if (bossNumber !== 3 && this.bossTrailParticles) {
      this.bossTrailParticles.setPosition(this.currentBoss.x, this.currentBoss.y)
      this.bossTrailParticles.start()
    }
    
    // Start music particles for Boss 3
    if (bossNumber === 3 && this.bossMusicParticles) {
      this.bossMusicParticles.setPosition(this.currentBoss.x, this.currentBoss.y)
      this.bossMusicParticles.start()
    }
    
    // Boss 3 spawns drones
    if (bossNumber === 3) {
      this.spawnDrone()
    }
  }

  // Boss hit system - no visual health bar needed



  private defeatBoss() {
    if (!this.currentBoss) return
    
    const bossNumber = this.currentBoss.getData('bossNumber')
    console.log(`Boss ${bossNumber} defeated!`)
    this.bossDefeated = true
    this.lastBossDeathScore = this.score
    this.defeatedBosses.add(bossNumber)
    
    // Play boss death sound
    try {
      this.bossDeathSound = this.sound.add('bossDeathSound', { volume: this.isMuted ? 0 : 0.7 })
      this.bossDeathSound.play()
    } catch (error) {
      console.log('Could not play boss death sound:', error)
    }
    
    // Stop trail particles
    if (this.bossTrailParticles) {
      this.bossTrailParticles.stop()
    }
    if (this.bossMusicParticles) {
      this.bossMusicParticles.stop()
    }
    
    // Clean up health bar
    // Boss hit system - no visual cleanup needed
    
    // Destroy boss
    this.currentBoss.destroy()
    this.currentBoss = undefined
    
    // Add score bonus
    this.score += 500
    
    // Level progression based on boss defeats
    console.log(`🎯 Boss ${bossNumber} defeated! Checking progression...`)
    
    if (bossNumber === 1) {
      // Boss 1 defeated - start Level 2
      console.log('📈 Level 2 progression')
      this.currentLevel = 2
      this.levelSpeed = 1.2 // Slightly faster than Level 1
      this.levelText.setText(`Level ${this.currentLevel}`)
    } else if (bossNumber === 2) {
      // Boss 2 defeated - start Level 3
      console.log('📈 Level 3 progression')
      this.currentLevel = 3
      this.levelSpeed = 1.5 // Faster than Level 2
      this.levelText.setText(`Level ${this.currentLevel}`)
    } else if (bossNumber === 3) {
      // Boss 3 defeated - pause and flash before winner screen
      console.log('🏆 Boss 3 defeated! Starting victory sequence...')
      this.startBoss3VictorySequence()
      return // Don't continue with normal level progression
    }
    this.scoreText.setText(`Wellbeing: ${this.score}`)
  }

  private startBoss3VictorySequence() {
    // Set game over state to stop normal gameplay
    this.gameOverState = true
    
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
    
    // Start boss flashing effect
    this.flashBoss3()
    
    // Play game win sound
    try {
      this.gameWinSound = this.sound.add('gameWinSound', { volume: this.isMuted ? 0 : 0.3 })
      this.gameWinSound.play()
    } catch (error) {
      console.log('Could not play game win sound:', error)
    }
    
    // After 3 seconds, show winner screen
    this.time.delayedCall(3000, () => {
      this.showWinnerScreen()
    })
  }

  private flashBoss3() {
    if (!this.currentBoss) return
    
    // Create slower flashing effect for 3 seconds
    let flashCount = 0
    const maxFlashes = 6 // 6 flashes over 3 seconds (slower)
    
    const flashTimer = this.time.addEvent({
      delay: 500, // Flash every 500ms (slower)
      loop: true,
      callback: () => {
        if (flashCount >= maxFlashes) {
          flashTimer.destroy()
          return
        }
        
        // Alternate between red and normal
        if (flashCount % 2 === 0) {
          this.currentBoss!.setTint(0xff0000) // Red
        } else {
          this.currentBoss!.clearTint() // Normal
        }
        
        flashCount++
      }
    })
  }

  private showWinnerScreen() {
    // Mark player as winner
    this.playerWon = true
    
    // Stop all game processing
    this.gameOverState = true
    
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
    
    // Show winner screen background (DJ-specific)
    const winnerScreenKey = this.selectedPlayer === 'dj2_right' ? 'dj2_winnerscreen' : 'dj_winnerscreen'
    this.winnerScreen = this.add.image(this.scale.width / 2, this.scale.height / 2, winnerScreenKey)
    this.winnerScreen.setOrigin(0.5, 0.5)
    this.winnerScreen.setScrollFactor(0)
    this.winnerScreen.setDisplaySize(this.scale.width, this.scale.height)
    this.winnerScreen.setDepth(4000)
    
    // Show congratulations text
    this.winnerText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'CONGRATULATIONS', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '48px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    })
    this.winnerText.setOrigin(0.5, 0.5)
    this.winnerText.setScrollFactor(0)
    this.winnerText.setDepth(4001)
    
    // Show subtext
    this.winnerSubText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, 'You have achieved a healthy life balance', {
      fontFamily: 'ui, Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    })
    this.winnerSubText.setOrigin(0.5, 0.5)
    this.winnerSubText.setScrollFactor(0)
    this.winnerSubText.setDepth(4001)
    
    // Play game win sound
    try {
      this.gameWinSound = this.sound.add('gameWinSound', { volume: this.isMuted ? 0 : 0.3 })
      this.gameWinSound.play()
    } catch (error) {
      console.log('Could not play game win sound:', error)
    }
    
    // Main theme music continues playing (already playing from countdown)
    
    // Stop player movement
    this.player.setVelocity(0, 0)
    this.isFrozen = true
    
    // Start 4-second timer before showing leaderboard
    this.leaderboardTimer = this.time.addEvent({
      delay: 4000, // 4 seconds
      callback: () => this.showLeaderboardScreen(),
      callbackScope: this
    })
    
    console.log('Winner screen shown!')
  }

  private updateBossMovement(delta: number) {
    if (!this.currentBoss) return
    
    // Boss stays on right side of screen with floating motion
    this.bossFloatTimer += delta
    
    // Create more dynamic vertical movement - sometimes lower, sometimes higher
    const baseY = this.scale.height / 2
    const floatAmount = Math.sin(this.bossFloatTimer * this.bossFloatSpeed) * 50
    
    // Add a secondary wave for more complex movement
    const secondaryWave = Math.sin(this.bossFloatTimer * this.bossFloatSpeed * 0.3) * 80
    
    // Combine waves for more interesting movement pattern
    const totalFloat = floatAmount + secondaryWave
    
    // Update boss position with floating motion (stays on right side)
    // Boss can now go much lower (closer to ground) for stomping opportunities
    this.currentBoss.y = baseY + totalFloat
    
    // Keep boss on right side of screen (between 60% and 90% of screen width)
    const rightSideMin = this.scale.width * 0.6
    const rightSideMax = this.scale.width * 0.9
    
    if (this.currentBoss.x < rightSideMin) {
      if (this.currentBoss && this.currentBoss.setVelocityX) {
        this.currentBoss.setVelocityX(50) // Move right
        this.currentBoss.setTexture(this.currentBoss.texture.key.replace('_left', '_right'))
      }
    } else if (this.currentBoss.x > rightSideMax) {
      if (this.currentBoss && this.currentBoss.setVelocityX) {
        this.currentBoss.setVelocityX(-50) // Move left
        this.currentBoss.setTexture(this.currentBoss.texture.key.replace('_right', '_left'))
      }
    } else {
      // Boss is in the right zone - slow movement
      if (this.currentBoss && this.currentBoss.setVelocityX) {
        this.currentBoss.setVelocityX(0)
      }
    }
  }

  private updateBossAttacks(delta: number) {
    if (!this.currentBoss) return
    
    this.bossAttackTimer += delta
    const bossNumber = this.currentBoss.getData('bossNumber')
    
    // Attack every 3 seconds
    if (this.bossAttackTimer >= this.bossAttackInterval) {
      this.bossAttackTimer = 0
      this.bossIsAttacking = true
      
      if (bossNumber === 1) {
        // Boss 1: Simple laser attack
        const laser = this.bossLasers.create(this.currentBoss.x, this.currentBoss.y, 'boss1_laser') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
        laser.setScale(1.0)
        laser.setDepth(1000)
        laser.setVelocityX(-this.laserSpeed)
        laser.body.setSize(laser.width * 0.5, laser.height * 0.5)
        
        // Remove laser when off screen
        this.time.delayedCall(3000, () => {
          if (laser && laser.active) {
            laser.destroy()
          }
        })
      } else if (bossNumber === 2) {
        // Boss 2: Hat attack
        const hat = this.bossLasers.create(this.currentBoss.x, this.currentBoss.y, 'boss2_hat') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
        hat.setScale(1.0)
        hat.setDepth(1000)
        hat.setVelocityX(-this.laserSpeed * 0.8)
        hat.body.setSize(hat.width * 0.5, hat.height * 0.5)
        hat.setData('isRotating', true)
        hat.setData('rotationSpeed', 0.1)
        
        // Remove hat when off screen
        this.time.delayedCall(3000, () => {
          if (hat && hat.active) {
            hat.destroy()
          }
        })
      } else if (bossNumber === 3) {
        // Boss 3: Spawn drone
        this.spawnDrone()
      }
      
      // Reset attack state
      this.time.delayedCall(1000, () => {
        this.bossIsAttacking = false
      })
    }
  }

  private spawnDrone() {
    if (!this.currentBoss) return
    
    // Create drone
    const drone = this.bossDrones.create(this.currentBoss.x, this.currentBoss.y + 50, 'drone') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    drone.setScale(1.2)
    drone.body.setSize(drone.width * 1.2, drone.height * 1.2)
    
    // Set drone data
    drone.setData('hoverTimer', 0)
    drone.setData('bombTimer', 0)
    drone.setData('isHovering', false)
  }

  private updateDroneHovering(droneSprite: Phaser.GameObjects.Sprite, delta: number) {
    const hoverTimer = droneSprite.getData('hoverTimer') + delta
    const bombTimer = droneSprite.getData('bombTimer') + delta
    const isHovering = droneSprite.getData('isHovering')
    const direction = droneSprite.getData('direction') || 1 // 1 for right, -1 for left
    
    droneSprite.setData('hoverTimer', hoverTimer)
    droneSprite.setData('bombTimer', bombTimer)
    
    if (!isHovering) {
      // Start hovering
      droneSprite.setData('isHovering', true)
      droneSprite.setData('direction', 1) // Start moving right
      const droneBody = droneSprite.body as Phaser.Physics.Arcade.Body
      droneBody.setVelocityY(0) // Stop vertical movement
    }
    
    // Move drone back and forth across the top of the screen
    const droneBody = droneSprite.body as Phaser.Physics.Arcade.Body
    const hoverSpeed = 100 * this.speedMultiplier
    droneBody.setVelocityX(direction * hoverSpeed)
    
    // Check screen boundaries and reverse direction
    // Limit drone movement to avoid interfering with boss stomping
    const screenWidth = this.scale.width
    const droneWidth = droneSprite.width * droneSprite.scaleX
    
    // Drones stay in the right 60% of screen (away from boss stomping area)
    const rightBoundary = screenWidth * 0.6 // Only go to 60% of screen width
    const leftBoundary = screenWidth * 0.2  // Start from 20% of screen width
    
    if (droneSprite.x >= rightBoundary) {
      // Hit right boundary - reverse to left
      droneSprite.setData('direction', -1)
    } else if (droneSprite.x <= leftBoundary) {
      // Hit left boundary - reverse to right
      droneSprite.setData('direction', 1)
    }
    
    // Drop bombs every 2 seconds while hovering
    if (bombTimer >= 2000) {
      droneSprite.setData('bombTimer', 0)
      
      // Create bomb
      const bomb = this.droneBombs.create(droneSprite.x, droneSprite.y, 'bomb') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
      bomb.setScale(0.6)
      bomb.body.setSize(bomb.width * 0.8, bomb.height * 0.8)
      bomb.setVelocityY(this.bombSpeed)
      
      // Remove bomb when it hits ground
      this.time.delayedCall(3000, () => {
        if (bomb && bomb.active) {
          bomb.destroy()
        }
      })
    }
    
    // Remove drone after 10 seconds
    if (hoverTimer >= 10000) {
      droneSprite.destroy()
    }
  }

  private isMobileDevice(): boolean {
    // Simple and reliable mobile detection
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0)
  }

  private createTouchControls() {
    // Ensure multi-touch is enabled: add extra pointers so multiple buttons can be pressed simultaneously
    // This allows holding a direction and pressing jump at the same time on mobile
    this.input.addPointer(3) // add 3 extra pointers (in addition to the primary), supports multi-finger input

    // Create touch controls that work alongside keyboard controls
    const buttonSize = 60 // Smaller size
    const buttonAlpha = 0.7
    const yPosition = this.scale.height - 60 // Closer to bottom
    const leftX = 50 // Closer to left edge
    const rightX = 120 // Closer together
    const jumpX = this.scale.width - 50 // Closer to right edge
    
    // Left button (circle)
    this.leftButton = this.add.circle(leftX, yPosition, buttonSize/2, 0x333333, buttonAlpha) as any
    this.leftButton.setInteractive({ useHandCursor: true })
    this.leftButton.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.leftPressed = true
      p.event?.preventDefault?.()
    })
    this.leftButton.on('pointerup', () => this.leftPressed = false)
    this.leftButton.on('pointerout', () => this.leftPressed = false)
    this.leftButton.on('pointerupoutside', () => this.leftPressed = false)
    
    // Add left arrow text
    this.add.text(leftX, yPosition, '←', { 
      fontSize: '24px', 
      color: '#ffffff' 
    }).setOrigin(0.5, 0.5)
    
    // Right button (circle)
    this.rightButton = this.add.circle(rightX, yPosition, buttonSize/2, 0x333333, buttonAlpha) as any
    this.rightButton.setInteractive({ useHandCursor: true })
    this.rightButton.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.rightPressed = true
      p.event?.preventDefault?.()
    })
    this.rightButton.on('pointerup', () => this.rightPressed = false)
    this.rightButton.on('pointerout', () => this.rightPressed = false)
    this.rightButton.on('pointerupoutside', () => this.rightPressed = false)
    
    // Add right arrow text
    this.add.text(rightX, yPosition, '→', { 
      fontSize: '24px', 
      color: '#ffffff' 
    }).setOrigin(0.5, 0.5)
    
    // Jump button (circle)
    this.jumpButton = this.add.circle(jumpX, yPosition, buttonSize/2, 0x4CAF50, buttonAlpha) as any
    this.jumpButton.setInteractive({ useHandCursor: true })
    this.jumpButton.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.jumpPressed = true
      p.event?.preventDefault?.()
    })
    this.jumpButton.on('pointerup', () => this.jumpPressed = false)
    this.jumpButton.on('pointerout', () => this.jumpPressed = false)
    this.jumpButton.on('pointerupoutside', () => this.jumpPressed = false)
    
    // Add jump text
    this.add.text(jumpX, yPosition, '↑', { 
      fontSize: '24px', 
      color: '#ffffff' 
    }).setOrigin(0.5, 0.5)
  }
}

// Initialize the game
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'app',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 700 },
      debug: false
    }
  },
  scene: PlayScene
}

// Make game globally accessible for comments control
;(window as any).game = new Phaser.Game(config)

// Fullscreen toggle removed

// Responsive scaling for mobile devices only - desktop keeps original sizing
function scaleGameForMobile() {
  const gameCanvas = document.querySelector('#app canvas') as HTMLCanvasElement
  const gameContainer = document.querySelector('#app') as HTMLElement
  const outerContainer = document.querySelector('.game-container') as HTMLElement
  
  if (!gameCanvas || !gameContainer || !outerContainer) return
  
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const gameWidth = 800
  const gameHeight = 450
  
  // Calculate scale factors
  const scaleX = viewportWidth / gameWidth
  const scaleY = viewportHeight / gameHeight
  
  // Use the smaller scale to ensure the game fits completely
  const scale = Math.min(scaleX, scaleY)
  
  // Calculate scaled dimensions (rounded to whole pixels to prevent subpixel overflow)
  const scaledWidth = Math.floor(gameWidth * scale)
  const scaledHeight = Math.floor(gameHeight * scale)
  
  // Apply scaling to canvas
  gameCanvas.style.width = `${scaledWidth}px`
  gameCanvas.style.height = `${scaledHeight}px`
  gameCanvas.style.display = 'block'
  // keep horizontal centering only; don't zero top margin so the page layout (logo spacing) remains intact
  gameCanvas.style.marginLeft = 'auto'
  gameCanvas.style.marginRight = 'auto'
  gameCanvas.style.position = 'relative'
  gameCanvas.style.left = '0'
  gameCanvas.style.top = '0'
  
  // Synchronize container dimensions with canvas
  gameContainer.style.width = `${scaledWidth}px`
  gameContainer.style.height = `${scaledHeight}px`
  // keep horizontal centering only; allow top margin for logo spacing
  gameContainer.style.marginLeft = 'auto'
  gameContainer.style.marginRight = 'auto'
  gameContainer.style.display = 'block'
  gameContainer.style.position = 'relative'
  gameContainer.style.left = '0'
  gameContainer.style.top = '0'
  gameContainer.style.overflow = 'hidden'
  
  // Synchronize outer container dimensions with canvas
  outerContainer.style.width = `${scaledWidth}px`
  outerContainer.style.height = `${scaledHeight}px`
  outerContainer.style.margin = '0 auto'
  outerContainer.style.display = 'inline-block'
  outerContainer.style.position = 'relative'
  outerContainer.style.left = '0'
  outerContainer.style.top = '0'
  outerContainer.style.overflow = 'hidden'
  // Ensure no padding impacts alignment on mobile
  ;(outerContainer as HTMLElement).style.padding = '0'
}

// Set desktop to original fixed dimensions
function setDesktopDimensions() {
  const gameCanvas = document.querySelector('#app canvas') as HTMLCanvasElement
  const gameContainer = document.querySelector('#app') as HTMLElement
  const outerContainer = document.querySelector('.game-container') as HTMLElement
  
  if (!gameCanvas || !gameContainer || !outerContainer) return
  
  const gameWidth = 800
  const gameHeight = 450
  
  // Reset all styles to default for desktop
  gameCanvas.style.width = ''
  gameCanvas.style.height = ''
  gameCanvas.style.display = 'block'
  gameCanvas.style.margin = '0 auto'
  gameCanvas.style.position = 'relative'
  gameCanvas.style.left = '0'
  gameCanvas.style.top = '0'
  
  // Reset container styles to default for desktop
  gameContainer.style.width = ''
  gameContainer.style.height = ''
  gameContainer.style.margin = '0 auto'
  gameContainer.style.display = 'block'
  gameContainer.style.position = 'relative'
  gameContainer.style.left = '0'
  gameContainer.style.top = '0'
  gameContainer.style.overflow = 'hidden'
  
  // Reset outer container styles to default for desktop
  outerContainer.style.width = ''
  outerContainer.style.height = ''
  outerContainer.style.margin = '0 auto'
  outerContainer.style.display = 'inline-block'
  outerContainer.style.position = 'relative'
  outerContainer.style.left = '0'
  outerContainer.style.top = '0'
  outerContainer.style.overflow = 'hidden'
}

// Check if mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 ('ontouchstart' in window) || 
                 (navigator.maxTouchPoints > 0)

// Apply appropriate scaling based on device type
setTimeout(() => {
  if (isMobile) {
    scaleGameForMobile()
  } else {
    setDesktopDimensions()
  }
}, 100)

// Listen for resize and orientation change
window.addEventListener('resize', () => {
  if (isMobile) {
    scaleGameForMobile()
  } else {
    setDesktopDimensions()
  }
})

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    if (isMobile) {
      scaleGameForMobile()
    } else {
      setDesktopDimensions()
    }
  }, 100) // Small delay for orientation change
})
