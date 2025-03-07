class Fruit {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.id = Math.random().toString(36).substring(2, 15);
    this.size = Math.random() * 75 + 75;
    this.score = 2;
    
    // Determine spawn side (left or right)
    this.spawnSide = Math.random() < 0.5 ? 'left' : 'right';
    
    // Set initial position based on spawn side
    if (this.spawnSide === 'left') {
      this.x = -this.size;
      this.velocityX = 3 + Math.random() * 5;
      this.rotationSpeed = 0.05 + Math.random() * 0.05;
    } else {
      this.x = canvas.width + this.size;
      this.velocityX = -(3 + Math.random() * 5);
      this.rotationSpeed = -(0.05 + Math.random() * 0.05);
    }
    
    this.y = window.innerHeight + 50;
    this.image = new Image();
    this.image.src = 'https://placehold.co/50';
    this.isImageLoaded = false;
    
    // Physics properties
    this.velocityY = -35;
    this.gravity = 1;
    this.weight = 1;
    this.rotation = 0;

    // Add property to track if fruit is sliced
    this.isSliced = false;
    this.slicedPieces = null;

    this.image.onload = () => {
      this.isImageLoaded = true;
    };
  }

  move() {
    if (!this.isSliced) {
      // Normal movement for unsliced fruit
      this.velocityY += this.gravity * this.weight;
      this.y += this.velocityY;
      this.x += this.velocityX;
      this.rotation += this.rotationSpeed;

      // Boundary check and bounce
      if (this.x < -this.size * 2) {
        this.x = -this.size * 2;
        this.velocityX *= -0.8;
      } else if (this.x > this.canvas.width + this.size) {
        this.x = this.canvas.width + this.size;
        this.velocityX *= -0.8;
      }
    } else {
      // Movement for sliced pieces
      this.slicedPieces.left.velocityY += this.gravity * this.weight;
      this.slicedPieces.right.velocityY += this.gravity * this.weight;
      
      this.slicedPieces.left.x += this.slicedPieces.left.velocityX;
      this.slicedPieces.left.y += this.slicedPieces.left.velocityY;
      this.slicedPieces.left.rotation += this.slicedPieces.left.rotationSpeed;
      
      this.slicedPieces.right.x += this.slicedPieces.right.velocityX;
      this.slicedPieces.right.y += this.slicedPieces.right.velocityY;
      this.slicedPieces.right.rotation += this.slicedPieces.right.rotationSpeed;
    }
  }

  draw() {
    if (!this.isSliced) {
      // Draw normal fruit
      if (this.isImageLoaded) {
        this.ctx.save();
        this.ctx.translate(this.x + this.size/2, this.y + this.size/2);
        this.ctx.rotate(this.rotation);
        this.ctx.drawImage(this.image, -this.size/2, -this.size/2, this.size, this.size);
        this.ctx.restore();
      }

      // Draw hitbox circle
      this.ctx.beginPath();
      this.ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    } else {
      // Draw sliced pieces
      if (this.isImageLoaded) {
        // Draw left half
        this.ctx.save();
        this.ctx.translate(this.slicedPieces.left.x + this.size/4, this.slicedPieces.left.y + this.size/2);
        this.ctx.rotate(this.slicedPieces.left.rotation);
        this.ctx.drawImage(this.image, 0, 0, this.image.width/2, this.image.height, 
                          -this.size/4, -this.size/2, this.size/2, this.size);
        this.ctx.restore();

        // Draw right half
        this.ctx.save();
        this.ctx.translate(this.slicedPieces.right.x + this.size/4, this.slicedPieces.right.y + this.size/2);
        this.ctx.rotate(this.slicedPieces.right.rotation);
        this.ctx.drawImage(this.image, this.image.width/2, 0, this.image.width/2, this.image.height, 
                          -this.size/4, -this.size/2, this.size/2, this.size);
        this.ctx.restore();
      }
    }
  }

  slice(mx, my) {
    if (this.isSliced) return false;
    
    const centerX = this.x + this.size / 2;
    const centerY = this.y + this.size / 2;
    const distance = Math.sqrt(Math.pow(mx - centerX, 2) + Math.pow(my - centerY, 2));
    
    if (distance <= this.size / 2) {
      this.isSliced = true;
      this.createSlicedPieces();
      return true;
    }
    return false;
  }

  createSlicedPieces() {
    this.slicedPieces = {
      left: {
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        velocityX: this.velocityX - 2,
        velocityY: this.velocityY,
        rotationSpeed: -0.1
      },
      right: {
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        velocityX: this.velocityX + 2,
        velocityY: this.velocityY,
        rotationSpeed: 0.1
      }
    };
  }

  isOffScreen() {
    if (!this.isSliced) {
      return this.y > window.innerHeight + 100;
    } else {
      return this.slicedPieces.left.y > window.innerHeight + 100 && this.slicedPieces.right.y > window.innerHeight + 100;
    }
  }

  static spawn(canvas, ctx, count = 1) {
    const fruits = [];
    for (let i = 0; i < count; i++) {
      const fruit = new Fruit(canvas, ctx);

      // Physics properties
      fruit.weight = 0.5;
      fruit.gravity = 1;
      fruit.velocityY = -20;
      const velocityXValue = 1;
      const velocityXMultiplier = 7;
      
      // Update velocities based on spawn side
      if (fruit.spawnSide === 'left') {
        fruit.velocityX = velocityXValue + Math.random() * velocityXMultiplier;
      } else {
        fruit.velocityX = -(velocityXValue + Math.random() * velocityXMultiplier);
      }
      
      // Add variation for multiple fruits
      if (count > 1) {
        fruit.y += (Math.random() - 0.5) * 100;
        fruit.velocityY += (Math.random() - 0.5) * 5;
      }
      
      fruits.push(fruit);
    }
    return fruits;
  }
}

export default Fruit;
