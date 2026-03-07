import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, FileText, Calendar, LayoutGrid, Check, X, Search, Info, CalendarX} from "lucide-react";
import { Card2 } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from "@/services/api";
import { cookieUtils } from "@/lib/auth/cookie-utils";
import { getTokenInfo } from "@/lib/auth/auth";
import { ButtonCustomOutline, ButtonCustomPopup, ButtonCustomHandleAprovar, ButtonCustomHandleRecusar, ButtonCustomHandleCancelar } from "@/components/button-custom";
import { solicitanteService } from "@/services/solicitante-service";
import type { SolicitanteResponse } from "@/types/solicitante";

interface HorarioDisponivel { diaSemana: number; horaInicio: string; horaFim: string }
interface Sala { id: number; nome: string; capacidade: number; descricaoEquipamentos: string; disponivel: boolean; imagemBase64: string; horariosDisponiveis: HorarioDisponivel[] }
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

export default function DescricaoAgendamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [sala, setSala] = useState<Sala | null>(null);
  const [solicitante, setSolicitante] = useState<SolicitanteResponse | null>(null);
  const [loadingAgendamento, setLoadingAgendamento] = useState(true);
  const [loadingSala, setLoadingSala] = useState(false);
  const [loadingSolicitante, setLoadingSolicitante] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [imagemErro, setImagemErro] = useState(false);
  const [imagemLoading, setImagemLoading] = useState(true);
  const [agendamentoExpirado, setAgendamentoExpirado] = useState(false);
  const [canceladoPeloSolicitante, setCanceladoPeloSolicitante] = useState(false);

  //aprovar/recusar agendamento
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"accept" | "reject" | null>(null)
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null)

  // cancelamento de agendamento
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [agendamentosState, setAgendamentosState] = useState<any[]>([])
  const [rawAgendamentos, setRawAgendamentos] = useState<any[]>([])

  // Status label util (moved up for concurrency guards)
  const statusLabel = (s: number | undefined) => {
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

   // abre modal de confirmação (action: 'accept' | 'reject', id: id do agendamento)
  const openConfirm = (action: "accept" | "reject", id: number) => {
        setConfirmAction(action)
        setConfirmTargetId(id)
        setConfirmOpen(true)
  }

  // confirma ação: chama API (aprovar/recusar)
    const handleConfirm = async () => {
    if (confirmTargetId == null || !confirmAction) return
        
        // Verifica em tempo real se o agendamento expirou (dupla proteção)
        if (agendamento) {
            const dataBR = formatDateDisplay(agendamento.data)
            const horaIni = formatHora(agendamento.horaInicio)
            if (isExpired(dataBR, horaIni)) {
                alert('Não é possível aprovar/recusar. O horário de início do agendamento já passou.')
                setConfirmOpen(false)
                setConfirmAction(null)
                setConfirmTargetId(null)
                return
            }
        }

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

  // =============================
    // APROVAR / RECUSAR
    // =============================
    const updateStatus = async (id: number, newStatusCode: number, newStatusLabel: string, revertStatusCode: number, revertStatusLabel: string) => {
        // otimista
        setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: newStatusLabel } : a))
        setRawAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: newStatusCode } : a))
        try {
            // Backend enum é numérico; enviamos número direto.
            await api.patch(`/Agendamento/${id}/status`, newStatusCode, {
                headers: { "Content-Type": "application/json" },
            })
        } catch (errFirst) {
            console.warn("Falha ao enviar código numérico, tentando string:", errFirst)
            try {
                // Fallback: alguns backends podem aceitar a string do enum.
                await api.patch(`/Agendamento/${id}/status`, JSON.stringify(newStatusLabel), {
                    headers: { "Content-Type": "application/json" },
                })
            } catch (errSecond) {
                console.error("Erro definitivo ao atualizar status:", errSecond)
                alert(`Erro ao atualizar status para ${newStatusLabel}. Revertendo.`)
                // revert
                setAgendamentosState(prev => prev.map(a => a.id === id ? { ...a, status: revertStatusLabel } : a))
                setRawAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: revertStatusCode } : a))
            }
        }
  }

  const handleAprovar = async (id: number) => {
        // Concurrency guard: only approve if still PENDENTE (0)
        try {
          const res = await api.get(`/Agendamento/${id}`)
          const currentStatus: number = res.data.status
          if (currentStatus !== 0) {
            alert(`Ação bloqueada. Outro usuário já alterou o status para ${statusLabel(currentStatus)}.`)
            // sync local if stale
            setAgendamento(prev => prev ? { ...prev, status: currentStatus } : prev)
            return
          }
        } catch (err) {
          console.warn("Falha ao verificar status atual antes de aprovar", err)
        }
        await updateStatus(id, 1, "APROVADO", 0, "PENDENTE")
        setAgendamento(prev => prev ? { ...prev, status: 1 } : prev)
  }

    const handleRecusar = async (id: number) => {
        // Concurrency guard: only refuse if still PENDENTE (0)
        try {
          const res = await api.get(`/Agendamento/${id}`)
          const currentStatus: number = res.data.status
          if (currentStatus !== 0) {
            alert(`Ação bloqueada. Outro usuário já alterou o status para ${statusLabel(currentStatus)}.`)
            setAgendamento(prev => prev ? { ...prev, status: currentStatus } : prev)
            return
          }
        } catch (err) {
          console.warn("Falha ao verificar status atual antes de recusar", err)
        }
        await updateStatus(id, 2, "RECUSADO", 0, "PENDENTE")
        setAgendamento(prev => prev ? { ...prev, status: 2 } : prev)
  }

  const handleDelete = async (id: number | null) => {
      if (!id) return
      
      // Verifica em tempo real se o agendamento expirou (dupla proteção)
      if (agendamento) {
          const dataBR = formatDateDisplay(agendamento.data)
          const horaIni = formatHora(agendamento.horaInicio)
          if (isExpired(dataBR, horaIni)) {
              alert('Não é possível cancelar. O horário de início do agendamento já passou.')
              return
          }
      }

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
          setAgendamento(prev => prev ? { ...prev, status: currentStatus } : prev)
          return
        }
      } catch (err) {
        console.warn("Falha ao verificar status atual antes de cancelar", err)
      }
      await updateStatus(id, 3, "CANCELADO", 1, "APROVADO")
      setAgendamento(prev => prev ? { ...prev, status: 3 } : prev)
  }

  // cancela modal
    const handleCancel = () => {
        setConfirmOpen(false)
        setConfirmAction(null)
        setConfirmTargetId(null)
    }

  useEffect(() => {
    const carregarAgendamento = async () => {
      if (!id) return;
      setLoadingAgendamento(true);
      setErro(null);
      try {
        const resp = await api.get(`/Agendamento/${id}`);
        setAgendamento(resp.data);
      } catch {
        setErro("Não foi possível carregar o agendamento.");
      } finally {
        setLoadingAgendamento(false);
      }
    };
    carregarAgendamento();
  }, [id]);

  // Guarda de acesso: se permissão 3 ou 4, só pode abrir se o agendamento estiver em "meus"
  useEffect(() => {
    const verificarAcesso = async () => {
      const token = cookieUtils.getCookie('auth_token');
      const tokenInfo = token ? getTokenInfo(token) : null;
      const permissaoNum = tokenInfo?.permissao != null ? Number(tokenInfo.permissao) : null;
      // Mapeamento: 1=Admin, 2/3=Solicitante, 4/5=Viewer
      const isSolicitante = permissaoNum === 2 || permissaoNum === 3;
      const isViewer = permissaoNum === 4 || permissaoNum === 5;
      const isRestrito = isSolicitante || isViewer;
      if (!isRestrito || !id) return;
      try {
        const res = await api.get(`/Agendamento`);
        const data = res?.data;
        if (data && typeof data === 'object' && Array.isArray(data.meus)) {
          const alvo = Number(id);
          const pertence = data.meus.some((a: any) => a?.id === alvo);
          if (!pertence) {
            navigate('/agenda', { replace: true });
          }
        }
        // Caso payload não traga separação meus/outros, não bloqueamos para evitar falso-positivo
      } catch {
        // Em caso de erro ao verificar, não bloqueia para evitar travar o usuário erroneamente
      }
    };
    verificarAcesso();
  }, [id, navigate]);

  useEffect(() => {
    const carregarSala = async () => {
      if (!agendamento) return;
      setLoadingSala(true);
      try {
        const resp = await api.get(`/Sala/${agendamento.salaId}`);
        setSala(resp.data);
      } catch {
        try {
          const r2 = await api.get(`/Sala/Ativas`);
          const encontrada = r2.data.find((s: Sala) => s.id === agendamento.salaId);
          setSala(encontrada || null);
        } catch {
          setSala(null);
        }
      } finally {
        setLoadingSala(false);
      }
    };
    carregarSala();
  }, [agendamento]);

  // Buscar solicitante completo se houver solicitanteId
  useEffect(() => {
    const carregarSolicitante = async () => {
      if (!agendamento || !agendamento.solicitanteId) return;
      setLoadingSolicitante(true);
      try {
        const solicitanteData = await solicitanteService.buscarPorId(agendamento.solicitanteId);
        setSolicitante(solicitanteData);
      } catch (error) {
        console.error("Erro ao buscar solicitante:", error);
        setSolicitante(null);
      } finally {
        setLoadingSolicitante(false);
      }
    };
    carregarSolicitante();
  }, [agendamento]);

  // Verificar em tempo real se o agendamento expirou
  useEffect(() => {
    if (!agendamento) return;
    
    const verificarExpiracao = () => {
      const dataBR = formatDateDisplay(agendamento.data);
      const horaIni = formatHora(agendamento.horaInicio);
      const expirou = isExpired(dataBR, horaIni);
      setAgendamentoExpirado(expirou);
    };

    // Verifica imediatamente
    verificarExpiracao();

    // Verifica a cada 10 segundos para detectar quando o agendamento expira
    const interval = setInterval(verificarExpiracao, 10000);

    return () => clearInterval(interval);
  }, [agendamento]);

  // Verificar se o cancelamento foi feito pelo solicitante
  useEffect(() => {
    if (!agendamento || agendamento.status !== 3) {
      setCanceladoPeloSolicitante(false);
      return;
    }
    
    const token = cookieUtils.getCookie('auth_token');
    const tokenInfo = token ? getTokenInfo(token) : null;
    const emailUsuarioAtual = tokenInfo?.sub; // Campo "sub" contém o email
    
    const emailSolicitante = solicitante?.email || agendamento.solicitanteEmail;
    
    if (emailUsuarioAtual && emailSolicitante && emailUsuarioAtual === emailSolicitante) {
      setCanceladoPeloSolicitante(true);
    } else {
      setCanceladoPeloSolicitante(false);
    }
  }, [agendamento, solicitante]);


  const formatDateInput = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  // Exibir data no formato dd/MM/yyyy
  const formatDateDisplay = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const formatHora = (h: string) => h ? h.substring(0,5) : "";
  const obterNomeDia = (dia: number) => ({1:"Seg",2:"Ter",3:"Qua",4:"Qui",5:"Sex",6:"Sáb",7:"Dom"}[dia] || "");
  const formatEquipamentos = (txt: string) => txt ? txt.split(",").map(t => t.trim()).filter(Boolean) : [];
  // =============================
  // Expiração (mesma lógica de AprovarAgendamentos)
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

  const isExpired = (dateStr?: string, timeStr?: string) => {
    if (!dateStr || !timeStr) return false;
    const agDate = parseDateString(dateStr);
    if (!agDate) return false;
    const [hh, mm] = timeStr.slice(0, 5).split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return false;
    agDate.setHours(hh, mm, 0, 0);
    return agDate.getTime() < Date.now();
  };

  return (
    <div className="flex flex-col h-full w-full p-1 overflow-auto">

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Descrição de Agendamento</h1>
            <p className="text-sm text-gray-500 mt-1">Visualize os detalhes do agendamento</p>
          </div>

          {/* Botões de Ação */}
          {/* Se PENDENTE (0) e não expirado → mostrar Aprovar/Recusar */}
          {agendamento && agendamento.status === 0 && !agendamentoExpirado && (
            <div className="mr-1 flex items-center justify-center gap-2 min-w-0 whitespace-nowrap">
              <ButtonCustomHandleRecusar onClick={() => openConfirm("reject", agendamento.id)}>
                <X strokeWidth={1.5} />
                Recusar
              </ButtonCustomHandleRecusar>

              <ButtonCustomHandleAprovar onClick={() => openConfirm("accept", agendamento.id)}>
                <Check strokeWidth={1.5} />
                Aprovar
              </ButtonCustomHandleAprovar>
            </div>
          )}

          {/* Se APROVADO (1) e não expirado → mostrar cancelar */}
          {agendamento && agendamento.status === 1 && !agendamentoExpirado && (
            <ButtonCustomHandleCancelar onClick={() => { setDeleteTargetId(agendamento.id); setDeleteOpen(true); }}>
              <CalendarX strokeWidth={2.0} />
              Cancelar
            </ButtonCustomHandleCancelar>
          )}

          {/* Se CANCELADO (3) e se foi cancelado pelo solicitante que solicitou */}
          {canceladoPeloSolicitante && !agendamentoExpirado && (

            <div className="h-10 w-60 bg-white! gap-2 flex space-around items-center text-[#E96969]">   
                <CalendarX strokeWidth={2.0} className="pl-2 h-7 w-7"/>
                Cancelado pelo solicitante
            </div>

          )}



          
        </div>

      </div>

      {erro && (
        <div className="p-4 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {erro}
        </div>
      )}

      {/* Informações de Solicitante*/}
      <div className="mb-5 rounded-xl shadow overflow-hidden">

          {/* Título*/}
          <div className = "bg-[#F4F4F4] rounded-t-xl">

              <div className="flex items-center gap-4 pl-6 py-7">
                  <Info className = "h-7 w-7 text-[#59C2ED]"/>
                  <h2 className="text-xl font-normal text-[#171717]">Informações de Solicitante</h2>
              </div>

          </div>

          {/* Conteúdo */}
          <div className="flex flex-col gap-6 px-6 pb-6 pt-5 bg-white">
            {loadingAgendamento || loadingSolicitante ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : agendamento ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Nome</Label>
                  <Input 
                    value={solicitante?.nome || agendamento.solicitanteNome || "—"} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input 
                    value={solicitante?.email || agendamento.solicitanteEmail || "—"} 
                    disabled 
                  />
                </div>
                 <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Setor</Label>
                  <Input 
                    value={solicitante?.setor || agendamento.solicitanteSetor || "—"} 
                    disabled 
                  />
                </div>
              </div>
            ) : null}
          </div>

      </div>

      <div className="grid grid-cols-1 @5xl:grid-cols-2 gap-4 items-start">
        
        <div className="flex flex-col @5xl:h-full">

          {/* Informações de Agendamento */}
          <div className="rounded-[20px] shadow-sm border border-t-0 border-gray-200 flex-1 mb-4">
            <div className="bg-[#F4F4F4] rounded-t-xl">
              <div className="flex items-center gap-4 pl-6 py-7">
                <Clock className="h-7 w-7 text-[#59C2ED]" />
                <h2 className="text-xl font-normal text-[#171717]">Informações do Agendamento</h2>
              </div>
            </div>
            <Card2 className="p-5 border-none rounded-b-[20px] !shadow-none flex-1">
              {loadingAgendamento ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : agendamento ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Título da Reunião</Label>
                    <Input value={agendamento.titulo} disabled />
                  </div>
                  <div className="grid gap-3 grid-cols-1 @3xl:grid-cols-[1fr_0.75fr_0.75fr] @5xl:grid-cols-1 @7xl:grid-cols-[1fr_0.75fr_0.75fr]">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Calendar className="h-4 w-4" />Data</Label>
                      <Input type="date" value={formatDateInput(agendamento.data)} disabled className="text-center" />
                    </div>
                    <div className="@3xl:contents @5xl:grid @5xl:grid-cols-2 @5xl:gap-3 @5xl:col-span-1 @7xl:contents">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Clock className="h-4 w-4" />Início</Label>
                        <Input type="time" value={formatHora(agendamento.horaInicio)} disabled className="text-center" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Clock className="h-4 w-4" />Término</Label>
                        <Input type="time" value={formatHora(agendamento.horaFim)} disabled className="text-center" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Quantidade de Participantes</Label>
                    <Input value={agendamento.qtd_Participantes} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Descrição</Label>
                    <Textarea value={agendamento.descricao || "(sem descrição)"} disabled className="min-h-[70px]" />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Agendamento não encontrado.</p>
              )}
            </Card2>
          </div>
          
          {/* Informações de Responsável pelo Uso */}
          <div className="rounded-[20px] shadow-sm border border-t-0 border-gray-200 flex-1">
            <div className="bg-[#F4F4F4] rounded-t-xl">
              <div className="flex items-center gap-4 pl-6 py-7">
                <FileText className="h-7 w-7 text-[#59C2ED]" />
                <h2 className="text-xl font-normal text-[#171717]">Responsável pelo Uso</h2>
              </div>
            </div>
            <Card2 className="p-5 border-none rounded-b-[20px] !shadow-none flex-1">
              {loadingAgendamento ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : agendamento ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Nome do Responsável</Label>
                    <Input value={agendamento.nomeResponsavel || "-"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <Input value={agendamento.emailResponsavel || "-"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                    <Input value={agendamento.celularResponsavel || "-"} disabled />
                  </div>
                </div>
              ) : null}
            </Card2>
          </div>
        </div>

        <div className="flex flex-col @5xl:h-full">
          <div className="rounded-[20px] shadow-sm border border-gray-200 border-t-0 flex-1">
            <div className="bg-[#F4F4F4] rounded-t-xl">
              <div className="flex items-center gap-4 pl-6 py-7">
                <LayoutGrid className="h-6 w-6 text-[#59C2ED]" />
                <h2 className="text-xl font-normal text-[#171717]">Sala</h2>
              </div>
            </div>
            <Card2 className="p-5 border-none rounded-b-[20px] shadow-none">
              {loadingSala || loadingAgendamento ? (
                <div className="space-y-4">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              ) : sala ? (
                <div className="space-y-8">
                  <div className="h-7">
                  </div>
                  <div className="flex justify-center">
                    <div className="rounded-lg overflow-hidden max-w-[600px] w-full select-none mb-10" style={{ touchAction: 'none' }}>
                      {!sala.imagemBase64 ? (
                        <div className="w-full h-64 bg-gray-100 flex items-center justify-center border border-gray-200 ">
                          <p className="text-gray-500 text-sm">Imagem não disponível</p>
                        </div>
                      ) : imagemErro ? (
                        <div className="w-full h-64 bg-gray-100 flex items-center justify-center border border-gray-200">
                          <p className="text-gray-500 text-sm">Erro ao carregar imagem</p>
                        </div>
                      ) : (
                        <>
                          {imagemLoading && <Skeleton className="w-full h-64" />}
                          <img
                            src={sala.imagemBase64}
                            alt={sala.nome}
                            className={`w-full h-64 object-contain pointer-events-none select-none ${imagemLoading ? 'hidden' : ''}`}
                            onLoad={() => setImagemLoading(false)}
                            onError={() => { setImagemErro(true); setImagemLoading(false); }}
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
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">{sala.nome}</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-sm">Capacidade: {sala.capacidade} pessoas</span>
                    </div>
                    {formatEquipamentos(sala.descricaoEquipamentos).length > 0 && (() => {
                      const equipamentos = formatEquipamentos(sala.descricaoEquipamentos);
                      return (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Equipamentos</Label>
                          <div className="flex flex-wrap gap-2 max-h-[68px] overflow-hidden">
                            {equipamentos.map((eq, i) => (
                              <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{eq}</span>
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
                                    {equipamentos.map((eq, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{eq}</span>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      );
                    })()}
                    {sala.horariosDisponiveis?.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-emerald-600" />Horários de Funcionamento
                        </Label>
                        <div className="grid grid-cols-1 @xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-5 gap-1.5">
                          {sala.horariosDisponiveis.map((h, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-1.5 px-2.5 text-xs text-gray-700">
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="font-medium">{obterNomeDia(h.diaSemana)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-gray-600">
                                <Clock className="h-3 w-3" />
                                <span>{h.horaInicio.substring(0,5)} - {h.horaFim.substring(0,5)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : agendamento ? (
                <p className="text-sm text-gray-500">Sala não encontrada para o agendamento.</p>
              ) : (
                <p className="text-sm text-gray-500">Carregue o agendamento para ver a sala.</p>
              )}
            </Card2>
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
                {agendamento && (
                  <>
                    Deseja {confirmAction === "accept" ? "aprovar" : "recusar"} o agendamento{" "}
                    <strong>"{agendamento.titulo}"</strong>, na sala{" "}
                    <strong>{sala?.nome ?? agendamento.salaId}</strong>, em{" "}
                    <strong>{formatDateDisplay(agendamento.data)}</strong> às{" "}
                    <strong>{formatHora(agendamento.horaInicio)}</strong>?
                  </>
                )}
                {!agendamento && "Deseja confirmar a ação?"}
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


      {/* Modal de confirmação de cancelamento */}
      {deleteOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 mx-4">

              <h3 className="text-lg font-semibold mb-2">
                  Confirmar cancelamento
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                {agendamento ? (
                  <>
                    Tem certeza que deseja <strong>cancelar</strong> o agendamento aprovado{" "}
                    <strong>"{agendamento.titulo}"</strong>, na sala{" "}
                    <strong>{sala?.nome ?? agendamento.salaId}</strong>, em{" "}
                    <strong>{formatDateDisplay(agendamento.data)}</strong> às{" "}
                    <strong>{formatHora(agendamento.horaInicio)}</strong>?
                  </>
                ) : (
                  "Tem certeza que deseja cancelar este agendamento já aprovado?"
                )}
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



    </div>
  );
}

