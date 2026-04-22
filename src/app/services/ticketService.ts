import apiClient from "./apiClient";

export interface TicketCreateRequest {
  scheduleId: number;
}

export interface CartItemResponse {
  scheduleId: number;
  movieId: number;
  title: string;
  imageUrl: string | null;
  startTime: string;
  endTime: string;
  ticketingTime: string;
  cookie: number;
}

/** RESERVED = 가예약(구매 대기), CONFIRMED = 구매 완료 */
export type TicketStatus = "RESERVED" | "CONFIRMED";

export interface TicketResponse {
  ticketId: number;
  scheduleId: number;
  userId: string;
  movieId: number;
  status: TicketStatus;
  startTime: string;
  endTime: string;
}

export interface PageResult<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const ticketService = {
  /** 내 티켓 목록 조회 */
  async getMyTickets(page = 0, size = 20): Promise<PageResult<TicketResponse>> {
    const res = await apiClient.get<PageResult<TicketResponse>>("/api/tickets", {
      params: { page, size },
    });
    return res.data;
  },

  /** 티켓 단건 조회 */
  async getTicketDetail(ticketId: number): Promise<TicketResponse> {
    const res = await apiClient.get<TicketResponse>(`/api/tickets/${ticketId}`);
    return res.data;
  },

  /** 가예약 → 구매 확정 (RESERVED → CONFIRMED, 쿠키 차감) */
  async payTicket(ticketId: number): Promise<TicketResponse> {
    const res = await apiClient.post<TicketResponse>(`/api/tickets/${ticketId}/pay`);
    return res.data;
  },

  /** 티켓 환불 (CONFIRMED → 삭제, 쿠키 복구) */
  async refundTicket(ticketId: number): Promise<void> {
    await apiClient.post(`/api/tickets/${ticketId}/refund`);
  },
};

export const cartService = {
  /** 장바구니 담기 */
  async addCartItem(scheduleId: number): Promise<void> {
    await apiClient.post(`/api/cart/${scheduleId}`);
  },

  /** 장바구니 목록 조회 */
  async getCartItems(): Promise<CartItemResponse[]> {
    const res = await apiClient.get<CartItemResponse[]>("/api/cart");
    return res.data;
  },

  /** 장바구니 수요 조회 (몇 명이 담았는지) */
  async getCartCount(scheduleId: number): Promise<number> {
    const res = await apiClient.get<number>(`/api/cart/${scheduleId}/count`);
    return res.data;
  },

  /** 장바구니 항목 삭제 */
  async removeCartItem(scheduleId: number): Promise<void> {
    await apiClient.delete(`/api/cart/${scheduleId}`);
  },
};
