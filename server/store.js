import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.resolve(__dirname, "../portal_store.json");

const now = new Date();

const toDate = (monthOffset, day) =>
  new Date(now.getFullYear(), now.getMonth() + monthOffset, day).toISOString().slice(0, 10);

const monthLabel = (date) =>
  new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(date);

const buildAvatar = (name) =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "NA";

const createSeedTransactions = (userId, monthlySalary = 62000) => {
  const sideIncome = Math.round(monthlySalary * 0.18);

  return [
    {
      userId,
      title: "Salary Credit",
      category: "Salary",
      type: "income",
      amount: monthlySalary,
      date: toDate(0, 1),
      note: "Monthly salary credited",
    },
    {
      userId,
      title: "Project Bonus",
      category: "Freelance",
      type: "income",
      amount: sideIncome,
      date: toDate(0, 8),
      note: "Side income and incentive payout",
    },
    {
      userId,
      title: "House Rent",
      category: "Housing",
      type: "expense",
      amount: Math.round(monthlySalary * 0.24),
      date: toDate(0, 3),
      note: "Monthly rent payment",
    },
    {
      userId,
      title: "Groceries",
      category: "Food",
      type: "expense",
      amount: Math.round(monthlySalary * 0.08),
      date: toDate(0, 10),
      note: "Household essentials",
    },
    {
      userId,
      title: "Utility Bills",
      category: "Utilities",
      type: "expense",
      amount: Math.round(monthlySalary * 0.05),
      date: toDate(0, 13),
      note: "Electricity, water, and internet",
    },
    {
      userId,
      title: "Transport Pass",
      category: "Transport",
      type: "expense",
      amount: Math.round(monthlySalary * 0.04),
      date: toDate(0, 15),
      note: "Daily commute",
    },
    {
      userId,
      title: "SIP Investment",
      category: "Investment",
      type: "expense",
      amount: Math.round(monthlySalary * 0.09),
      date: toDate(0, 18),
      note: "Monthly wealth allocation",
    },
    {
      userId,
      title: "Dining and Leisure",
      category: "Lifestyle",
      type: "expense",
      amount: Math.round(monthlySalary * 0.05),
      date: toDate(-1, 25),
      note: "Weekend spending",
    },
  ];
};

const createUserNotifications = (userId, monthlySalary = 62000) => [
  {
    userId,
    role: "user",
    title: "Welcome aboard",
    description: "Your account is ready with a starter financial profile so you can explore the dashboard immediately.",
    time: "just now",
  },
  {
    userId,
    role: "user",
    title: "Savings insight",
    description: `A starting salary profile of Rs ${monthlySalary.toLocaleString("en-IN")} has been loaded for your analytics demo.`,
    time: "5 mins ago",
  },
  {
    userId,
    role: "user",
    title: "Loan readiness",
    description: "Open Loans & EMI to review affordability and explainable decision factors.",
    time: "12 mins ago",
  },
];

const createAdminNotifications = () => [
  {
    userId: null,
    role: "admin",
    title: "Platform overview",
    description: "User activity, transactions, and system alerts are synced for the latest reporting cycle.",
    time: "2 mins ago",
  },
  {
    userId: null,
    role: "admin",
    title: "Security check",
    description: "Audit entries are being recorded for login and registration events.",
    time: "18 mins ago",
  },
];

const adminUser = {
  id: 1,
  role: "admin",
  email: "admin@finbank.ai",
  password: "admin123",
  name: "Admin Officer",
  avatar: "AO",
  monthlySalary: 0,
  createdAt: toDate(-2, 11),
};

const demoUser = {
  id: 2,
  role: "user",
  email: "user@finbank.ai",
  password: "user123",
  name: "Aman Sharma",
  avatar: buildAvatar("Aman Sharma"),
  monthlySalary: 78000,
  createdAt: toDate(-3, 14),
};

const seedTransactions = createSeedTransactions(demoUser.id, demoUser.monthlySalary).map((transaction, index) => ({
  id: index + 1,
  ...transaction,
}));

const seedEvents = seedTransactions.map((transaction, index) => ({
  id: index + 1,
  userId: transaction.userId,
  kind: "TRANSACTION_CREATED",
  transactionId: transaction.id,
  timestamp: `${transaction.date}T10:00:00`,
  summary: `${transaction.type.toUpperCase()} of Rs ${transaction.amount.toLocaleString("en-IN")} recorded for ${transaction.category}`,
}));

const seedNotifications = [
  ...createUserNotifications(demoUser.id, demoUser.monthlySalary).map((item, index) => ({
    id: index + 1,
    ...item,
  })),
  ...createAdminNotifications().map((item, index) => ({
    id: index + 101,
    ...item,
  })),
];

const initialStore = {
  users: [adminUser, demoUser],
  transactions: seedTransactions,
  events: seedEvents,
  notifications: seedNotifications,
  loginAudit: [
    {
      id: 1,
      userId: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      status: "Success",
      timestamp: `${toDate(0, 21)}T10:45:00`,
      ipAddress: "192.168.1.101",
    },
    {
      id: 2,
      userId: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      status: "Success",
      timestamp: `${toDate(0, 21)}T09:10:00`,
      ipAddress: "192.168.1.110",
    },
  ],
};

let loadedStore = initialStore;
if (fs.existsSync(STORE_PATH)) {
  try {
    loadedStore = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  } catch (e) {
    console.error("Error parsing portal_store.json:", e);
  }
} else {
  fs.writeFileSync(STORE_PATH, JSON.stringify(loadedStore, null, 2), "utf-8");
}

export const store = loadedStore;

export const saveStore = () => {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving portal_store.json:", e);
  }
};

export const nextUserId = () =>
  (store.users.length ? Math.max(...store.users.map((item) => item.id)) : 0) + 1;

export const nextTransactionId = () =>
  (store.transactions.length ? Math.max(...store.transactions.map((item) => item.id)) : 0) + 1;

export const nextEventId = () =>
  (store.events.length ? Math.max(...store.events.map((item) => item.id)) : 0) + 1;

export const nextNotificationId = () =>
  (store.notifications.length ? Math.max(...store.notifications.map((item) => item.id)) : 0) + 1;

export const nextLoginAuditId = () =>
  (store.loginAudit.length ? Math.max(...store.loginAudit.map((item) => item.id)) : 0) + 1;

export const buildMonthlySeries = (transactions) => {
  const buckets = new Map();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = buckets.get(key) ?? { month: monthLabel(date), income: 0, expense: 0, sortKey: key };
    current[transaction.type] += transaction.amount;
    buckets.set(key, current);
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ sortKey, ...item }) => item);
};

export { buildAvatar, createSeedTransactions, createUserNotifications };
