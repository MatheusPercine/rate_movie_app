import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";

interface ButtonCustomProps extends React.ComponentProps<typeof Button> {
  // Adicione props customizadas aqui se necessário
}

export function ButtonCustom({
  className,
  children,
  ...props
}: ButtonCustomProps) {
  return (
    <Button
      className={cn(
        "bg-(--azul-claro) hover:bg-(--azul-medio) text-white border-0",
        "transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

// Variante outline com borda azul
export function ButtonCustomOutline({
  className,
  children,
  ...props
}: ButtonCustomProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "bg-white!",
        "gap-2 items-center rounded-[5px] border border-(--azul-claro)! text-(--azul-claro)",
        "hover:bg-(--azul-claro)! hover:text-white",
        "hover:[&_svg]:text-white [&_svg]:text-(--azul-claro) [&_svg]:transition-all! ease-in-out duration-200 [&_svg]:h-6! [&_svg]:w-6!",
        "cursor-pointer transition-all! ease-in-out duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}


// Variante pop-up com borda azul
export function ButtonCustomPopup({
  className,
  children,
  ...props
}: ButtonCustomProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-10 w-40",
        "bg-white!",
        "gap-2 flex space-around items-center rounded-[5px] border border-(--azul-claro)! text-(--azul-claro)",
        "hover:bg-(--azul-claro)! hover:text-white",
        "hover:[&_svg]:text-white [&_svg]:text-(--azul-claro) [&_svg]:transition-all! ease-in-out duration-200 [&_svg]:h-6! [&_svg]:w-6!",
        "cursor-pointer transition-all! ease-in-out duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}


// Para a tela de descrição do agendamento
export function ButtonCustomHandleAprovar({
  className,
  children,
  ...props
}: ButtonCustomProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-10 w-40",
        "bg-white!",
        "gap-2 flex space-around items-center rounded-[5px] border border-[#5EAC75]! text-[#5EAC75]",
        "hover:bg-green-500! hover:text-white",
        "hover:[&_svg]:text-white [&_svg]:text-[#5EAC75] [&_svg]:transition-all! ease-in-out duration-200 [&_svg]:h-6! [&_svg]:w-6!",
        "cursor-pointer transition-all! ease-in-out duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

// Para a tela de descrição do agendamento
export function ButtonCustomHandleRecusar({
  className,
  children,
  ...props
}: ButtonCustomProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-10 w-40",
        "bg-white!",
        "gap-2 flex space-around items-center rounded-[5px] border border-[#E96969] text-[#E96969]",
        "hover:bg-red-500! hover:text-white",
        "hover:[&_svg]:text-white [&_svg]:text-[#E96969] [&_svg]:transition-all! ease-in-out duration-200 [&_svg]:h-6! [&_svg]:w-6!",
        "cursor-pointer transition-all! ease-in-out duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

// Para a tela de descrição do agendamento
export function ButtonCustomHandleCancelar({
  className,
  children,
  ...props
}: ButtonCustomProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-10 w-40",
        "bg-white!",
        "gap-2 flex space-around items-center rounded-[5px] border border-[#E96969] text-[#E96969]",
        "hover:bg-red-500! hover:text-white",
        "hover:[&_svg]:text-white [&_svg]:text-[#E96969] [&_svg]:transition-all! ease-in-out duration-200 [&_svg]:h-6! [&_svg]:w-6!",
        "cursor-pointer transition-all! ease-in-out duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
