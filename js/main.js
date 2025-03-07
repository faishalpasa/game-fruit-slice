import Fruit from './fruit.js';
import Health from './health.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

let fruits = [];
let score = 0;
let trails = [];
const TRAIL_LENGTH = 20;
const TRAIL_SPACING = 5;
const FADE_TIMEOUT = 100;
let health;
let animationFrameId;

function adjustCanvasSize() {
  if (window.innerWidth <= 720) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    canvas.width = 720;
    canvas.height = window.innerHeight;
  }
}

function detectSlicedFruit(touches) {
  fruits = fruits.filter(fruit => {
    for (const touch of touches) {
      if (!fruit.isSliced && fruit.slice(touch.x, touch.y)) {
        score += fruit.score;
        scoreElement.textContent = `Score: ${score}`;
        return true; // Keep the fruit to show slicing animation
      }
    }
    return !fruit.isSliced || (fruit.isSliced && !fruit.isOffScreen());
  });
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

function updateFruits() {
  fruits.forEach(fruit => fruit.move());
  
  fruits = fruits.filter(fruit => {
    if (fruit.isOffScreen()) {
      // Only decrease health if fruit wasn't sliced
      if (!fruit.isSliced) {
        health.decrease();
      }
      return false;
    }
    return true;
  });
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  fruits.forEach(fruit => fruit.draw());
  
  trails.forEach(trail => {
    drawTrail(trail);
  });

  animationFrameId = requestAnimationFrame(update);
}

// Spawn fruits
setInterval(() => {
  // const fruitCount = Math.floor(Math.random() * 3) + 1;
  const fruitCount = 1;
  const newFruits = Fruit.spawn(canvas, ctx, fruitCount);
  fruits.push(...newFruits);
}, 1000);

// Update fruits
setInterval(() => {
  updateFruits();
}, 25);

// Start game
adjustCanvasSize();
health = new Health();
update();

window.addEventListener('resize', adjustCanvasSize);
window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(animationFrameId);
});

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
