const dashboardState = {
    expenses: [],
    profile: {},
    settings: {}
};

const dashboardElements = {
    totalSpent: document.getElementById("totalSpent"),
    monthlySpent: document.getElementById("monthlySpent"),
    transactionCount: document.getElementById("transactionCount"),
    averageExpense: document.getElementById("averageExpense"),
    recentExpenses: document.getElementById("recentExpenses"),
    categoryList: document.getElementById("categoryList"),
    spendingChart: document.getElementById("spendingChart"),
    spendingInsightTitle: document.getElementById("spendingInsightTitle"),
    spendingInsightText: document.getElementById("spendingInsightText"),
    profileName: document.getElementById("profileName"),
    profileAvatar: document.getElementById("profileAvatar"),
    currentDate: document.getElementById("currentDate")
};

function initializeDashboard() {
    dashboardState.expenses = getExpenses();
    dashboardState.profile = getProfile();
    dashboardState.settings = getSettings();

    applyDashboardTheme();
    updateProfile();
    updateCurrentDate();
    updateSummary();
    renderRecentExpenses();
    renderCategoryBreakdown();
    renderSpendingChart();
    renderInsight();
    setupMobileNavigation();
    listenForStorageChanges();
}

function applyDashboardTheme() {
    const theme = dashboardState.settings.theme || "system";

    if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        return;
    }

    if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        return;
    }

    document.documentElement.removeAttribute("data-theme");
}

function updateProfile() {
    const profile = dashboardState.profile;
    const name = profile.name || "";
    const avatar = profile.avatar || getAvatarLetter(name);

    if (dashboardElements.profileName) {
        dashboardElements.profileName.textContent = name || "Set up profile";
    }

    if (dashboardElements.profileAvatar) {
        dashboardElements.profileAvatar.textContent = avatar;
    }
}

function getAvatarLetter(name) {
    return String(name || "").trim().charAt(0).toUpperCase() || "○";
}

function updateCurrentDate() {
    if (!dashboardElements.currentDate) {
        return;
    }

    const now = new Date();

    dashboardElements.currentDate.textContent = now.toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}

function updateSummary() {
    const expenses = dashboardState.expenses;

    const total = calculateTotal(expenses);
    const monthly = calculateMonthlyTotal(expenses);
    const average = calculateAverage(expenses);

    if (dashboardElements.totalSpent) {
        dashboardElements.totalSpent.textContent = formatCurrency(total);
    }

    if (dashboardElements.monthlySpent) {
        dashboardElements.monthlySpent.textContent = formatCurrency(monthly);
    }

    if (dashboardElements.transactionCount) {
        dashboardElements.transactionCount.textContent = expenses.length.toLocaleString(
            "en-IN"
        );
    }

    if (dashboardElements.averageExpense) {
        dashboardElements.averageExpense.textContent = formatCurrency(average);
    }
}

function renderRecentExpenses() {
    const container = dashboardElements.recentExpenses;

    if (!container) {
        return;
    }

    const expenses = [...dashboardState.expenses]
        .sort((a, b) => {
            const dateDifference =
                new Date(b.date).getTime() - new Date(a.date).getTime();

            if (dateDifference !== 0) {
                return dateDifference;
            }

            return (
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
            );
        })
        .slice(0, 5);

    if (!expenses.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">+</div>
                <h3>No expenses yet</h3>
                <p>Add your first expense to start tracking where your money goes.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = expenses
        .map(expense => {
            return `
                <div class="recent-expense">
                    <div class="recent-expense-main">
                        <div class="recent-expense-name">${escapeHTML(expense.name)}</div>
                        <div class="recent-expense-meta">
                            ${escapeHTML(expense.category || "Other")} · ${formatDate(expense.date)}
                        </div>
                    </div>
                    <div class="recent-expense-amount">
                        ${formatCurrency(expense.amount)}
                    </div>
                </div>
            `;
        })
        .join("");
}

function renderCategoryBreakdown() {
    const container = dashboardElements.categoryList;

    if (!container) {
        return;
    }

    const totals = getCategoryTotals(dashboardState.expenses);

    const categories = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    if (!categories.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">—</div>
                <h3>No category data</h3>
                <p>Your category breakdown will appear here after you add expenses.</p>
            </div>
        `;
        return;
    }

    const maximum = categories[0][1];

    container.innerHTML = categories
        .map(([category, amount]) => {
            const percentage =
                maximum > 0 ? Math.max(4, (amount / maximum) * 100) : 0;

            return `
                <div class="category-item">
                    <span class="category-item-name">${escapeHTML(category)}</span>
                    <span class="category-item-amount">${formatCurrency(amount)}</span>
                    <div class="category-progress">
                        <div
                            class="category-progress-fill"
                            style="width: ${percentage}%"
                        ></div>
                    </div>
                </div>
            `;
        })
        .join("");
}

function renderSpendingChart() {
    const container = dashboardElements.spendingChart;

    if (!container) {
        return;
    }

    const months = getLastSixMonths();
    const totals = months.map(month => {
        return dashboardState.expenses
            .filter(expense => {
                const date = new Date(expense.date);

                return (
                    !Number.isNaN(date.getTime()) &&
                    date.getMonth() === month.month &&
                    date.getFullYear() === month.year
                );
            })
            .reduce((sum, expense) => {
                return sum + (Number(expense.amount) || 0);
            }, 0);
    });

    const maximum = Math.max(...totals, 0);

    if (maximum === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">—</div>
                <h3>No spending history</h3>
                <p>Add expenses to see your spending trend across the last six months.</p>
            </div>
        `;
        return;
    }

    const chartHeight = 220;

    container.innerHTML = `
        <div style="display:flex;align-items:flex-end;gap:14px;height:${chartHeight}px;width:100%;padding:10px 4px 0;">
            ${totals
                .map((total, index) => {
                    const height =
                        total > 0
                            ? Math.max(8, (total / maximum) * 170)
                            : 4;

                    return `
                        <div style="display:flex;flex:1;height:100%;min-width:0;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;">
                            <div style="font-size:9px;color:var(--text-secondary);white-space:nowrap;">
                                ${total > 0 ? formatCompactCurrency(total) : ""}
                            </div>
                            <div style="display:flex;width:100%;height:180px;align-items:flex-end;justify-content:center;">
                                <div
                                    style="
                                        width:min(34px,70%);
                                        height:${height}px;
                                        border-radius:5px 5px 2px 2px;
                                        background:${index === totals.length - 1 ? "var(--primary)" : "var(--primary-soft)"};
                                        border:1px solid ${index === totals.length - 1 ? "var(--primary)" : "var(--border)"};
                                        transition:height 220ms ease;
                                    "
                                    title="${months[index].label}: ${formatCurrency(total)}"
                                ></div>
                            </div>
                            <div style="font-size:10px;color:var(--text-muted);">
                                ${months[index].shortLabel}
                            </div>
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;
}

function renderInsight() {
    if (
        !dashboardElements.spendingInsightTitle ||
        !dashboardElements.spendingInsightText
    ) {
        return;
    }

    const expenses = dashboardState.expenses;

    if (!expenses.length) {
        dashboardElements.spendingInsightTitle.textContent =
            "Start with one expense";
        dashboardElements.spendingInsightText.textContent =
            "Once you add a few transactions, Spendly will highlight your biggest spending patterns here.";
        return;
    }

    const categoryTotals = getCategoryTotals(expenses);
    const categoryEntries = Object.entries(categoryTotals).sort(
        (a, b) => b[1] - a[1]
    );

    const total = calculateTotal(expenses);
    const monthly = calculateMonthlyTotal(expenses);

    if (categoryEntries.length) {
        const [topCategory, topAmount] = categoryEntries[0];
        const percentage = total > 0 ? (topAmount / total) * 100 : 0;

        dashboardElements.spendingInsightTitle.textContent =
            `${topCategory} is your biggest category`;

        dashboardElements.spendingInsightText.textContent =
            `${formatCurrency(topAmount)} of your tracked spending is in ${topCategory}, which is about ${Math.round(percentage)}% of your total expenses.`;
        return;
    }

    dashboardElements.spendingInsightTitle.textContent =
        "Your spending is being tracked";

    dashboardElements.spendingInsightText.textContent =
        `You have spent ${formatCurrency(monthly)} this month across ${expenses.length} recorded transaction${expenses.length === 1 ? "" : "s"}.`;
}

function getLastSixMonths() {
    const now = new Date();
    const months = [];

    for (let index = 5; index >= 0; index -= 1) {
        const date = new Date(
            now.getFullYear(),
            now.getMonth() - index,
            1
        );

        months.push({
            month: date.getMonth(),
            year: date.getFullYear(),
            label: date.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric"
            }),
            shortLabel: date.toLocaleDateString("en-IN", {
                month: "short"
            })
        });
    }

    return months;
}

function formatCompactCurrency(amount) {
    const value = Number(amount) || 0;
    const currency = dashboardState.settings.currency || "INR";

    if (value >= 100000) {
        return `${currency} ${(value / 100000).toFixed(1)}L`;
    }

    if (value >= 1000) {
        return `${currency} ${(value / 1000).toFixed(1)}K`;
    }

    return formatCurrency(value);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function setupMobileNavigation() {
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    const sidebarClose = document.querySelector(".sidebar-close");
    let overlay = document.querySelector(".mobile-overlay");

    if (!menuToggle || !sidebar) {
        return;
    }

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "mobile-overlay";
        document.body.appendChild(overlay);
    }

    const openMenu = () => {
        sidebar.classList.add("open");
        overlay.classList.add("show");
        document.body.style.overflow = "hidden";
    };

    const closeMenu = () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        document.body.style.overflow = "";
    };

    menuToggle.addEventListener("click", openMenu);
    overlay.addEventListener("click", closeMenu);

    if (sidebarClose) {
        sidebarClose.addEventListener("click", closeMenu);
    }

    sidebar.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });
}

function listenForStorageChanges() {
    window.addEventListener("storage", event => {
        if (
            event.key === STORAGE_KEYS.expenses ||
            event.key === STORAGE_KEYS.profile ||
            event.key === STORAGE_KEYS.settings
        ) {
            dashboardState.expenses = getExpenses();
            dashboardState.profile = getProfile();
            dashboardState.settings = getSettings();

            applyDashboardTheme();
            updateProfile();
            updateSummary();
            renderRecentExpenses();
            renderCategoryBreakdown();
            renderSpendingChart();
            renderInsight();
        }
    });
}

document.addEventListener("DOMContentLoaded", initializeDashboard);
