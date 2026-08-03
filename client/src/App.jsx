import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "./api";
import FinancialChatbot from "./components/FinancialChatbot";

const userMenu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "transactions", label: "Transactions", icon: "transactions" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "loans", label: "Loans & EMI", icon: "loans" },
  { id: "chatbot", label: "Chatbot Assistant", icon: "chat" },
  { id: "reports", label: "Reports", icon: "reports" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "logout", label: "Logout", icon: "logout" },
];

const adminMenu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "users", label: "User Management", icon: "users" },
  { id: "monitor", label: "Transactions Monitor", icon: "transactions" },
  { id: "activity", label: "Activity Logs", icon: "activity" },
  { id: "system-reports", label: "System Reports", icon: "reports" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "backup", label: "Backup & Restore", icon: "shield" },
  { id: "audit", label: "Audit Trail", icon: "audit" },
  { id: "logout", label: "Logout", icon: "logout" },
];

const categoryOptions = [
  "Salary",
  "Housing",
  "Food",
  "Utilities",
  "Lifestyle",
  "Investment",
  "Freelance",
  "Bills",
  "Transport",
];

const chartColors = ["#2f74c8", "#f0543d", "#1d9850", "#7d58c2", "#a7b1c4", "#f3b32d"];

const quickActions = [
  { title: "Send Money", icon: "send", tint: "green", page: "transactions", patch: { type: "expense", category: "Bills" } },
  { title: "Pay Bills", icon: "bill", tint: "blue", page: "transactions", patch: { type: "expense", category: "Bills" } },
  { title: "View Reports", icon: "reports", tint: "violet", page: "reports" },
  { title: "EMI Calculator", icon: "calculator", tint: "orange", page: "loans" },
];

const userHealthItems = [
  { label: "Cash Flow Status", key: "balanceState", icon: "wallet", accent: "green" },
  { label: "Savings Rate", key: "savingsRate", icon: "trend", accent: "orange" },
  { label: "Expense Control", key: "expenseControl", icon: "target", accent: "blue" },
  { label: "Loan Readiness", key: "loanState", icon: "shield", accent: "violet" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

const formatPercentage = (value) => `${Number(value || 0).toFixed(1)}%`;

const formatDateShort = (value) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(value));

const formatDateLong = (value) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

const downloadFile = (filename, contents, mimeType = "text/plain;charset=utf-8") => {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function Icon({ name, className = "" }) {
  const icons = {
    dashboard: <path d="M4 12.5 12 5l8 7.5v6a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z" />,
    transactions: <path d="M4 7h4m4 0h8M4 12h8m4 0h4M4 17h6m4 0h6M3 7h.01M3 12h.01M3 17h.01" />,
    analytics: <path d="M5 19V9m7 10V5m7 14v-7M3 19h18" />,
    loans: <path d="M6 4h12a1 1 0 0 1 1 1v14l-4-2-3 2-3-2-4 2V5a1 1 0 0 1 1-1zm3 4h6m-6 4h6" />,
    chat: <path d="M6 17.5 4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6zm3-7h6m-6 4h4" />,
    reports: <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm6 1v5h5M9 13h6M9 17h4" />,
    settings: <path d="m12 3 1.3 2.7 3 .4-2.1 2.1.5 3-2.7-1.4-2.7 1.4.5-3L7.7 6.1l3-.4L12 3zm0 7.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />,
    logout: <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M14 16l4-4-4-4M8 12h10" />,
    users: <path d="M8.5 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm7 2a3 3 0 1 0-2.9-3.8M4 20a4.5 4.5 0 0 1 9 0m2 0a4 4 0 0 1 5 0" />,
    activity: <path d="M4 13h3l2-5 4 10 2-5h5" />,
    bell: <path d="M12 4a4 4 0 0 1 4 4v2.5c0 1 .4 2 .9 2.9l.6 1.1H6.5l.6-1.1c.5-.9.9-1.9.9-2.9V8a4 4 0 0 1 4-4zm-2 13a2 2 0 1 0 4 0" />,
    shield: <path d="M12 3 5 6v5c0 5 3.4 8.2 7 10 3.6-1.8 7-5 7-10V6l-7-3zm0 5v8m-3-4h6" />,
    audit: <path d="M10 4h4m-7 4h10M7 12h10M7 16h6M5 4h.01M5 8h.01M5 12h.01M5 16h.01" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    sun: <path d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />,
    trend: <path d="m5 16 4-4 3 3 6-7M14 8h4v4" />,
    wallet: <path d="M4 8a2 2 0 0 1 2-2h10l4 3v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8zm11 4h3" />,
    target: <path d="M12 5v3m0 8v3m7-7h-3M8 12H5m10.5-4.5-2.1 2.1m0 4.8 2.1 2.1m-6.9-6.9L6.5 7.5m0 9 2.1-2.1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
    send: <path d="M4 12 20 4l-4 16-4.5-6L4 12zm7.5 2L20 4" />,
    bill: <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3zm3 5h4m-4 4h4m-4 4h4" />,
    calculator: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 3h6v3H9V6zm0 6h2m4 0h-2m-4 4h2m4 0h-2" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0" />,
    eye: <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12zm9.5 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
    email: <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0 1 8 6 8-6" />,
    lock: <path d="M8 10V8a4 4 0 1 1 8 0v2m-9 0h10a1 1 0 0 1 1 1v7H6v-7a1 1 0 0 1 1-1z" />,
    bank: <path d="M3 9h18M5 9V6m4 3V6m4 3V6m4 3V6M4 19h16M6 10v7m12-7v7m-8-7v7m-4-7v7M12 3l9 3H3l9-3z" />,
    admin: <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 10.7-5.9l3.3-1.1v3l2 2-2 2-2-1-1 1A7 7 0 0 1 5 20z" />,
    download: <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" />,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {icons[name] || icons.dashboard}
    </svg>
  );
}

function StaticChip({ children }) {
  return <span className="fis-static-chip">{children}</span>;
}

function StatCard({ title, value, subtitle, change, icon, accent = "green" }) {
  const isNegative = String(change || "").startsWith("-");

  return (
    <article className="fis-stat-card">
      <div className="fis-stat-top">
        <div>
          <span className="fis-stat-title">{title}</span>
          <h3>{value}</h3>
          <p>{subtitle}</p>
        </div>
        <div className={`fis-icon-chip accent-${accent}`}>
          <Icon name={icon} className="fis-small-icon" />
        </div>
      </div>
      <div className={`fis-trend ${isNegative ? "negative" : "positive"}`}>
        <span>{isNegative ? "v" : "^"}</span>
        <span>{String(change || "").replace("-", "")} from last month</span>
      </div>
    </article>
  );
}

function AuthField({ label, icon, type = "text", placeholder, value, onChange }) {
  return (
    <label className="fis-auth-field">
      <span>{label}</span>
      <div className="fis-input-shell">
        <Icon name={icon} className="fis-field-icon" />
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} />
        {type === "password" ? <Icon name="eye" className="fis-field-icon right" /> : null}
      </div>
    </label>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="fis-empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

function AuthIllustration({ role }) {
  if (role === "admin") {
    return (
      <div className="fis-auth-visual admin">
        <div className="fis-auth-brand-block">
          <div className="fis-auth-logo large">
            <Icon name="bank" className="fis-logo-icon" />
          </div>
          <div>
            <h2>Financial Intelligence System</h2>
            <p>Admin Portal</p>
          </div>
        </div>
        <div className="fis-auth-copy">
          <h3>Welcome Admin!</h3>
          <p>Securely access the admin panel to monitor users, activities, reports, and security alerts.</p>
        </div>
        <div className="fis-device-card">
          <div className="fis-device-screen">
            <div className="fis-device-bars">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="fis-device-pie" />
          </div>
          <div className="fis-device-shield">
            <Icon name="shield" className="fis-hero-icon" />
          </div>
        </div>
        <div className="fis-feature-strip">
          <div><Icon name="users" className="fis-strip-icon" />User Management</div>
          <div><Icon name="activity" className="fis-strip-icon" />Activity Monitoring</div>
          <div><Icon name="analytics" className="fis-strip-icon" />System Analytics</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fis-auth-visual user">
      <div className="fis-wave-top" />
      <div className="fis-hero-mark">
        <div className="fis-auth-logo">
          <Icon name="bank" className="fis-logo-icon" />
        </div>
      </div>
      <div className="fis-auth-copy centered">
        <h2>Financial Intelligence System</h2>
        <div className="fis-copy-divider" />
        <p>Smart insights for better financial decisions</p>
      </div>
      <div className="fis-growth-graphic">
        <div className="fis-bars">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <svg viewBox="0 0 300 120" className="fis-growth-line">
          <polyline fill="none" stroke="#18c285" strokeWidth="4" points="12,92 58,76 102,62 146,40 190,54 236,36 290,10" />
          <circle cx="58" cy="76" r="5" />
          <circle cx="102" cy="62" r="5" />
          <circle cx="146" cy="40" r="5" />
          <circle cx="190" cy="54" r="5" />
          <circle cx="236" cy="36" r="5" />
          <path d="M276 10h14v14" stroke="#18c285" strokeWidth="4" fill="none" />
        </svg>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("fis-theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [adminOverview, setAdminOverview] = useState(null);
  const [loanResult, setLoanResult] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [filters, setFilters] = useState({ type: "all", date: "", search: "" });
  const [loginForm, setLoginForm] = useState({
    role: "user",
    email: "user@finbank.ai",
    password: "user123",
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [transactionForm, setTransactionForm] = useState({
    title: "",
    category: "Salary",
    type: "income",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [loanForm, setLoanForm] = useState({
    monthlySalary: 40000,
    loanAmount: 800000,
    interestRate: 9,
    tenureMonths: 60,
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("fis-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!user) return;

    setLoanForm((current) => ({
      ...current,
      monthlySalary: user.monthlySalary || current.monthlySalary,
      loanAmount: Math.max(current.loanAmount, (user.monthlySalary || current.monthlySalary) * 8),
    }));

    loadWorkspace(filters, user);
  }, [user]);

  const scopeParams = (profile = user) => ({
    userId: profile?.id || 0,
    role: profile?.role || "user",
  });

  const loadWorkspace = async (queryFilters = filters, profile = user) => {
    if (!profile) return;

    const params = { ...queryFilters, ...scopeParams(profile) };
    const requests = [api.getTransactions(params), api.getAnalytics(scopeParams(profile)), api.getNotifications(scopeParams(profile))];

    if (profile.role === "admin") {
      requests.push(api.getAdminOverview(scopeParams(profile)));
    }

    try {
      const [transactionResponse, analyticsResponse, notificationResponse, adminResponse] = await Promise.all(requests);

      setTransactions(transactionResponse.items || []);
      setEvents(transactionResponse.events || []);
      setAnalytics(analyticsResponse);
      setNotifications(notificationResponse || []);
      setAdminOverview(profile.role === "admin" ? adminResponse : null);
    } catch (error) {
      console.error("Failed to load workspace:", error);
      setTransactions([]);
      setEvents([]);
      setAnalytics(null);
      setNotifications([]);
      if (profile.role === "admin") {
        setAdminOverview(null);
      }
      setAuthError("Unable to load workspace data. Please check the backend and retry.");
    }
  };

  const summary = useMemo(() => {
    const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const balance = income - expense;
    return {
      income,
      expense,
      balance,
      savingsRate: income ? (balance / income) * 100 : 0,
    };
  }, [transactions]);

  const expenseDistribution = useMemo(() => {
    if (!analytics?.categoryBreakdown?.length) return [];
    const total = analytics.categoryBreakdown.reduce((sum, item) => sum + item.value, 0) || 1;
    return analytics.categoryBreakdown.map((item) => ({
      ...item,
      percentage: ((item.value / total) * 100).toFixed(0),
    }));
  }, [analytics]);

  const incomeVsExpense = useMemo(
    () => [
      { name: "Income", value: summary.income, fill: "#1a8b4a" },
      { name: "Expense", value: summary.expense, fill: "#ef553f" },
    ],
    [summary]
  );

  const financialHealth = useMemo(() => {
    const balanceState = summary.balance >= 0 ? "Healthy" : "Needs Attention";
    const expenseControl = summary.income && summary.expense / summary.income < 0.6 ? "Good" : "Watch Spending";
    const loanState =
      loanResult?.decision === "Approved" ? "High" : loanResult?.decision === "Review" ? "Moderate" : "Low";

    return {
      balanceState,
      savingsRate: formatPercentage(summary.savingsRate),
      expenseControl,
      loanState,
    };
  }, [loanResult, summary]);

  const adminUsers = useMemo(
    () => (adminOverview?.users || []).filter((item) => item.role === "user"),
    [adminOverview]
  );

  const adminTransactions = useMemo(() => adminOverview?.transactions || [], [adminOverview]);
  const adminActivities = useMemo(() => adminOverview?.recentActivities || [], [adminOverview]);
  const adminNotifications = useMemo(() => adminOverview?.notifications || [], [adminOverview]);
  const adminLoginAudit = useMemo(() => adminOverview?.loginAudit || [], [adminOverview]);
  const adminRegistrationTrend = useMemo(() => adminOverview?.userRegistrations || [], [adminOverview]);

  const adminStats = useMemo(() => {
    if (!adminOverview) return [];

    return [
      {
        title: "Total Users",
        value: adminOverview.metrics.totalUsers.toLocaleString("en-IN"),
        subtitle: "Registered accounts",
        change: "12.5%",
        icon: "users",
        accent: "green",
      },
      {
        title: "Active Users",
        value: adminOverview.metrics.activeUsers.toLocaleString("en-IN"),
        subtitle: "Recently active",
        change: "8.7%",
        icon: "user",
        accent: "blue",
      },
      {
        title: "Total Transactions",
        value: adminOverview.metrics.totalTransactions.toLocaleString("en-IN"),
        subtitle: "Processed entries",
        change: "15.3%",
        icon: "reports",
        accent: "violet",
      },
      {
        title: "Total Amount Processed",
        value: formatCurrency(adminOverview.metrics.totalProcessed),
        subtitle: "Across all users",
        change: "18.6%",
        icon: "shield",
        accent: "orange",
      },
      {
        title: "System Alerts",
        value: adminOverview.metrics.systemAlerts.toString(),
        subtitle: "Need review",
        change: "5.0%",
        icon: "bell",
        accent: "red",
      },
    ];
  }, [adminOverview]);

  const adminRoleData = useMemo(() => {
    const regularUsers = adminUsers.length;
    const engagedUsers = Math.max(1, Math.round(regularUsers * 0.18));
    const loanUsers = Math.max(1, Math.round(regularUsers * 0.12));
    const other = Math.max(1, regularUsers - engagedUsers - loanUsers);

    return [
      { name: "Regular Users", value: regularUsers, fill: "#14833b" },
      { name: "Engaged Users", value: engagedUsers, fill: "#f3b32d" },
      { name: "Loan Users", value: loanUsers, fill: "#2f74c8" },
      { name: "Other", value: other, fill: "#7d58c2" },
    ];
  }, [adminUsers]);

  const pageTitle =
    user?.role === "admin"
      ? adminMenu.find((item) => item.id === activePage)?.label || "Admin Dashboard"
      : activePage === "chatbot"
        ? "AI Financial Assistant"
        : activePage === "analytics"
          ? "Analytics Dashboard"
          : userMenu.find((item) => item.id === activePage)?.label || "Dashboard";

  const pageSubtitle =
    user?.role === "admin"
      ? "Welcome back, Admin! Monitor the platform, users, transactions, and audits from one place."
      : activePage === "analytics"
        ? "Insights and statistics about your financial health."
        : activePage === "chatbot"
          ? "Ask about loans, EMI, savings, income planning, or banking forms."
          : "Welcome back! Here is your financial overview.";

  const handleMenuClick = (id) => {
    if (id === "logout") {
      setUser(null);
      setActivePage("dashboard");
      setSidebarOpen(false);
      return;
    }
    setActivePage(id);
    setSidebarOpen(false);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const profile = await api.login(loginForm);
      setUser(profile);
      setAuthError("");
      setActivePage("dashboard");
      setSidebarOpen(false);
      await loadWorkspace({ type: "all", date: "", search: "" }, profile);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const profile = await api.register(registerForm);
      setUser(profile);
      setAuthError("");
      setAuthMode("login");
      setActivePage("dashboard");
      setLoginForm({ role: "user", email: registerForm.email, password: registerForm.password });
      setRegisterForm({ name: "", email: "", password: "" });
      await loadWorkspace({ type: "all", date: "", search: "" }, profile);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleTransactionSubmit = async (event) => {
    event.preventDefault();

    await api.addTransaction({
      ...transactionForm,
      amount: Number(transactionForm.amount),
      ...scopeParams(),
    });

    await loadWorkspace(filters);
    setTransactionForm({
      title: "",
      category: "Salary",
      type: "income",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });
  };

  const handleLoanSubmit = async (event) => {
    event.preventDefault();
    const result = await api.calculateLoan({
      monthlySalary: Number(loanForm.monthlySalary),
      loanAmount: Number(loanForm.loanAmount),
      interestRate: Number(loanForm.interestRate),
      tenureMonths: Number(loanForm.tenureMonths),
    });
    setLoanResult(result);
  };

  const handleQuickAction = (action) => {
    if (action.patch) {
      setTransactionForm((current) => ({ ...current, ...action.patch }));
    }
    setActivePage(action.page);
  };

  const exportTransactions = () => {
    const headers = ["Date", "Title", "Category", "Type", "Amount", "Note"];
    const rows = transactions.map((item) =>
      [item.date, item.title, item.category, item.type, item.amount, item.note].join(",")
    );
    downloadFile("transactions.csv", [headers.join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
  };

  const exportUserReport = () => {
    const report = [
      "Financial Intelligence System - User Report",
      `Name: ${user?.name || ""}`,
      `Email: ${user?.email || ""}`,
      `Income: ${formatCurrency(summary.income)}`,
      `Expense: ${formatCurrency(summary.expense)}`,
      `Savings: ${formatCurrency(summary.balance)}`,
      `Savings Rate: ${formatPercentage(summary.savingsRate)}`,
      "",
      "Insights:",
      ...(analytics?.insights || []),
    ].join("\n");

    downloadFile("financial-report.txt", report);
  };

  const exportAdminBackup = () => {
    const payload = JSON.stringify(adminOverview || {}, null, 2);
    downloadFile("fis-admin-backup.json", payload, "application/json;charset=utf-8");
  };

  const menuItems = user?.role === "admin" ? adminMenu : userMenu;
  const isAdminLogin = loginForm.role === "admin";
  const showRegister = !isAdminLogin && authMode === "register";

  if (!user) {
    return (
      <div className={`fis-auth-shell ${isAdminLogin ? "admin-auth" : "user-auth"}`}>
        <div className="fis-auth-pane visual-pane">
          <AuthIllustration role={loginForm.role} />
        </div>

        <div className="fis-auth-pane form-pane">
          <div className="fis-auth-card">
            <div className="fis-auth-badge">
              <Icon name={isAdminLogin ? "admin" : "bank"} className="fis-badge-icon" />
            </div>
            <h1>{isAdminLogin ? "Admin Login" : showRegister ? "Create Account" : "Welcome Back!"}</h1>
            <p>
              {isAdminLogin
                ? "Enter your email and password to access the admin dashboard."
                : showRegister
                  ? "Create your account and starter data will be loaded automatically."
                  : "Sign in to continue to your personal financial workspace."}
            </p>

            <div className="fis-role-switch" aria-label="Choose login type">
              <button
                type="button"
                className={!isAdminLogin ? "active" : ""}
                onClick={() => {
                  setLoginForm({ role: "user", email: "user@finbank.ai", password: "user123" });
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                User Login
              </button>
              <button
                type="button"
                className={isAdminLogin ? "active" : ""}
                onClick={() => {
                  setLoginForm({ role: "admin", email: "admin@finbank.ai", password: "admin123" });
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                Admin Login
              </button>
            </div>

            {showRegister ? (
              <form className="fis-auth-form" onSubmit={handleRegister}>
                <AuthField
                  label="Full Name"
                  icon="user"
                  placeholder="Enter your full name"
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                />
                <AuthField
                  label="Email"
                  icon="email"
                  placeholder="Enter your email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                />
                <AuthField
                  label="Password"
                  icon="lock"
                  type="password"
                  placeholder="Create password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                />

                {authError ? <div className="fis-error">{authError}</div> : null}

                <button className="fis-primary-btn" type="submit">
                  Create Account
                </button>

                <div className="fis-auth-foot">
                  <p>
                    Already have an account?{" "}
                    <button type="button" className="fis-inline-link" onClick={() => { setAuthMode("login"); setAuthError(""); }}>
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form className="fis-auth-form" onSubmit={handleLogin}>
                <AuthField
                  label="Email"
                  icon="email"
                  placeholder={isAdminLogin ? "Enter admin email" : "Enter your email"}
                  value={loginForm.email}
                  onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                />
                <AuthField
                  label="Password"
                  icon="lock"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                />

                <div className="fis-auth-row">
                  <label className="fis-check">
                    <input type="checkbox" defaultChecked />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="fis-inline-link"
                    onClick={() => setAuthError("Use the demo credentials shown here, or create a new user account.")}
                  >
                    Forgot password?
                  </button>
                </div>

                {authError ? <div className="fis-error">{authError}</div> : null}

                <button className="fis-primary-btn" type="submit">
                  {isAdminLogin ? "Login as Admin" : "Sign In"}
                </button>

                <div className="fis-divider"><span>OR</span></div>

              <button
                type="button"
                className="fis-secondary-btn"
                onClick={() => {
                    if (isAdminLogin) {
                      setLoginForm({ role: "user", email: "user@finbank.ai", password: "user123" });
                      setAuthMode("login");
                    } else {
                      setAuthMode("register");
                    }
                    setAuthError("");
                  }}
                >
                  {isAdminLogin ? "Back to User Login" : "Sign in with Google"}
                </button>

                <div className="fis-auth-foot">
                  {isAdminLogin ? (
                    <p>Secure admin access. Activity and audit events are tracked automatically.</p>
                  ) : (
                    <p>
                      Do not have an account?{" "}
                      <button type="button" className="fis-inline-link" onClick={() => { setAuthMode("register"); setAuthError(""); }}>
                        Sign Up
                      </button>
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderUserDashboard = () => (
    <>
      <div className="fis-main-content">
        <div className="fis-metrics-row">
          <StatCard title="Total Balance" value={formatCurrency(summary.balance)} subtitle="Available balance" change="5.2%" icon="wallet" accent="green" />
          <StatCard title="Total Income" value={formatCurrency(summary.income)} subtitle="This month" change="12.4%" icon="trend" accent="green" />
          <StatCard title="Total Expense" value={formatCurrency(summary.expense)} subtitle="This month" change="-3.1%" icon="bill" accent="red" />
          <StatCard title="Savings Ratio" value={formatPercentage(summary.savingsRate)} subtitle="Current month" change="8.7%" icon="analytics" accent="blue" />
        </div>

        <div className="fis-dashboard-grid">
          <section className="fis-panel">
            <div className="fis-panel-head">
              <h3>Monthly Trend</h3>
              <StaticChip>This Month</StaticChip>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics?.monthlyTrend || []}>
                <CartesianGrid stroke="#edf1f5" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line dataKey="income" name="Income" stroke="#1c934d" strokeWidth={3} dot={{ r: 3 }} />
                <Line dataKey="expense" name="Expense" stroke="#f0543d" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="fis-panel">
            <div className="fis-panel-head">
              <h3>Expense Distribution</h3>
            </div>
            <div className="fis-split-content fis-chart-split">
              <div className="fis-chart-cell">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={expenseDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78}>
                      {expenseDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="fis-legend-list">
                {expenseDistribution.map((item, index) => (
                  <div key={item.name} className="fis-legend-row">
                    <span className="fis-dot" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    <span>{item.name}</span>
                    <strong>{item.percentage}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="fis-panel">
            <div className="fis-panel-head">
              <h3>Quick Actions</h3>
            </div>
            <div className="fis-action-grid">
              {quickActions.map((item) => (
                <button key={item.title} className="fis-action-card" onClick={() => handleQuickAction(item)} type="button">
                  <div className={`fis-icon-chip accent-${item.tint}`}>
                    <Icon name={item.icon} className="fis-small-icon" />
                  </div>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Financial Health Summary</h3>
          </div>
          <div className="fis-health-grid">
            {userHealthItems.map((item) => (
              <div key={item.label} className="fis-health-card">
                <div className={`fis-icon-chip accent-${item.accent}`}>
                  <Icon name={item.icon} className="fis-small-icon" />
                </div>
                <div>
                  <small>{item.label}</small>
                  <strong>{financialHealth[item.key]}</strong>
                  <p>{item.key === "loanState" ? "Loan eligibility based on your current profile." : "Live insight generated from your financial activity."}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Recent Transactions</h3>
            <button className="fis-inline-link" onClick={() => setActivePage("transactions")} type="button">
              View All
            </button>
          </div>
          <div className="fis-table-wrap">
            <table className="fis-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 6).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateShort(item.date)}</td>
                    <td>{item.title}</td>
                    <td>{item.category}</td>
                    <td><span className={`fis-status-pill ${item.type}`}>{item.type === "income" ? "Income" : "Expense"}</span></td>
                    <td>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="fis-right-rail">
        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Notifications</h3>
            <button className="fis-inline-link" onClick={() => setActivePage("reports")} type="button">
              View All
            </button>
          </div>
          <div className="fis-notification-list">
            {notifications.map((item, index) => (
              <article key={item.id} className="fis-notification-item">
                <div className={`fis-icon-chip accent-${["green", "orange", "blue"][index % 3]}`}>
                  <Icon name={index === 0 ? "trend" : index === 1 ? "wallet" : "reports"} className="fis-small-icon" />
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <small>{item.time}</small>
              </article>
            ))}
          </div>
        </section>
      </aside>
    </>
  );

  const renderAnalytics = () => (
    <div className="fis-main-content full">
      <div className="fis-metrics-row">
        <StatCard title="Total Savings" value={formatCurrency(summary.balance)} subtitle="This month" change="12.4%" icon="wallet" accent="green" />
        <StatCard title="Savings Rate" value={formatPercentage(summary.savingsRate)} subtitle="This month" change="8.7%" icon="trend" accent="blue" />
        <StatCard title="Total Expense" value={formatCurrency(summary.expense)} subtitle="This month" change="-3.1%" icon="bill" accent="red" />
        <StatCard title="Total Transactions" value={transactions.length.toString()} subtitle="This month" change="5.9%" icon="reports" accent="violet" />
      </div>

      <div className="fis-analytics-grid">
        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Monthly Trend</h3>
            <StaticChip>This Month</StaticChip>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={analytics?.monthlyTrend || []}>
              <CartesianGrid stroke="#edf1f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line dataKey="income" name="Income" stroke="#1c934d" strokeWidth={3} dot={{ r: 3 }} />
              <Line dataKey="expense" name="Expense" stroke="#f0543d" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Expense Distribution</h3>
          </div>
          <div className="fis-split-content fis-chart-split">
            <div className="fis-chart-cell">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={expenseDistribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80}>
                    {expenseDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="fis-legend-list">
              {expenseDistribution.map((item, index) => (
                <div key={item.name} className="fis-legend-row">
                  <span className="fis-dot" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                  <span>{item.name}</span>
                  <strong>{item.percentage}%</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Category Comparison</h3>
            <StaticChip>Expense</StaticChip>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={expenseDistribution}>
              <CartesianGrid stroke="#edf1f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {expenseDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Savings Insights</h3>
          </div>
          <div className="fis-insight-layout">
            <div className="fis-progress-circle">
              <div className="fis-progress-inner">
                <strong>{formatPercentage(summary.savingsRate)}</strong>
                <span>Savings Rate</span>
              </div>
            </div>
            <div className="fis-insight-list">
              {(analytics?.insights || []).map((item) => (
                <div key={item} className="fis-insight-item">{item}</div>
              ))}
              <button className="fis-inline-link" type="button" onClick={() => setActivePage("loans")}>
                Improve Loan Readiness
              </button>
            </div>
          </div>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Income vs Expense</h3>
            <StaticChip>This Month</StaticChip>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid stroke="#edf1f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {incomeVsExpense.map((item) => (
                  <Cell key={item.name} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="fis-savings-banner">You saved {formatCurrency(summary.balance)} this month.</div>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Top Expenses</h3>
            <button className="fis-primary-btn compact" type="button" onClick={exportUserReport}>
              Export Report
            </button>
          </div>
          <div className="fis-top-expense-list">
            {expenseDistribution.map((item, index) => (
              <div key={item.name} className="fis-top-expense-row">
                <div className="fis-expense-label">
                  <span className="fis-dot large" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                  <span>{item.name}</span>
                </div>
                <div className="fis-progress-bar">
                  <span style={{ width: `${item.percentage}%`, backgroundColor: chartColors[index % chartColors.length] }} />
                </div>
                <strong>{formatCurrency(item.value)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Add Transaction</h3>
          <button className="fis-primary-btn compact" type="button" onClick={exportTransactions}>
            Export CSV
          </button>
        </div>
        <form className="fis-form-grid" onSubmit={handleTransactionSubmit}>
          <input placeholder="Title" value={transactionForm.title} onChange={(event) => setTransactionForm({ ...transactionForm, title: event.target.value })} required />
          <select value={transactionForm.category} onChange={(event) => setTransactionForm({ ...transactionForm, category: event.target.value })}>
            {categoryOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          <select value={transactionForm.type} onChange={(event) => setTransactionForm({ ...transactionForm, type: event.target.value })}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input type="number" placeholder="Amount" value={transactionForm.amount} onChange={(event) => setTransactionForm({ ...transactionForm, amount: event.target.value })} required />
          <input type="date" value={transactionForm.date} onChange={(event) => setTransactionForm({ ...transactionForm, date: event.target.value })} required />
          <input placeholder="Note" value={transactionForm.note} onChange={(event) => setTransactionForm({ ...transactionForm, note: event.target.value })} />
          <button className="fis-primary-btn" type="submit">Add Transaction</button>
        </form>
      </section>

      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Filters</h3>
          <button className="fis-inline-link" type="button" onClick={() => { setFilters({ type: "all", date: "", search: "" }); loadWorkspace({ type: "all", date: "", search: "" }); }}>
            Reset
          </button>
        </div>
        <div className="fis-filter-grid">
          <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
          <input placeholder="Search transactions" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          <button className="fis-primary-btn compact" type="button" onClick={() => loadWorkspace(filters)}>
            Apply Filters
          </button>
        </div>
      </section>

      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Transactions</h3>
          <StaticChip>{transactions.length} entries</StaticChip>
        </div>
        <div className="fis-table-wrap">
          <table className="fis-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateLong(item.date)}</td>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td><span className={`fis-status-pill ${item.type}`}>{item.type}</span></td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderLoans = () => (
    <div className="fis-main-content full">
      <div className="fis-loan-grid">
        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Loan and EMI Calculator</h3>
          </div>
          <form className="fis-loan-form" onSubmit={handleLoanSubmit}>
            <label>
              <span>Monthly Salary</span>
              <input type="number" value={loanForm.monthlySalary} onChange={(event) => setLoanForm({ ...loanForm, monthlySalary: event.target.value })} />
            </label>
            <label>
              <span>Loan Amount</span>
              <input type="number" value={loanForm.loanAmount} onChange={(event) => setLoanForm({ ...loanForm, loanAmount: event.target.value })} />
            </label>
            <label>
              <span>Interest Rate</span>
              <input type="number" step="0.1" value={loanForm.interestRate} onChange={(event) => setLoanForm({ ...loanForm, interestRate: event.target.value })} />
            </label>
            <label>
              <span>Tenure (Months)</span>
              <input type="number" value={loanForm.tenureMonths} onChange={(event) => setLoanForm({ ...loanForm, tenureMonths: event.target.value })} />
            </label>
            <button className="fis-primary-btn" type="submit">Calculate EMI</button>
          </form>
        </section>

        <section className="fis-panel fis-loan-summary">
          <span className="fis-card-kicker">Loan Summary</span>
          <h2>{loanResult ? formatCurrency(loanResult.emi) : "--"}</h2>
          <p>Estimated EMI</p>
          {loanResult ? (
            <>
              <div className={`fis-status-pill ${loanResult.decision.toLowerCase()}`}>{loanResult.decision}</div>
              <ul>
                <li>Total interest: {formatCurrency(loanResult.totalInterest)}</li>
                <li>Total payment: {formatCurrency(loanResult.totalPayment)}</li>
                <li>EMI to salary ratio: {loanResult.affordabilityRatio}%</li>
              </ul>
              <p>{loanResult.narrative}</p>
            </>
          ) : (
            <p>Run a calculation to see affordability, interest load, and explainable factors.</p>
          )}
        </section>
      </div>

      {loanResult ? (
        <div className="fis-dashboard-grid">
          <section className="fis-panel">
            <div className="fis-panel-head">
              <h3>Explainable AI</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={loanResult.explainableFactors}>
                <CartesianGrid stroke="#edf1f5" vertical={false} />
                <XAxis dataKey="factor" tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="contribution" radius={[10, 10, 0, 0]}>
                  {loanResult.explainableFactors.map((entry, index) => (
                    <Cell key={entry.factor} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="fis-panel">
            <div className="fis-panel-head">
              <h3>Principal vs Interest</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={loanResult.pieBreakdown} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88}>
                  {loanResult.pieBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </section>
        </div>
      ) : null}
    </div>
  );

  const renderReports = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Financial Report</h3>
          <button className="fis-primary-btn compact" type="button" onClick={exportUserReport}>
            Export Report
          </button>
        </div>
        <div className="fis-grid-3">
          <div className="fis-info-card">
            <small>Total Income</small>
            <strong>{formatCurrency(summary.income)}</strong>
            <p>Based on your current seeded and recorded inflows.</p>
          </div>
          <div className="fis-info-card">
            <small>Total Expense</small>
            <strong>{formatCurrency(summary.expense)}</strong>
            <p>Updated from your transaction history and categories.</p>
          </div>
          <div className="fis-info-card">
            <small>Total Savings</small>
            <strong>{formatCurrency(summary.balance)}</strong>
            <p>Net savings available for investment or loan readiness.</p>
          </div>
        </div>
      </section>

      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Recommendations</h3>
        </div>
        <div className="fis-grid-2">
          {(analytics?.insights || []).map((item) => (
            <div key={item} className="fis-info-card">{item}</div>
          ))}
          <div className="fis-info-card">
            <strong>Next Best Action</strong>
            <p>Add more real transactions or use the EMI calculator to make the demo feel closer to a real banking product.</p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderSettings = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>User Settings</h3>
        </div>
        <div className="fis-grid-2">
          <div className="fis-info-card">
            <strong>Profile</strong>
            <p>Name: {user.name}</p>
            <p>Email: {user.email}</p>
            <p>Salary profile: {formatCurrency(user.monthlySalary || 0)}</p>
          </div>
          <div className="fis-info-card">
            <strong>Workspace</strong>
            <p>Theme mode can be changed instantly from the top bar.</p>
            <div className="fis-button-row">
              <button className="fis-primary-btn compact" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                Toggle Theme
              </button>
              <button className="fis-secondary-btn compact" type="button" onClick={() => { setUser(null); setActivePage("dashboard"); }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="fis-main-content full">
      <div className="fis-metrics-row admin">
        {adminStats.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="fis-admin-chart-grid">
        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>User Registration Trend</h3>
            <StaticChip>This Month</StaticChip>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={adminRegistrationTrend}>
              <defs>
                <linearGradient id="adminArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#49a66b" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#49a66b" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#edf1f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="income" stroke="#239151" fill="url(#adminArea)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Users by Role</h3>
          </div>
          <div className="fis-split-content fis-chart-split">
            <div className="fis-chart-cell">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={adminRoleData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82}>
                    {adminRoleData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="fis-legend-list">
              {adminRoleData.map((item) => (
                <div key={item.name} className="fis-legend-row">
                  <span className="fis-dot" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Transactions Overview</h3>
            <StaticChip>This Month</StaticChip>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid stroke="#edf1f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {incomeVsExpense.map((item) => (
                  <Cell key={item.name} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="fis-admin-table-grid">
        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Recent User Logins</h3>
            <button className="fis-inline-link" type="button" onClick={() => setActivePage("audit")}>
              View Audit Trail
            </button>
          </div>
          <div className="fis-table-wrap">
            <table className="fis-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Login Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {adminLoginAudit.slice(0, 6).map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                    <td><span className={`fis-status-pill ${item.status === "Success" ? "success" : "failed"}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Recent System Activities</h3>
            <button className="fis-inline-link" type="button" onClick={() => setActivePage("activity")}>
              View All
            </button>
          </div>
          <div className="fis-table-wrap">
            <table className="fis-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {adminActivities.slice(0, 6).map((item) => (
                  <tr key={item.id}>
                    <td>{item.summary}</td>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );

  const renderAdminUsers = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>User Management</h3>
          <StaticChip>{adminUsers.length} users</StaticChip>
        </div>
        <div className="fis-grid-3">
          <div className="fis-info-card">
            <small>Total users</small>
            <strong>{adminUsers.length}</strong>
            <p>New accounts are provisioned with starter transactions and notifications.</p>
          </div>
          <div className="fis-info-card">
            <small>Average salary profile</small>
            <strong>{formatCurrency(adminUsers.reduce((sum, item) => sum + (item.monthlySalary || 0), 0) / Math.max(adminUsers.length, 1))}</strong>
            <p>Useful for benchmarking affordability and savings patterns.</p>
          </div>
          <div className="fis-info-card">
            <small>Recently active</small>
            <strong>{adminOverview?.metrics.activeUsers || 0}</strong>
            <p>Recent user logins recorded in the audit stream.</p>
          </div>
        </div>
      </section>

      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>User Directory</h3>
        </div>
        <div className="fis-table-wrap">
          <table className="fis-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Salary Profile</th>
                <th>Joined</th>
                <th>Avatar</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{formatCurrency(item.monthlySalary || 0)}</td>
                  <td>{formatDateLong(item.createdAt)}</td>
                  <td>{item.avatar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderAdminMonitor = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Transactions Monitor</h3>
          <button className="fis-primary-btn compact" type="button" onClick={() => downloadFile("admin-transactions.json", JSON.stringify(adminTransactions, null, 2), "application/json;charset=utf-8")}>
            Export JSON
          </button>
        </div>
        <div className="fis-table-wrap">
          <table className="fis-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {adminTransactions.map((item) => (
                <tr key={item.id}>
                  <td>{item.userName}</td>
                  <td>{formatDateLong(item.date)}</td>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td><span className={`fis-status-pill ${item.type}`}>{item.type}</span></td>
                  <td>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderAdminActivity = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Activity Logs</h3>
        </div>
        <div className="fis-table-wrap">
          <table className="fis-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Summary</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {adminActivities.map((item) => (
                <tr key={item.id}>
                  <td>{item.kind}</td>
                  <td>{item.summary}</td>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderAdminReports = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>System Reports</h3>
          <button className="fis-primary-btn compact" type="button" onClick={exportAdminBackup}>
            Export Snapshot
          </button>
        </div>
        <div className="fis-grid-4">
          <div className="fis-info-card">
            <small>Total Processed</small>
            <strong>{formatCurrency(adminOverview?.metrics.totalProcessed || 0)}</strong>
          </div>
          <div className="fis-info-card">
            <small>Income Records</small>
            <strong>{adminOverview?.metrics.incomeTransactions || 0}</strong>
          </div>
          <div className="fis-info-card">
            <small>Expense Records</small>
            <strong>{adminOverview?.metrics.expenseTransactions || 0}</strong>
          </div>
          <div className="fis-info-card">
            <small>System Events</small>
            <strong>{adminOverview?.metrics.totalEvents || 0}</strong>
          </div>
        </div>
      </section>

      <div className="fis-grid-2">
        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>All User Income vs Expense</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid stroke="#edf1f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6c7a8d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {incomeVsExpense.map((item) => (
                  <Cell key={item.name} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="fis-panel">
          <div className="fis-panel-head">
            <h3>Category Exposure</h3>
          </div>
          <div className="fis-top-expense-list">
            {expenseDistribution.map((item, index) => (
              <div key={item.name} className="fis-top-expense-row">
                <div className="fis-expense-label">
                  <span className="fis-dot large" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                  <span>{item.name}</span>
                </div>
                <div className="fis-progress-bar">
                  <span style={{ width: `${item.percentage}%`, backgroundColor: chartColors[index % chartColors.length] }} />
                </div>
                <strong>{formatCurrency(item.value)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderAdminNotifications = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Admin Notifications</h3>
          <StaticChip>{adminNotifications.length} alerts</StaticChip>
        </div>
        <div className="fis-notification-list">
          {adminNotifications.map((item, index) => (
            <article key={item.id} className="fis-notification-item">
              <div className={`fis-icon-chip accent-${["green", "orange", "red"][index % 3]}`}>
                <Icon name={index === 0 ? "shield" : index === 1 ? "reports" : "bell"} className="fis-small-icon" />
              </div>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
              <small>{item.time}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderAdminSettings = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Admin Settings</h3>
        </div>
        <div className="fis-grid-2">
          <div className="fis-info-card">
            <strong>Theme and Workspace</strong>
            <p>Switch theme or review the current admin workspace context.</p>
            <div className="fis-button-row">
              <button className="fis-primary-btn compact" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                Toggle Theme
              </button>
              <button className="fis-secondary-btn compact" type="button" onClick={() => setActivePage("dashboard")}>
                Back to Dashboard
              </button>
            </div>
          </div>
          <div className="fis-info-card">
            <strong>Security Controls</strong>
            <p>Audit trail, alerts, and login records are available in the adjacent admin sections.</p>
            <div className="fis-button-row">
              <button className="fis-secondary-btn compact" type="button" onClick={() => setActivePage("audit")}>
                Open Audit Trail
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderAdminBackup = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Backup and Restore</h3>
        </div>
        <div className="fis-grid-3">
          <div className="fis-info-card">
            <strong>Backup Snapshot</strong>
            <p>Export a JSON snapshot of the current admin overview, metrics, users, and reports.</p>
            <button className="fis-primary-btn compact" type="button" onClick={exportAdminBackup}>
              Download Backup
            </button>
          </div>
          <div className="fis-info-card">
            <strong>Transactions Archive</strong>
            <p>Export all monitored transactions for offline review or submission.</p>
            <button className="fis-secondary-btn compact" type="button" onClick={() => downloadFile("all-transactions.json", JSON.stringify(adminTransactions, null, 2), "application/json;charset=utf-8")}>
              Download Transactions
            </button>
          </div>
          <div className="fis-info-card">
            <strong>Restore Guidance</strong>
            <p>This demo uses in-memory data. Restarting the backend reloads the starter workspace and new user seed data.</p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderAdminAudit = () => (
    <div className="fis-main-content full">
      <section className="fis-panel">
        <div className="fis-panel-head">
          <h3>Audit Trail</h3>
        </div>
        <div className="fis-table-wrap">
          <table className="fis-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>IP</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {adminLoginAudit.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td><span className={`fis-status-pill ${item.status === "Success" ? "success" : "failed"}`}>{item.status}</span></td>
                  <td>{item.ipAddress}</td>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderUserPage = () => {
    if (!analytics) {
      return (
        <div className="fis-main-content full">
          <section className="fis-panel">
            <EmptyState title="Loading workspace" message="Financial data is being prepared for this account." />
          </section>
        </div>
      );
    }

    if (activePage === "dashboard") return renderUserDashboard();
    if (activePage === "analytics") return renderAnalytics();
    if (activePage === "transactions") return renderTransactions();
    if (activePage === "loans") return renderLoans();
    if (activePage === "chatbot") {
      return (
        <div className="fis-main-content full">
          <FinancialChatbot />
        </div>
      );
    }
    if (activePage === "reports") return renderReports();
    return renderSettings();
  };

  const renderAdminPage = () => {
    if (!adminOverview) {
      return (
        <div className="fis-main-content full">
          <section className="fis-panel">
            <EmptyState title="Loading admin workspace" message="System metrics, user data, and activity logs are being prepared." />
          </section>
        </div>
      );
    }

    if (activePage === "dashboard") return renderAdminDashboard();
    if (activePage === "users") return renderAdminUsers();
    if (activePage === "monitor") return renderAdminMonitor();
    if (activePage === "activity") return renderAdminActivity();
    if (activePage === "system-reports") return renderAdminReports();
    if (activePage === "notifications") return renderAdminNotifications();
    if (activePage === "settings") return renderAdminSettings();
    if (activePage === "backup") return renderAdminBackup();
    return renderAdminAudit();
  };

  return (
    <div className={`fis-app-shell ${user.role}`}>
      <aside className={`fis-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="fis-sidebar-brand">
          <div className="fis-brand-badge">
            <Icon name="bank" className="fis-brand-icon" />
          </div>
          <div>
            <strong>Financial Intelligence System</strong>
            <small>{user.role === "admin" ? "Admin Portal" : "Smart Banking Suite"}</small>
          </div>
        </div>

        <nav className="fis-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`fis-nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => handleMenuClick(item.id)}
              type="button"
            >
              <Icon name={item.icon} className="fis-nav-icon" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="fis-sidebar-footer">
          {user.role === "admin" ? (
            <div className="fis-side-card admin">
              <div className="fis-icon-chip accent-green">
                <Icon name="shield" className="fis-small-icon" />
              </div>
              <h4>Secure Admin Access</h4>
              <p>Audit entries, notifications, and backup exports are available across the final admin workspace.</p>
            </div>
          ) : (
            <div className="fis-side-card">
              <div className="fis-illustration-card">
                <div className="fis-illustration-lock">
                  <Icon name="shield" className="fis-lock-icon" />
                </div>
              </div>
              <h4>Secure. Smart. Simple.</h4>
              <p>Your data is protected and new accounts are provisioned with realistic starter data for an instant demo.</p>
            </div>
          )}
        </div>
      </aside>

      <main className="fis-main">
        <header className="fis-topbar">
          <div className="fis-topbar-left">
            <button className="fis-ghost-btn icon-only" type="button" onClick={() => setSidebarOpen((current) => !current)}>
              <Icon name="menu" className="fis-small-icon" />
            </button>
            <div>
              <h1>Financial Intelligence System</h1>
            </div>
          </div>

          <div className="fis-topbar-right">
            <div className="fis-date-chip">
              <span>{formatDateLong(new Date())}</span>
            </div>
            <button className="fis-ghost-btn icon-only" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              <Icon name="sun" className="fis-small-icon" />
            </button>
            <button
              className="fis-ghost-btn icon-only notification-bell"
              type="button"
              onClick={() => setActivePage(user.role === "admin" ? "notifications" : "reports")}
            >
              <Icon name="bell" className="fis-small-icon" />
              <span className="fis-bell-badge">{notifications.length || adminNotifications.length || 1}</span>
            </button>
            <button className="fis-user-pill fis-user-trigger" type="button" onClick={() => setActivePage("settings")}>
              <div className="fis-user-avatar">{user.avatar || "U"}</div>
              <span>{user.role === "admin" ? "Admin" : user.name.split(" ")[0]}</span>
            </button>
          </div>
        </header>

        <div className="fis-page-title-row">
          <div>
            <h2>{pageTitle}</h2>
            <p>{pageSubtitle}</p>
          </div>
          {user.role === "admin" ? (
            <div className="fis-page-actions">
              <div className="fis-date-chip">
                <Icon name="reports" className="fis-small-icon" />
                <span>01 May 2024 - 31 May 2024</span>
              </div>
            </div>
          ) : activePage === "analytics" ? (
            <div className="fis-page-actions">
              <div className="fis-date-chip">
                <Icon name="reports" className="fis-small-icon" />
                <span>01-04-2026 - 30-04-2026</span>
              </div>
              <button className="fis-primary-btn compact" type="button" onClick={exportUserReport}>
                <Icon name="download" className="fis-small-icon" />
                Export Report
              </button>
            </div>
          ) : null}
        </div>

        <section className={`fis-page-grid ${user.role === "admin" ? "admin-grid" : "user-grid"}`}>
          {user.role === "admin" ? renderAdminPage() : renderUserPage()}
        </section>
      </main>
    </div>
  );
}

export default App;
