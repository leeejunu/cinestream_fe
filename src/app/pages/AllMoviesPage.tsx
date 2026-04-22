import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, PlayCircle, Star, Sun, Moon, Film } from "lucide-react";
import { Header } from "../components/ui/header";

import { useAllPublicMovies } from "../hooks/useMovies";
import { getPlaceholderPoster } from "../services/movieService";

export function AllMoviesPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { movies, loading } = useAllPublicMovies();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <Header title="전체 영화" showBackButton />

      <main className="container mx-auto px-6 py-8">
        <h1 className={`text-3xl font-extrabold mb-8 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>모든 영화 보기</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <Card
              key={movie.movieId}
              className={`cursor-pointer hover:border-purple-500 hover:-translate-y-2 transition-all duration-300 overflow-hidden group shadow-lg ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
              onClick={() => navigate(`/movie/${movie.movieId}`)}
            >
              <div className="aspect-[2/3] relative overflow-hidden">
                <img
                  src={getPlaceholderPoster(movie.movieId)}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 group-hover:opacity-80 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <PlayCircle className="w-12 h-12 text-white drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300" />
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-slate-900/80 backdrop-blur-md text-amber-400 border border-slate-700 flex items-center gap-1 shadow-md text-xs py-0 px-1.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {movie.averageRating != null ? movie.averageRating.toFixed(1) : "-"}
                  </Badge>
                </div>
              </div>
              <CardContent className={`p-4 transition-colors flex flex-col items-start ${isDark ? "bg-slate-900" : "bg-white"}`}>
                <h3 className={`font-bold mb-1 w-full truncate transition-colors group-hover:text-purple-500 ${isDark ? "text-white" : "text-slate-900"}`}>{movie.title}</h3>
                <div className="flex items-center justify-between w-full mt-2">
                  <p className={`text-xs transition-colors user-select-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {movie.nickname}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
