"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, User, Lock } from "lucide-react"

interface LoginProps {
  onLogin: (username: string) => void
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
      onLogin(username)
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
    setError("")
  }

  return (
    <div className="min-h-screen game-container flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/90 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Iniciar Sesión" : "Registrarse"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {isLogin 
              ? "Ingresa a tu cuenta para continuar tu aventura" 
              : "Crea una nueva cuenta para comenzar tu aventura"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-sm">Las contraseñas no coinciden</p>
                )}
              </div>
            )}

            {error && (
              <Alert className="bg-red-900/20 border-red-500">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || (!isLogin && password !== confirmPassword)}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                isLogin ? "Iniciar Sesión" : "Registrarse"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            </p>
            <Button
              variant="link"
              onClick={toggleMode}
              className="text-blue-400 hover:text-blue-300 p-0 h-auto"
            >
              {isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
