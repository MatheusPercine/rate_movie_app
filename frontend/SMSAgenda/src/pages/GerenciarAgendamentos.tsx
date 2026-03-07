"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Search, Info, CalendarX, UserX } from "lucide-react";
import { ButtonCustomPopup } from "@/components/button-custom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import api from "@/services/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon, DoorClosed } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"
import { useDebounce } from "@/hooks/useDebounce";

interface Agendamento {
  id: number;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  descricao: string;
  salaId: number;
  qtd_Participantes: number;
  nomeResponsavel: string;
  emailResponsavel: string;
  celularResponsavel: string;
  status: number;
  // Informações do solicitante (quem solicitou o agendamento) podem vir do backend
  solicitanteId?: number;
  solicitanteNome?: string;
  solicitanteEmail?: string;
  solicitanteSetor?: string;
}

export default function GerenciarAgendamentos() {
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    const [selectedSala, setSelectedSala] = useState("Todas")
    const [selectedStatus, setSelectedStatus] = useState("PENDENTE")
    // const [selectedData, setSelectedData] = useState("Todas")
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1)
    const [salasState, setSalasState] = useState<any[]>([])

    const ItemsPerPage = 10
    // Lista final exibida na tabela (já transformada)
    const [agendamentosState, setAgendamentosState] = useState<any[]>([])
    // Total de páginas (vem do backend)
    const [totalPaginas, setTotalPaginas] = useState(1)
    //agendamentos para interface Agendamento
    const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
    // tick para re-render periódico e expiração em tempo real
    const [nowTick, setNowTick] = useState<number>(() => Date.now());
    
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [confirmAction, setConfirmAction] = useState<"accept" | "reject" | null>(null)
    const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null)

    // cancelamento de agendamento
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

    // fracasso de agendamento
    const [failureOpen, setFailureOpen] = useState(false)
    const [failureTargetId, setFailureTargetId] = useState<number | null>(null)

    // abre modal de confirmação (action: 'accept' | 'reject', id: id do agendamento)
    // Verificação de conflito de horário com agendamentos APROVADOS na mesma sala/data
    const [conflictOpen, setConflictOpen] = useState(false)
    const [conflictMessage, setConflictMessage] = useState<string>("")
    // Verificação de respeito a regra "Entre um agendamento e outro deve ter um intervalo mínimo de 30 minutos."
    const [intervalConflictOpen, setIntervalConflictOpen] = useState(false)
    const [intervalConflictMessage, setIntervalConflictMessage] = useState<string>("")


    // Verifica se a data/hora do agendamento já passou
    const isExpired = (dateStr?: string, timeStr?: string, nowMs?: number) => {
        if (!dateStr || !timeStr) return false
        const agDate = parseDateString(dateStr)
        if (!agDate) {
            console.warn('[isExpired] Falha ao parsear data:', dateStr)
            return false
        }
        
        const [hh, mm] = timeStr.slice(0, 5).split(":").map(Number)
        if (Number.isNaN(hh) || Number.isNaN(mm)) {
            console.warn('[isExpired] Falha ao parsear hora:', timeStr)
            return false
        }
        
        agDate.setHours(hh, mm, 0, 0)
        const nowVal = nowMs ?? Date.now()
        const expired = agDate.getTime() < nowVal
        // console.log('[isExpired]', dateStr, timeStr, '→', expired, 'agDate:', agDate, 'now:', new Date(nowVal))
        return expired
    }

    const openConfirm = (action: "accept" | "reject", id: number) => {
        // Bloqueia ações para agendamentos cujo início já passou
        try {
            const item = agendamentosState.find((a) => a.id === id)
            if (item && isExpired(item.data, item.horaInicio)) {
                alert('Não é possível aprovar/recusar. O horário de início do agendamento já passou.')
                return
            }
        } catch {}
        setConfirmAction(action)
        setConfirmTargetId(id)
        setConfirmOpen(true)
    }

    const formatDateDisplay = (iso: string) => {
        if (!iso) return "";
        const d = new Date(iso);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };
    const formatHora = (h: string) => h ? h.substring(0,5) : "";

    // confirma ação: chama API (aprovar/recusar)
    const handleConfirm = async () => {
    if (confirmTargetId == null || !confirmAction) return

        // Verifica em tempo real se o agendamento expirou (dupla proteção)
        try {
            const item = agendamentosState.find((a) => a.id === confirmTargetId)
            if (item && isExpired(item.data, item.horaInicio)) {
                alert('Não é possível aprovar/recusar. O horário de início do agendamento já passou.')
                setConfirmOpen(false)
                setConfirmAction(null)
                setConfirmTargetId(null)
                return
            }
        } catch {}
        
        // Salva valores antes de limpar o estado
        const targetId = confirmTargetId
        const action = confirmAction

        // Fecha modal IMEDIATAMENTE para dar feedback visual rápido
        setConfirmOpen(false)
        setConfirmAction(null)
        setConfirmTargetId(null)

        try {
            if (action === "accept") {
                await handleAprovar(targetId)
            } else if (action === "reject") {
                await handleRecusar(targetId)
            }
        } catch (error) {
            console.error("Erro ao confirmar ação:", error)
            alert("Erro ao confirmar ação. Tente novamente.")
        }
    }

    // cancela modal
    const handleCancel = () => {
        setConfirmOpen(false)
        setConfirmAction(null)
        setConfirmTargetId(null)
    }


    const handleOpenDescricao = (ag: any) => {
        navigate(`/descricao_agendamento/${ag.id}`);
    };

    // Status label util (moved out of effect for reuse by concurrency guards)
    const statusLabel = (s: number) => {
        switch (s) {
            case 0: return "PENDENTE";
            case 1: return "APROVADO";
            case 2: return "RECUSADO";
            case 3: return "CANCELADO";
            case 4: return "EXPIRADO";
            case 5: return "FRACASSADO";
            default: return "DESCONHECIDO";
        }
    };

    
    // Buscar salas do backend, conexão front-back
    useEffect(() => {
        const fetchSalas = async () => {
            try {
                // baseURL já é '/api', então aqui usamos apenas '/Sala'
                const response = await api.get("/Sala")
                setSalasState(response.data)
            } catch (error) {
                console.error("Erro ao buscar Salas:", error)
            }
        }

        fetchSalas()
    }, [])

    // Converter status de label para número
    const statusToNumber = (statusLabel: string): number | null => {
        switch (statusLabel) {
            case "PENDENTE": return 0;
            case "APROVADO": return 1;
            case "RECUSADO": return 2;
            case "CANCELADO": return 3;
            case "EXPIRADO": return 4;
            case "FRACASSADO": return 5;
            case "Todos": return null;
            default: return null;
        }
    };

    // Buscar agendamentos com paginação server-side
    useEffect(() => {
        const fetchAgendamentos = async () => {
            try {
                const statusNum = statusToNumber(selectedStatus);
                const res = await api.get("/Agendamento/todos-agendamentos", {
                    params: {
                        limite: 360,
                        tamPag: ItemsPerPage,
                        pagina: currentPage,
                        status: statusNum,
                        buscaNome: debouncedSearchTerm || undefined
                    }
                });
                
                // Backend retorna { data: [...], total: 10, pagina: 1, totalPaginas: 2 }
                const responseData = res?.data?.data ?? [];
                const totalPags = res?.data?.totalPaginas ?? 1;
                
                console.log("[DEBUG] /Agendamento página:", currentPage, "total páginas:", totalPags, responseData);
                
                // Transformar dados para exibição
                const mapped = responseData.map((a: any) => ({
                    id: a.id,
                    titulo: a.titulo ?? `Agendamento ${a.id}`,
                    descricao: a.descricao ?? "",
                    data: new Date(a.data).toLocaleDateString("pt-BR"),
                    horaInicio: a.horaInicio?.slice(0, 5) ?? "",
                    horaFim: a.horaFim?.slice(0, 5) ?? "",
                    status: statusLabel(a.status),
                    solicitante: { nome: a.solicitanteNome ?? "—" },
                    sala: {
                        nome: salasState.find((s: any) => s.id === a.salaId)?.nome ?? String(a.salaId ?? "N/A"),
                    },
                    rawStatus: a.status,
                    rawId: a.id,
                }));
                
                setAgendamentosState(mapped);
                setTotalPaginas(totalPags);
            } catch (error) {
                console.error("Erro ao buscar Agendamentos:", error);
            }
        };
        if (salasState.length > 0) {
            fetchAgendamentos();
        }
    }, [currentPage, selectedStatus, salasState, debouncedSearchTerm]);

    // Tick a cada 30s para atualizar visual
    useEffect(() => {
        const id = setInterval(() => setNowTick(Date.now()), 30000)
        return () => clearInterval(id)
    }, [])



    // =============================
    // APROVAR / RECUSAR
    // =============================
    const updateStatus = async (id: number, newStatusCode: number, newStatusLabel: string, revertStatusCode: number, revertStatusLabel: string) => {
        // otimista
        setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: newStatusLabel } : a))
        try {
            // Tenta enviar apenas o número (sem JSON.stringify, axios serializa automaticamente)
            await api.patch(`/Agendamento/${id}/status`, newStatusCode, {
                headers: { "Content-Type": "application/json" },
            })
            console.log("[updateStatus] Sucesso ao atualizar status para", newStatusLabel)
        } catch (errFirst) {
            console.error("[updateStatus] Erro na primeira tentativa (número):", errFirst)
            console.error("[updateStatus] Response data:", (errFirst as any)?.response?.data)
            
            // Trata erro de regra de intervalo (business rule) já aqui
            const getErrMsg = (err: any) => {
                const data = (err && (err as any).response && (err as any).response.data) || undefined
                console.log("[getErrMsg] Analisando erro:", data)
                if (typeof data === 'string') return data
                if (data && typeof data.message === 'string') return data.message
                if (data && typeof data.title === 'string') return data.title
                if (data && Array.isArray(data.errors)) {
                    const firstErr = data.errors[0]
                    if (typeof firstErr === 'string') return firstErr
                    if (firstErr && typeof firstErr.message === 'string') return firstErr.message
                }
                return ''
            }
            const looksIntervalRule = (err: any, msg: string) => {
                const status = err && (err as any).response && (err as any).response.status
                const text = (msg || '').toLowerCase()
                console.log("[looksIntervalRule] Status:", status, "Msg:", text)
                return (status === 400 || status === 409 || status === 422) && 
                       (text.includes('intervalo') || text.includes('30 minutos') || text.includes('conflito'))
            }
            const msgFirst = getErrMsg(errFirst as any)
            if (newStatusCode === 1 && looksIntervalRule(errFirst as any, msgFirst)) {
                // revert otimista e mostra popup customizado
                setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: revertStatusLabel } : a))
                setIntervalConflictMessage(msgFirst || "Não foi possível aprovar o agendamento. Entre um agendamento e outro, na mesma sala, deve ter um intervalo mínimo de 30 minutos.")
                setIntervalConflictOpen(true)
                return
            }
            
            // Se erro não é de intervalo, reverte e mostra erro genérico
            console.warn("Falha ao enviar número, tentando como objeto:", errFirst)
            try {
                // Tenta como objeto: { status: numero }
                await api.patch(`/Agendamento/${id}/status`, { status: newStatusCode }, {
                    headers: { "Content-Type": "application/json" },
                })
                console.log("[updateStatus] Sucesso com objeto")
            } catch (errSecond) {
                console.error("[updateStatus] Erro na segunda tentativa (objeto):", errSecond)
                console.error("[updateStatus] Response data:", (errSecond as any)?.response?.data)
                const msgSecond = getErrMsg(errSecond as any)
                if (newStatusCode === 1 && looksIntervalRule(errSecond as any, msgSecond)) {
                    setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: revertStatusLabel } : a))
                    setIntervalConflictMessage(msgSecond || "Não foi possível aprovar o agendamento. Entre um agendamento e outro, na mesma sala, deve ter um intervalo mínimo de 30 minutos.")
                    setIntervalConflictOpen(true)
                    return
                }
                
                // Última tentativa: alerta genérico e revert
                console.error("Falha definitiva ao atualizar status")
                alert(`Erro ao atualizar status: ${msgSecond || 'Erro desconhecido'}`)
                setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: revertStatusLabel } : a))
            }
        }
    }

    const handleAprovar = async (id: number) => {
        // Concurrency guard: only approve if still PENDENTE (0)
        try {
            // Buscar estado atual do agendamento
            const res = await api.get(`/Agendamento/${id}`)
            const currentStatus: number = res.data.status
            if (currentStatus !== 0) {
                alert(`Ação bloqueada. Outro usuário já alterou o status para ${statusLabel(currentStatus)}.`)
                // Sincroniza array se já mudou
                setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: statusLabel(currentStatus) } : a))
                return
            }
        } catch (err) {
            console.warn("Falha ao verificar status atual antes de aprovar", err)
        }
        await updateStatus(id, 1, "APROVADO", 0, "PENDENTE")
    }

    const handleRecusar = async (id: number) => {
        // Concurrency guard: only refuse if still PENDENTE (0)
        try {
            const res = await api.get(`/Agendamento/${id}`)
            const currentStatus: number = res.data.status
            if (currentStatus !== 0) {
                alert(`Ação bloqueada. Outro usuário já alterou o status para ${statusLabel(currentStatus)}.`)
                setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: statusLabel(currentStatus) } : a))
                return
            }
        } catch (err) {
            console.warn("Falha ao verificar status atual antes de recusar", err)
        }
        await updateStatus(id, 2, "RECUSADO", 0, "PENDENTE")
    }

    // =============================
    // CANCELAR
    // =============================

    const handleDelete = async (id: number | null) => {
        if (!id) return
        // Cancelar: muda para CANCELADO (3). Mantemos linha? Requisito dizia remover? Ajuste: manter para visibilidade ou remover.
        // Aqui: manter e mudar status para CANCELADO.
        // Concurrency guard: only cancel if still APROVADO (1)
        try {
            const res = await api.get(`/Agendamento/${id}`)
            const currentStatus: number = res.data.status
            const dataBR = new Date(res.data.data).toLocaleDateString("pt-BR")
            const horaIni = (res.data.horaInicio ?? '').slice(0,5)
            // Bloqueia cancelamento se já iniciou
            if (isExpired(dataBR, horaIni)) {
                alert('Não é possível cancelar agendamentos cujo horário de início já passou.')
                return
            }
            if (currentStatus !== 1) {
                alert(`Cancelamento bloqueado. Status atual é ${statusLabel(currentStatus)}.`)
                setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: statusLabel(currentStatus) } : a))
                return
            }
        } catch (err) {
            console.warn("Falha ao verificar status atual antes de cancelar", err)
        }
        await updateStatus(id, 3, "CANCELADO", 1, "APROVADO")
    }

    // =============================
    // MARCAR FRACASSO
    // =============================

    const handleFailure = async (id: number | null) => {
        if (!id) return 
        // Marcar fracasso: muda para FRACASSADO (5).
        // Concurrency guard: only mark failure if still APROVADO (1)
        try {
            const res = await api.get(`/Agendamento/${id}`)
            const currentStatus: number = res.data.status
            if (currentStatus !== 1) {
                alert(`Ação bloqueada. Outro usuário já alterou o status para ${statusLabel(currentStatus)}.`)
                setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: statusLabel(currentStatus) } : a))
                return
            }
        } catch (err) {
            console.warn("Falha ao verificar status atual antes de marcar fracasso", err)
        }
        await updateStatus(id, 5, "FRACASSADO", 1, "APROVADO")
    }
     
            





    // =============================
    // Interface
    // =============================
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleCancel() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    useEffect(() => {
        const html = document.documentElement
        const prev = html.style.overflowX
        html.style.overflowX = "hidden"
        return () => { html.style.overflowX = prev }
    }, [])




    // =============================
    // FUNÇÃO CORRETA PARA PARSEAR DATA BR
    // =============================
    const parseDateString = (dateString: string) => {
        if (!dateString) return null;
        const parts = dateString.split("/");
        const year = parseInt(parts[2], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[0], 10);

        const parsedDate = new Date(year, month, day);
        if (isNaN(parsedDate.getTime())) return null;
        return parsedDate;
    };


    // =============================
    // FILTRO FINAL (apenas para filtros client-side: sala e data)
    // =============================
    const filteredAgendamentos = agendamentosState.filter((ag) => {
        // Sala
        const matchesSala =
            selectedSala === "Todas" ||
            selectedSala === "" ||
            ag.sala?.nome === selectedSala;

        // Data
        const agendamentoDate = parseDateString(ag.data);
        const matchesDate =
            !selectedDate ||
            (agendamentoDate &&
             format(agendamentoDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
            );

        return matchesSala && matchesDate;
    });

    // Para paginação: se houver filtros client-side ativos, calcular páginas localmente
    // Senão, usar totalPaginas do backend
    const hasClientFilters = selectedSala !== "Todas" || selectedDate;
    const TotalPages = hasClientFilters 
        ? Math.max(1, Math.ceil(filteredAgendamentos.length / ItemsPerPage))
        : totalPaginas;
    
    const currentAgendamentos = hasClientFilters
        ? filteredAgendamentos.slice((currentPage - 1) * ItemsPerPage, currentPage * ItemsPerPage)
        : filteredAgendamentos;



    return (

        <div className="relative z-0 flex flex-col h-full w-full">

            {/* Conteúdo da página: Título, Filtros, Tabela */}
            <div className="px-6 pb-6">
        

                {/* Titulo */}
                <div className="mb-9">
                    <h1 className="text-3xl font-black text-[#171717]">Gerenciar Agendamentos</h1>
                    <p className = "mt-3 font-regular text-base text-[#737373]">Gerencie as solicitações de agendamento</p>
                </div>


                {/* Seção de filtro */}
                <div className="mb-5 rounded-xl shadow overflow-hidden">


                    {/* Título*/}
                    <div className = "bg-[#F4F4F4] rounded-t-xl">
                        <div className="flex items-center gap-4 pl-6 py-7">
                            <Info className = "h-7 w-7 text-[#59C2ED]"/>
                            <h2 className="text-xl font-normal text-[#171717]">Filtros e Busca</h2>
                        </div>
                    </div>
                    
                    
                    {/* Campos de Filtro */}
                    <div className="flex flex-wrap items-end gap-4 px-6 pb-6 pt-5 bg-white">

                        {/* Filtro de Título */}
                        <div className="flex-1 min-w-[75px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Título</label>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Pesquisar agendamento"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                                    className="pl-10 w-full focus:text-black placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Filtro de Sala */}
                        <div className="flex-1 min-w-[75px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Sala</label>
                            <div className="mt-2">
                                <Select value={selectedSala} onValueChange={(val) => { setSelectedSala(val); setCurrentPage(1) }}>
                                    <SelectTrigger className="w-full cursor-pointer ">
                                        <SelectValue placeholder="Todas"/>
                                    </SelectTrigger>
                                    <SelectContent className = "bg-[#FFFFFF]">
                                        <SelectItem value="Todas" className="cursor-pointer hover:bg-[#F2F2F2]">Todas</SelectItem>
                                            {salasState.map((sala) => (
                                                <SelectItem key={sala.id} value={sala.nome} className="cursor-pointer hover:bg-[#F2F2F2]">
                                                    {sala.nome}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Filtro de Status */}
                        <div className="flex-1 min-w-[75px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Status</label>
                            <div className="mt-2">
                                <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1) }}>
                                    <SelectTrigger className="w-full cursor-pointer">
                                        <SelectValue placeholder="PENDENTE" />
                                    </SelectTrigger>
                                    <SelectContent className = "bg-[#FFFFFF]">
                                        <SelectItem value="Todos" className="cursor-pointer hover:bg-[#F2F2F2]">Todos</SelectItem>
                                        <SelectItem value="PENDENTE" className="cursor-pointer hover:bg-[#F2F2F2]">PENDENTE</SelectItem>
                                        <SelectItem value="APROVADO" className="cursor-pointer hover:bg-[#F2F2F2]">APROVADO</SelectItem>
                                        <SelectItem value="RECUSADO" className="cursor-pointer hover:bg-[#F2F2F2]">RECUSADO</SelectItem>
                                        <SelectItem value="CANCELADO" className="cursor-pointer hover:bg-[#F2F2F2]">CANCELADO</SelectItem>
                                        <SelectItem value="EXPIRADO" className="cursor-pointer hover:bg-[#F2F2F2]">EXPIRADO</SelectItem>
                                        <SelectItem value="FRACASSADO" className="cursor-pointer hover:bg-[#F2F2F2]">FRACASSADO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Filtro de Data */}
                        <div className="flex-1 min-w-[75pxpx] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Data</label>

                            <Popover>
                                <PopoverTrigger asChild className="cursor-pointer ">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal mt-2 "
                                    >
                                        <CalendarIcon className="mr-2 h-5 w-5 text-gray-500 " />

                                        {selectedDate
                                            ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                                            : "Selecionar data"}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="bg-white p-0 ">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                            setSelectedDate(date);
                                            setCurrentPage(1);
                                        }}
                                        locale={ptBR}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>


                    </div>


                </div>
                

                {/* Tabela de Agendamentos */}
                <div className="flex-1 min-w-0 rounded-xl shadow flex flex-col">
                    <div className="h-full">


                        {/* Título e Paginação*/}
                        <div className = "bg-[#F4F4F4] rounded-t-xl shadow px-6 py-7 flex items-center justify-between shrink-0">

                            {/* Título*/}
                            <div className="flex items-center gap-4">
                                <Info className = "h-7 w-7 text-[#59C2ED]"/>
                                <div>
                                    <h2 className="text-xl font-normal text-[#171717]">Lista de Agendamentos</h2>
                                    <p className="text-sm font-normal text-[#171717]">(Clique em uma linha para visualizar mais detalhes de um agendamento)</p>
                                </div>
                            </div>


                            {/* Paginação*/}
                            <div className="flex items-center gap-2">

                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    {"<"}
                                </button>

                                <span className="text-sm text-gray-700">{currentPage} / {TotalPages}</span>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, TotalPages))}
                                    disabled={currentPage === TotalPages}
                                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    {">"}
                                </button>


                            </div>

                        </div>




                        {/* Tabela*/}
                        <div className="flex-1 overflow-auto relative z-0">
                            <div className="inline-block min-w-full align-middle">
                                <div className="overflow-x-auto rounded-b-xl">
                                    

                                    <Table className="bg-gray-50 w-full rounded-b-xl shadow table-auto min-w-0 border border-gray-200 ">

                                        <TableHeader className="h-[45px] sticky top-0 z-10 border-b border-gray-200 last:border-b-0">
                                            <TableRow  className=" border-b bg-white border-gray-200 last:border-b-0 ">
                                                <TableHead className="z-11 text-sm font-medium text-[#171717] pl-4 min-w-0 whitespace-nowrap">Título</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] px-2 min-w-0 whitespace-nowrap">Solicitante</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] px-2 min-w-0 whitespace-nowrap">Sala</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] px-2 min-w-0 whitespace-nowrap">Descrição</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] px-2 min-w-0 whitespace-nowrap">Data</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] px-2 min-w-0 whitespace-nowrap">Hora Início</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] px-2 min-w-0 whitespace-nowrap">Hora Término</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] px-2 min-w-0 whitespace-nowrap">Status</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] text-center px-2 pr-4 min-w-0 whitespace-nowrap">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody className="min-w-0 rounded-b-xl border-b border-gray-200 last:border-b-0">
                                            {currentAgendamentos.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center text-sm text-gray-500 py-6">
                                                        {agendamentosState.length === 0
                                                            ? "Nenhum agendamento encontrado."
                                                            : "Nenhum resultado para os filtros aplicados."}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {currentAgendamentos.map((ag, index) => (                                         
                                            <TableRow key={`${ag.id}-${index}`} className="hover:bg-[#F2F2F2] h-16 border-b bg-white border-gray-200 last:border-b-0 ">
                                                
                                                
                                                <TableCell 
                                                className="cursor-pointer text-sm font-normal text-[#171717] pl-4 truncate z-10 min-w-0 max-w-[150px] whitespace-nowrap" 
                                                title={ag.titulo}
                                                onClick={() => handleOpenDescricao(ag)}>
                                                    {ag.titulo}
                                                </TableCell>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <TableCell className="cursor-pointer text-sm font-normal text-[#171717] truncate max-w-[120px] px-2 min-w-0 whitespace-nowrap"
                                                            onClick={() => handleOpenDescricao(ag)}>
                                                                {ag.solicitante?.nome}
                                                            </TableCell>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[300px] text-sm text-[#171717] bg-white shadow-md p-2 rounded-md wrap-break-word">
                                                            <p>{ag.solicitante?.nome}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TableCell 
                                                className="cursor-pointer text-sm font-normal text-[#171717] truncate min-w-0 max-w-[100px] px-2 whitespace-nowrap" 
                                                title={ag.sala?.nome}
                                                onClick={() => handleOpenDescricao(ag)}>
                                                    {ag.sala?.nome}
                                                </TableCell>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <TableCell className="cursor-pointer text-sm font-normal text-[#171717] truncate max-w-[150px] px-2 min-w-0 whitespace-nowrap"
                                                            onClick={() => handleOpenDescricao(ag)}>
                                                                {ag.descricao}
                                                            </TableCell>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[300px] text-sm text-[#171717] bg-white shadow-md p-2 rounded-md wrap-break-word">
                                                            <p>{ag.descricao}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TableCell 
                                                className="cursor-pointer text-sm font-normal text-[#171717] truncate min-w-0 px-2 whitespace-nowrap" 
                                                title={ag.data}
                                                onClick={() => handleOpenDescricao(ag)}>
                                                    {ag.data}
                                                </TableCell>

                                                <TableCell 
                                                className="cursor-pointer text-sm font-normal text-[#171717] truncate min-w-0 px-2 whitespace-nowrap"
                                                title={ag.horaInicio}
                                                onClick={() => handleOpenDescricao(ag)}>
                                                    {ag.horaInicio}
                                                </TableCell>

                                                <TableCell 
                                                className="cursor-pointer text-sm font-normal text-[#171717] truncate min-w-0 px-2 whitespace-nowrap"
                                                title={ag.horaFim}
                                                onClick={() => handleOpenDescricao(ag)}>
                                                    {ag.horaFim}
                                                </TableCell>

                                                <TableCell 
                                                className="cursor-pointer text-sm font-normal text-[#171717] truncate min-w-0 px-2 whitespace-nowrap"
                                                title={ag.status}
                                                onClick={() => handleOpenDescricao(ag)}>
                                                    {ag.status}
                                                </TableCell>
                                                
                                                <TableCell className="px-2 pr-4">

                                                    <div className="flex items-center justify-center gap-2 min-w-0 whitespace-nowrap">

                                                        {/* Se PENDENTE → mostrar Aprovar/Recusar */}
                                                        {ag.status === "PENDENTE" && !isExpired(ag.data, ag.horaInicio, nowTick) && (
                                                            <>
                                                                <button
                                                                    onClick={() => openConfirm("reject", ag.id)}
                                                                    className="cursor-pointer h-9 w-9 bg-[#E96969] hover:bg-red-500 text-white rounded-lg shadow-sm flex items-center justify-center"
                                                                >
                                                                    <X className="h-5 w-5" />
                                                                </button>

                                                                <button
                                                                    onClick={() => openConfirm("accept", ag.id)}
                                                                    className="cursor-pointer h-9 w-9 bg-[#5EAC75] hover:bg-green-500 text-white rounded-lg shadow-sm flex items-center justify-center"
                                                                >
                                                                    <Check className="h-5 w-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {ag.status === "PENDENTE" && isExpired(ag.data, ag.horaInicio, nowTick) && (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}

                                                        {/* Se APROVADO → mostrar botão de cancelar (lixeira) somente se ainda não iniciou */}
                                                        {ag.status === "APROVADO" && !isExpired(ag.data, ag.horaInicio) && (
                                                            <button
                                                                onClick={() => {
                                                                    setDeleteTargetId(ag.id)
                                                                    setDeleteOpen(true)
                                                                }}
                                                                className="cursor-pointer h-9 w-9 bg-[#E96969] hover:bg-red-500 text-white rounded-lg shadow-sm flex items-center justify-center"
                                                            >
                                                                <CalendarX className="h-5 w-5" />
                                                            </button>
                                                        )}

                                                        {/* Se APROVADO → mostrar botão de marcar como fracassado somente se já iniciou */}
                                                        {ag.status === "APROVADO" && isExpired(ag.data, ag.horaInicio) && (
                                                            <button
                                                                onClick={() => {
                                                                    setFailureTargetId(ag.id)
                                                                    setFailureOpen(true)
                                                                }}
                                                                className="cursor-pointer h-9 w-9 bg-[#555151] hover:bg-black-500 text-white rounded-lg shadow-sm flex items-center justify-center"
                                                            >
                                                                <UserX className="h-5 w-5" />
                                                            </button>
                                                        )}

                                                        {/* Se APROVADO mas já passou, EXPIRADO, RECUSADO ou CANCELADO → não mostrar ações */}
                                                        {( ag.status === "EXPIRADO" || ag.status === "RECUSADO" || ag.status === "CANCELADO" || ag.status === "FRACASSADO") && (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </div>

                                                </TableCell>

                                            </TableRow>
                                            ))}
                                            
                                        </TableBody>

                                        
                                    </Table>
                                </div>          
                            </div>               
                        </div>



                    </div>

                


                </div>
        


            </div>


                {/* Modal de confirmação */}
                {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mx-4">

                        <h3 className="text-lg font-semibold mb-2">
                            {confirmAction === "accept" ? "Confirmar aprovação" : "Confirmar recusa"}
                        </h3>

                        <p className="text-sm text-gray-600 mb-4">
                            {(() => {
                            const item = agendamentosState.find((a) => a.id === confirmTargetId)
                            if (!item) return "Deseja confirmar a ação?"

                            return (
                                <>
                                Deseja {confirmAction === "accept" ? "aprovar" : "recusar"} o agendamento{" "}
                                <span className="max-w-40 truncate wrap-break-word inline-block align-top">"<strong>{item.titulo}</strong></span>", na sala{" "}
                                <strong>{item.sala?.nome}</strong>, em{" "}
                                <strong>{item.data}</strong> às{" "}
                                <strong>{item.horaInicio}</strong>?

                                </>
                            )
                            })()}
                        </p>

                        <div className="pt-4 flex justify-center gap-6">
                            <ButtonCustomPopup onClick={handleCancel}>
                                <X strokeWidth={1.5}/>
                                Cancelar
                            </ButtonCustomPopup>
                            
                            <ButtonCustomPopup onClick={handleConfirm}>
                                <Check strokeWidth={1.5}/>
                                Confirmar
                            </ButtonCustomPopup>
                        </div>

                    </div>
                </div>
                )}

                {/* Modal de conflito de horário */}
                {conflictOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mx-4">
                        <h3 className="text-lg font-semibold mb-2">Horário com Conflito</h3>
                        <p className="text-sm text-gray-600 mb-4">{conflictMessage}</p>
                        <div className="pt-4 flex justify-center">
                            <ButtonCustomPopup onClick={() => setConflictOpen(false)}>
                                <Check strokeWidth={1.5}/>
                                Entendido
                            </ButtonCustomPopup>
                        </div>
                    </div>
                </div>
                )}

                
                {/* Modal de aviso de erro "Entre um agendamento e outro deve ter um intervalo mínimo de 30 minutos."*/}
                {intervalConflictOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mx-4">
                        <h3 className="text-lg font-semibold mb-2">Conflito com o Intervalo</h3>
                        <p className="text-sm text-gray-600 mb-4">{intervalConflictMessage}</p>
                        <div className="pt-4 flex justify-center">
                            <ButtonCustomPopup onClick={() => setIntervalConflictOpen(false)}>
                                <Check strokeWidth={1.5}/>
                                Entendido
                            </ButtonCustomPopup>
                        </div>
                    </div>
                </div>
                )}


                {/* Modal de confirmação de cancelamento */}
                {deleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mx-4">

                        <h3 className="text-lg font-semibold mb-2">
                            Confirmar cancelamento
                        </h3>

                        <p className="text-sm text-gray-600 mb-4">
                            {(() => {
                                const item = agendamentosState.find((a) => a.id === deleteTargetId)
                                if (!item) return "Tem certeza que deseja cancelar este agendamento já aprovado?"

                                return (
                                    <>
                                    Tem certeza que deseja <strong>cancelar</strong> o agendamento aprovado{" "}
                                    <span className="max-w-50 truncate wrap-break-word inline-block align-top">"<strong>{item.titulo}</strong></span>", na sala{" "}
                                    <strong>{item.sala?.nome}</strong>, em{" "}
                                    <strong>{item.data}</strong> às{" "}
                                    <strong>{item.horaInicio}</strong>?
                                    </>
                                )
                            })()}
                        </p>

                        <div className="pt-4 flex justify-center gap-6">
                            <ButtonCustomPopup
                                variant="outline" 
                                onClick={() => setDeleteOpen(false)}
                            >
                                <X strokeWidth={1.5}/>
                                Não
                            </ButtonCustomPopup>

                            <ButtonCustomPopup
                                variant="destructive"
                                onClick={() => {
                                    handleDelete(deleteTargetId)
                                    setDeleteOpen(false)
                                }}
                            >
                                <Check className="strokeWidth={1.5}" />
                                Sim
                            </ButtonCustomPopup>
                        </div>

                    </div>
                </div>
                )}

                {/* Modal de confirmação de fracasso */}
                {failureOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mx-4">

                        <h3 className="text-lg font-semibold mb-2">
                            Confirmar fracasso
                        </h3>

                        <p className="text-sm text-gray-600 mb-4">
                            {(() => {
                                const item = agendamentosState.find((a) => a.id === failureTargetId)
                                if (!item) return "Tem certeza que deseja marcar este agendamento como fracassado (não comparecimento de solicitante ou responsável)?"

                                return (
                                    <>
                                    Tem certeza que deseja marcar como fracassado (não comparecimento de solicitante ou responsável) o agendamento aprovado{" "}
                                    <span className="max-w-50 truncate wrap-break-word inline-block align-top">"<strong>{item.titulo}</strong></span>", na sala{" "}
                                    <strong>{item.sala?.nome}</strong>, em{" "}
                                    <strong>{item.data}</strong> às{" "}
                                    <strong>{item.horaInicio}</strong>?
                                    </>
                                )
                            })()}
                        </p>

                        <div className="pt-4 flex justify-center gap-6">
                            <ButtonCustomPopup
                                variant="outline" 
                                onClick={() => setFailureOpen(false)}
                            >
                                <X strokeWidth={1.5}/>
                                Não
                            </ButtonCustomPopup>

                            <ButtonCustomPopup
                                variant="destructive"
                                onClick={() => {
                                    handleFailure(failureTargetId)
                                    setFailureOpen(false)
                                }}
                            >
                                <Check className="strokeWidth={1.5}" />
                                Sim
                            </ButtonCustomPopup>
                        </div>

                    </div>
                </div>
                )}




        </div>
    )
}