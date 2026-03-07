/**
 * Formata CPF com máscara (000.000.000-00)
 */
export const formatarCPF = (valor: string): string => {
  // Remove tudo que não é número
  const numeros = valor.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const limitado = numeros.slice(0, 11)
  
  // Aplica máscara
  if (limitado.length <= 3) {
    return limitado
  } else if (limitado.length <= 6) {
    return `${limitado.slice(0, 3)}.${limitado.slice(3)}`
  } else if (limitado.length <= 9) {
    return `${limitado.slice(0, 3)}.${limitado.slice(3, 6)}.${limitado.slice(6)}`
  } else {
    return `${limitado.slice(0, 3)}.${limitado.slice(3, 6)}.${limitado.slice(6, 9)}-${limitado.slice(9)}`
  }
}

/**
 * Remove máscara do CPF (retorna apenas números)
 */
export const limparCPF = (valor: string): string => {
  return valor.replace(/\D/g, '')
}

/**
 * Valida CPF (algoritmo oficial)
 */
export const validarCPF = (cpf: string): boolean => {
  const numeros = limparCPF(cpf)
  
  // Verifica se tem 11 dígitos
  if (numeros.length !== 11) {
    return false
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numeros)) {
    return false
  }
  
  // Valida primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i)
  }
  let resto = 11 - (soma % 11)
  let digitoVerificador1 = resto >= 10 ? 0 : resto
  
  if (digitoVerificador1 !== parseInt(numeros.charAt(9))) {
    return false
  }
  
  // Valida segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i)
  }
  resto = 11 - (soma % 11)
  let digitoVerificador2 = resto >= 10 ? 0 : resto
  
  if (digitoVerificador2 !== parseInt(numeros.charAt(10))) {
    return false
  }
  
  return true
}
