import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Check, X } from 'lucide-react'
import type React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/auth-context'
import { usePasswordChangeMutation } from '@/lib/auth/auth-queries'

interface PasswordRequirement {
  text: string
  met: boolean
}

const ResetPasswordForm = () => {
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [email, setEmail] = useState('')
  const [campoFocado, setCampoFocado] = useState<string | null>(null)
  const [contexto, setContexto] = useState<'password_reset' | 'password_recovery' | 'password_expired'>('password_reset')
  const navigate = useNavigate()

  const { estaAutenticado } = useAuth()
  const passwordChangeMutation = usePasswordChangeMutation()
  const { isPending: carregando, error, reset: limparErro } = passwordChangeMutation
  const erro = error?.message ?? null

  const requisitosSenha: PasswordRequirement[] = [
    { text: 'Pelo menos 10 caracteres', met: novaSenha.length >= 10 },
    { text: 'Pelo menos uma letra maiúscula', met: /[A-Z]/.test(novaSenha) },
    { text: 'Pelo menos uma letra minúscula', met: /[a-z]/.test(novaSenha) },
    { text: 'Pelo menos um número', met: /[0-9]/.test(novaSenha) },
    {
      text: 'Pelo menos um caractere especial',
      met: /[^a-zA-Z0-9]/.test(novaSenha),
    },
    {
      text: 'Senhas coincidem',
      met: novaSenha === confirmarSenha && novaSenha.length > 0,
    },
  ]

  const senhaValida = requisitosSenha.every((req) => req.met)

  useEffect(() => {
    // Redireciona se já estiver autenticado
    if (estaAutenticado) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') ?? '/'
      sessionStorage.removeItem('redirectAfterLogin')
      navigate(redirectPath, { replace: true })
      return
    }

    // Se mostrou sucesso, não valida mais contexto (aguardando autenticação)
    if (sucesso) {
      return
    }

    // Verifica se veio do fluxo de recuperação ou senha expirada
    const contextoArmazenado = sessionStorage.getItem('auth_context')
    if (contextoArmazenado !== 'password_reset' && contextoArmazenado !== 'password_recovery' && contextoArmazenado !== 'password_expired') {
      navigate('/login')
      return
    }

    // Define o contexto no estado
    if (contextoArmazenado === 'password_expired' || contextoArmazenado === 'password_recovery') {
      setContexto(contextoArmazenado)
    }

    // Obtém email da sessão
    const emailArmazenado = sessionStorage.getItem('auth_email')
    if (emailArmazenado) {
      setEmail(emailArmazenado)
    } else {
      // Se não houver email, redirecionar para login
      navigate('/login')
    }
  }, [navigate, estaAutenticado, sucesso])

  const handleSubmitAsync = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!senhaValida) {
      return
    }

    limparErro()
    setSucesso('')

    // Obtém token de troca de senha
    const tokenTrocaSenha = sessionStorage.getItem('tokenTrocaSenha')

    // Executa troca de senha
    try {
      await passwordChangeMutation.mutateAsync({
        email,
        novaSenha,
        tokenTrocaSenha: tokenTrocaSenha ?? undefined,
        sistemaId: import.meta.env.VITE_SYSTEM_ID as string,
      })

      setSucesso('Senha alterada com sucesso! Redirecionando...')

      // Limpar contexto de recuperação
      sessionStorage.removeItem('auth_context')
      sessionStorage.removeItem('tokenTrocaSenha')
      sessionStorage.removeItem('auth_email')

      // Auto-login: tokens já foram salvos pela mutation
      // O useEffect detectará estaAutenticado e redirecionará automaticamente
      // quando o estado de auth for atualizado pela polling do AuthContext
    } catch {
      // Erro já capturado pelo mutation
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

  const requirementVariants = {
    unmet: {
      x: 0,
      color: '#6b7280',
    },
    met: {
      x: [0, -5, 0],
      color: '#059669',
      transition: { duration: 0.3 },
    },
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

  const medidorForca = () => {
    const requisitosAtendidos = requisitosSenha.filter((req) => req.met).length
    const porcentagem = (requisitosAtendidos / requisitosSenha.length) * 100

    let cor = '#ef4444' // vermelho
    if (porcentagem >= 80)
      cor = '#10b981' // verde
    else if (porcentagem >= 60)
      cor = '#f59e0b' // amarelo
    else if (porcentagem >= 40) cor = '#f97316' // laranja

    return { porcentagem, cor }
  }

  const { porcentagem, cor } = medidorForca()

  return (
    <div className="flex min-h-screen">
      {/* Left side - Background Image */}
      <motion.div
        className="relative hidden lg:flex lg:w-1/2"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 z-10 bg-linear-to-r from-teal-600/20 to-transparent" />
        <img
          src="/gestao.svg"
          alt="Background de gestão"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </motion.div>

      {/* Right side - Reset Password Form */}
      <motion.div
        className="flex w-full items-center justify-center bg-gray-50 p-8 lg:w-1/2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <motion.div className="text-center">
            <motion.div
              className="mb-8 flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {/* <img
                src="/logo certa.png"
                alt="Logo CAC"
                className="h-16 w-16 object-contain"
              /> */}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <Card className="border-0 shadow-lg transition-shadow duration-300 hover:shadow-xl">
              <CardHeader className="pb-4 text-center">
                <motion.div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                >
                  <Lock className="h-8 w-8 text-teal-600" />
                </motion.div>
                <motion.h1 className="text-2xl font-bold text-gray-900">
                  {contexto === 'password_expired' ? 'Senha Expirada' : 'Redefinir Senha'}
                </motion.h1>
                <motion.p className="text-sm text-gray-600">
                  {contexto === 'password_expired'
                    ? 'Sua senha expirou. Crie uma nova senha segura para'
                    : 'Crie uma nova senha segura para'}
                  <br />
                  <span className="font-medium">{email}</span>
                </motion.p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Alerta informativo sobre senha expirada */}
                {contexto === 'password_expired' && (
                  <motion.div
                    className="rounded-lg bg-orange-50 border border-orange-200 p-3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-orange-800">
                      Sua senha expirou por motivos de segurança. Por favor, defina uma nova senha para continuar acessando o sistema.
                    </p>
                  </motion.div>
                )}

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

                  {sucesso && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert className="border-green-200 bg-green-50">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5 }}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </motion.div>
                        <AlertDescription className="text-green-800">
                          {sucesso}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div className="space-y-2">
                    <Label htmlFor="novaSenha">Nova Senha</Label>
                    <motion.div
                      className="relative"
                      variants={inputVariants}
                      animate={
                        campoFocado === 'novaSenha' ? 'focused' : 'unfocused'
                      }
                    >
                      <Input
                        id="novaSenha"
                        type={mostrarNovaSenha ? 'text' : 'password'}
                        placeholder="Digite sua nova senha"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        onFocus={() => setCampoFocado('novaSenha')}
                        onBlur={() => setCampoFocado(null)}
                        required
                        className={`h-12 pr-10 transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 ${!mostrarNovaSenha && novaSenha ? 'tracking-widest' : ''}`}
                      />
                      <motion.button
                        type="button"
                        className="absolute top-1/2 right-3 -translate-y-1/2 transform"
                        onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {mostrarNovaSenha ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </motion.button>
                    </motion.div>

                    {/* Password Strength Meter */}
                    {novaSenha && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2"
                      >
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <motion.div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ backgroundColor: cor }}
                            animate={{ width: `${porcentagem}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                    <motion.div
                      className="relative"
                      variants={inputVariants}
                      animate={
                        campoFocado === 'confirmarSenha'
                          ? 'focused'
                          : 'unfocused'
                      }
                    >
                      <Input
                        id="confirmarSenha"
                        type={mostrarConfirmarSenha ? 'text' : 'password'}
                        placeholder="Confirme sua nova senha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        onFocus={() => setCampoFocado('confirmarSenha')}
                        onBlur={() => setCampoFocado(null)}
                        required
                        className={`h-12 pr-10 transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 ${!mostrarConfirmarSenha && confirmarSenha ? 'tracking-widest' : ''}`}
                      />
                      <motion.button
                        type="button"
                        className="absolute top-1/2 right-3 -translate-y-1/2 transform"
                        onClick={() =>
                          setMostrarConfirmarSenha(!mostrarConfirmarSenha)
                        }
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {mostrarConfirmarSenha ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </motion.button>
                    </motion.div>
                  </motion.div>

                  {/* Password Requirements */}
                  <motion.div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Requisitos da senha:
                    </Label>
                    <motion.div className="space-y-1">
                      <AnimatePresence>
                        {requisitosSenha.map((requisito) => (
                          <motion.div
                            key={requisito.text}
                            className="flex items-center space-x-2 text-sm"
                            variants={requirementVariants}
                            animate={requisito.met ? 'met' : 'unmet'}
                            layout
                          >
                            <motion.div
                              animate={{
                                scale: requisito.met ? [1, 1.3, 1] : 1,
                                rotate: requisito.met ? [0, 360] : 0,
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              {requisito.met ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-gray-400" />
                              )}
                            </motion.div>
                            <motion.span
                              className={
                                requisito.met
                                  ? 'text-green-700'
                                  : 'text-gray-600'
                              }
                              animate={{
                                fontWeight: requisito.met ? 600 : 400,
                              }}
                            >
                              {requisito.text}
                            </motion.span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>

                  <motion.div>
                    <motion.div
                      whileHover={{ scale: senhaValida ? 1.02 : 1 }}
                      whileTap={{ scale: senhaValida ? 0.98 : 1 }}
                    >
                      <Button
                        type="submit"
                        className="relative h-12 w-full overflow-hidden bg-teal-600 transition-all duration-300 hover:bg-teal-700"
                        disabled={carregando || !senhaValida}
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
                              Alterando Senha...
                            </motion.div>
                          ) : (
                            <motion.div
                              key="change"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center"
                            >
                              <Lock className="mr-2 h-4 w-4" />
                              Alterar Senha
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.form>

                <motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/login')}
                      className="w-full transition-all duration-200 hover:bg-gray-100"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar ao Login
                    </Button>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default ResetPasswordForm