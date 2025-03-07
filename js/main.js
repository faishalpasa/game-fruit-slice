const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Fruit class untuk merepresentasikan buah
class Fruit {
  constructor() {
    this.id = Math.random().toString(36).substring(2, 15);
    this.size = Math.random() * 75 + 75;
    this.score = 2;
    
    // Determine spawn side (left or right)
    this.spawnSide = Math.random() < 0.5 ? 'left' : 'right';
    
    // Set initial position based on spawn side
    if (this.spawnSide === 'left') {
      this.x = -this.size; // Start from left outside
      this.velocityX = 3 + Math.random() * 5; // Move right
      this.rotationSpeed = 0.05 + Math.random() * 0.05; // Clockwise rotation
    } else {
      this.x = canvas.width + this.size; // Start from right outside
      this.velocityX = -(3 + Math.random() * 5); // Move left
      this.rotationSpeed = -(0.05 + Math.random() * 0.05); // Counter-clockwise rotation
    }
    
    this.y = window.innerHeight + 50;
    this.image = new Image();
    this.image.src = 'https://placehold.co/50';
    this.isImageLoaded = false;
    
    // Physics properties
    // this.velocityY = (-15 - Math.random() * 10);
    this.velocityY = -35;
    this.gravity = 1;
    // this.weight = this.size / 50;
    this.weight = 1;
    this.rotation = 0;

    this.image.onload = () => {
      this.isImageLoaded = true;
    };
  }

  move() {
    // Apply physics
    this.velocityY += this.gravity * this.weight;
    this.y += this.velocityY;
    this.x += this.velocityX;
    this.rotation += this.rotationSpeed;

    // Boundary check and bounce
    if (this.x < -this.size * 2) {
      this.x = -this.size * 2;
      this.velocityX *= -0.8; // Bounce with reduced velocity
    } else if (this.x > canvas.width + this.size) {
      this.x = canvas.width + this.size;
      this.velocityX *= -0.8; // Bounce with reduced velocity
    }
  }

  draw() {
    if (this.isImageLoaded) {
      // Save current context state
      ctx.save();
      
      // Move to fruit's position and rotate
      ctx.translate(this.x + this.size/2, this.y + this.size/2);
      ctx.rotate(this.rotation);
      
      // Draw the image centered
      ctx.drawImage(this.image, -this.size/2, -this.size/2, this.size, this.size);
      
      // Restore context state
      ctx.restore();
    }

    // Draw hitbox circle
    ctx.beginPath();
    ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Cek apakah buah terpotong
  isSliced(mx, my) {
    const centerX = this.x + this.size / 2;
    const centerY = this.y + this.size / 2;
    const distance = Math.sqrt(Math.pow(mx - centerX, 2) + Math.pow(my - centerY, 2));
    return distance <= this.size / 2;
  }
}

let fruits = [];
let score = 0;
let currentSwipe = [];
let swipes = [];
let animationFrameId;
let swipeTrails = []; // Array to store multiple active trails
let lastPoints = {}; // Store last points for each touch
let trails = [];
const TRAIL_LENGTH = 20; // Number of points in each trail
const TRAIL_SPACING = 5; // Distance between trail points
const FADE_TIMEOUT = 100; // Time in ms before trail starts fading when finger is stationary

// Fungsi untuk menyesuaikan ukuran canvas berdasarkan perangkat
function adjustCanvasSize() {
  if (window.innerWidth <= 720) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    canvas.width = 720;
    canvas.height = window.innerHeight;
  }
}

// Fungsi untuk menambahkan buah baru
function spawnFruit(count = 1) {
  for (let i = 0; i < count; i++) {
    const fruit = new Fruit();

    // Physics properties
    fruit.weight = 0.5;
    fruit.gravity = 1;
    fruit.velocityY = -20;
    const velocityXValue = 1;
    const velocityXMultiplier = 7;
    
    // Randomly decide spawn side for each fruit
    const spawnFromLeft = Math.random() < 0.5;
    
    // Update initial position and velocities based on random spawn side
    if (spawnFromLeft) {
      fruit.x = -fruit.size;
      fruit.velocityX = velocityXValue + Math.random() * velocityXMultiplier;  
      fruit.rotationSpeed = 0.05 + Math.random() * 0.05;
    } else {
      fruit.x = canvas.width + fruit.size;
      fruit.velocityX = -(velocityXValue + Math.random() * velocityXMultiplier);
      fruit.rotationSpeed = -(0.05 + Math.random() * 0.05);
    }
    
    // Add slight variation to initial Y position and velocity for multiple fruits
    if (count > 1) {
      fruit.y += (Math.random() - 0.5) * 100; // Vary vertical position
      fruit.velocityY += (Math.random() - 0.5) * 5; // Vary initial upward velocity
    }
    
    fruits.push(fruit);
  }
}

// Fungsi deteksi apakah buah terpotong
function detectSlicedFruit(touches) {
  fruits = fruits.filter(fruit => {
    for (const touch of touches) {
      if (fruit.isSliced(touch.x, touch.y)) {
        score += fruit.score;
        return false; // Hapus buah yang terpotong
      }
    }
    return true;
  });
  scoreElement.textContent = `Score: ${score}`;
}

// Handler untuk klik mouse
canvas.addEventListener('click', (e) => {
  const mx = e.offsetX;
  const my = e.offsetY;

  const touches = [{ x: mx, y: my }];
  
  detectSlicedFruit(touches);
});

// Handler untuk touch di perangkat mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  
  for (let touch of e.changedTouches) {
    // Create new trail with initial points and last movement timestamp
    const points = Array(TRAIL_LENGTH).fill().map(() => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));
    
    trails.push({
      id: touch.identifier,
      points: points,
      lastMoveTime: Date.now(), // Track when the finger last moved
      lastX: touch.clientX,
      lastY: touch.clientY
    });
  }

  const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
  detectSlicedFruit(touches);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  
  for (let touch of e.changedTouches) {
    const trail = trails.find(t => t.id === touch.identifier);
    if (trail) {
      // Check if finger has moved significantly (more than 1 pixel)
      const dx = touch.clientX - trail.lastX;
      const dy = touch.clientY - trail.lastY;
      const hasMoved = Math.sqrt(dx * dx + dy * dy) > 1;

      if (hasMoved) {
        trail.lastMoveTime = Date.now();
        trail.lastX = touch.clientX;
        trail.lastY = touch.clientY;
        
        // Move first point to current touch position
        trail.points[0] = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };
        
        // Update rest of trail points to follow with spring effect
        for (let i = 1; i < trail.points.length; i++) {
          const dx = trail.points[i-1].x - trail.points[i].x;
          const dy = trail.points[i-1].y - trail.points[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > TRAIL_SPACING) {
            const angle = Math.atan2(dy, dx);
            trail.points[i] = {
              x: trail.points[i-1].x - Math.cos(angle) * TRAIL_SPACING,
              y: trail.points[i-1].y - Math.sin(angle) * TRAIL_SPACING,
              timestamp: Date.now()
            };
          }
        }
      }
    }
  }

  const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
  detectSlicedFruit(touches);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  
  // Remove trails for ended touches
  for (let touch of e.changedTouches) {
    const index = trails.findIndex(t => t.id === touch.identifier);
    if (index !== -1) {
      trails.splice(index, 1);
    }
  }
});

// Fungsi untuk memperbarui animasi dan gerakkan buah
function updateFruits() {
  fruits = fruits.map(fruit => {
    fruit.move();
    return fruit;
  });
  // Remove fruits that are below the screen with some buffer
  fruits = fruits.filter(fruit => fruit.y < window.innerHeight + 100);
}

// Fungsi untuk memperbarui animasi
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all fruits
  fruits.forEach(fruit => {
    fruit.draw();
  });

  // Draw active trails
  trails.forEach(trail => {
    drawTrail(trail);
  });

  animationFrameId = requestAnimationFrame(update);
}

// New function to draw the trailing effect
function drawTrail(trail) {
  const points = trail.points;
  if (points.length < 2) return;

  const timeSinceMove = Date.now() - trail.lastMoveTime;
  const fadeStart = FADE_TIMEOUT;
  const fadeDuration = 200; // Time to completely fade out
  
  // Calculate opacity based on time since last movement
  let opacity = 1;
  if (timeSinceMove > fadeStart) {
    opacity = Math.max(0, 1 - (timeSinceMove - fadeStart) / fadeDuration);
  }
  
  if (opacity === 0) return; // Don't draw if completely faded

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  // Draw curve through points
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i].x + points[i-1].x) / 2;
    const yc = (points[i].y + points[i-1].y) / 2;
    ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
  }

  // Create gradient for trail
  const gradient = ctx.createLinearGradient(
    points[0].x, points[0].y,
    points[points.length-1].x, points[points.length-1].y
  );
  gradient.addColorStop(0, `rgba(0, 255, 255, ${opacity})`);
  gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

  // Draw main trail
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Add glow effect
  ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
  ctx.lineWidth = 12;
  ctx.stroke();
}

// Update spawn interval to be more frequent
setInterval(() => {
  // Spawn 1-3 fruits randomly
  const fruitCount = Math.floor(Math.random() * 3) + 1;
  spawnFruit(fruitCount);
}, 1000);

// Update buah setiap 25ms
setInterval(() => {
  updateFruits();
}, 25);

// Mulai game loop
adjustCanvasSize();
update();

// Sesuaikan ukuran canvas ketika ukuran layar berubah
window.addEventListener('resize', adjustCanvasSize);

// Bersihkan interval dan animasi saat halaman ditutup
window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(animationFrameId);
});
