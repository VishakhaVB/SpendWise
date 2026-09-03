const settingsState = {
    settings: getSettings()
};

const settingsElements = {
    currency: document.getElementById("currencySetting"),
    theme: document.getElementById("themeSetting"),
    notifications: document.getElementById("notificationsSetting"),
    exportButton: document.getElementById("exportDataButton"),
    quickExportButton: document.getElementById("quickExportButton"),
    importButton: document.getElementById("importDataButton"),
    importInput: document.getElementById("importDataInput"),
    clearExpensesButton: document.getElementById("clearExpensesButton"),
    resetAppButton: document.getElementById("resetAppButton"),
    storageStatus: document.getElementById("storageStatus"),
    confirmModal: document.getElementById("confirmModal"),
    confirmTitle: document.getElementById("confirmTitle"),
    confirmText: document.getElementById("confirmText"),
    confirmActionButton: document.getElementById("confirmActionButton"),
    cancelConfirmButton: document.getElementById("cancelConfirmButton"),
    profileAvatar: document.getElementById("profileAvatar"),
    profileName: document.getElementById("profileName"),
    menuToggle: document.getElementById("menuToggle"),
    sidebar: document.getElementById("sidebar"),
    sidebarClose: document.getElementById("sidebarClose"),
    mobileOverlay: document.getElementById("mobileOverlay"),
    toast: document.getElementById("toast"),
    toastIcon: document.getElementById("toastIcon"),
    toastMessage: document.getElementById("toastMessage")
};

let pendingConfirmAction = null;
let toastTimer;

function initializeSettings() {
    loadSettings();
    loadProfile();
    setupSettingsEvents();
    setupNavigation();
    updateStorageStatus();
    applyTheme(settingsState.settings.theme);
}

function loadSettings() {
    const settings = settingsState.settings;

    settingsElements.currency.value = settings.currency || "INR";
    settingsElements.theme.value = settings.theme || "system";
    settingsElements.notifications.checked = settings.notifications !== false;
}

function loadProfile() {
    const profile = getProfile();
    const name = profile.name || "";
    const avatar = profile.avatar || getAvatarLetter(name);

    settingsElements.profileName.textContent = name || "Set up profile";
    settingsElements.profileAvatar.textContent = avatar;
}

function getAvatarLetter(name) {
    return String(name || "").trim().charAt(0).toUpperCase() || "○";
}

function setupSettingsEvents() {
    settingsElements.currency.addEventListener("change", () => {
        settingsState.settings.currency = settingsElements.currency.value;
        saveSettings(settingsState.settings);
        showToast("Currency preference saved.", "success");
    });

    settingsElements.theme.addEventListener("change", () => {
        settingsState.settings.theme = settingsElements.theme.value;
        saveSettings(settingsState.settings);
        applyTheme(settingsState.settings.theme);
        showToast("Theme preference saved.", "success");
    });

    settingsElements.notifications.addEventListener("change", () => {
        settingsState.settings.notifications = settingsElements.notifications.checked;
        saveSettings(settingsState.settings);

        const message = settingsState.settings.notifications
            ? "Notifications enabled."
            : "Notifications disabled.";

        showToast(message, "success");
    });

    settingsElements.exportButton.addEventListener("click", exportData);
    settingsElements.quickExportButton.addEventListener("click", exportData);

    settingsElements.importButton.addEventListener("click", () => {
        settingsElements.importInput.click();
    });

    settingsElements.importInput.addEventListener("change", handleImport);

    settingsElements.clearExpensesButton.addEventListener("click", () => {
        openConfirm(
            "Clear all expenses?",
            "Every recorded expense will be permanently removed. Your profile and settings will remain.",
            "Clear expenses",
            "clear"
        );
    });

    settingsElements.resetAppButton.addEventListener("click", () => {
        openConfirm(
            "Reset Spendly?",
            "This will remove your expenses, profile and settings and restore the original app defaults.",
            "Reset app",
            "reset"
        );
    });

    settingsElements.cancelConfirmButton.addEventListener("click", closeConfirm);

    settingsElements.confirmActionButton.addEventListener("click", executeConfirmAction);

    settingsElements.confirmModal.addEventListener("click", event => {
        if (event.target === settingsElements.confirmModal) {
            closeConfirm();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && settingsElements.confirmModal.classList.contains("show")) {
            closeConfirm();
        }
    });

    window.addEventListener("storage", () => {
        settingsState.settings = getSettings();
        loadSettings();
        loadProfile();
        updateStorageStatus();
        applyTheme(settingsState.settings.theme);
    });
}

function applyTheme(theme) {
    const root = document.documentElement;

    if (theme === "dark") {
        root.setAttribute("data-theme", "dark");
        return;
    }

    if (theme === "light") {
        root.setAttribute("data-theme", "light");
        return;
    }

    root.removeAttribute("data-theme");
}

function exportData() {
    try {
        const data = exportAppData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `spendly-backup-${getFileDate()}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        showToast("Backup exported successfully.", "success");
    } catch (error) {
        showToast("Unable to export your data.", "error");
    }
}

async function handleImport(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!isValidBackup(data)) {
            throw new Error("Invalid backup");
        }

        openConfirm(
            "Import this backup?",
            "Your current expenses, profile and settings will be replaced by the data in this backup.",
            "Import backup",
            "import",
            data
        );
    } catch (error) {
        showToast("The selected file is not a valid Spendly backup.", "error");
    } finally {
        settingsElements.importInput.value = "";
    }
}

function isValidBackup(data) {
    if (!data || typeof data !== "object") {
        return false;
    }

    if (!Array.isArray(data.expenses)) {
        return false;
    }

    if (!data.profile || typeof data.profile !== "object") {
        return false;
    }

    if (!data.settings || typeof data.settings !== "object") {
        return false;
    }

    return true;
}

function openConfirm(title, text, actionLabel, action, data = null) {
    pendingConfirmAction = {
        action,
        data
    };

    settingsElements.confirmTitle.textContent = title;
    settingsElements.confirmText.textContent = text;
    settingsElements.confirmActionButton.textContent = actionLabel;

    settingsElements.confirmModal.classList.add("show");
    settingsElements.confirmModal.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
        settingsElements.cancelConfirmButton.focus();
    });
}

function closeConfirm() {
    pendingConfirmAction = null;
    settingsElements.confirmModal.classList.remove("show");
    settingsElements.confirmModal.setAttribute("aria-hidden", "true");
}

function executeConfirmAction() {
    if (!pendingConfirmAction) {
        return;
    }

    const action = pendingConfirmAction.action;
    const data = pendingConfirmAction.data;

    closeConfirm();

    if (action === "clear") {
        clearExpenses();
        updateStorageStatus();
        showToast("All expenses have been cleared.", "success");
        return;
    }

    if (action === "reset") {
        resetAppData();
        settingsState.settings = getSettings();
        loadSettings();
        loadProfile();
        applyTheme(settingsState.settings.theme);
        updateStorageStatus();
        showToast("Spendly has been reset.", "success");
        return;
    }

    if (action === "import") {
        try {
            importAppData(data);
            settingsState.settings = getSettings();
            loadSettings();
            loadProfile();
            applyTheme(settingsState.settings.theme);
            updateStorageStatus();
            showToast("Backup imported successfully.", "success");
        } catch (error) {
            showToast("Unable to import this backup.", "error");
        }
    }
}

function updateStorageStatus() {
    try {
        const testKey = "__spendly_storage_test__";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);

        settingsElements.storageStatus.textContent = "Active";
    } catch (error) {
        settingsElements.storageStatus.textContent = "Unavailable";
    }
}

function getFileDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function setupNavigation() {
    if (settingsElements.menuToggle) {
        settingsElements.menuToggle.addEventListener("click", () => {
            settingsElements.sidebar.classList.add("open");
            settingsElements.mobileOverlay.classList.add("show");
        });
    }

    if (settingsElements.sidebarClose) {
        settingsElements.sidebarClose.addEventListener("click", closeSidebar);
    }

    if (settingsElements.mobileOverlay) {
        settingsElements.mobileOverlay.addEventListener("click", closeSidebar);
    }

    document.querySelectorAll(".main-nav a").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });
}

function closeSidebar() {
    settingsElements.sidebar.classList.remove("open");
    settingsElements.mobileOverlay.classList.remove("show");
}

function showToast(message, type = "success") {
    clearTimeout(toastTimer);

    settingsElements.toastMessage.textContent = message;

    if (type === "error") {
        settingsElements.toastIcon.textContent = "!";
        settingsElements.toast.classList.add("error");
    } else {
        settingsElements.toastIcon.textContent = "✓";
        settingsElements.toast.classList.remove("error");
    }

    settingsElements.toast.classList.add("show");

    toastTimer = setTimeout(() => {
        settingsElements.toast.classList.remove("show");
    }, 3000);
}

document.addEventListener("DOMContentLoaded", initializeSettings);