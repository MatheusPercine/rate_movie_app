"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Search, Info } from "lucide-react";
import api from "@/services/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/useDebounce";

export default function GerenciarSalas() {


    const [currentPage, setCurrentPage] = useState(1) // página atual da tabela
    const ItemsPerPage = 10 //itens por página

    const [searchName, setSearchName] = useState("") // varivavel de busca por nome
    const debouncedSearchName = useDebounce(searchName) // debounce para busca por nome

    const [selectedAvailability, setSelectedAvailability] = useState("Todas") // varivavel de filtro por disponibilidade

    const [roomsState, setRoomsState] = useState<any[]>([]) // Lista final de salas exibida na tabela
    const [totalPaginas, setTotalPaginas] = useState(1) // Total de páginas (vem do backend)
    const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null) // ID da sala sendo atualizada
    const [refreshTrigger, setRefreshTrigger] = useState(0) // Força re-fetch após alterações


    // Evita overflow horizontal da página
    useEffect(() => {
        const html = document.documentElement
        const prev = html.style.overflowX
        html.style.overflowX = "hidden"
        return () => { html.style.overflowX = prev }
    }, [])

    const availabilityLabel = (s:boolean) => {
        switch (s) {
            case true: return "Disponível";
            case false: return "Indisponível";
            default: return "Desconhecido";
        }
    };

    // Converte label para boolean da disponibilidade
    const availabilityToBoolean = (label: string): boolean => {
        switch (label) {
            case "Disponível": return true;
            case "Indisponível": return false;
            default: return false;
        }
    };

    // Função para alterar a disponibilidade da sala
    const handleChangeRoomAvailability = async (roomId: string, newAvailability: boolean) => {
        setUpdatingRoomId(roomId);

        try {
            // newAvailability = true → ativar; false → desativar
            if (newAvailability === true) {
                await api.post(`/Sala/${roomId}/ativar`)
            } else {
                const payload = { opcaoCancelamento: 2 };
                await api.post(`/Sala/${roomId}/desativar`, payload)
            }

            console.log(`[DEBUG] Disponibilidade da sala ${roomId} alterada para ${newAvailability}`);
            // Re-fetch para refletir alteração
            setRefreshTrigger(prev => prev + 1);

        } catch (error) {
            console.error("Erro ao alterar disponibilidade da sala:", error);
            alert("Erro ao alterar a disponibilidade da sala. Tente novamente.");
        } finally { 
            setUpdatingRoomId(null);
        }
    };


    // Buscar salas com paginação server-side
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const disponivelParam =
                    selectedAvailability === "Disponível" ? true :
                    selectedAvailability === "Indisponível" ? false :
                    undefined;

                const res = await api.get("/Sala/listar", {
                    params: {
                        tamPag: ItemsPerPage,
                        pagina: currentPage,
                        buscaNome: debouncedSearchName || undefined,
                        disponivel: disponivelParam,
                    }
                });

                // Backend retorna { data: [...], totalPaginas: N, ... }
                const responseData = res?.data?.data ?? [];
                const totalPags = res?.data?.totalPaginas ?? 1;

                console.log("[DEBUG] /Sala/listar página:", currentPage, "total páginas:", totalPags, responseData);

                const mapped = responseData.map((room: any) => ({
                    id: room.id,
                    nome: room.nome ?? "",
                    capacidade: room.capacidade ?? 0,
                    descricaoEquipamentos: room.descricaoEquipamentos ?? "",
                    disponivel: availabilityLabel(room.disponivel),
                    imagemBase64: room.imagemBase64 ?? "",
                    horariosDisponiveis: room.horariosDisponiveis ?? [],
                }));

                setRoomsState(mapped);
                setTotalPaginas(totalPags);
            } catch (error) {
                console.error("Erro ao buscar salas:", error);
            }
        };
        fetchRooms();
    }, [currentPage, selectedAvailability, debouncedSearchName, refreshTrigger]);

    // Paginação server-side: totalPaginas vem do backend, currentRooms = roomsState já paginado
    const TotalPages = totalPaginas;
    const currentRooms = roomsState;

    

    return (

        <div className="relative z-0 flex flex-col h-full w-full">

            {/* Conteúdo da página: Título, Filtros, Tabela */}
            <div className="px-6 pb-6">
        

                {/* Titulo */}
                <div className="mb-9">
                    <h1 className="text-3xl font-black text-[#171717]">Gerenciar Salas</h1>
                    <p className = "mt-3 font-regular text-base text-[#737373]">Altere a disponibilidade das salas</p>
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
                    <div className="flex flex-wrap items-center justify-center gap-6 px-6 pb-6 pt-5 bg-white">

                        {/* Filtro de Nome */}
                        <div className="flex-1 min-w-[100px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Nome</label>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Pesquisar nome de usuário"
                                    value={searchName}
                                    onChange={(e) => { setSearchName(e.target.value); setCurrentPage(1) }}
                                    className="pl-10 w-full focus:text-black placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Filtro de Disponibilidade */}
                        <div className="flex-1 min-w-[100px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Disponibilidade</label>
                            <div className="mt-2">
                                <Select value={selectedAvailability} onValueChange={(val) => { setSelectedAvailability(val); setCurrentPage(1) }}>
                                    <SelectTrigger className="w-full cursor-pointer">
                                        <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#FFFFFF]">
                                        <SelectItem value="Todas" className="cursor-pointer hover:bg-[#F2F2F2]">Todas</SelectItem>
                                        <SelectItem value="Disponível" className="cursor-pointer hover:bg-[#F2F2F2]">Disponível</SelectItem>
                                        <SelectItem value="Indisponível" className="cursor-pointer hover:bg-[#F2F2F2]">Indisponível</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    
                </div>
                

                {/* Tabela de Salas */}
                <div className="flex-1 min-w-0 rounded-xl shadow flex flex-col">
                    <div className="h-full">


                        {/* Título e Paginação*/}
                        <div className = "bg-[#F4F4F4] rounded-t-xl shadow px-6 py-7 flex items-center justify-between shrink-0">

                            {/* Título*/}
                            <div className="flex items-center gap-4">
                                <Info className = "h-7 w-7 text-[#59C2ED]"/>
                                <div>
                                    <h2 className="text-xl font-normal text-[#171717]">Lista de Salas</h2>
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

                                        <TableHeader className="h-[45px] top-0 z-10 border-b border-gray-200 last:border-b-0">
                                            <TableRow  className=" border-b bg-white border-gray-200 last:border-b-0 ">
                                                <TableHead className="text-sm font-medium text-[#171717] min-w-0 whitespace-nowrap pl-6">Nome</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] min-w-0 whitespace-nowrap px-4">Capacidade (pessoas)</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] min-w-0 whitespace-nowrap px-4">Equipamentos</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] min-w-0 whitespace-nowrap px-4">Período disponível</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] min-w-0 whitespace-nowrap px-4 pr-6">Disponibilidade</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody className="min-w-0 rounded-b-xl border-b border-gray-200 last:border-b-0">
                                            {currentRooms.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center text-sm text-gray-500 py-6">
                                                        {roomsState.length === 0
                                                            ? "Nenhuma sala encontrada."
                                                            : "Nenhum resultado para os filtros aplicados."}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {currentRooms.map((room, index) => (                                         
                                            <TableRow key={`${room.id}-${index}`} className="h-16 border-b bg-white border-gray-200 last:border-b-0 ">

                                                {/*Nome da sala*/}
                                                <TableCell 
                                                className="text-sm font-normal text-[#171717] pl-6 truncate min-w-0 max-w-[200px] whitespace-nowrap" 
                                                title={room.nome}>
                                                    {room.nome}
                                                </TableCell>

                                                {/*Capacidade da sala*/}
                                                <TableCell 
                                                className="text-sm font-normal text-[#171717] truncate min-w-0 px-4 whitespace-nowrap" 
                                                title={room.capacidade}>
                                                    {room.capacidade}
                                                </TableCell>

                                                {/*Descrição dos equipamentos da sala*/}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <TableCell className="text-sm font-normal text-[#171717] truncate min-w-0 max-w-[200px] px-4 whitespace-nowrap">
                                                                {room.descricaoEquipamentos}
                                                            </TableCell>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[300px] text-sm text-[#171717] bg-white shadow-md p-2 rounded-md wrap-break-word">
                                                            <p>{room.descricaoEquipamentos}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/*Período disponível da sala*/}
                                                <TableCell 
                                                className="text-sm font-normal text-[#171717] px-4 truncate min-w-0 max-w-[180px] whitespace-nowrap" 
                                                title="seg a sex, 09:00 - 17:00">
                                                    seg a sex - 09:00 às 17:00
                                                </TableCell>

                                                {/*Alterar disponibilidade da sala*/}
                                                <TableCell className="px-4 pr-6">
                                                    <div className="flex gap-2 min-w-0 whitespace-nowrap">
                                                        <Select
                                                            value = {room.disponivel}
                                                            onValueChange = {(newAvailability) => handleChangeRoomAvailability(room.id, availabilityToBoolean(newAvailability))}
                                                            disabled = {updatingRoomId === room.id}
                                                        >
                                                            <SelectTrigger className="w-[160px] cursor-pointer">
                                                                <SelectValue placeholder={room.disponivel ? "Disponível" : "Indisponível"}/>
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#FFFFFF]">
                                                                <SelectItem
                                                                    value="Disponível"
                                                                    className="cursor-pointer hover:bg-[#F2F2F2]"
                                                                    disabled={room.disponivel === true}>
                                                                    Disponível
                                                                </SelectItem>
                                                                <SelectItem
                                                                    value="Indisponível"
                                                                    className="cursor-pointer hover:bg-[#F2F2F2]"
                                                                    disabled={room.disponivel === false}
                                                                >
                                                                    Indisponível
                                                                </SelectItem>
                                                                
                                                            </SelectContent>
                                                        </Select>
                                                        {updatingRoomId === room.id && (
                                                            <span className="text-sm text-gray-400">Salvando...</span>
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

        </div>
    )
}