import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Search, Info, CalendarX } from "lucide-react";
import api from "@/services/api";
import { ptBR } from "date-fns/locale/pt-BR";


export default function Suporte() {


    return(
        <div className="relative z-0 flex flex-col h-full w-full">

            {/* Conteúdo da página: Título, informações de funcionamento, informações de contato */}
            <div className="px-6 pb-6">

                {/* Titulo da página*/}
                <div className="mb-9">
                    <h1 className="text-3xl font-black text-[#171717]">Suporte</h1>
                    <p className="mt-3 font-regular text-base text-[#737373]">Informações de contato e funcionamento</p>
                </div>

                {/* Informações de Contato*/}
                <div className="mb-5 rounded-xl shadow overflow-hidden">

                    {/* Título*/}
                    <div className = "bg-[#F4F4F4] rounded-t-xl">

                        <div className="flex items-center gap-4 pl-6 py-7">
                            <Info className = "h-7 w-7 text-[#59C2ED]"/>
                            <h2 className="text-xl font-normal text-[#171717]">Informações de contato</h2>
                        </div>

                    </div>

                    {/* Conteúdo */}
                    <div className="flex flex-col gap-6 px-6 pb-6 pt-5 bg-white">

                            <p>Email de suporte: planejamentoeprojetos.cgp.sms@gmail.com</p>
                            <p>Celular de suporte: (21) 3971-3992 </p>

                    </div>

                </div>

                {/* Informações de funcionamento */}
                <div className="mb-5 rounded-xl shadow overflow-hidden">

                    {/* Título*/}
                    <div className = "bg-[#F4F4F4] rounded-t-xl">

                        <div className="flex items-center gap-4 pl-6 py-7">
                            <Info className = "h-7 w-7 text-[#59C2ED]"/>
                            <h2 className="text-xl font-normal text-[#171717]">Informações de funcionamento</h2>
                        </div>

                    </div>

                    {/* Conteúdo */}
                    <div className="flex flex-col gap-6 px-6 pb-6 pt-5 bg-white">

                            <p>Este é o sistema de agendamento de salas da Secretaria Municipal de Saúde.</p>

                            <p>Todas as salas estão disponíveis para agendamento de segunda a sexta, das 9:00 às 17:00.</p>

                            <p>Não é possível agendar agendamentos cujo número de participantes exceda a capacidade da sala.</p>

                            <p>Entre um agendamento e outro, na mesma sala, deve ter um intervalo mínimo de 30 minutos.</p>

                            <p>Ao criar um agendamento, o agendamento deve ter um intervalo mínimo de 10 minutos.</p>

                            <p>A partir do dia 15 de todo mês, os agendamentos para o mês seguinte estarão disponíveis para solicitação.</p>

                            <div className="space-y-2">
                                <p>Salas para agendamento (alguma sala pode estar indisponível no momento):</p>
                                <ul className="list-disc ml-6 space-y-1">
                                    <li>Sala 810 (Local: 8º andar)</li>
                                    <li>Sala 601 (Local: 6º andar, departamento de RH)</li>
                                    <li>Laboratório de informática (Local: 6º andar, departamento de RH)</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <p>Definições dos status de agendamento:</p>

                                <ul className="list-disc ml-6 space-y-1">
                                    <li>Pendente: agendamento criado e no aguardo de aprovação</li>
                                    <li>Aprovado: agendamento pendente foi aprovado</li>
                                    <li>Recusado: agendamento pendente foi recusado</li>
                                    <li>Cancelado: agendamento aprovado foi cancelado</li>
                                    <li>Expirado: agendamento pendente não foi aprovado ou recusado até seu horário de início</li>
                                    <li>Fracassado: solicitante/responsável pelo uso não compareceu ao agendamento aprovado</li>
                                </ul>
                            </div>

                    </div>

                </div>

            </div>




        </div>

    )
}