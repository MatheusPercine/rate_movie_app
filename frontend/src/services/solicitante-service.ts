import api from '@/services/api';
import type { SolicitanteRequest, SolicitanteResponse } from '@/types/solicitante';

export const solicitanteService = {
  // Buscar solicitante por ID
  async buscarPorId(id: number): Promise<SolicitanteResponse | null> {
    try {
      const response = await api.get<SolicitanteResponse>(`/Solicitante/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Buscar solicitante por authId (UUID da API Auth)
  async buscarPorAuthId(authId: string): Promise<SolicitanteResponse | null> {
    try {
      console.log('[Solicitante] Buscando por authId:', authId);
      
      const response = await api.get<SolicitanteResponse>(`/Solicitante/authid/${authId}`);
      console.log('[Solicitante] Solicitante encontrado:', response.data);
      
      return response.data;
    } catch (error: any) {
      // 404 significa que não existe, não é erro
      if (error.response?.status === 404) {
        console.log('[Solicitante] Não encontrado para authId:', authId);
        return null;
      }
      console.error('[Solicitante] Erro ao buscar por authId:', error);
      return null;
    }
  },

  // Buscar solicitante por email (LEGADO - usar buscarPorAuthId quando possível)
  async buscarPorEmail(email: string): Promise<SolicitanteResponse | null> {
    try {
      console.log('[Solicitante] Buscando por email:', email);
      
      // Busca todos os solicitantes e filtra localmente
      // (backend não filtra corretamente com query param)
      const response = await api.get<SolicitanteResponse[]>('/Solicitante');
      console.log('[Solicitante] Total de registros recebidos:', response.data?.length || 0);
      
      if (!Array.isArray(response.data)) {
        console.warn('[Solicitante] Resposta não é array:', response.data);
        return null;
      }
      
      const encontrado = response.data.find(s => 
        s.email.toLowerCase() === email.toLowerCase()
      );
      
      console.log('[Solicitante] Resultado da busca:', encontrado || 'Não encontrado');
      return encontrado || null;
    } catch (error) {
      console.error('[Solicitante] Erro ao buscar por email:', error);
      return null;
    }
  },

  // Criar solicitante
  async criar(dados: SolicitanteRequest): Promise<SolicitanteResponse> {
    try {
      // Swagger indica que POST aceita id (irrelevante) e ativo
      // Garante que setor seja uma string, não undefined
      const payload = {
        id: 0,
        ativo: true,
        ...dados,
        setor: dados.setor || '',
      } as SolicitanteRequest;
      const response = await api.post<SolicitanteResponse>('/Solicitante', payload);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar solicitante:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        dadosEnviados: dados
      });
      throw error;
    }
  },

  // Atualizar solicitante por ID
  async atualizar(id: number, dados: Partial<SolicitanteRequest>): Promise<SolicitanteResponse> {
    try {
      // PUT exige todos os campos, não apenas parcial
      const payload = {
        id,
        ativo: true,
        ...dados,
      };
      console.log('[Solicitante] Payload completo para PUT:', payload);
      const response = await api.put<SolicitanteResponse>(`/Solicitante/${id}`, payload);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar solicitante:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        id,
        dadosEnviados: dados
      });
      throw error;
    }
  },

  // Cria solicitante apenas se não existir (busca por email primeiro)
  async criarPorEmail(dados: SolicitanteRequest): Promise<SolicitanteResponse> {
    try {
      // Primeiro verifica se já existe pelo email
      const existente = await this.buscarPorEmail(dados.email);
      if (existente) {
        console.log('Solicitante já existe no sistema:', existente);
        return existente;
      }

      // Se não existe, cria novo
      const response = await api.post<SolicitanteResponse>('/Solicitante', dados);
      console.log('Solicitante criado com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      // Se retornar 409 (Conflict), busca novamente por email
      if (error.response?.status === 409) {
        console.log('Solicitante já existe no sistema (409), buscando...');
        const existente = await this.buscarPorEmail(dados.email);
        if (existente) {
          return existente;
        }
      }
      
      console.error('Erro ao criar solicitante:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        dadosEnviados: dados
      });
      
      // Expande o objeto data para ver os detalhes
      if (error.response?.data) {
        console.error('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
  },

  // Garante que o solicitante exista e com o tipo correto; atualiza se necessário
  async sincronizar(dados: SolicitanteRequest): Promise<SolicitanteResponse> {
    console.log('[Solicitante Sync] Iniciando sincronização para:', dados.email);
    console.log('[Solicitante Sync] Dados de entrada:', dados);

    // Validação crítica: authId e authPermId devem estar presentes
    if (!dados.authId) {
      console.error('[Solicitante Sync] ⚠️ ATENÇÃO: authId está ausente! Isso pode causar problemas.');
    }
    if (!dados.authPermId) {
      console.error('[Solicitante Sync] ⚠️ ATENÇÃO: authPermId está ausente! Isso pode causar problemas.');
    }

    // Tenta localizar por authId (mais rápido e confiável)
    let existente: SolicitanteResponse | null = null;
    
    if (dados.authId) {
      existente = await this.buscarPorAuthId(dados.authId);
      console.log('[Solicitante Sync] Resultado da busca por authId:', existente || 'Não encontrado');
    } else {
      // Fallback para email se não tiver authId (caso legado)
      console.warn('[Solicitante Sync] authId não fornecido, usando busca por email (lento)');
      existente = await this.buscarPorEmail(dados.email);
      console.log('[Solicitante Sync] Resultado da busca por email:', existente || 'Não encontrado');
    }

    if (!existente) {
      // Não existe: cria novo
      // Garante que setor seja uma string válida
      const dadosLimpos = {
        ...dados,
        setor: dados.setor || '',
      };
      console.log('[Solicitante Sync] Criando novo solicitante...');
      
      // Log final antes da criação
      if (!dadosLimpos.authId || !dadosLimpos.authPermId) {
        console.error('[Solicitante Sync] ❌ ERRO CRÍTICO: Tentando criar solicitante sem authId ou authPermId:', {
          authId: dadosLimpos.authId,
          authPermId: dadosLimpos.authPermId
        });
      }
      
      const criado = await this.criar(dadosLimpos);
      console.log('[Solicitante Sync] Solicitante criado com sucesso:', criado);
      return criado;
    }

    // Já existe: verifica se precisa atualizar tipo, nome, setor, authId ou authPermId
    const precisaAtualizarTipo = typeof existente.tipo === 'number' && existente.tipo !== dados.tipo;
    const precisaAtualizarNome = existente.nome !== dados.nome && Boolean(dados.nome);
    const precisaAtualizarSetor = dados.setor != null && dados.setor !== '' && existente.setor !== dados.setor;
    const precisaAtualizarAuthId = dados.authId != null && dados.authId !== '' && existente.authId !== dados.authId;
    const precisaAtualizarAuthPermId = dados.authPermId != null && dados.authPermId !== '' && existente.authPermId !== dados.authPermId;
    
    // Verifica se authId ou authPermId estão null no registro existente e precisam ser preenchidos
    const precisaPreencherAuthId = !existente.authId && dados.authId;
    const precisaPreencherAuthPermId = !existente.authPermId && dados.authPermId;

    console.log('[Solicitante Sync] Verificação de atualizações:', {
      precisaAtualizarTipo,
      tipoExistente: existente.tipo,
      tipoNovo: dados.tipo,
      precisaAtualizarNome,
      nomeExistente: existente.nome,
      nomeNovo: dados.nome,
      precisaAtualizarSetor,
      setorExistente: existente.setor,
      setorNovo: dados.setor,
      precisaAtualizarAuthId,
      authIdExistente: existente.authId,
      authIdNovo: dados.authId,
      precisaAtualizarAuthPermId,
      authPermIdExistente: existente.authPermId,
      authPermIdNovo: dados.authPermId,
      precisaPreencherAuthId,
      precisaPreencherAuthPermId
    });

    if (precisaAtualizarTipo || precisaAtualizarNome || precisaAtualizarSetor || precisaAtualizarAuthId || precisaAtualizarAuthPermId || precisaPreencherAuthId || precisaPreencherAuthPermId) {
      const atualizados: Partial<SolicitanteRequest> = {
        nome: dados.nome,
        email: dados.email,
        tipo: dados.tipo,
        // Só atualiza setor se vier valor válido (não undefined e não vazio)
        setor: (dados.setor != null && dados.setor !== '') ? dados.setor : existente.setor,
        // Atualiza authId se vier valor válido ou se o existente estiver null
        authId: (dados.authId != null && dados.authId !== '') ? dados.authId : existente.authId,
        // Atualiza authPermId se vier valor válido ou se o existente estiver null
        authPermId: (dados.authPermId != null && dados.authPermId !== '') ? dados.authPermId : existente.authPermId
      };

      console.log('[Solicitante Sync] Atualizando solicitante ID', existente.id, 'com:', atualizados);
      
      // Log de aviso se authId ou authPermId ainda estiverem ausentes
      if (!atualizados.authId) {
        console.error('[Solicitante Sync] ⚠️ ATENÇÃO: Atualizando sem authId!');
      }
      if (!atualizados.authPermId) {
        console.error('[Solicitante Sync] ⚠️ ATENÇÃO: Atualizando sem authPermId!');
      }
      
      const atualizado = await this.atualizar(existente.id, atualizados);
      console.log('[Solicitante Sync] Solicitante atualizado com sucesso:', atualizado);
      return atualizado;
    }

    // Nada a atualizar
    console.log('[Solicitante Sync] Nenhuma atualização necessária, retornando existente');
    
    // Log de aviso se o registro existente tiver authId ou authPermId null
    if (!existente.authId) {
      console.warn('[Solicitante Sync] ⚠️ AVISO: Registro existente tem authId null!');
    }
    if (!existente.authPermId) {
      console.warn('[Solicitante Sync] ⚠️ AVISO: Registro existente tem authPermId null!');
    }
    
    return existente;
  },
};
