const appState = {
    expenses: getExpenses(),
    editingExpenseId: null
};

const elements = {
    totalSpent: document.getElementById("totalSpent"),
    monthlySpent: document.getElementById("monthlySpent"),
    transactionCount: document.getElementById("transactionCount"),
    averageExpense: document.getElementById("averageExpense"),
    recentExpenses: document.getElementById("recentExpenses"),
    categoryList: document.getElementById("categoryList"),
    spendingChart: document.getElementById("spendingChart"),
    spendingInsightTitle: document.getElementById("spendingInsightTitle"),
    spendingInsightText: document.getElementById("spendingInsightText"),
    expenseModal: document.getElementById("expenseModal"),
    expenseForm: document.getElementById("expenseForm"),
    expenseName: document.getElementById("expenseName"),
    expenseAmount: document.getElementById("expenseAmount"),
    expenseCategory: document.getElementById("expenseCategory"),
    expenseDate: document.getElementById("expenseDate"),
    expenseNote: document.getElementById("expenseNote"),
    toast: document.getElementById("toast"),
    toastIcon: document.getElementById("toastIcon"),
    toastMessage: document.getElementById("toastMessage")
};

function initializeDashboard() {
    setupDate();
    setupProfile();
    setupNavigation();
    setupModal();
    setupExpenseForm();
    renderDashboard();
}

function setupDate() {
    const dateElement = document.getElementById("currentDate");

    if (!dateElement) {
        return;
    }

    dateElement.textContent = new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date());
}

function setupProfile() {
    const profile = getProfile();
    const profileName = document.getElementById("profileName");
    const profileAvatar = document.getElementById("profileAvatar");
    const welcomeName = document.getElementById("welcomeName");
    const profileLink = document.querySelector(".profile-button");
    const name = profile.name || "";

    if (profileName) {
        profileName.textContent = name || "Set up profile";
    }

    if (welcomeName) {
        welcomeName.textContent = name || "Welcome to Spendly";
    }

    if (profileAvatar) {
        profileAvatar.textContent = profile.avatar || getInitials(name);
    }

    if (profileLink) {
        profileLink.setAttribute("aria-label", name ? "Open profile" : "Set up profile");
    }
}

function getInitials(name) {
    if (!name) {
        return "○";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("") || "○";
}

function setupModal() {
    const openButtons = document.querySelectorAll("[data-open-expense]");
    const closeButtons = document.querySelectorAll("[data-close-expense]");

    openButtons.forEach(button => {
        button.addEventListener("click", () => {
            openExpenseModal();
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener("click", () => {
            closeExpenseModal();
        });
    });

    if (elements.expenseModal) {
        elements.expenseModal.addEventListener("click", event => {
            if (event.target === elements.expenseModal) {
                closeExpenseModal();
            }
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && elements.expenseModal?.classList.contains("show")) {
            closeExpenseModal();
        }
    });
}

function setupNavigation() {
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const sidebarClose = document.getElementById("sidebarClose");
    const mobileOverlay = document.getElementById("mobileOverlay");

    const closeSidebar = () => {
        sidebar?.classList.remove("open");
        mobileOverlay?.classList.remove("show");
    };

    menuToggle?.addEventListener("click", () => {
        sidebar?.classList.add("open");
        mobileOverlay?.classList.add("show");
    });
    sidebarClose?.addEventListener("click", closeSidebar);
    mobileOverlay?.addEventListener("click", closeSidebar);
    document.querySelectorAll(".main-nav a").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });
}

function openExpenseModal(expense = null) {
    if (!elements.expenseModal || !elements.expenseForm) {
        return;
    }

    clearValidation();

    appState.editingExpenseId = expense ? expense.id : null;

    const title = elements.expenseModal.querySelector("[data-modal-title]");
    const submitButton = elements.expenseModal.querySelector("[data-expense-submit]");

    if (title) {
        title.textContent = expense ? "Edit expense" : "Add expense";
    }

    if (submitButton) {
        submitButton.textContent = expense ? "Save changes" : "Add expense";
    }

    elements.expenseForm.reset();

    if (expense) {
        elements.expenseName.value = expense.name || "";
        elements.expenseAmount.value = expense.amount || "";
        elements.expenseCategory.value = expense.category || "";
        elements.expenseDate.value = expense.date || "";
        elements.expenseNote.value = expense.note || "";
    } else {
        elements.expenseDate.value = getTodayDate();
    }

    elements.expenseModal.classList.add("show");
    document.body.classList.add("modal-open");

    setTimeout(() => {
        elements.expenseName?.focus();
    }, 100);
}

function closeExpenseModal() {
    if (!elements.expenseModal) {
        return;
    }

    elements.expenseModal.classList.remove("show");
    document.body.classList.remove("modal-open");
    appState.editingExpenseId = null;
    clearValidation();
}

function setupExpenseForm() {
    if (!elements.expenseForm) {
        return;
    }

    elements.expenseForm.addEventListener("submit", event => {
        event.preventDefault();

        const expense = getFormExpense();

        if (!validateExpense(expense)) {
            return;
        }

        if (appState.editingExpenseId) {
            updateExpense(appState.editingExpenseId, expense);
            showToast("Expense updated successfully", "✓");
        } else {
            addExpense(expense);
            showToast("Expense added successfully", "✓");
        }

        appState.expenses = getExpenses();
        renderDashboard();
        closeExpenseModal();
    });
}

function getFormExpense() {
    return {
        name: elements.expenseName?.value.trim() || "",
        amount: Number(elements.expenseAmount?.value || 0),
        category: elements.expenseCategory?.value || "",
        date: elements.expenseDate?.value || "",
        note: elements.expenseNote?.value.trim() || ""
    };
}

function validateExpense(expense) {
    clearValidation();

    let valid = true;

    if (!expense.name) {
        showFieldError("expenseNameError", "Please enter an expense name.");
        valid = false;
    }

    if (!expense.amount || expense.amount <= 0) {
        showFieldError("expenseAmountError", "Enter an amount greater than zero.");
        valid = false;
    }

    if (!expense.category) {
        showFieldError("expenseCategoryError", "Please select a category.");
        valid = false;
    }

    if (!expense.date) {
        showFieldError("expenseDateError", "Please select a date.");
        valid = false;
    }

    return valid;
}

function showFieldError(id, message) {
    const errorElement = document.getElementById(id);

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add("visible");
    }
}

function clearValidation() {
    document.querySelectorAll(".field-error").forEach(element => {
        element.textContent = "";
        element.classList.remove("visible");
    });
}

function renderDashboard() {
    appState.expenses = getExpenses();

    renderSummary();
    renderRecentExpenses();
    renderCategories();
    renderChart();
    renderInsight();
}

function renderSummary() {
    const total = calculateTotal(appState.expenses);
    const monthly = calculateMonthlyTotal(appState.expenses);
    const count = appState.expenses.length;
    const average = calculateAverage(appState.expenses);

    if (elements.totalSpent) {
        elements.totalSpent.textContent = formatCurrency(total);
    }

    if (elements.monthlySpent) {
        elements.monthlySpent.textContent = formatCurrency(monthly);
    }

    if (elements.transactionCount) {
        elements.transactionCount.textContent = count.toLocaleString("en-IN");
    }

    if (elements.averageExpense) {
        elements.averageExpense.textContent = formatCurrency(average);
    }
}

function renderRecentExpenses() {
    if (!elements.recentExpenses) {
        return;
    }

    const expenses = [...appState.expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);

    if (!expenses.length) {
        elements.recentExpenses.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">₹</div>
                <h3>No expenses yet</h3>
                <p>Add your first expense to start tracking your spending.</p>
            </div>
        `;
        return;
    }

    elements.recentExpenses.innerHTML = expenses.map(expense => `
        <div class="expense-row">
            <div class="expense-main">
                <div class="category-icon ${getCategoryClass(expense.category)}">
                    ${getCategoryIcon(expense.category)}
                </div>
                <div class="expense-info">
                    <strong>${escapeHTML(expense.name)}</strong>
                    <span>${escapeHTML(expense.category)} · ${formatDate(expense.date)}</span>
                </div>
            </div>
            <strong class="expense-amount">${formatCurrency(expense.amount)}</strong>
        </div>
    `).join("");
}

function renderCategories() {
    if (!elements.categoryList) {
        return;
    }

    const totals = getCategoryTotals(appState.expenses);
    const sortedCategories = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const total = calculateTotal(appState.expenses);

    if (!sortedCategories.length) {
        elements.categoryList.innerHTML = `
            <div class="empty-state compact">
                <p>Your category breakdown will appear here.</p>
            </div>
        `;
        return;
    }

    elements.categoryList.innerHTML = sortedCategories.map(([category, amount]) => {
        const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;

        return `
            <div class="category-item">
                <div class="category-item-top">
                    <div class="category-label">
                        <span class="category-dot ${getCategoryClass(category)}"></span>
                        <span>${escapeHTML(category)}</span>
                    </div>
                    <strong>${formatCurrency(amount)}</strong>
                </div>
                <div class="category-progress">
                    <span style="width: ${percentage}%"></span>
                </div>
                <div class="category-percentage">${percentage}% of total spending</div>
            </div>
        `;
    }).join("");
}

function renderChart() {
    if (!elements.spendingChart) {
        return;
    }

    const monthlyData = getMonthlyChartData();

    if (!monthlyData.some(item => item.amount > 0)) {
        elements.spendingChart.innerHTML = `
            <div class="chart-empty">
                <span>No spending data yet</span>
                <small>Add expenses to see your spending trend.</small>
            </div>
        `;
        return;
    }

    const maxAmount = Math.max(...monthlyData.map(item => item.amount), 1);

    elements.spendingChart.innerHTML = `
        <div class="chart-bars">
            ${monthlyData.map(item => {
                const height = item.amount > 0
                    ? Math.max((item.amount / maxAmount) * 100, 6)
                    : 3;

                return `
                    <div class="chart-column">
                        <div class="chart-value">${item.amount > 0 ? formatCompactCurrency(item.amount) : ""}</div>
                        <div class="chart-bar-area">
                            <span class="chart-bar" style="height: ${height}%"></span>
                        </div>
                        <span class="chart-label">${item.label}</span>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function getMonthlyChartData() {
    const now = new Date();
    const result = [];

    for (let index = 5; index >= 0; index--) {
        const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        const amount = appState.expenses
            .filter(expense => {
                const expenseDate = new Date(`${expense.date}T00:00:00`);
                return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
            })
            .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

        result.push({
            label: date.toLocaleDateString("en-IN", { month: "short" }),
            amount
        });
    }

    return result;
}

function renderInsight() {
    if (!elements.spendingInsightTitle || !elements.spendingInsightText) {
        return;
    }

    if (!appState.expenses.length) {
        elements.spendingInsightTitle.textContent = "Your spending insight";
        elements.spendingInsightText.textContent = "Add a few expenses and Spendly will identify useful patterns in your spending.";
        return;
    }

    const categoryTotals = getCategoryTotals(appState.expenses);
    const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = categories[0];

    const monthly = calculateMonthlyTotal(appState.expenses);
    const total = calculateTotal(appState.expenses);
    const average = calculateAverage(appState.expenses);

    if (topCategory) {
        const percentage = total > 0 ? Math.round((topCategory[1] / total) * 100) : 0;

        elements.spendingInsightTitle.textContent = `${topCategory[0]} is your biggest category`;
        elements.spendingInsightText.textContent =
            `${formatCurrency(topCategory[1])} of your total spending is in ${topCategory[0].toLowerCase()} expenses, representing ${percentage}% of all recorded spending. Your average expense is ${formatCurrency(average)}.`;
    }

    if (monthly > 0 && monthly > total * 0.7) {
        elements.spendingInsightText.textContent += " Most of your recorded spending happened this month.";
    }
}

function getCategoryIcon(category) {
    const icons = {
        Food: "F",
        Transport: "T",
        Education: "E",
        Shopping: "S",
        Entertainment: "N",
        Health: "H",
        Bills: "B",
        Other: "O"
    };

    return icons[category] || "O";
}

function getCategoryClass(category) {
    return `category-${String(category || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function formatCompactCurrency(amount) {
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    }

    if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}k`;
    }

    return `₹${Math.round(amount)}`;
}

function getTodayDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function showToast(message, icon = "✓") {
    if (!elements.toast) {
        return;
    }

    if (elements.toastIcon) {
        elements.toastIcon.textContent = icon;
    }

    if (elements.toastMessage) {
        elements.toastMessage.textContent = message;
    }

    elements.toast.classList.add("visible");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(() => {
        elements.toast.classList.remove("visible");
    }, 3000);
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

window.spendlyDashboard = {
    refresh: renderDashboard,
    openExpenseModal,
    showToast
};

document.addEventListener("DOMContentLoaded", initializeDashboard);