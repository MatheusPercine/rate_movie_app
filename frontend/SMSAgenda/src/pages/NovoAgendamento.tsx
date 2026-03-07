import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Clock, FileText, Calendar, X, CheckCircle, AlertCircle, LayoutGrid, Check } from "lucide-react";
import { Card, Card2 } from "@/components/ui/card";
import { ButtonCustomOutline, ButtonCustomPopup } from "@/components/button-custom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/services/api";
import { useAuthStore } from "@/lib/auth/auth-store";
import { solicitanteService } from "@/services/solicitante-service";
import { cookieUtils } from "@/lib/auth/cookie-utils";
import { getTokenInfo } from "@/lib/auth/auth";

// Interface para os dados da API
interface HorarioDisponivel {
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

interface Sala {
  id: number;
  nome: string;
  capacidade: number;
  descricaoEquipamentos: string;
  disponivel: boolean;
  imagemBase64: string;
  horariosDisponiveis: HorarioDisponivel[];
}

interface Agendamento {
  id: number;
  titulo?: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  descricao?: string;
  qtd_Participantes?: number;
  nomeResponsavel?: string;
  emailResponsavel?: string;
  celularResponsavel?: string;
  salaId: number;
  solicitanteId?: number;
  solicitanteNome?: string;
  status: number; // 0 = Pendente, 1 = Aprovado, 2 = Recusado, 3 = Cancelado
}

// Hook para persistir estado no localStorage
function usePersistedState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {

  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao carregar ${key} do localStorage:`, error);
      return initialValue;
    }
  });

  // Atualiza localStorage se mudar o estado
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Erro ao salvar ${key} no localStorage:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default function NovoAgendamento() {
  const solicitante = useAuthStore((s) => s.solicitante);
  const setSolicitante = useAuthStore((s) => s.setSolicitante);
  const usuario = useAuthStore((s) => s.usuario);

  const [tituloReuniao, setTituloReuniao] = usePersistedState("novoAgend_titulo", "");
  const [dataAgendamento, setDataAgendamento] = usePersistedState("novoAgend_data", "");
  const [horarioInicio, setHorarioInicio] = usePersistedState("novoAgend_horaInicio", "");
  const [horarioFim, setHorarioFim] = usePersistedState("novoAgend_horaFim", "");
  const [descricao, setDescricao] = usePersistedState("novoAgend_descricao", "");
  const [nomeResponsavel, setNomeResponsavel] = usePersistedState("novoAgend_nomeResp", "");
  const [emailResponsavel, setEmailResponsavel] = usePersistedState("novoAgend_emailResp", "");
  const [telefoneResponsavel, setTelefoneResponsavel] = usePersistedState("novoAgend_telResp", "");
  const [salaSelecionada, setSalaSelecionada] = usePersistedState("novoAgend_sala", "");
  const [quantidadeParticipantes, setQuantidadeParticipantes] = usePersistedState("novoAgend_qtdPart", "");

  // Estados para as salas da API
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o modal de horários
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentosPendentes, setAgendamentosPendentes] = useState<Agendamento[]>([]);
  const [agendamentosAprovados, setAgendamentosAprovados] = useState<Agendamento[]>([]);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(false);

  // Estados para o AlertDialog de confirmação
  const [alertAberto, setAlertAberto] = useState(false);
  const [alertTipo, setAlertTipo] = useState<'normal' | 'conflito' | 'horario-invalido' | 'horario-fora-funcionamento'>('normal');
  const [dadosAgendamento, setDadosAgendamento] = useState<any>(null);

  // Estado para controlar o loading da imagem
  const [imagemCarregando, setImagemCarregando] = useState<{ [key: number]: boolean }>({});

  // Estado para controlar os termos de uso
  const [mostrarTermos, setMostrarTermos] = useState(false);
  const [checkTermos, setCheckTermos] = useState(false);

  // Estados para popup de sucesso/erro
  const [alertSucessoErro, setAlertSucessoErro] = useState(false);
  const [tipoAlertSucessoErro, setTipoAlertSucessoErro] = useState<'sucesso' | 'erro'>('sucesso');
  const [mensagemAlertSucessoErro, setMensagemAlertSucessoErro] = useState('');

  // Recarregar solicitante se perdido após F5
  useEffect(() => {
    const recarregarSolicitante = async () => {
      // Se já tem solicitante no store, não precisa recarregar
      if (solicitante) {
        console.log('✅ [NovoAgendamento] Solicitante já carregado:', solicitante);
        return;
      }

      try {
        console.log('🔄 [NovoAgendamento] Recarregando solicitante após refresh...');
        
        // Busca informações do token diretamente
        const token = cookieUtils.getCookie('auth_token');
        if (!token) {
          console.warn('⚠️ [NovoAgendamento] Token não encontrado');
          return;
        }

        const tokenInfo = token ? getTokenInfo(token) : null;
        if (!tokenInfo) {
          console.warn('⚠️ [NovoAgendamento] Não foi possível decodificar token');
          return;
        }

        console.log('📝 [NovoAgendamento] Info do token:', {
          email: tokenInfo.sub,
          nome: tokenInfo.nomeCompleto,
          permissao: tokenInfo.permissao
        });

        const permissaoNum = tokenInfo.permissao != null ? Number(tokenInfo.permissao) : undefined;
        // Mapeamento: 1=Admin, 2/3=Solicitante, 4/5=Viewer
        // Admin (1) -> tipo=1, Solicitante (2,3) -> tipo=0, Viewer (4,5) -> tipo=2
        const isAdmin = permissaoNum === 1;
        const tipo = isAdmin ? 1 : 0;
        
        // Sincroniza usando os dados do token
        const solicitanteRecarregado = await solicitanteService.sincronizar({
          nome: tokenInfo.nomeCompleto,
          email: tokenInfo.sub, // sub é o email
          tipo,
          authId: tokenInfo.usuarioId,
          authPermId: sessionStorage.getItem('pending_authPermId') || undefined
        });

        //console.log(' [NovoAgendamento] Solicitante recarregado:', solicitanteRecarregado);
        setSolicitante(solicitanteRecarregado);
      } catch (error) {
        console.error('[NovoAgendamento] Erro ao recarregar solicitante:', error);
      }
    };

    recarregarSolicitante();
  }, [solicitante, setSolicitante]);

  // Buscar salas da API
  useEffect(() => {
    const buscarSalas = async () => {
      try {
        setLoading(true);
        //console.log("Tentando buscar salas em:", api.defaults.baseURL + "/api/Sala/Ativas");
        const response = await api.get("/Sala/Ativas");
        //console.log("Salas recebidas da API:", response.data);
        setSalas(response.data);
      } catch (error: any) {
        console.error("Erro ao buscar salas:", error);
        console.error("Detalhes do erro:", {
          message: error?.message,
          code: error?.code,
          response: error?.response,
        });
      } finally {
        setLoading(false);
      }
    };

    buscarSalas();
  }, []);

  // filtrar salas pela qtde de participantes
  const salasDisponiveis = salas.filter(sala => {
    if (!quantidadeParticipantes) return true;
    const qtde = parseInt(quantidadeParticipantes);
    return sala.capacidade >= qtde;
  });

  // Desselecionar sala se a quantidade de participantes ultrapassar a capacidade
  useEffect(() => {
    if (salaSelecionada && quantidadeParticipantes) {
      const salaAtual = salas.find(s => s.id.toString() === salaSelecionada);
      const qtde = parseInt(quantidadeParticipantes);

      if (salaAtual && salaAtual.capacidade < qtde) {
        setSalaSelecionada("");
      }
    }
  }, [quantidadeParticipantes, salaSelecionada, salas]);

  // Função para mapear dia da semana
  const obterNomeDia = (diaSemana: number): string => {
    const dias: { [key: number]: string } = {
      1: "Seg",
      2: "Ter",
      3: "Qua",
      4: "Qui",
      5: "Sex",
    };
    return dias[diaSemana] || "";
  };

  // Função para formatar horário (remover segundos)
  const formatarHorario = (horario: string): string => {
    if (!horario) return "";
    // Se vier no formato HH:MM:SS, pega só HH:MM
    return horario.substring(0, 5);
  };

  // funcao de mudar pro proximo input com enter
  const proxInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      const inputs = Array.from(
        form.querySelectorAll('input:not([type="hidden"]), select, textarea')
      );
      const currentIndex = inputs.indexOf(e.currentTarget);
      const nextInput = inputs[currentIndex + 1] as HTMLElement;

      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!tituloReuniao || !dataAgendamento || !horarioInicio || !horarioFim || !salaSelecionada) {
      setTipoAlertSucessoErro('erro');
      setMensagemAlertSucessoErro('Por favor, preencha todos os campos obrigatórios.');
      setAlertSucessoErro(true);
      return;
    }

    // Verificar se a data é anterior à data atual
    const agora = new Date();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataSelecionada = new Date(dataAgendamento + 'T00:00:00');
    
    if (dataSelecionada < hoje) {
      setTipoAlertSucessoErro('erro');
      setMensagemAlertSucessoErro('A data do agendamento não pode ser anterior à data atual.');
      setAlertSucessoErro(true);
      return;
    }

    // Verificar se a data está dentro do período permitido
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    let dataLimite: Date;
    
    if (diaAtual < 15) {
      // Se dia atual < 15, só pode agendar até o fim do mês atual
      dataLimite = new Date(anoAtual, mesAtual + 1, 0); // Último dia do mês atual
      dataLimite.setHours(23, 59, 59, 999);
    } else {
      // Se dia atual >= 15, pode agendar até o fim do próximo mês
      dataLimite = new Date(anoAtual, mesAtual + 2, 0); // Último dia do próximo mês
      dataLimite.setHours(23, 59, 59, 999);
    }
    
    if (dataSelecionada > dataLimite) {
      const mesLimiteNome = dataLimite.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      setTipoAlertSucessoErro('erro');
      setMensagemAlertSucessoErro(
        `Agendamentos só podem ser feitos até o fim de ${mesLimiteNome}. ` +
        `${diaAtual < 15 
          ? 'Como estamos antes do dia 15, só é possível agendar até o fim do mês atual.' 
          : 'Como estamos a partir do dia 15, é possível agendar até o fim do próximo mês.'}`
      );
      setAlertSucessoErro(true);
      return;
    }

    // Verificar se o horário é anterior ao horário atual quando a data é hoje
    if (dataSelecionada.getTime() === hoje.getTime()) {
      const [horaInicio, minInicio] = horarioInicio.split(':').map(Number);
      const horarioSelecionado = new Date();
      horarioSelecionado.setHours(horaInicio, minInicio, 0, 0);
      
      if (horarioSelecionado <= agora) {
        setTipoAlertSucessoErro('erro');
        setMensagemAlertSucessoErro('O horário de início não pode ser anterior ou igual ao horário atual.');
        setAlertSucessoErro(true);
        return;
      }
    }

    // Validar horários primeiro
    const [horaInicio, minInicio] = horarioInicio.split(':').map(Number);
    const [horaFim, minFim] = horarioFim.split(':').map(Number);

    const minutosInicio = horaInicio * 60 + minInicio;
    const minutosFim = horaFim * 60 + minFim;
    const diferencaMinutos = minutosFim - minutosInicio;

    // Verificar se o horário de início é maior ou igual ao horário de fim
    if (minutosInicio >= minutosFim) {
      setTipoAlertSucessoErro('erro');
      setMensagemAlertSucessoErro('O horário de início não pode ser maior ou igual ao horário de término.');
      setAlertSucessoErro(true);
      return;
    }

    // Verificar se a diferença é menor que 10 minutos
    if (diferencaMinutos < 10) {
      setTipoAlertSucessoErro('erro');
      setMensagemAlertSucessoErro('O agendamento deve ter duração mínima de 10 minutos.');
      setAlertSucessoErro(true);
      return;
    }

    // Verificar se a sala está disponível no dia e horário selecionados
    const salaEscolhida = salas.find(s => s.id.toString() === salaSelecionada);
    if (salaEscolhida) {

      const dataSelecionada = new Date(dataAgendamento + 'T00:00:00');
      const diaSemana = dataSelecionada.getDay();

      // Converter para o formato do banco (1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta)
      const diaSemanaBanco = diaSemana === 0 ? 7 : diaSemana;

      // Verificar se a sala tem horário de funcionamento para esse dia
      const horarioSala = salaEscolhida.horariosDisponiveis?.find(h => h.diaSemana === diaSemanaBanco);

      if (!horarioSala) {
        setAlertTipo('horario-invalido');
        setAlertAberto(true);
        return;
      }

      // Verificar se o horário escolhido está dentro do horário de funcionamento
      const horarioInicioComSegundos = horarioInicio + ":00";
      const horarioFimComSegundos = horarioFim + ":00";

      if (horarioInicioComSegundos < horarioSala.horaInicio || horarioFimComSegundos > horarioSala.horaFim) {
        setAlertTipo('horario-fora-funcionamento');
        setAlertAberto(true);
        return;
      }
    }

    // Verificar se há conflito de horário
    try {
      // Buscar agendamentos aprovados para verificar conflito
      const responseAprovados = await api.get("/Agendamento/status/1");

      // Novo contrato do endpoint: { meus: AgendamentoCompleto[], outros: AgendamentoParcial[] }
      const respPayload = responseAprovados?.data;
      const aprovados: Agendamento[] = [
        ...(Array.isArray(respPayload) ? respPayload : []),
        ...(Array.isArray(respPayload?.meus) ? respPayload.meus : []),
        ...(Array.isArray(respPayload?.outros) ? respPayload.outros : []),
      ];

      const conflito = aprovados.some((ag: Agendamento) => {
        const dataAg = new Date(ag.data).toDateString();
        const dataRef = new Date(dataAgendamento + 'T00:00:00').toDateString();
        const horarioInicioComSegundos = horarioInicio + ":00";
        const horarioFimComSegundos = horarioFim + ":00";

        return (
          ag.salaId === parseInt(salaSelecionada) &&
          dataAg === dataRef &&
          (
            (horarioInicioComSegundos >= ag.horaInicio && horarioInicioComSegundos < ag.horaFim) ||
            (horarioFimComSegundos > ag.horaInicio && horarioFimComSegundos <= ag.horaFim) ||
            (horarioInicioComSegundos <= ag.horaInicio && horarioFimComSegundos >= ag.horaFim)
          )
        );
      });

      // Montar a descrição com informações do responsável
      // const infoResponsavel = `${nomeResponsavel || ''},${emailResponsavel || ''},${telefoneResponsavel || ''}`;
      // const descricaoCompleta = `${infoResponsavel}$$${descricao || ''}`;

      // Formatar a data para ISO 8601
      const dataISO = new Date(dataAgendamento + 'T00:00:00').toISOString();

      // Montar o payload

      const payload = {
        titulo: tituloReuniao,
        data: dataISO,
        horaInicio: horarioInicio + ":00",
        horaFim: horarioFim + ":00",
        qtd_Participantes: parseInt(quantidadeParticipantes) || 0,
        descricao: descricao || "",
        nomeResponsavel: nomeResponsavel || "",
        emailResponsavel: emailResponsavel || "",
        celularResponsavel: telefoneResponsavel || "",
        salaId: parseInt(salaSelecionada),
        solicitanteId: solicitante?.id ?? 0,
        solicitanteNome: solicitante?.nome || nomeResponsavel || "Usuário Padrão",
        status: 0
      };


      // Guardar payload para usar depois
      setDadosAgendamento(payload);

      // Se houver conflito, mostrar alerta de conflito
      if (conflito) {
        setAlertTipo('conflito');
        setAlertAberto(true);
      } else {
        // Se não houver conflito, mostrar termos de uso
        setCheckTermos(false);
        setMostrarTermos(true);
      }

    } catch (error: any) {
      console.error("Erro ao verificar conflitos:", error);
      setTipoAlertSucessoErro('erro');
      setMensagemAlertSucessoErro('Erro ao verificar disponibilidade. Tente novamente.');
      setAlertSucessoErro(true);
    }
  };

  // Função para continuar após aceitar os termos
  const continuarAposTermos = async () => {
    setMostrarTermos(false);
    await enviarAgendamento(dadosAgendamento);
  };

  // Função para enviar o agendamento
  const enviarAgendamento = async (payload: any) => {
    try {
      console.log("Enviando agendamento:", payload);

      const response = await api.post("/Agendamento", payload);

      console.log("Agendamento criado com sucesso:", response.data);

      // Limpar formulário e cache
      setTituloReuniao("");
      setDataAgendamento("");
      setHorarioInicio("");
      setHorarioFim("");
      setDescricao("");
      setNomeResponsavel("");
      setEmailResponsavel("");
      setTelefoneResponsavel("");
      setSalaSelecionada("");
      setQuantidadeParticipantes("");

      // Mostrar mensagem de sucesso
      setTipoAlertSucessoErro('sucesso');
      setMensagemAlertSucessoErro('Solicitação registrada com sucesso!');
      setAlertSucessoErro(true);

    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      console.error("Detalhes completos do erro:", {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        backendError: error?.response?.data,
        headers: error?.response?.headers,
      });
      
      // Tenta extrair mensagem de erro útil do backend
      let mensagemErro = 'Erro desconhecido';
      if (error?.response?.data) {
        // Backend pode retornar erro em diferentes formatos
        const backendData = error.response.data;
        mensagemErro = backendData.message || backendData.error || backendData.title || JSON.stringify(backendData);
      } else {
        mensagemErro = error?.message || 'Erro de rede - verifique o console do navegador (Network tab)';
      }
      
      setTipoAlertSucessoErro('erro');
      setMensagemAlertSucessoErro(`Erro ao criar agendamento: ${mensagemErro}`);
      setAlertSucessoErro(true);
    }
  };

  // Função para confirmar conflito e mostrar termos
  const confirmarAgendamento = async () => {
    setAlertAberto(false);
    // Após confirmar o conflito, mostrar termos de uso
    setCheckTermos(false);
    setMostrarTermos(true);
  };

  return (
    <div className="flex flex-col h-full w-full p-1 overflow-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Agendamento</h1>
              <p className="text-sm text-gray-500 mt-1">Crie um novo agendamento</p>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3">
              <ButtonCustomOutline type="submit">
                Criar Agendamento
              </ButtonCustomOutline>
            </div>
            
          </div>
        </div>

        <div className="grid grid-cols-1 @5xl:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col @5xl:h-full">
            {/* Seção: Informações do Agendamento */}

            <div className="rounded-[20px] shadow-sm border border-t-0 border-gray-200 flex-1 mb-4">


              <div className="bg-[#F4F4F4] rounded-t-xl">
                <div className="flex items-center gap-4 pl-6 py-7">
                  <Clock className="h-7 w-7 text-[#59C2ED]" />
                  <h2 className="text-xl font-normal text-[#171717]">Informações do Agendamento</h2>
                </div>
              </div>

              <Card2 className="p-5 border-none rounded-b-[20px] !shadow-none flex-1">

                <div className="space-y-3">
                  {/* Título da Reunião */}
                  <div className="space-y-2">
                    <Label htmlFor="titulo" className="text-sm font-medium text-gray-700">
                      Título da Reunião
                    </Label>
                    <Input
                      id="titulo"
                      placeholder="Nome da reunião"
                      value={tituloReuniao}
                      onChange={(e) => setTituloReuniao(e.target.value)}
                      onKeyDown={proxInput}
                      maxLength={100}
                      className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-color placeholder:text-gray-400"
                    />
                  </div>

                  {/* Data e Hora do Agendamento */}
                  <div className="grid gap-3 grid-cols-1 @3xl:grid-cols-[1fr_0.75fr_0.75fr] @5xl:grid-cols-1 @7xl:grid-cols-[1fr_0.75fr_0.75fr]">
                    <div className="space-y-2">
                      <Label htmlFor="data" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Data
                      </Label>
                      <Input
                        id="data"
                        type="date"
                        value={dataAgendamento}
                        onChange={(e) => setDataAgendamento(e.target.value)}
                        onKeyDown={proxInput}
                        className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 @5xl:h-9 @7xl:h-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-time-picker-indicator]:hidden"
                        style={{ textAlign: 'center' }}
                      />
                    </div>

                    {/* Container para os horários - empilhados em lg */}
                    <div className="@3xl:contents @5xl:grid @5xl:grid-cols-2 @5xl:gap-3 @5xl:col-span-1 @7xl:contents">
                      <div className="space-y-2">
                        <Label htmlFor="horario-inicio" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          Início
                        </Label>
                        <Input
                          id="horario-inicio"
                          type="time"
                          step="60"
                          value={horarioInicio}
                          onChange={(e) => setHorarioInicio(e.target.value)}
                          onKeyDown={proxInput}
                          className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 @5xl:h-9 @7xl:h-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-time-picker-indicator]:hidden"
                          style={{ textAlign: 'center' }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="horario-fim" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          Término
                        </Label>
                        <Input
                          id="horario-fim"
                          type="time"
                          step="60"
                          value={horarioFim}
                          onChange={(e) => setHorarioFim(e.target.value)}
                          onKeyDown={proxInput}
                          className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 @5xl:h-9 @7xl:h-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-time-picker-indicator]:hidden"
                          style={{ textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/*Quantidade de Participantes*/}
                  <div className="space-y-2">
                    <Label htmlFor="quantidade-participantes" className="text-sm font-medium text-gray-700">Quantidade de Participantes</Label>

                    <Input
                      id="quantidade-participantes"
                      type="number"
                      placeholder="Número de participantes"
                      value={quantidadeParticipantes}
                      onChange={(e) => setQuantidadeParticipantes(e.target.value)}
                      onKeyDown={proxInput}
                      className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                    />

                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="descricao" className="text-sm font-medium text-gray-700">
                      Descrição (opcional)
                    </Label>
                    <Textarea
                      id="descricao"
                      placeholder="Descrição da reunião"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      maxLength={255}
                      className="w-full min-h-[70px] max-h-[150px] overflow-y-auto border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </Card2>
            </div>

            {/* Seção: Informações do Responsável */}

            <div className="rounded-[20px] shadow-sm border border-t-0 border-gray-200 flex-1">

              <div className="bg-[#F4F4F4] rounded-t-xl  border-gray-200">
                <div className="flex items-center gap-4 pl-6 py-7">
                  <FileText className="h-7 w-7 text-[#59C2ED]" />
                  <h2 className="text-xl font-normal text-[#171717]">Informações do Responsável pelo Uso</h2>
                </div>
              </div>

              <Card2 className="p-5 border-none rounded-b-[20px] !shadow-none flex-1">

                <div className="space-y-3">
                  {/* Nome do Responsável */}
                  <div className="space-y-2">
                    <Label htmlFor="nome-responsavel" className="text-sm font-medium text-gray-700">
                      Nome do Responsável pelo Uso
                    </Label>
                    <Input
                      id="nome-responsavel"
                      placeholder="Nome completo"
                      value={nomeResponsavel}
                      onChange={(e) => setNomeResponsavel(e.target.value)}
                      onKeyDown={proxInput}
                      maxLength={100}
                      className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Email e Telefone */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="email-responsavel" className="text-sm font-medium text-gray-700">
                        Email do Responsável
                      </Label>
                      <Input
                        id="email-responsavel"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={emailResponsavel}
                        onChange={(e) => setEmailResponsavel(e.target.value)}
                        onKeyDown={proxInput}
                        maxLength={100}
                        className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone-responsavel" className="text-sm font-medium text-gray-700">
                        Número do Responsável
                      </Label>
                      <Input
                        id="telefone-responsavel"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={telefoneResponsavel}
                        onChange={(e) => {
                          const valor = e.target.value.replace(/\D/g, '');
                          let valorFormatado = '';
                          if (valor.length > 0) {
                            valorFormatado = '(' + valor.substring(0, 2);
                            if (valor.length >= 3) {
                              valorFormatado += ') ' + valor.substring(2, 7);
                            }
                            if (valor.length >= 8) {
                              valorFormatado += '-' + valor.substring(7, 11);
                            }
                          }
                          setTelefoneResponsavel(valorFormatado);
                        }}
                        onKeyDown={proxInput}
                        maxLength={15}
                        className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </Card2>

            </div>



          </div>

          {/* Coluna Direita: Sala (50%) */}
          <div className="flex flex-col @5xl:h-full">
            {/* Seção: Seleção de Sala */}


            <div className="rounded-[20px] shadow-sm border border-t-0 border-gray-200 flex-1">

              <div className="bg-[#F4F4F4] rounded-t-xl">
                <div className="flex items-center gap-4 pl-6 py-7">
                  <LayoutGrid className="h-6 w-6 text-[#59C2ED]" />
                  <h2 className="text-xl font-normal text-[#171717]">Selecione uma Sala</h2>
                </div>
              </div>

              <Card2 className="p-5 border-none rounded-b-[20px] !shadow-none flex-1">

                {/* Select de Salas */}
                <div className="space-y-2 mb-5">
                  <Label htmlFor="sala" className="text-sm font-medium text-gray-700">
                    Sala
                  </Label>
                  <Select value={salaSelecionada} onValueChange={setSalaSelecionada} disabled={loading}>
                    <SelectTrigger className="w-full cursor-pointer bg-white font-medium border-gray-300">
                      <SelectValue placeholder={loading ? "Carregando salas..." : "Selecione uma sala"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white font-medium border-gray-300">
                      {salasDisponiveis.length > 0 ? (
                        salasDisponiveis.map((sala) => (
                          <SelectItem key={sala.id} value={sala.id.toString()}>
                            {sala.nome}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          {loading ? "Carregando..." : quantidadeParticipantes ?
                            `Nenhuma sala disponível para ${quantidadeParticipantes} participantes` :
                            "Nenhuma sala disponível"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {quantidadeParticipantes && salasDisponiveis.length === 0 && !loading && (
                    <p className="text-xs text-red-600 mt-1">
                      Não há salas disponíveis com capacidade para {quantidadeParticipantes} participantes
                    </p>
                  )}
                </div>

                {/* Informações da Sala Selecionada */}
                {salaSelecionada && (() => {
                  const salaInfo = salas.find(s => s.id.toString() === salaSelecionada);
                  if (!salaInfo) return null;

                  // Separar equipamentos por vírgula
                  const equipamentos = salaInfo.descricaoEquipamentos
                    ? salaInfo.descricaoEquipamentos.split(",").map(e => e.trim()).filter(e => e)
                    : [];

                  return (
                    <div className="space-y-8">
                      {/* Foto da Sala */}
                      <div className="flex justify-center">
                        <div className="rounded-lg overflow-hidden max-w-[600px] w-full select-none" style={{ touchAction: 'none' }}>
                          {!salaInfo.imagemBase64 ? (
                            <div className="w-full h-64 bg-gray-100 flex items-center justify-center border border-gray-200">
                              <p className="text-gray-500 text-sm">Imagem não disponível</p>
                            </div>
                          ) : imagemCarregando[salaInfo.id] === true ? (
                            <div className="w-full h-64 bg-gray-100 flex items-center justify-center border border-gray-200">
                              <p className="text-gray-500 text-sm">Erro ao carregar imagem</p>
                            </div>
                          ) : (
                            <>
                              {imagemCarregando[salaInfo.id] !== false && (
                                <Skeleton className="w-full h-64" />
                              )}
                              <img
                                src={salaInfo.imagemBase64}
                                alt={salaInfo.nome}
                                className={`w-full h-64 object-contain pointer-events-none select-none ${imagemCarregando[salaInfo.id] !== false ? 'hidden' : ''}`}
                                onLoad={() => setImagemCarregando(prev => ({ ...prev, [salaInfo.id]: false }))}
                                onError={() => setImagemCarregando(prev => ({ ...prev, [salaInfo.id]: true }))}
                                draggable={false}
                                style={{ 
                                  touchAction: 'none',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  MozUserSelect: 'none',
                                  msUserSelect: 'none'
                                }}
                                onContextMenu={(e) => e.preventDefault()}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Detalhes da Sala */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{salaInfo.nome}</h3>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-sm">Capacidade: {salaInfo.capacidade} pessoas</span>
                        </div>

                        {equipamentos.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Equipamentos</Label>
                            <div className="flex flex-wrap gap-2 max-h-[68px] overflow-hidden relative">
                              {equipamentos.map((equipamento, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                >
                                  {equipamento}
                                </span>
                              ))}
                            </div>
                            {equipamentos.length > 4 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="mt-2 text-xs text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                                      Ver todos os equipamentos ({equipamentos.length})
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-[350px] bg-white shadow-lg p-3 rounded-lg">
                                    <div className="flex flex-wrap gap-1.5">
                                      {equipamentos.map((equipamento, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                          {equipamento}
                                        </span>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        )}

                        {/* Horários de Funcionamento */}
                        {salaInfo.horariosDisponiveis?.length > 0 && (
                          <div className="mt-4">
                            <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-emerald-600" />
                              Horários de Funcionamento
                            </Label>

                            <div className="grid grid-cols-1 @xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-5 gap-1.5">
                              {salaInfo.horariosDisponiveis.map((horario, idx) => (
                                <div
                                  key={idx}
                                  className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-1.5 px-2.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {/* bolinha lateral */}
                                    <span className="font-medium">{obterNomeDia(horario.diaSemana)}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {formatarHorario(horario.horaInicio)} - {formatarHorario(horario.horaFim)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })()}
              </Card2>

            </div>


          </div>
        </div>
      </form>

      {/* AlertDialog para Termos de Uso */}
      <AlertDialog open={mostrarTermos} onOpenChange={setMostrarTermos}>
        <AlertDialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Termos de Uso - Agendamento de Sala
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p className="font-semibold text-base text-gray-900">
              Ao realizar o agendamento, você declara:
            </p>

            <div className="space-y-3 pl-4">
              <div className="flex gap-3">
                <span className="text-blue-600 font-semibold">-</span>
                <p>
                  Ser o responsável pela utilização da <strong>{salas.find(s => s.id.toString() === salaSelecionada)?.nome || 'sala agendada'}</strong>, situada na Secretaria Municipal de Saúde do Rio de Janeiro, na data e horário solicitados.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="text-blue-600 font-semibold">-</span>
                <p>
                  Estar ciente de que é <strong>DEVER zelar pela conservação das instalações</strong> do setor e limpeza da estrutura, responsabilizando-me pelos danos que vierem a ocorrer.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="text-blue-600 font-semibold">-</span>
                <p>
                  Estar ciente de que a <strong>Secretaria Municipal de Saúde não se responsabiliza</strong> por qualquer ação praticada por mim ou convidados/participantes, bem como também não se responsabiliza por materiais de qualquer natureza deixados em suas dependências antes, durante e após o período do evento, e que todo o espaço da solicitação será por mim vistoriado, me comprometendo a procurar 01 (um) servidor da Equipe de Planejamento e Projetos (S/SUBG/CGP/EPP), previamente ao evento, para receber orientações sobre o correto funcionamento dos equipamentos da sala ou sobre como solicitar o apoio técnico da equipe técnica (quando da utilização dos equipamentos de informática e/ou videoconferência).
                </p>
              </div>

              <div className="flex gap-3">
                <span className="text-blue-600 font-semibold">-</span>
                <p>
                  Zelar pela conservação e uso adequado dos equipamentos de informática, tais como câmera portátil, passador de slides, controle do projetor e computador.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="text-blue-600 font-semibold">-</span>
                <p>
                  Estar ciente que é <strong>proibido o consumo de alimentos</strong> na sala, assim como a realização de coffee break, brunch e festividades.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="text-blue-600 font-semibold">-</span>
                <p>
                  Qualquer incidente que ocorrer, em função de imperícia ou omissão, implicará em <strong>suspensão do direito de realizar reservas</strong> de salas ou auditórios por parte do responsável e do setor a qual ele pertença, até a conclusão do respectivo procedimento administrativo de apuração.
                </p>
              </div>

              <div className="flex gap-3">
                <span className="text-blue-600 font-semibold">-</span>
                <p>
                  <strong>Autorizar o uso de imagem e gravação:</strong> Declaro ciência e concordância com a realização de gravações e captação de imagens por meio da câmera instalada no auditório para registro e controle, estando ciente de que as imagens poderão ser armazenadas e utilizadas pela Secretaria Municipal de Saúde para fins institucionais e de controle de suas dependências, respeitando as normas da <strong>Lei 13.709/18 (Lei Geral de Proteção de Dados Pessoais)</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox de concordância */}
          <div className="flex items-start gap-3 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="aceitar-termos"
              checked={checkTermos}
              onChange={(e) => setCheckTermos(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="aceitar-termos" className="text-sm text-gray-700 cursor-pointer select-none">
              Li e concordo com todos os <strong>Termos de Uso</strong> acima descritos, comprometendo-me a cumpri-los integralmente.
            </label>
          </div>

          <AlertDialogFooter className="pt-4 flex justify-center gap-6">
            <ButtonCustomPopup
              onClick={() => {
                setMostrarTermos(false);
                setCheckTermos(false);
              }}
              className="min-w-[140px]"
            >
              <X strokeWidth={1.5} />
              Cancelar
            </ButtonCustomPopup>
            
            <ButtonCustomPopup
              onClick={continuarAposTermos}
              disabled={!checkTermos}
              className={`min-w-[200px] ${!checkTermos ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Check strokeWidth={1.5} className="h-4 w-4" />
              Aceitar e Continuar
            </ButtonCustomPopup>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para Confirmação */}
      <AlertDialog open={alertAberto} onOpenChange={setAlertAberto}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertTipo === 'conflito'
                ? 'Horário com Conflito'
                : 'Horário Indisponível'}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-gray-600">
              {alertTipo === 'conflito' ? (
                'Este horário já foi reservado por um agendamento aprovado. Sua solicitação entrará na lista de agendamentos pendentes, podendo ser aprovada posteriormente caso o agendamento aprovado seja cancelado. Deseja continuar?'
              ) : alertTipo === 'horario-invalido' ? (
                'A sala selecionada não funciona no dia da semana escolhido. Por favor, selecione outra data ou outra sala.'
              ) : (
                'O horário selecionado está fora do horário de funcionamento da sala. Por favor, verifique os horários disponíveis e ajuste sua solicitação.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Botões customizados no footer */}
          <AlertDialogFooter className="pt-4 flex justify-center gap-6">
            {(alertTipo === 'horario-invalido' || alertTipo === 'horario-fora-funcionamento') ? (
              <ButtonCustomPopup
                onClick={() => {
                  setAlertAberto(false);
                  setDadosAgendamento(null);
                }}
              >
                <Check strokeWidth={1.5} />
                Entendi
              </ButtonCustomPopup>
            ) : (
              <>
                <ButtonCustomPopup
                  onClick={() => {
                    setAlertAberto(false);
                    setDadosAgendamento(null);
                  }}
                >
                  <X strokeWidth={1.5} />
                  Cancelar
                </ButtonCustomPopup>

                <ButtonCustomPopup onClick={confirmarAgendamento}>
                  <Check strokeWidth={1.5} />
                  Confirmar
                </ButtonCustomPopup>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para Sucesso/Erro */}
      <AlertDialog open={alertSucessoErro} onOpenChange={setAlertSucessoErro}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {tipoAlertSucessoErro === 'sucesso' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Sucesso
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  Erro
                </>
              )}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-gray-600">
              {mensagemAlertSucessoErro}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="pt-4 flex justify-center">
            <ButtonCustomPopup
              onClick={() => setAlertSucessoErro(false)}
              className="min-w-[140px]"
            >
              <Check strokeWidth={1.5} />
              OK
            </ButtonCustomPopup>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
