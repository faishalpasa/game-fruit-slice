import React, { useRef, useEffect, useState } from 'react'

// Fruit class untuk merepresentasikan buah
class Fruit {
  x: number
  y: number
  size: number
  speed: number
  image: HTMLImageElement
  isImageLoaded: boolean = false
  id: string

  constructor() {
    this.id = Math.random().toString(36).substring(2, 15)
    this.size = Math.random() * 30 + 30 // Ukuran buah acak
    this.speed = Math.random() * 10 + 2 // Kecepatan turun acak
    this.x = Math.random() * window.innerWidth - this.size
    this.y = window.innerHeight + 50 // Mulai di bawah layar

    this.image = new Image()
    this.image.src = 'https://placehold.co/50' // Ganti dengan placeholder image
    this.image.onload = () => {
      this.isImageLoaded = true // Tandai gambar telah dimuat
    }
  }

  // Gerakkan buah ke atas
  move() {
    this.y -= this.speed
  }

  // Gambar buah
  draw(ctx: CanvasRenderingContext2D) {
    if (this.isImageLoaded) {
      ctx.drawImage(this.image, this.x, this.y, this.size, this.size)
    }

    // Gambar lingkaran merah di sekitar buah
    ctx.beginPath()
    ctx.arc(
      this.x + this.size / 2,
      this.y + this.size / 2,
      this.size / 2,
      0,
      Math.PI * 2
    )
    ctx.strokeStyle = 'red' // Warna merah
    ctx.lineWidth = 3 // Lebar garis
    ctx.stroke()
  }

  // Cek apakah buah terpotong
  isSliced(mx: number, my: number): boolean {
    const centerX = this.x + this.size / 2
    const centerY = this.y + this.size / 2

    const distance = Math.sqrt(
      Math.pow(mx - centerX, 2) + Math.pow(my - centerY, 2)
    )

    return distance <= this.size / 2
  }
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [score, setScore] = useState(0)
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth)
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight)
  const [swipePoints, setSwipePoints] = useState<
    Array<{ x: number; y: number; timestamp: number }>
  >([])

  // Fungsi untuk menyesuaikan ukuran canvas berdasarkan perangkat
  const adjustCanvasSize = () => {
    if (window.innerWidth <= 720) {
      setCanvasWidth(window.innerWidth)
      setCanvasHeight(window.innerHeight)
    } else {
      setCanvasWidth(720)
      setCanvasHeight(window.innerHeight)
    }
  }

  // Fungsi untuk menambahkan buah baru
  const spawnFruit = () => {
    setFruits((prev) => [...prev, new Fruit()])
  }

  // Fungsi deteksi apakah buah terpotong
  const detectSlicedFruit = (mx: number, my: number) => {
    setFruits((prevFruits) => {
      return prevFruits.filter((fruit) => {
        if (fruit.isSliced(mx, my)) {
          setScore((prevScore) => prevScore + 10)
          return false // Hapus buah yang terpotong
        }
        return true
      })
    })
  }

  // Handler untuk klik mouse
  const handleMouseClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const mx = e.nativeEvent.offsetX
    const my = e.nativeEvent.offsetY
    detectSlicedFruit(mx, my)
  }

  // Handler untuk touch di perangkat mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Menambahkan titik awal ke swipePoints
    const newPoint = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      timestamp: Date.now()
    }

    setSwipePoints((prevPoints) => [...prevPoints, newPoint])
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const newPoint = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      timestamp: Date.now()
    }

    // Menambahkan titik baru ke swipePoints
    setSwipePoints((prevPoints) => [...prevPoints, newPoint])
    detectSlicedFruit(newPoint.x, newPoint.y)
  }

  // Fungsi untuk memperbarui animasi dan gerakkan buah
  const updateFruits = () => {
    setFruits((prevFruits) => {
      const newFruits = prevFruits.map((fruit) => {
        fruit.move()
        return fruit
      })
      return newFruits.filter((fruit) => fruit.y > -fruit.size)
    })
  }

  // Fungsi untuk memperbarui animasi
  const update = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height) // Hapus layar setiap frame

    // Gambar semua buah
    fruits.forEach((fruit) => {
      fruit.draw(ctx)
    })

    // Gambar titik-titik swipe yang menghilang perlahan
    setSwipePoints((prevPoints) => {
      return prevPoints.filter((point) => Date.now() - point.timestamp <= 100) // Hapus titik setelah 0.5 detik
    })

    // Gambar titik-titik dengan opasitas yang berkurang
    swipePoints.forEach((point) => {
      const elapsed = Date.now() - point.timestamp
      const opacity = Math.max(0, 1 - elapsed / 500) // Menghitung opasitas berdasarkan waktu
      ctx.beginPath()
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`
      ctx.fill()
    })

    requestAnimationFrame(update) // Panggil update setiap frame
  }

  // Hook untuk menyesuaikan ukuran canvas saat ukuran layar berubah
  useEffect(() => {
    adjustCanvasSize()
    window.addEventListener('resize', adjustCanvasSize)
    return () => {
      window.removeEventListener('resize', adjustCanvasSize)
    }
  }, [])

  // Menambahkan buah baru setiap 2 detik
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      spawnFruit() // Tambahkan buah baru setiap 2 detik
    }, 1000)

    return () => clearInterval(spawnInterval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      updateFruits() // Update buah setiap 100ms
    }, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    update() // Mulai permainan
  }, [fruits]) // Hanya panggil update saat fruits berubah

  return (
    <div className="overflow-none">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleMouseClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="border-2 border-black mx-auto block touch-none"
      />
      <div className="absolute top-2 left-2 text-black text-2xl z-10">
        Score: {score}
      </div>
    </div>
  )
}

export default App
