export class SpaceBackground {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private readonly numStars = 150;
  private spawnTimer = 0;
  private readonly spawnRate = 8;
  private animationId: number | null = null;
  private centerX: number;
  private centerY: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;

    this.init();
  }

  private init(): void {
    // Initialize stars with random positions
    for (let i = 0; i < this.numStars; i++) {
      const star = new Star(this.centerX, this.centerY);
      star.distance = Math.random() * Math.max(this.canvas.width, this.canvas.height);
      this.stars.push(star);
    }

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }

  public start(): void {
    this.animate();
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Spawn new stars
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnRate && this.stars.length < this.numStars) {
      this.stars.push(new Star(this.centerX, this.centerY));
      this.spawnTimer = 0;
    }

    // Update and draw stars
    const maxDist = Math.max(this.canvas.width, this.canvas.height) * 1.5;
    this.stars = this.stars.filter((star) => {
      star.update();
      star.draw(this.ctx, this.centerX, this.centerY);
      return star.distance <= maxDist;
    });

    this.animationId = requestAnimationFrame(this.animate);
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', () => this.handleResize());
  }
}

class Star {
  public distance: number = 0;
  private angle: number;
  private speed: number;
  private size: number;
  private readonly color: string = '#ffffff';

  constructor(centerX: number, centerY: number) {
    this.angle = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 1.5 + 0.8;
    this.size = Math.random() * 2 + 2;
  }

  public update(): void {
    this.distance += this.speed;
  }

  public draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const x = Math.round(centerX + Math.cos(this.angle) * this.distance);
    const y = Math.round(centerY + Math.sin(this.angle) * this.distance);
    
    ctx.fillStyle = this.color;
    ctx.fillRect(x, y, this.size, this.size);
  }
}



