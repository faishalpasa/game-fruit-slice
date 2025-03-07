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
let swipePoints = [];
let animationFrameId;

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
  const mx1 = e.touches[0].clientX;
  const my1 = e.touches[0].clientY;
  const mx2 = e.touches[1]?.clientX;
  const my2 = e.touches[1]?.clientY;

  const touches = [{ x: mx1, y: my1 }];

  if (mx2 && my2) {
    touches.push({ x: mx2, y: my2 });
  }

  detectSlicedFruit(touches);
});

canvas.addEventListener('touchmove', (e) => {
  const mx1 = e.touches[0].clientX;
  const my1 = e.touches[0].clientY;
  const mx2 = e.touches[1]?.clientX;
  const my2 = e.touches[1]?.clientY;

  const touches = [{ x: mx1, y: my1 }];
  const points = [];
  const newPoint1 = {
    x: mx1,
    y: my1,
    timestamp: Date.now(),
  };
  points.push(newPoint1);

  if (mx2 && my2) {
    touches.push({ x: mx2, y: my2 });
    const newPoint2 = {
      x: mx2,
      y: my2,
      timestamp: Date.now(),
    };
    points.push(newPoint2);
  }

  // Menambahkan titik baru ke swipePoints

  if (points.length) {
    swipePoints.push(...points);
  }

  detectSlicedFruit(touches);
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
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Hapus layar setiap frame

  // Gambar semua buah
  fruits.forEach(fruit => {
    fruit.draw();
  });

  // Gambar titik-titik swipe yang menghilang perlahan
  swipePoints = swipePoints.filter(point => Date.now() - point.timestamp <= 500); // Hapus titik setelah 0.5 detik

  // Gambar titik-titik dengan opasitas yang berkurang
  swipePoints.forEach(point => {
    const elapsed = Date.now() - point.timestamp;
    const opacity = Math.max(0, 1 - elapsed / 500); // Menghitung opasitas berdasarkan waktu
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
    ctx.fill();
  });

  animationFrameId = requestAnimationFrame(update); // Panggil update setiap frame
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
