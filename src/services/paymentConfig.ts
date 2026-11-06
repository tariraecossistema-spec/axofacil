import { loadPlatformSettings } from './platformConfig';

export interface PaymentAccountDetails {
  titular: string;
  numeroOuNib: string;
  banco?: string;
  instrucoes: string[];
  isConfigured?: boolean;
}

export interface StorePaymentConfig {
  mpesa: PaymentAccountDetails;
  emola: PaymentAccountDetails;
  banco: PaymentAccountDetails;
}

export function isPaymentAccountValid(numero?: string, titular?: string): boolean {
  const cleanNum = (numero || '').trim();
  const cleanTitular = (titular || '').trim();
  if (!cleanNum || !cleanTitular) return false;
  if (cleanNum === '841234567' || cleanNum === '000000000') return false;
  return cleanNum.length >= 9;
}

export function hasAnyPaymentMethodConfigured(config: StorePaymentConfig): boolean {
  return Boolean(
    isPaymentAccountValid(config.mpesa.numeroOuNib, config.mpesa.titular) ||
    isPaymentAccountValid(config.emola.numeroOuNib, config.emola.titular) ||
    isPaymentAccountValid(config.banco.numeroOuNib, config.banco.titular)
  );
}

// DEFINIR: Os dados reais de pagamento (M-Pesa, e-Mola e Banco) devem ser configurados
// pelo administrador em `platform_settings` na base de dados.
function getLivePlatformPaymentConfig(): StorePaymentConfig {
  const { paymentAccounts } = loadPlatformSettings();

  const mpesaConfigured = isPaymentAccountValid(paymentAccounts.mpesa.numero, paymentAccounts.mpesa.titular);
  const emolaConfigured = isPaymentAccountValid(paymentAccounts.emola.numero, paymentAccounts.emola.titular);
  const bancoConfigured = isPaymentAccountValid(paymentAccounts.banco.numero, paymentAccounts.banco.titular);

  return {
    mpesa: {
      titular: mpesaConfigured ? paymentAccounts.mpesa.titular : '',
      numeroOuNib: mpesaConfigured ? paymentAccounts.mpesa.numero : '',
      isConfigured: mpesaConfigured,
      instrucoes: mpesaConfigured
        ? [
            'Marque *150# no telemóvel',
            'Seleccione "Transferir Dinheiro"',
            `Introduza o número: ${paymentAccounts.mpesa.numero}`,
            'Introduza o valor exacto em Meticais (MT)',
            `Confirme o titular: ${paymentAccounts.mpesa.titular}`,
            'Guarde o código de referência do SMS para confirmar o pedido'
          ]
        : ['Pagamento indisponível']
    },
    emola: {
      titular: emolaConfigured ? paymentAccounts.emola.titular : '',
      numeroOuNib: emolaConfigured ? paymentAccounts.emola.numero : '',
      isConfigured: emolaConfigured,
      instrucoes: emolaConfigured
        ? [
            'Marque *898# no telemóvel',
            'Seleccione "Transferir"',
            `Introduza o número: ${paymentAccounts.emola.numero}`,
            'Introduza o valor exacto em Meticais (MT)',
            `Confirme o titular: ${paymentAccounts.emola.titular}`,
            'Guarde o código de referência do SMS para confirmar o pedido'
          ]
        : ['Pagamento indisponível']
    },
    banco: {
      banco: bancoConfigured ? (paymentAccounts.banco.banco || 'Transferência Bancária') : '',
      titular: bancoConfigured ? paymentAccounts.banco.titular : '',
      numeroOuNib: bancoConfigured ? paymentAccounts.banco.numero : '',
      isConfigured: bancoConfigured,
      instrucoes: bancoConfigured
        ? [
            'Efectue a transferência via Internet Banking, aplicação móvel ou ATM',
            `NIB de destino: ${paymentAccounts.banco.numero}`,
            `Confirme o titular: ${paymentAccounts.banco.titular}`,
            'Guarde o comprovativo da transferência para anexar ao pedido'
          ]
        : ['Pagamento indisponível']
    }
  };
}

export function getPaymentConfigForEstablishment(_estId?: string, _estName?: string): StorePaymentConfig {
  return getLivePlatformPaymentConfig();
}
