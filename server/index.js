import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildAvatar,
  buildMonthlySeries,
  createSeedTransactions,
  createUserNotifications,
  nextEventId,
  nextLoginAuditId,
  nextNotificationId,
  nextTransactionId,
  nextUserId,
  store,
  saveStore,
} from "./store.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 5000;
const host = process.env.HOST || "0.0.0.0";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../client/dist");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "missing-key");
const aiModel = genAI.getGenerativeModel({ 
  model: "gemini-3.6-flash",
  systemInstruction: "You are an expert AI financial assistant for a banking portal. Your job is to help users with loans, EMI, savings, income planning, and banking support questions. You must restrict all your answers STRICTLY to the financial and banking sector. If the user asks something completely unrelated to finance, politely decline to answer. Keep your answers concise, well-formatted (using markdown), and highly professional."
});

app.use(cors());
app.use(express.json());

const apiPrefixes = ["/auth", "/transactions", "/analytics", "/loan", "/chatbot", "/notifications", "/admin"];

const isApiRequest = (req) => req.path === "/health" || apiPrefixes.some((prefix) => req.path.startsWith(prefix));

const getBody = (req) => req.body && typeof req.body === "object" ? req.body : {};

const finiteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const positiveNumber = (value, fallback) => {
  const number = finiteNumber(value, fallback);
  return number > 0 ? number : fallback;
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const getScopedTransactions = (userId, role = "user") => {
  if (role === "admin") {
    return store.transactions;
  }
  return store.transactions.filter((transaction) => transaction.userId === userId);
};

const getScopedEvents = (userId, role = "user") => {
  if (role === "admin") {
    return store.events;
  }
  return store.events.filter((event) => event.userId === userId || event.userId == null);
};

const getScopedNotifications = (userId, role = "user") =>
  store.notifications.filter((notification) => notification.role === role || notification.userId === userId);

const getUserById = (userId) => store.users.find((user) => user.id === userId);

const calculateLoanMetrics = ({ monthlySalary, loanAmount, interestRate, tenureMonths }) => {
  monthlySalary = finiteNumber(monthlySalary, 0);
  loanAmount = positiveNumber(loanAmount, 100000);
  interestRate = Math.max(0, finiteNumber(interestRate, 10));
  tenureMonths = Math.max(1, Math.round(positiveNumber(tenureMonths, 36)));

  const monthlyRate = interestRate / 12 / 100;
  const emi =
    monthlyRate === 0
      ? loanAmount / tenureMonths
      : (loanAmount * monthlyRate * (1 + monthlyRate) ** tenureMonths) /
        ((1 + monthlyRate) ** tenureMonths - 1);

  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - loanAmount;
  const affordabilityRatio = monthlySalary ? emi / monthlySalary : 1;

  let riskBand = "Approved";
  let narrative = "The applicant fits a healthy repayment profile.";

  if (affordabilityRatio > 0.55) {
    riskBand = "Rejected";
    narrative = "Projected EMI is too high compared with salary, so the loan is financially unsafe.";
  } else if (affordabilityRatio > 0.38) {
    riskBand = "Review";
    narrative = "The EMI is manageable but close to the caution range. Manual review is recommended.";
  }

  const explainableFactors = [
    {
      factor: "Income strength",
      contribution: Math.max(10, Math.min(95, (monthlySalary / 120000) * 100)),
      summary: "Higher salary improves repayment confidence.",
    },
    {
      factor: "EMI affordability",
      contribution: Math.max(5, Math.min(100, 100 - affordabilityRatio * 100)),
      summary: "Lower EMI-to-salary ratio creates stronger approval confidence.",
    },
    {
      factor: "Interest burden",
      contribution: Math.max(8, Math.min(100, 100 - interestRate * 4)),
      summary: "Lower interest rates reduce repayment pressure over time.",
    },
    {
      factor: "Tenure comfort",
      contribution: Math.max(20, Math.min(100, 100 - Math.abs(tenureMonths - 36) * 1.1)),
      summary: "Balanced tenure often improves risk stability.",
    },
  ];

  const pieBreakdown = [
    { name: "Principal", value: Number(loanAmount.toFixed(2)) },
    { name: "Interest", value: Number(totalInterest.toFixed(2)) },
  ];

  return {
    inputs: { monthlySalary, loanAmount, interestRate, tenureMonths },
    emi: Number(emi.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    totalPayment: Number(totalPayment.toFixed(2)),
    affordabilityRatio: Number((affordabilityRatio * 100).toFixed(2)),
    decision: riskBand,
    narrative,
    explainableFactors,
    pieBreakdown,
  };
};

const getAnalyticsForTransactions = (transactions) => {
  const monthlyTrend = buildMonthlySeries(transactions);

  const categoryMap = new Map();
  let income = 0;
  let expense = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      income += transaction.amount;
      return;
    }

    expense += transaction.amount;
    categoryMap.set(transaction.category, (categoryMap.get(transaction.category) ?? 0) + transaction.amount);
  });

  const savings = income - expense;
  const savingsRate = income ? (savings / income) * 100 : 0;
  const topCategory = [...categoryMap.entries()].sort((a, b) => b[1] - a[1])[0];
  const categoryBreakdown = [...categoryMap.entries()].map(([name, value]) => ({ name, value }));

  const insights = [
    `Net monthly savings are ${currency(savings)}, which is ${savingsRate.toFixed(1)}% of total income.`,
    topCategory
      ? `${topCategory[0]} is the largest expense category at ${currency(topCategory[1])}.`
      : "No expense categories available yet.",
    savingsRate >= 25
      ? "Savings rate is healthy for loan readiness."
      : "Increasing savings will strengthen the loan profile and reduce risk.",
  ];

  return {
    summary: {
      totalIncome: income,
      totalExpense: expense,
      totalSavings: savings,
      savingsRate: Number(savingsRate.toFixed(2)),
    },
    monthlyTrend,
    categoryBreakdown,
    insights,
  };
};

const buildChatResponse = (message) => {
  const normalized = String(message || "").toLowerCase();
  const salaryMatch = normalized.match(/salary\s*(?:is|=)?\s*(\d+(?:\.\d+)?)/);
  const loanMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|loan)/);
  const percentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
  const yearMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:year|years)/);

  if (salaryMatch && loanMatch) {
    const salary = Number(salaryMatch[1]);
    const loanLakh = Number(loanMatch[1]);
    const loanAmount = normalized.includes("loan") && !normalized.includes("lakh") ? loanLakh : loanLakh * 100000;
    const metrics = calculateLoanMetrics({
      monthlySalary: salary,
      loanAmount,
      interestRate: percentMatch ? Number(percentMatch[1]) : 10,
      tenureMonths: yearMatch ? Number(yearMatch[1]) * 12 : 36,
    });

    return {
      answer: `Estimated EMI is ${currency(metrics.emi)} per month. Decision signal: ${metrics.decision}. ${metrics.narrative}`,
      context: metrics,
    };
  }

  if (normalized.includes("emi") && percentMatch && yearMatch) {
    const loanValue = normalized.match(/for\s*(\d+(?:\.\d+)?)/);
    const loanAmount = loanValue ? Number(loanValue[1]) * 100000 : 100000;
    const metrics = calculateLoanMetrics({
      monthlySalary: 50000,
      loanAmount,
      interestRate: Number(percentMatch[1]),
      tenureMonths: Number(yearMatch[1]) * 12,
    });
    return {
      answer: `For a loan of ${currency(loanAmount)} at ${percentMatch[1]}% for ${yearMatch[1]} years, the EMI is ${currency(
        metrics.emi
      )} and total interest is ${currency(metrics.totalInterest)}.`,
      context: metrics,
    };
  }

  if (normalized.includes("deposit form")) {
    return {
      answer:
        "For a deposit form, keep account number, branch name, depositor name, amount in words and figures, PAN if needed, and signature ready. Always cross-check the account number before submission.",
    };
  }

  if (normalized.includes("application")) {
    return {
      answer:
        "A strong bank application should include identity proof, address proof, salary slips, bank statements, employment details, and a clear loan purpose. Keep all values consistent across documents.",
    };
  }

  return {
    answer:
      "I can estimate EMI, judge loan affordability, explain risk factors, help with deposit forms, and guide bank applications. Try asking: Salary 25000, can I take 1 lakh loan?",
    context: null,
  };
};

const createAuditEntry = (user, status = "Success") => ({
  id: nextLoginAuditId(),
  userId: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status,
  timestamp: new Date().toISOString(),
  ipAddress: "192.168.1.100",
});

const seedNewUserWorkspace = (user) => {
  const transactions = createSeedTransactions(user.id, user.monthlySalary);
  const notifications = createUserNotifications(user.id, user.monthlySalary);

  transactions.forEach((transaction) => {
    const storedTransaction = { id: nextTransactionId(), ...transaction };
    store.transactions.push(storedTransaction);
    store.events.push({
      id: nextEventId(),
      userId: storedTransaction.userId,
      kind: "TRANSACTION_CREATED",
      transactionId: storedTransaction.id,
      timestamp: `${storedTransaction.date}T10:00:00`,
      summary: `${storedTransaction.type.toUpperCase()} of Rs ${storedTransaction.amount.toLocaleString("en-IN")} recorded for ${storedTransaction.category}`,
    });
  });

  notifications.forEach((notification) => {
    store.notifications.push({ id: nextNotificationId(), ...notification });
  });
};

const serializeUser = ({ password, ...user }) => user;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bank-loan-risk-server" });
});

app.post("/auth/login", (req, res) => {
  const body = getBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "user");

  const user = store.users.find(
    (item) => item.email.toLowerCase() === email && item.password === password && item.role === role
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  store.loginAudit.unshift(createAuditEntry(user, "Success"));
  store.events.push({
    id: nextEventId(),
    userId: user.id,
    kind: "USER_LOGIN",
    transactionId: null,
    timestamp: new Date().toISOString(),
    summary: `${user.name} signed in to the ${user.role} workspace.`,
  });
  saveStore();

  return res.json(serializeUser(user));
});

app.post("/auth/register", (req, res) => {
  const body = getBody(req);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const existingUser = store.users.find((item) => item.email.toLowerCase() === email);
  if (existingUser) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const monthlySalary = 62000;
  const user = {
    id: nextUserId(),
    role: "user",
    email,
    password,
    name,
    avatar: buildAvatar(name),
    monthlySalary,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  store.users.push(user);
  seedNewUserWorkspace(user);
  store.loginAudit.unshift(createAuditEntry(user, "Success"));
  store.events.push({
    id: nextEventId(),
    userId: user.id,
    kind: "USER_REGISTERED",
    transactionId: null,
    timestamp: new Date().toISOString(),
    summary: `New user registered: ${user.name} (${user.email})`,
  });
  store.notifications.push({
    id: nextNotificationId(),
    userId: null,
    role: "admin",
    title: "New signup",
    description: `${user.name} created a new account and starter financial data was provisioned automatically.`,
    time: "just now",
  });
  saveStore();

  return res.status(201).json(serializeUser(user));
});

app.get("/transactions", (req, res) => {
  const userId = Number(req.query.userId || 0);
  const role = String(req.query.role || "user");
  const type = String(req.query.type || "all");
  const search = String(req.query.search || "").toLowerCase();
  const date = String(req.query.date || "");

  const filtered = getScopedTransactions(userId, role).filter((transaction) => {
    const title = String(transaction.title || "").toLowerCase();
    const category = String(transaction.category || "").toLowerCase();
    const note = String(transaction.note || "").toLowerCase();

    const matchesType = type === "all" || transaction.type === type;
    const matchesSearch =
      !search ||
      title.includes(search) ||
      category.includes(search) ||
      note.includes(search);
    const matchesDate = !date || transaction.date === date;
    return matchesType && matchesSearch && matchesDate;
  });

  res.json({
    items: filtered.sort((a, b) => new Date(b.date) - new Date(a.date)),
    events: getScopedEvents(userId, role).slice(-12).reverse(),
  });
});

app.post("/transactions", (req, res) => {
  const body = getBody(req);
  const userId = finiteNumber(body.userId, 0);
  const user = getUserById(userId);

  if (!user) {
    return res.status(400).json({ message: "A valid user is required to add a transaction." });
  }

  const transaction = {
    id: nextTransactionId(),
    userId,
    title: String(body.title || "").trim(),
    category: String(body.category || "Salary"),
    type: String(body.type || "income"),
    amount: finiteNumber(body.amount, 0),
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    note: String(body.note || ""),
  };

  if (!transaction.title || transaction.amount <= 0 || !["income", "expense"].includes(transaction.type)) {
    return res.status(400).json({ message: "Title, positive amount, and a valid transaction type are required." });
  }

  store.transactions.push(transaction);
  store.events.push({
    id: nextEventId(),
    userId,
    kind: "TRANSACTION_CREATED",
    transactionId: transaction.id,
    timestamp: new Date().toISOString(),
    summary: `${transaction.type.toUpperCase()} of ${currency(transaction.amount)} added under ${transaction.category}.`,
  });
  saveStore();

  return res.status(201).json({
    transaction,
    analytics: getAnalyticsForTransactions(getScopedTransactions(userId, user.role)),
  });
});

app.get("/analytics", (req, res) => {
  const userId = Number(req.query.userId || 0);
  const role = String(req.query.role || "user");
  res.json(getAnalyticsForTransactions(getScopedTransactions(userId, role)));
});

app.post("/loan/calculate", (req, res) => {
  const body = getBody(req);
  const payload = {
    monthlySalary: body.monthlySalary,
    loanAmount: body.loanAmount,
    interestRate: body.interestRate,
    tenureMonths: body.tenureMonths,
  };
  res.json(calculateLoanMetrics(payload));
});

app.post("/chatbot", async (req, res) => {
  const body = getBody(req);
  const message = body.message || "";
  
  try {
    const result = await aiModel.generateContent(message);
    const response = await result.response;
    const text = response.text();
    return res.json({ answer: text });
  } catch (error) {
    if (error.message && error.message.includes("404")) {
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const result = await fallbackModel.generateContent("Assume the persona of a financial assistant and answer strictly within the banking sector. User says: " + message);
        const response = await result.response;
        return res.json({ answer: response.text() });
      } catch (fallbackError) {
        console.error("Gemini Fallback API Error:", fallbackError);
      }
    }
    console.error("Gemini API Error:", error);
    return res.json(buildChatResponse(message));
  }
});

app.get("/notifications", (req, res) => {
  const userId = Number(req.query.userId || 0);
  const role = String(req.query.role || "user");
  res.json(getScopedNotifications(userId, role).slice(-8).reverse());
});

app.get("/admin/overview", (_req, res) => {
  const totalProcessed = store.transactions.reduce((sum, item) => sum + item.amount, 0);
  const userRegistrations = buildMonthlySeries(
    store.users
      .filter((item) => item.role === "user")
      .map((user) => ({
        date: user.createdAt,
        type: "income",
        amount: 1,
      }))
  );

  res.json({
    users: store.users.map(serializeUser),
    transactions: store.transactions.map((transaction) => ({
      ...transaction,
      userName: getUserById(transaction.userId)?.name || "Unknown",
    })),
    recentActivities: store.events.slice(-20).reverse(),
    loginAudit: store.loginAudit.slice(0, 12),
    notifications: getScopedNotifications(0, "admin"),
    userRegistrations,
    metrics: {
      totalUsers: store.users.filter((item) => item.role === "user").length,
      activeUsers: new Set(store.loginAudit.filter((item) => item.role === "user").map((item) => item.userId)).size,
      totalTransactions: store.transactions.length,
      totalEvents: store.events.length,
      totalProcessed,
      incomeTransactions: store.transactions.filter((item) => item.type === "income").length,
      expenseTransactions: store.transactions.filter((item) => item.type === "expense").length,
      systemAlerts: getScopedNotifications(0, "admin").length,
    },
  });
});

if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get("*", (req, res, next) => {
    if (isApiRequest(req)) {
      return next();
    }

    return res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((req, res) => {
  if (isApiRequest(req)) {
    return res.status(404).json({ message: "API route not found." });
  }

  return res.status(404).send("Not found");
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON request body." });
  }

  console.error(error);
  return res.status(500).json({ message: "Server error. Please try again." });
});

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
