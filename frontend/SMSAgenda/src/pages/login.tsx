import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import type React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/auth-context'
import { useLoginMutation } from '@/lib/auth/auth-queries'

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [campoFocado, setCampoFocado] = useState<string | null>(null)
  const navigate = useNavigate()

  const { estaAutenticado } = useAuth()
  const loginMutation = useLoginMutation()
  const { isPending: carregando, error, reset: limparErro } = loginMutation
  const erro = error?.message ?? null


  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (estaAutenticado) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') ?? '/'
      sessionStorage.removeItem('redirectAfterLogin')
      navigate(redirectPath, { replace: true })
    }
  }, [estaAutenticado, navigate])

  // Verifica se deve mostrar toast de logout bem-sucedido
  useEffect(() => {
    const shouldShowLogoutToast = sessionStorage.getItem('show_logout_success_toast')
    if (shouldShowLogoutToast === 'true') {
      // Remove flag imediatamente para não mostrar novamente
      sessionStorage.removeItem('show_logout_success_toast')
      // Mostra toast após um pequeno delay para garantir que a página carregou
      setTimeout(() => {
        toast.success('Logout realizado com sucesso!')
      }, 100)
    }
  }, [])

  const validarEmail = (emailValue: string): boolean => {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regexEmail.test(emailValue)
  }

  const validarSenha = (senhaValue: string): boolean => {
    return senhaValue.length >= 6
  }

  const handleSubmitAsync = async (e: React.FormEvent) => {
    e.preventDefault()
    limparErro()

    // Validação local
    if (!validarEmail(email)) {
      return
    }

    if (!validarSenha(senha)) {
      return
    }

    // Executa login
    try {
      await loginMutation.mutateAsync({ email, senha })

      // Salva email para próxima etapa (2FA)
      sessionStorage.setItem('auth_email', email)

      // Redireciona para verificação 2FA
      navigate('/auth/verificar-codigo', { replace: true })
    } catch (error) {
      // Se for erro de permissão, redireciona silenciosamente para registro
      if (error instanceof Error && (error as any).shouldRedirectToRegister) {
        sessionStorage.setItem('pending_register_email', email)
        navigate('/registrar', { replace: true })
        return
      }
      // Outros erros já são capturados pelo mutation
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    void handleSubmitAsync(e)
  }


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  }

  const inputVariants = {
    focused: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    unfocused: {
      scale: 1,
      transition: { duration: 0.2 },
    },
  }

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Left side - Background Image with parallax effect */}
      <motion.div
        className="relative hidden lg:flex lg:w-1/2"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-teal-600/20 to-transparent" />
        <img
          src="/gestao.svg"
          alt="Background de gestão"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Floating elements animation */}
        <motion.div
          className="absolute top-20 left-20 h-4 w-4 rounded-full bg-white/20"
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-32 left-32 h-6 w-6 rounded-full bg-white/15"
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </motion.div>

      {/* Right side - Login Form */}
      <motion.div
        className="flex w-full items-center justify-center bg-gray-50 p-8 lg:w-1/2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Logo with animation */}
          <motion.div className="text-center">
            <motion.div
              className="mb-8 flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {/* <img src="/logo.png" alt="Logo CAC" className="object-contain" /> */}
            </motion.div>
          </motion.div>

          <motion.div>
            <Card className="border-0 shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <CardHeader className="pb-4 text-center">
                <motion.h1 className="text-2xl font-bold text-gray-900">
                  Bem-Vindo(a)!
                </motion.h1>
                <motion.p className="text-sm text-gray-600">
                  Insira suas credenciais
                </motion.p>
              </CardHeader>

              <CardContent className="space-y-6">
                <AnimatePresence mode="wait">
                  {erro && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert
                        variant="destructive"
                        className="border-red-200 bg-red-50"
                      >
                        <AlertDescription className="leading-relaxed wrap-break-word text-red-800">
                          {erro}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <motion.div
                      variants={inputVariants}
                      animate={
                        campoFocado === 'email' ? 'focused' : 'unfocused'
                      }
                    >
                      <Input
                        id="email"
                        type="email"
                        placeholder="Digite seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setCampoFocado('email')}
                        onBlur={() => setCampoFocado(null)}
                        required
                        className="h-12 transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                      />
                    </motion.div>
                  </motion.div>

                  <motion.div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="senha">Senha</Label>
                      <motion.button
                        type="button"
                        className="cursor-pointer text-sm text-blue-600 transition-colors duration-200 hover:underline"
                        onClick={() => navigate('/auth/esqueci-senha')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Esqueceu a senha?
                      </motion.button>
                    </div>
                    <motion.div
                      className="relative"
                      variants={inputVariants}
                      animate={
                        campoFocado === 'senha' ? 'focused' : 'unfocused'
                      }
                    >
                      <Input
                        id="senha"
                        type={mostrarSenha ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        onFocus={() => setCampoFocado('senha')}
                        onBlur={() => setCampoFocado(null)}
                        required
                        className={`h-12 pr-10 transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 ${!mostrarSenha && senha ? 'tracking-widest' : ''}`}
                      />
                      <motion.button
                        type="button"
                        className="absolute top-1/2 right-3 -translate-y-1/2 transform"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.1 }}
                      >
                        <motion.div
                          animate={{ rotate: mostrarSenha ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {mostrarSenha ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </motion.div>
                      </motion.button>
                    </motion.div>
                  </motion.div>

                  <motion.div>
                    <motion.div
                      variants={buttonVariants}
                      initial="idle"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        type="submit"
                        className="relative h-12 w-full cursor-pointer overflow-hidden bg-[#008BA7] transition-all duration-300 hover:bg-[#008BA7]/80"
                        disabled={carregando}
                      >
                        <AnimatePresence mode="wait">
                          {carregando ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center"
                            >
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Entrando...
                            </motion.div>
                          ) : (
                            <motion.span
                              key="enter"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              Entrar
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Ripple effect */}
                        <motion.div
                          className="absolute inset-0 rounded-md bg-white/20"
                          initial={{ scale: 0, opacity: 0 }}
                          whileTap={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.form>
              </CardContent>
            </Card>

            {/* btn registrar */}
            <motion.div className="mt-6 text-center">
              <motion.p className="mb-3 text-sm text-gray-600">
                Ainda não tem uma conta?
              </motion.p>
              <motion.div
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  type="button"
                  onClick={() => navigate('/registrar')}
                  className="relative h-12 w-full cursor-pointer overflow-hidden border-2 border-[#008BA7] bg-transparent text-[#008BA7] transition-all duration-300 hover:bg-[#008BA7] hover:text-white"
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Criar uma conta
                  </motion.span>

                  {/* Ripple effect */}
                  <motion.div
                    className="absolute inset-0 rounded-md bg-[#008BA7]/10"
                    initial={{ scale: 0, opacity: 0 }}
                    whileTap={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </Button>
              </motion.div>
            </motion.div>

          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginForm
