import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Agenda from "./pages/Agenda.tsx";
import NovoAgendamento from "./pages/NovoAgendamento.tsx";
import { CompleteLayout } from "./components/layout.tsx";
import GerenciarAgendamentos from "./pages/GerenciarAgendamentos.tsx";
import MeusAgendamentos from "./pages/MeusAgendamentos.tsx"; // tela não-essencial e em desenvolvimento
import ResetPasswordForm from "./pages/reset-password-form.tsx";
import LoginForm from "./pages/login.tsx";
import VerifyForm from "./pages/verify-form.tsx";
import ForgotPasswordForm from "./pages/forgot-password-form.tsx";
import DescricaoAgendamento from "./pages/DescricaoAgendamento.tsx";
import GerenciarUsuarios from "./pages/GerenciarUsuarios.tsx";
import Suporte from "./pages/Suporte.tsx";
import PrivateRoute from "./routes/PrivateRoute";
import RegisterForm from "./pages/register.tsx";
import GerenciarSalas from "./pages/GerenciarSalas.tsx";

import SearchPage from "./pages/SearchPage.tsx";
import { useState } from "react";
import MovieDetailPage from "./pages/MovieDetailPage.tsx";
import RatedMoviesPage from "./pages/RatedMoviesPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "@/components/Header";

interface MoviesHeaderLayoutProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

function MoviesHeaderLayout({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedYear,
  onYearChange,
}: MoviesHeaderLayoutProps) {
  return (
    <>
      <Header
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedGenre={selectedGenre}
        onGenreChange={onGenreChange}
        selectedYear={selectedYear}
        onYearChange={onYearChange}
      />
      <Outlet />
    </>
  );
}


function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  return (
    
    
    <Routes>
      <Route path="/" element={<Navigate to="/agenda" replace />} />
      <Route
        element={
          <MoviesHeaderLayout
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        }
      >
        <Route
          path="/resultados"
          element={
            <PrivateRoute>
              <SearchPage
                searchQuery={searchQuery}
                selectedGenre={selectedGenre}
                selectedYear={selectedYear}
              />
            </PrivateRoute>
          }
        />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/rated" element={<RatedMoviesPage />} />
        <Route path="/not_found" element={<NotFound />} />
      </Route>
      <Route
        path="/gerenciar_salas"
        element={
          <PrivateRoute>
            <CompleteLayout>
             <GerenciarSalas/>
            </CompleteLayout>
          </PrivateRoute>
        }
      ></Route>
      <Route
        path="/gerenciar_usuarios"
        element={
          <PrivateRoute>
            <CompleteLayout>
             <GerenciarUsuarios/>
            </CompleteLayout>
          </PrivateRoute>
        }
      ></Route>
      <Route
        path="/gerenciar_agendamentos"
        element={
          <PrivateRoute>
            <CompleteLayout>
             <GerenciarAgendamentos/>
            </CompleteLayout>
          </PrivateRoute>
        }
      ></Route>
      <Route
        path="/descricao_agendamento/:id"
        element={
          <PrivateRoute>
            <CompleteLayout>
             <DescricaoAgendamento/>
            </CompleteLayout>
          </PrivateRoute>
        }
      ></Route>
      <Route 
        path="/suporte"
        element={
          <PrivateRoute>
            <CompleteLayout>
              <Suporte />
            </CompleteLayout>
          </PrivateRoute>
        }
      ></Route>
      <Route
        path="/agenda"
        element={
          <PrivateRoute>
            <CompleteLayout>
              <Agenda />
            </CompleteLayout>
          </PrivateRoute>
        }
        
      ></Route> 
      <Route 
        path="/novo_agendamento"
        element={
          <PrivateRoute>
            <CompleteLayout>
              <NovoAgendamento />
            </CompleteLayout>
          </PrivateRoute>
        }
      ></Route>
      <Route
        path="/auth/esqueci-senha"
        element={<ForgotPasswordForm />}
      ></Route>
      <Route
        path="/login"
        element={<LoginForm />}
      ></Route>
      <Route
        path="/registrar"
        element={<RegisterForm />}
      ></Route>
      <Route
        path="/auth/trocar-senha"
        element={<ResetPasswordForm />}
      ></Route>
      <Route
        path="/auth/verificar-codigo"
        element={<VerifyForm />}
      ></Route>
    </Routes>
  );
}

export default App;
