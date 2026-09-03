const STORAGE_KEYS = {
    expenses: "spendly_expenses",
    profile: "spendly_profile",
    settings: "spendly_settings"
};

const DEFAULT_PROFILE = {
    name: "Wish",
    email: "",
    college: "",
    course: "B.Tech Information Technology",
    avatar: "W"
};

const DEFAULT_SETTINGS = {
    currency: "INR",
    theme: "system",
    notifications: true
};

function readStorage(key, fallback) {
    try {
        const stored = localStorage.getItem(key);

        if (!stored) {
            return fallback;
        }

        return JSON.parse(stored);
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        return false;
    }
}

function getExpenses() {
    const expenses = readStorage(STORAGE_KEYS.expenses, []);

    return Array.isArray(expenses) ? expenses : [];
}

function saveExpenses(expenses) {
    if (!Array.isArray(expenses)) {
        return false;
    }

    return writeStorage(STORAGE_KEYS.expenses, expenses);
}

function addExpense(expense) {
    const expenses = getExpenses();

    const newExpense = {
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: String(expense.name || "").trim(),
        amount: Number(expense.amount),
        category: String(expense.category || "Other"),
        date: expense.date,
        note: String(expense.note || "").trim(),
        createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);

    return saveExpenses(expenses) ? newExpense : null;
}

function getExpenseById(id) {
    return getExpenses().find(expense => expense.id === id) || null;
}

function updateExpense(id, updatedData) {
    const expenses = getExpenses();

    const index = expenses.findIndex(expense => expense.id === id);

    if (index === -1) {
        return null;
    }

    expenses[index] = {
        ...expenses[index],
        ...updatedData,
        id: expenses[index].id,
        updatedAt: new Date().toISOString()
    };

    return saveExpenses(expenses) ? expenses[index] : null;
}

function deleteExpense(id) {
    const expenses = getExpenses();

    const filteredExpenses = expenses.filter(
        expense => expense.id !== id
    );

    if (filteredExpenses.length === expenses.length) {
        return false;
    }

    return saveExpenses(filteredExpenses);
}

function clearExpenses() {
    try {
        localStorage.removeItem(STORAGE_KEYS.expenses);
        return true;
    } catch (error) {
        return false;
    }
}

function getProfile() {
    const profile = readStorage(
        STORAGE_KEYS.profile,
        DEFAULT_PROFILE
    );

    return {
        ...DEFAULT_PROFILE,
        ...(profile && typeof profile === "object" ? profile : {})
    };
}

function saveProfile(profile) {
    if (!profile || typeof profile !== "object") {
        return false;
    }

    const updatedProfile = {
        ...DEFAULT_PROFILE,
        ...profile
    };

    return writeStorage(
        STORAGE_KEYS.profile,
        updatedProfile
    );
}

function getSettings() {
    const settings = readStorage(
        STORAGE_KEYS.settings,
        DEFAULT_SETTINGS
    );

    return {
        ...DEFAULT_SETTINGS,
        ...(settings && typeof settings === "object" ? settings : {})
    };
}

function saveSettings(settings) {
    if (!settings || typeof settings !== "object") {
        return false;
    }

    const updatedSettings = {
        ...DEFAULT_SETTINGS,
        ...settings
    };

    return writeStorage(
        STORAGE_KEYS.settings,
        updatedSettings
    );
}

function exportAppData() {
    return {
        app: "Spendly",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        expenses: getExpenses(),
        profile: getProfile(),
        settings: getSettings()
    };
}

function importAppData(data) {
    if (!data || typeof data !== "object") {
        return {
            success: false,
            message: "Invalid data format."
        };
    }

    if (!Array.isArray(data.expenses)) {
        return {
            success: false,
            message: "Expense data is missing or invalid."
        };
    }

    const validExpenses = data.expenses.filter(expense => {
        return (
            expense &&
            typeof expense === "object" &&
            typeof expense.name === "string" &&
            Number.isFinite(Number(expense.amount)) &&
            Number(expense.amount) > 0 &&
            typeof expense.category === "string" &&
            typeof expense.date === "string"
        );
    });

    const expensesWithIds = validExpenses.map(expense => ({
        ...expense,
        id: expense.id || (
            crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`
        )
    }));

    const expensesSaved = saveExpenses(expensesWithIds);

    if (!expensesSaved) {
        return {
            success: false,
            message: "Unable to save imported expenses."
        };
    }

    if (data.profile && typeof data.profile === "object") {
        saveProfile(data.profile);
    }

    if (data.settings && typeof data.settings === "object") {
        saveSettings(data.settings);
    }

    return {
        success: true,
        importedExpenses: expensesWithIds.length
    };
}

function resetAppData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.expenses);
        localStorage.removeItem(STORAGE_KEYS.profile);
        localStorage.removeItem(STORAGE_KEYS.settings);

        return true;
    } catch (error) {
        return false;
    }
}

function formatCurrency(amount, currency = "INR") {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return "₹0";
    }

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 2
        }).format(numericAmount);
    } catch (error) {
        return `₹${numericAmount.toFixed(2)}`;
    }
}

function formatDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function isCurrentMonth(dateString) {
    if (!dateString) {
        return false;
    }

    const date = new Date(`${dateString}T00:00:00`);
    const now = new Date();

    return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
}

function calculateTotal(expenses) {
    if (!Array.isArray(expenses)) {
        return 0;
    }

    return expenses.reduce((total, expense) => {
        const amount = Number(expense.amount);

        return total + (
            Number.isFinite(amount) && amount > 0
                ? amount
                : 0
        );
    }, 0);
}

function calculateMonthlyTotal(expenses) {
    if (!Array.isArray(expenses)) {
        return 0;
    }

    return calculateTotal(
        expenses.filter(expense => isCurrentMonth(expense.date))
    );
}

function calculateAverage(expenses) {
    if (!Array.isArray(expenses) || expenses.length === 0) {
        return 0;
    }

    return calculateTotal(expenses) / expenses.length;
}

function getCategoryTotals(expenses) {
    const totals = {};

    if (!Array.isArray(expenses)) {
        return totals;
    }

    expenses.forEach(expense => {
        const category = expense.category || "Other";
        const amount = Number(expense.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return;
        }

        totals[category] = (totals[category] || 0) + amount;
    });

    return totals;
}