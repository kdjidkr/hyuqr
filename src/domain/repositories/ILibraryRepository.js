// 인터페이스 정의: 도서관 레포지토리가 구현해야 할 메서드 명세 (JSDoc)
/**
 * @typedef {Object} ILibraryRepository
 * @property {(token: string) => Promise<import('../entities/QRCode').QRCode>} getQRCode
 * @property {(token: string) => Promise<import('../entities/Seat').Seat|null>} getSeat
 * @property {(token: string, seatId: number) => Promise<boolean>} reserveSeat
 * @property {(token: string, seatCharge: number) => Promise<boolean>} cancelReservation
 * @property {(token: string, seatCharge: number) => Promise<boolean>} dischargeSeat
 */
export {};
