import { Skeleton } from "@/components/ui/skeleton";

interface AgendaSkeletonProps {
  formato: string;
  selectedDate?: Date;
}

export function AgendaSkeleton({ formato, selectedDate = new Date() }: AgendaSkeletonProps) {
  // Skeleton para visualização de Mês
  if (formato === "Mês") {
    const diasSemana = ["SEG", "TER", "QUA", "QUI", "SEX"];
    
    // Função para gerar os dias do mês (mesma lógica da Agenda.tsx)
    interface CalendarDay {
      date: Date;
      inCurrentMonth: boolean;
    }

    const getMonthWorkDays = (date: Date): (CalendarDay | null)[] => {
      const year = date.getFullYear();
      const month = date.getMonth();
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

    const isSameDay = (date1: Date, date2: Date) => {
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      );
    };

    const monthDays = getMonthWorkDays(selectedDate);
    const today = new Date();
    
    return (
      <div 
        className="grid gap-0 bg-white rounded-[23px] shadow-sm border border-gray-200"
        style={{
          gridTemplateColumns: `repeat(5, 1fr)`,
        }}
      >
        {/* Header dos dias da semana */}
        {diasSemana.map((dia, i) => (
          <div
            key={i}
            className={`sticky top-0 bg-gray-100 border-gray-300 text-center font-medium z-5 h-10 flex items-center justify-center ${
              i === 0 ? "rounded-tl-[23px]" : ""
            } ${i === 4 ? "rounded-tr-[23px]" : ""}`}
            style={{ color: "#555555" }}
          >
            <div className="text-xs">{dia}</div>
          </div>
        ))}
        
        {/* Grid de dias do mês */}
        {monthDays
          .filter((dayObj) => dayObj !== null)
          .map((dayObj, idx) => {
            if (!dayObj) return null;

            const day = dayObj.date;
            const isToday = isSameDay(day, today);
            
            return (
              <div
                key={idx}
                className="border border-gray-200 p-2 text-center h-37"
                style={{
                  opacity: !dayObj.inCurrentMonth ? 0.4 : 1,
                }}
              >
                {/* Dia do mês + indicador de hoje */}
                <div className="text-sm font-medium flex items-center justify-center gap-1 mb-1">
                  {!isToday && (
                    <div className="text-sm font-medium">{day.getDate()}</div>
                  )}
                  {isToday && (
                    <div className="h-5 w-5 bg-(--azul-claro) rounded-full flex items-center justify-center" title="Hoje">
                      <div className="text-white">{day.getDate()}</div>
                    </div>
                  )}
                </div>
                
                {/* Agendamentos simulados em alguns dias com skeleton */}
                {idx % 3 === 0 && (
                  <div className="space-y-1 text-left">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-4/5 rounded" />
                  </div>
                )}
                {idx % 5 === 0 && idx % 3 !== 0 && (
                  <div className="space-y-1 text-left">
                    <Skeleton className="h-3 w-full rounded" />
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  }
  
  // Skeleton para visualização de Semana
  if (formato === "Semana") {
    const numColunas = 5; // Seg a Sex
    const numLinhas = 36;
    
    // Função para obter os dias da semana (mesma lógica da Agenda.tsx)
    const getWeekDays = (date: Date) => {
      const days = [];
      const current = new Date(date);
      current.setHours(0, 0, 0, 0);

      // Encontrar a segunda-feira da semana
      const dayOfWeek = current.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      current.setDate(current.getDate() + diff);

      // Adicionar segunda a sexta (5 dias)
      for (let i = 0; i < 5; i++) {
        const dayToAdd = new Date(current);
        dayToAdd.setHours(0, 0, 0, 0);
        days.push(dayToAdd);
        current.setDate(current.getDate() + 1);
      }

      return days;
    };

    const formatWeekDayHeader = (date: Date) => {
      const diasSemana = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
      const diaSemana = diasSemana[date.getDay()];
      const dia = date.getDate();
      const mes = date.getMonth() + 1;
      return `${diaSemana} ${dia}/${mes}`;
    };

    const weekDays = getWeekDays(selectedDate);
    
    return (
      <div 
        className="grid gap-0 bg-white rounded-[23px] shadow-sm border border-gray-200"
        style={{
          gridTemplateColumns: `40px repeat(${numColunas}, 1fr)`,
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 border-gray-300 rounded-tl-[23px] p-2"></div>
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`sticky top-0 bg-gray-100 border-gray-300 p-1 text-center font-medium z-5 h-10 flex items-center justify-center ${
              i === numColunas - 1 ? "rounded-tr-[23px]" : ""
            }`}
            style={{ color: "#555555" }}
          >
            <div className="text-xs">
              {formatWeekDayHeader(day)}
            </div>
          </div>
        ))}

        {/* Grid de horários */}
        {Array.from({ length: numLinhas }).map((_, idx) => {
          const horarios = [
            "09:00", "09:15", "09:30", "09:45",
            "10:00", "10:15", "10:30", "10:45",
            "11:00", "11:15", "11:30", "11:45",
            "12:00", "12:15", "12:30", "12:45",
            "13:00", "13:15", "13:30", "13:45",
            "14:00", "14:15", "14:30", "14:45",
            "15:00", "15:15", "15:30", "15:45",
            "16:00", "16:15", "16:30", "16:45",
            "17:00", "17:15", "17:30", "17:45",
          ];
          return (
          <>
            <div
              key={`time-${idx}`}
              className={`border-r border-gray-200 px-1 py-0.5 text-xs w-10 text-gray-400 text-right ${
                idx % 4 === 0 ? "border-t border-gray-300 font-semibold" : "border-t border-gray-100"
              }`}
              style={{ minHeight: "21px", height: "21px" }}
            >
              {idx % 4 === 0 ? horarios[idx] : ""}
            </div>
            {Array.from({ length: numColunas }).map((_, colIdx) => (
              <div
                key={`cell-${idx}-${colIdx}`}
                className={`border-r border-gray-200 relative ${
                  idx % 4 === 0 ? "border-t border-gray-300" : "border-t border-gray-100"
                }`}
                style={{ minHeight: "21px", height: "21px" }}
              >
                {/* Agendamentos skeleton distribuídos */}
                {((idx + colIdx * 2) % 9 === 0) && idx % 4 === 0 && (
                  <Skeleton 
                    className="absolute left-0.5 right-0.5 rounded" 
                    style={{ 
                      height: `${[42, 63, 84][(idx + colIdx) % 3]}px`,
                      top: '1px'
                    }} 
                  />
                )}
              </div>
            ))}
          </>
          );
        })}
      </div>
    );
  }
  
  // Skeleton para visualização de Dia (padrão)
  const numColunas = 2;
  const numLinhas = 36;
  
  return (
    <div 
      className="grid gap-0 bg-white rounded-[23px] shadow-sm border border-gray-200"
      style={{
        gridTemplateColumns: `40px repeat(${numColunas}, 1fr)`,
      }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-gray-50 border-gray-300 rounded-tl-[23px] p-2"></div>
      {Array.from({ length: numColunas }).map((_, i) => (
        <div
          key={i}
          className={`sticky top-0 bg-gray-100 border-gray-300 p-2 flex items-center justify-center h-10 ${
            i === numColunas - 1 ? "rounded-tr-[23px]" : ""
          }`}
        >
          <Skeleton className="h-6 w-24 rounded" />
        </div>
      ))}

      {/* Grid de horários */}
      {Array.from({ length: numLinhas }).map((_, idx) => {
        const horarios = [
          "09:00", "09:15", "09:30", "09:45",
          "10:00", "10:15", "10:30", "10:45",
          "11:00", "11:15", "11:30", "11:45",
          "12:00", "12:15", "12:30", "12:45",
          "13:00", "13:15", "13:30", "13:45",
          "14:00", "14:15", "14:30", "14:45",
          "15:00", "15:15", "15:30", "15:45",
          "16:00", "16:15", "16:30", "16:45",
          "17:00", "17:15", "17:30", "17:45",
        ];
        return (
        <>
          <div
            key={`time-${idx}`}
            className={`border-r border-gray-200 px-1 py-0.5 text-xs w-10 text-gray-400 text-right ${
              idx % 4 === 0 ? "border-t border-gray-300 font-semibold" : "border-t border-gray-100"
            }`}
            style={{ minHeight: "21px", height: "21px" }}
          >
            {idx % 4 === 0 ? horarios[idx] : ""}
          </div>
          {Array.from({ length: numColunas }).map((_, colIdx) => (
            <div
              key={`cell-${idx}-${colIdx}`}
              className={`border-r border-gray-200 relative ${
                idx % 4 === 0 ? "border-t border-gray-300" : "border-t border-gray-100"
              }`}
              style={{ minHeight: "21px", height: "21px" }}
            >
              {/* Agendamentos skeleton distribuídos */}
              {((idx + colIdx * 3) % 11 === 0) && idx % 4 === 0 && (
                <Skeleton 
                  className="absolute left-0.5 right-0.5 rounded" 
                  style={{ 
                    height: `${[42, 63, 84][(idx + colIdx) % 3]}px`,
                    top: '1px'
                  }} 
                />
              )}
            </div>
          ))}
        </>
        );
      })}
    </div>
  );
}
