# API 명세서

> 모든 외부 요청은 Gateway Service (`localhost:8000`)를 통해 라우팅됩니다.
> 인증 방식: JWT → Gateway가 검증 후 `X-User-Id` / `X-Creator-Id` 헤더를 하위 서비스에 주입

---

## 서비스 포트 정보

| 서비스 | 포트 |
|--------|------|
| Gateway Service | 8000 |
| Creator Service | 8080 |
| Payment Service | 8081 |
| Settlement Service | 8083 |
| Ticket Service | 8084 |
| User Service | 8085 |
| Movie Service | 8086 |
| Review Service | 8087 |

---

## 목차

1. [Gateway Service](#1-gateway-service-port-8000)
2. [Creator Service](#2-creator-service-port-8080)
3. [Movie Service](#3-movie-service-port-8086)
4. [Payment Service](#4-payment-service-port-8081)
5. [Review Service](#5-review-service-port-8087)
6. [Settlement Service](#6-settlement-service-port-8083)
7. [Ticket Service](#7-ticket-service-port-8084)
8. [User Service](#8-user-service-port-8085)

---

## 1. Gateway Service (port: 8000)

Spring Cloud Gateway로 구성되어 있으며 별도의 REST 컨트롤러 없이 라우팅만 담당합니다.

| 경로 | 대상 서비스 |
|------|-------------|
| `/api/creators/**` | Creator Service (8080) |
| `/api/payments/**` | Payment Service (8081) |
| `/api/settlements/**` | Settlement Service (8083) |
| `/api/tickets/**` | Ticket Service (8084) |
| `/api/users/**` | User Service (8085) |
| `/api/movies/**` | Movie Service (8086) |
| `/api/reviews/**` | Review Service (8087) |

---

## 2. Creator Service (port: 8080)

### CreatorController — `/api/creators`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `/join` | 회원가입 | Body: `JoinRequest` | `UUID` (201) |
| GET | `/email/check` | 이메일 중복 확인 | Query: `email` | 200 |
| GET | `/nickname/check` | 닉네임 중복 확인 | Query: `nickname` | 200 |
| POST | `/login` | 로그인 | Body: `LoginRequest` | `TokenResponse` |
| POST | `/refresh` | 토큰 갱신 | Body: `String` (refreshToken) | `TokenResponse` (201) |
| GET | `/authorization/check` | 권한 확인 | Query: `AuthorizationRequest`, Header: `X-Creator-Id` | `Boolean` |

### CreatorInternalController — `/internal/creators`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| GET | `/{creatorId}/payout-account` | 정산 계좌 조회 (내부용) | Path: `creatorId (UUID)` | `PayoutAccountResponse` |

---

### DTOs

#### JoinRequest
| 필드 | 타입 | 필수 |
|------|------|:----:|
| email | String | ✅ |
| password | String | ✅ |
| nickname | String | ✅ |
| phoneNumber | String | ❌ |
| bankName | String | ❌ |
| accountNumber | String | ❌ |
| accountHolder | String | ❌ |

#### LoginRequest
| 필드 | 타입 | 필수 |
|------|------|:----:|
| email | String | ✅ |
| password | String | ✅ |

#### AuthorizationRequest
| 필드 | 타입 | 필수 |
|------|------|:----:|
| httpMethod | HttpMethod | ✅ |
| requestPath | String | ✅ |

#### TokenResponse
| 필드 | 타입 |
|------|------|
| accessToken | String |
| refreshToken | String |

#### PayoutAccountResponse
| 필드 | 타입 |
|------|------|
| id | UUID |
| bankName | String |
| accountNumber | String |
| accountHolder | String |

---

## 3. Movie Service (port: 8086)

### MovieController — `/api/movies`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `/creator/register` | 영화 등록 | Header: `X-Creator-Id`, Body: `RegisterMovieRequest` | `RegisterMovieResponse` (201) |
| PATCH | `/creator/{movieId}/visibility` | 공개 여부 변경 | Header: `X-Creator-Id`, Path: `movieId`, Body: `UpdateVisibilityRequest` | 204 |
| PATCH | `/creator/{movieId}/detail` | 상세 정보 수정 | Header: `X-Creator-Id`, Path: `movieId`, Body: `UpdateDetailRequest` | 204 |
| DELETE | `/creator/{movieId}` | 영화 삭제 | Header: `X-Creator-Id`, Path: `movieId` | 204 |
| GET | `/creator/{movieId}/detail` | 영화 상세 조회 (크리에이터용) | Header: `X-Creator-Id`, Path: `movieId` | `DetailForCreatorResponse` |
| GET | `/{movieId}/detail` | 영화 상세 조회 (사용자용) | Path: `movieId` | `DetailForUserResponse` |
| GET | `/list` | 크리에이터별 공개 영화 목록 | Query: `creatorId (UUID)` | `List<MovieByCreatorResponse>` |
| GET | `/creator/list` | 내 영화 전체 목록 | Header: `X-Creator-Id` | `List<MovieForCreatorResponse>` |
| GET | `/creator/schedulable` | 편성 가능한 영화 목록 | Header: `X-Creator-Id` | `List<MovieForScheduleResponse>` |
| GET | `/on-air` | 현재 상영 중인 영화 목록 | - | `List<MovieCardResponse>` |
| GET | `/scheduled` | 상영 예정 영화 목록 | - | `List<ScheduledMovieResponse>` |
| GET | `/public` | 전체 공개 영화 목록 | - | `List<MovieCardResponse>` |
| GET | `/genre/{categoryId}` | 장르별 영화 목록 | Path: `categoryId` | `List<MovieCardResponse>` |
| GET | `/search` | 영화 제목 검색 | Query: `title` (기본값 `""`) | `List<MovieCardResponse>` |

### CategoryController — `/api/movies/categories`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| GET | `` | 카테고리 목록 조회 | - | `List<CategoryResponse>` |
| POST | `/register` | 카테고리 등록 | Body: `RegisterCategoryRequest` | `RegisterCategoryResponse` (201) |

### ScheduleController — `/api/movies/schedules`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `/creator/register` | 상영 일정 등록 | Header: `X-Creator-Id`, Body: `RegisterScheduleRequest` | 201 |
| GET | `/creator/draft` | 미확정 편성 목록 조회 | Header: `X-Creator-Id`, Query: `date (LocalDate)` | `List<DraftScheduleResponse>` |
| PATCH | `/creator/confirm` | 상영 일정 확정 | Header: `X-Creator-Id`, Body: `List<UpdateConfirmRequest>` | 204 |
| DELETE | `/creator/{scheduleId}` | 미확정 일정 삭제 | Header: `X-Creator-Id`, Path: `scheduleId` | 204 |
| GET | `` | 특정 영화 상영 일정 조회 | Query: `movieId` | `List<ScheduleForUserResponse>` |
| GET | `/search` | 날짜별 확정 일정 조회 | Query: `CreatorId`, Query: `date` | `List<ScheduleForCreatorResponse>` |

---

### DTOs

#### RegisterMovieRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| title | String | 필수 |
| description | String | 필수 |
| runningTime | Integer | 필수, 양수 |
| baseCookie | Integer | 필수, 0 이상 |
| additionalCookie | Integer | 필수, 0 이상 |
| categoryIds | List\<Long\> | 선택 |

#### UpdateDetailRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| title | String | 필수 |
| description | String | 필수 |
| additionalCookie | Integer | 필수, 0 이상 |
| categoryIds | List\<Long\> | 선택 |

#### UpdateVisibilityRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| visibility | `PUBLIC` \| `PRIVATE` | 필수 |

#### RegisterCategoryRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| name | String | 필수 |

#### RegisterScheduleRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| movieId | Long | 필수 |
| startTime | LocalDateTime | 필수 |
| endTime | LocalDateTime | 필수 |

#### UpdateConfirmRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| scheduleId | Long | 필수 |

#### RegisterMovieResponse
| 필드 | 타입 |
|------|------|
| movieId | Long |

#### RegisterCategoryResponse
| 필드 | 타입 |
|------|------|
| categoryId | Long |

#### CategoryResponse
| 필드 | 타입 |
|------|------|
| categoryId | Long |
| name | String |

#### MovieCardResponse
| 필드 | 타입 |
|------|------|
| movieId | Long |
| creatorId | UUID |
| nickname | String |
| title | String |
| averageRating | Double |
| categoryIds | List\<Long\> |

#### MovieByCreatorResponse
| 필드 | 타입 |
|------|------|
| movieId | Long |
| title | String |
| averageRating | Double |
| categoryIds | List\<Long\> |

#### MovieForCreatorResponse
| 필드 | 타입 |
|------|------|
| movieId | Long |
| title | String |
| visibility | Visibility |

#### MovieForScheduleResponse
| 필드 | 타입 |
|------|------|
| movieId | Long |
| title | String |
| runningTime | Integer |

#### ScheduledMovieResponse
| 필드 | 타입 |
|------|------|
| movieId | Long |
| creatorId | UUID |
| nickname | String |
| title | String |
| startTime | LocalDateTime |
| categoryIds | List\<Long\> |

#### DetailForCreatorResponse
| 필드 | 타입 |
|------|------|
| title | String |
| description | String |
| categoryIds | List\<Long\> |
| baseCookie | Integer |
| additionalCookie | Integer |

#### DetailForUserResponse
| 필드 | 타입 |
|------|------|
| creatorId | UUID |
| nickname | String |
| title | String |
| description | String |
| categoryIds | List\<Long\> |
| runningTime | Integer |
| averageRating | Double |
| cookie | Integer |
| schedules | List\<ScheduleForUserResponse\> |
| reviews | List\<ReviewSummaryResponse\> |

#### DraftScheduleResponse
| 필드 | 타입 |
|------|------|
| scheduleId | Long |
| title | String |
| startTime | LocalDateTime |
| endTime | LocalDateTime |
| isConfirmed | Boolean |
| status | String |

#### ScheduleForCreatorResponse
| 필드 | 타입 |
|------|------|
| scheduleId | Long |
| title | String |
| startTime | LocalDateTime |
| endTime | LocalDateTime |
| totalSeats | Integer |
| remainingSeats | Integer |

#### ScheduleForUserResponse
| 필드 | 타입 |
|------|------|
| scheduleId | Long |
| startTime | LocalDateTime |
| remainingSeats | Integer |
| status | String |

#### ReviewSummaryResponse (Movie Service 내부 사용)
| 필드 | 타입 |
|------|------|
| reviewId | Long |
| nickname | String |
| rating | Integer |
| comment | String |
| updatedAt | LocalDateTime |
| status | ReviewStatus |

---

## 4. Payment Service (port: 8081)

### PaymentController — `/api/payments/payment`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `` | 결제 생성 | Header: `X-User-Id`, Body: `PaymentRequest` | `PaymentInfo` (201) |
| POST | `/confirm` | 결제 승인 | Body: `PaymentConfirmRequest` | `PaymentInfo` |
| POST | `/{paymentId}/fail` | 결제 실패 처리 | Path: `paymentId` | `PaymentInfo` |
| GET | `/{paymentId}` | 결제 단건 조회 | Path: `paymentId` | `PaymentInfo` |
| GET | `/users` | 사용자별 결제 목록 | Header: `X-User-Id` | `List<PaymentInfo>` |

### RefundController — `/api/payments/refund`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `` | 환불 요청 | Header: `X-User-Id`, Body: `RefundRequest` | `RefundInfo` (201) |
| POST | `/{refundId}/approve` | 환불 승인 | Path: `refundId` | `RefundInfo` |
| POST | `/{refundId}/reject` | 환불 거절 | Path: `refundId` | `RefundInfo` |
| GET | `/{refundId}` | 환불 단건 조회 | Path: `refundId` | `RefundInfo` |
| GET | `/users` | 사용자별 환불 목록 | Header: `X-User-Id` | `List<RefundInfo>` |

---

### DTOs

#### PaymentRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| amount | int | 필수, 양수 (원 단위) |
| cookieAmount | int | 필수, 양수 |

#### PaymentConfirmRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| paymentId | Long | 필수 |
| paymentKey | String | 필수 |
| orderId | String | 필수 |

#### RefundRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| paymentId | Long | 필수 |
| cookieAmount | int | 필수, 양수 |

#### PaymentInfo
| 필드 | 타입 |
|------|------|
| paymentId | Long |
| userId | UUID |
| amount | int |
| cookieAmount | int |
| status | PaymentStatus |
| paymentKey | String |
| orderId | String |
| createdAt | LocalDateTime |

#### RefundInfo
| 필드 | 타입 |
|------|------|
| refundId | Long |
| paymentId | Long |
| userId | UUID |
| cookieAmount | int |
| status | RefundStatus |
| createdAt | LocalDateTime |

---

## 5. Review Service (port: 8087)

### ReviewController — `/api/reviews`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `` | 리뷰 작성 | Header: `X-User-Id`, Body: `WriteReviewRequest` | `ReviewResponse` (201) |
| PUT | `/{reviewId}` | 리뷰 수정 | Header: `X-User-Id`, Path: `reviewId`, Body: `UpdateReviewRequest` | `ReviewResponse` |
| DELETE | `/{reviewId}` | 리뷰 삭제 | Header: `X-User-Id`, Path: `reviewId` | 204 |
| GET | `/me` | 내 리뷰 목록 | Header: `X-User-Id`, Query: `page` (기본 0), `size` (기본 20) | `PageResult<ReviewResponse>` |

---

### DTOs

#### WriteReviewRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| movieId | Long | 필수 |
| comment | String | 필수 |
| rating | Integer | 필수, 1~5 |

#### UpdateReviewRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| comment | String | 필수 |
| rating | Integer | 필수, 1~5 |

#### ReviewResponse
| 필드 | 타입 |
|------|------|
| reviewId | Long |
| nickname | String |
| movieId | Long |
| rating | Integer |
| comment | String |
| status | ReviewStatus |
| createdAt | LocalDateTime |

---

## 6. Settlement Service (port: 8083)

### SettlementController — `/api/settlements`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `` | 정산 신청 | Header: `X-Creator-Id`, `Idempotency-Key`, Body: `PostSettlementRequest` | `SettlementResponse` (201) |
| POST | `/{id}/cancel` | 정산 취소 | Header: `X-Creator-Id`, Path: `id` | `SettlementResponse` |
| GET | `/{id}` | 정산 단건 조회 | Header: `X-Creator-Id`, Path: `id` | `SettlementResponse` |
| GET | `` | 정산 목록 조회 | Header: `X-Creator-Id` | `List<SettlementResponse>` |

### WalletController — `/api/wallets`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| GET | `/me` | 지갑 잔액 조회 | Header: `X-Creator-Id` | `WalletResponse` |

---

### DTOs

#### PostSettlementRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| requestAmount | Long | 필수, 양수 |

#### SettlementResponse
| 필드 | 타입 |
|------|------|
| id | Long |
| creatorId | UUID |
| status | `REQUESTED` \| `CONFIRMED` \| `COMPLETED` \| `FAILED` \| `CANCELLED` |
| requestAmount | Long |
| requestedAt | OffsetDateTime |
| settlementDeadline | OffsetDateTime |
| payoutBankName | String |
| payoutAccountNumber | String |
| payoutAccountHolder | String |

#### WalletResponse
| 필드 | 타입 |
|------|------|
| creatorId | UUID |
| balance | Long |

---

## 7. Ticket Service (port: 8084)

### TicketController — `/api/tickets`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `` | 티켓 예약 | Header: `X-User-Id`, Body: `TicketCreateRequest` | `TicketResponse` (201) |
| GET | `/{ticketId}` | 티켓 단건 조회 | Header: `X-User-Id`, Path: `ticketId` | `TicketResponse` |
| GET | `` | 내 티켓 목록 조회 | Header: `X-User-Id`, Query: `page` (기본 0), `size` (기본 20) | `PageResult<TicketResponse>` |
| DELETE | `/{ticketId}` | 티켓 취소 | Header: `X-User-Id`, Path: `ticketId` | 204 |

---

### DTOs

#### TicketCreateRequest
| 필드 | 타입 | 제약 |
|------|------|------|
| scheduleId | Long | 필수 |

#### TicketResponse
| 필드 | 타입 |
|------|------|
| ticketId | Long |
| scheduleId | Long |
| userId | UUID |
| movieId | Long |
| status | TicketStatus |
| startTime | LocalDateTime |
| endTime | LocalDateTime |

#### DeductCookieRequest (내부 서비스용)
| 필드 | 타입 | 제약 |
|------|------|------|
| ticketId | Long | 필수 |
| amount | Integer | 필수 |
| userId | UUID | 필수 |

#### DeductCookieResponse (내부 서비스용)
| 필드 | 타입 |
|------|------|
| userId | UUID |
| ticketId | Long |
| deductCookieAmount | Integer |
| flag | boolean |

---

## 8. User Service (port: 8085)

### UserController — `/api/users`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `/join` | 회원가입 | Body: `JoinRequest` | `UUID` (201) |
| GET | `/email/check` | 이메일 중복 확인 | Query: `email` | 200 |
| GET | `/nickname/check` | 닉네임 중복 확인 | Query: `nickname` | 200 |
| POST | `/login` | 로그인 | Body: `LoginRequest` | `TokenResponse` |
| POST | `/refresh` | 토큰 갱신 | Body: `String` (refreshToken) | `TokenResponse` (201) |
| POST | `/logout` | 로그아웃 | Header: `X-User-Id` | 200 |
| GET | `/authorization/check` | 권한 확인 | Query: `AuthorizationRequest`, Header: `X-User-Id` | `Boolean` |
| GET | `/me` | 내 정보 조회 | Header: `X-User-Id` | `UserInfoResponse` |
| PUT | `/me` | 프로필 수정 | Header: `X-User-Id`, Body: `UpdateProfileRequest` (multipart/form-data) | 200 |

### UserInternalController — `/internal/users`

| HTTP | 경로 | 설명 | Request | Response |
|------|------|------|---------|----------|
| POST | `/deduct/cookie` | 쿠키 차감 (내부용) | Body: `DeductCookieRequest` | `DeductCookieResponse` |

---

### DTOs

#### JoinRequest
| 필드 | 타입 | 필수 |
|------|------|:----:|
| email | String | ✅ |
| password | String | ✅ |
| nickname | String | ✅ |

#### LoginRequest
| 필드 | 타입 | 필수 |
|------|------|:----:|
| email | String | ✅ |
| password | String | ✅ |

#### AuthorizationRequest
| 필드 | 타입 | 필수 |
|------|------|:----:|
| httpMethod | HttpMethod | ✅ |
| requestPath | String | ✅ |

#### UpdateProfileRequest (multipart/form-data)
| 필드 | 타입 | 필수 |
|------|------|:----:|
| nickname | String | ✅ |
| phone | String | ❌ |
| profileImage | MultipartFile | ❌ |

#### DeductCookieRequest
| 필드 | 타입 | 필수 |
|------|------|:----:|
| ticketId | Long | ✅ |
| amount | Integer | ✅ |
| userId | UUID | ✅ |

#### TokenResponse
| 필드 | 타입 |
|------|------|
| accessToken | String |
| refreshToken | String |

#### UserInfoResponse
| 필드 | 타입 |
|------|------|
| nickname | String |
| cookieBalance | Integer |
| email | String |
| profileUrl | String |
| phone | String |

#### DeductCookieResponse
| 필드 | 타입 |
|------|------|
| userId | UUID |
| ticketId | Long |
| deductCookieAmount | Integer |
| flag | boolean |
