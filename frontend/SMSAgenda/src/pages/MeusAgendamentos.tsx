"use client"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, Search, Info } from "lucide-react"
import { ButtonCustomPopup } from "@/components/button-custom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Exemplos de Agendamentos da Lista
const agendamentos = [
  { id: 1, titulo: "Reunião A", solicitante: "João da Silva", sala: "610", descricao: "Discussão sobre o projeto X, análise de requisitos, próximos passos e análises estatísticas dos dados.", data: "31/10/2025", hora: "10:00 - 12:00" },
  { id: 2, titulo: "Reunião B", solicitante: "Maria Oliveira", sala: "505", descricao: "Planejamento estratégico trimestral e análise de KPIs da equipe.", data: "01/11/2025", hora: "14:00 - 15:30" },
  { id: 3, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  // Adicione mais itens para testar paginação
  { id: 4, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 5, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 6, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 7, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 8, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 9, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 10, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 11, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 12, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 13, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 14, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
  { id: 15, titulo: "Reunião C", solicitante: "Carlos Pereira", sala: "707", descricao: "Revisão técnica e cronograma de entrega de novas features do sistema.", data: "02/11/2025", hora: "09:00 - 11:00" },
];

const salas = ["Todas", "1", "2", "3", "4", "5"]


export default function MeusAgendamentos() {

    const [searchTerm, setSearchTerm] = useState("")
    const [selectedSala, setSelectedSala] = useState("Todas")
    const [selectedData, setSelectedData] = useState("Todas")
    const [currentPage, setCurrentPage] = useState(1)

    const ItemsPerPage = 10 // Itens por página na tabela

    const [agendamentosState, setAgendamentosState] = useState(agendamentos) // estado dinâmico dos agendamentos (permite remover linhas)
    const [confirmOpen, setConfirmOpen] = useState(false) // estado do modal de confirmação
    const [confirmAction, setConfirmAction] = useState<"accept" | "reject" | null>(null)
    const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null)

    // abre modal de confirmação (action: 'accept' | 'reject', id: id do agendamento)
    const openConfirm = (action: "accept" | "reject", id: number) => {
        setConfirmAction(action)
        setConfirmTargetId(id)
        setConfirmOpen(true)
    }

    // confirma ação e remove a linha
    const handleConfirm = () => {
        if (confirmTargetId == null) return
        setAgendamentosState((prev) => prev.filter((a) => a.id !== confirmTargetId))
        // fecha modal e limpa estado
        setConfirmOpen(false)
        setConfirmAction(null)
        setConfirmTargetId(null)
    }

    // cancela modal
    const handleCancel = () => {
        setConfirmOpen(false)
        setConfirmAction(null)
        setConfirmTargetId(null)
    }

    // fecha modal com Esc
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleCancel() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    // evita scroll horizontal global
    useEffect(() => {
        const html = document.documentElement
        const prev = html.style.overflowX
        html.style.overflowX = "hidden"
        return () => { html.style.overflowX = prev }
    }, [])

    // Filtra agendamentos a partir do estado dinâmico (assim remoções aparecem na lista)
    const filteredAgendamentos = agendamentosState.filter((ag) => {
        const matchesSearch = ag.titulo.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesSala = selectedSala === "Todas" || ag.sala === selectedSala
        const matchesData = selectedData === "Todas" || ag.data === selectedData
        return matchesSearch && matchesSala && matchesData
    })

    // Define TotalPages e Agendamentos da Página Atual
    const TotalPages = Math.max(1, Math.ceil(filteredAgendamentos.length / ItemsPerPage))
    const currentAgendamentos = filteredAgendamentos.slice(
        (currentPage - 1) * ItemsPerPage,
        currentPage * ItemsPerPage
    )

    function MenuAcoes({ onEditar, onExcluir }: { onEditar: () => void, onExcluir: () => void }) {
        const [open, setOpen] = useState(false)
        const ref = useRef<HTMLDivElement>(null)

        // fechar ao clicar fora
        useEffect(() => {
            function handleClickOutside(e: MouseEvent) {
                if (ref.current && !ref.current.contains(e.target as Node)) {
                    setOpen(false)
                }
            }
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }, [])

        return (
            <div ref={ref} className="relative">
                {/* Botão 3 pontinhos */}
                <div >
                    <button
                        onClick={() => setOpen(prev => !prev)}
                        className="h-9 w-9 rounded-lg flex items-center justify-center bg-gray-200 hover:bg-gray-300"
                    >
                        <MoreVertical className="h-5 w-5 text-[#171717]" />
                    </button>
                </div>

                {/* Dropdown */}
                {open && (
                    <div
                        className="
                                absolute right-full top-1/2 -translate-y-1/2
                                w-32 bg-white shadow rounded-xl p-1
                                border border-gray-100 z-50
                                "
                    >
                        {/* EDITAR */}
                        <button
                            onClick={() => { setOpen(false); onEditar() }}
                            className="
                                w-full flex items-center gap-2 px-3 py-2 
                                text-sm text-[#171717] rounded-lg
                                hover:bg-gray-100 transition
                            "
                        >
                            <Pencil className="h-4 w-4" />
                            Editar
                        </button>

                        {/* EXCLUIR */}
                        <button
                            onClick={() => { setOpen(false); onExcluir() }}
                            className="
                                w-full flex items-center gap-2 px-3 py-2 
                                text-sm rounded-lg
                                hover:bg-gray-100 transition
                                text-[#E96969]
                            "
                        >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                        </button>
                    </div>
                )}
            </div>
        )
    }



    return (

        <div className="relative z-0 flex flex-col h-full w-full bg-[#F9FAFB]">

            {/* Conteúdo da página: Título, Filtros, Tabela */}
            <div className="px-6 pb-6">
        

                {/* Titulo */}
                <div className="mb-9">
                    <h1 className="text-3xl font-black text-[#171717]">Meus Agendamentos</h1>
                    <p className = "mt-3 font-regular text-base text-[#737373]">Veja seus agendamentos aprovados ou pendentes e os edite</p>
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
                    <div className="flex items-end gap-6 px-6 pb-6 pt-5 bg-white">

                        {/* Filtro de Título */}
                        <div className="flex-1 min-w-[100px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Título</label>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Pesquisar agendamento"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                                    className="pl-10 w-full"
                                />
                            </div>
                        </div>

                        {/* Filtro de Sala */}
                        <div className="flex-1 min-w-[100px] max-w-full]">
                            <label className="text-sm font-normal text-[#171717]">Sala</label>
                            <div className="mt-2">
                                <Select value={selectedSala} onValueChange={(val) => { setSelectedSala(val); setCurrentPage(1) }}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent className = "bg-[#FFFFFF]">
                                        {salas.map((sala) => (<SelectItem key={sala} value={sala}>{sala}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Filtro de Data */}
                        <div className="flex-1 min-w-[100px] max-w-full]">
                            <label className="text-sm font-normal text-[#171717]">Data</label>
                            <div className="mt-2">
                                <Select value={selectedData} onValueChange={(val) => { setSelectedData(val); setCurrentPage(1) }}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent className = "bg-[#FFFFFF]">
                                        <SelectItem value="Todas">Todas</SelectItem>
                                        <SelectItem value="31 de out. de 2025">31 de out. de 2025</SelectItem>
                                        <SelectItem value="01 de nov. de 2025">01 de nov. de 2025</SelectItem>
                                        <SelectItem value="02 de nov. de 2025">02 de nov. de 2025</SelectItem>
                                        <SelectItem value="03 de nov. de 2025">03 de nov. de 2025</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                                <h2 className="text-xl font-normal text-[#171717]">Lista de Agendamentos</h2>
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
                                <div className="overflow-x-auto">
                                    

                                    <Table className="bg-gray-50 w-full rounded-b-xl shadow table-auto min-w-0 border-collapse ">

                                        <TableHeader className="h-[45px] sticky top-0 z-10">
                                            <TableRow>
                                                <TableHead className="sticky left-0 z-11 text-sm font-medium text-[#171717] pl-16 w-60 min-w-0 whitespace-nowrap">Título</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] pl-4 w-60 min-w-0 whitespace-nowrap">Solicitante</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] pl-4 w-30 min-w-0 whitespace-nowrap">Sala</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] pl-4 w-90 min-w-0 whitespace-nowrap">Descrição</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] pl-4 w-50 min-w-0 whitespace-nowrap">Data</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] pl-4 w-50 min-w-0 whitespace-nowrap">Hora</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] text-center pr-4 w-60 min-w-0 whitespace-nowrap">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody className="min-w-0 rounded-b-xl">
                                            {currentAgendamentos.map((ag, index) => (
                                            <TableRow key={`${ag.id}-${index}`} className="h-16">
                                                <TableCell className="text-sm font-normal text-[#171717] pl-16 truncate sticky left-0 bg-white z-10 min-w-0 whitespace-nowrap" title={ag.titulo}>{ag.titulo}</TableCell>
                                                <TableCell className="text-sm font-normal text-[#171717] truncate min-w-0 whitespace-nowrap" title={ag.solicitante}>{ag.solicitante}</TableCell>
                                                <TableCell className="text-sm font-normal text-[#171717] truncate min-w-0 whitespace-nowrap">{ag.sala}</TableCell>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <TableCell className="text-sm font-normal text-[#171717] truncate max-w-50 cursor-pointer min-w-0 whitespace-nowrap">{ag.descricao}</TableCell>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-[300px] text-sm text-[#171717] bg-white shadow-md p-2 rounded-md">
                                                        <p>{ag.descricao}</p>
                                                    </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TableCell className="text-sm font-normal text-[#171717] truncate min-w-0 whitespace-nowrap">{ag.data}</TableCell>
                                                <TableCell className="text-sm font-normal text-[#171717]truncate min-w-0 whitespace-nowrap">{ag.hora}</TableCell>

                                                <TableCell className="pr-4">
                                                    <div className="flex items-center justify-center h-full">
                                                        <MenuAcoes
                                                            onEditar={() => console.log("Editar → ID:", ag.id)}
                                                            onExcluir={() => openConfirm("reject", ag.id)}
                                                        />
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


            {/* Modal de confirmação (remove linha se confirmado) */}
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
                        <strong>"{item.titulo}"</strong>, na sala{" "}
                        <strong>{item.sala}</strong>, em{" "}
                        <strong>{item.data}</strong> às{" "}
                        <strong>{item.hora}</strong>?
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
        </div>
    )
}