"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, User, Lock, Wine, Crown } from "lucide-react"
import Image from "next/image"

interface LoginProps {
  onLogin: (username: string, password: string) => void
  onRegister: (username: string, password: string) => void
  isLoading: boolean
  error: string | null
}

export default function Login({ onLogin, onRegister, isLoading, error }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLogin) {
      onLogin(username, password)
    } else {
      if (password !== confirmPassword) {
        return
      }
      onRegister(username, password)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setUsername("")
    setPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="min-h-screen game-container flex items-center justify-center p-4 relative">
      {/* Retro Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Login Card */}
      <Card className="w-full max-w-lg bg-gradient-to-br from-amber-900/95 to-amber-800/95 border-4 border-amber-600 shadow-2xl relative overflow-hidden">
        {/* Decorative Border */}
        <div className="absolute inset-0 border-2 border-amber-400/30 rounded-lg"></div>
        
        {/* Header with Retro Styling */}
        <CardHeader className="text-center relative pb-6">
          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 flex space-x-2">
            <Wine className="h-5 w-5 text-amber-300 animate-pulse" />
            <Crown className="h-5 w-5 text-amber-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute top-4 right-4 flex space-x-2">
            <Crown className="h-5 w-5 text-amber-300 animate-pulse" style={{ animationDelay: '1s' }} />
            <Wine className="h-5 w-5 text-amber-300 animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
          
          {/* Game Logo and Title */}
          <div className="mb-4 flex flex-col items-center">
            <div className="relative mb-3">
              <Image
                src="/logo.svg"
                alt="The Drunken Monkey Logo"
                width={100}
                height={100}
                className="drop-shadow-lg filter brightness-110 contrast-110"
                priority
              />
              {/* Glow effect around logo */}
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl -z-10"></div>
            </div>
            <h1 className="text-xl font-bold text-amber-200 font-mono tracking-widest mb-2">
              THE DRUNKEN MONKEY
            </h1>
            <div className="w-24 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-amber-100 mb-2 font-mono tracking-wider">
            {isLogin ? "TAVERN ENTRANCE" : "JOIN THE TAVERN"}
          </CardTitle>
          <CardDescription className="text-amber-200 text-base font-mono">
            {isLogin 
              ? "Enter the tavern to continue your drunken adventure" 
              : "Create your legend and begin the tavern crawl"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-3">
              <Label htmlFor="username" className="text-amber-100 text-lg font-mono font-bold">
                TAVERN ALIAS
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-4 h-5 w-5 text-amber-300" />
                <Input
                  id="username"
                  type="text"
                  placeholder="What do they call you in the tavern?"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 pr-4 py-4 bg-amber-800/80 border-2 border-amber-600 text-amber-100 placeholder-amber-300 font-mono text-lg rounded-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-amber-100 text-lg font-mono font-bold">
                TAVERN PASSWORD
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-amber-300" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="The secret word to enter..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 py-4 bg-amber-800/80 border-2 border-amber-600 text-amber-100 placeholder-amber-300 font-mono text-lg rounded-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-10 w-10 p-0 hover:bg-amber-700/50 text-amber-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password Field (Register only) */}
            {!isLogin && (
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-amber-100 text-lg font-mono font-bold">
                  CONFIRM PASSWORD
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-amber-300" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat the secret word..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 pr-12 py-4 bg-amber-800/80 border-2 border-amber-600 text-amber-100 placeholder-amber-300 font-mono text-lg rounded-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-10 w-10 p-0 hover:bg-amber-700/50 text-amber-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-sm font-mono">⚠️ Passwords do not match!</p>
                )}
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-900/30 border-2 border-red-600 rounded-none">
                <AlertDescription className="text-red-200 font-mono text-center">
                  ⚠️ {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-100 font-mono font-bold text-xl py-4 border-2 border-amber-500 rounded-none shadow-lg transform hover:scale-105 transition-all duration-200"
              disabled={isLoading || (!isLogin && password !== confirmPassword)}
            >
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-100"></div>
                  <span>ENTERING TAVERN...</span>
                </div>
              ) : (
                isLogin ? "ENTER TAVERN" : "JOIN THE CRAWL"
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <p className="text-amber-200 font-mono text-lg mb-2">
              {isLogin ? "New to the tavern?" : "Already a regular?"}
            </p>
            <Button
              variant="link"
              onClick={toggleMode}
              className="text-amber-300 hover:text-amber-100 p-0 h-auto font-mono text-lg underline decoration-amber-400 hover:decoration-amber-200"
            >
              {isLogin ? "Join the tavern" : "Back to entrance"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
