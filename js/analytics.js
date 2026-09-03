const analyticsState = {
    expenses: [],
    period: "6"
};

const analyticsElements = {
    period: document.getElementById("analyticsPeriod"),
    total: document.getElementById("analyticsTotal"),
    monthlyAverage: document.getElementById("analyticsMonthlyAverage"),
    topCategory: document.getElementById("analyticsTopCategory"),
    highestExpense: document.getElementById("analyticsHighestExpense"),
    totalMeta: document.getElementById("analyticsTotalMeta"),
    averageMeta: document.getElementById("analyticsAverageMeta"),
    topCategoryMeta: document.getElementById("analyticsTopCategoryMeta"),
    highestExpenseMeta: document.getElementById("analyticsHighestExpenseMeta"),
    trendChart: document.getElementById("monthlyTrendChart"),
    categoryBreakdown: document.getElementById("analyticsCategoryBreakdown"),
    monthlyComparison: document.getElementById("monthlyComparison"),
    insights: document.getElementById("analyticsInsights"),
    topExpenses: document.getElementById("topExpensesList"),
    profileName: document.getElementById("profileName"),
    profileAvatar: document.getElementById("profileAvatar"),
    menuToggle: document.getElementById("menuToggle"),
    sidebar: document.getElementById("sidebar"),
    sidebarClose: document.getElementById("sidebarClose"),
    mobileOverlay: document.getElementById("mobileOverlay"),
    toast: document.getElementById("toast"),
    toastIcon: document.getElementById("toastIcon"),
    toastMessage: document.getElementById("toastMessage")
};

function initializeAnalytics() {
    analyticsState.expenses = getExpenses();
    analyticsState.period = analyticsElements.period.value;
    loadProfile();
    setupNavigation();
    setupEvents();
    renderAnalytics();
}

function loadProfile() {
    const profile = getProfile();
    const name = profile.name || "";
    const avatar = profile.avatar || getAvatarLetter(name);

    if (analyticsElements.profileName) {
        analyticsElements.profileName.textContent = name || "Set up profile";
    }

    if (analyticsElements.profileAvatar) {
        analyticsElements.profileAvatar.textContent = avatar;
    }
}

function getAvatarLetter(name) {
    return String(name || "").trim().charAt(0).toUpperCase() || "○";
}

function setupEvents() {
    analyticsElements.period.addEventListener("change", () => {
        analyticsState.period = analyticsElements.period.value;
        renderAnalytics();
    });

    window.addEventListener("storage", () => {
        analyticsState.expenses = getExpenses();
        renderAnalytics();
    });
}

function setupNavigation() {
    if (analyticsElements.menuToggle) {
        analyticsElements.menuToggle.addEventListener("click", () => {
            analyticsElements.sidebar.classList.add("open");
            analyticsElements.mobileOverlay.classList.add("show");
        });
    }

    if (analyticsElements.sidebarClose) {
        analyticsElements.sidebarClose.addEventListener("click", closeSidebar);
    }

    if (analyticsElements.mobileOverlay) {
        analyticsElements.mobileOverlay.addEventListener("click", closeSidebar);
    }

    document.querySelectorAll(".main-nav a").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });
}

function closeSidebar() {
    analyticsElements.sidebar.classList.remove("open");
    analyticsElements.mobileOverlay.classList.remove("show");
}

function renderAnalytics() {
    const expenses = getSelectedExpenses();
    const allExpenses = analyticsState.expenses;

    updateStatistics(expenses, allExpenses);
    renderTrendChart(expenses);
    renderCategoryBreakdown(expenses);
    renderMonthlyComparison(expenses);
    renderInsights(expenses);
    renderTopExpenses(expenses);
}

function getSelectedExpenses() {
    const period = analyticsState.period;

    if (period === "all") {
        return [...analyticsState.expenses];
    }

    const months = Number(period);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    return analyticsState.expenses.filter(expense => {
        const date = new Date(expense.date);
        return date >= start && date <= now;
    });
}

function updateStatistics(expenses, allExpenses) {
    const total = calculateTotal(expenses);
    const months = getActiveMonths(expenses);
    const monthlyAverage = months > 0 ? total / months : 0;
    const categoryTotals = getCategoryTotals(expenses);
    const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const highest = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0];

    analyticsElements.total.textContent = formatCurrency(total);

    analyticsElements.monthlyAverage.textContent = formatCurrency(monthlyAverage);

    if (categories.length) {
        const categoryName = categories[0][0];
        const categoryAmount = categories[0][1];
        const percentage = total > 0 ? Math.round((categoryAmount / total) * 100) : 0;

        analyticsElements.topCategory.textContent = categoryName;
        analyticsElements.topCategoryMeta.textContent = `${formatCurrency(categoryAmount)} · ${percentage}% of spending`;
    } else {
        analyticsElements.topCategory.textContent = "—";
        analyticsElements.topCategoryMeta.textContent = "No category data yet";
    }

    if (highest) {
        analyticsElements.highestExpense.textContent = formatCurrency(Number(highest.amount));
        analyticsElements.highestExpenseMeta.textContent = `${highest.name} · ${formatDate(highest.date)}`;
    } else {
        analyticsElements.highestExpense.textContent = formatCurrency(0);
        analyticsElements.highestExpenseMeta.textContent = "No expenses yet";
    }

    const periodText = getPeriodText();

    analyticsElements.totalMeta.textContent = `${expenses.length} transaction${expenses.length === 1 ? "" : "s"} · ${periodText}`;
    analyticsElements.averageMeta.textContent = months
        ? `${months} active month${months === 1 ? "" : "s"} in selected period`
        : "Add expenses to calculate";
}

function getActiveMonths(expenses) {
    if (!expenses.length) {
        return 0;
    }

    const months = new Set();

    expenses.forEach(expense => {
        const date = new Date(expense.date);
        if (!Number.isNaN(date.getTime())) {
            months.add(`${date.getFullYear()}-${date.getMonth()}`);
        }
    });

    return months.size;
}

function renderTrendChart(expenses) {
    const months = getMonthlyData(expenses);

    if (!months.length || months.every(item => item.amount === 0)) {
        analyticsElements.trendChart.innerHTML = `
            <div class="analytics-empty-chart">
                <span>No spending data yet</span>
                <small>Add expenses to see your monthly trend.</small>
            </div>
        `;
        return;
    }

    const maxAmount = Math.max(...months.map(item => item.amount), 1);

    analyticsElements.trendChart.innerHTML = `
        <div class="trend-chart-content">
            <div class="trend-bars">
                ${months.map(item => {
                    const height = item.amount > 0 ? Math.max((item.amount / maxAmount) * 100, 3) : 0;

                    return `
                        <div class="trend-column">
                            <span class="trend-value">${formatCompactCurrency(item.amount)}</span>
                            <div class="trend-bar-track">
                                <div class="trend-bar" style="height:${height}%"></div>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
            <div class="trend-labels">
                ${months.map(item => `
                    <span class="trend-label">${item.label}</span>
                `).join("")}
            </div>
        </div>
    `;
}

function getMonthlyData(expenses) {
    const period = analyticsState.period === "all"
        ? getAllMonths(expenses)
        : Number(analyticsState.period);

    const count = analyticsState.period === "all"
        ? Math.max(getAllMonths(expenses).length, 1)
        : period;

    const now = new Date();
    const result = [];

    for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        const amount = expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
            })
            .reduce((sum, expense) => sum + Number(expense.amount), 0);

        result.push({
            key: `${year}-${month}`,
            label: date.toLocaleDateString("en-IN", { month: "short" }),
            amount
        });
    }

    return result;
}

function getAllMonths(expenses) {
    if (!expenses.length) {
        return [];
    }

    const timestamps = expenses
        .map(expense => new Date(expense.date).getTime())
        .filter(time => !Number.isNaN(time));

    if (!timestamps.length) {
        return [];
    }

    const earliest = new Date(Math.min(...timestamps));
    const latest = new Date(Math.max(...timestamps));

    const months = [];
    const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const end = new Date(latest.getFullYear(), latest.getMonth(), 1);

    while (cursor <= end) {
        months.push(new Date(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
}

function renderCategoryBreakdown(expenses) {
    const totals = getCategoryTotals(expenses);
    const entries = Object.entries(totals)
        .filter(([, amount]) => amount > 0)
        .sort((a, b) => b[1] - a[1]);

    if (!entries.length) {
        analyticsElements.categoryBreakdown.innerHTML = `
            <div class="analytics-empty">
                <span>No category data yet</span>
                <small>Add expenses to see your category breakdown.</small>
            </div>
        `;
        return;
    }

    const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
    const max = entries[0][1];

    analyticsElements.categoryBreakdown.innerHTML = entries.map(([category, amount]) => {
        const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
        const width = Math.max((amount / max) * 100, 3);

        return `
            <div class="category-row">
                <span class="category-name">${escapeHTML(category)}</span>
                <div class="category-progress">
                    <div class="category-progress-fill" style="width:${width}%"></div>
                </div>
                <span class="category-amount">${formatCurrency(amount)} · ${percentage}%</span>
            </div>
        `;
    }).join("");
}

function renderMonthlyComparison(expenses) {
    const months = getMonthlyData(expenses);

    if (!months.length || months.every(item => item.amount === 0)) {
        analyticsElements.monthlyComparison.innerHTML = `
            <div class="analytics-empty">
                <span>No monthly data yet</span>
                <small>Your monthly comparison will appear here.</small>
            </div>
        `;
        return;
    }

    const max = Math.max(...months.map(item => item.amount), 1);

    analyticsElements.monthlyComparison.innerHTML = months
        .slice(-6)
        .reverse()
        .map(item => {
            const width = item.amount > 0 ? Math.max((item.amount / max) * 100, 3) : 0;

            return `
                <div class="month-comparison-row">
                    <span class="month-comparison-label">${item.label}</span>
                    <div class="month-comparison-track">
                        <div class="month-comparison-fill" style="width:${width}%"></div>
                    </div>
                    <span class="month-comparison-amount">${formatCurrency(item.amount)}</span>
                </div>
            `;
        }).join("");
}

function renderInsights(expenses) {
    if (!expenses.length) {
        analyticsElements.insights.innerHTML = `
            <div class="analytics-insight">
                <span class="insight-number">01</span>
                <div>
                    <strong>Start tracking</strong>
                    <p>Add expenses to unlock personalized spending insights.</p>
                </div>
            </div>
        `;
        return;
    }

    const insights = generateInsights(expenses);

    analyticsElements.insights.innerHTML = insights.map((insight, index) => `
        <div class="analytics-insight">
            <span class="insight-number">${String(index + 1).padStart(2, "0")}</span>
            <div>
                <strong>${escapeHTML(insight.title)}</strong>
                <p>${escapeHTML(insight.text)}</p>
            </div>
        </div>
    `).join("");
}

function generateInsights(expenses) {
    const insights = [];
    const total = calculateTotal(expenses);
    const categories = Object.entries(getCategoryTotals(expenses))
        .sort((a, b) => b[1] - a[1]);

    const highest = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0];

    if (categories.length) {
        const [category, amount] = categories[0];
        const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;

        insights.push({
            title: `${category} is your biggest category`,
            text: `${formatCurrency(amount)} of your spending goes toward ${category}, which is ${percentage}% of the selected period.`
        });
    }

    if (highest) {
        insights.push({
            title: "Watch your largest transaction",
            text: `${highest.name} was your highest individual expense at ${formatCurrency(Number(highest.amount))}.`
        });
    }

    const monthly = getMonthlyData(expenses).filter(item => item.amount > 0);

    if (monthly.length >= 2) {
        const latest = monthly[monthly.length - 1];
        const previous = monthly[monthly.length - 2];

        if (previous.amount > 0) {
            const change = ((latest.amount - previous.amount) / previous.amount) * 100;

            if (change > 10) {
                insights.push({
                    title: "Spending increased",
                    text: `Your latest month is ${Math.round(change)}% higher than the previous month.`
                });
            } else if (change < -10) {
                insights.push({
                    title: "Spending decreased",
                    text: `Your latest month is ${Math.abs(Math.round(change))}% lower than the previous month.`
                });
            } else {
                insights.push({
                    title: "Spending is fairly stable",
                    text: "Your latest monthly spending is close to the previous month's level."
                });
            }
        }
    }

    const average = calculateAverage(expenses);

    if (average > 0) {
        insights.push({
            title: "Your typical transaction",
            text: `Across ${expenses.length} transaction${expenses.length === 1 ? "" : "s"}, your average expense is ${formatCurrency(average)}.`
        });
    }

    return insights.slice(0, 4);
}

function renderTopExpenses(expenses) {
    const topExpenses = [...expenses]
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5);

    if (!topExpenses.length) {
        analyticsElements.topExpenses.innerHTML = `
            <div class="analytics-empty">
                <span>No expenses to display</span>
                <small>Your largest transactions will appear here.</small>
            </div>
        `;
        return;
    }

    analyticsElements.topExpenses.innerHTML = topExpenses.map(expense => `
        <div class="top-expense-item">
            <div class="top-expense-main">
                <span class="top-expense-name">${escapeHTML(expense.name)}</span>
                <div class="top-expense-meta">
                    <span class="top-expense-category">${escapeHTML(expense.category)}</span>
                    <span>${formatDate(expense.date)}</span>
                </div>
            </div>
            <span class="top-expense-amount">${formatCurrency(Number(expense.amount))}</span>
        </div>
    `).join("");
}

function getPeriodText() {
    if (analyticsState.period === "all") {
        return "all time";
    }

    const months = Number(analyticsState.period);
    return `last ${months} month${months === 1 ? "" : "s"}`;
}

function formatCompactCurrency(amount) {
    const value = Number(amount) || 0;

    if (value >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
    }

    if (value >= 1000) {
        return `₹${(value / 1000).toFixed(1)}K`;
    }

    return `₹${Math.round(value)}`;
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", initializeAnalytics);