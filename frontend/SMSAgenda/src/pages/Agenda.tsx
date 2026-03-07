import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  FileText,
  Circle,
  CalendarClock,
  CalendarCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AgendaSkeleton } from "@/components/agenda-skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ButtonCustomOutline } from "@/components/button-custom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import api from "@/services/api";
import { cookieUtils } from "@/lib/auth/cookie-utils";
import { getTokenInfo } from "@/lib/auth/auth";
import { ptBR } from "date-fns/locale";

// Tipos do DTO que vem do backend
interface AgendamentoDTO {
  id: number;
  titulo: string;
  data: string; // ISO string
  horaInicio: string; // "HH:mm:ss"
  horaFim: string; // "HH:mm:ss"
  descricao: string;
  salaId: number;
  solicitanteId: number;
  solicitanteNome: string;
  status: number;
}

interface SalaDTO {
  id: number;
  nome: string;
  capacidade: number;
  descricaoEquipamentos: string;
  disponivel: boolean;
  imagemBase64: string;
  horariosDisponiveis: any[];
}

// Tipo usado no frontend
interface Agendamento {
  id: number;
  sala: string;
  data: Date;
  horario_inicio: string;
  horario_fim: string;
  duracao: number;
  titulo: string;
  descricao: string;
  ehMeu: boolean;
}

// Horários de 9h às 17h (8 horas = 32 intervalos de 15min)
const horarios = [
  "09:00",
  "09:15",
  "09:30",
  "09:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
  "11:15",
  "11:30",
  "11:45",
  "12:00",
  "12:15",
  "12:30",
  "12:45",
  "13:00",
  "13:15",
  "13:30",
  "13:45",
  "14:00",
  "14:15",
  "14:30",
  "14:45",
  "15:00",
  "15:15",
  "15:30",
  "15:45",
  "16:00",
  "16:15",
  "16:30",
  "16:45",
  "17:00",
  "17:15",
  "17:30",
  "17:45",
];

// Configuração de cores das salas
const CORES_SALAS: Record<string, { bg: string; border: string; circle: string }> = {
  "810": {
    bg: "bg-gray-50",
    border: "border-[#A4C2F4]",
    circle: "fill-[#A4C2F4] stroke-[#A4C2F4]"
  },
  "601": {
    bg: "bg-gray-50",
    border: "border-[#B6D7A8]",
    circle: "fill-[#B6D7A8] stroke-[#B6D7A8]"
  },
  "Lab. de Informática": {
    bg: "bg-gray-50",
    border: "border-[#D5A6BD]",
    circle: "fill-[#D5A6BD] stroke-[#D5A6BD]"
  },
  default: {
    bg: "bg-gray-50",
    border: "border-gray-500",
    circle: "fill-gray-700 stroke-gray-700"
  }
};

export default function Agenda() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      const savedMillis = typeof window !== 'undefined' ? window.sessionStorage.getItem('agenda:selectedDate') : null;
      if (savedMillis) {
        const d = new Date(Number(savedMillis));
        d.setHours(0, 0, 0, 0);
        return d;
      }
    } catch {}
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedFormat, setSelectedFormat] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.sessionStorage.getItem('agenda:selectedFormat') : null;
      if (saved === 'Dia' || saved === 'Semana' || saved === 'Mês') return saved;
    } catch {}
    return "Dia";
  });
  const [salasSelecionadas, setSalasSelecionadas] = useState<string[]>([]);
  const [todasAsSalas, setTodasAsSalas] = useState<string[]>([]);
  const [salasMap, setSalasMap] = useState<{ [key: number]: string }>({});
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // abrir o calendario na view do dia da agenda
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [agendamentosCache, setAgendamentosCache] = useState<Agendamento[]>([]);
  const [cacheRange, setCacheRange] = useState<{ inicio: Date | null; fim: Date | null }>({ inicio: null, fim: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // Permissão atual do usuário
  const token = cookieUtils.getCookie('auth_token');
  const tokenInfo = token ? getTokenInfo(token) : null;
  const permissaoNum = tokenInfo?.permissao != null ? Number(tokenInfo.permissao) : null;
  // Mapeamento de permissões: 1=Admin, 2/3=Solicitante, 4/5=Viewer
  const isAdmin = permissaoNum === 1;
  const isSolicitante = permissaoNum === 2 || permissaoNum === 3;
  const isViewer = permissaoNum === 4 || permissaoNum === 5;
  
  const isRestrito = isSolicitante || isViewer;

  // Buscar salas ativas da API
  useEffect(() => {

    const buscarSalas = async () => {

      try {

        const response = await api.get<SalaDTO[]>('/Sala/ativas');
        const salasNomes = response.data.map(sala => sala.nome);
        const salasMapping = response.data.reduce((acc, sala) => {
          acc[sala.id] = sala.nome;
          return acc;
        }, {} as { [key: number]: string });
        
        setTodasAsSalas(salasNomes);
        setSalasMap(salasMapping);
        setSalasSelecionadas(salasNomes); // Selecionar todas por padrão
      } catch (error) {
        setTodasAsSalas([]);
        setSalasMap({});
      }
    };

    buscarSalas();
  }, []);

  // Persistência local: salvar formato e data ao mudar
  useEffect(() => {
    try {
      window.sessionStorage.setItem('agenda:selectedFormat', selectedFormat);
    } catch {}
  }, [selectedFormat]);

  useEffect(() => {
    try {
      const millis = selectedDate.getTime();
      window.sessionStorage.setItem('agenda:selectedDate', String(millis));
    } catch {}
  }, [selectedDate]);

  // Evitar scroll horizontal nesta página (como em AprovarAgendamentos)
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflowX;
    html.style.overflowX = "hidden";
    return () => {
      html.style.overflowX = prev;
    };
  }, []);

  // Função para converter o DTO do backend para o formato do frontend
  const converterAgendamentoDTO = (dto: AgendamentoDTO, ehMeu: boolean): Agendamento => {
    // Converter a data ISO para data local (sem considerar timezone)
    const dataISO = dto.data.split('T')[0]; // Pega apenas "2025-11-03"
    const [ano, mes, dia] = dataISO.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia); // Cria data local
    
    // Extrair apenas HH:mm do horaInicio (ignorar segundos)
    const horaInicioPartes = dto.horaInicio.split(":");
    const horaInicioH = horaInicioPartes[0];
    const horaInicioM = horaInicioPartes[1];
    
    const horaFimPartes = dto.horaFim.split(":");
    const horaFimH = horaFimPartes[0];
    const horaFimM = horaFimPartes[1];

    // Calcular duração em minutos
    const inicioMinutos = parseInt(horaInicioH) * 60 + parseInt(horaInicioM);
    const fimMinutos = parseInt(horaFimH) * 60 + parseInt(horaFimM);
    const duracao = fimMinutos - inicioMinutos;

    // Visualizadores (permissão 4) veem todas reuniões como "Reunião Marcada"
    const tituloExibido = isViewer ? 'Reunião Marcada' : dto.titulo;
    const descricaoExibida = isViewer ? '' : dto.descricao;

    const agendamento = {
      id: dto.id,
      sala: salasMap[dto.salaId] || `SALA ${dto.salaId}`,
      data: data,
      horario_inicio: `${horaInicioH.padStart(2, '0')}:${horaInicioM.padStart(2, '0')}`,
      horario_fim: `${horaFimH.padStart(2, '0')}:${horaFimM.padStart(2, '0')}`,
      duracao: duracao,
      titulo: tituloExibido,
      descricao: descricaoExibida,
      ehMeu,
    };

    return agendamento;
  };

  // Função para formatar data no formato ISO com timezone
  const formatarDataISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00-03:00`;
  };

  // Função para calcular o range de datas baseado no formato
  const calcularRangeDatas = (date: Date, formato: string): { dataInicio: string; dataFim: string } => {
    if (formato === "Dia") {
      // Mesmo dia para início e fim
      const dataInicio = formatarDataISO(date);
      const dataFim = formatarDataISO(date);
      return { dataInicio, dataFim };
    } else if (formato === "Semana") {
      // Segunda a sexta da semana
      const current = new Date(date);
      current.setHours(0, 0, 0, 0);
      
      // Encontrar a segunda-feira
      const dayOfWeek = current.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      current.setDate(current.getDate() + diff);
      
      const segunda = new Date(current);
      const sexta = new Date(current);
      sexta.setDate(sexta.getDate() + 4);
      
      return {
        dataInicio: formatarDataISO(segunda),
        dataFim: formatarDataISO(sexta)
      };
    } else {
      // Mês completo (dia 1 ao último dia do mês)
      const primeiroDia = new Date(date.getFullYear(), date.getMonth(), 1);
      const ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      return {
        dataInicio: formatarDataISO(primeiroDia),
        dataFim: formatarDataISO(ultimoDia)
      };
    }
  };

  // Buscar agendamentos aprovados da API com cache inteligente
  useEffect(() => {
    const buscarAgendamentos = async (forcarBusca = false) => {
      // Verificar se os dados necessários já estão no cache
      const { dataInicio, dataFim } = calcularRangeDatas(selectedDate, selectedFormat);
      const dataInicioDate = new Date(dataInicio);
      const dataFimDate = new Date(dataFim);
      
      // Se temos cache e os dados estão dentro do range, usar cache
      const dentroDoCache = cacheRange.inicio && cacheRange.fim && 
        dataInicioDate >= cacheRange.inicio && 
        dataFimDate <= cacheRange.fim;
      
      if (dentroDoCache && !forcarBusca) {
        // Filtrar dados do cache
        const agendamentosFiltrados = agendamentosCache.filter(a => {
          return a.data >= dataInicioDate && a.data <= dataFimDate;
        });
        setAgendamentos(agendamentosFiltrados);
        
        // Desliga loading inicial se ainda estiver ativo
        if (isInitialLoading) {
          setIsInitialLoading(false);
        }
        return;
      }
      
      // Se não for o carregamento inicial, mostra loading normal
      if (!isInitialLoading) {
        setIsLoading(true);
      }
      
      try {
        // Buscar um range maior para cache (30 dias antes e 30 dias depois)
        const hoje = new Date(selectedDate);
        hoje.setHours(0, 0, 0, 0);
        
        const cacheInicio = new Date(hoje);
        cacheInicio.setDate(cacheInicio.getDate() - 30);
        
        const cacheFim = new Date(hoje);
        cacheFim.setDate(cacheFim.getDate() + 30);
        
        const cacheDataInicio = formatarDataISO(cacheInicio);
        const cacheDataFim = formatarDataISO(cacheFim);
        
        // Fazer requisição com parâmetros de data
        const response = await api.get<any>(`/Agendamento/aprovados`, {
          params: {
            dataInicio: cacheDataInicio,
            dataFim: cacheDataFim
          }
        });
        const payload = response?.data;

        // Montar lista com propriedade de posse (meus/outros)
        type WithOwner = { dto: AgendamentoDTO, ehMeu: boolean };
        let itemsWithOwner: WithOwner[] = [];
        if (Array.isArray(payload)) {
          itemsWithOwner = payload.map((dto: AgendamentoDTO) => ({ dto, ehMeu: true }));
        } else if (payload && typeof payload === 'object') {
          const meus = Array.isArray(payload.meus) ? payload.meus : [];
          const outros = Array.isArray(payload.outros) ? payload.outros : [];
          const outrosNormalizados = outros.map((o: any) => ({
            id: o.id,
            titulo: `Reunião Marcada`,
            data: o.data,
            horaInicio: o.horaInicio,
            horaFim: o.horaFim,
            descricao: "",
            salaId: o.salaId,
            solicitanteId: 0,
            solicitanteNome: "",
            status: o.status,
          }));
          itemsWithOwner = [
            ...meus.map((dto: AgendamentoDTO) => ({ dto, ehMeu: true })),
            ...outrosNormalizados.map((dto: AgendamentoDTO) => ({ dto, ehMeu: false })),
          ];
        }

        const agendamentosConvertidos = itemsWithOwner.map(({ dto, ehMeu }) => converterAgendamentoDTO(dto, ehMeu));
        
        // Salvar no cache
        setAgendamentosCache(agendamentosConvertidos);
        setCacheRange({ inicio: cacheInicio, fim: cacheFim });
        
        // Filtrar para a visualização atual
        const agendamentosFiltrados = agendamentosConvertidos.filter(a => {
          return a.data >= dataInicioDate && a.data <= dataFimDate;
        });
        setAgendamentos(agendamentosFiltrados);
      } catch (error) {
        setAgendamentos([]);
        setAgendamentosCache([]);
        setCacheRange({ inicio: null, fim: null });
      } finally {
        setIsLoading(false);
        // Desliga o loading inicial após a primeira busca de agendamentos completar
        if (isInitialLoading) {
          setIsInitialLoading(false);
        }
      }
    };

    // Só busca agendamentos se já tiver o salasMap carregado
    if (Object.keys(salasMap).length > 0 || !isInitialLoading) {
      buscarAgendamentos();
    }
  }, [salasMap, selectedDate, selectedFormat, isInitialLoading, agendamentosCache, cacheRange]);  const toggleSala = (sala: string) => {
    setSalasSelecionadas((prev) =>
      prev.includes(sala) ? prev.filter((s) => s !== sala) : [...prev, sala]
    );
  };

  const toggleTodasSalas = () => {
    if (salasSelecionadas.length === todasAsSalas.length) {
      setSalasSelecionadas([]);
    } else {
      setSalasSelecionadas([...todasAsSalas]);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };
  useEffect(() => {
    // Não mostra 'Nenhuma sala selecionada' durante o carregamento inicial
    if (!isInitialLoading) {
      if (salasSelecionadas.length === 0) {
        setSalasSelecionadas(["Nenhuma sala selecionada"]);
      } else if (
        salasSelecionadas.includes("Nenhuma sala selecionada") &&
        salasSelecionadas.length > 1
      ) {
        setSalasSelecionadas((prev) =>
          prev.filter((s) => s !== "Nenhuma sala selecionada")
        );
      }
    }
  }, [salasSelecionadas, isInitialLoading]);

  const previousDay = () => {
    if (selectedFormat === "Semana") {
      setSelectedDate(
        new Date(selectedDate.setDate(selectedDate.getDate() - 7))
      );
    } else {
      setSelectedDate(
        new Date(selectedDate.setDate(selectedDate.getDate() - 1))
      );
    }
  };

  const nextDay = () => {
    if (selectedFormat === "Semana") {
      setSelectedDate(
        new Date(selectedDate.setDate(selectedDate.getDate() + 7))
      );
    } else {
      setSelectedDate(
        new Date(selectedDate.setDate(selectedDate.getDate() + 1))
      );
    }
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar o horário
    setSelectedDate(today);
  };

  const handleOpenDescricao = (agendamento: any) => {
        navigate(`/descricao_agendamento/${agendamento.id}`);
  };

  const getWeekDays = (date: Date) => {
    const days = [];
    const current = new Date(date);
    // Zerar o horário para comparação correta
    current.setHours(0, 0, 0, 0);

    // Encontrar a segunda-feira da semana
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Se domingo, voltar 6 dias, senão voltar para segunda
    current.setDate(current.getDate() + diff);

    // Adicionar segunda a sexta (5 dias)
    for (let i = 0; i < 5; i++) {
      const dayToAdd = new Date(current);
      dayToAdd.setHours(0, 0, 0, 0); // Garantir que cada dia esteja com horário zerado
      days.push(dayToAdd);
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const formatWeekDayHeader = (date: Date, week: boolean) => {
    // Retorna formato tipo 'SEG 3/1'
    const diasSemana = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
    const diaSemana = diasSemana[date.getDay()];
    const dia = date.getDate();
    const mes = date.getMonth() + 1;
    if (week) {
      return `${diaSemana} ${dia}/${mes}`;
    } else {
      return `${diaSemana}`;
    }
  };

  const getAgendamentoStyle = (sala: string) => {
    const cores = CORES_SALAS[sala] || CORES_SALAS.default;
    return `${cores.bg} border-l-4 ${cores.border}`;
  };

  const getAgendamentoHeight = (duracao: number) => {
    return (duracao / 15) * 21;
  };

  // Helpers para grid mensal
  interface CalendarDay {
    date: Date;
    inCurrentMonth: boolean;
  }

  const getMonthWorkDays = (date: Date): (CalendarDay | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth(); // mês atual
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (CalendarDay | null)[] = [];

    // Dias do mês anterior para preencher o início
    const startWeekDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    if (startWeekDay > 0) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startWeekDay; i > 0; i--) {
        const day = new Date(year, month - 1, prevMonthLastDay - (i - 1));
        const dow = day.getDay();
        days.push(
          dow === 0 || dow === 6 ? null : { date: day, inCurrentMonth: false }
        );
      }
    }

    // Dias do mês atual
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const day = new Date(year, month, d);
      const dow = day.getDay();
      days.push(
        dow === 0 || dow === 6 ? null : { date: day, inCurrentMonth: true }
      );
    }

    // Dias do mês seguinte para completar a última semana
    let nextDay = 1;
    while (days.length % 7 !== 0) {
      const day = new Date(year, month + 1, nextDay);
      const dow = day.getDay();
      days.push(
        dow === 0 || dow === 6 ? null : { date: day, inCurrentMonth: false }
      );
      nextDay++;
    }

    return days;
  };

  const previousMonth = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };
  const nextMonth = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Grid de agenda */}
      <div className="flex-1 overflow-hidden">
        {/* Header com filtros */}
        <div className="pb-2">
          <div className="flex flex-col gap-3 @3xl:relative @3xl:flex-row @3xl:items-center @3xl:gap-1">
            {/* Linha 1: Filtros à esquerda */}
            <div className="flex flex-row @3xl:flex-col @5xl:flex-row gap-2 justify-center @5xl:justify-start flex-wrap">
              <Button
                onClick={goToToday}
                className="flex-1 @3xl:w-[140px] @5xl:w-20 bg-white border hover:bg-(--azul-claro) cursor-pointer hover:text-white border-(--azul-claro)! text-(--azul-claro)"
              >
                <CalendarCheck className="h-4 w-4 mr-1" />
                Hoje
              </Button>

              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="flex-1 @3xl:w-[140px] @5xl:w-[120px] cursor-pointer bg-white font-medium border-(--azul-claro)! text-(--azul-claro)">
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent className="bg-white min-w-[120px] font-medium border-(--azul-claro)! text-(--azul-claro)">
                  <SelectItem value="Dia">Dia</SelectItem>
                  <SelectItem value="Semana">Semana</SelectItem>
                  <SelectItem value="Mês">Mês</SelectItem>
                </SelectContent>
              </Select>

              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 @3xl:w-[140px] @5xl:w-[140px] justify-between cursor-pointer border-(--azul-claro)! text-(--azul-claro)"
                  >
                    <span className="text-sm ">
                      {salasSelecionadas.length === 0
                        ? "Selecione salas"
                        : salasSelecionadas.length === todasAsSalas.length
                        ? "Todas as salas"
                        : `${salasSelecionadas.length} sala${
                            salasSelecionadas.length > 1 ? "s" : ""
                          }`}
                    </span>
                    <ChevronLeft className="h-4 w-4 opacity-50 -rotate-90" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[140px] bg-white font-medium border-(--azul-claro)! text-(--azul-claro) p-3"
                  align="start"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="todas"
                        checked={
                          salasSelecionadas.length === todasAsSalas.length
                        }
                        onCheckedChange={toggleTodasSalas}
                      />
                      <label
                        htmlFor="todas"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Todas as salas
                      </label>
                    </div>
                    {todasAsSalas.map((sala) => (
                      <div key={sala} className="flex items-center space-x-2">
                        <Checkbox
                          id={sala}
                          checked={salasSelecionadas.includes(sala)}
                          onCheckedChange={() => toggleSala(sala)}
                        />
                        <label
                          htmlFor={sala}
                          className="text-sm leading-none cursor-pointer"
                        >
                          {sala}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Linha 2: Navegação de data no centro */}
            <div className="flex items-center justify-center gap-2 @3xl:absolute @3xl:left-1/2 @3xl:transform @3xl:-translate-x-1/2">
              {selectedFormat === "Mês" ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={previousMonth}
                    className="h-8 w-8 shrink-0"
                  >
                    <ChevronLeft className="h-6! w-6! stroke-(--azul-claro)" />
                  </Button>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <div className="text-center h-10 min-w-[150px] text-(--azul-claro) cursor-pointer hover:bg-gray-100 rounded-t-lg transition-colors relative 
                        after:absolute 
                        after:left-0 
                        after:bottom-0 
                        after:h-[2px]
                        after:w-full 
                        after:bg-current 
                        after:scale-x-0 
                        after:origin-left 
                        after:transition-transform 
                        after:duration-200 
                        hover:after:scale-x-100">

                        <div className="text-md font-semibold relative bottom-1">
                          Mês
                        </div>
                        <div className="text-sm relative bottom-1 truncate px-2">
                            
                          {selectedDate.toLocaleDateString("pt-BR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="center">
                      <Calendar
                        disabled={(date) => { return date.getDay() === 0 || date.getDay() === 6 }} // Desabilitar sábados e domingos
                        locale={ptBR}
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date);
                            setIsCalendarOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextMonth}
                    className="h-8 w-8 shrink-0"
                  >
                    <ChevronRight className="h-6! w-6! stroke-(--azul-claro)" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={previousDay}
                    className="h-8 w-8 shrink-0"
                  >
                    <ChevronLeft className="h-6! w-6! stroke-(--azul-claro)" />
                  </Button>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <div className="text-center h-10 min-w-[150px] text-(--azul-claro) cursor-pointer hover:bg-gray-100 rounded-t-lg transition-colors relative
                        after:absolute 
                        after:left-0 
                        after:bottom-0 
                        after:h-[2px]
                        after:w-full 
                        after:bg-current 
                        after:scale-x-0 
                        after:origin-left 
                        after:transition-transform 
                        after:duration-200 
                        hover:after:scale-x-100">

                        <div className="text-md font-semibold relative bottom-1">
                          {selectedFormat}
                        </div>
                        <div className="text-sm relative bottom-1 truncate px-2 relative">
                            
                          {selectedFormat === "Semana"
                            ? (() => {
                                const weekDays = getWeekDays(selectedDate);
                                const start = weekDays[0];
                                const end = weekDays[weekDays.length - 1];
                                return `${start.toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                })} - ${end.toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}`;
                              })()
                            : formatDate(selectedDate)}
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="center">
                      <Calendar
                        disabled={(date) => { return date.getDay() === 0 || date.getDay() === 6 }} // Desabilitar sábados e domingos
                        locale={ptBR}
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date);
                            setIsCalendarOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextDay}
                    className="h-8 w-8 shrink-0"
                  >
                    <ChevronRight className="h-6! w-6! stroke-(--azul-claro)" />
                  </Button>
                </>
              )}
            </div>

            {/* Linha 3: Botão de novo agendamento à direita */}
            {!isViewer && (
              <div className="flex justify-center @3xl:justify-end @3xl:ml-auto w-full @3xl:w-auto">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Botão com texto completo em mobile e desktop grande, apenas ícone em desktop médio */}
                      <ButtonCustomOutline 
                        className="w-full max-w-[280px] @3xl:w-auto @3xl:max-w-none @3xl:min-w-0 @3xl:px-3 @[930px]:min-w-[200px] @[930px]:px-4"
                        onClick={() => navigate('/novo_agendamento')}
                      >
                        <Plus strokeWidth={1.5} className="mr-2 @3xl:mr-0 @[930px]:mr-2" />
                        <span className="inline @3xl:hidden @[930px]:!inline">Novo agendamento</span>
                      </ButtonCustomOutline>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="hidden md:block min-[930px]:hidden bg-white mt-1 mr-1">
                      <p>Novo agendamento</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
        <div className="h-full overflow-y-auto overflow-x-hidden">
          {(isLoading || isInitialLoading) ? (
            <AgendaSkeleton formato={selectedFormat} selectedDate={selectedDate} />
          ) : selectedFormat === "Dia" ? (
            // Visualização DIA
            <div
              className="grid gap-0 bg-white rounded-[23px] shadow-sm border border-gray-200"
              style={{
                gridTemplateColumns: `40px repeat(${salasSelecionadas.length}, 1fr)`,
              }}
            >
              {/* Header das salas */}
              <div className="sticky top-0 bg-gray-50 border-gray-300 p-2 font-medium text-gray-600 z-5 rounded-tl-[23px]"></div>
              {salasSelecionadas.map((sala, index) => (
                <div
                  key={sala}
                  className={`sticky top-0 bg-gray-100 border-gray-300 p-1 text-center font-medium z-5 h-10 flex items-center justify-center ${
                    index === salasSelecionadas.length - 1
                      ? "rounded-tr-[23px]"
                      : ""
                  }`}
                  style={{ color: "#555555" }}
                >
                  {sala}
                </div>
              ))}

              {/* Grid de horários */}

              {horarios.map((horario, idx) => (
                <>
                  {/* Coluna de horários */}
                  <div
                    key={`time-${horario}`}
                    className={`border-r border-gray-200 px-1 py-0.5 text-xs w-10 text-gray-400 text-right ${
                      idx % 4 === 0
                        ? "border-t border-gray-300 font-semibold"
                        : "border-t border-gray-100"
                    }`}
                    style={{ minHeight: "21px", height: "21px" }}
                  >
                    {idx % 4 === 0 ? horario : ""}
                  </div>
                  {/* Células para cada sala */}
                  {salasSelecionadas.map((sala, index) => {
                    // Converter horário do grid para minutos
                    const [gridHora, gridMin] = horario.split(':').map(Number);
                    const gridMinutos = gridHora * 60 + gridMin;
                    
                    const agendamentosNaCelula = agendamentos.filter((a) => {
                      if (a.sala !== sala || !isSameDay(a.data, selectedDate)) {
                        return false;
                      }
                      
                      // Converter horário do agendamento para minutos
                      const [agendHora, agendMin] = a.horario_inicio.split(':').map(Number);
                      const agendMinutos = agendHora * 60 + agendMin;
                      
                      // Verificar se o agendamento começa neste intervalo de 15 minutos
                      return agendMinutos >= gridMinutos && agendMinutos < gridMinutos + 15;
                    });
                    
                    return (
                      <div
                        key={`${sala}-${horario}`}
                        className={`border-r border-gray-200 relative ${
                          idx % 4 === 0
                            ? "border-t border-gray-300"
                            : "border-t border-gray-100"
                        } ${
                          idx % 35 === 0 &&
                          idx !== 0 &&
                          index === salasSelecionadas.length - 1
                            ? "rounded-br-[23px]"
                            : ""
                        }
                        hover:bg-blue-50 transition-colors`}
                        style={{ minHeight: "20px", height: "20px" }}
                      >
                        {agendamentosNaCelula.map((agendamento) => {
                          // Visualizadores não podem clicar em nada; solicitantes só clicam nos seus
                          const isClickable = !isViewer && !(isRestrito && !agendamento.ehMeu);
                          const Wrapper: any = isClickable ? 'button' : 'div';
                          const wrapperProps: any = isClickable
                            ? { onClick: () => navigate(`/descricao_agendamento/${agendamento.id}`), className: "w-full cursor-pointer" }
                            : { className: "w-full cursor-default" };
                          return (
                            <Wrapper key={agendamento.id} {...wrapperProps}>
                          <Card
                            key={agendamento.id}
                            className={`absolute left-0.5 right-0.5 p-1 shadow-sm border-0 ${
                              agendamento.duracao <= 30
                                ? "flex flex-row items-center gap-3"
                                : "flex flex-col gap-1"
                            } ${getAgendamentoStyle(agendamento.sala)} ${!isClickable ? 'opacity-100' : ''}`}
                            style={{
                              height: `${getAgendamentoHeight(
                                agendamento.duracao
                              )}px`,
                              minHeight: "19px",
                              zIndex: 2,
                            }}
                          >
                            <div className="text-base font-semibold text-gray-900 mr-auto leading-tight max-w-80 truncate wrap-break-word">
                              {agendamento.titulo}
                            </div>
                            {agendamento.descricao && (
                              <div className="text-sm text-gray-600 flex items-center gap-0.5 leading-tight truncate">
                                <FileText className="h-3 w-3 shrink-0" />
                                <span
                                  className="truncate block max-w-[120px]"
                                  title={agendamento.descricao}
                                >
                                  {agendamento.descricao}
                                </span>
                              </div>
                            )}
                            <div className="text-sm text-gray-500 flex items-center gap-0.5 leading-tight truncate">
                              <Clock className="h-3 w-3" />
                              {agendamento.horario_inicio} - {agendamento.horario_fim} ({agendamento.duracao}min)
                            </div>
                          </Card>
                          </Wrapper>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          ) : selectedFormat === "Semana" ? (
            // Visualização SEMANA
            <div
              className="grid gap-0 bg-white rounded-[23px] shadow-sm border border-gray-200"
              style={{
                gridTemplateColumns: `40px repeat(${
                  getWeekDays(selectedDate).length
                }, 1fr)`,
              }}
            >
              {/* Header dos dias da semana */}
              <div className="sticky top-0 bg-gray-50 border-gray-300 p-2 font-medium text-gray-600 z-5 rounded-tl-[23px]"></div>
              {getWeekDays(selectedDate).map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={`sticky top-0 bg-gray-100 border-gray-300 p-1 text-center font-medium z-5 h-10 flex items-center justify-center ${
                    index === 4 ? "rounded-tr-[23px]" : ""
                  }`}
                  style={{ color: "#555555" }}
                >
                  <div className="text-xs">
                    {formatWeekDayHeader(day, true)}
                  </div>
                </div>
              ))}
              {/* Grid de horários para semana */}
              {horarios.map((horario, idx) => (
                <>
                  {/* Coluna de horários */}
                  <div
                    key={`time-${horario}`}
                    className={`border-r border-gray-200 px-1 py-0.5 text-xs w-10 text-gray-400 text-right ${
                      idx % 4 === 0
                        ? "border-t border-gray-300 font-semibold"
                        : "border-t border-gray-100"
                    }`}
                    style={{ minHeight: "21px", height: "21px" }}
                  >
                    {idx % 4 === 0 ? horario : ""}
                  </div>

                  {/* Células para cada dia da semana */}
                  {getWeekDays(selectedDate).map((day, index) => {
                    // Converter horário do grid para minutos
                    const [gridHora, gridMin] = horario.split(':').map(Number);
                    const gridMinutos = gridHora * 60 + gridMin;
                    
                    const agendamentosNoDia = salasSelecionadas.flatMap((sala) =>
                      agendamentos.filter((a) => {
                        if (a.sala !== sala || !isSameDay(a.data, day)) {
                          return false;
                        }
                        
                        // Converter horário do agendamento para minutos
                        const [agendHora, agendMin] = a.horario_inicio.split(':').map(Number);
                        const agendMinutos = agendHora * 60 + agendMin;
                        
                        // Verificar se o agendamento começa neste intervalo de 15 minutos
                        return agendMinutos >= gridMinutos && agendMinutos < gridMinutos + 15;
                      })
                    );

                    return (
                      <div
                        key={`${day.toISOString()}-${horario}`}
                        className={`border-r border-gray-200 relative ${
                          idx % 4 === 0
                            ? "border-t border-gray-300"
                            : "border-t border-gray-100"
                        } ${
                          idx % 35 === 0 &&
                          idx !== 0 &&
                          index === getWeekDays(selectedDate).length - 1
                            ? "rounded-br-[23px]"
                            : ""
                        } hover:bg-blue-50 cursor-pointer transition-colors`}
                        style={{ minHeight: "20px", height: "20px" }}
                      >
                        {agendamentosNoDia.map((agendamento) => {
                          // Visualizadores não podem clicar em nada; solicitantes só clicam nos seus
                          const isClickable = !isViewer && !(isRestrito && !agendamento.ehMeu);
                          const Wrapper: any = isClickable ? 'button' : 'div';
                          const wrapperProps: any = isClickable
                            ? { onClick: () => navigate(`/descricao_agendamento/${agendamento.id}`), className: "w-full cursor-pointer" }
                            : { className: "w-full cursor-default" };
                          return (
                            <Wrapper key={agendamento.id} {...wrapperProps}>
                          <Card
                            key={agendamento.id}
                            className={`absolute left-0.5 right-0.5 p-1 shadow-sm border-0 ${
                              agendamento.duracao <= 30
                                ? "flex flex-row items-center gap-1 justify-between"
                                : "flex flex-col gap-1"
                            } ${getAgendamentoStyle(agendamento.sala)} `}
                            style={{
                              height: `${getAgendamentoHeight(
                                agendamento.duracao
                              )}px`,
                              minHeight: "19px",
                              zIndex: 2,
                            }}
                          >
                            <div className="text-base font-semibold text-gray-900 mr-auto leading-tight max-w-40 truncate wrap-break-word">
                              {agendamento.titulo}
                            </div>
                            {agendamento.descricao && (
                              <div
                                className="text-sm text-gray-600 max-w-[120px] flex items-center gap-0.5 leading-tight truncate"
                                title={agendamento.descricao}
                              >
                                <FileText className="h-3 w-3 shrink-0" />
                                <span
                                  className="truncate block max-w-[120px]"
                                  title={agendamento.descricao}
                                >
                                  {agendamento.descricao}
                                </span>
                              </div>
                            )}
                            <div className="text-sm text-gray-500 leading-tight mr-auto truncate">
                              {agendamento.sala}
                            </div>
                            <div className="text-sm text-gray-500 leading-tight mr-auto truncate">
                              {agendamento.horario_inicio} - {agendamento.horario_fim}
                            </div>
                          </Card>
                          </Wrapper>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          ) : (
            // Visualização MÊS
            <div
              className="grid gap-0 bg-white rounded-[23px] shadow-sm border border-gray-200 min-w-0 w-full"
              style={{
                gridTemplateColumns: `repeat(${
                  getWeekDays(selectedDate).length
                }, minmax(0, 1fr))`,
              }}
            >
              {getWeekDays(selectedDate).map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={`sticky top-0 bg-gray-100 border-gray-300 text-center font-medium z-5 h-10 flex items-center justify-center min-w-0 ${
                    index === 4 ? "rounded-tr-[23px]" : ""
                  } ${index === 0 ? "rounded-tl-[23px]" : ""}`}
                  style={{ color: "#555555" }}
                >
                  <div className="text-xs truncate px-1">
                    {formatWeekDayHeader(day, false)}
                  </div>
                </div>
              ))}
              {getMonthWorkDays(selectedDate)
                .filter((dayObj) => dayObj !== null)
                .map((dayObj, idx) => {
                  if (!dayObj) return null; // segurança extra

                  const day = dayObj.date;

                  // Filtra os agendamentos do dia atual
                  const agendamentosNoDia = salasSelecionadas.flatMap((sala) =>
                    agendamentos.filter(
                      (a) => a.sala === sala && isSameDay(a.data, day)
                    )
                  );

                  return (
                    <div
                      key={idx}
                      className={`border border-gray-200 p-2 text-center h-37 min-w-0 overflow-hidden ${
                        idx !== 0
                          ? idx % 20 === 0
                            ? "rounded-bl-[20px]"
                            : idx % 24 === 0
                            ? "rounded-br-[20px]"
                            : ""
                          : ""
                      }`}
                      style={{
                        opacity: !dayObj.inCurrentMonth ? 0.4 : 1, // menos opaco se for de outro mês
                      }}
                    >
                      {/* Dia do mês + indicador de hoje */}
                      <div className="text-sm font-medium flex items-center justify-center gap-1">
                        {!isSameDay(day, new Date()) && (
                        <div className="text-sm font-medium">{day.getDate()}</div>
                        )}
                        {isSameDay(day, new Date()) && (
                          <div className="h-5 w-5 bg-(--azul-claro) rounded-full flex items-center justify-center" title="Hoje">
                            <div className="text-white">{day.getDate()}</div>
                          </div>
                        )}
                      </div>
                      {/* Agendamentos (se houver) */}
                      {agendamentosNoDia.length > 0 && (() => {
                        const visibleAgendamentos = agendamentosNoDia.slice(0, 4);
                        return (
                        <div className="mt-1 flex flex-col gap-1">
                          {visibleAgendamentos.map((agendamento, i) => {
                            const cores = CORES_SALAS[agendamento.sala] || CORES_SALAS.default;                          
                            return (
                            <div
                              key={i}
                              className="text-gray-900 text-sm rounded text-left px-1 w-full flex items-center min-w-0 overflow-hidden"
                            >
                              <Circle className={`h-2.5 w-2.5 mr-1 shrink-0 ${cores.circle}`} />
                              {(() => {
                                // Visualizadores não podem clicar em nada; solicitantes só clicam nos seus
                                const isClickable = !isViewer && !(isRestrito && !agendamento.ehMeu);
                                const Wrapper: any = isClickable ? 'button' : 'div';
                                const wrapperProps: any = isClickable
                                  ? { onClick: () => handleOpenDescricao(agendamento), className: "min-w-0 overflow-hidden truncate cursor-pointer" }
                                  : { className: "flex-1 min-w-0 overflow-hidden truncate cursor-default" };
                                return (
                                  <Wrapper {...wrapperProps}>
                                    <span className="truncate inline-block align-top">{agendamento.titulo}</span> ({agendamento.horario_inicio} - {agendamento.horario_fim})
                                  </Wrapper>
                                );
                              })()}
                            </div>
                            );
                          })}
                          {agendamentosNoDia.length > 4 && (
                            <div className="flex pl-2 mt-1">
                              <div className="flex flex-row items-center leading-0 gap-1">
                                <span className="h-1 w-1 bg-gray-500 rounded-full"></span>
                                <span className="h-1 w-1 bg-gray-500 rounded-full"></span>
                                <span className="h-1 w-1 bg-gray-500 rounded-full"></span>
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      })()}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
