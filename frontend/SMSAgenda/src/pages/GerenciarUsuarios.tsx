"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Search, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import api from "@/services/api";
import { authService } from '@/lib/auth/auth-service'
import { useDebounce } from "@/hooks/useDebounce";

export default function GerenciarUsuarios() {

    const [currentPage, setCurrentPage] = useState(1) // página atual da tabela
    const ItemsPerPage = 10 //itens por página

    const [searchName, setSearchName] = useState("") // varivavel de busca por nome
    const debouncedSearchName = useDebounce(searchName) // debounce para busca por nome

    const [searchEmail, setSearchEmail] = useState("") // varivavel de busca por email
    const debouncedSearchEmail = useDebounce(searchEmail) // debounce para busca por email

    const [searchSector, setSearchSector] = useState("") // varivavel de busca por setor
    const debouncedSearchSector = useDebounce(searchSector) // debounce para busca por setor

    const [selectedType, setSelectedType] = useState("Todos") // varivavel de filtro por permissão

    const [usersState, setUsersState] = useState<any[]>([]) // Lista final de usuários exibida na tabela
    const [totalPaginas, setTotalPaginas] = useState(1) // Total de páginas (vem do backend)
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null) // ID do usuário sendo atualizado
    const [refreshTrigger, setRefreshTrigger] = useState(0) // Força re-fetch após alterações

    // Evita overflow horizontal da página
    useEffect(() => {
        const html = document.documentElement
        const prev = html.style.overflowX
        html.style.overflowX = "hidden"
        return () => { html.style.overflowX = prev }
    }, [])

    // Status label util (moved out of effect for reuse by concurrency guards)
    const typeLabel = (s: number) => {
        switch (s) {
            case 0: return "Solicitante Normal";
            case 1: return "Solicitante Administrador";
            case 2: return "Visualizador";
            default: return "Desconhecido";
        }
    };

    // Converte label para número do tipo
    const typeToNumber = (label: string): number => {
        switch (label) {
            case "Solicitante Normal": return 0;
            case "Solicitante Administrador": return 1;
            case "Visualizador": return 2;
            default: return 0;
        }
    };

    // Mapeia tipo (Agenda) -> permissaoId (API Auth)
    // tipo 1 (Solicitante Administrador) -> permissaoId 1 (Admin)
    // tipo 0 (Solicitante Normal)        -> permissaoId 2 (Solicitante padrão)
    // tipo 2 (Visualizador)              -> permissaoId 4 (Viewer padrão)
    const mapTipoToPermissaoId = (tipoNumber: number): number => {
        if (tipoNumber === 1) return 1; // Admin
        if (tipoNumber === 2) return 4; // Viewer
        return 2; // Solicitante normal
    };

    // Função para alterar o tipo do usuário
    const handleChangeUserType = async (userId: string, newTypeNumber: number) => {
        setUpdatingUserId(userId);
        try {
            // Busca os dados completos do usuário no usersState (já contém authId e authPermId)
            const userToUpdate = usersState.find(u => u.id === userId);
            if (!userToUpdate) {
                throw new Error("Usuário não encontrado");
            }

            await api.patch(`/Solicitante/${userId}/tipo`, newTypeNumber, {
                headers: { 'Content-Type': 'application/json' }
            });

            // Atualiza também a permissão no sistema de autenticação
            const permissaoId = mapTipoToPermissaoId(newTypeNumber);
            const sistemaId = (typeof (import.meta.env.VITE_SYSTEM_ID) !== 'undefined' && (import.meta.env.VITE_SYSTEM_ID as string))
                ? (import.meta.env.VITE_SYSTEM_ID as string)
                : '0f7d734a-a964-4693-ae0d-bad8dd05fe15';

            if (!userToUpdate.authPermId) {
                console.warn(`[DEBUG] Usuário ${userId} sem authPermId. Não foi possível atualizar a permissão.`);
                alert("Usuário sem registro de permissão (authPermId ausente). Não foi possível atualizar a permissão.");
            } else {
                const permPayload = {
                    usuarioId: userToUpdate.authId,
                    sistemaId,
                    permissaoId,
                };
                await authService.atualizarPermissaoSistema(userToUpdate.authPermId, permPayload);
                console.log(`[DEBUG] Permissão do usuário ${userId} atualizada para permissaoId=${permissaoId}`);
            }
            console.log(`[DEBUG] Tipo do usuário ${userId} alterado para ${typeLabel(newTypeNumber)}`);
            // Re-fetch para refletir alteração
            setRefreshTrigger(prev => prev + 1);
        } catch (error: any) {
            console.error("Erro ao alterar tipo do usuário:", {
                status: error?.response?.status,
                data: error?.response?.data,
                message: error?.message
            });
            // Mensagem de erro detalhada para 400 (tentativa de alterar permissao administrador inviolavel)
            if (error?.response?.status === 400) {
                const data = error?.response?.data;
                const msg =
                    (typeof data === "string" && data) ||
                    data?.message ||
                    data?.mensagem ||
                    data?.error ||
                    "Requisição inválida. Verifique os dados e tente novamente.";
                alert(msg);
            } else {
                alert("Erro ao alterar o tipo do usuário. Tente novamente.");
            }
        } finally {
            setUpdatingUserId(null);
        }
    };

    // Buscar usuários com paginação server-side
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const tipoParam =
                    selectedType === "Solicitante Normal" ? 0 :
                    selectedType === "Solicitante Administrador" ? 1 :
                    selectedType === "Visualizador" ? 2 :
                    undefined;

                const res = await api.get("/Solicitante/listar", {
                    params: {
                        tamPag: ItemsPerPage,
                        pagina: currentPage,
                        buscaNome: debouncedSearchName || undefined,
                        buscaEmail: debouncedSearchEmail || undefined,
                        buscaSetor: debouncedSearchSector || undefined,
                        tipo: tipoParam,
                    }
                });

                // Backend retorna { data: [...], totalPaginas: N, ... }
                const responseData = res?.data?.data ?? [];
                const totalPags = res?.data?.totalPaginas ?? 1;

                console.log("[DEBUG] /Solicitante/listar página:", currentPage, "total páginas:", totalPags, responseData);

                const mapped = responseData
                    .filter((user: any) => user?.tipo === 0 || user?.tipo === 1 || user?.tipo === 2)
                    .map((user: any) => ({
                        id: user.id,
                        nome: user.nome ?? "",
                        email: user.email ?? "",
                        setor: user.setor ?? "",
                        ativo: user.ativo,
                        tipo: typeLabel(user.tipo),
                        authId: user.authId ?? "",
                        authPermId: user.authPermId ?? "",
                    }));

                setUsersState(mapped);
                setTotalPaginas(totalPags);
            } catch (error: any) {
                console.error("Erro ao buscar usuários:", error);
                if (error?.response?.status === 400) {
                    const data = error?.response?.data;
                    const msg =
                        (typeof data === "string" && data) ||
                        data?.message ||
                        data?.mensagem ||
                        data?.error ||
                        "Requisição inválida ao buscar usuários.";
                    alert(msg);
                }
            }
        };
        fetchUsers();
    }, [currentPage, selectedType, debouncedSearchName, debouncedSearchEmail, debouncedSearchSector, refreshTrigger]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchName, debouncedSearchEmail, debouncedSearchSector]);

    // Paginação server-side: totalPaginas vem do backend, currentUsers = usersState já paginado
    const TotalPages = totalPaginas;
    const currentUsers = usersState;
   

    return (

        <div className="relative z-0 flex flex-col h-full w-full">

            {/* Conteúdo da página: Título, Filtros, Tabela */}
            <div className="px-6 pb-6">
        

                {/* Titulo */}
                <div className="mb-9">
                    <h1 className="text-3xl font-black text-[#171717]">Gerenciar Usuários</h1>
                    <p className = "mt-3 font-regular text-base text-[#737373]">Visualize os usuários cadastrados no sistema e altere seus níveis de permissões</p>
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

                        {/* Filtro de Nome */}
                        <div className="flex-1 min-w-[75px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Nome</label>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Pesquisar nome de usuário"
                                    value={searchName}
                                    onChange={(e) => { setSearchName(e.target.value); }}
                                    className="pl-10 w-full focus:text-black placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Filtro de E-mail */}
                        <div className="flex-1 min-w-[75px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">E-mail</label>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Pesquisar e-mail de usuário"
                                    value={searchEmail}
                                    onChange={(e) => { setSearchEmail(e.target.value); }}
                                    className="pl-10 w-full focus:text-black placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Filtro de Setor */}
                        <div className="flex-1 min-w-[75px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Setor</label>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Pesquisar setor de usuário"
                                    value={searchSector}
                                    onChange={(e) => { setSearchSector(e.target.value); }}
                                    className="pl-10 w-full focus:text-black placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Filtro de Nível de Permissão */}
                        <div className="flex-1 min-w-[75px] max-w-full">
                            <label className="text-sm font-normal text-[#171717]">Tipo (nível de permissão)</label>
                            <div className="mt-2">
                                <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setCurrentPage(1) }}>
                                    <SelectTrigger className="w-full cursor-pointer">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#FFFFFF]">
                                        <SelectItem value="Todos" className="cursor-pointer hover:bg-[#F2F2F2]">Todos</SelectItem>
                                        <SelectItem value="Visualizador" className="cursor-pointer hover:bg-[#F2F2F2]">Visualizador</SelectItem>
                                        <SelectItem value="Solicitante Normal" className="cursor-pointer hover:bg-[#F2F2F2]">Solicitante Normal</SelectItem>
                                        <SelectItem value="Solicitante Administrador" className="cursor-pointer hover:bg-[#F2F2F2]">Solicitante Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>



                </div>
                

                {/* Tabela de Usuários */}
                <div className="flex-1 min-w-0 rounded-xl shadow flex flex-col">
                    <div className="h-full">


                        {/* Título e Paginação*/}
                        <div className = "bg-[#F4F4F4] rounded-t-xl shadow px-6 py-7 flex items-center justify-between shrink-0">

                            {/* Título*/}
                            <div className="flex items-center gap-4">
                                <Info className = "h-7 w-7 text-[#59C2ED]"/>
                                <div>
                                    <h2 className="text-xl font-normal text-[#171717]">Lista de Usuários</h2>
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
                                                <TableHead className="text-sm font-medium text-[#171717] w-100 min-w-0 whitespace-nowrap pl-20 sticky left-0 z-11">Nome</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] w-100 min-w-0 whitespace-nowrap pl-20">E-mail</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] w-100 min-w-0 whitespace-nowrap pl-20">Setor</TableHead>
                                                <TableHead className="text-sm font-medium text-[#171717] w-100 min-w-0 whitespace-nowrap pl-16 pr-20">Tipo (nível de permissão)</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody className="min-w-0 rounded-b-xl border-b border-gray-200 last:border-b-0">
                                            {currentUsers.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center text-sm text-gray-500 py-6">
                                                        {usersState.length === 0
                                                            ? "Nenhum usuário encontrado."
                                                            : "Nenhum resultado para os filtros aplicados."}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {currentUsers.map((user, index) => (                                         
                                            <TableRow key={`${user.id}-${index}`} className="h-16 border-b bg-white border-gray-200 last:border-b-0 ">

                                                {/*Nome do usuário*/}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <TableCell className="text-sm font-normal text-[#171717] pl-20 truncate sticky left-0 z-10 min-w-0 max-w-50 whitespace-nowrap ">
                                                                {user.nome}
                                                            </TableCell>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[300px] text-sm text-[#171717] bg-white shadow-md p-2 rounded-md wrap-break-word">
                                                            <p>{user.nome}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/*E-mail do usuário*/}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <TableCell className="pl-20 text-sm font-normal text-[#171717] truncate sticky left-0 z-10 min-w-0 max-w-50 whitespace-nowrap">
                                                                {user.email}
                                                            </TableCell>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[300px] text-sm text-[#171717] bg-white shadow-md p-2 rounded-md wrap-break-word">
                                                            <p>{user.email}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/*Setor do usuário*/}
                                                <TableCell 
                                                className="text-sm font-normal text-[#171717] truncate min-w-0 max-w-50 whitespace-nowrap pl-20" 
                                                title={user.setor}>
                                                    {user.setor}
                                                </TableCell>

                                                {/*Alterar Tipo (nível de permissão) do usuário*/}
                                                <TableCell className="pr-4 pl-16">

                                                    <div className="flex gap-2 min-w-0 whitespace-nowrap">
                                                        <Select 
                                                            value={user.tipo} 
                                                            onValueChange={(newType) => handleChangeUserType(user.id, typeToNumber(newType))}
                                                            disabled={updatingUserId === user.id}
                                                        >
                                                            <SelectTrigger className="w-[225px] cursor-pointer">
                                                                <SelectValue placeholder={user.tipo} />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#FFFFFF]">
                                                                <SelectItem 
                                                                    value="Visualizador" 
                                                                    className="cursor-pointer hover:bg-[#F2F2F2]"
                                                                    disabled={user.tipo === "Visualizador"}
                                                                >
                                                                    Visualizador
                                                                </SelectItem>
                                                                <SelectItem 
                                                                    value="Solicitante Normal" 
                                                                    className="cursor-pointer hover:bg-[#F2F2F2]"
                                                                    disabled={user.tipo === "Solicitante Normal"}
                                                                >
                                                                    Solicitante Normal
                                                                </SelectItem>
                                                                <SelectItem 
                                                                    value="Solicitante Administrador" 
                                                                    className="cursor-pointer hover:bg-[#F2F2F2]"
                                                                    disabled={user.tipo === "Solicitante Administrador"}
                                                                >
                                                                    Solicitante Administrador
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        {updatingUserId === user.id && (
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