import React, { useState } from 'react';
import { UserProfile, Establishment } from "../types/types";

type UserRole = 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'construcao' | 'pecas_auto' | 'turismo' | 'entregador' | 'cliente';
import { 
  Store, 
  Wine, 
  Home as HomeIcon, 
  User, 
  Check, 
  Sparkles, 
  MapPin, 
  Eye, 
  EyeOff, 
  ShoppingBag, 
  Truck, 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  Zap, 
  Lock, 
  X, 
  Hammer, 
  Database, 
  RefreshCw, 
  Compass, 
  Wrench, 
  ShoppingCart,
  Award,
  Users,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Smartphone,
  Building2,
  Copy,
  MessageSquare,
  Info,
  Upload
} from 'lucide-react';
import { 
  supabaseSignUp, 
  supabaseSignIn, 
  supabaseSignInWithGoogle, 
  isSupabaseConfigured, 
  syncUserProfileToSupabase, 
  syncEstablishmentToSupabase,
  handleForgotPassword,
  handleUpdatePassword,
  fetchUserProfileByContactFromSupabase,
  checkIsAdminInSupabase
} from "../services/supabase";
import StoreLocationMap from '../components/shared/StoreLocationMap';
import { notify } from "../services/dialogs";
import { addUserProfile, loadUserProfiles, findUserProfileByContact, saveUserCredential, verifyUserPassword } from "../data/userProfiles";
import { recordAdminAction } from "../services/adminAuditStore";
import SubscriptionPaymentModal from "../components/modals/SubscriptionPaymentModal";
import FileUpload from "../components/shared/FileUpload";
import { createPaymentOrder } from "../services/paymentStore";
import { loadPlatformSettings } from "../services/platformConfig";
import { MOZAMBIQUE_PROVINCES } from "../data/mozambiqueZones";

interface AuthPageProps {
  setActivePage: (page: any) => void;
  setCurrentUser: (user: UserProfile) => void;
  onAddEstablishment: (est: Establishment) => void;
  initialTab?: 'login' | 'criar' | 'admin' | 'forgot' | 'reset-password';
  currentUser?: UserProfile | null;
}

type RoleType = 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'construcao' | 'pecas_auto' | 'turismo' | 'entregador' | 'cliente';

export const PLATFORM_ALL_SERVICES = [
  { id: 'lojas', label: 'Loja de retalho e moda', icon: ShoppingBag, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'supermercados', label: 'Supermercados frescos', icon: ShoppingCart, color: 'text-green-800', bg: 'bg-green-50', border: 'border-green-200' },
  { id: 'bares', label: 'Bar e lounge bar', icon: Wine, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'hospedagens', label: 'Hospedagem e hotéis', icon: HomeIcon, color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'turismo', label: 'Turismo e safaris', icon: Compass, color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  { id: 'construcao', label: 'Material de construção', icon: Hammer, color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'pecas_auto', label: 'Peças', icon: Wrench, color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'entregadores', label: 'Logística, fretes e transporte', icon: Truck, color: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-200' },
];

export default function AuthPage({ setActivePage, setCurrentUser, onAddEstablishment, initialTab = 'login', currentUser }: AuthPageProps) {
  const [step, setStep] = useState<'role' | 'form' | 'payment'>(
    initialTab === 'forgot' || initialTab === 'reset-password' ? 'form' : 'role'
  );
  const [selectedRole, setSelectedRole] = useState<RoleType>('cliente');
  const [tab, setTab] = useState<'login' | 'criar' | 'forgot' | 'reset-password'>(
    initialTab === 'admin' ? 'login' : (initialTab || 'login')
  );

  // Utilizador recém-criado para transição imediata ao fluxo de pagamento
  const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);

  // Estados do fluxo de pagamento in-page
  const [payMethod, setPayMethod] = useState<'emola' | 'mpesa' | 'transferencia_bancaria'>('emola');
  const [payRefInput, setPayRefInput] = useState('');
  const [payProofUrl, setPayProofUrl] = useState('');
  const [payPayerName, setPayPayerName] = useState('');
  const [payPayerPhone, setPayPayerPhone] = useState('');
  const [payCopiedField, setPayCopiedField] = useState<string | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [confirmedPayRecord, setConfirmedPayRecord] = useState<any>(null);

  // Admin Verification Security Modal States
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(initialTab === 'admin');
  const [adminEmailInput, setAdminEmailInput] = useState('diasgermano348@gmail.com');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  // Password Recovery States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Reset Password (Update Password) States
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab === 'admin') {
      setShowAdminAuthModal(true);
    } else if (initialTab === 'forgot' || initialTab === 'reset-password') {
      setStep('form');
      setTab(initialTab);
    } else if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  // Form Fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authSyncMsg, setAuthSyncMsg] = useState<string | null>(null);

  // New Structured User Profile Fields
  const [adminName, setAdminName] = useState('');
  const [clientOrStoreName, setClientOrStoreName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'turismo', 'lojas', 'pecas_auto', 'hospedagens', 'supermercados', 'bares', 'construcao', 'entregadores'
  ]);

  // Client Interests Multi-select
  const ALL_CLIENT_SERVICE_LABELS = [
    'Hospedagem e hotéis',
    'Estaleiros de material de construção',
    'Lojas',
    'Bares',
    'Supermercados',
    'Peças',
    'Turismo e safaris',
    'Logística, fretes e transporte'
  ];

  const [interests, setInterests] = useState<string[]>([
    'Hospedagem e hotéis',
    'Estaleiros de material de construção',
    'Lojas',
    'Bares',
    'Supermercados',
    'Peças',
    'Turismo e safaris',
    'Logística, fretes e transporte',
    'Tudo'
  ]);

  // Subscription Plans Selection
  const [selectedPlanSingular, setSelectedPlanSingular] = useState<'mensal' | 'semestral' | 'anual'>('semestral');
  const [clientAccessScope, setClientAccessScope] = useState<'single_category' | 'all_categories'>('all_categories');
  const [selectedSingleCategory, setSelectedSingleCategory] = useState<string>('Lojas');
  const [selectedPlanBusiness, setSelectedPlanBusiness] = useState<'bronze' | 'prata' | 'ouro'>('ouro');
  const [hasDeliveryAddon, setHasDeliveryAddon] = useState(true);
  const [isSubPaymentModalOpen, setIsSubPaymentModalOpen] = useState(false);

  // Establishment creation step for businesses
  const [bizProvince, setBizProvince] = useState('Cidade de Maputo');
  const [bizZone, setBizZone] = useState('Baixa da Cidade');
  const [bizAddress, setBizAddress] = useState('');
  const [bizLandmarks, setBizLandmarks] = useState('');
  const [bizLat, setBizLat] = useState<number | undefined>(undefined);
  const [bizLng, setBizLng] = useState<number | undefined>(undefined);
  const [bizDesc, setBizDesc] = useState('');
  const [bizSegment, setBizSegment] = useState('Vestuário & Moda');
  const [bizSalesType, setBizSalesType] = useState<'grosso' | 'retalho' | 'ambos'>('ambos');
  const [bizProducts, setBizProducts] = useState('');

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthSyncMsg('A autenticar com a sua Conta Google...');
    try {
      if (isSupabaseConfigured) {
        await supabaseSignInWithGoogle();
      } else {
        const googleEmail = 'utilizador.google@gmail.com';
        const googleName = 'Cliente Google';
        const googleUser: UserProfile = {
          id: `google-${Date.now()}`,
          name: googleName,
          emailOrPhone: googleEmail,
          role: selectedRole === 'cliente' ? 'cliente' : selectedRole,
          subscriptionPlan: 'Gratuito',
          isPremium: true
        };
        localStorage.setItem('axofacil_user', JSON.stringify(googleUser));
        setCurrentUser(googleUser);
        setCreatedUser(googleUser);
        setAuthSyncMsg('Sessão iniciada com sucesso via Conta Google!');
        
        if (tab === 'criar') {
          setStep('payment');
          setIsSubPaymentModalOpen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setTimeout(() => {
            setActivePage('home');
          }, 600);
        }
      }
    } catch (err: any) {
      setAuthSyncMsg(`Erro de autenticação Google: ${err.message || err}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = adminEmailInput.trim().toLowerCase();

    if (!cleanEmail || !adminPasswordInput) {
      setAdminAuthError('Introduza o e-mail e a palavra-passe da sua conta no Supabase.');
      return;
    }

    if (!isSupabaseConfigured) {
      setAdminAuthError('O Supabase Auth não está configurado neste ambiente.');
      return;
    }

    try {
      const sbRes = await supabaseSignIn(cleanEmail, adminPasswordInput);
      if (sbRes.user) {
        const isAdmin = await checkIsAdminInSupabase(sbRes.user.id);
        if (!isAdmin) {
          setAdminAuthError('Esta conta não possui permissões de administrador na tabela admin_users.');
          return;
        }
        const adminUser: UserProfile = {
          id: sbRes.user.id,
          name: sbRes.user.user_metadata?.name || 'Administrador',
          emailOrPhone: cleanEmail,
          email: cleanEmail,
          role: 'admin',
          isPremium: true,
          subscriptionPlan: 'Administrador'
        };
        localStorage.setItem('axofacil_user', JSON.stringify(adminUser));
        recordAdminAction({
          type: 'outro',
          title: 'Sessão de Administrador Iniciada',
          userName: adminUser.name,
          userContact: cleanEmail,
          userEmail: cleanEmail,
          categoryOrSegment: 'Admin',
          details: `Administrador autenticado via Supabase Auth: ${cleanEmail}`,
          status: 'Confirmado'
        });
        setCurrentUser(adminUser);
        setActivePage('admin');
        setShowAdminAuthModal(false);
        setAdminPasswordInput('');
        setAdminAuthError('');
        notify('Sessão de Administrador iniciada.', 'success');
        return;
      }
    } catch (sbErr: any) {
      setAdminAuthError(sbErr?.message || 'Credenciais inválidas.');
    }
  };

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    if (role === 'construcao') {
      setBizSegment('Material de construção');
      setBizProducts('Cimento Limpopo 42.5N, Chapas de Zinco 0.40mm, Varão 12mm, Areia Grossa de Rio, Brita nº 1, Blocos 15cm');
      setBizDesc('Estaleiro e fornecedor oficial de material de construção, cimento, chapas e agregados com entrega em obras.');
    } else if (role === 'supermercado') {
      setBizSegment('Supermercados frescos');
      setBizProducts('Arroz 25kg, Óleo Vegetal 5L, Açúcar, Farinha de Milho, Frescos & Mercearia');
      setBizDesc('Supermercado a grosso e retalho com produtos alimentares e frescos de alta qualidade.');
    } else if (role === 'bar') {
      setBizSegment('Bar e lounge bar');
      setBizProducts('Cervejas 2M geladas, Cocktails, Tábua de Mariscos, Petiscos grelhados, Destilados');
      setBizDesc('Bar e lounge bar com esplanada acolhedora, petiscos e música.');
    } else if (role === 'hospedagem') {
      setBizSegment('Hospedagem e hotéis');
      setBizProducts('Suítes executivas, Quartos duplos com AC, Diárias com pequeno almoço');
      setBizDesc('Hospedagem e hotel confortável com diárias executivas e atendimento de excelência.');
    } else if (role === 'turismo') {
      setBizSegment('Turismo e safaris');
      setBizProducts('Safaris Kruger & Parque de Maputo, Bilhetes Aéreos LAM/TAP, Transfers Aeroporto, Excursões Ponta do Ouro, Aluguer 4x4');
      setBizDesc('Agência oficial de turismo e safaris, viagens, excursões e transfers em Moçambique.');
    } else if (role === 'loja') {
      setBizSegment('Loja de retalho e moda');
      setBizProducts('Vestuário feminino e masculino, Fatos, Capulanas, Calçado e acessórios de moda');
      setBizDesc('Loja de retalho e moda na Baixa e arredores com vestuário e coleções modernas.');
    } else if (role === 'pecas_auto') {
      setBizSegment('Peças');
      setBizProducts('Baterias Willard/Exide, Filtros de Óleo & Ar, Pastilhas de Travão, Amortecedores, Lubrificantes Castrol, Pneus');
      setBizDesc('Loja especializada em peças auto, mecânica, baterias, filtros e acessórios.');
    } else if (role === 'entregador') {
      setBizSegment('Logística, fretes e transporte');
      setBizProducts('Entregas express de moto, Fretes em carrinha, Transporte de mercadorias e cargas');
      setBizDesc('Profissional de logística, fretes e transporte de mercadorias e encomendas.');
    }
    setStep('form');
  };

  const toggleInterest = (interest: string) => {
    if (interest === 'Tudo') {
      if (interests.includes('Tudo')) {
        setInterests([]);
      } else {
        setInterests([...ALL_CLIENT_SERVICE_LABELS, 'Tudo']);
      }
      return;
    }

    if (interests.includes(interest)) {
      const updated = interests.filter(i => i !== interest && i !== 'Tudo');
      setInterests(updated);
    } else {
      const updated = [...interests.filter(i => i !== 'Tudo'), interest];
      if (updated.length === ALL_CLIENT_SERVICE_LABELS.length) {
        updated.push('Tudo');
      }
      setInterests(updated);
    }
  };

  const getRoleTagConfig = (role: RoleType) => {
    switch (role) {
      case 'loja':
        return { label: 'Loja de Retalho e Moda', bg: '#EFF6FF', color: '#0B254B' };
      case 'supermercado':
        return { label: 'Supermercados Frescos', bg: '#F1F5F9', color: '#0B254B' };
      case 'bar':
        return { label: 'Bar e Lounge Bar', bg: '#EFF6FF', color: '#0B254B' };
      case 'hospedagem':
        return { label: 'Hospedagem e Hotéis', bg: '#F1F5F9', color: '#0B254B' };
      case 'construcao':
        return { label: 'Material de Construção', bg: '#F1F5F9', color: '#0B254B' };
      case 'turismo':
        return { label: 'Turismo e Safaris', bg: '#EFF6FF', color: '#0B254B' };
      case 'pecas_auto':
        return { label: 'Peças', bg: '#F1F5F9', color: '#0B254B' };
      case 'entregador':
        return { label: 'Logística, Fretes e Transporte', bg: '#F1F5F9', color: '#0B254B' };
      case 'cliente':
        return { label: 'Cliente (Serviços Rápidos)', bg: '#EFF6FF', color: '#0B254B' };
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);

    if (!forgotEmail.trim()) {
      setForgotError('Por favor introduza o seu e-mail.');
      return;
    }

    setForgotLoading(true);
    try {
      if (isSupabaseConfigured) {
        const msg = await handleForgotPassword(forgotEmail.trim());
        setForgotSuccessMsg(msg);
      } else {
        setForgotSuccessMsg(`Link de recuperação enviado com sucesso para ${forgotEmail.trim()}. Verifique a sua caixa de entrada e a pasta de spam.`);
      }
    } catch (err: any) {
      setForgotError(err.message || 'Erro ao solicitar recuperação de palavra-passe.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccessMsg(null);

    if (resetPassword.length < 6) {
      setResetError('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setResetError('As palavras-passe não coincidem.');
      return;
    }

    setResetLoading(true);
    try {
      if (isSupabaseConfigured) {
        const msg = await handleUpdatePassword(resetPassword, resetConfirmPassword);
        setResetSuccessMsg(msg);
        notify('Palavra-passe atualizada com sucesso!', 'success');
        setTimeout(() => {
          setTab('login');
          setActivePage('dashboard');
        }, 1500);
      } else {
        setResetSuccessMsg('Palavra-passe atualizada com sucesso no modo local!');
        notify('Palavra-passe atualizada com sucesso!', 'success');
        setTimeout(() => {
          setTab('login');
          setActivePage('home');
        }, 1500);
      }
    } catch (err: any) {
      setResetError(err.message || 'Erro ao atualizar a palavra-passe.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSyncMsg(null);

    if (!emailOrPhone.trim() || !password.trim()) {
      notify('Por favor preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const cleanInput = emailOrPhone.trim().toLowerCase();

    if (tab === 'criar' && !name.trim()) {
      notify('Por favor insira um nome.', 'error');
      return;
    }

    if (tab === 'criar' && password.trim().length < 6) {
      notify('A palavra-passe deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    setAuthLoading(true);

    // Attempt Supabase Auth if Supabase keys are configured
    let supabaseAuthOk = false;
    if (isSupabaseConfigured) {
      try {
        if (tab === 'criar') {
          await supabaseSignUp(emailOrPhone, password, {
            name,
            role: selectedRole
          });
          setAuthSyncMsg('Conta sincronizada com sucesso no Supabase!');
          supabaseAuthOk = true;
        } else {
          await supabaseSignIn(emailOrPhone, password);
          setAuthSyncMsg('Autenticado com sucesso no Supabase!');
          supabaseAuthOk = true;
        }
      } catch (sbErr: any) {
        console.warn('Supabase Auth error (falling back to local session):', sbErr);
        setAuthSyncMsg(`Sessão ativa localmente. (Nota Supabase: ${sbErr?.message || 'Em modo offline'})`);
      }
    }

    // Determine user plan text and premium state
    const planLabel = selectedRole === 'cliente'
      ? (selectedPlanSingular === 'mensal' 
          ? (clientAccessScope === 'single_category' ? `Pacote Mensal (${selectedSingleCategory}) · 100 MT/mês` : 'Pacote Mensal Universal · 150 MT/mês') 
          : selectedPlanSingular === 'semestral' 
          ? (clientAccessScope === 'single_category' ? `Pacote Semestral (${selectedSingleCategory}) · 300 MT/6meses` : 'Pacote Semestral Universal · 500 MT/6meses') 
          : (clientAccessScope === 'single_category' ? `Pacote Anual (${selectedSingleCategory}) · 500 MT/ano` : 'Pacote Anual Universal · 1.200 MT/ano'))
      : (selectedPlanBusiness === 'bronze' 
          ? 'Plano Base · 600 MT/mês' 
          : selectedPlanBusiness === 'prata' 
          ? 'Plano Pro Destaque · 1.000 MT/mês' 
          : 'Plano Premium VIP + Entrega · 1.500 MT/mês');

    // Build role-specific display name and store name according to user intent
    let finalStoreName: string | undefined = undefined;
    let finalDisplayName: string;
    let finalPersonName: string;

    const rawInputName = (clientOrStoreName.trim() || name.trim()) || (tab === 'login' ? (emailOrPhone.split('@')[0] || 'Utilizador') : 'Utilizador');
    const rawAdminName = adminName.trim();

    if (selectedRole === 'supermercado') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'bar') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'loja') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'hospedagem') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'turismo') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'construcao') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'pecas_auto') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'entregador') {
      finalDisplayName = rawInputName;
      finalPersonName = rawInputName;
    } else {
      // Cliente singular
      finalDisplayName = rawInputName;
      finalPersonName = rawInputName;
    }

    // Check if user profile was previously registered in the platform database
    let matchedProfile = findUserProfileByContact(emailOrPhone);

    // Se não houver registo local mas o Supabase autenticou com sucesso,
    // este é provavelmente um browser/dispositivo novo — busca o perfil real no Supabase.
    if (!matchedProfile && tab === 'login' && supabaseAuthOk) {
      const remoteProfile = await fetchUserProfileByContactFromSupabase(emailOrPhone);
      if (remoteProfile) {
        matchedProfile = remoteProfile as UserProfile;
        // Guarda localmente para que os próximos logins neste dispositivo sejam instantâneos.
        addUserProfile(matchedProfile);
        saveUserCredential(emailOrPhone, password, matchedProfile.role as string, matchedProfile.id);
      }
    }

    let finalUser: UserProfile;

    if (tab === 'login') {
      if (!matchedProfile) {
        setAuthLoading(false);
        notify('Nenhuma conta encontrada com este e-mail ou telemóvel. Por favor verifique os dados ou crie uma conta nova.', 'error');
        return;
      }

      // Se o Supabase já validou a palavra-passe nesta sessão, não repete a validação local
      // (evita bloquear utilizadores cujo perfil acabou de ser importado do Supabase).
      if (!supabaseAuthOk) {
        const pwCheck = verifyUserPassword(emailOrPhone, password);
        if (!pwCheck.ok) {
          setAuthLoading(false);
          notify('Palavra-passe incorreta. Por favor verifique a palavra-passe ou utilize a recuperação.', 'error');
          return;
        }
      }

      // Restaurar perfil completo existente com respetivo estabelecimento e configurações
      finalUser = {
        ...matchedProfile,
        isPremium: true
      };
      // Atualizar o papel no estado para o papel real do utilizador autenticado
      if (finalUser.role !== 'admin') {
        setSelectedRole(finalUser.role as RoleType);
      }
    } else {
      // Construir novo perfil de utilizador
      finalUser = {
        id: `usr_${Date.now().toString().slice(-6)}`,
        name: finalPersonName,
        displayName: finalDisplayName,
        storeName: finalStoreName,
        clientOrStoreName: rawInputName,
        adminName: rawAdminName || (finalStoreName ? 'Responsável da Conta' : undefined),
        serviceName: serviceName.trim() || (selectedRole !== 'cliente' ? bizSegment : undefined),
        selectedServices: selectedRole === 'cliente' ? undefined : [selectedRole],
        emailOrPhone,
        email: emailOrPhone.includes('@') ? emailOrPhone : undefined,
        phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined,
        role: selectedRole,
        interests: selectedRole === 'cliente' ? interests : undefined,
        isPremium: true, // Utilizador subscrito com acesso ativo
        subscriptionPlan: planLabel,
        created_at: new Date().toISOString()
      };
    }

    // Se criar conta comercial, gerar automaticamente o estabelecimento associado
    if (tab === 'criar' && selectedRole !== 'cliente' && selectedRole !== 'entregador') {
      const newEstId = 'est_' + Date.now();
      const prodsList = bizProducts ? bizProducts.split(',').map(p => p.trim()).filter(Boolean) : [];

      const newEst: Establishment = {
        id: newEstId,
        name: finalStoreName || rawInputName,
        category: selectedRole === 'supermercado' ? 'supermercado' : selectedRole === 'loja' ? 'loja' : selectedRole === 'bar' ? 'bar' : selectedRole === 'hospedagem' ? 'hospedagem' : selectedRole === 'construcao' ? 'construcao' : selectedRole === 'turismo' ? 'turismo' : selectedRole === 'pecas_auto' ? 'pecas_auto' : 'loja',
        zone: bizZone || 'Centro / Sede',
        province: bizProvince || 'Cidade de Maputo',
        address: bizAddress || `${bizZone ? bizZone + ', ' : ''}${bizProvince}, Moçambique`,
        addressText: bizAddress || undefined,
        latitude: bizLat,
        longitude: bizLng,
        locationLandmarks: bizLandmarks || undefined,
        description: bizDesc || (rawAdminName ? `Responsável: ${rawAdminName}. ` : '') + `Ainda sem descrição. Edite o perfil no painel de controlo.`,
        rating: 5.0,
        metaInfo: selectedRole === 'hospedagem' ? 'Diária: Sob Consulta' : selectedRole === 'construcao' ? 'Cotação & Frete de Material' : selectedRole === 'turismo' ? 'Safaris, Viagens & Fretamento' : selectedRole === 'pecas_auto' ? 'Peças & Oficina Multimarca' : 'Aberto agora',
        coverColor: '#0B254B',
        features: selectedRole === 'supermercado' ? ['Supermercados Frescos', serviceName || bizSegment] : selectedRole === 'construcao' ? ['Material de Construção', 'Estaleiro', serviceName || bizSegment] : selectedRole === 'turismo' ? ['Agência de Turismo', 'Safaris', serviceName || bizSegment] : selectedRole === 'pecas_auto' ? ['Peças Automóveis', 'Mecânica & Baterias', serviceName || bizSegment] : [serviceName || bizSegment],
        contactPhone: emailOrPhone,
        segment: selectedRole === 'supermercado' ? 'Supermercados frescos' : selectedRole === 'construcao' ? 'Material de construção' : selectedRole === 'turismo' ? 'Turismo e safaris' : selectedRole === 'pecas_auto' ? 'Peças' : (serviceName || bizSegment),
        salesType: bizSalesType,
        productsList: prodsList,
        isActive: true, // Ativado no registo
        hasIntegratedDelivery: hasDeliveryAddon,
        subscriptionPlanType: selectedPlanBusiness === 'ouro' ? 'premium_delivery' : selectedPlanBusiness === 'prata' ? 'pro' : 'basico',
        offersLogistics: selectedRole === 'turismo',
        visits: 10,
        searches: 2,
        salesOrReservations: 0
      };
      onAddEstablishment(newEst);
      syncEstablishmentToSupabase(newEst).catch(console.warn);
      // Vincular este perfil à loja recém-criada
      finalUser.establishmentId = newEstId;
    }

    // Persistir o perfil no repositório local e guardar credenciais seguras para logins futuros
    if (tab === 'criar') {
      addUserProfile(finalUser);
      saveUserCredential(emailOrPhone, password, selectedRole, finalUser.id);
    }

    // Sincronizar com Supabase se configurado
    syncUserProfileToSupabase(finalUser).catch(console.warn);

    // Registar ação na auditoria administrativa
    if (tab === 'criar') {
      recordAdminAction({
        type: selectedRole === 'cliente' ? 'registo_conta' : 'registo_loja',
        title: `Novo Registo (${selectedRole.toUpperCase()}): ${finalUser.storeName || finalUser.name}`,
        userName: finalUser.name,
        userContact: emailOrPhone,
        userEmail: emailOrPhone.includes('@') ? emailOrPhone : undefined,
        categoryOrSegment: selectedRole,
        details: `Registo de perfil via formulário · Tipo: ${selectedRole.toUpperCase()} · Nome: ${finalUser.name} ${finalUser.storeName ? '· Loja: ' + finalUser.storeName : ''} · Contacto: ${emailOrPhone} · Plano: ${finalUser.subscriptionPlan}`,
        metadata: {
          userId: finalUser.id,
          establishmentId: finalUser.establishmentId,
          role: selectedRole,
          plan: finalUser.subscriptionPlan
        }
      });
    }

    // Gravar sessão de utilizador ativa
    localStorage.setItem('axofacil_user', JSON.stringify(finalUser));
    setCurrentUser(finalUser);
    setCreatedUser(finalUser);
    setPayPayerName(finalUser.displayName || finalUser.name || finalUser.storeName || '');
    setPayPayerPhone(finalUser.emailOrPhone || '');
    setAuthLoading(false);

    const userRole = finalUser.role;

    if (tab === 'criar') {
      if (userRole === 'supermercado') {
        notify(`Perfil de supermercado "${finalStoreName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      } else if (userRole === 'bar') {
        notify(`Perfil de bar "${finalStoreName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      } else if (userRole === 'cliente') {
        notify(`Perfil de cliente "${finalDisplayName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      } else if (userRole === 'entregador') {
        notify(`Perfil de estafeta "${finalDisplayName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      } else {
        notify(`Perfil de ${userRole} "${finalDisplayName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      }

      // Conforme requisito do utilizador: transição imediata para o fluxo de pagamento com o pop-up de 15 dias grátis
      setStep('payment');
      setIsSubPaymentModalOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      notify(`Sessão iniciada com sucesso! Bem-vindo de volta, ${finalUser.displayName || finalUser.name}.`, 'success');
      
      // Redirecionamento de login
      if (userRole === 'admin') {
        setActivePage('admin');
      } else if (userRole === 'cliente') {
        setActivePage('segmentos');
      } else {
        setActivePage('dashboard');
      }
    }
  };

  // Garante que o perfil (e estabelecimento comercial, se aplicável) está criado e gravado
  // mesmo quando o utilizador avança directamente para a Fase 03 ou activa os 15 dias grátis
  const ensureRegisteredAccount = (): UserProfile => {
    const existing = createdUser || currentUser;
    if (existing) {
      const updatedExisting: UserProfile = {
        ...existing,
        isPremium: true
      };
      localStorage.setItem('axofacil_user', JSON.stringify(updatedExisting));
      setCurrentUser(updatedExisting);
      setCreatedUser(updatedExisting);
      return updatedExisting;
    }

    const planLabel = selectedRole === 'cliente'
      ? (selectedPlanSingular === 'mensal'
          ? (clientAccessScope === 'single_category' ? `Pacote Mensal (${selectedSingleCategory}) · 100 MT/mês` : 'Pacote Mensal Universal · 150 MT/mês')
          : selectedPlanSingular === 'semestral'
          ? (clientAccessScope === 'single_category' ? `Pacote Semestral (${selectedSingleCategory}) · 300 MT/6meses` : 'Pacote Semestral Universal · 500 MT/6meses')
          : (clientAccessScope === 'single_category' ? `Pacote Anual (${selectedSingleCategory}) · 500 MT/ano` : 'Pacote Anual Universal · 1.200 MT/ano'))
      : (selectedPlanBusiness === 'bronze'
          ? 'Plano Base · 600 MT/mês'
          : selectedPlanBusiness === 'prata'
          ? 'Plano Pro Destaque · 1.000 MT/mês'
          : 'Plano Premium VIP + Entrega · 1.500 MT/mês');

    const roleDefaultTitle = getRoleTagConfig(selectedRole).label;
    const rawInputName =
      clientOrStoreName.trim() ||
      name.trim() ||
      payPayerName.trim() ||
      (emailOrPhone.trim() ? emailOrPhone.trim().split('@')[0] : '') ||
      (selectedRole === 'cliente' ? 'Cliente Axofácil' : `${roleDefaultTitle} Maputo`);
    const rawAdminName = adminName.trim() || rawInputName;
    const contactVal = emailOrPhone.trim() || payPayerPhone.trim() || '+258 84 000 0000';

    const isStoreRole = selectedRole !== 'cliente' && selectedRole !== 'entregador';
    const finalStoreName = isStoreRole ? rawInputName : undefined;
    const finalDisplayName = rawInputName;
    const finalPersonName = isStoreRole ? rawAdminName : rawInputName;

    const newUser: UserProfile = {
      id: `usr_${Date.now().toString().slice(-6)}`,
      name: finalPersonName,
      displayName: finalDisplayName,
      storeName: finalStoreName,
      clientOrStoreName: rawInputName,
      adminName: isStoreRole ? rawAdminName : undefined,
      serviceName: serviceName.trim() || (selectedRole !== 'cliente' ? bizSegment : undefined),
      selectedServices: selectedRole === 'cliente' ? undefined : [selectedRole],
      emailOrPhone: contactVal,
      email: contactVal.includes('@') ? contactVal : undefined,
      phone: !contactVal.includes('@') ? contactVal : undefined,
      role: selectedRole,
      interests: selectedRole === 'cliente' ? interests : undefined,
      isPremium: true,
      subscriptionPlan: `${planLabel} (15 Dias Grátis)`,
      created_at: new Date().toISOString()
    };

    if (isStoreRole) {
      const newEstId = 'est_' + Date.now();
      const prodsList = bizProducts ? bizProducts.split(',').map(p => p.trim()).filter(Boolean) : [];
      const newEst: Establishment = {
        id: newEstId,
        name: finalStoreName || rawInputName,
        category:
          selectedRole === 'supermercado'
            ? 'supermercado'
            : selectedRole === 'bar'
            ? 'bar'
            : selectedRole === 'hospedagem'
            ? 'hospedagem'
            : selectedRole === 'construcao'
            ? 'construcao'
            : selectedRole === 'turismo'
            ? 'turismo'
            : selectedRole === 'pecas_auto'
            ? 'pecas_auto'
            : 'loja',
        zone: bizZone || 'Baixa da Cidade',
        province:
          bizZone.includes('Matola') || bizZone.includes('Zimpeto') || bizZone.includes('Boane')
            ? 'Província de Maputo (Matola/Zimpeto/Boane)'
            : 'Cidade de Maputo',
        address: bizAddress || 'Maputo, Moçambique',
        addressText: bizAddress || undefined,
        latitude: bizLat,
        longitude: bizLng,
        locationLandmarks: bizLandmarks || undefined,
        description:
          bizDesc ||
          `Responsável: ${rawAdminName}. Conta registada com período experimental de 15 dias activo.`,
        rating: 5.0,
        metaInfo:
          selectedRole === 'hospedagem'
            ? 'Diária: Sob Consulta'
            : selectedRole === 'construcao'
            ? 'Cotação & Frete de Material'
            : selectedRole === 'turismo'
            ? 'Safaris, Viagens & Fretamento'
            : selectedRole === 'pecas_auto'
            ? 'Peças & Oficina Multimarca'
            : 'Aberto agora',
        coverColor: '#0B254B',
        features: [serviceName || bizSegment || roleDefaultTitle],
        contactPhone: contactVal,
        segment: serviceName || bizSegment || roleDefaultTitle,
        salesType: bizSalesType,
        productsList: prodsList,
        isActive: true,
        hasIntegratedDelivery: hasDeliveryAddon,
        subscriptionPlanType:
          selectedPlanBusiness === 'ouro'
            ? 'premium_delivery'
            : selectedPlanBusiness === 'prata'
            ? 'pro'
            : 'basico',
        offersLogistics: selectedRole === 'turismo',
        visits: 1,
        searches: 1,
        salesOrReservations: 0
      };
      onAddEstablishment(newEst);
      syncEstablishmentToSupabase(newEst).catch(console.warn);
      newUser.establishmentId = newEstId;
    }

    addUserProfile(newUser);
    if (password.trim()) {
      saveUserCredential(contactVal, password, selectedRole, newUser.id);
    }
    syncUserProfileToSupabase(newUser).catch(console.warn);
    localStorage.setItem('axofacil_user', JSON.stringify(newUser));
    setCurrentUser(newUser);
    setCreatedUser(newUser);
    setPayPayerName(newUser.displayName || newUser.name || newUser.storeName || '');
    setPayPayerPhone(newUser.emailOrPhone || '');
    return newUser;
  };

  const handleActivateTrialAndComplete = (customNotice?: string) => {
    setIsSubPaymentModalOpen(false);
    const activeAccount = ensureRegisteredAccount();
    setPaymentDone(true);
    notify(
      customNotice ||
        `Período experimental de 15 dias activado com sucesso! Bem-vindo, ${
          activeAccount.displayName || activeAccount.name
        }.`,
      'success'
    );
    if (activeAccount.role === 'admin') {
      setActivePage('admin');
    } else {
      setActivePage('dashboard');
    }
  };

  const config = getRoleTagConfig(selectedRole);

  const currentPhaseIndex =
    step === 'role'
      ? 1
      : step === 'form'
      ? 2
      : paymentDone
      ? 4
      : 3;

  const activePlanSummaryLabel =
    selectedRole === 'cliente'
      ? `${clientAccessScope === 'single_category' ? '1 Categoria' : 'Acesso Total'} · ${
          selectedPlanSingular === 'mensal'
            ? clientAccessScope === 'single_category'
              ? '100 MT/mês'
              : '150 MT/mês'
            : selectedPlanSingular === 'semestral'
            ? clientAccessScope === 'single_category'
              ? '300 MT/6m'
              : '500 MT/6m'
            : clientAccessScope === 'single_category'
            ? '500 MT/ano'
            : '2.000 MT/ano'
        }`
      : `${
          selectedPlanBusiness === 'bronze'
            ? 'Plano Base · 600 MT/mês'
            : selectedPlanBusiness === 'prata'
            ? 'Plano Pro · 1.000 MT/mês'
            : 'Plano VIP + Entrega · 1.500 MT/mês'
        }`;

  return (
    <div className="min-h-[85vh] flex flex-col justify-start items-center py-4 px-3 sm:px-6 bg-[#F8F6F1]">
      
      {/* 1. Barra Superior Unificada (Marca + Alternador Entrar/Criar + Voltar) */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 py-2.5 px-3.5 mb-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
        <div 
          onClick={() => setActivePage('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-7 h-7 flex items-center justify-center bg-[#0B254B] text-white font-serif font-bold text-xs rounded-md">
            AX
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-base text-[#0B254B] leading-none tracking-tight">
              Axofácil!
            </span>
            <span className="hidden md:inline text-[11px] text-slate-400">
              · Maputo & Matola
            </span>
          </div>
        </div>

        {/* Selector Compacto Integrado: Entrar vs Criar Nova Conta */}
        {(tab === 'login' || tab === 'criar') && (
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200/90 rounded-lg gap-0.5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setStep('form');
              }}
              className={`py-1.5 px-3 rounded-md font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                tab === 'login'
                  ? 'bg-[#0B254B] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('criar');
                setStep('role');
              }}
              className={`py-1.5 px-3 rounded-md font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                tab === 'criar'
                  ? 'bg-[#0B254B] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
              <span className={`font-mono text-[10px] ${tab === 'criar' ? 'text-amber-300' : 'text-slate-400'}`}>
                4 Fases
              </span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setActivePage('home')}
          className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Início</span>
        </button>
      </div>

      <div className="w-full max-w-4xl">

        {/* =================================================================================== */}
        {/* BARRA COMPACTA COM GRÁFICO DE LINHA DAS 4 FASES (COM PAGAMENTO DO PLANO INCLUSO)    */}
        {/* =================================================================================== */}
        {(tab === 'criar' || step === 'payment') && (
          <div className="mb-3 bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-[#0B254B]">
                  Fase {currentPhaseIndex}/4 ({currentPhaseIndex * 25}%)
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-serif font-bold text-slate-900 text-xs sm:text-sm">
                   Progresso de Criação de Conta
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-mono tabular-nums">
                <CreditCard className="w-3 h-3 text-[#0B254B] shrink-0" />
                <span>Plano: <strong className="text-slate-900">{activePlanSummaryLabel}</strong></span>
              </div>
            </div>

            {/* Gráfico de Linha SVG Compacto */}
            <div className="pt-2">
              <div className="relative h-10 w-full">
                <svg
                  viewBox="0 0 800 54"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="axoLineArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0B254B" stopOpacity="0.14" />
                      <stop offset="100%" stopColor="#0B254B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="40" y1="44" x2="760" y2="44" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="40" y1="26" x2="760" y2="26" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

                  <polyline
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    points="80,40 290,30 510,20 720,10"
                  />

                  <polygon
                    fill="url(#axoLineArea)"
                    points={
                      currentPhaseIndex === 1
                        ? '80,44 80,40 80,44'
                        : currentPhaseIndex === 2
                        ? '80,44 80,40 290,30 290,44'
                        : currentPhaseIndex === 3
                        ? '80,44 80,40 290,30 510,20 510,44'
                        : '80,44 80,40 290,30 510,20 720,10 720,44'
                    }
                  />

                  <polyline
                    fill="none"
                    stroke="#0B254B"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={
                      currentPhaseIndex === 1
                        ? '80,40 130,37'
                        : currentPhaseIndex === 2
                        ? '80,40 290,30'
                        : currentPhaseIndex === 3
                        ? '80,40 290,30 510,20'
                        : '80,40 290,30 510,20 720,10'
                    }
                  />

                  {[
                    { cx: 80, cy: 40, idx: 1, pct: '25%' },
                    { cx: 290, cy: 30, idx: 2, pct: '50%' },
                    { cx: 510, cy: 20, idx: 3, pct: '75%' },
                    { cx: 720, cy: 10, idx: 4, pct: '100%' },
                  ].map((pt) => {
                    const isDone = currentPhaseIndex > pt.idx;
                    const isCurrent = currentPhaseIndex === pt.idx;
                    return (
                      <g key={pt.idx}>
                        {isCurrent && (
                          <circle cx={pt.cx} cy={pt.cy} r="8" fill="#0B254B" fillOpacity="0.14" />
                        )}
                        <circle
                          cx={pt.cx}
                          cy={pt.cy}
                          r="4.5"
                          fill={isDone || isCurrent ? '#0B254B' : '#FFFFFF'}
                          stroke={isDone || isCurrent ? '#0B254B' : '#94A3B8'}
                          strokeWidth="2"
                        />
                        <text
                          x={pt.cx}
                          y={pt.cy - 8}
                          textAnchor="middle"
                          className="text-[9px] font-mono font-bold fill-slate-600"
                        >
                          {pt.pct}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* 4 Etapas Horizontais Ultra-Compactas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTab('criar');
                    setStep('role');
                  }}
                  className={`text-left px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-1 ${
                    currentPhaseIndex === 1
                      ? 'border-[#0B254B] bg-slate-900/[0.04]'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[11px] text-slate-900 truncate">1. Perfil & Sector</div>
                    <div className="text-[10px] text-slate-500 truncate">{config.label}</div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 shrink-0">01</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab('criar');
                    setStep('form');
                  }}
                  className={`text-left px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-1 ${
                    currentPhaseIndex === 2
                      ? 'border-[#0B254B] bg-slate-900/[0.04]'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[11px] text-slate-900 truncate">2. Dados da Conta</div>
                    <div className="text-[10px] text-slate-500 truncate">Identificação & Mapa</div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 shrink-0">02</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!createdUser && (clientOrStoreName.trim() || name.trim() || emailOrPhone.trim())) {
                      ensureRegisteredAccount();
                    }
                    setStep('payment');
                  }}
                  className={`text-left px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-1 ${
                    currentPhaseIndex === 3
                      ? 'border-[#0B254B] bg-slate-900/[0.04]'
                      : 'border-slate-300 bg-slate-50/70 hover:border-[#0B254B]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[11px] text-[#0B254B] truncate">3. Pagamento Plano</div>
                    <div className="text-[10px] text-slate-500 truncate">Sempre incluso · 15d</div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-[#0B254B] shrink-0">03</span>
                </button>

                <div
                  className={`text-left px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-1 ${
                    currentPhaseIndex === 4
                      ? 'border-emerald-700 bg-emerald-50/40'
                      : 'border-slate-200/70 bg-slate-50/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[11px] text-slate-900 truncate">4. Conclusão</div>
                    <div className="text-[10px] text-slate-500 truncate">Acesso ao Painel</div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 shrink-0">04</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: LISTA COMPACTA DE PERFIS E LOJAS (MODELO DE ALTA DENSIDADE) */}
        {step === 'role' && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3 animate-fadeIn">
            {/* Cabeçalho em Linha Única */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div>
                <h1 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-tight">
                  Escolha o perfil da sua conta
                </h1>
                <p className="text-xs text-slate-500">
                  Seleccione conta de cliente ou a categoria do seu estabelecimento para avançar para a Fase 02.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={authLoading}
                className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Registo rápido Google</span>
              </button>
            </div>

            {/* 01. Linha Compacta de Cliente Particular */}
            <button
              type="button"
              onClick={() => handleRoleSelect('cliente')}
              className="w-full group bg-[#0B254B] hover:bg-[#0f2f5f] text-white rounded-lg px-3.5 py-2.5 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-amber-300 font-bold">01</span>
                    <span className="font-serif font-bold text-sm text-white truncate">
                      Cliente & Comprador Particular
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">
                    Compras, cotações de materiais, contactos directos de WhatsApp e reservas
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 border-t sm:border-t-0 border-white/10 pt-1.5 sm:pt-0">
                <span className="text-[11px] font-mono text-amber-300">Desde 100 MT/mês · 15d grátis</span>
                <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded bg-white text-[#0B254B] font-bold text-xs">
                  <span>Seleccionar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>

            {/* 02 a 09. Grelha Compacta de Linhas Horizontais para Lojas e Serviços */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                <span className="font-mono uppercase tracking-wider font-semibold text-slate-600">
                  02–09 · Lojas, Empresas e Transporte
                </span>
                <span className="font-mono tabular-nums text-[10px]">
                  Planos: 600 · 1.000 · 1.500 MT/mês
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                {[
                  {
                    index: '02',
                    role: 'loja' as UserRole,
                    title: 'Loja & Boutique',
                    meta: 'Moda · Calçado · Electrónica',
                    icon: Store,
                  },
                  {
                    index: '03',
                    role: 'supermercado' as UserRole,
                    title: 'Supermercado',
                    meta: 'Alimentos · Grosso & Retalho',
                    icon: ShoppingBag,
                  },
                  {
                    index: '04',
                    role: 'bar' as UserRole,
                    title: 'Bar & Restaurante',
                    meta: 'Restauração · Menu · Mesas',
                    icon: Wine,
                  },
                  {
                    index: '05',
                    role: 'hospedagem' as UserRole,
                    title: 'Hotel, Lodge & Pensão',
                    meta: 'Diárias · Quartos · Check-in',
                    icon: HomeIcon,
                  },
                  {
                    index: '06',
                    role: 'turismo' as UserRole,
                    title: 'Agência de Turismo',
                    meta: 'Pacotes · Safaris · Bilhetes',
                    icon: Compass,
                  },
                  {
                    index: '07',
                    role: 'construcao' as UserRole,
                    title: 'Estaleiro & Ferragem',
                    meta: 'Cimento · Ferro · Blocos',
                    icon: Hammer,
                  },
                  {
                    index: '08',
                    role: 'pecas_auto' as UserRole,
                    title: 'Peças Auto & Oficina',
                    meta: 'Baterias · Travões · Filtros',
                    icon: Wrench,
                  },
                  {
                    index: '09',
                    role: 'entregador' as UserRole,
                    title: 'Estafeta & Frete',
                    meta: 'Moto · Carrinha · Camião',
                    icon: Truck,
                  },
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleSelect(item.role)}
                      className="bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200/90 hover:border-[#0B254B]/40 rounded-lg px-3 py-2 text-left flex items-center justify-between gap-2 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-white border border-slate-200/80 flex items-center justify-center shrink-0 group-hover:border-[#0B254B]/30">
                          <IconComponent className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#0B254B] transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 tabular-nums">{item.index}</span>
                            <h4 className="font-serif font-bold text-xs text-slate-900 group-hover:text-[#0B254B] truncate">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">
                            {item.meta}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B254B] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rodapé Compacto */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Inclui Fase 3 de Pagamento do Plano ou 15 dias experimentais.</span>
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.role === 'admin') {
                    setActivePage('admin');
                  } else {
                    setShowAdminAuthModal(true);
                    setAdminPasswordInput('');
                    setAdminAuthError('');
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-slate-900 underline cursor-pointer"
              >
                Administração
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOGIN / CREATE ACCOUNT FORM (MODELO COMPACTO) */}
        {step === 'form' && (
          <div className="animate-fadeIn space-y-3">
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs">
              
              {/* Cabeçalho Compacto do Formulário + Botão Google + Selector de Perfil */}
              <div className="pb-3 mb-3.5 border-b border-slate-100 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <span>{tab === 'criar' ? `Fase 02 de 04 · ${config.label}` : `Acesso Directo · ${config.label}`}</span>
                      {tab === 'criar' && (
                        <>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => setStep('role')}
                            className="text-[#0B254B] font-semibold hover:underline cursor-pointer normal-case tracking-normal"
                          >
                            ← Alterar perfil
                          </button>
                        </>
                      )}
                    </div>
                    <h2 className="font-serif font-bold text-base sm:text-lg text-slate-900">
                      {tab === 'criar' ? 'Preencha os dados da conta e plano' : 'Iniciar sessão na sua conta'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={authLoading}
                    className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shrink-0"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{tab === 'criar' ? 'Registar com Google' : 'Entrar com Google'}</span>
                  </button>
                </div>

                {/* Barra Segmentada de Seleção de Papel/Perfil no Ecrã de Login */}
                {tab === 'login' && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 border border-slate-200/80 rounded-lg">
                      {[
                        { code: '01', role: 'cliente' as UserRole, title: 'Cliente', sub: 'Compras & Reservas' },
                        { code: '02', role: 'loja' as UserRole, title: 'Loja / Empresa', sub: 'Stock & Vendas' },
                        { code: '03', role: 'entregador' as UserRole, title: 'Estafeta', sub: 'Fretes & Entregas' },
                      ].map((entry) => {
                        const isSelected = selectedRole === entry.role;
                        return (
                          <button
                            key={entry.role}
                            type="button"
                            onClick={() => setSelectedRole(entry.role)}
                            className={`py-1.5 px-2.5 rounded-md text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                              isSelected ? 'bg-[#0B254B] text-white shadow-2xs' : 'hover:bg-white/70 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-xs truncate">{entry.title}</div>
                              <div className={`text-[10px] truncate hidden sm:block ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                {entry.sub}
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono shrink-0 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                              {entry.code}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* FORGOT PASSWORD FORM */}
              {tab === 'forgot' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center sm:text-left mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                      <Key className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-xl text-indigo-deep">Recuperar Palavra-passe</h3>
                    <p className="text-xs text-ink/65 mt-1 leading-relaxed">
                      Introduza o e-mail associado à sua conta. Enviaremos um link seguro para redefinir a sua palavra-passe.
                    </p>
                  </div>

                  {forgotSuccessMsg ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Link Enviado com Sucesso!</span>
                      </div>
                      <p className="text-[11.5px] text-emerald-900/90 leading-relaxed">
                        {forgotSuccessMsg}
                      </p>
                      <p className="text-[11px] text-emerald-800/80 italic pt-1 border-t border-emerald-200">
                        💡 Dica: Verifique também a sua pasta de Spam ou Lixo Eletrónico.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setForgotSuccessMsg(null);
                        }}
                        className="w-full mt-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                      >
                        Voltar ao Início de Sessão
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1.5">O seu endereço de E-mail *</label>
                        <input
                          type="email"
                          placeholder="exemplo@dominio.co.mz"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          autoFocus
                          autoComplete="email"
                          className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                        />
                      </div>

                      {forgotError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fadeIn">
                          <span>⚠️</span>
                          <span>{forgotError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full py-3.5 bg-indigo-deep hover:bg-indigo-brand disabled:opacity-60 text-paper font-semibold rounded-xl text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {forgotLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                            <span>A enviar link de recuperação...</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 text-amber-300" />
                            <span>Enviar Link de Recuperação</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setForgotError(null);
                        }}
                        className="w-full py-2 text-center text-xs font-semibold text-ink/60 hover:text-indigo-deep transition-colors cursor-pointer"
                      >
                        ← Voltar ao Início de Sessão
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* RESET PASSWORD FORM */}
              {tab === 'reset-password' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center sm:text-left mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-3">
                      <Lock className="w-5 h-5 text-indigo-700" />
                    </div>
                    <h3 className="font-serif font-bold text-xl text-indigo-deep">Definir Nova Palavra-passe</h3>
                    <p className="text-xs text-ink/65 mt-1 leading-relaxed">
                      Introduza a sua nova palavra-passe segura para a sua conta Axofácil!.
                    </p>
                  </div>

                  {resetSuccessMsg ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Palavra-passe Redefinida com Sucesso!</span>
                      </div>
                      <p className="text-[11.5px] text-emerald-900/90 leading-relaxed">
                        {resetSuccessMsg}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setActivePage('dashboard');
                        }}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                      >
                        Continuar para o Painel
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1.5">Nova Palavra-passe (mínimo 6 caracteres) *</label>
                        <div className="relative">
                          <input
                            type={showResetPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full p-3 pr-10 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetPassword(!showResetPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 cursor-pointer"
                          >
                            {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1.5">Confirmar Nova Palavra-passe *</label>
                        <div className="relative">
                          <input
                            type={showResetConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full p-3 pr-10 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 cursor-pointer"
                          >
                            {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {resetError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fadeIn">
                          <span>⚠️</span>
                          <span>{resetError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full py-3.5 bg-indigo-deep hover:bg-indigo-brand disabled:opacity-60 text-paper font-semibold rounded-xl text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {resetLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                            <span>A gravar nova palavra-passe...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-amber-300" />
                            <span>Gravar Nova Palavra-passe</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setResetError(null);
                        }}
                        className="w-full py-2 text-center text-xs font-semibold text-ink/60 hover:text-indigo-deep transition-colors cursor-pointer"
                      >
                        ← Voltar ao Início de Sessão
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Login/Signup actual form container */}
              {(tab === 'login' || tab === 'criar') && (
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {tab === 'criar' && (
                  <div className="space-y-2.5">
                    
                    {/* A. CAMPOS COMPACTOS PARA CLIENTE (2 COLUNAS) */}
                    {selectedRole === 'cliente' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-ink/80 mb-1">
                            Nome Completo *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Fátima Chissano"
                            value={clientOrStoreName || name}
                            onChange={(e) => {
                              setClientOrStoreName(e.target.value);
                              setName(e.target.value);
                              setAdminName(e.target.value);
                            }}
                            required
                            autoComplete="name"
                            className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-ink/80 mb-1">
                            Cidade e Bairro *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Maputo (Polana, Baixa) ou Matola"
                            value={bizAddress}
                            onChange={(e) => setBizAddress(e.target.value)}
                            required
                            className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-ink/80 mb-1">
                            Principais Interesses de Compras & Serviços *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Lojas, Supermercados, Material de Construção, Hospedagem, Peças Auto"
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            required
                            className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* B. CAMPOS COMPACTOS PARA ENTREGADOR / ESTAFETA (2 COLUNAS) */}
                    {selectedRole === 'entregador' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-ink/80 mb-1">
                            Nome do Condutor / Estafeta *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Inácio Silva Macamo"
                            value={clientOrStoreName || name}
                            onChange={(e) => {
                              setClientOrStoreName(e.target.value);
                              setName(e.target.value);
                              setAdminName(e.target.value);
                            }}
                            required
                            autoComplete="name"
                            className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-ink/80 mb-1">
                            Tipo de Veículo *
                          </label>
                          <select
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            required
                            className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          >
                            <option value="">Selecione o transporte...</option>
                            <option value="Motociclo / Moto-estafeta">Motociclo / Moto-estafeta</option>
                            <option value="Carrinha Ligeira / Pick-up">Carrinha Ligeira / Pick-up</option>
                            <option value="Furgão Fechado / Caminhão">Furgão Fechado / Camião de Frete</option>
                            <option value="Carro Ligeiro / Táxi">Carro Ligeiro / Táxi</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-ink/80 mb-1">
                            Zonas de Cobertura para Entregas *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Maputo Cidade, Matola, Zimpeto, Costa do Sol, Machava"
                            value={bizAddress}
                            onChange={(e) => setBizAddress(e.target.value)}
                            required
                            className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* C. CAMPOS COMPACTOS PARA ESTABELECIMENTOS COMERCIAIS (2 COLUNAS) */}
                    {selectedRole !== 'cliente' && selectedRole !== 'entregador' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-ink/75 mb-1">
                            {selectedRole === 'supermercado' && 'Nome do Supermercado *'}
                            {selectedRole === 'bar' && 'Nome do Bar / Restaurante *'}
                            {selectedRole === 'loja' && 'Nome da Loja / Boutique *'}
                            {selectedRole === 'hospedagem' && 'Nome do Hotel / Hospedagem *'}
                            {selectedRole === 'turismo' && 'Nome da Agência de Turismo *'}
                            {selectedRole === 'construcao' && 'Nome do Estaleiro / Ferragem *'}
                            {selectedRole === 'pecas_auto' && 'Nome da Loja de Peças / Oficina *'}
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Comercial Baixa Maputo"
                            value={clientOrStoreName || name}
                            onChange={(e) => {
                              setClientOrStoreName(e.target.value);
                              setName(e.target.value);
                            }}
                            required
                            autoComplete="name"
                            className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-ink/75 mb-1">
                            Responsável / Gerente da Conta *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Carlos Sitoe (Gerente)"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            required
                            className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-ink/75 mb-1">
                            Ramo de Actividade / Especialidade Principal *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Vestuário, Alimentos, Material de Construção, Peças Auto, Alojamento"
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            required
                            className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* E-mail/Telemóvel e Palavra-passe em 2 Colunas Compactas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">E-mail ou Telemóvel *</label>
                    <input 
                      type="text" 
                      placeholder="ex: +258 84 000 0000 ou email@dominio.co.mz"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      required
                      autoComplete={tab === 'criar' ? 'email' : 'username'}
                      className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-ink/70">Palavra-passe *</label>
                      {tab === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTab('forgot');
                            setForgotEmail(emailOrPhone.includes('@') ? emailOrPhone : '');
                            setForgotSuccessMsg(null);
                            setForgotError(null);
                          }}
                          className="text-[10.5px] font-semibold text-indigo-brand hover:underline cursor-pointer"
                        >
                          Esqueceu a senha?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={tab === 'criar' ? 6 : undefined}
                        autoComplete={tab === 'criar' ? 'new-password' : 'current-password'}
                        className="w-full py-2 px-3 pr-9 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalhes Compactos de Localização e Negócio */}
                {tab === 'criar' && selectedRole !== 'cliente' && selectedRole !== 'entregador' && (
                  <div className="border-t border-slate-100 pt-3 mt-2 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-ink/70 mb-1">Província *</label>
                        <select 
                          value={bizProvince} 
                          onChange={(e) => {
                            const newProv = e.target.value;
                            setBizProvince(newProv);
                            const firstDistrict = MOZAMBIQUE_PROVINCES.find(p => p.name === newProv)?.districts[0] || '';
                            if (firstDistrict) setBizZone(firstDistrict);
                          }}
                          className="w-full py-2 px-2.5 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand outline-none"
                        >
                          {MOZAMBIQUE_PROVINCES.map(p => (
                            <option key={p.id} value={p.name}>{p.name} ({p.region})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink/70 mb-1">Distrito / Bairro / Zona *</label>
                        <input 
                          type="text" 
                          list="moz-districts-list"
                          placeholder="ex: Central, Matola, Munhava..."
                          value={bizZone}
                          onChange={(e) => setBizZone(e.target.value)}
                          required
                          className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand outline-none"
                        />
                        <datalist id="moz-districts-list">
                          {(MOZAMBIQUE_PROVINCES.find(p => p.name === bizProvince)?.districts || []).map((d, i) => (
                            <option key={i} value={d} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink/70 mb-1">Endereço / Avenida *</label>
                        <input 
                          type="text" 
                          placeholder="ex: Av. Eduardo Mondlane, nº 120"
                          value={bizAddress}
                          onChange={(e) => setBizAddress(e.target.value)}
                          required
                          className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink/70 mb-1">Ponto de Referência</label>
                        <input 
                          type="text" 
                          placeholder="ex: Próximo à paragem / mercado"
                          value={bizLandmarks}
                          onChange={(e) => setBizLandmarks(e.target.value)}
                          className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand outline-none"
                        />
                      </div>
                    </div>

                    {/* Mapa Compacto */}
                    <div>
                      <label className="block text-[11px] font-bold text-ink/70 mb-1 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-terracotta" />
                        <span>Localização GPS (clique no mapa para ajustar)</span>
                      </label>
                      <StoreLocationMap
                        mode="picker"
                        storeName={name || 'Meu Estabelecimento'}
                        addressText={bizAddress}
                        landmarks={bizLandmarks}
                        province={bizProvince}
                        latitude={bizLat}
                        longitude={bizLng}
                        onLocationChange={({ lat, lng, addressText }) => {
                          setBizLat(lat);
                          setBizLng(lng);
                          if (addressText && !bizAddress) {
                            setBizAddress(addressText);
                          }
                        }}
                        height="150px"
                      />
                    </div>

                    {/* Segmento, Modalidade e Produtos em Grelha Compacta */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-ink/70 mb-1">Segmento *</label>
                        <select 
                          value={bizSegment.startsWith('Outro:') ? 'outro' : bizSegment} 
                          onChange={(e) => {
                            if (e.target.value === 'outro') {
                              setBizSegment('Outro: ');
                            } else {
                              setBizSegment(e.target.value);
                            }
                          }}
                          className="w-full py-2 px-2.5 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand outline-none"
                        >
                          <option value="Vestuário & Moda">Vestuário & Moda</option>
                          <option value="Calçado & Meias">Calçado & Meias</option>
                          <option value="Floricultura, Plantas & Decoração">Floricultura & Decoração</option>
                          <option value="Eletrónicos & Informática">Eletrónicos & Informática</option>
                          <option value="Casa, Louças & Ferramentas">Casa & Ferramentas</option>
                          <option value="Material de Construção & Estaleiro">Material de Construção</option>
                          <option value="Cosméticos & Perfumaria">Cosméticos & Perfumaria</option>
                          <option value="Peças Automóveis & Oficina">Peças Auto & Oficina</option>
                          <option value="Bares, Restaurantes & Diversão">Bares & Restaurantes</option>
                          <option value="Hospedagem, Hotéis & Alojamento">Hospedagem & Hotéis</option>
                          <option value="Papelaria, Gráfica & Brindes">Papelaria & Gráfica</option>
                          <option value="Farmácia, Saúde & Bem-Estar">Farmácia & Saúde</option>
                          <option value="Serviços Gerais & Outros">Serviços Gerais</option>
                          <option value="outro">Outro Segmento...</option>
                        </select>
                        {bizSegment.startsWith('Outro:') && (
                          <input
                            type="text"
                            placeholder="Especifique o segmento..."
                            value={bizSegment.replace('Outro: ', '')}
                            onChange={(e) => setBizSegment(`Outro: ${e.target.value}`)}
                            className="mt-1.5 w-full py-1.5 px-2.5 bg-paper border border-indigo-brand/50 rounded-lg text-xs font-medium outline-none"
                            autoFocus
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink/70 mb-1">Modalidade *</label>
                        <select 
                          value={bizSalesType} 
                          onChange={(e) => setBizSalesType(e.target.value as any)}
                          className="w-full py-2 px-2.5 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand outline-none"
                        >
                          <option value="ambos">Grosso & Retalho (Ambos)</option>
                          <option value="grosso">Venda a Grosso</option>
                          <option value="retalho">Venda a Retalho</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink/70 mb-1">Produtos Principais</label>
                        <input 
                          type="text" 
                          placeholder="ex: Cimento, vestuário, bebidas"
                          value={bizProducts}
                          onChange={(e) => setBizProducts(e.target.value)}
                          className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-ink/70 mb-1">Breve Descrição (Opcional)</label>
                      <input 
                        type="text"
                        placeholder="ex: Atendimento diário com entrega ao domicílio em Maputo e Matola..."
                        value={bizDesc}
                        onChange={(e) => setBizDesc(e.target.value)}
                        className="w-full py-2 px-3 bg-paper border border-ink/12 rounded-lg text-xs font-medium focus:border-indigo-brand outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Interesses e Planos Compactos de Cliente */}
                {tab === 'criar' && selectedRole === 'cliente' && (
                  <div className="pt-2 border-t border-slate-100 space-y-3 animate-fadeIn">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-ink/80">
                          Serviços de Interesse <span className="font-normal text-ink/50">(seleccione um ou mais)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleInterest('Tudo')}
                          className="text-[11px] font-semibold text-[#0B254B] hover:underline cursor-pointer"
                        >
                          {interests.includes('Tudo') ? 'Desmarcar Todos' : 'Seleccionar Tudo'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {[
                          { name: 'Hospedagem e hotéis', icon: HomeIcon },
                          { name: 'Estaleiros de material de construção', label: 'Material de Construção', icon: Hammer },
                          { name: 'Lojas', icon: ShoppingBag },
                          { name: 'Bares', icon: Wine },
                          { name: 'Supermercados', icon: ShoppingCart },
                          { name: 'Peças', label: 'Peças Auto', icon: Wrench },
                          { name: 'Turismo e safaris', icon: Compass },
                          { name: 'Logística, fretes e transporte', label: 'Logística & Fretes', icon: Truck },
                          { name: 'Tudo', label: 'Tudo (Todos)', icon: CheckCircle2 },
                        ].map((item, idx) => {
                          const checked = interests.includes(item.name);
                          const Icon = item.icon;
                          return (
                            <button
                              type="button"
                              key={`interest-${item.name}-${idx}`}
                              onClick={() => toggleInterest(item.name)}
                              className={`flex items-center gap-2 border rounded-lg px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer text-left transition-all ${
                                checked 
                                  ? 'bg-[#0B254B] border-[#0B254B] text-white' 
                                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${checked ? 'text-amber-300' : 'text-slate-500'}`} />
                              <span className="truncate">{item.label || item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selecção Compacta de Plano de Cliente */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#0B254B] uppercase tracking-wider">
                          Plano de Acesso Cliente (Inclui 15 Dias Grátis)
                        </span>
                        <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px]">
                          <button
                            type="button"
                            onClick={() => setClientAccessScope('single_category')}
                            className={`py-1 px-2.5 rounded-md font-semibold cursor-pointer transition-colors ${
                              clientAccessScope === 'single_category' ? 'bg-[#0B254B] text-white' : 'text-slate-600'
                            }`}
                          >
                            1 Categoria
                          </button>
                          <button
                            type="button"
                            onClick={() => setClientAccessScope('all_categories')}
                            className={`py-1 px-2.5 rounded-md font-semibold cursor-pointer transition-colors ${
                              clientAccessScope === 'all_categories' ? 'bg-[#0B254B] text-white' : 'text-slate-600'
                            }`}
                          >
                            Acesso Total
                          </button>
                        </div>
                      </div>

                      {clientAccessScope === 'single_category' && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {[
                            'Hospedagem e hotéis',
                            'Estaleiros de material de construção',
                            'Lojas',
                            'Bares',
                            'Supermercados',
                            'Peças',
                            'Turismo e safaris',
                            'Logística e fretes'
                          ].map((cat, idx) => (
                            <button
                              key={`auth-cat-${cat}-${idx}`}
                              type="button"
                              onClick={() => setSelectedSingleCategory(cat)}
                              className={`py-1 px-2 rounded text-[10.5px] font-semibold border transition-all cursor-pointer ${
                                selectedSingleCategory === cat
                                  ? 'bg-[#0B254B] text-white border-[#0B254B]'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 3 Planos em Linhas Horizontais Compactas */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          {
                            id: 'mensal' as const,
                            label: 'Mensal (30d)',
                            price: clientAccessScope === 'single_category' ? '100 MT' : '150 MT',
                            sub: 'Sem fidelização',
                          },
                          {
                            id: 'semestral' as const,
                            label: '6 Meses · Economia',
                            price: clientAccessScope === 'single_category' ? '300 MT' : '500 MT',
                            sub: 'Poupança de 50%',
                          },
                          {
                            id: 'anual' as const,
                            label: 'Anual (365d)',
                            price: clientAccessScope === 'single_category' ? '500 MT' : '2.000 MT',
                            sub: 'Acesso anual completo',
                          },
                        ].map((pl) => {
                          const active = selectedPlanSingular === pl.id;
                          return (
                            <button
                              key={pl.id}
                              type="button"
                              onClick={() => setSelectedPlanSingular(pl.id)}
                              className={`px-3 py-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                active
                                  ? 'border-[#0B254B] bg-[#0B254B]/[0.04] ring-1 ring-[#0B254B]'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-900 truncate">{pl.label}</div>
                                <div className="text-[10px] text-slate-500 truncate">{pl.sub}</div>
                              </div>
                              <span className="font-serif font-bold text-sm text-[#0B254B] shrink-0">{pl.price}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selector Compacto de Plano Comercial + Opção de Entrega */}
                {tab === 'criar' && selectedRole !== 'cliente' && selectedRole !== 'entregador' && (
                  <div className="border-t border-slate-100 pt-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-[#0B254B] uppercase tracking-wider">
                        Plano Comercial (Inclui 15 Dias Grátis)
                      </label>
                      <span className="text-[10px] font-mono text-slate-500">M-Pesa · e-Mola · BIM</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          id: 'bronze' as const,
                          label: 'Plano Base',
                          price: '600 MT/mês',
                          sub: 'Directório + WhatsApp',
                          addon: false,
                        },
                        {
                          id: 'prata' as const,
                          label: 'Plano Pro',
                          price: '1.000 MT/mês',
                          sub: 'Destaque + Promoções',
                          addon: false,
                        },
                        {
                          id: 'ouro' as const,
                          label: 'VIP + Entrega',
                          price: '1.500 MT/mês',
                          sub: 'Estafetas + Anti-burla',
                          addon: true,
                        },
                      ].map((pl) => {
                        const active = selectedPlanBusiness === pl.id;
                        return (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => {
                              setSelectedPlanBusiness(pl.id);
                              setHasDeliveryAddon(pl.addon);
                            }}
                            className={`px-3 py-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              active
                                ? 'border-[#0B254B] bg-[#0B254B]/[0.04] ring-1 ring-[#0B254B]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">{pl.label}</div>
                              <div className="text-[10px] text-slate-500 truncate">{pl.sub}</div>
                            </div>
                            <span className="font-serif font-bold text-xs text-[#0B254B] shrink-0">{pl.price}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Barra Compacta de Integração de Entrega */}
                    <div className="bg-slate-900 text-white rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            Entrega Integrada & Protecção Anti-Burla (Plano VIP · 1.500 MT/mês)
                          </div>
                          <div className="text-[10.5px] text-slate-300 truncate">
                            {hasDeliveryAddon
                              ? 'Activo: Acesso directo a estafetas verificados e registo oficial de encomendas.'
                              : 'Desactivado: Apenas atendimento presencial na loja.'}
                          </div>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={hasDeliveryAddon}
                          onChange={(e) => {
                            setHasDeliveryAddon(e.target.checked);
                            if (e.target.checked) setSelectedPlanBusiness('ouro');
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Resumo Compacto para Estafeta + Fase 03 Sempre Inclusa */}
                {tab === 'criar' && (
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-slate-600">
                      <strong className="text-[#0B254B] font-mono text-[10px] uppercase mr-1.5">Fase 03 Inclusa:</strong>
                      <span>Plano <strong className="text-slate-900">{activePlanSummaryLabel}</strong> (15 dias grátis ou pagamento M-Pesa/e-Mola/BIM).</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSubPaymentModalOpen(true)}
                      className="text-[11px] font-semibold text-[#0B254B] hover:underline cursor-pointer shrink-0"
                    >
                      Ver contas de pagamento →
                    </button>
                  </div>
                )}

                {authSyncMsg && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 flex items-center gap-2 animate-fadeIn">
                    <Database className="w-3.5 h-3.5 text-[#0B254B] shrink-0" />
                    <span>{authSyncMsg}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 bg-[#0B254B] hover:bg-[#071933] disabled:opacity-60 text-white font-semibold rounded-lg text-xs sm:text-sm cursor-pointer shadow-2xs transition-all flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>A processar...</span>
                    </>
                  ) : (
                    <>
                      <span>{tab === 'login' ? 'Iniciar Sessão na Conta' : 'Guardar Dados e Avançar para Fase 03 (Pagamento do Plano)'}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400">
                  <span>Ao continuar, aceita os termos de uso da plataforma Axofácil!.</span>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser?.role === 'admin') {
                          setActivePage('admin');
                        } else {
                          setShowAdminAuthModal(true);
                          setAdminPasswordInput('');
                          setAdminAuthError('');
                        }
                      }}
                      className="text-[10.5px] text-slate-400 hover:text-slate-700 hover:underline cursor-pointer"
                    >
                      Administrador
                    </button>
                  )}
                </div>

              </form>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: FLUXO COMPACTO DE PAGAMENTO DO PLANO E ACTIVAÇÃO */}
        {step === 'payment' && (
          <div className="space-y-3 animate-fadeIn">
            {/* Barra Unificada da Fase 03 / Fase 04 com Acção Rápida de 15 Dias Grátis */}
            <div className="p-4 bg-[#0B254B] text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                  {paymentDone ? 'Fase 04 de 04 · Conclusão (100%)' : 'Fase 03 de 04 · Pagamento do Plano ou 15 Dias Grátis (75%)'}
                </div>
                <h1 className="font-serif font-bold text-base sm:text-lg text-white leading-snug">
                  {paymentDone ? 'Registo e Comprovativo Concluídos' : `Bem-vindo, ${createdUser?.displayName || createdUser?.name || 'Utilizador'} — Active a sua conta`}
                </h1>
                <p className="text-xs text-slate-300">
                  Pode iniciar já os 15 dias gratuitos sem custo ou submeter o comprovativo M-Pesa, e-Mola ou BIM abaixo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleActivateTrialAndComplete()}
                  className="py-2 px-3.5 bg-white hover:bg-slate-100 text-[#0B254B] font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Começar com 15 Dias Grátis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubPaymentModalOpen(true)}
                  className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                  <span>Modal</span>
                </button>
              </div>
            </div>

            {/* Contentor Compacto de Pagamento na Página */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs">
              {paymentDone ? (
                <div className="text-center py-4 space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-slate-900">
                      {confirmedPayRecord ? 'Comprovativo Submetido com Sucesso!' : 'Fase 4 — Registo de Conta Concluído!'}
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mt-0.5">
                      {confirmedPayRecord ? (
                        <>A referência <strong>{confirmedPayRecord.referenceNumber}</strong> foi enviada para validação.</>
                      ) : (
                        <>A sua conta <strong>{createdUser?.storeName || createdUser?.name || name || clientOrStoreName || 'Axofácil!'}</strong> está activa com 15 dias grátis.</>
                      )}
                    </p>
                  </div>

                  {confirmedPayRecord && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-left max-w-md mx-auto space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ordem / Valor:</span>
                        <span className="font-mono font-bold text-slate-900">{confirmedPayRecord.id} · {confirmedPayRecord.totalAmountMT} MT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Método / Estado:</span>
                        <span className="font-bold text-amber-700 uppercase">{confirmedPayRecord.paymentMethod} · Pendente</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                    {confirmedPayRecord ? (
                      <a
                        href={`https://wa.me/258871425316?text=${encodeURIComponent(
                          `Olá Administração Axofácil!, acabei de submeter o pagamento de subscrição:\n` +
                          `• Ordem: ${confirmedPayRecord.id}\n` +
                          `• Titular: ${payPayerName || createdUser?.displayName || createdUser?.name}\n` +
                          `• Valor: ${confirmedPayRecord.totalAmountMT} MT\n` +
                          `• Referência: ${confirmedPayRecord.referenceNumber}\n` +
                          `Peço a validação e ativação da conta.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Enviar no WhatsApp</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivateTrialAndComplete()}
                        className="flex-1 py-2.5 px-4 bg-[#0B254B] hover:bg-[#103B75] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Concluir e Entrar no Painel</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleActivateTrialAndComplete('Conta activa! Bem-vindo ao seu painel.')}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Entrar no Painel
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!payRefInput.trim()) {
                      notify('Por favor introduza o código de referência da transação.', 'error');
                      return;
                    }

                    const registeredAccount = ensureRegisteredAccount();
                    const isClientProfile = registeredAccount.role === 'cliente';
                    const planName = isClientProfile
                      ? (selectedPlanSingular === 'mensal' ? 'Plano Mensal' : selectedPlanSingular === 'semestral' ? 'Plano Economia' : 'Plano Anual')
                      : (selectedPlanBusiness === 'bronze' ? 'Plano Base Bronze' : selectedPlanBusiness === 'prata' ? 'Plano Pro Destaque' : 'Plano Premium VIP + Entrega');

                    const planPrice = isClientProfile
                      ? (clientAccessScope === 'single_category'
                          ? (selectedPlanSingular === 'mensal' ? 100 : selectedPlanSingular === 'semestral' ? 300 : 500)
                          : (selectedPlanSingular === 'mensal' ? 150 : selectedPlanSingular === 'semestral' ? 500 : 2000))
                      : (selectedPlanBusiness === 'bronze' ? 600 : selectedPlanBusiness === 'prata' ? 1000 : 1500);

                    const order = createPaymentOrder({
                      customerName: payPayerName.trim() || createdUser?.displayName || createdUser?.name || 'Cliente Axofácil',
                      customerPhone: payPayerPhone.trim() || createdUser?.emailOrPhone || '',
                      customerEmail: createdUser?.emailOrPhone?.includes('@') ? createdUser.emailOrPhone : undefined,
                      targetType: 'plataforma',
                      establishmentName: createdUser?.storeName || (isClientProfile ? 'Acesso Cliente Axofácil!' : 'Subscrição Comercial Axofácil!'),
                      orderItemsSummary: `${planName} (${planPrice} MT)`,
                      subtotalAmountMT: planPrice,
                      deliveryFeeMT: 0,
                      totalAmountMT: planPrice,
                      paymentMethod: payMethod,
                      referenceNumber: payRefInput.trim().toUpperCase(),
                      proofUrl: payProofUrl || undefined,
                      deliveryOption: 'pickup'
                    });

                    setConfirmedPayRecord(order);
                    setPaymentDone(true);
                    notify('Pagamento de subscrição registado com sucesso! A administração irá validar a ativação.', 'success');
                  }}
                  className="space-y-4"
                >
                  {/* 1. Selecção Compacta de Plano */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      1. Plano Seleccionado
                    </label>
                    
                    {(createdUser?.role || selectedRole) === 'cliente' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'mensal' as const, label: 'Mensal (30d)', price: clientAccessScope === 'single_category' ? '100 MT' : '150 MT' },
                          { id: 'semestral' as const, label: '6 Meses (Economia)', price: clientAccessScope === 'single_category' ? '300 MT' : '500 MT' },
                          { id: 'anual' as const, label: '12 Meses (Anual)', price: clientAccessScope === 'single_category' ? '500 MT' : '2.000 MT' },
                        ].map((pl) => (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => setSelectedPlanSingular(pl.id)}
                            className={`px-3 py-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                              selectedPlanSingular === pl.id ? 'border-[#0B254B] bg-blue-50/30 font-bold' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs text-slate-800">{pl.label}</span>
                            <span className="font-serif font-bold text-sm text-[#0B254B]">{pl.price}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'bronze' as const, label: 'Plano Base', price: '600 MT/mês' },
                          { id: 'prata' as const, label: 'Plano Pro', price: '1.000 MT/mês' },
                          { id: 'ouro' as const, label: 'VIP + Entrega', price: '1.500 MT/mês' },
                        ].map((pl) => (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => setSelectedPlanBusiness(pl.id)}
                            className={`px-3 py-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                              selectedPlanBusiness === pl.id ? 'border-[#0B254B] bg-blue-50/30 font-bold' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs text-slate-800">{pl.label}</span>
                            <span className="font-serif font-bold text-xs text-[#0B254B]">{pl.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Canais Oficiais de Pagamento em Linha Compacta */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      2. Canal de Pagamento Manual
                    </label>

                    <div className="grid grid-cols-3 gap-2 mb-2.5">
                      {[
                        { id: 'emola' as const, name: 'e-Mola', sub: '871425316', icon: Smartphone, color: 'text-amber-600' },
                        { id: 'mpesa' as const, name: 'M-Pesa', sub: '842525316', icon: Smartphone, color: 'text-red-600' },
                        { id: 'transferencia_bancaria' as const, name: 'BIM', sub: '12345678901', icon: Building2, color: 'text-blue-600' },
                      ].map((ch) => {
                        const Icon = ch.icon;
                        const active = payMethod === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setPayMethod(ch.id)}
                            className={`px-3 py-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                              active ? 'border-[#0B254B] bg-slate-900/[0.03] ring-1 ring-[#0B254B]' : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${ch.color}`} />
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">{ch.name}</div>
                              <div className="text-[10px] font-mono text-slate-500 truncate">{ch.sub}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Detalhes da Conta num Único Bloco Compacto */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-600">
                          {payMethod === 'emola' ? 'Conta e-Mola (*898#):' : payMethod === 'mpesa' ? 'Conta M-Pesa (*150#):' : 'Conta Millennium BIM:'}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {payMethod === 'emola' ? '871425316' : payMethod === 'mpesa' ? '842525316 / 871425316' : '12345678901'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">Titular: <strong className="text-slate-900">Axofácil Serviços</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[#0B254B]">
                          Total: {(createdUser?.role || selectedRole) === 'cliente'
                            ? (clientAccessScope === 'single_category'
                                ? (selectedPlanSingular === 'mensal' ? '100 MT' : selectedPlanSingular === 'semestral' ? '300 MT' : '500 MT')
                                : (selectedPlanSingular === 'mensal' ? '150 MT' : selectedPlanSingular === 'semestral' ? '500 MT' : '2.000 MT'))
                            : (selectedPlanBusiness === 'bronze' ? '600 MT' : selectedPlanBusiness === 'prata' ? '1.000 MT' : '1.500 MT')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const num = payMethod === 'emola' ? '871425316' : payMethod === 'mpesa' ? '842525316' : '12345678901';
                            navigator.clipboard.writeText(num);
                            setPayCopiedField(payMethod);
                            setTimeout(() => setPayCopiedField(null), 2000);
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {payCopiedField === payMethod ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{payCopiedField === payMethod ? 'Copiado' : 'Copiar Nº'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Dados do Titular, Referência e Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nome do Titular / Loja *
                      </label>
                      <input
                        type="text"
                        required
                        value={payPayerName}
                        onChange={(e) => setPayPayerName(e.target.value)}
                        placeholder="Ex: Seu Nome ou Nome da Loja"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-[#0B254B] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Código de Referência da Transação *
                      </label>
                      <input
                        type="text"
                        required
                        value={payRefInput}
                        onChange={(e) => setPayRefInput(e.target.value)}
                        placeholder="Ex: MP260905.8891 ou EML871"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:border-[#0B254B] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Comprovativo / Screenshot (Opcional)
                    </label>
                    <FileUpload
                      onUploadSuccess={(url) => setPayProofUrl(url)}
                      currentUrl={payProofUrl}
                      folder="payment-proofs"
                      label="Anexar Comprovativo (M-Pesa / e-Mola / BIM)"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleActivateTrialAndComplete()}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Avançar com 15 Dias Grátis
                    </button>

                    <button
                      type="submit"
                      className="py-2.5 px-5 bg-[#0B254B] hover:bg-[#071933] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Submeter Comprovativo de Pagamento</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ADMIN AUTHENTICATION SECURITY MODAL */}
      {showAdminAuthModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-ink/15 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAdminAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-ink/40 hover:text-ink hover:bg-sand-2/50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-indigo-deep">Autenticação do Administrador</h2>
                <p className="text-xs text-ink/60">Área estritamente privada para gestão geral do portal.</p>
              </div>
            </div>

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">
                  E-mail de Administrador Registado no Supabase *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="ex: diasgermano348@gmail.com"
                    value={adminEmailInput}
                    onChange={(e) => {
                      setAdminEmailInput(e.target.value);
                      setAdminAuthError('');
                    }}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none pr-10"
                  />
                  <ShieldCheck className="w-4 h-4 text-ink/30 absolute right-3 top-3.5" />
                </div>
                <p className="text-[11px] text-ink/50 mt-1">
                  Apenas o e-mail autorizado definido no Supabase pode aceder como administrador.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">
                  Palavra-Passe Mestre do Administrador *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Digite a palavra-passe mestre"
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      setAdminAuthError('');
                    }}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none pr-10"
                  />
                  <Lock className="w-4 h-4 text-ink/30 absolute right-3 top-3.5" />
                </div>
                {adminAuthError && (
                  <p className="text-[11px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {adminAuthError}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 leading-tight">
                🔒 <strong>Nota de Segurança:</strong> Se for cliente singular, empresa ou entregador, utilize o seu perfil de login normal. Esta área dá acesso a aprovações, relatórios e parametrização do portal.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminAuthModal(false)}
                  className="btn bg-sand-2 text-ink hover:bg-sand-2/70 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-deep text-white hover:bg-indigo-brand py-2.5 px-5 rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Validar e Entrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Manual Payment Modal with 15 Days Free Trial Option */}
      <SubscriptionPaymentModal
        isOpen={isSubPaymentModalOpen}
        onClose={() => {
          setIsSubPaymentModalOpen(false);
          // O utilizador permanece no passo 3 (fluxo de pagamento na página) para poder continuar ou consultar detalhes
        }}
        onTrialBypass={() => {
          handleActivateTrialAndComplete();
        }}
        onSuccess={() => {
          ensureRegisteredAccount();
          setIsSubPaymentModalOpen(false);
          setPaymentDone(true);
          notify('Pagamento submetido para validação com sucesso!', 'success');
        }}
        isTrialOffer={true}
        currentUser={createdUser || currentUser}
        defaultPlan={
          (createdUser?.role || selectedRole) === 'cliente' 
            ? (selectedPlanSingular === 'mensal' ? 'cliente_mensal' : selectedPlanSingular === 'semestral' ? 'cliente_semestral' : 'cliente_anual')
            : selectedPlanBusiness
        }
      />

    </div>
  );
}
