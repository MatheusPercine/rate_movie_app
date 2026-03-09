import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, X, User, UserPlus, Film, LogOut } from "lucide-react";
import { GENRES, YEARS } from "@/constants/movie-filters";
import { useAuth } from "@/lib/auth/auth-context";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

const Header = ({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedYear,
  onYearChange,
}: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, estaAutenticado, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto flex items-center gap-4 px-4 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Film className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary tracking-tight">CineRate</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 shrink-0">
          <Link
            to="/results"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              location.pathname === "/results"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Início
          </Link>
          <Link
            to="/rated"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              location.pathname === "/rated"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Avaliados
          </Link>
        </nav>

        {/* Genre filter */}
        <select
          value={selectedGenre}
          onChange={(e) => {
            onGenreChange(e.target.value);
            if (location.pathname !== "/results") navigate("/results");
          }}
          className="bg-secondary text-secondary-foreground text-sm rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
        >
          <option value="">Gênero</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Year filter */}
        <select
          value={selectedYear}
          onChange={(e) => {
            onYearChange(e.target.value);
            if (location.pathname !== "/results") navigate("/results");
          }}
          className="bg-secondary text-secondary-foreground text-sm rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
        >
          <option value="">Ano</option>
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>

        {/* Search bar */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar filmes..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (location.pathname !== "/results") navigate("/results");
            }}
            className="w-full bg-secondary text-foreground text-sm rounded-md pl-9 pr-8 py-1.5 border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {estaAutenticado && usuario ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground">
                Olá, <span className="text-foreground font-medium">{usuario.name}</span>
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border"
              >
                <User className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
              >
                <UserPlus className="h-4 w-4" />
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
