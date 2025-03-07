class Health {
  constructor(initialHealth = 5) {
    this.container = document.getElementById('health');
    this.maxHealth = initialHealth;
    this.currentHealth = initialHealth;
    this.hearts = [];
    this.scoreElement = document.getElementById('score');
    this.init();
  }

  init() {
    // this.container.className = 'absolute top-2.5 right-2.5 flex gap-2';
    
    // Create hearts
    for (let i = 0; i < this.maxHealth; i++) {
      const heart = document.createElement('div');
      heart.className = 'size-6 rounded-full bg-red-500 transition-all duration-300';
      this.hearts.push(heart);
      this.container.appendChild(heart);
    }
  }

  decrease() {
    if (this.currentHealth > 0) {
      this.currentHealth--;
      this.hearts[this.currentHealth].className = 
        'size-6 rounded-full bg-gray-400 transition-all duration-300';
      
      if (this.currentHealth === 0) {
        this.onGameOver();
      }
    }
  }

  increase() {
    if (this.currentHealth < this.maxHealth) {
      this.hearts[this.currentHealth].className = 
        'size-6 rounded-full bg-red-500 transition-all duration-300';
      this.currentHealth++;
    }
  }

  onGameOver() {
    // Get current score from the score element
    const currentScore = parseInt(this.scoreElement.textContent.split(': ')[1]);
    // alert('Game Over! Your score: ' + currentScore);
    
    // Reset game
    this.reset();
    this.scoreElement.textContent = 'Score: 0';
    // fruits = [];
  }

  reset() {
    this.currentHealth = this.maxHealth;
    this.hearts.forEach(heart => {
      heart.className = 'size-6 rounded-full bg-red-500 transition-all duration-300';
    });
  }
}

export default Health;
