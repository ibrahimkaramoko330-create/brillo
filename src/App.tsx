 import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  LogIn,
  LogOut,
  Search,
  Bike,
  Car,
  Truck,
  Droplets,
  Sparkles,
  Settings,
  Eraser,
  Banknote,
  CheckCircle2,
  TrendingUp,
  History as HistoryIcon,
  X,
  Phone,
  LayoutDashboard,
  Clock,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  Info,
  Plus,
  Users,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Download,
  Edit2,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Receipt,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Trash2,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line
} from 'recharts';

// --- Types ---
type Role = 'super_manager' | 'manager' | 'cashier' | 'washer';
type ViewType = 'pos' | 'history' | 'global_history' | 'admin' | 'stats' | 'super_dashboard' | 'personnel' | 'super_create';

interface VehicleType {
  id: string;
  label: string;
}

interface VehicleBrand {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  matricule: string;
  brand?: string;
  phone: string;
  vehicle_type: string;
  service_label: string;
  price: number;
  timestamp: string;
  cashier_name?: string;
  washer_name?: string;
}

interface Service {
  id: string;
  label: string;
  vehicle_type_id: string;
  vehicle_type_label?: string;
  price: number;
  active: number;
}

interface Tenant {
  id: string;
  name: string;
  active: number;
  brands_enabled: number;
  expenses_enabled: number;
  created_at: string;
}

interface Site {
  id: string;
  organization_id: string;
  name: string;
  active: number;
}

interface User {
  id: string;
  username: string;
  role: string;
  active: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  site_id?: string;
}

interface AuthUser {
  id: string;
  username: string;
  role: Role;
  tenant_id?: string;
  organization_id?: string;
  site_id?: string;
  tenant_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  brands_enabled?: number;
  expenses_enabled?: number;
}

// --- Constants ---
const VEHICLE_ICONS: Record<string, React.ReactNode> = {
  moto: <Bike className="w-4 h-4" />,
  berline: <Car className="w-4 h-4" />,
  suv: <Truck className="w-4 h-4" />,
};

const VEHICLE_LABELS: Record<string, string> = {
  moto: 'Moto',
  berline: 'Berline',
  suv: 'SUV/4x4',
};

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'Simple': <Droplets className="w-4 h-4" />,
  'Complet': <Sparkles className="w-4 h-4" />,
  'Moteur': <Settings className="w-4 h-4" />,
  'Polish': <Eraser className="w-4 h-4" />,
};

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('wash_token'));
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- App State ---
  const [view, setView] = useState<ViewType>('pos');
  const [personnelTab, setPersonnelTab] = useState<'users' | 'sites'>('users');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [newSiteName, setNewSiteName] = useState('');
  const [historyData, setHistoryData] = useState<Transaction[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [stats, setStats] = useState<{
    dailyRevenue: number;
    dailyExpenses: number;
    totalTransactions: number;
    periodRevenue: number;
    periodExpenses: number;
    washerStats: { name: string; count: number; revenue: number }[];
    dailyHistory: { date: string; revenue: number; count: number }[];
    servicesStats?: { name: string; value: number }[];
    sitesStats?: { name: string; value: number; vehicles: number }[];
  }>({ dailyRevenue: 0, dailyExpenses: 0, totalTransactions: 0, periodRevenue: 0, periodExpenses: 0, washerStats: [], dailyHistory: [] });

  // --- POS State ---
  const [matricule, setMatricule] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServiceLabel, setSelectedServiceLabel] = useState('Simple');
  const [selectedWasherId, setSelectedWasherId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [editTransactionData, setEditTransactionData] = useState<any>(null);

  // --- Expenses State ---
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [showExpenseSuccess, setShowExpenseSuccess] = useState(false);

  // --- Admin State ---
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantManager, setNewTenantManager] = useState('');
  const [newTenantPass, setNewTenantPass] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [newEmployeeUsername, setNewEmployeeUsername] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState<'cashier' | 'washer' | 'manager'>('cashier');
  const [newEmployeeFirstName, setNewEmployeeFirstName] = useState('');
  const [newEmployeeLastName, setNewEmployeeLastName] = useState('');
  const [newEmployeePhone, setNewEmployeePhone] = useState('');
  const [selectedEmployeeSiteId, setSelectedEmployeeSiteId] = useState('');
  const [newVehicleTypeLabel, setNewVehicleTypeLabel] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newServiceLabel, setNewServiceLabel] = useState('');
  const [showTenantSuccess, setShowTenantSuccess] = useState(false);
  const [showUserSuccess, setShowUserSuccess] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ u: string, p: string } | null>(null);
  const [selectedDashboardTenant, setSelectedDashboardTenant] = useState<string>('all');
  const [selectedDashboardSite, setSelectedDashboardSite] = useState<string>('all');
  const [selectedHistoryTenant, setSelectedHistoryTenant] = useState<string>('all');
  const [historyPeriod, setHistoryPeriod] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [managerPeriod, setManagerPeriod] = useState<'today' | '7days' | '30days' | 'custom'>('today');
  const [managerStartDate, setManagerStartDate] = useState('');
  const [managerEndDate, setManagerEndDate] = useState('');
  const [superPeriod, setSuperPeriod] = useState<'today' | '7days' | '30days' | 'custom'>('7days');
  const [superStartDate, setSuperStartDate] = useState('');
  const [superEndDate, setSuperEndDate] = useState('');
  const [selectedCashierId, setSelectedCashierId] = useState<string>('all');
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [editSiteId, setEditSiteId] = useState('');
  const [editRole, setEditRole] = useState<Role>('cashier');
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [siteUsers, setSiteUsers] = useState<Record<string, any[]>>({});

  // --- Confirmation Modal State ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
  } | null>(null);

  const confirmAction = (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
  }) => {
    setConfirmModalConfig(config);
    setShowConfirmModal(true);
  };

  // --- Edit State ---
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editingBrand, setEditingBrand] = useState<VehicleBrand | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleType | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const initialViewRef = React.useRef(false);

  // --- Effects ---
  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  useEffect(() => {
    if (user && !initialViewRef.current) {
      if (user.role === 'super_manager') {
        setView('super_dashboard');
      } else if (user.role === 'manager') {
        setView('stats');
      } else {
        setView('pos');
      }
      initialViewRef.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'super_manager' && selectedTenantId) {
      fetchVehicleTypes(selectedTenantId);
      fetchBrands(selectedTenantId);
      fetchServices(selectedTenantId);
      fetchUsers(selectedTenantId);
      fetchSites(selectedTenantId);
    }
  }, [selectedTenantId, user]);

  useEffect(() => {
    if (user && user.role === 'super_manager' && selectedDashboardTenant !== 'all') {
      fetchSites(selectedDashboardTenant);
    } else {
      setSelectedDashboardSite('all');
    }
  }, [selectedDashboardTenant, user]);

  const fetchRevenueTrend = async () => {
    if (user && (user.role === 'manager' || user.role === 'cashier')) {
      const res = await fetch('/api/stats?period=7days', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setRevenueTrend(data.dailyHistory || []);
      }
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'super_manager') {
        fetchTenants();
        fetchAllData();
        if (view === 'global_history') {
          fetchHistory(historyPeriod, historyStartDate, historyEndDate, selectedHistoryTenant);
        }
      } else {
        if (user.role === 'manager') {
          fetchSites();
        }
        fetchVehicleTypes();
        fetchBrands();
        fetchServices();
        fetchRevenueTrend();
        if (view === 'history') {
          if (user.role === 'manager') {
            fetchHistory(managerPeriod, managerStartDate, managerEndDate, undefined, selectedSiteId);
          } else {
            fetchHistory('today', undefined, undefined, undefined, user.site_id);
          }
        } else if (view === 'global_history') {
          fetchHistory('all', undefined, undefined, undefined, selectedSiteId);
        } else {
          fetchHistory(undefined, undefined, undefined, undefined, selectedSiteId);
        }
        fetchUsers();
        if (user.role === 'manager' || user.role === 'cashier') {
          fetchStats(undefined, undefined, undefined, undefined, undefined, selectedSiteId);
          fetchExpenses(undefined, selectedSiteId);
        }
      }

      // Polling for real-time updates
      const interval = setInterval(() => {
        if (user.role === 'super_manager') {
          fetchAllData();
          if (view === 'global_history') {
            fetchHistory(historyPeriod, historyStartDate, historyEndDate, selectedHistoryTenant);
          }
        } else {
          if (view === 'history') {
            if (user.role === 'manager') {
              fetchHistory(managerPeriod, managerStartDate, managerEndDate, undefined, selectedSiteId);
            } else {
              fetchHistory('today', undefined, undefined, undefined, user.site_id);
            }
          } else if (view === 'global_history') {
            fetchHistory(historyPeriod, historyStartDate, historyEndDate, undefined, selectedSiteId);
          } else {
            fetchHistory(undefined, undefined, undefined, undefined, selectedSiteId);
          }
          if (user.role === 'manager' || user.role === 'cashier') {
            fetchStats(undefined, undefined, undefined, undefined, undefined, selectedSiteId);
            fetchExpenses(undefined, selectedSiteId);
            fetchRevenueTrend();
          }
        }
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user, view, managerPeriod, managerStartDate, managerEndDate, superPeriod, superStartDate, superEndDate, selectedCashierId, selectedHistoryTenant, historyPeriod, historyStartDate, historyEndDate, selectedSiteId, selectedDashboardTenant, selectedDashboardSite]);

  const fetchUser = async () => {
    const savedUser = localStorage.getItem('wash_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  };

  const fetchTenants = async () => {
    const res = await fetch('/api/tenants', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setTenants(await res.json());
  };

  const fetchSites = async (tenantId?: string) => {
    const tId = tenantId || user?.organization_id;
    if (!tId) return;
    const res = await fetch(`/api/sites?tenant_id=${tId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSites(await res.json());
  };

  const fetchVehicleTypes = async (tenantId?: string) => {
    const url = tenantId ? `/api/vehicle-types?tenant_id=${tenantId}` : '/api/vehicle-types';
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setVehicleTypes(data);
      if (data.length > 0 && !selectedVehicleId) setSelectedVehicleId(data[0].id);
    }
  };

  const fetchBrands = async (tenantId?: string) => {
    const url = tenantId ? `/api/brands?tenant_id=${tenantId}` : '/api/brands';
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setBrands(data);
      if (data.length > 0 && !selectedBrand) setSelectedBrand(data[0].name);
    }
  };

  const fetchUsers = async (tenantId?: string) => {
    const url = tenantId ? `/api/users?tenant_id=${tenantId}` : '/api/users';
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setTenantUsers(await res.json());
  };

  const fetchServices = async (tenantId?: string) => {
    const url = tenantId ? `/api/services?tenant_id=${tenantId}` : '/api/services';
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setServices(await res.json());
  };

  const fetchHistory = async (period?: string, start?: string, end?: string, tenantId?: string, siteId?: string) => {
    let query = '';
    const params = new URLSearchParams();
    if (period && period !== 'all') params.append('period', period);
    if (period === 'custom' && start && end) {
      params.append('startDate', start);
      params.append('endDate', end);
    }
    if (tenantId && tenantId !== 'all') params.append('tenant_id', tenantId);
    if (siteId && siteId !== 'all') params.append('site_id', siteId);

    query = params.toString() ? `?${params.toString()}` : '';

    const [tRes, eRes] = await Promise.all([
      fetch(`/api/transactions${query}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/expenses${query}`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    if (tRes.ok && eRes.ok) {
      const transactions = await tRes.json();
      const expenses = await eRes.json();

      const merged = [
        ...transactions.map((t: any) => ({ ...t, type: 'transaction' })),
        ...expenses.map((e: any) => ({ ...e, type: 'expense' }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setHistoryData(merged);
    }
  };

  const fetchStats = async (tenantId?: string, period?: string, start?: string, end?: string, cashierId?: string, siteId?: string) => {
    const p = period || managerPeriod;
    const s = start || managerStartDate;
    const e = end || managerEndDate;
    const c = cashierId || selectedCashierId;
    const sid = siteId || selectedSiteId;

    let url = `/api/stats?period=${p}`;
    if (tenantId) url += `&tenant_id=${tenantId}`;
    if (c && c !== 'all') url += `&cashier_id=${c}`;
    if (sid && sid !== 'all') url += `&site_id=${sid}`;
    if (p === 'custom' && s && e) {
      url += `&startDate=${s}&endDate=${e}`;
    }

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setStats(await res.json());
  };

  const fetchExpenses = async (cashierId?: string, siteId?: string, period?: string, start?: string, end?: string) => {
    const c = cashierId || selectedCashierId;
    const sid = siteId || selectedSiteId;
    const p = period || (user?.role === 'manager' ? 'today' : undefined);
    let url = '/api/expenses';
    const params = new URLSearchParams();
    if (c && c !== 'all') params.append('cashier_id', c);
    if (sid && sid !== 'all') params.append('site_id', sid);
    if (p) params.append('period', p);
    if (p === 'custom' && start && end) {
      params.append('startDate', start);
      params.append('endDate', end);
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${url}${query}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setExpenses(await res.json());
  };

  const fetchSiteUsers = async (siteId: string) => {
    const res = await fetch(`/api/sites/${siteId}/users`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const users = await res.json();
      setSiteUsers(prev => ({ ...prev, [siteId]: users }));
    }
  };

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('wash_token', data.token);
        localStorage.setItem('wash_user', JSON.stringify(data.user));
      } else {
        setLoginError(data.error);
      }
    } catch (err) {
      setLoginError('Erreur de connexion au serveur');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wash_token');
    localStorage.removeItem('wash_user');
    setView('pos');
    initialViewRef.current = false;
  };

  const fetchAllData = async () => {
    if (!token) return;
    const url = selectedDashboardTenant === 'all' ? '/api/admin/all-data' : `/api/stats?organization_id=${selectedDashboardTenant}&period=${superPeriod}${superStartDate && superEndDate ? `&startDate=${superStartDate}&endDate=${superEndDate}` : ''}${selectedDashboardSite !== 'all' ? `&site_id=${selectedDashboardSite}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      if (selectedDashboardTenant === 'all') {
        const processedTransactions = data.transactions.map((t: any) => ({ ...t, type: 'transaction' }));
        setAllTransactions(processedTransactions);
        setTenants(data.tenants);
      } else {
        // When a single tenant is selected, we get stats-formatted data
        setStats(data);
        if (data.dailyHistory) {
          setRevenueTrend(data.dailyHistory);
        }
      }
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantManager || !newTenantPass) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newTenantName, managerUsername: newTenantManager, managerPassword: newTenantPass })
    });
    if (res.ok) {
      setCreatedCredentials({ u: newTenantManager, p: newTenantPass });
      setShowTenantSuccess(true);
      setNewTenantName('');
      setNewTenantManager('');
      setNewTenantPass('');
      fetchTenants();
      fetchAllData();
      setTimeout(() => {
        setShowTenantSuccess(false);
        setCreatedCredentials(null);
      }, 10000);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const globalStats = useMemo(() => {
    if (selectedDashboardTenant !== 'all') {
      return {
        totalRevenue: stats.periodRevenue,
        totalVehicles: stats.totalTransactions,
        dailyHistory: stats.dailyHistory,
        revenueByTenant: stats.sitesStats || [],
        transactionsByService: stats.servicesStats || [],
      };
    }

    let filteredTransactions = allTransactions;

    if (selectedDashboardTenant !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.tenant_id === selectedDashboardTenant);
    }

    if (selectedDashboardSite !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.site_id === selectedDashboardSite);
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (superPeriod === 'today') {
      filteredTransactions = filteredTransactions.filter(t => t.timestamp.startsWith(todayStr));
    } else if (superPeriod === '7days') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.timestamp) >= start);
    } else if (superPeriod === '30days') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.timestamp) >= start);
    } else if (superPeriod === 'custom' && superStartDate && superEndDate) {
      const start = new Date(superStartDate);
      const end = new Date(superEndDate);
      end.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter(t => {
        const d = new Date(t.timestamp);
        return d >= start && d <= end;
      });
    }

    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.price, 0);
    const revenueByTenant = tenants.map(tenant => {
      const tenantRevenue = filteredTransactions
        .filter(t => t.tenant_id === tenant.id)
        .reduce((sum, t) => sum + t.price, 0);
      const tenantVehicles = filteredTransactions.filter(t => t.tenant_id === tenant.id).length;
      return { name: tenant.name, value: tenantRevenue, vehicles: tenantVehicles };
    });
    const transactionsByService = Array.from(new Set(filteredTransactions.map(t => t.service_label))).map(label => {
      const count = filteredTransactions.filter(t => t.service_label === label).length;
      return { name: label, value: count };
    });

    const dailyHistory = Array.from(new Set(filteredTransactions.map(t => t.timestamp.split('T')[0]))).sort().map(date => {
      const dayTransactions = filteredTransactions.filter(t => t.timestamp.startsWith(date));
      const dayRevenue = dayTransactions.reduce((sum, t) => sum + t.price, 0);
      const dayCount = dayTransactions.length;
      return { date, revenue: dayRevenue, count: dayCount };
    });

    return { totalRevenue, revenueByTenant, transactionsByService, totalVehicles: filteredTransactions.length, dailyHistory };
  }, [allTransactions, tenants, selectedDashboardTenant, selectedDashboardSite, superPeriod, superStartDate, superEndDate, stats]);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricule) {
      alert('Veuillez saisir le matricule');
      return;
    }
    if (!selectedWasherId) {
      alert('Veuillez sélectionner un laveur');
      return;
    }

    const currentPrice = services.find(s => s.label === selectedServiceLabel && s.vehicle_type_id === selectedVehicleId)?.price || 0;
    const vehicleTypeLabel = vehicleTypes.find(vt => vt.id === selectedVehicleId)?.label || '';

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        matricule,
        brand: selectedBrand,
        phone,
        vehicle_type: vehicleTypeLabel,
        service_label: selectedServiceLabel,
        price: currentPrice,
        washer_id: selectedWasherId,
        site_id: user.site_id || (selectedSiteId !== 'all' ? selectedSiteId : undefined)
      })
    });

    if (res.ok) {
      setShowSuccess(true);
      fetchHistory();
      fetchStats();

      setTimeout(() => {
        setShowSuccess(false);
        setMatricule('');
        setPhone('');
        setSelectedBrand(brands.length > 0 ? brands[0].name : '');
        if (vehicleTypes.length > 0) setSelectedVehicleId(vehicleTypes[0].id);
        setSelectedServiceLabel('Simple');
        setSelectedWasherId('');
      }, 1500);
    }
  };

  const filteredHistoryData = useMemo(() => {
    if (!searchQuery) return historyData;
    const q = searchQuery.toLowerCase();
    return historyData.filter((item: any) => {
      if (item.type === 'expense') {
        return (
          item.description.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.cashier_name && item.cashier_name.toLowerCase().includes(q))
        );
      }
      return (
        item.matricule.toLowerCase().includes(q) ||
        (item.phone && item.phone.includes(q)) ||
        (item.washer_name && item.washer_name.toLowerCase().includes(q)) ||
        (item.cashier_name && item.cashier_name.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.service_label && item.service_label.toLowerCase().includes(q))
      );
    });
  }, [historyData, searchQuery]);

  const paginatedHistoryData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistoryData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistoryData, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, historyPeriod, selectedHistoryTenant]);

  const currentPrice = useMemo(() => {
    const service = services.find(s => s.label === selectedServiceLabel && s.vehicle_type_id === selectedVehicleId);
    return service ? service.price : 0;
  }, [services, selectedVehicleId, selectedServiceLabel]);

  const handleDeleteTransaction = async (id: string) => {
    const res = await fetch(`/api/admin/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchHistory(historyPeriod, historyStartDate, historyEndDate, selectedHistoryTenant);
      fetchAllData();
    }
  };

  const toggleTenantActive = async (id: string) => {
    const res = await fetch(`/api/tenants/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchTenants();
  };

  const toggleTenantBrands = async (id: string, currentStatus: number) => {
    const res = await fetch(`/api/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ brands_enabled: currentStatus === 1 ? 0 : 1 })
    });
    if (res.ok) fetchTenants();
  };

  const toggleTenantExpenses = async (id: string, currentStatus: number) => {
    const res = await fetch(`/api/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ expenses_enabled: currentStatus === 1 ? 0 : 1 })
    });
    if (res.ok) fetchTenants();
  };

  const toggleUserActive = async (id: string, tenantId?: string) => {
    const res = await fetch(`/api/users/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchUsers(tenantId);
  };

  const toggleServiceActive = async (id: string, tenantId?: string) => {
    const res = await fetch(`/api/services/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchServices(tenantId);
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant || !editValue) return;
    const res = await fetch(`/api/tenants/${editingTenant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editValue })
    });
    if (res.ok) {
      fetchTenants();
      setEditingTenant(null);
    }
  };

  const handleUpdateBrand = async () => {
    if (!editingBrand || !editValue) return;
    const res = await fetch(`/api/brands/${editingBrand.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editValue })
    });
    if (res.ok) {
      fetchBrands(selectedTenantId!);
      setEditingBrand(null);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService || !editValue) return;
    const res = await fetch(`/api/services/labels`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tenant_id: selectedTenantId, oldLabel: editingService.label, newLabel: editValue })
    });
    if (res.ok) {
      fetchServices(selectedTenantId!);
      setEditingService(null);
    }
  };

  const handleUpdatePrice = async (serviceId: string, price: number) => {
    const res = await fetch(`/api/services/${serviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ price })
    });
    if (res.ok) fetchServices(selectedTenantId!);
  };

  const handleUpdateVehicleType = async () => {
    if (!editingVehicleType || !editValue) return;
    const res = await fetch(`/api/vehicle-types/${editingVehicleType.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ label: editValue })
    });
    if (res.ok) {
      fetchVehicleTypes(selectedTenantId!);
      setEditingVehicleType(null);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      const count = payload.find((p: any) => p.dataKey === 'count')?.value || 0;
      const revenue = payload.find((p: any) => p.dataKey === 'revenue')?.value || 0;

      return (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Calendar className="w-3 h-3" /> {formattedDate}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-8">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                <Car className="w-3 h-3 text-blue-400" /> Lavages
              </span>
              <span className="text-xs font-black text-slate-900">{count}</span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                <Banknote className="w-3 h-3 text-blue-700" /> Recette
              </span>
              <span className="text-xs font-black text-blue-700">{revenue.toLocaleString()} F</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // --- Render Login ---
  if (!user) {
    return (
      <div className="fixed inset-0 bg-blue-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-inner relative overflow-hidden">
              <Sparkles className="w-10 h-10 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Brillo</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Lavage Auto & Moto</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Utilisateur</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                  placeholder="Nom d'utilisateur"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-transform"
            >
              Se connecter
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] font-sans text-slate-900 flex flex-col overflow-hidden">

      {/* Compact Top Bar */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">{user.role === 'super_manager' ? 'Super Manager' : user.tenant_name || user.role}</p>
              <p className="text-sm font-bold text-slate-800">{user.username}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {(showTenantSuccess || showUserSuccess) && createdCredentials && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-emerald-100"
            >
              <CheckCircle2 className="w-4 h-4" />
              <div>
                <p>Compte créé avec succès !</p>
                <p className="text-[8px] opacity-80">Login: {createdCredentials.u} / Pass: {createdCredentials.p}</p>
              </div>
              <button onClick={() => { setShowTenantSuccess(false); setShowUserSuccess(false); setCreatedCredentials(null); }}>
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
          {showTenantSuccess && !createdCredentials && user.role === 'super_manager' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100"
            >
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Entreprise Créée
            </motion.div>
          )}
          {user.role === 'cashier' && (
            <div className="text-right border-r border-slate-100 pr-4">
              <p className="text-[10px] text-slate-400 font-black uppercase leading-none mb-1">Caisse Jour</p>
              <p className="text-sm font-black text-blue-600 tracking-tight">
                {(stats.dailyRevenue - stats.dailyExpenses).toLocaleString()} <span className="text-[10px]">F</span>
              </p>
            </div>
          )}
          <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'pos' && user.role !== 'manager' && user.role !== 'super_manager' && (
            <motion.main
              key="pos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 pb-32 space-y-6"
            >
              {/* 1. Matricule & Phone - Compact Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                    Matricule
                  </label>
                  <input
                    type="text"
                    placeholder="AB-123-CD"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                    className="w-full text-lg font-black tracking-tighter text-slate-900 bg-transparent outline-none placeholder:text-slate-200"
                    required
                  />
                </div>
                {user.brands_enabled !== 0 && (
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                      Marque
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full text-lg font-black tracking-tighter text-slate-900 bg-transparent outline-none appearance-none"
                    >
                      <option value="">Choisir...</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  Téléphone
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-300" />
                  <input
                    type="tel"
                    placeholder="07..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-lg font-black tracking-tighter text-slate-900 bg-transparent outline-none placeholder:text-slate-200"
                  />
                </div>
              </div>

              {/* 2. Vehicle Selection */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">
                  Véhicule
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {vehicleTypes.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                        selectedVehicleId === v.id
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100'
                          : 'border-white bg-white text-slate-400 shadow-sm'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase whitespace-nowrap">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Washer Selection */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">
                  Laveur
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {tenantUsers.filter(u => u.role === 'washer' && u.active !== 0).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWasherId(w.id)}
                      className={`flex-shrink-0 flex items-center gap-2 py-2 px-4 rounded-xl border-2 transition-all ${
                        selectedWasherId === w.id
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                          : 'border-white bg-white text-slate-400 shadow-sm'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase whitespace-nowrap">{w.username}</span>
                    </button>
                  ))}
                  {tenantUsers.filter(u => u.role === 'washer').length === 0 && (
                    <p className="text-[10px] text-slate-400 italic px-1">Aucun laveur configuré</p>
                  )}
                </div>
              </div>

              {/* 4. Service Selection */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">
                  Prestation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Array.from(new Set(services.filter(s => s.active !== 0).map(s => s.label))) as string[]).map((label) => {
                    const price = services.find(s => s.label === label && s.vehicle_type_id === selectedVehicleId)?.price || 0;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setSelectedServiceLabel(label)}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                          selectedServiceLabel === label
                            ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                            : 'border-white bg-white text-slate-400 shadow-sm'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${selectedServiceLabel === label ? 'bg-blue-100' : 'bg-slate-50'}`}>
                          {SERVICE_ICONS[label] || <Droplets className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
                        <span className="text-[9px] font-bold text-slate-400">{price.toLocaleString()} F</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Expense Section for Cashier - Only if enabled */}
              {user.expenses_enabled !== 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowExpenseForm(!showExpenseForm)}
                    className="w-full flex items-center justify-between p-4 bg-red-50 rounded-2xl text-red-600 transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5" />
                      <span className="text-xs font-black uppercase tracking-widest">Enregistrer une dépense</span>
                    </div>
                    {showExpenseForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showExpenseForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 space-y-3"
                    >
                      <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                          <input
                            type="text"
                            value={newExpenseDescription}
                            onChange={(e) => setNewExpenseDescription(e.target.value)}
                            placeholder="Ex: Achat savon..."
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 font-bold text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant (F)</label>
                            <input
                              type="number"
                              value={newExpenseAmount}
                              onChange={(e) => setNewExpenseAmount(e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 font-bold text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                            <select
                              value={newExpenseCategory}
                              onChange={(e) => setNewExpenseCategory(e.target.value)}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-red-600 font-bold text-xs"
                            >
                              <option value="">Général</option>
                              <option value="Produits">Produits</option>
                              <option value="Réparation">Réparation</option>
                              <option value="Autre">Autre</option>
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (!newExpenseDescription || !newExpenseAmount) return;
                            confirmAction({
                              title: 'Confirmer la dépense',
                              message: `Voulez-vous enregistrer cette dépense de ${Number(newExpenseAmount).toLocaleString()} FCFA pour "${newExpenseDescription}" ?`,
                              confirmText: 'Enregistrer',
                              onConfirm: async () => {
                                const res = await fetch('/api/expenses', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({
                                    description: newExpenseDescription,
                                    amount: Number(newExpenseAmount),
                                    category: newExpenseCategory,
                                    site_id: user.site_id || (selectedSiteId !== 'all' ? selectedSiteId : undefined)
                                  })
                                });
                                if (res.ok) {
                                  setNewExpenseDescription('');
                                  setNewExpenseAmount('');
                                  setNewExpenseCategory('');
                                  setShowExpenseSuccess(true);
                                  setTimeout(() => setShowExpenseSuccess(false), 3000);
                                  fetchExpenses();
                                  fetchStats();
                                  setShowExpenseForm(false);
                                }
                              }
                            });
                          }}
                          className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-3 h-3" /> Valider la dépense
                        </button>
                        {showExpenseSuccess && (
                          <p className="text-center text-green-600 text-[9px] font-black uppercase tracking-widest">Enregistré !</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.main>
          )}

          {view === 'history' && (
            <motion.main
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col p-4 gap-3"
            >
              <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-3 px-4 shadow-sm">
                <Search className="w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Rechercher matricule, tel, laveur, caissier, marque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-300"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {managerPeriod === 'today' ? 'Journal du Jour' : 'Journal des Lavages'}
                  </h3>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Total: {filteredHistoryData.filter((item: any) => item.type === 'transaction').length} véhicules</p>
                </div>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>

              {user.role === 'manager' && sites.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => {
                      setSelectedSiteId('all');
                      fetchHistory(managerPeriod, managerStartDate, managerEndDate, undefined, 'all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      selectedSiteId === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                    }`}
                  >
                    Tous les sites
                  </button>
                  {sites.map(site => (
                    <button
                      key={site.id}
                      onClick={() => {
                        setSelectedSiteId(site.id);
                        fetchHistory(managerPeriod, managerStartDate, managerEndDate, undefined, site.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        selectedSiteId === site.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                      }`}
                    >
                      {site.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredHistoryData.length > 0 ? (
                  filteredHistoryData.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'transaction') {
                          setSelectedTransaction(item);
                        }
                      }}
                      className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-blue-600'}`}>
                          {item.type === 'expense' ? <ArrowDownCircle className="w-5 h-5" /> : VEHICLE_ICONS[item.vehicle_type]}
                        </div>
                        <div>
                          {item.type === 'expense' ? (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-slate-900 leading-none">{item.description}</p>
                                <span className="text-[8px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded-md font-black uppercase tracking-tighter">
                                  Dépense
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                <span className="text-red-600/80">{item.category || 'Général'}</span>
                                <span className="w-1 h-1 bg-slate-100 rounded-full" />
                                <span className="text-slate-400">{item.cashier_name || 'Inconnu'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-slate-900 leading-none">{item.matricule}</p>
                                <span className="text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-black uppercase tracking-tighter">
                                  {item.brand || 'Inconnu'}
                                </span>
                                <span className="text-[8px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md font-black uppercase tracking-tighter">
                                  {VEHICLE_LABELS[item.vehicle_type] || item.vehicle_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                <span className="text-blue-600/80">{item.service_label}</span>
                                <span className="w-1 h-1 bg-slate-100 rounded-full" />
                                <span className="text-slate-400">{item.phone || 'Sans numéro'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-sm font-black ${item.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                            {item.type === 'expense' ? '-' : ''}{(item.amount || item.price || 0).toLocaleString()} F
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {user.role === 'super_manager' ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTransactionData({ ...item });
                                setIsEditingTransaction(true);
                                fetchUsers(item.tenant_id);
                                fetchServices(item.tenant_id);
                                fetchVehicleTypes(item.tenant_id);
                              }}
                              className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmAction({
                                  title: 'Suppression',
                                  message: `Supprimer cette ${item.type === 'expense' ? 'dépense' : 'transaction'} ?`,
                                  confirmText: 'Supprimer',
                                  type: 'danger',
                                  onConfirm: () => {
                                    const url = item.type === 'expense' ? `/api/expenses/${item.id}` : `/api/transactions/${item.id}`;
                                    fetch(url, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${token}` }
                                    }).then(res => {
                                      if (res.ok) fetchHistory('today');
                                    });
                                  }
                                });
                              }}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          item.type === 'transaction' && <ChevronRight className="w-4 h-4 text-slate-200" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <HistoryIcon className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Aucun lavage aujourd'hui</p>
                  </div>
                )}
              </div>
            </motion.main>
          )}

          {view === 'global_history' && (
            <motion.main
              key="global_history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col p-4 gap-3"
            >
              <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-3 px-4 shadow-sm">
                <Search className="w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Rechercher matricule, tel, laveur, caissier, marque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-300"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {(user.role === 'super_manager' || user.role === 'manager') && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      onClick={() => {
                        setHistoryPeriod('all');
                        fetchHistory('all', undefined, undefined, selectedHistoryTenant);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        historyPeriod === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                      }`}
                    >
                      Tout le temps
                    </button>
                    {(['today', '7days', '30days', 'custom'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setHistoryPeriod(p);
                          if (p !== 'custom') {
                            fetchHistory(p, undefined, undefined, selectedHistoryTenant);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                          historyPeriod === p ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                        }`}
                      >
                        {p === 'today' ? "Aujourd'hui" : p === '7days' ? '7 Jours' : p === '30days' ? '30 Jours' : 'Perso'}
                      </button>
                    ))}
                  </div>

                  {historyPeriod === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Début</label>
                        <input
                          type="date"
                          value={historyStartDate}
                          onChange={(e) => setHistoryStartDate(e.target.value)}
                          onBlur={() => {
                            if (historyStartDate && historyEndDate) {
                              fetchHistory('custom', historyStartDate, historyEndDate, selectedHistoryTenant);
                            }
                          }}
                          className="w-full p-1.5 bg-slate-50 rounded-lg text-[10px] font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Fin</label>
                        <input
                          type="date"
                          value={historyEndDate}
                          onChange={(e) => setHistoryEndDate(e.target.value)}
                          onBlur={() => {
                            if (historyStartDate && historyEndDate) {
                              fetchHistory('custom', historyStartDate, historyEndDate, selectedHistoryTenant);
                            }
                          }}
                          className="w-full p-1.5 bg-slate-50 rounded-lg text-[10px] font-bold outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {user.role === 'super_manager' && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() => {
                          setSelectedHistoryTenant('all');
                          fetchHistory(historyPeriod, historyStartDate, historyEndDate, 'all');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                          selectedHistoryTenant === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                        }`}
                      >
                        Toutes les entreprises
                      </button>
                      {tenants.map(tenant => (
                        <button
                          key={tenant.id}
                          onClick={() => {
                            setSelectedHistoryTenant(tenant.id);
                            fetchHistory(historyPeriod, historyStartDate, historyEndDate, tenant.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                            selectedHistoryTenant === tenant.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                          }`}
                        >
                          {tenant.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {user.role === 'manager' && sites.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() => {
                          setSelectedSiteId('all');
                          fetchHistory(historyPeriod, historyStartDate, historyEndDate, undefined, 'all');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                          selectedSiteId === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                        }`}
                      >
                        Tous les sites
                      </button>
                      {sites.map(site => (
                        <button
                          key={site.id}
                          onClick={() => {
                            setSelectedSiteId(site.id);
                            fetchHistory(historyPeriod, historyStartDate, historyEndDate, undefined, site.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                            selectedSiteId === site.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                          }`}
                        >
                          {site.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Journal Global</h3>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Total: {filteredHistoryData.filter((item: any) => item.type === 'transaction').length} véhicules</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.role === 'super_manager' && (
                    <button
                      onClick={() => {
                        setSelectedHistoryTenant('all');
                        setHistoryPeriod('all');
                        setHistoryStartDate('');
                        setHistoryEndDate('');
                        setSearchQuery('');
                        fetchHistory('all', '', '', 'all');
                      }}
                      className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:text-blue-600 transition-colors"
                      title="Réinitialiser"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredHistoryData.length > 0 ? (
                  filteredHistoryData.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'transaction') {
                          setSelectedTransaction(item);
                        }
                      }}
                      className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-blue-600'}`}>
                          {item.type === 'expense' ? <ArrowDownCircle className="w-5 h-5" /> : VEHICLE_ICONS[item.vehicle_type]}
                        </div>
                        <div>
                          {item.type === 'expense' ? (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-slate-900 leading-none">{item.description}</p>
                                <span className="text-[8px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded-md font-black uppercase tracking-tighter">
                                  Dépense
                                </span>
                                {user.role === 'super_manager' && (
                                  <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-black uppercase tracking-tighter">
                                    {item.tenant_name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                <span className="text-red-600/80">{item.category || 'Général'}</span>
                                <span className="w-1 h-1 bg-slate-100 rounded-full" />
                                <span className="text-slate-400">{item.cashier_name || 'Inconnu'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-slate-900 leading-none">{item.matricule}</p>
                                <span className="text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-black uppercase tracking-tighter">
                                  {item.brand || 'Inconnu'}
                                </span>
                                {user.role === 'super_manager' && (
                                  <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-black uppercase tracking-tighter">
                                    {item.tenant_name}
                                  </span>
                                )}
                                <span className="text-[8px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md font-black uppercase tracking-tighter">
                                  {VEHICLE_LABELS[item.vehicle_type] || item.vehicle_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                <span className="text-blue-600/80">{item.service_label}</span>
                                <span className="w-1 h-1 bg-slate-100 rounded-full" />
                                <span className="text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-sm font-black ${item.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                            {item.type === 'expense' ? '-' : ''}{(item.amount || item.price || 0).toLocaleString()} F
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {user.role === 'super_manager' ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTransactionData({ ...item });
                                setIsEditingTransaction(true);
                                fetchUsers(item.tenant_id);
                                fetchServices(item.tenant_id);
                                fetchVehicleTypes(item.tenant_id);
                              }}
                              className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmAction({
                                  title: 'Suppression',
                                  message: `Supprimer cette ${item.type === 'expense' ? 'dépense' : 'transaction'} ?`,
                                  confirmText: 'Supprimer',
                                  type: 'danger',
                                  onConfirm: () => {
                                    const url = item.type === 'expense' ? `/api/expenses/${item.id}` : `/api/transactions/${item.id}`;
                                    fetch(url, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${token}` }
                                    }).then(res => {
                                      if (res.ok) fetchHistory('all');
                                    });
                                  }
                                });
                              }}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          item.type === 'transaction' && <ChevronRight className="w-4 h-4 text-slate-200" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <HistoryIcon className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Aucun historique disponible</p>
                  </div>
                )}
              </div>
            </motion.main>
          )}

          {view === 'super_dashboard' && user.role === 'super_manager' && (
            <motion.main
              key="super_dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 p-4 space-y-6 overflow-y-auto custom-scrollbar pb-24"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900 tracking-tighter">Tableau de Bord Global</h2>
                  <button
                    onClick={() => exportToCSV(allTransactions, 'transactions_global')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100"
                  >
                    <Download className="w-3 h-3" /> Exporter CSV
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      onClick={() => setSelectedDashboardTenant('all')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        selectedDashboardTenant === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                      }`}
                    >
                      Toutes les entreprises
                    </button>
                    {tenants.map(tenant => (
                      <button
                        key={tenant.id}
                        onClick={() => setSelectedDashboardTenant(tenant.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                          selectedDashboardTenant === tenant.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                        }`}
                      >
                        {tenant.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    {(['today', '7days', '30days', 'custom'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setSuperPeriod(p)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          superPeriod === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {p === 'today' ? "Aujourd'hui" : p === '7days' ? '7 Jours' : p === '30days' ? '30 Jours' : 'Perso'}
                      </button>
                    ))}
                  </div>
                </div>

                {superPeriod === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Début</label>
                      <input
                        type="date"
                        value={superStartDate}
                        onChange={(e) => setSuperStartDate(e.target.value)}
                        className="w-full p-2 bg-slate-50 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fin</label>
                      <input
                        type="date"
                        value={superEndDate}
                        onChange={(e) => setSuperEndDate(e.target.value)}
                        className="w-full p-2 bg-slate-50 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                )}

                {selectedDashboardTenant !== 'all' && sites.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <button
                      onClick={() => setSelectedDashboardSite('all')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        selectedDashboardSite === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                      }`}
                    >
                      Tous les sites
                    </button>
                    {sites.map(site => (
                      <button
                        key={site.id}
                        onClick={() => setSelectedDashboardSite(site.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                          selectedDashboardSite === site.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'
                        }`}
                      >
                        {site.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chiffre d'Affaires</p>
                  <p className="text-2xl font-black text-blue-600">{globalStats.totalRevenue.toLocaleString()} F</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Véhicules</p>
                  <p className="text-2xl font-black text-slate-900">{globalStats.totalVehicles}</p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Évolution Globale</h3>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={globalStats.dailyHistory}
                      margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        label={{ value: 'Lavages', angle: -90, position: 'insideLeft', style: { fontSize: 10, fontWeight: 900, fill: '#94a3b8' } }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        tickFormatter={(value) => `${value.toLocaleString()}`}
                        label={{ value: 'Recette (F)', angle: 90, position: 'insideRight', style: { fontSize: 10, fontWeight: 900, fill: '#94a3b8' } }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Legend
                        wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="count"
                        name="Nombre de Lavages"
                        fill="#cbd5e1"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        animationDuration={1500}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="revenue"
                        name="Chiffre d'Affaires"
                        fill="#1d4ed8"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        animationDuration={1500}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.main>
          )}

          {view === 'super_create' && user.role === 'super_manager' && (
            <motion.main
              key="super_create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 p-4 space-y-8 overflow-y-auto custom-scrollbar pb-24"
            >
              {selectedTenantId ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-900">{tenants.find(t => t.id === selectedTenantId)?.name}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestion Entreprise</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTenantId(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Retour
                    </button>
                  </div>

                  {/* 1. Vehicle Types & Brands Management */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                        <Car className="w-3 h-3" /> Types de véhicules
                      </h3>
                      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nouveau type (ex: Camion)"
                            value={newVehicleTypeLabel}
                            onChange={(e) => setNewVehicleTypeLabel(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm"
                          />
                          <button
                            onClick={async () => {
                              if (!newVehicleTypeLabel) return;
                              const res = await fetch('/api/vehicle-types', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ tenant_id: selectedTenantId, label: newVehicleTypeLabel })
                              });
                              if (res.ok) {
                                setNewVehicleTypeLabel('');
                                fetchVehicleTypes(selectedTenantId!);
                                fetchServices(selectedTenantId!);
                              }
                            }}
                            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {vehicleTypes.map(vt => (
                            <div key={vt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-xs font-bold text-slate-700">{vt.label}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingVehicleType(vt);
                                    setEditValue(vt.label);
                                  }}
                                  className="text-slate-300 hover:text-blue-600 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Suppression',
                                      message: 'Supprimer ce type de véhicule ?',
                                      confirmText: 'Supprimer',
                                      type: 'danger',
                                      onConfirm: async () => {
                                        await fetch(`/api/vehicle-types/${vt.id}`, {
                                          method: 'DELETE',
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                        fetchVehicleTypes(selectedTenantId!);
                                        fetchServices(selectedTenantId!);
                                      }
                                    });
                                  }}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                        <Droplets className="w-3 h-3" /> Marques de véhicules
                      </h3>
                      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nouvelle marque (ex: Tesla)"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm"
                          />
                          <button
                            onClick={async () => {
                              if (!newBrandName) return;
                              const res = await fetch('/api/brands', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ tenant_id: selectedTenantId, name: newBrandName })
                              });
                              if (res.ok) {
                                setNewBrandName('');
                                fetchBrands(selectedTenantId!);
                              }
                            }}
                            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {brands.map(b => (
                            <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-xs font-bold text-slate-700">{b.name}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingBrand(b);
                                    setEditValue(b.name);
                                  }}
                                  className="text-slate-300 hover:text-blue-600 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Suppression',
                                      message: 'Supprimer cette marque ?',
                                      confirmText: 'Supprimer',
                                      type: 'danger',
                                      onConfirm: async () => {
                                        await fetch(`/api/brands/${b.id}`, {
                                          method: 'DELETE',
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                        fetchBrands(selectedTenantId!);
                                      }
                                    });
                                  }}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Prestations & Tarifs Management */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Droplets className="w-3 h-3" /> Prestations & Tarifs
                    </h3>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nouvelle prestation (ex: Vitrage)"
                          value={newServiceLabel}
                          onChange={(e) => setNewServiceLabel(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm"
                        />
                        <button
                          onClick={async () => {
                            if (!newServiceLabel) return;
                            const res = await fetch('/api/services/labels', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ tenant_id: selectedTenantId, label: newServiceLabel })
                            });
                            if (res.ok) {
                              setNewServiceLabel('');
                              fetchServices(selectedTenantId!);
                            }
                          }}
                          className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {Array.from(new Set(services.map(s => s.label))).map(label => (
                          <div key={label} className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{label}</h4>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => {
                                    const service = services.find(s => s.label === label);
                                    if (service) {
                                      setEditingService(service);
                                      setEditValue(service.label);
                                      setEditPrice(service.price);
                                    }
                                  }}
                                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
                                >
                                  Modifier
                                </button>
                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Suppression',
                                      message: `Supprimer la prestation ${label} ?`,
                                      confirmText: 'Supprimer',
                                      type: 'danger',
                                      onConfirm: async () => {
                                        await fetch('/api/services/labels', {
                                          method: 'DELETE',
                                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                          body: JSON.stringify({ tenant_id: selectedTenantId, label })
                                        });
                                        fetchServices(selectedTenantId!);
                                      }
                                    });
                                  }}
                                  className="text-[10px] font-black text-red-500 uppercase tracking-widest"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {services.filter(s => s.label === label).map(s => (
                                <div key={s.id} className={`flex items-center justify-between p-3 bg-slate-50 rounded-xl transition-opacity ${s.active === 0 ? 'opacity-50' : ''}`}>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{s.vehicle_type_label}</span>
                                    {s.active === 0 && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md font-black uppercase tracking-tighter">Inactif</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleServiceActive(s.id, selectedTenantId!)}
                                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                        s.active === 0
                                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      {s.active === 0 ? 'Activer' : 'Désactiver'}
                                    </button>
                                    <input
                                      type="number"
                                      defaultValue={s.price}
                                      onBlur={async (e) => {
                                        const price = parseInt(e.target.value);
                                        if (price === s.price) return;
                                        await fetch(`/api/services/${s.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                          body: JSON.stringify({ price })
                                        });
                                        fetchServices(selectedTenantId!);
                                      }}
                                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-black text-xs outline-none focus:border-blue-600"
                                    />
                                    <span className="text-[10px] font-black text-slate-300">F</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Sites Management */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <MapPin className="w-3 h-3" /> Lavages Auto (Sites)
                    </h3>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nom du lavage (ex: Brillo Cocody)"
                          value={newSiteName}
                          onChange={(e) => setNewSiteName(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm"
                        />
                        <button
                          onClick={async () => {
                            if (!newSiteName) return;
                            const res = await fetch('/api/sites', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ tenant_id: selectedTenantId, name: newSiteName })
                            });
                            if (res.ok) {
                              setNewSiteName('');
                              fetchSites(selectedTenantId!);
                            }
                          }}
                          className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sites.map(site => (
                          <div key={site.id} className="space-y-2">
                            <div className={`flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 transition-opacity ${site.active === 0 ? 'opacity-50' : ''}`}>
                              <div
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  if (expandedSiteId === site.id) {
                                    setExpandedSiteId(null);
                                  } else {
                                    setExpandedSiteId(site.id);
                                    fetchSiteUsers(site.id);
                                  }
                                }}
                              >
                                <span className="text-xs font-bold text-slate-700">{site.name}</span>
                                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${expandedSiteId === site.id ? 'rotate-180' : ''}`} />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    await fetch(`/api/sites/${site.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ active: site.active === 0 ? 1 : 0 })
                                    });
                                    fetchSites(selectedTenantId!);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                    site.active === 0
                                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {site.active === 0 ? 'Activer' : 'Désactiver'}
                                </button>
                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Suppression',
                                      message: 'Supprimer ce site ?',
                                      confirmText: 'Supprimer',
                                      type: 'danger',
                                      onConfirm: async () => {
                                        await fetch(`/api/sites/${site.id}`, {
                                          method: 'DELETE',
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                        fetchSites(selectedTenantId!);
                                      }
                                    });
                                  }}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {expandedSiteId === site.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl p-3 border border-slate-100 space-y-2 mb-2"
                              >
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <Users className="w-2.5 h-2.5" /> Personnel assigné
                                </p>
                                <div className="space-y-1">
                                  {siteUsers[site.id]?.length > 0 ? (
                                    siteUsers[site.id].map(u => (
                                      <div key={u.id} className="flex items-center justify-between text-[10px] py-1 border-b border-slate-50 last:border-0">
                                        <span className="font-bold text-slate-600">{u.username}</span>
                                        <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-black uppercase">{u.role}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[9px] text-slate-400 italic">Aucun personnel.</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. Users Management */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Users className="w-3 h-3" /> Utilisateurs & Laveurs
                    </h3>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const res = await fetch('/api/users', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                              tenant_id: selectedTenantId,
                              username: newEmployeeUsername,
                              password: newEmployeePassword,
                              role: newEmployeeRole,
                              first_name: newEmployeeFirstName,
                              last_name: newEmployeeLastName,
                              phone: newEmployeePhone,
                              site_id: selectedEmployeeSiteId || undefined
                            })
                          });
                          if (res.ok) {
                            setCreatedCredentials({ u: newEmployeeUsername, p: newEmployeePassword });
                            setShowUserSuccess(true);
                            setNewEmployeeUsername('');
                            setNewEmployeePassword('');
                            setNewEmployeeFirstName('');
                            setNewEmployeeLastName('');
                            setNewEmployeePhone('');
                            setSelectedEmployeeSiteId('');
                            fetchUsers(selectedTenantId!);
                            setTimeout(() => {
                              setShowUserSuccess(false);
                              setCreatedCredentials(null);
                            }, 10000);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nom"
                            value={newEmployeeLastName}
                            onChange={(e) => setNewEmployeeLastName(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Prénom"
                            value={newEmployeeFirstName}
                            onChange={(e) => setNewEmployeeFirstName(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Téléphone"
                            value={newEmployeePhone}
                            onChange={(e) => setNewEmployeePhone(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Nom d'utilisateur"
                            value={newEmployeeUsername}
                            onChange={(e) => setNewEmployeeUsername(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={newEmployeeRole}
                            onChange={(e: any) => setNewEmployeeRole(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                          >
                            <option value="cashier">Caissier</option>
                            {user?.role === 'super_manager' && <option value="manager">Manager</option>}
                            <option value="washer">Laveur</option>
                          </select>
                          <input
                            type="password"
                            placeholder="Mot de passe"
                            value={newEmployeePassword}
                            onChange={(e) => setNewEmployeePassword(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                          />
                        </div>
                        {(newEmployeeRole === 'cashier' || newEmployeeRole === 'washer') && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lavage auto (Site)</label>
                            <select
                              value={selectedEmployeeSiteId}
                              onChange={(e) => setSelectedEmployeeSiteId(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                              required
                            >
                              <option value="">Choisir un site...</option>
                              {sites.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">
                          Ajouter l'utilisateur
                        </button>
                      </form>

                      <div className="space-y-2">
                        {tenantUsers.map(u => (
                          <div key={u.id} className={`flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 transition-opacity ${u.active === 0 ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${u.role === 'manager' ? 'bg-blue-600' : u.role === 'cashier' ? 'bg-green-500' : 'bg-orange-400'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-black text-slate-900">{u.first_name} {u.last_name}</p>
                                  {u.active === 0 && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md font-black uppercase tracking-tighter">Inactif</span>}
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">
                                  {u.role} • {u.username} {u.phone && `• ${u.phone}`}
                                  {u.site_id && sites.find(s => s.id === u.site_id) && ` • ${sites.find(s => s.id === u.site_id)?.name}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {u.role !== 'washer' && (
                                <button
                                  onClick={async () => {
                                    const res = await fetch(`/api/admin/login-as/${u.id}`, {
                                      method: 'POST',
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      setToken(data.token);
                                      setUser(data.user);
                                      localStorage.setItem('wash_token', data.token);
                                      localStorage.setItem('wash_user', JSON.stringify(data.user));
                                      initialViewRef.current = false;
                                    }
                                  }}
                                  className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"
                                  title="Se connecter en tant que"
                                >
                                  <LogIn className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditFirstName(u.first_name || '');
                                  setEditLastName(u.last_name || '');
                                  setEditPhone(u.phone || '');
                                  setEditUsername(u.username || '');
                                  setEditPassword('');
                                  setEditRole(u.role);
                                  setEditSiteId(u.site_id || '');
                                }}
                                className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleUserActive(u.id, selectedTenantId!)}
                                className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                  u.active === 0
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {u.active === 0 ? 'Activer' : 'Désactiver'}
                              </button>
                              <button
                                onClick={() => {
                                  confirmAction({
                                    title: 'Suppression',
                                    message: 'Supprimer cet utilisateur ?',
                                    confirmText: 'Supprimer',
                                    type: 'danger',
                                    onConfirm: async () => {
                                      await fetch(`/api/users/${u.id}`, {
                                        method: 'DELETE',
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      fetchUsers(selectedTenantId!);
                                    }
                                  });
                                }}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. Évolution du Chiffre d'Affaires */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <TrendingUp className="w-3 h-3" /> Évolution du Chiffre d'Affaires
                    </h3>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={managerPeriod === 'today' ? revenueTrend : stats.dailyHistory} barGap={6}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                              tickFormatter={(str) => {
                                const date = new Date(str);
                                return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                              }}
                            />
                            <YAxis
                              yAxisId="left"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                              tickFormatter={(value) => `${value.toLocaleString()}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Legend
                              wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }}
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="count"
                              name="Lavages"
                              fill="#cbd5e1"
                              radius={[4, 4, 0, 0]}
                              barSize={12}
                              animationDuration={1500}
                            />
                            <Bar
                              yAxisId="right"
                              dataKey="revenue"
                              name="Recette"
                              fill="#1d4ed8"
                              radius={[4, 4, 0, 0]}
                              barSize={12}
                              animationDuration={1500}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Plus className="w-4 h-4" /> Créer une entreprise
                    </h3>
                    <form onSubmit={handleCreateTenant} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'entreprise</label>
                        <input
                          type="text"
                          value={newTenantName}
                          onChange={(e) => setNewTenantName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                          placeholder="Lavage Express"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manager</label>
                          <input
                            type="text"
                            value={newTenantManager}
                            onChange={(e) => setNewTenantManager(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                            placeholder="username"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                          <input
                            type="password"
                            value={newTenantPass}
                            onChange={(e) => setNewTenantPass(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                            placeholder="••••••"
                          />
                        </div>
                      </div>
                      <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100">
                        Générer l'espace
                      </button>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Building2 className="w-4 h-4" /> Entreprises existantes
                    </h3>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Rechercher une entreprise..."
                          value={tenantSearchQuery}
                          onChange={(e) => setTenantSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all"
                        />
                      </div>
                      <div className="grid gap-3">
                        {tenants.filter(t => t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase())).map(t => (
                          <div key={t.id} className={`bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm transition-opacity ${t.active === 0 ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${t.active === 0 ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-slate-900">{t.name}</p>
                                {t.active === 0 && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md font-black uppercase tracking-tighter">Inactif</span>}
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {t.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleTenantBrands(t.id, t.brands_enabled)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                t.brands_enabled === 1
                                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                              }`}
                              title={t.brands_enabled === 1 ? "Désactiver les marques" : "Activer les marques"}
                            >
                              {t.brands_enabled === 1 ? 'Marques ON' : 'Marques OFF'}
                            </button>
                            <button
                              onClick={() => toggleTenantExpenses(t.id, t.expenses_enabled)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                t.expenses_enabled !== 0
                                  ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                              }`}
                              title={t.expenses_enabled !== 0 ? "Désactiver les dépenses" : "Activer les dépenses"}
                            >
                              {t.expenses_enabled !== 0 ? 'Dépenses ON' : 'Dépenses OFF'}
                            </button>
                            <button
                              onClick={() => toggleTenantActive(t.id)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                t.active === 0
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {t.active === 0 ? 'Activer' : 'Désactiver'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingTenant(t);
                                setEditValue(t.name);
                              }}
                              className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTenantId(t.id);
                                fetchVehicleTypes(t.id);
                                fetchServices(t.id);
                                fetchUsers(t.id);
                                fetchStats(t.id);
                              }}
                              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                            >
                              Gérer
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmAction({
                                  title: '⚠️ ATTENTION',
                                  message: 'Supprimer cette entreprise effacera DÉFINITIVEMENT toutes ses transactions, ses tarifs et ses utilisateurs. Continuer ?',
                                  confirmText: 'Supprimer Définitivement',
                                  type: 'danger',
                                  onConfirm: async () => {
                                    const res = await fetch(`/api/admin/tenants/${t.id}`, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                      fetchTenants();
                                      fetchAllData();
                                    }
                                  }
                                });
                              }}
                              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.main>
        )}

          {(view === 'admin' && user.role === 'super_manager') && (
            <motion.main
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 p-4 space-y-8 overflow-y-auto custom-scrollbar"
            >
              {selectedTenantId ? (
                <div className="space-y-8 pb-20">
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-900">{tenants.find(t => t.id === selectedTenantId)?.name}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Espace Entreprise</p>
                      </div>
                    </div>
                    {user.role === 'super_manager' && (
                      <button
                        onClick={() => setSelectedTenantId(null)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Retour
                      </button>
                    )}
                  </div>

                  {/* 1. Vehicle Types & Brands Management */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                        <Car className="w-3 h-3" /> Types de véhicules
                      </h3>
                      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nouveau type (ex: Camion)"
                            value={newVehicleTypeLabel}
                            onChange={(e) => setNewVehicleTypeLabel(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm"
                          />
                          <button
                            onClick={async () => {
                              if (!newVehicleTypeLabel) return;
                              const res = await fetch('/api/vehicle-types', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ tenant_id: selectedTenantId, label: newVehicleTypeLabel })
                              });
                              if (res.ok) {
                                setNewVehicleTypeLabel('');
                                fetchVehicleTypes(selectedTenantId!);
                                fetchServices(selectedTenantId!);
                              }
                            }}
                            className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {vehicleTypes.map(vt => (
                            <div key={vt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-xs font-bold text-slate-700">{vt.label}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingVehicleType(vt);
                                    setEditValue(vt.label);
                                  }}
                                  className="text-slate-300 hover:text-blue-600 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Suppression',
                                      message: 'Supprimer ce type de véhicule ?',
                                      confirmText: 'Supprimer',
                                      type: 'danger',
                                      onConfirm: async () => {
                                        await fetch(`/api/vehicle-types/${vt.id}`, {
                                          method: 'DELETE',
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                        fetchVehicleTypes(selectedTenantId!);
                                        fetchServices(selectedTenantId!);
                                      }
                                    });
                                  }}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {user.role === 'super_manager' && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                          <Droplets className="w-3 h-3" /> Marques de véhicules
                        </h3>
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nouvelle marque (ex: Tesla)"
                              value={newBrandName}
                              onChange={(e) => setNewBrandName(e.target.value)}
                              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm"
                            />
                            <button
                              onClick={async () => {
                                if (!newBrandName) return;
                                const res = await fetch('/api/brands', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ tenant_id: selectedTenantId, name: newBrandName })
                                });
                                if (res.ok) {
                                  setNewBrandName('');
                                  fetchBrands(selectedTenantId!);
                                }
                              }}
                              className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {brands.map(b => (
                              <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-700">{b.name}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingBrand(b);
                                      setEditValue(b.name);
                                    }}
                                    className="text-slate-300 hover:text-blue-600 transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      confirmAction({
                                        title: 'Suppression',
                                        message: 'Supprimer cette marque ?',
                                        confirmText: 'Supprimer',
                                        type: 'danger',
                                        onConfirm: async () => {
                                          await fetch(`/api/brands/${b.id}`, {
                                            method: 'DELETE',
                                            headers: { Authorization: `Bearer ${token}` }
                                          });
                                          fetchBrands(selectedTenantId!);
                                        }
                                      });
                                    }}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Prestations & Tarifs Management */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Droplets className="w-3 h-3" /> Prestations & Tarifs
                    </h3>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nouvelle prestation (ex: Vitrage)"
                          value={newServiceLabel}
                          onChange={(e) => setNewServiceLabel(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-sm"
                        />
                        <button
                          onClick={async () => {
                            if (!newServiceLabel) return;
                            const res = await fetch('/api/services/labels', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ tenant_id: selectedTenantId, label: newServiceLabel })
                            });
                            if (res.ok) {
                              setNewServiceLabel('');
                              fetchServices(selectedTenantId!);
                            }
                          }}
                          className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {Array.from(new Set(services.map(s => s.label))).map(label => (
                          <div key={label} className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{label}</h4>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => {
                                    const service = services.find(s => s.label === label);
                                    if (service) {
                                      setEditingService(service);
                                      setEditValue(service.label);
                                      setEditPrice(service.price);
                                    }
                                  }}
                                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
                                >
                                  Modifier
                                </button>
                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Suppression',
                                      message: `Supprimer la prestation ${label} ?`,
                                      confirmText: 'Supprimer',
                                      type: 'danger',
                                      onConfirm: async () => {
                                        await fetch('/api/services/labels', {
                                          method: 'DELETE',
                                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                          body: JSON.stringify({ tenant_id: selectedTenantId, label })
                                        });
                                        fetchServices(selectedTenantId!);
                                      }
                                    });
                                  }}
                                  className="text-[10px] font-black text-red-500 uppercase tracking-widest"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {services.filter(s => s.label === label).map(s => (
                                <div key={s.id} className={`flex items-center justify-between p-3 bg-slate-50 rounded-xl transition-opacity ${s.active === 0 ? 'opacity-50' : ''}`}>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{s.vehicle_type_label}</span>
                                    {s.active === 0 && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md font-black uppercase tracking-tighter">Inactif</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleServiceActive(s.id, selectedTenantId!)}
                                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                        s.active === 0
                                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      {s.active === 0 ? 'Activer' : 'Désactiver'}
                                    </button>
                                    <input
                                      type="number"
                                      defaultValue={s.price}
                                      onBlur={async (e) => {
                                        const price = parseInt(e.target.value);
                                        if (price === s.price) return;
                                        await fetch(`/api/services/${s.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                          body: JSON.stringify({ price })
                                        });
                                        fetchServices(selectedTenantId!);
                                      }}
                                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-black text-xs outline-none focus:border-blue-600"
                                    />
                                    <span className="text-[10px] font-black text-slate-300">F</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Users Management */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <Users className="w-3 h-3" /> Utilisateurs & Laveurs
                    </h3>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const res = await fetch('/api/users', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                              tenant_id: selectedTenantId,
                              username: newEmployeeUsername,
                              password: newEmployeePassword,
                              role: newEmployeeRole,
                              first_name: newEmployeeFirstName,
                              last_name: newEmployeeLastName,
                              phone: newEmployeePhone
                            })
                          });
                          if (res.ok) {
                            setNewEmployeeUsername('');
                            setNewEmployeePassword('');
                            setNewEmployeeFirstName('');
                            setNewEmployeeLastName('');
                            setNewEmployeePhone('');
                            fetchUsers(selectedTenantId!);
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nom"
                            value={newEmployeeLastName}
                            onChange={(e) => setNewEmployeeLastName(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Prénom"
                            value={newEmployeeFirstName}
                            onChange={(e) => setNewEmployeeFirstName(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Téléphone"
                            value={newEmployeePhone}
                            onChange={(e) => setNewEmployeePhone(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Nom d'utilisateur"
                            value={newEmployeeUsername}
                            onChange={(e) => setNewEmployeeUsername(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={newEmployeeRole}
                            onChange={(e: any) => setNewEmployeeRole(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                          >
                            <option value="cashier">Caissier</option>
                            {user?.role === 'super_manager' && <option value="manager">Manager</option>}
                            <option value="washer">Laveur</option>
                          </select>
                          <input
                            type="password"
                            placeholder="Mot de passe"
                            value={newEmployeePassword}
                            onChange={(e) => setNewEmployeePassword(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-blue-600 focus:bg-white transition-all"
                          />
                        </div>
                        <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">
                          Ajouter l'utilisateur
                        </button>
                      </form>

                      <div className="space-y-2">
                        {tenantUsers.map(u => (
                          <div key={u.id} className={`flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 transition-opacity ${u.active === 0 ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${u.role === 'manager' ? 'bg-blue-600' : u.role === 'cashier' ? 'bg-green-500' : 'bg-orange-400'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-black text-slate-900">{u.first_name} {u.last_name}</p>
                                  {u.active === 0 && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md font-black uppercase tracking-tighter">Inactif</span>}
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">
                                  {u.role} • {u.username} {u.phone && `• ${u.phone}`}
                                  {u.site_id && sites.find(s => s.id === u.site_id) && ` • ${sites.find(s => s.id === u.site_id)?.name}`}
                                </p>
                              </div>
                            </div>
                            {/* General User List (Manager/Admin) */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditFirstName(u.first_name || '');
                                  setEditLastName(u.last_name || '');
                                  setEditPhone(u.phone || '');
                                  setEditUsername(u.username || '');
                                  setEditPassword('');
                                  setEditRole(u.role);
                                  setEditSiteId(u.site_id || '');
                                }}
                                className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleUserActive(u.id, selectedTenantId!)}
                                className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                  u.active === 0
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {u.active === 0 ? 'Activer' : 'Désactiver'}
                              </button>
                              {(u.role !== 'manager' || user.role === 'super_manager') && (
                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Suppression',
                                      message: 'Supprimer cet utilisateur ?',
                                      confirmText: 'Supprimer',
                                      type: 'danger',
                                      onConfirm: async () => {
                                        await fetch(`/api/users/${u.id}`, {
                                          method: 'DELETE',
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                        fetchUsers(selectedTenantId!);
                                      }
                                    });
                                  }}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. Évolution du Chiffre d'Affaires */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                      <TrendingUp className="w-3 h-3" /> Évolution du Chiffre d'Affaires
                    </h3>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={managerPeriod === 'today' ? revenueTrend : stats.dailyHistory} barGap={6}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                              tickFormatter={(str) => {
                                const date = new Date(str);
                                return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                              }}
                            />
                            <YAxis
                              yAxisId="left"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                              tickFormatter={(value) => `${value.toLocaleString()}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Legend
                              wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }}
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="count"
                              name="Lavages"
                              fill="#cbd5e1"
                              radius={[4, 4, 0, 0]}
                              barSize={12}
                              animationDuration={1500}
                            />
                            <Bar
                              yAxisId="right"
                              dataKey="revenue"
                              name="Recette"
                              fill="#1d4ed8"
                              radius={[4, 4, 0, 0]}
                              barSize={12}
                              animationDuration={1500}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Entreprises actives
                  </h3>
                  <div className="grid gap-3">
                    {tenants.map(t => (
                      <div key={t.id} className={`bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm transition-opacity ${t.active === 0 ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${t.active === 0 ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-slate-900">{t.name}</p>
                              {t.active === 0 && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md font-black uppercase tracking-tighter">Inactif</span>}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {t.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTenantBrands(t.id, t.brands_enabled)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              t.brands_enabled === 1
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={t.brands_enabled === 1 ? "Désactiver les marques" : "Activer les marques"}
                          >
                            {t.brands_enabled === 1 ? 'Marques ON' : 'Marques OFF'}
                          </button>
                          <button
                            onClick={() => toggleTenantExpenses(t.id, t.expenses_enabled)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              t.expenses_enabled !== 0
                                ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={t.expenses_enabled !== 0 ? "Désactiver les dépenses" : "Activer les dépenses"}
                          >
                            {t.expenses_enabled !== 0 ? 'Dépenses ON' : 'Dépenses OFF'}
                          </button>
                          <button
                            onClick={() => toggleTenantActive(t.id)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              t.active === 0
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {t.active === 0 ? 'Activer' : 'Désactiver'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingTenant(t);
                              setEditValue(t.name);
                            }}
                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTenantId(t.id);
                              fetchVehicleTypes(t.id);
                              fetchServices(t.id);
                              fetchUsers(t.id);
                              fetchStats(t.id);
                            }}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                          >
                            Gérer
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmAction({
                                title: '⚠️ ATTENTION',
                                message: 'Supprimer cette entreprise effacera DÉFINITIVEMENT toutes ses transactions, ses tarifs et ses utilisateurs. Continuer ?',
                                confirmText: 'Supprimer Définitivement',
                                type: 'danger',
                                onConfirm: async () => {
                                  const res = await fetch(`/api/admin/tenants/${t.id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (res.ok) {
                                    fetchTenants();
                                    fetchAllData();
                                  }
                                }
                              });
                            }}
                            className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.main>
          )}

          {view === 'stats' && user.role === 'manager' && (
            <motion.main
              key="stats"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col p-4 gap-6 overflow-y-auto pb-24"
            >
              {/* Filtre de période et Caissier */}
              <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {[
                    { id: 'today', label: 'Aujourd\'hui' },
                    { id: '7days', label: '7 Jours' },
                    { id: '30days', label: '30 Jours' },
                    { id: 'custom', label: 'Personnalisé' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setManagerPeriod(p.id as any)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        managerPeriod === p.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrer par Caissier</label>
                    <select
                      value={selectedCashierId}
                      onChange={(e) => setSelectedCashierId(e.target.value)}
                      className="w-full bg-transparent text-xs font-black uppercase tracking-tighter outline-none"
                    >
                      <option value="all">Tous les Caissiers</option>
                      {tenantUsers.filter(u => u.role === 'cashier').map(u => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {sites.length > 0 && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrer par Lavage (Site)</label>
                      <select
                        value={selectedSiteId}
                        onChange={(e) => setSelectedSiteId(e.target.value)}
                        className="w-full bg-transparent text-xs font-black uppercase tracking-tighter outline-none"
                      >
                        <option value="all">Tous les sites</option>
                        {sites.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {managerPeriod === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Début</label>
                      <input
                        type="date"
                        value={managerStartDate}
                        onChange={(e) => setManagerStartDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fin</label>
                      <input
                        type="date"
                        value={managerEndDate}
                        onChange={(e) => setManagerEndDate(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 text-center">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Recette</p>
                  <p className="text-sm font-black text-blue-600">{stats.periodRevenue.toLocaleString()} F</p>
                </div>
                <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 text-center">
                  <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-900">
                    <Car className="w-4 h-4" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lavage</p>
                  <p className="text-sm font-black text-slate-900">{stats.totalTransactions}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 text-center">
                  <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-600">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Dépenses</p>
                  <p className="text-sm font-black text-red-600">{stats.periodExpenses.toLocaleString()} F</p>
                </div>
                <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 text-center">
                  <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Net</p>
                  <p className="text-sm font-black text-green-600">{(stats.periodRevenue - stats.periodExpenses).toLocaleString()} F</p>
                </div>
              </div>

              {/* Évolution du CA Chart */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Évolution du Chiffre d'Affaires
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={managerPeriod === 'today' ? revenueTrend : stats.dailyHistory}
                      margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        label={{ value: 'Lavages', angle: -90, position: 'insideLeft', style: { fontSize: 10, fontWeight: 900, fill: '#94a3b8' } }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        tickFormatter={(value) => `${value.toLocaleString()}`}
                        label={{ value: 'Recette (F)', angle: 90, position: 'insideRight', style: { fontSize: 10, fontWeight: 900, fill: '#94a3b8' } }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Legend
                        wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="count"
                        name="Nombre de Lavages"
                        fill="#cbd5e1"
                        radius={[4, 4, 0, 0]}
                        barSize={15}
                        animationDuration={1500}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="revenue"
                        name="Chiffre d'Affaires"
                        fill="#1d4ed8"
                        radius={[4, 4, 0, 0]}
                        barSize={15}
                        animationDuration={1500}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Liste des Dépenses (Visuel uniquement pour le manager) */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Historique des Dépenses
                </h3>
                <div className="space-y-2">
                  {expenses.length > 0 ? (
                    expenses.map((e) => (
                      <div key={e.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                            <ArrowDownCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{e.description}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                              {e.category || 'Général'} • {e.cashier_name || 'Inconnu'} • {new Date(e.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-600">-{e.amount.toLocaleString()} F</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune dépense enregistrée</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.main>
          )}

          {view === 'personnel' && user.role === 'manager' && (
            <motion.main
              key="personnel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 p-4 space-y-6 overflow-y-auto custom-scrollbar pb-24"
            >
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                <button
                  onClick={() => setPersonnelTab('users')}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    personnelTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Personnel
                </button>
                <button
                  onClick={() => setPersonnelTab('sites')}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    personnelTab === 'sites' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  Sites (Lavage)
                </button>
              </div>

              {personnelTab === 'sites' ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {user.role === 'super_manager' && (
                      <>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Ajouter un site
                        </h3>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!newSiteName) return;
                            const res = await fetch('/api/sites', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ name: newSiteName, tenant_id: user?.organization_id })
                            });
                            if (res.ok) {
                              setNewSiteName('');
                              fetchSites();
                            }
                          }}
                          className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du site</label>
                            <input
                              type="text"
                              value={newSiteName}
                              onChange={(e) => setNewSiteName(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                              placeholder="Ex: Lavage Adjamé"
                              required
                            />
                          </div>
                          <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100">
                            Ajouter le site
                          </button>
                        </form>
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Vos Sites
                    </h3>
                    <div className="grid gap-3">
                      {sites.map(site => (
                        <div key={site.id} className="space-y-2">
                          <div className={`bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm transition-opacity ${site.active === 0 ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${site.active === 0 ? 'bg-slate-50 text-slate-300' : 'bg-blue-50 text-slate-400'}`}>
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div
                                className="cursor-pointer"
                                onClick={() => {
                                  if (expandedSiteId === site.id) {
                                    setExpandedSiteId(null);
                                  } else {
                                    setExpandedSiteId(site.id);
                                    fetchSiteUsers(site.id);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black text-slate-900">{site.name}</p>
                                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${expandedSiteId === site.id ? 'rotate-180' : ''}`} />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {site.id}</p>
                              </div>
                            </div>
                            {user.role === 'super_manager' && (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={async () => {
                                    const res = await fetch(`/api/sites/${site.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ active: site.active === 1 ? 0 : 1 })
                                    });
                                    if (res.ok) fetchSites();
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                    site.active === 0
                                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {site.active === 0 ? 'Activer' : 'Désactiver'}
                                </button>
                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Suppression',
                                      message: 'Supprimer ce site ?',
                                      confirmText: 'Supprimer',
                                      type: 'danger',
                                      onConfirm: async () => {
                                        const res = await fetch(`/api/sites/${site.id}`, {
                                          method: 'DELETE',
                                          headers: { Authorization: `Bearer ${token}` }
                                        });
                                        if (res.ok) fetchSites();
                                      }
                                    });
                                  }}
                                  className="p-1 text-slate-200 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {expandedSiteId === site.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 ml-4 space-y-3"
                            >
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-3 h-3" /> Personnel assigné
                              </p>
                              <div className="space-y-2">
                                {siteUsers[site.id]?.length > 0 ? (
                                  siteUsers[site.id].map(u => (
                                    <div key={u.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-white shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${u.role === 'manager' ? 'bg-blue-600' : 'bg-green-500'}`} />
                                        <p className="text-[11px] font-black text-slate-700">{u.first_name} {u.last_name} <span className="text-[9px] text-slate-400 font-bold ml-1">({u.username})</span></p>
                                      </div>
                                      <p className="text-[9px] font-black uppercase text-slate-400">{u.role}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic">Aucun personnel assigné à ce site.</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Ajouter du personnel
                    </h3>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const res = await fetch('/api/users', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({
                            username: newEmployeeUsername,
                            password: newEmployeePassword,
                            role: newEmployeeRole,
                            first_name: newEmployeeFirstName,
                            last_name: newEmployeeLastName,
                            phone: newEmployeePhone,
                            site_id: selectedEmployeeSiteId
                          })
                        });
                        if (res.ok) {
                          setCreatedCredentials({ u: newEmployeeUsername, p: newEmployeePassword });
                          setShowUserSuccess(true);
                          setNewEmployeeUsername('');
                          setNewEmployeePassword('');
                          setNewEmployeeFirstName('');
                          setNewEmployeeLastName('');
                          setNewEmployeePhone('');
                          fetchUsers();
                          setTimeout(() => {
                            setShowUserSuccess(false);
                            setCreatedCredentials(null);
                          }, 10000);
                        }
                      }}
                      className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</label>
                          <input
                            type="text"
                            value={newEmployeeLastName}
                            onChange={(e) => setNewEmployeeLastName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prénom</label>
                          <input
                            type="text"
                            value={newEmployeeFirstName}
                            onChange={(e) => setNewEmployeeFirstName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
                          <input
                            type="text"
                            value={newEmployeePhone}
                            onChange={(e) => setNewEmployeePhone(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom d'utilisateur</label>
                          <input
                            type="text"
                            value={newEmployeeUsername}
                            onChange={(e) => setNewEmployeeUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rôle</label>
                          <select
                            value={newEmployeeRole}
                            onChange={(e: any) => setNewEmployeeRole(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold appearance-none"
                          >
                            <option value="cashier">Caissier</option>
                            {user?.role === 'super_manager' && <option value="manager">Manager</option>}
                            <option value="washer">Laveur</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                          <input
                            type="password"
                            value={newEmployeePassword}
                            onChange={(e) => setNewEmployeePassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold"
                            placeholder="Facultatif pour laveur"
                          />
                        </div>
                      </div>
                      {(newEmployeeRole === 'cashier' || newEmployeeRole === 'washer') && sites.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigner à un site</label>
                          <select
                            value={selectedEmployeeSiteId}
                            onChange={(e) => setSelectedEmployeeSiteId(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-600 font-bold appearance-none"
                          >
                            <option value="">Aucun site (Accès global)</option>
                            {sites.map(site => (
                              <option key={site.id} value={site.id}>{site.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100">
                        Enregistrer
                      </button>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4" /> Équipe
                    </h3>
                    <div className="grid gap-3">
                      {tenantUsers.map(u => (
                        <div key={u.id} className={`bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm transition-opacity ${u.active === 0 ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${u.active === 0 ? 'bg-slate-50 text-slate-300' : 'bg-blue-50 text-slate-400'}`}>
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-slate-900">{u.first_name} {u.last_name}</p>
                                {u.active === 0 && <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md font-black uppercase tracking-tighter">Inactif</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{u.role} • {u.username}</p>
                                {u.phone && <p className="text-[10px] text-slate-400 font-bold">• {u.phone}</p>}
                                {u.site_id && (
                                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter ml-1">
                                    • {sites.find(s => s.id === u.site_id)?.name || 'Site inconnu'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {user.role === 'super_manager' && u.role !== 'washer' && (
                              <button
                                onClick={async () => {
                                  const res = await fetch(`/api/admin/login-as/${u.id}`, {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (res.ok) {
                                    const data = await res.json();
                                    setToken(data.token);
                                    setUser(data.user);
                                    localStorage.setItem('wash_token', data.token);
                                    localStorage.setItem('wash_user', JSON.stringify(data.user));
                                    initialViewRef.current = false;
                                  }
                                }}
                                className="p-2 text-slate-300 hover:text-emerald-600 transition-colors"
                                title="Se connecter en tant que"
                              >
                                <LogIn className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditFirstName(u.first_name || '');
                                setEditLastName(u.last_name || '');
                                setEditPhone(u.phone || '');
                                setEditUsername(u.username || '');
                                setEditPassword('');
                                setEditRole(u.role);
                                setEditSiteId(u.site_id || '');
                              }}
                              className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleUserActive(u.id)}
                              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                u.active === 0
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {u.active === 0 ? 'Activer' : 'Désactiver'}
                            </button>
                            <div className={`w-2 h-2 rounded-full ${u.role === 'manager' ? 'bg-blue-600' : 'bg-green-500'}`} />
                            {(user.role === 'manager' || user.role === 'super_manager') && (u.role !== 'manager' || user.role === 'super_manager') && (
                              <button
                                onClick={() => {
                                  confirmAction({
                                    title: 'Suppression',
                                    message: 'Supprimer cet employé ?',
                                    confirmText: 'Supprimer',
                                    type: 'danger',
                                    onConfirm: async () => {
                                      const res = await fetch(`/api/users/${u.id}`, {
                                        method: 'DELETE',
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      if (res.ok) fetchUsers();
                                    }
                                  });
                                }}
                                className="p-1 text-slate-200 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation & Action Bar */}
      <footer className="bg-white border-t border-slate-100 p-4 pb-6 shadow-[0_-4px_30px_rgba(0,0,0,0.03)]">

        {/* View Switcher */}
        <div className="flex bg-slate-50 p-1 rounded-xl mb-4">
          {user.role === 'cashier' && (
            <button
              onClick={() => setView('pos')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'pos' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-3 h-3" />
              Caisse
            </button>
          )}
          {user.role === 'cashier' && (
            <button
              onClick={() => setView('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
              }`}
            >
              <Clock className="w-3 h-3" />
              Aujourd'hui
            </button>
          )}
          {(user.role === 'manager' || user.role === 'super_manager') && (
            <button
              onClick={() => setView('global_history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'global_history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
              }`}
            >
              <HistoryIcon className="w-3 h-3" />
              Journal Global
            </button>
          )}
          {user.role === 'manager' && (
            <>
              <button
                onClick={() => setView('stats')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === 'stats' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                Stats
              </button>
              <button
                onClick={() => setView('personnel')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === 'personnel' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                <Users className="w-3 h-3" />
                Personnel
              </button>
            </>
          )}
          {user.role === 'super_manager' && (
            <>
              <button
                onClick={() => setView('super_dashboard')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === 'super_dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  setSelectedTenantId(null);
                  setView('super_create');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === 'super_create' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                <Building2 className="w-3 h-3" />
                Gestion
              </button>
            </>
          )}
        </div>

        {view === 'pos' && user.role !== 'manager' && user.role !== 'super_manager' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Total à payer</p>
                <div className="flex items-center gap-1 text-blue-600">
                  <Banknote className="w-3 h-3" />
                  <span className="text-[10px] font-bold">Espèces</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black tracking-tighter text-slate-900">
                  {currentPrice.toLocaleString()} <span className="text-sm font-bold text-slate-400">FCFA</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleValidate}
              disabled={showSuccess}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                showSuccess
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 text-white active:scale-95 shadow-xl shadow-blue-100'
              }`}
            >
              {showSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Validé
                </>
              ) : (
                'Enregistrer Lavage'
              )}
            </button>
          </>
        )}
      </footer>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTransaction(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-blue-600 p-8 text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {VEHICLE_ICONS[selectedTransaction.vehicle_type]}
                </div>
                <h2 className="text-2xl font-black tracking-tighter mb-1">{selectedTransaction.matricule}</h2>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Détails du Lavage</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Info className="w-3 h-3" /> Prestation
                    </p>
                    <p className="text-sm font-bold text-slate-900">{selectedTransaction.service_label}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Banknote className="w-3 h-3" /> Montant
                    </p>
                    <p className="text-sm font-bold text-blue-600">{selectedTransaction.price.toLocaleString()} FCFA</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Client
                    </p>
                    <p className="text-sm font-bold text-slate-900">{selectedTransaction.phone || 'Non renseigné'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(selectedTransaction.timestamp).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <User className="w-3 h-3" /> Laveur
                    </p>
                    <p className="text-sm font-bold text-slate-900">{selectedTransaction.washer_name || 'Inconnu'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Info className="w-3 h-3" /> Caissier
                    </p>
                    <p className="text-sm font-bold text-slate-900">{selectedTransaction.cashier_name || 'Inconnu'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase">
                    <span>Heure de passage</span>
                    <span>{new Date(selectedTransaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modals */}
      <AnimatePresence>
        {(editingTenant || editingBrand || editingService || editingVehicleType || editingUser) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingTenant(null);
                setEditingBrand(null);
                setEditingService(null);
                setEditingVehicleType(null);
                setEditingUser(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8"
            >
              <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-6 uppercase italic">
                Modifier {editingTenant ? 'Entreprise' : editingBrand ? 'Marque' : editingService ? 'Service' : editingUser ? 'Utilisateur' : 'Type'}
              </h3>

              <div className="space-y-4">
                {editingUser ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</label>
                        <input
                          type="text"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prénom</label>
                        <input
                          type="text"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom d'utilisateur</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Réinitialiser le mot de passe</label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Nouveau mot de passe (laisser vide si inchangé)"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rôle</label>
                        <select
                          value={editRole}
                          onChange={(e: any) => setEditRole(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                        >
                          <option value="cashier">Caissier</option>
                          <option value="manager">Manager</option>
                          <option value="washer">Laveur</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Site affecté</label>
                        <select
                          value={editSiteId}
                          onChange={(e) => setEditSiteId(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                          disabled={editRole === 'manager'}
                        >
                          <option value="">Aucun site</option>
                          {sites.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Libellé / Nom</label>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                      />
                    </div>

                    {editingService && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix (FCFA)</label>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 transition-colors text-slate-900 font-bold"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setEditingTenant(null);
                      setEditingBrand(null);
                      setEditingService(null);
                      setEditingVehicleType(null);
                      setEditingUser(null);
                    }}
                    className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      if (editingTenant) handleUpdateTenant();
                      else if (editingBrand) handleUpdateBrand();
                      else if (editingService) {
                        handleUpdateService();
                        handleUpdatePrice(editingService.id, editPrice);
                      }
                      else if (editingVehicleType) handleUpdateVehicleType();
                      else if (editingUser) {
                        const res = await fetch(`/api/users/${editingUser.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({
                            first_name: editFirstName,
                            last_name: editLastName,
                            phone: editPhone,
                            username: editUsername,
                            password: editPassword || undefined,
                            role: editRole,
                            site_id: editRole === 'manager' ? null : (editSiteId || null)
                          })
                        });
                        if (res.ok) {
                          setEditingUser(null);
                          setEditFirstName('');
                          setEditLastName('');
                          setEditPhone('');
                          setEditUsername('');
                          setEditPassword('');
                          fetchUsers(selectedTenantId || undefined);
                        }
                      }
                    }}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Edit Modal */}
      <AnimatePresence>
        {isEditingTransaction && editTransactionData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Modifier Lavage</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {editTransactionData.id}</p>
                  </div>
                  <button
                    onClick={() => setIsEditingTransaction(false)}
                    className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Matricule</label>
                      <input
                        type="text"
                        value={editTransactionData.matricule}
                        onChange={(e) => setEditTransactionData({ ...editTransactionData, matricule: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
                      <input
                        type="text"
                        value={editTransactionData.phone || ''}
                        onChange={(e) => setEditTransactionData({ ...editTransactionData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Véhicule</label>
                      <select
                        value={editTransactionData.vehicle_type}
                        onChange={(e) => {
                          const newVt = e.target.value;
                          const vt = vehicleTypes.find(v => v.name === newVt);
                          const service = services.find(s => s.vehicle_type_id === vt?.id && s.label === editTransactionData.service_label);
                          setEditTransactionData({
                            ...editTransactionData,
                            vehicle_type: newVt,
                            price: service ? service.price : editTransactionData.price
                          });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm"
                      >
                        {vehicleTypes.map(vt => (
                          <option key={vt.id} value={vt.name}>{vt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Service</label>
                      <select
                        value={editTransactionData.service_label}
                        onChange={(e) => {
                          const newLabel = e.target.value;
                          const vt = vehicleTypes.find(v => v.name === editTransactionData.vehicle_type);
                          const service = services.find(s => s.vehicle_type_id === vt?.id && s.label === newLabel);
                          setEditTransactionData({
                            ...editTransactionData,
                            service_label: newLabel,
                            price: service ? service.price : editTransactionData.price
                          });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm"
                      >
                        {Array.from(new Set(services.map(s => s.label))).map(label => (
                          <option key={label} value={label}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Marque</label>
                      <input
                        type="text"
                        value={editTransactionData.brand || ''}
                        onChange={(e) => setEditTransactionData({ ...editTransactionData, brand: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix (F)</label>
                      <input
                        type="number"
                        value={editTransactionData.price}
                        onChange={(e) => setEditTransactionData({ ...editTransactionData, price: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Laveur</label>
                    <select
                      value={editTransactionData.washer_id || ''}
                      onChange={(e) => setEditTransactionData({ ...editTransactionData, washer_id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-sm"
                    >
                      <option value="">Sélectionner un laveur</option>
                      {tenantUsers.filter(u => u.role === 'washer').map(u => (
                        <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsEditingTransaction(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/admin/transactions/${editTransactionData.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(editTransactionData)
                      });
                      if (res.ok) {
                        setIsEditingTransaction(false);
                        fetchHistory(historyPeriod, historyStartDate, historyEndDate, selectedHistoryTenant);
                        fetchAllData();
                      }
                    }}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-600/90 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          >
            <motion.div
              initial={{ scale: 0.5, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">Lavage validé</p>
                <p className="text-sm font-medium text-slate-400">Transaction ajoutée au journal</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && confirmModalConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xs bg-white rounded-[2rem] shadow-2xl overflow-hidden p-6 text-center"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                confirmModalConfig.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {confirmModalConfig.type === 'danger' ? <Trash2 className="w-6 h-6" /> : <Info className="w-6 h-6" />}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{confirmModalConfig.title}</h3>
              <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed">
                {confirmModalConfig.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  {confirmModalConfig.cancelText || 'Annuler'}
                </button>
                <button
                  onClick={() => {
                    confirmModalConfig.onConfirm();
                    setShowConfirmModal(false);
                  }}
                  className={`flex-1 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                    confirmModalConfig.type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-100'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                  }`}
                >
                  {confirmModalConfig.confirmText || 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
