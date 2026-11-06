export type Category = 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'construcao' | 'pecas_auto' | 'ferragens' | 'turismo' | 'entregador';

// Sub-tipo de pacote/serviço dentro do escritório de Turismo & Viagens
export type TourismPackageType = 'internacional' | 'domestico' | 'religioso' | 'bilhete' | 'logistica';

export interface ProductVariant {
  id: string;
  name: string; // e.g. "500 Gramas", "1 Quilograma", "5 Kg", "Saco 25kg", "1 Unidade", "Caixa com 5", "Garrafão 5 Litros"
  priceMT: number;
  promoPriceMT?: number;
  stockQty?: number; // Quantity available in stock
  imageUrl?: string; // Micro-image specific to this variant
  specs?: string; // Specification or compatibility details e.g. "Ref: TOY-48520, Toyota Hilux D4D"
}

export interface ProductItem {
  id: string;
  name: string;
  priceMT: number;
  promoPriceMT?: number;
  imageUrl?: string;
  category?: string; // Subcategory within store e.g. "Filtros & Lubrificantes", "Travões & Suspensão", "Motor", "Hortifrúti", "Cereais"
  subCategory?: string;
  isPromo?: boolean;
  isAvailable?: boolean; // Default true. Store owner marks false if out of stock
  stockQty?: number; // Total units or kilos available in stock
  description?: string;
  reference?: string; // Product reference/code e.g. "REF-AUTO-101"
  vatIncluded?: boolean; // Default true (16% IVA Mozambique tax included)
  unitLabel?: string; // e.g. "Kg", "Unidade", "Saco 25kg", "Litro", "Caixa", "Pacote"
  variants?: ProductVariant[]; // Micro-image / size / weight options (Alibaba style)
  allowBuyNow?: boolean; // Default true
  allowSchedule?: boolean; // Allows pre-ordering or scheduling delivery/service
  upfrontPercentage?: number; // Upfront down payment percentage for pre-order/scheduling e.g. 20, 50, 100
  brandCompatibility?: string[]; // Compatible car brands/models e.g. ["Toyota Hilux", "Nissan Hardbody", "Honda Fit", "Isuzu KB"]

  // TURISMO & VIAGENS — campos usados quando o produto representa um pacote/serviço de turismo
  tourismType?: TourismPackageType; // internacional | domestico | religioso | bilhete | logistica
  destination?: string; // e.g. "Roma & Vaticano, Itália" ou "Ponta do Ouro, Moçambique"
  originCity?: string; // Cidade/país de partida, útil para pacotes internacionais
  durationLabel?: string; // e.g. "7 dias / 6 noites"
  departureDates?: string[]; // Datas de partida disponíveis, formato "YYYY-MM-DD"
  minGroupSize?: number; // Nº mínimo de pessoas para confirmar a saída
  maxGroupSize?: number; // Capacidade máxima do grupo/veículo (ex: 30 lugares do minibus)
  includesTransport?: boolean;
  includesLodging?: boolean;
  includesMeals?: boolean;
  includesGuide?: boolean;
  includesAirportPickup?: boolean;
  itineraryHighlights?: string[]; // Pontos altos do roteiro, dia a dia (resumo)
}

export type MozambiqueProvinceName =
  | 'Cidade de Maputo'
  | 'Província de Maputo'
  | 'Província de Maputo (Matola/Zimpeto/Boane)'
  | 'Gaza'
  | 'Inhambane'
  | 'Sofala'
  | 'Manica'
  | 'Tete'
  | 'Zambézia'
  | 'Nampula'
  | 'Cabo Delgado'
  | 'Niassa'
  | string;

export interface Establishment {
  id: string;
  name: string;
  category: Category;
  zone: string;
  city?: string;
  district?: string;
  province?: MozambiqueProvinceName;
  address: string;
  latitude?: number;
  longitude?: number;
  addressText?: string;
  locationLandmarks?: string; // Landmark reference e.g. "Próximo à Paragem do Museu, a 50m da Av. Karl Marx"
  description: string;
  rating: number;
  reviewCount?: number;
  metaInfo: string; // e.g. "Aberto até 2h" or "Diária: 1.800 MT"
  promotion?: string;
  coverColor: string;
  imageUrl?: string;
  gallery?: string[];
  features: string[];
  contactPhone?: string;
  whatsappLink?: string;
  salesType?: 'grosso' | 'retalho' | 'ambos';
  productsList?: string[];
  productsCatalog?: ProductItem[];
  products?: ProductItem[];
  operatorsList?: string[]; // Multiple store staff/vendedores
  segment?: string; // e.g. "Vestuário & Moda", "Eletrónicos", "Supermercado & Alimentação"
  isActive?: boolean; // Default true. Can be deactivated by admin if subscription expires.
  isOpen?: boolean;
  isVerified?: boolean;
  subscriptionDueDate?: string;
  hasIntegratedDelivery?: boolean; // True if establishment opted into personalized synced delivery service
  subscriptionPlanType?: 'basico' | 'pro' | 'premium_delivery' | 'bronze' | 'prata' | 'ouro';

  // TURISMO & VIAGENS — usado quando category === 'turismo' (agência/escritório de turismo)
  ownFleet?: { vehicleType: string; capacity: number; plateNumber?: string }[]; // Frota própria, ex: minibus 30 lugares
  hasOwnGuides?: boolean; // Guias turísticos próprios contratados
  partnerLodgesHotels?: string[]; // Nomes de lodges/hotéis parceiros com preços/comissão acordados
  sellsFlightTickets?: boolean; // Vende e gere bilhetes aéreos/reservas
  offersLogistics?: boolean; // True se este escritório presta também serviço de logística/entregas entre lojas do Axofácil!
  logisticsCoverageZones?: string[]; // Zonas/cidades cobertas pelo serviço de logística, ex: ["Maputo", "Matola", "Boane"]
  deliveryFleetSize?: number; // Nº de veículos dedicados ao serviço de logística/entregas (pode incluir a mesma frota do turismo)
  
  // Store Owner & Payment Account Details (Configurações da Loja e Contas de Pagamento)
  ownerName?: string; // Nome do titular da loja / proprietário
  nuit?: string; // NUIT da loja / entidade
  mpesaNumber?: string; // Número M-Pesa da loja para receber pagamentos
  mpesaHolder?: string; // Nome do titular da conta M-Pesa
  mpesaAccount?: string; // Código de agente / conta M-Pesa
  emolaNumber?: string; // Número e-Mola da loja para receber pagamentos
  emolaHolder?: string; // Nome do titular da conta e-Mola
  emolaAccount?: string; // Código de agente / conta e-Mola
  bankName?: string; // Banco principal (BIM, BCI, Standard Bank, etc.)
  bankAccount?: string; // Número da conta bancária
  bankNib?: string; // NIB (Número de Identificação Bancária)
  bankHolder?: string; // Nome do titular da conta bancária
  defaultCustomerName?: string; // Nome do cliente padrão de balcão
  defaultCustomerPhone?: string; // Telefone do cliente padrão
  defaultCustomerNuit?: string; // NUIT do cliente
  receiptFooterMsg?: string; // Mensagem de rodapé personalizada do recibo térmico
  defaultVatRate?: number; // Taxa padrão de IVA (%)
  managerPin?: string; // PIN de acesso ao caixa e gestão (ex: 1234)

  // Stats
  visits: number;
  searches: number;
  salesOrReservations: number;
}

export interface OrderRecord {
  id: string;
  userId?: string;
  establishmentId: string;
  establishmentName: string;
  category: Category;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'pedido_compra' | 'agendamento_reserva' | 'servico';
  itemsOrService: string; // e.g. "Arroz 25kg (2x) + Oleo 5L" or "Reserva Quarto Executivo (3 Noites)"
  totalAmount: number; // in Meticais (MT)
  paymentMethod: 'M-Pesa' | 'e-Mola' | 'Transferência BCI/BIM' | 'Dinheiro' | 'POS Cartão';
  status: 'Pendente' | 'Confirmado' | 'Concluído' | 'Cancelado';
  date: string; // YYYY-MM-DD
  time?: string;
  bookingStartDate?: string;
  bookingEndDate?: string;
  deliveryOption?: 'pickup' | 'estafeta_axofacil' | 'propria_loja';
  deliveryAddress?: string;
  notes?: string;
  operatorName?: string;
}

export interface CustomerRecord {
  id: string;
  establishmentId: string;
  name: string;
  phone: string;
  email?: string;
  totalOrdersCount: number;
  totalSpentMT: number;
  lastOrderDate: string;
  notes?: string;
  tags?: string[]; // e.g. ["VIP", "Revendedor", "Frequente", "Hóspede Recorrente"]
}

export interface FinancialTransaction {
  id: string;
  establishmentId: string;
  date: string; // YYYY-MM-DD
  type: 'receita' | 'despesa';
  category: 'Vendas de Produtos' | 'Diárias de Hospedagem' | 'Serviços & Reservas' | 'Entregas & Frete' | 'Reposição de Stock / Mercadoria' | 'Renda / Aluguer' | 'Salários & Pessoal' | 'Electricidade & Água' | 'Impostos & Taxas' | 'Outros';
  description: string;
  amountMT: number;
  paymentMethod: 'M-Pesa' | 'e-Mola' | 'Transferência BCI/BIM' | 'Dinheiro' | 'POS Cartão';
  status: 'Pago' | 'Pendente';
  referenceOrderNumber?: string;
  customerName?: string;
  operatorName?: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  vehicleType: 'moto' | 'carro' | 'furgão';
  plateNumber: string;
  residenceZone: string;
  phone: string;
  whatsappLink: string;
  baseRate: string;
  rating: number;
  isAvailable: boolean;
  subscriptionPaid: boolean;
  imageUrl?: string;
  /** Geocoded via Nominatim (OpenStreetMap) from residenceZone, same as Establishment. */
  latitude?: number;
  longitude?: number;
}

export type UserRole = 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'hotel' | 'construcao' | 'pecas_auto' | 'entregador' | 'cliente' | 'admin' | 'turismo' | 'ferragens';

export interface UserProfile {
  id?: string;
  name: string;
  displayName?: string;
  adminName?: string;
  clientOrStoreName?: string;
  serviceName?: string;
  selectedServices?: string[];
  emailOrPhone: string;
  email?: string;
  phone?: string;
  city?: string;
  created_at?: string;
  role: UserRole;
  storeName?: string;
  establishmentName?: string;
  interests?: string[];
  isPremium?: boolean;
  subscriptionPlan?: string;
  /**
   * The specific establishment this account owns/manages (set automatically
   * when a business account is created). This is what grants CRUD access to
   * a store's own profile — NOT the role/category alone. Only the platform
   * admin (role === 'admin') and the establishment's real owner
   * (establishmentId === establishment.id) may edit a given store.
   */
  establishmentId?: string;
  authorizedStores?: string[]; // IDs de estabelecimentos onde este operador foi autorizado
}

/**
 * Checks if the user is an authorized store manager, business owner, store staff, or system admin.
 * Regular browsers/guests and users with 'cliente' or 'entregador' roles are explicitly NOT store staff.
 */
export function isAuthorizedStoreStaffOrAdmin(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'cliente' || user.role === 'entregador') return false;
  if (user.role === 'admin') return true;
  if (Boolean(user.establishmentId)) return true;
  if (Boolean(user.authorizedStores && user.authorizedStores.length > 0)) return true;
  const storeRoles = ['loja', 'supermercado', 'bar', 'hospedagem', 'hotel', 'construcao', 'pecas_auto', 'turismo'];
  return storeRoles.includes(user.role);
}

export interface PromoDeal {
  id: string;
  establishmentId: string;
  title: string;
  subtitle: string;
  category: Category;
  rank: number; // 1 to 10
  color: string;
  imageUrl?: string;
  discount?: string;
  description?: string;
  establishmentName?: string;
  zone?: string;
  promoPriceMT?: number;
  originalPriceMT?: number;
}

export interface PaymentRecord {
  id: string;
  establishmentName: string;
  contactPhone: string;
  amount: string;
  date: string;
  method: 'M-Pesa' | 'e-Mola' | 'Transferência BCI/BIM';
  status: 'Aprovado' | 'Pendente' | 'Isento (15 Dias)';
  referenceNumber?: string;
  proofUrl?: string;
}

export interface AdminSubmission {
  id: string;
  type: 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'entregador' | 'promocao' | 'parceiro';
  name: string;
  contact: string;
  date: string;
  status: 'Aprovado' | 'Pendente' | 'Rejeitado';
  details: string;
  imageUrl?: string;
}

export interface InventoryItem {
  id: string;
  establishmentId: string;
  name: string;
  category: string;
  costPriceMT: number;
  sellingPriceMT: number;
  quantityInStock: number;
  minStockThreshold: number;
  unit: string;
  salesCount: number;
  isTopSeller?: boolean;
  imageUrl?: string;
  barcode?: string;
  sku?: string;
  supplier?: string;
  expiryDate?: string;
  locationRack?: string;
  vatPct?: number; // default 16%
  lastPurchaseDate?: string;
  lastPurchaseCostMT?: number;
}

export interface StockMovementRecord {
  id: string;
  establishmentId: string;
  inventoryItemId: string;
  productName: string;
  type: 'entrada_compra' | 'saida_venda' | 'ajuste_inventario' | 'quebra_avaria' | 'devolucao';
  quantity: number;
  unitCostMT: number;
  unitSellingPriceMT: number;
  totalCostMT: number;
  totalSellingPriceMT: number;
  invoiceOrDocNumber?: string;
  supplierName?: string;
  reasonOrNotes?: string;
  operatorName: string;
  date: string;
  time: string;
  postToFinancialCashier?: boolean;
}

export interface BarTableItem {
  id: string;
  inventoryItemId?: string;
  productName: string;
  unitPriceMT: number;
  quantity: number;
  addedAt: string;
  delivered: boolean;
}

export interface BarTable {
  id: string;
  establishmentId: string;
  tableNumber: string;
  customerName?: string;
  operatorName: string;
  status: 'livre' | 'ocupada' | 'conta_solicitada' | 'fechada';
  openedAt?: string;
  items: BarTableItem[];
  notes?: string;
  location?: string;
  capacity?: number;
  sector?: string;
}

export interface OperatorLoginRecord {
  id: string;
  establishmentId: string;
  operatorName: string;
  loginTime: string;
  date: string;
  role: 'administrador' | 'vendedor';
}

export interface CartItem {
  id: string; // unique item instance id
  productId: string;
  establishmentId: string;
  establishmentName: string;
  productName: string;
  unitPriceMT: number;
  quantity: number;
  imageUrl?: string;
  category?: string;

  // Category-specific booking & scheduling parameters
  bookingDate?: string;
  bookingTime?: string; // Check-in hour e.g. "14:00"
  bookingDurationType?: '1hora' | '2horas' | '3horas' | 'diaria_24h' | 'pernoite' | 'dia_inteiro' | 'semanal';
  bookingDurationLabel?: string; // e.g. "1 Hora", "24 Horas (Diária)", "Pernoite (19h-09h)"
  bookingGuests?: number;
  roomType?: string;
  vehiclePlateOrModel?: string;
  tableNumber?: string;
  constructionDeliveryType?: string;
  customNotes?: string;
}

export interface PaymentOrderRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  targetType: 'plataforma' | 'loja';
  establishmentId?: string;
  establishmentName: string;
  orderItemsSummary: string;
  itemsDetail?: CartItem[];
  subtotalAmountMT: number;
  deliveryFeeMT: number;
  totalAmountMT: number;
  paymentMethod: 'mpesa' | 'emola' | 'transferencia_bancaria';
  referenceNumber: string;
  proofUrl?: string;
  status: 'pendente' | 'confirmado' | 'rejeitado';
  createdAt: string;
  confirmedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  deliveryOption?: 'pickup' | 'estafeta_axofacil' | 'propria_loja';
  deliveryAddress?: string;
}

export interface CommercialInquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  departmentLabel: string;
  title: string;
  details: string;
  status: 'Novo' | 'Em Análise' | 'Respondido' | 'Concluído';
  createdAt: string;
  menuSource?: string;
}

// ==========================================
// TURISMO & VIAGENS — BILHÉTICA AÉREA & AEROPORTOS
// ==========================================

export type AirportRegion = 'nacional' | 'africa_austral' | 'internacional';

export interface Airport {
  code: string; // IATA (e.g. 'MPM', 'BEW', 'APL', 'JNB', 'LAD', 'LIS')
  name: string; // e.g. "Aeroporto Internacional de Maputo (Mavalane)"
  city: string; // e.g. "Maputo"
  country: string; // e.g. "Moçambique"
  region: AirportRegion;
  terminals?: string[];
  isMainHub?: boolean;
}

export interface Airline {
  code: string; // IATA (e.g. 'TM', '4Z', 'SA', 'FA', 'TP', 'QR', 'ET', 'KQ', 'DT', 'TK')
  name: string; // e.g. "LAM - Linhas Aéreas de Moçambique"
  shortName: string;
  country: string;
  logoBgColor?: string;
  alliance?: string;
}

export interface FlightSchedule {
  id: string;
  flightNumber: string; // e.g. "TM 132", "4Z 260"
  airline: Airline;
  origin: Airport;
  destination: Airport;
  departureTime: string; // e.g. "07:30"
  arrivalTime: string; // e.g. "08:45"
  durationMinutes: number;
  durationFormatted: string; // e.g. "1h 15m"
  daysOfWeek: number[]; // 1=Seg, 7=Dom
  stops: number; // 0=Direto, 1, 2
  stopCities?: string[];
  aircraft: string; // e.g. "Boeing 737-700", "Embraer E190", "Dash 8-Q400"
  terminal: string; // e.g. "Terminal A - Doméstico"
  gate?: string;
  baggageAllowance: {
    cabinKg: number;
    checkedKg: number;
    checkedBagsCount: number;
  };
  basePriceEconomyMT: number;
  basePriceBusinessMT?: number;
  taxesMT: number;
  availableSeatsEconomy: number;
  availableSeatsBusiness?: number;
  mealIncluded?: string; // "Snack & Bebidas", "Refeição Quente Completa"
  refundable?: boolean;
  changeFeeMT?: number;
}

export type FlightLiveStatus = 
  | 'No Horário' 
  | 'Embarque' 
  | 'Última Chamada' 
  | 'Portão Fechado' 
  | 'Em Voo' 
  | 'Aterrado' 
  | 'Atrasado' 
  | 'Cancelado';

export interface LiveFlightBoardItem {
  id: string;
  flightNumber: string;
  airline: Airline;
  type: 'partida' | 'chegada';
  airportCode: string; // The hub airport being viewed, e.g. 'MPM'
  scheduledTime: string;
  estimatedTime: string;
  otherAirport: Airport; // Origin if arrival, Destination if departure
  status: FlightLiveStatus;
  gate?: string;
  terminal: string;
  checkInCounters?: string;
  baggageCarousel?: string;
  aircraft: string;
  remarks?: string;
  canBookDirectly?: boolean;
  flightScheduleRefId?: string;
}

export interface PassengerDetails {
  id: string;
  type: 'adult' | 'child' | 'infant';
  title: 'Sr.' | 'Sra.' | 'Dr.' | 'Eng.';
  firstName: string;
  lastName: string;
  idType: 'BI' | 'Passaporte' | 'DIRE';
  idNumber: string;
  idExpiryDate?: string;
  nationality: string;
  birthDate: string;
  gender: 'M' | 'F';
  seatSelected?: string;
  frequentFlyerNumber?: string;
  specialAssistance?: boolean;
}

export interface FlightTicketBooking {
  id: string;
  pnr: string; // 6-digit PNR Code e.g. "ACH79X"
  ticketNumber: string; // E-Ticket number e.g. "068-9482710492"
  userId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  tripType: 'one_way' | 'round_trip';
  outboundFlight: FlightSchedule;
  returnFlight?: FlightSchedule;
  outboundDate: string;
  returnDate?: string;
  cabinClass: 'economy' | 'premium_economy' | 'business';
  passengers: PassengerDetails[];
  seatNumbers: string[];
  selectedAddons: {
    extraBaggageCount: number;
    extraBaggageAmountMT: number;
    flamingoLoungeAccess: boolean;
    flamingoLoungeAmountMT: number;
    travelInsurance: boolean;
    travelInsuranceAmountMT: number;
    airportTransferPickup: boolean;
    airportTransferAmountMT: number;
  };
  fareType: 'light' | 'standard' | 'flex';
  subtotalMT: number;
  taxesAmountMT: number;
  addonsAmountMT: number;
  totalAmountMT: number;
  paymentMethod: 'mpesa' | 'emola' | 'conta_movel' | 'cartao_simo' | 'transferencia_bancaria';
  paymentReference: string;
  paymentStatus: 'confirmado' | 'pendente' | 'cancelado';
  bookingStatus: 'aguardando_confirmacao' | 'confirmado' | 'checkin_aberto' | 'checkin_efetuado' | 'voado' | 'cancelado';
  createdAt: string;
  boardingPassGenerated: boolean;
  checkInDone?: boolean;
  qrCodeData?: string;
}

export interface POSSaleItem {
  id: string;
  inventoryItemId?: string;
  sku?: string;
  barcode?: string;
  name: string;
  unit?: string;
  unitPriceMT: number;
  costPriceMT: number;
  quantity: number;
  subtotalMT: number;
  discountMT: number;
  totalMT: number;
  vatPct: number;
  notes?: string;
  category?: string;
  imageUrl?: string;
}

export type POSPaymentMethod = 'Dinheiro' | 'M-Pesa' | 'e-Mola' | 'POS Cartão (TPA)' | 'Transferência BCI/BIM' | 'Pagamento Misto';

export interface POSPaymentSplit {
  method: POSPaymentMethod;
  amountMT: number;
  referenceNumber?: string;
}

export interface POSSale {
  id: string;
  establishmentId: string;
  establishmentName: string;
  invoiceNumber: string; // e.g. "FT-2026-0089"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  timestamp: number;
  operatorId: string;
  operatorName: string;
  operatorRole: 'operador' | 'supervisor' | 'administrador';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerNuit?: string;
  items: POSSaleItem[];
  itemCount: number;
  subtotalMT: number;
  discountMT: number;
  discountPct: number;
  vatMT: number;
  vatRatePct: number; // default 16%
  totalMT: number;
  paymentMethod: POSPaymentMethod;
  splits?: POSPaymentSplit[];
  amountReceivedMT: number;
  changeMT: number; // Troco entregue
  status: 'concluida' | 'cancelada' | 'pendente_sync' | 'sincronizada';
  syncStatus: 'synced' | 'pending_sync' | 'conflict_resolved';
  signatureChecksum: string; // Hash / Checksum for offline data integrity
  offlineCreatedAt: string;
  syncedAt?: string;
  shiftId?: string;
  notes?: string;
  // Manual Mobile Wallet (M-Pesa / e-Mola) Validation Details at the Cashier Counter
  mobilePaymentDetails?: {
    walletType: 'M-Pesa' | 'e-Mola';
    merchantAccount: string;
    customerPhone: string;
    transactionCode: string;
    senderName?: string;
    validationStatus: 'validado_manual' | 'pendente';
    verifiedByOperator: string;
    verifiedAt: string;
  };
  // Contextual store metadata
  tableNumber?: string; // Bares / Restaurantes
  roomNumber?: string; // Hotéis / Hospedagens
  vehiclePlateOrModel?: string; // Peças Auto / Oficinas
  orderType?: 'balcao' | 'mesa' | 'quarto' | 'orcamento' | 'entrega';
}

export interface POSCashShift {
  id: string;
  establishmentId: string;
  operatorId: string;
  operatorName: string;
  openedAt: string; // ISO string
  closedAt?: string; // ISO string
  openingBalanceMT: number; // Fundo de caixa inicial
  closingBalanceExpectedMT?: number;
  closingBalanceCountedMT?: number;
  discrepancyMT?: number; // Quebra / Sobra (+/-)
  totalSalesCashMT: number;
  totalSalesMpesaMT: number;
  totalSalesEmolaMT: number;
  totalSalesCardMT: number;
  totalSalesBankMT: number;
  totalSalesMT: number;
  totalWithdrawalsMT: number; // Sangrias
  totalDepositsMT: number; // Suprimentos
  totalSalesCount: number;
  status: 'aberto' | 'fechado';
  notes?: string;
  syncStatus: 'synced' | 'pending_sync';
}

export interface POSCashMovement {
  id: string;
  shiftId: string;
  establishmentId: string;
  type: 'sangria' | 'suprimento';
  amountMT: number;
  reason: string;
  operatorName: string;
  timestamp: string;
  authorizedBy?: string;
}

export interface POSSyncLog {
  id: string;
  establishmentId: string;
  entityType: 'sale' | 'shift' | 'cash_movement' | 'stock_change' | 'audit_log';
  entityId: string;
  action: 'insert' | 'update' | 'void';
  localTimestamp: string;
  syncedTimestamp?: string;
  status: 'pending' | 'synced' | 'conflict';
  conflictResolutionNote?: string;
  checksum: string;
}

export interface POSAuditAction {
  id: string;
  establishmentId: string;
  shiftId?: string;
  operatorName: string;
  actionType: 'abertura_caixa' | 'fecho_caixa' | 'cancelamento_venda' | 'desconto_aplicado' | 'sangria' | 'suprimento' | 'troca_operador' | 'reimpressao_recibo' | 'ajuste_stock_manual';
  details: string;
  amountMT?: number;
  timestamp: string;
}



