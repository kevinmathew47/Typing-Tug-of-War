"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface GameState {
  playerPosition: number // -100 to 100, 0 is center
  playerPower: number
  opponentPower: number
  gameActive: boolean
  winner: "player" | "opponent" | null
}

const SENTENCES_QUEUE = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "Bright vixens jump; dozy fowl quack",
  "Sphinx of black quartz judge my vow",
  "Waltz bad nymph for quick jigs vex",
  "Glib jocks quiz nymph to vex dwarf",
  "Jackdaws love my big sphinx of quartz",
  "The five boxing wizards jump quickly",
  "Quick zephyrs blow vexing daft Jim",
  "Two driven jocks help fax my big quiz",
  "Five quacking zephyrs jolt my wax bed",
  "The job requires extra pluck and zeal",
  "Quick brown dogs jump over the lazy fox",
  "Amazingly few discotheques provide jukeboxes",
]

export default function TugOfWarGame() {
  const [gameState, setGameState] = useState<GameState>({
    playerPosition: 0,
    playerPower: 0,
    opponentPower: 0,
    gameActive: false,
    winner: null,
  })

  const [currentText, setCurrentText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [wordsPerMinute, setWordsPerMinute] = useState(0)
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [totalCharsTyped, setTotalCharsTyped] = useState(0)
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [lastTypingTime, setLastTypingTime] = useState<number | null>(null)
  const [recentTypingSpeed, setRecentTypingSpeed] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const opponentTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Start new game
  const startGame = () => {
    setCurrentText(SENTENCES_QUEUE[0])
    setSentenceIndex(0)
    setUserInput("")
    setGameState({
      playerPosition: 0,
      playerPower: 0,
      opponentPower: 0,
      gameActive: true,
      winner: null,
    })
    setGameStartTime(Date.now())
    setLastTypingTime(Date.now())
    setTotalCharsTyped(0)
    setWordsPerMinute(0)
    setRecentTypingSpeed(0)

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100)

    // Start opponent AI
    startOpponentAI()
  }

  // Opponent AI that types at varying speeds
  const startOpponentAI = () => {
    opponentTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (!prev.gameActive) return prev

        const baseSpeed = 25 + Math.random() * 20 // 25-45 WPM
        const opponentPower = Math.min(100, baseSpeed * 2.2)

        return {
          ...prev,
          opponentPower,
        }
      })
    }, 800)
  }

  useEffect(() => {
    if (!gameState.gameActive || !gameStartTime || !lastTypingTime) return

    const now = Date.now()
    const totalTimeMinutes = (now - gameStartTime) / 1000 / 60
    const recentTimeMinutes = (now - lastTypingTime) / 1000 / 60

    const totalWords = totalCharsTyped / 5
    const overallWPM = totalTimeMinutes > 0 ? Math.round(totalWords / totalTimeMinutes) : 0

    const recentChars = userInput.length
    const recentWPM =
      recentTimeMinutes > 0 && recentTimeMinutes < 0.1 ? Math.min(120, recentChars / 5 / recentTimeMinutes) : 0

    setWordsPerMinute(overallWPM)
    setRecentTypingSpeed(recentWPM)

    const basePower = Math.min(100, overallWPM * 1.8)
    const recentBoost = Math.min(50, recentWPM * 0.5)
    const playerPower = Math.min(100, basePower + recentBoost)

    setGameState((prev) => {
      const powerDiff = playerPower - prev.opponentPower
      const positionChange = powerDiff * 0.08
      const newPosition = Math.max(-100, Math.min(100, prev.playerPosition + positionChange))

      let winner = null
      if (newPosition >= 95) winner = "player"
      else if (newPosition <= -95) winner = "opponent"

      if (winner) {
        endGame()
      }

      return {
        ...prev,
        playerPower,
        playerPosition: newPosition,
        winner,
      }
    })
  }, [userInput, totalCharsTyped, gameStartTime, lastTypingTime, gameState.gameActive])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!gameState.gameActive) return

    const value = e.target.value
    setUserInput(value)
    setLastTypingTime(Date.now())

    if (value === currentText) {
      const nextIndex = (sentenceIndex + 1) % SENTENCES_QUEUE.length
      setSentenceIndex(nextIndex)
      setCurrentText(SENTENCES_QUEUE[nextIndex])
      setTotalCharsTyped((prev) => prev + currentText.length)
      setUserInput("")
    }
  }

  const endGame = () => {
    setGameState((prev) => ({ ...prev, gameActive: false }))
    if (opponentTimerRef.current) clearInterval(opponentTimerRef.current)
  }

  useEffect(() => {
    return () => {
      if (opponentTimerRef.current) clearInterval(opponentTimerRef.current)
    }
  }, [])

  const ropeOffset = gameState.playerPosition

  const typingAccuracy =
    currentText.length > 0
      ? Math.round(
          (userInput.split("").filter((char, i) => char === currentText[i]).length / Math.max(userInput.length, 1)) *
            100,
        )
      : 100

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">⚔️ Typing Tug of War</h1>
          <p className="text-muted-foreground">Type fast and accurately to pull the ribbon across the finish line!</p>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{wordsPerMinute}</div>
            <div className="text-sm text-muted-foreground">Your WPM</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{typingAccuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{Math.round(gameState.opponentPower / 2.2)}</div>
            <div className="text-sm text-muted-foreground">Opponent WPM</div>
          </Card>
        </div>

        {/* Power Bars */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-primary font-medium">Your Power</span>
            <span className="text-secondary font-medium">Opponent Power</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Progress value={gameState.playerPower} className="h-3" />
            <Progress value={gameState.opponentPower} className="h-3" />
          </div>
        </div>

        {/* Tug of War Visual */}
        <Card className="p-8 bg-muted/20">
          <div className="relative h-32 flex items-center justify-center overflow-hidden">
            <div className="absolute left-8 w-1 h-20 bg-primary border-2 border-primary rounded"></div>
            <div className="absolute right-8 w-1 h-20 bg-secondary border-2 border-secondary rounded"></div>

            <div
              className="absolute left-12 text-4xl transition-all duration-300 animate-pulse"
              style={{
                transform: `translateX(${ropeOffset * 1.5}px) ${gameState.gameActive ? "rotate(-5deg)" : "rotate(0deg)"}`,
                animation: gameState.gameActive ? "pull 0.5s ease-in-out infinite alternate" : "none",
              }}
            >
              🧑‍💻
            </div>
            <div
              className="absolute right-12 text-4xl transition-all duration-300 animate-pulse"
              style={{
                transform: `translateX(${ropeOffset * 1.5}px) ${gameState.gameActive ? "rotate(5deg)" : "rotate(0deg)"}`,
                animation: gameState.gameActive ? "pull 0.5s ease-in-out infinite alternate-reverse" : "none",
              }}
            >
              🤖
            </div>

            <div className="flex items-center">
              <div className="w-16 h-2 bg-amber-600 rounded"></div>
              <div
                className="h-2 bg-amber-700 transition-all duration-300 relative rounded"
                style={{
                  width: `${200 + ropeOffset}px`,
                  transform: `translateX(${ropeOffset}px)`,
                }}
              >
                <div
                  className="absolute top-0 w-3 h-6 bg-red-500 border border-red-600 rounded-sm"
                  style={{
                    left: "50%",
                    transform: "translateX(-50%) translateY(-2px)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                ></div>
              </div>
              <div className="w-16 h-2 bg-amber-600 rounded"></div>
            </div>

            {/* Center line */}
            <div className="absolute w-0.5 h-24 bg-border opacity-50"></div>
          </div>

          {/* Position indicator */}
          <div className="mt-4 text-center">
            <div className="text-sm text-muted-foreground">
              {ropeOffset > 80
                ? "🎉 Almost there! Pull the ribbon across!"
                : ropeOffset < -80
                  ? "😰 Opponent is close to winning!"
                  : ropeOffset > 40
                    ? "💪 You're pulling ahead!"
                    : ropeOffset < -40
                      ? "⚡ Fight back! Type faster!"
                      : "🔥 Keep typing to gain power!"}
            </div>
          </div>
        </Card>

        {/* Typing Area */}
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Sentence {sentenceIndex + 1} of {SENTENCES_QUEUE.length}
            </span>
            <span>
              {userInput.length} / {currentText.length} characters
            </span>
          </div>

          <div className="text-lg font-mono leading-relaxed p-4 bg-muted/50 rounded-lg">
            {currentText.split("").map((char, index) => {
              let className = "text-muted-foreground"
              if (index < userInput.length) {
                className =
                  userInput[index] === char ? "text-primary bg-primary/10" : "text-destructive bg-destructive/10"
              } else if (index === userInput.length) {
                className = "text-foreground bg-accent/20 animate-pulse"
              }
              return (
                <span key={index} className={className}>
                  {char}
                </span>
              )
            })}
          </div>

          <Input
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            placeholder="Start typing here..."
            disabled={!gameState.gameActive}
            className="text-lg font-mono"
          />
        </Card>

        {/* Game Controls */}
        <div className="text-center space-y-4">
          {!gameState.gameActive && (
            <Button onClick={startGame} size="lg" className="text-lg px-8">
              {gameState.winner ? "Play Again" : "Start Game"}
            </Button>
          )}

          {gameState.winner && (
            <div className="text-2xl font-bold">
              {gameState.winner === "player" ? (
                <span className="text-primary">🎉 You Won! Ribbon crossed your line!</span>
              ) : (
                <span className="text-secondary">🤖 Opponent Won! Ribbon crossed their line!</span>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pull {
          0% { transform: translateX(${ropeOffset * 1.5}px) rotate(-5deg) scale(1); }
          100% { transform: translateX(${ropeOffset * 1.5}px) rotate(-8deg) scale(1.05); }
        }
      `}</style>
    </div>
  )
}
