import { FlightTicketBooking } from '../types/types';
import { createPaymentOrder } from './paymentStore';

const STORAGE_KEY = 'axofacil_flight_bookings';

export function loadFlightBookings(): FlightTicketBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFlightBookings(bookings: FlightTicketBooking[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('Erro ao guardar pedidos de reserva:', err);
  }
}

// Gera uma referência interna de pedido de reserva (nunca um PNR ou bilhete emitido por companhia aérea)
export function generateReservationReference(): string {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
    : Date.now().toString(36).slice(-6).toUpperCase();
  return `AXO-${uuid}`;
}

export function createFlightBooking(
  bookingData: Omit<FlightTicketBooking, 'id' | 'pnr' | 'ticketNumber' | 'createdAt' | 'boardingPassGenerated'>
): FlightTicketBooking {
  const bookings = loadFlightBookings();
  const internalRef = generateReservationReference();
  const bookingId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? `res-${crypto.randomUUID()}`
    : `res-${Date.now()}`;
  const now = new Date().toISOString();

  const newBooking: FlightTicketBooking = {
    ...bookingData,
    id: bookingId,
    pnr: internalRef,
    ticketNumber: `PEDIDO-${internalRef}`,
    bookingStatus: 'aguardando_confirmacao',
    paymentStatus: 'pendente',
    createdAt: now,
    boardingPassGenerated: false,
    checkInDone: false,
    qrCodeData: `PEDIDO-RESERVA:${internalRef}`
  };

  bookings.unshift(newBooking);
  saveFlightBookings(bookings);

  try {
    const passengerNames = newBooking.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
    const summary = `Pedido de Reserva [${newBooking.pnr}] ${newBooking.outboundFlight.airline.shortName} ${newBooking.outboundFlight.origin.code} -> ${newBooking.outboundFlight.destination.code} (${newBooking.tripType === 'round_trip' ? 'Ida e Volta' : 'Só Ida'}) — ${newBooking.passengers.length} passageiro(s): ${passengerNames}`;

    createPaymentOrder({
      userId: newBooking.userId,
      customerName: newBooking.contactName,
      customerPhone: newBooking.contactPhone,
      customerEmail: newBooking.contactEmail,
      targetType: 'loja',
      establishmentId: 't1',
      establishmentName: 'Agência de Viagens Parceira',
      orderItemsSummary: summary,
      subtotalAmountMT: newBooking.subtotalMT,
      deliveryFeeMT: 0,
      totalAmountMT: newBooking.totalAmountMT,
      paymentMethod:
        newBooking.paymentMethod === 'conta_movel' || newBooking.paymentMethod === 'cartao_simo'
          ? 'mpesa'
          : newBooking.paymentMethod,
      referenceNumber: newBooking.paymentReference || internalRef,
      deliveryOption: 'pickup',
      deliveryAddress: `${newBooking.outboundFlight.origin.city}`
    });
  } catch (err) {
    console.error('Erro ao registar pagamento do pedido de reserva:', err);
  }

  return newBooking;
}

export function findBookingByPnrAndSurname(pnr: string, surname: string): FlightTicketBooking | null {
  const bookings = loadFlightBookings();
  const cleanPnr = pnr.trim().toUpperCase();
  const cleanSurname = surname.trim().toLowerCase();

  return (
    bookings.find((b) => {
      const matchPnr = b.pnr.toUpperCase() === cleanPnr;
      const matchSurname =
        b.passengers.some((p) => p.lastName.toLowerCase() === cleanSurname) ||
        b.contactName.toLowerCase().includes(cleanSurname);
      return matchPnr && matchSurname;
    }) || null
  );
}

export function performWebCheckIn(pnr: string): FlightTicketBooking | null {
  const bookings = loadFlightBookings();
  const cleanPnr = pnr.trim().toUpperCase();
  const index = bookings.findIndex((b) => b.pnr.toUpperCase() === cleanPnr);

  if (index === -1) return null;
  return bookings[index];
}
