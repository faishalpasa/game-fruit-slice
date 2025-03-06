const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Fruit class untuk merepresentasikan buah
class Fruit {
  constructor() {
    this.id = Math.random().toString(36).substring(2, 15);
    this.size = Math.random() * 30 + 30; // Ukuran buah acak
    this.speed = Math.random() * 5 + 2; // Kecepatan turun acak
    this.x = Math.random() * window.innerWidth - this.size;
    this.y = window.innerHeight + 50; // Mulai di bawah layar
    this.image = new Image();
    this.image.src = 'https://placehold.co/50'; // Ganti dengan gambar buah yang diinginkan
    this.isImageLoaded = false;

    this.image.onload = () => {
      this.isImageLoaded = true;
    };
  }

  // Gerakkan buah ke atas
  move() {
    this.y -= this.speed;
  }

  // Gambar buah
  draw() {
    if (this.isImageLoaded) {
      ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }

    // Gambar lingkaran merah di sekitar buah
    ctx.beginPath();
    ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'red'; // Warna merah
    ctx.lineWidth = 3; // Lebar garis
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
function spawnFruit() {
  fruits.push(new Fruit());
}

// Fungsi deteksi apakah buah terpotong
function detectSlicedFruit(mx, my) {
  fruits = fruits.filter(fruit => {
    if (fruit.isSliced(mx, my)) {
      score += 10;
      return false; // Hapus buah yang terpotong
    }
    return true;
  });
  scoreElement.textContent = `Score: ${score}`;
}

// Handler untuk klik mouse
canvas.addEventListener('click', (e) => {
  const mx = e.offsetX;
  const my = e.offsetY;
  detectSlicedFruit(mx, my);
});

// Handler untuk touch di perangkat mobile
canvas.addEventListener('touchstart', (e) => {
  const mx = e.touches[0].clientX;
  const my = e.touches[0].clientY;
  detectSlicedFruit(mx, my);
});

canvas.addEventListener('touchmove', (e) => {
  const mx = e.touches[0].clientX;
  const my = e.touches[0].clientY;

  // Menambahkan titik baru ke swipePoints
  const newPoint = {
    x: mx,
    y: my,
    timestamp: Date.now(),
  };

  if (swipePoints.length < 50) {
    swipePoints.push(newPoint);
  }

  detectSlicedFruit(mx, my);
});

// Fungsi untuk memperbarui animasi dan gerakkan buah
function updateFruits() {
  fruits = fruits.map(fruit => {
    fruit.move();
    return fruit;
  });
  fruits = fruits.filter(fruit => fruit.y > -fruit.size); // Hapus buah yang sudah di luar layar
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

// Menambahkan buah baru setiap 2 detik
setInterval(() => {
  spawnFruit(); // Tambahkan buah baru setiap 1 detik
}, 1000);

// Update buah setiap 25ms
setInterval(() => {
  updateFruits(); // Update posisi buah
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
