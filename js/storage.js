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
        const value = localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);
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

    if (!Array.isArray(expenses)) {
        return [];
    }

    return expenses.filter(expense =>
        expense &&
        typeof expense === "object" &&
        typeof expense.name === "string" &&
        Number.isFinite(Number(expense.amount)) &&
        typeof expense.date === "string"
    );
}

function saveExpenses(expenses) {
    return writeStorage(STORAGE_KEYS.expenses, Array.isArray(expenses) ? expenses : []);
}

function addExpense(expense) {
    const expenses = getExpenses();

    const newExpense = {
        id: generateId(),
        name: String(expense.name || "").trim(),
        amount: Number(expense.amount) || 0,
        category: String(expense.category || "Other"),
        date: expense.date || getTodayDate(),
        note: String(expense.note || "").trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    saveExpenses(expenses);

    return newExpense;
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
        amount: Number(updatedData.amount ?? expenses[index].amount) || 0,
        name: String(updatedData.name ?? expenses[index].name).trim(),
        category: String(updatedData.category ?? expenses[index].category),
        date: updatedData.date ?? expenses[index].date,
        note: String(updatedData.note ?? expenses[index].note).trim(),
        updatedAt: new Date().toISOString()
    };

    saveExpenses(expenses);

    return expenses[index];
}

function deleteExpense(id) {
    const expenses = getExpenses();
    const filteredExpenses = expenses.filter(expense => expense.id !== id);

    if (filteredExpenses.length === expenses.length) {
        return false;
    }

    saveExpenses(filteredExpenses);
    return true;
}

function clearExpenses() {
    return saveExpenses([]);
}

function getProfile() {
    const profile = readStorage(STORAGE_KEYS.profile, DEFAULT_PROFILE);

    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
        return { ...DEFAULT_PROFILE };
    }

    return {
        ...DEFAULT_PROFILE,
        ...profile
    };
}

function saveProfile(profile) {
    const cleanProfile = {
        ...DEFAULT_PROFILE,
        ...profile,
        name: String(profile.name || DEFAULT_PROFILE.name).trim(),
        email: String(profile.email || "").trim(),
        college: String(profile.college || "").trim(),
        course: String(profile.course || DEFAULT_PROFILE.course).trim(),
        avatar: String(profile.avatar || DEFAULT_PROFILE.avatar).trim().charAt(0).toUpperCase()
    };

    return writeStorage(STORAGE_KEYS.profile, cleanProfile);
}

function getSettings() {
    const settings = readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);

    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
        return { ...DEFAULT_SETTINGS };
    }

    const validCurrencies = [
        "INR",
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "AUD",
        "CAD"
    ];

    const validThemes = [
        "system",
        "light",
        "dark"
    ];

    return {
        currency: validCurrencies.includes(settings.currency)
            ? settings.currency
            : DEFAULT_SETTINGS.currency,
        theme: validThemes.includes(settings.theme)
            ? settings.theme
            : DEFAULT_SETTINGS.theme,
        notifications: settings.notifications !== false
    };
}

function saveSettings(settings) {
    const cleanSettings = {
        currency: settings.currency || DEFAULT_SETTINGS.currency,
        theme: settings.theme || DEFAULT_SETTINGS.theme,
        notifications: settings.notifications !== false
    };

    return writeStorage(STORAGE_KEYS.settings, cleanSettings);
}

function exportAppData() {
    return {
        app: "Spendly",
        version: 1,
        exportedAt: new Date().toISOString(),
        expenses: getExpenses(),
        profile: getProfile(),
        settings: getSettings()
    };
}

function importAppData(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid backup");
    }

    if (!Array.isArray(data.expenses)) {
        throw new Error("Invalid expenses");
    }

    if (!data.profile || typeof data.profile !== "object") {
        throw new Error("Invalid profile");
    }

    if (!data.settings || typeof data.settings !== "object") {
        throw new Error("Invalid settings");
    }

    const cleanExpenses = data.expenses
        .filter(expense =>
            expense &&
            typeof expense === "object" &&
            typeof expense.name === "string" &&
            Number.isFinite(Number(expense.amount)) &&
            typeof expense.date === "string"
        )
        .map(expense => ({
            id: expense.id || generateId(),
            name: String(expense.name).trim(),
            amount: Number(expense.amount) || 0,
            category: String(expense.category || "Other"),
            date: expense.date,
            note: String(expense.note || "").trim(),
            createdAt: expense.createdAt || new Date().toISOString(),
            updatedAt: expense.updatedAt || new Date().toISOString()
        }));

    const importedProfile = {
        ...DEFAULT_PROFILE,
        ...data.profile
    };

    const importedSettings = {
        ...DEFAULT_SETTINGS,
        ...data.settings
    };

    saveExpenses(cleanExpenses);
    saveProfile(importedProfile);
    saveSettings(importedSettings);

    return true;
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

function formatCurrency(amount, currency) {
    const settings = getSettings();
    const selectedCurrency = currency || settings.currency || "INR";
    const value = Number(amount) || 0;

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: selectedCurrency,
            maximumFractionDigits: selectedCurrency === "JPY" ? 0 : 2
        }).format(value);
    } catch (error) {
        return `${selectedCurrency} ${value.toFixed(2)}`;
    }
}

function formatDate(dateString) {
    if (!dateString) {
        return "—";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function isCurrentMonth(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    return (
        !Number.isNaN(date.getTime()) &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );
}

function calculateTotal(expenses) {
    return expenses.reduce((total, expense) => {
        return total + (Number(expense.amount) || 0);
    }, 0);
}

function calculateMonthlyTotal(expenses) {
    return expenses
        .filter(expense => isCurrentMonth(expense.date))
        .reduce((total, expense) => {
            return total + (Number(expense.amount) || 0);
        }, 0);
}

function calculateAverage(expenses) {
    if (!expenses.length) {
        return 0;
    }

    return calculateTotal(expenses) / expenses.length;
}

function getCategoryTotals(expenses) {
    return expenses.reduce((totals, expense) => {
        const category = expense.category || "Other";
        const amount = Number(expense.amount) || 0;

        totals[category] = (totals[category] || 0) + amount;

        return totals;
    }, {});
}

function generateId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getTodayDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}