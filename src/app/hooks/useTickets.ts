import { useState, useEffect } from "react";
import { ticketService, TicketResponse } from "../services/ticketService";
import { toast } from "sonner";

export function useMyTickets(page = 0, size = 20) {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const result = await ticketService.getMyTickets(page, size);
      const ticketsWithTitles = await Promise.all(
        result.content.map(async (ticket) => {
          try {
             // Import movieService if not already, wait, it might not be imported.
             // Let's just do a dynamic import to avoid altering the top of the file if needed, 
             // or I can import it manually at the top.
             const { movieService } = await import("../services/movieService");
             const movieDetail = await movieService.getMovieDetail(ticket.movieId);
             return { ...ticket, movieTitle: movieDetail.title };
          } catch {
             return { ...ticket, movieTitle: `영화 #${ticket.movieId}` };
          }
        })
      );
      setTickets(ticketsWithTitles as any);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, size]);

  const cancelTicket = async (ticketId: number) => {
    try {
      await ticketService.refundTicket(ticketId);
      toast.success("티켓이 환불되었습니다.");
      fetchTickets();
      window.dispatchEvent(new CustomEvent("ticket-purchased"));
    } catch (error) {
      toast.error("티켓 환불에 실패했습니다.");
    }
  };

  return { tickets, loading, totalPages, fetchTickets, cancelTicket };
}
