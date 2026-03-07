import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail } from 'lucide-react'
import type React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/auth-context'
import { useRegisterMutation } from '@/lib/auth/auth-queries'
import { formatarCPF, limparCPF, validarCPF } from '@/utils/cpf-utils'


const RegisterForm = () => {
  const [email, setEmail] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [cpf, setCpf] = useState('')
  const [setor, setSetor] = useState('')
  const [campoFocado, setCampoFocado] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const navigate = useNavigate()

  const { estaAutenticado } = useAuth()
  const registerMutation = useRegisterMutation()
  const { isPending: carregando, error, reset: limparErro } = registerMutation
  const erro = error?.message ?? null

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (estaAutenticado) {
      navigate('/', { replace: true })
    }
  }, [estaAutenticado, navigate])

  // Preenche email se vier do login (usuário sem permissão)
  useEffect(() => {
    const pendingEmail = sessionStorage.getItem('pending_register_email')
    if (pendingEmail) {
      setEmail(pendingEmail)
      sessionStorage.removeItem('pending_register_email')
    }
  }, [])

  const validarEmail = (emailValue: string): boolean => {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regexEmail.test(emailValue)
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarCPF(e.target.value)
    setCpf(valorFormatado)
  }

  const handleSubmitAsync = async (e: React.FormEvent) => {
    e.preventDefault()
    limparErro()

    // Validação local
    if (!validarEmail(email)) {
      toast.error('Email inválido')
      return
    }

    if (!nomeCompleto.trim() || nomeCompleto.trim().length < 3) {
      toast.error('Nome completo deve ter pelo menos 3 caracteres')
      return
    }

    if (!validarCPF(cpf)) {
      toast.error('CPF inválido')
      return
    }

    if (!setor.trim()) {
      toast.error('Setor é obrigatório')
      return
    }

    // Executa registro
    try {
      const resultado = await registerMutation.mutateAsync({
        email,
        nomeCompleto: nomeCompleto.trim(),
        cpf: limparCPF(cpf),
        setor: setor.trim(),
      })

      // Salva informações para o dialog
      setUserEmail(email)
      setIsExistingUser(resultado?.dados?.isExistingUser || false)
      
      // Salva email para próxima etapa
      sessionStorage.setItem('auth_email', email)

      // Salva setor apenas se foi fornecido
      if (setor.trim()) {
        sessionStorage.setItem('pending_setor', setor.trim())
      }

      // Mostra dialog de sucesso
      setShowSuccessDialog(true)
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
                  Criar Conta
                </motion.h1>
                <motion.p className="text-sm text-gray-600">
                  Cadastre-se para usar a agenda
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
                    <Label htmlFor="nomeCompleto">Nome Completo</Label>
                    <motion.div
                      variants={inputVariants}
                      animate={
                        campoFocado === 'nomeCompleto' ? 'focused' : 'unfocused'
                      }
                    >
                      <Input
                        id="nomeCompleto"
                        type="text"
                        placeholder="Digite seu nome completo"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        onFocus={() => setCampoFocado('nomeCompleto')}
                        onBlur={() => setCampoFocado(null)}
                        required
                        className="h-12 transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                      />
                    </motion.div>
                  </motion.div>

                  <motion.div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <motion.div
                      variants={inputVariants}
                      animate={
                        campoFocado === 'cpf' ? 'focused' : 'unfocused'
                      }
                    >
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={handleCPFChange}
                        onFocus={() => setCampoFocado('cpf')}
                        onBlur={() => setCampoFocado(null)}
                        required
                        maxLength={14}
                        className="h-12 transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                      />
                    </motion.div>
                  </motion.div>

                  <motion.div className="space-y-2">
                    <Label htmlFor="setor">Setor</Label>
                    <motion.div
                      variants={inputVariants}
                      animate={
                        campoFocado === 'setor' ? 'focused' : 'unfocused'
                      }
                    >
                      <Input
                        id="setor"
                        type="text"
                        placeholder="Digite seu setor"
                        value={setor}
                        onChange={(e) => setSetor(e.target.value)}
                        onFocus={() => setCampoFocado('setor')}
                        onBlur={() => setCampoFocado(null)}
                        required
                        className="h-12 transition-all duration-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                      />
                    </motion.div>
                  </motion.div>

                  {/* Informação sobre senha temporária */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Alert className="border-blue-200 bg-blue-50">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="leading-relaxed text-blue-800">
                        Uma senha temporária será enviada para o seu email após o cadastro.
                        Use-a para fazer o primeiro login e você será solicitado a criar uma nova senha.
                      </AlertDescription>
                    </Alert>
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
                              Cadastrando...
                            </motion.div>
                          ) : (
                            <motion.span
                              key="register"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              Criar Conta
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

            {/* btn voltar ao login */}
            <motion.div className="mt-6 text-center">
              <motion.p className="mb-3 text-sm text-gray-600">
                Já possui uma conta?
              </motion.p>
              <motion.div
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="relative h-12 w-full cursor-pointer overflow-hidden border-2 border-[#008BA7] bg-transparent text-[#008BA7] transition-all duration-300 hover:bg-[#008BA7] hover:text-white"
                  disabled={carregando}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Fazer Login
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

      {/* Dialog de Sucesso */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="items-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <svg
                className="h-10 w-10 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-gray-900">
              {isExistingUser ? 'Permissão Concedida!' : 'Cadastro Realizado!'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isExistingUser ? 'Sua permissão foi concedida com sucesso' : 'Seu cadastro foi realizado com sucesso'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 text-center">
            {isExistingUser ? (
              <>
                <p className="text-base text-gray-700">
                  Sua conta já existia no sistema. Use a <strong>mesma senha dos outros sistemas da SMS</strong> para fazer login.
                </p>
                <div className="rounded-lg bg-teal-50 p-4">
                  <p className="text-sm font-medium text-teal-800">
                    ✓ Agora você tem acesso ao sistema de Agenda!
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-base text-gray-700">
                  Uma <strong>senha provisória</strong> foi enviada para:
                </p>
                <div className="rounded-lg bg-gray-100 p-3">
                  <p className="font-semibold text-gray-900">{userEmail}</p>
                </div>
                <p className="text-sm text-gray-600">
                  Verifique sua caixa de entrada e use-a para fazer seu primeiro login.
                </p>
              </>
            )}
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full sm:w-auto bg-[#008BA7] hover:bg-[#008BA7]/90 px-8"
            >
              OK, Fazer Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RegisterForm;
