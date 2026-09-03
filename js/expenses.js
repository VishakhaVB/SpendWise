const expensesPageState = {
    expenses: getExpenses(),
    filteredExpenses: [],
    selectedExpenseId: null
};

const expensePageElements = {
    tableBody: document.getElementById("expensesTableBody"),
    emptyState: document.getElementById("expensesEmpty"),
    emptyTitle: document.getElementById("emptyTitle"),
    emptyText: document.getElementById("emptyText"),
    resultsText: document.getElementById("resultsText"),
    search: document.getElementById("expenseSearch"),
    categoryFilter: document.getElementById("categoryFilter"),
    dateFilter: document.getElementById("dateFilter"),
    sortFilter: document.getElementById("sortFilter"),
    clearFilters: document.getElementById("clearFilters"),
    total: document.getElementById("expensesTotal"),
    monthly: document.getElementById("expensesMonthly"),
    count: document.getElementById("expensesCount"),
    average: document.getElementById("expensesAverage"),
    expenseModal: document.getElementById("expenseModal"),
    expenseForm: document.getElementById("expenseForm"),
    expenseName: document.getElementById("expenseName"),
    expenseAmount: document.getElementById("expenseAmount"),
    expenseCategory: document.getElementById("expenseCategory"),
    expenseDate: document.getElementById("expenseDate"),
    expenseNote: document.getElementById("expenseNote"),
    detailModal: document.getElementById("expenseDetailModal"),
    detailName: document.getElementById("detailExpenseName"),
    detailAmount: document.getElementById("detailExpenseAmount"),
    detailCategory: document.getElementById("detailExpenseCategory"),
    detailDate: document.getElementById("detailExpenseDate"),
    detailNote: document.getElementById("detailExpenseNote"),
    detailEdit: document.getElementById("detailEditButton"),
    detailDelete: document.getElementById("detailDeleteButton"),
    detailClose: document.getElementById("closeDetailModal"),
    toast: document.getElementById("toast"),
    toastIcon: document.getElementById("toastIcon"),
    toastMessage: document.getElementById("toastMessage"),
    profileName: document.getElementById("profileName"),
    profileAvatar: document.getElementById("profileAvatar"),
    sidebar: document.getElementById("sidebar"),
    sidebarClose: document.getElementById("sidebarClose"),
    menuToggle: document.getElementById("menuToggle"),
    mobileOverlay: document.getElementById("mobileOverlay")
};

let editingExpenseId = null;

function initializeExpensesPage() {
    setupProfile();
    setupNavigation();
    setupFilters();
    setupExpenseModal();
    setupExpenseForm();
    setupDetailModal();
    renderExpensesPage();
}

function setupProfile() {
    const profile = getProfile();

    if (expensePageElements.profileName) {
        expensePageElements.profileName.textContent = profile.name || "Set up profile";
    }

    if (expensePageElements.profileAvatar) {
        expensePageElements.profileAvatar.textContent = profile.avatar || getInitials(profile.name);
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

function setupNavigation() {
    expensePageElements.menuToggle?.addEventListener("click", () => {
        expensePageElements.sidebar?.classList.add("open");
        expensePageElements.mobileOverlay?.classList.add("active");
    });

    expensePageElements.sidebarClose?.addEventListener("click", closeSidebar);

    expensePageElements.mobileOverlay?.addEventListener("click", closeSidebar);

    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            if (window.innerWidth <= 760) {
                closeSidebar();
            }
        });
    });
}

function closeSidebar() {
    expensePageElements.sidebar?.classList.remove("open");
    expensePageElements.mobileOverlay?.classList.remove("active");
}

function setupFilters() {
    expensePageElements.search?.addEventListener("input", applyFilters);
    expensePageElements.categoryFilter?.addEventListener("change", applyFilters);
    expensePageElements.dateFilter?.addEventListener("change", applyFilters);
    expensePageElements.sortFilter?.addEventListener("change", applyFilters);

    expensePageElements.clearFilters?.addEventListener("click", clearFilters);
}

function applyFilters() {
    const searchTerm = expensePageElements.search?.value.trim().toLowerCase() || "";
    const category = expensePageElements.categoryFilter?.value || "all";
    const dateRange = expensePageElements.dateFilter?.value || "all";
    const sort = expensePageElements.sortFilter?.value || "newest";

    let filtered = [...expensesPageState.expenses];

    if (searchTerm) {
        filtered = filtered.filter(expense => {
            const searchableText = [
                expense.name,
                expense.category,
                expense.note,
                expense.amount
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(searchTerm);
        });
    }

    if (category !== "all") {
        filtered = filtered.filter(expense => expense.category === category);
    }

    filtered = filtered.filter(expense => matchesDateFilter(expense.date, dateRange));

    filtered.sort((a, b) => {
        if (sort === "newest") {
            return new Date(b.date) - new Date(a.date);
        }

        if (sort === "oldest") {
            return new Date(a.date) - new Date(b.date);
        }

        if (sort === "highest") {
            return Number(b.amount) - Number(a.amount);
        }

        if (sort === "lowest") {
            return Number(a.amount) - Number(b.amount);
        }

        if (sort === "name") {
            return a.name.localeCompare(b.name);
        }

        return 0;
    });

    expensesPageState.filteredExpenses = filtered;
    renderExpenseTable();
    updateResultsText();
}

function matchesDateFilter(dateString, filter) {
    if (filter === "all") {
        return true;
    }

    const expenseDate = new Date(`${dateString}T00:00:00`);
    const today = new Date();
    const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    if (filter === "today") {
        return expenseDate.getTime() === todayStart.getTime();
    }

    if (filter === "week") {
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        return expenseDate >= sevenDaysAgo && expenseDate <= todayStart;
    }

    if (filter === "month") {
        return (
            expenseDate.getMonth() === today.getMonth() &&
            expenseDate.getFullYear() === today.getFullYear()
        );
    }

    if (filter === "year") {
        return expenseDate.getFullYear() === today.getFullYear();
    }

    return true;
}

function clearFilters() {
    if (expensePageElements.search) {
        expensePageElements.search.value = "";
    }

    if (expensePageElements.categoryFilter) {
        expensePageElements.categoryFilter.value = "all";
    }

    if (expensePageElements.dateFilter) {
        expensePageElements.dateFilter.value = "all";
    }

    if (expensePageElements.sortFilter) {
        expensePageElements.sortFilter.value = "newest";
    }

    applyFilters();
}

function renderExpensesPage() {
    expensesPageState.expenses = getExpenses();
    updateSummary();
    applyFilters();
}

function updateSummary() {
    const total = calculateTotal(expensesPageState.expenses);
    const monthly = calculateMonthlyTotal(expensesPageState.expenses);
    const count = expensesPageState.expenses.length;
    const average = calculateAverage(expensesPageState.expenses);

    if (expensePageElements.total) {
        expensePageElements.total.textContent = formatCurrency(total);
    }

    if (expensePageElements.monthly) {
        expensePageElements.monthly.textContent = formatCurrency(monthly);
    }

    if (expensePageElements.count) {
        expensePageElements.count.textContent = count.toLocaleString("en-IN");
    }

    if (expensePageElements.average) {
        expensePageElements.average.textContent = formatCurrency(average);
    }
}

function renderExpenseTable() {
    const expenses = expensesPageState.filteredExpenses;

    if (!expensePageElements.tableBody) {
        return;
    }

    if (!expenses.length) {
        expensePageElements.tableBody.innerHTML = "";

        if (expensePageElements.emptyState) {
            expensePageElements.emptyState.hidden = false;
        }

        const hasExpenses = expensesPageState.expenses.length > 0;

        if (expensePageElements.emptyTitle) {
            expensePageElements.emptyTitle.textContent = hasExpenses
                ? "No matching expenses"
                : "No expenses yet";
        }

        if (expensePageElements.emptyText) {
            expensePageElements.emptyText.textContent = hasExpenses
                ? "Try changing your search or filters to find a transaction."
                : "Add your first expense to start tracking your spending.";
        }

        return;
    }

    if (expensePageElements.emptyState) {
        expensePageElements.emptyState.hidden = true;
    }

    expensePageElements.tableBody.innerHTML = expenses.map(expense => `
        <tr data-expense-id="${escapeHTML(expense.id)}">
            <td>
                <div class="expense-table-name">
                    <div class="expense-table-icon ${getCategoryClass(expense.category)}">
                        ${getCategoryIcon(expense.category)}
                    </div>
                    <div class="expense-table-name-content">
                        <strong>${escapeHTML(expense.name)}</strong>
                        <span>${escapeHTML(expense.category)}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="expense-category">${escapeHTML(expense.category)}</span>
            </td>
            <td>
                <span class="expense-date">${formatDate(expense.date)}</span>
            </td>
            <td>
                <span class="expense-note">${escapeHTML(expense.note || "—")}</span>
            </td>
            <td class="expense-table-amount">
                ${formatCurrency(expense.amount)}
            </td>
            <td>
                <div class="expense-actions">
                    <button
                        class="table-action"
                        type="button"
                        data-action="view"
                        data-id="${escapeHTML(expense.id)}"
                        aria-label="View expense"
                        title="View"
                    >
                        View
                    </button>
                    <button
                        class="table-action delete"
                        type="button"
                        data-action="delete"
                        data-id="${escapeHTML(expense.id)}"
                        aria-label="Delete expense"
                        title="Delete"
                    >
                        ×
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    expensePageElements.tableBody.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", handleTableAction);
    });
}

function handleTableAction(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (!id) {
        return;
    }

    if (action === "view") {
        openExpenseDetails(id);
    }

    if (action === "delete") {
        deleteExpenseFromPage(id);
    }
}

function updateResultsText() {
    if (!expensePageElements.resultsText) {
        return;
    }

    const count = expensesPageState.filteredExpenses.length;
    const total = expensesPageState.expenses.length;

    if (count === total) {
        expensePageElements.resultsText.textContent =
            `${total} ${total === 1 ? "expense" : "expenses"} recorded`;
    } else {
        expensePageElements.resultsText.textContent =
            `Showing ${count} of ${total} expenses`;
    }
}

function setupExpenseModal() {
    document.querySelectorAll("[data-open-expense]").forEach(button => {
        button.addEventListener("click", () => openExpenseModal());
    });

    document.querySelectorAll("[data-close-expense]").forEach(button => {
        button.addEventListener("click", closeExpenseModal);
    });

    expensePageElements.expenseModal?.addEventListener("click", event => {
        if (event.target === expensePageElements.expenseModal) {
            closeExpenseModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeExpenseModal();
            closeExpenseDetails();
        }
    });
}

function openExpenseModal(expense = null) {
    if (!expensePageElements.expenseModal) {
        return;
    }

    editingExpenseId = expense ? expense.id : null;

    const title = expensePageElements.expenseModal.querySelector("[data-modal-title]");
    const submitButton = expensePageElements.expenseModal.querySelector("[data-expense-submit]");

    if (title) {
        title.textContent = expense ? "Edit expense" : "Add expense";
    }

    if (submitButton) {
        submitButton.textContent = expense ? "Save changes" : "Add expense";
    }

    clearFormErrors();

    if (expense) {
        expensePageElements.expenseName.value = expense.name || "";
        expensePageElements.expenseAmount.value = expense.amount || "";
        expensePageElements.expenseCategory.value = expense.category || "";
        expensePageElements.expenseDate.value = expense.date || "";
        expensePageElements.expenseNote.value = expense.note || "";
    } else {
        expensePageElements.expenseForm?.reset();

        if (expensePageElements.expenseDate) {
            expensePageElements.expenseDate.value = getTodayDate();
        }
    }

    expensePageElements.expenseModal.classList.add("active");
    expensePageElements.expenseModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    setTimeout(() => {
        expensePageElements.expenseName?.focus();
    }, 100);
}

function closeExpenseModal() {
    if (!expensePageElements.expenseModal) {
        return;
    }

    expensePageElements.expenseModal.classList.remove("active");
    expensePageElements.expenseModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    editingExpenseId = null;
    clearFormErrors();
}

function setupExpenseForm() {
    expensePageElements.expenseForm?.addEventListener("submit", event => {
        event.preventDefault();

        const expense = {
            name: expensePageElements.expenseName.value.trim(),
            amount: Number(expensePageElements.expenseAmount.value),
            category: expensePageElements.expenseCategory.value,
            date: expensePageElements.expenseDate.value,
            note: expensePageElements.expenseNote.value.trim()
        };

        if (!validateExpense(expense)) {
            return;
        }

        if (editingExpenseId) {
            updateExpense(editingExpenseId, expense);
            showToast("Expense updated successfully");
        } else {
            addExpense(expense);
            showToast("Expense added successfully");
        }

        closeExpenseModal();
        renderExpensesPage();
    });
}

function validateExpense(expense) {
    clearFormErrors();

    let valid = true;

    if (!expense.name) {
        showFormError("expenseNameError", "Please enter an expense name.");
        valid = false;
    }

    if (!expense.amount || expense.amount <= 0) {
        showFormError("expenseAmountError", "Enter an amount greater than zero.");
        valid = false;
    }

    if (!expense.category) {
        showFormError("expenseCategoryError", "Please select a category.");
        valid = false;
    }

    if (!expense.date) {
        showFormError("expenseDateError", "Please select a date.");
        valid = false;
    }

    return valid;
}

function showFormError(id, message) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = message;
        element.classList.add("visible");
    }
}

function clearFormErrors() {
    document.querySelectorAll(".field-error").forEach(element => {
        element.textContent = "";
        element.classList.remove("visible");
    });
}

function setupDetailModal() {
    expensePageElements.detailClose?.addEventListener("click", closeExpenseDetails);

    expensePageElements.detailModal?.addEventListener("click", event => {
        if (event.target === expensePageElements.detailModal) {
            closeExpenseDetails();
        }
    });

    expensePageElements.detailEdit?.addEventListener("click", () => {
        const expense = getExpenseById(expensesPageState.selectedExpenseId);

        if (!expense) {
            return;
        }

        closeExpenseDetails();
        openExpenseModal(expense);
    });

    expensePageElements.detailDelete?.addEventListener("click", () => {
        if (expensesPageState.selectedExpenseId) {
            deleteExpenseFromPage(expensesPageState.selectedExpenseId, true);
        }
    });
}

function openExpenseDetails(id) {
    const expense = getExpenseById(id);

    if (!expense || !expensePageElements.detailModal) {
        return;
    }

    expensesPageState.selectedExpenseId = id;

    expensePageElements.detailName.textContent = expense.name;
    expensePageElements.detailAmount.textContent = formatCurrency(expense.amount);
    expensePageElements.detailCategory.textContent = expense.category;
    expensePageElements.detailDate.textContent = formatDate(expense.date);
    expensePageElements.detailNote.textContent = expense.note || "No note added";

    expensePageElements.detailModal.classList.add("active");
    expensePageElements.detailModal.setAttribute("aria-hidden", "false");
}

function closeExpenseDetails() {
    if (!expensePageElements.detailModal) {
        return;
    }

    expensePageElements.detailModal.classList.remove("active");
    expensePageElements.detailModal.setAttribute("aria-hidden", "true");
    expensesPageState.selectedExpenseId = null;
}

function deleteExpenseFromPage(id, fromDetails = false) {
    const expense = getExpenseById(id);

    if (!expense) {
        return;
    }

    const confirmed = window.confirm(
        `Delete "${expense.name}" from your expenses?`
    );

    if (!confirmed) {
        return;
    }

    deleteExpense(id);

    expensesPageState.expenses = getExpenses();

    if (fromDetails) {
        closeExpenseDetails();
    }

    showToast("Expense deleted");
    renderExpensesPage();
}

function showToast(message) {
    if (!expensePageElements.toast) {
        return;
    }

    if (expensePageElements.toastIcon) {
        expensePageElements.toastIcon.textContent = "✓";
    }

    if (expensePageElements.toastMessage) {
        expensePageElements.toastMessage.textContent = message;
    }

    expensePageElements.toast.classList.add("visible");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(() => {
        expensePageElements.toast.classList.remove("visible");
    }, 3000);
}

function getTodayDate() {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
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
    return `category-${String(category || "other")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`;
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", initializeExpensesPage);