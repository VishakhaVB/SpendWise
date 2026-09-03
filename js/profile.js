const profileState = {
    profile: getProfile()
};

const profileElements = {
    form: document.getElementById("profileForm"),
    nameInput: document.getElementById("profileNameInput"),
    emailInput: document.getElementById("profileEmailInput"),
    collegeInput: document.getElementById("profileCollegeInput"),
    courseInput: document.getElementById("profileCourseInput"),
    nameError: document.getElementById("profileNameError"),
    emailError: document.getElementById("profileEmailError"),
    collegeError: document.getElementById("profileCollegeError"),
    courseError: document.getElementById("profileCourseError"),
    displayName: document.getElementById("profileDisplayName"),
    displayCourse: document.getElementById("profileDisplayCourse"),
    avatar: document.getElementById("profileAvatar"),
    largeAvatar: document.getElementById("largeProfileAvatar"),
    topbarName: document.getElementById("profileName"),
    saveStatus: document.getElementById("profileSaveStatus"),
    menuToggle: document.getElementById("menuToggle"),
    sidebar: document.getElementById("sidebar"),
    sidebarClose: document.getElementById("sidebarClose"),
    mobileOverlay: document.getElementById("mobileOverlay"),
    toast: document.getElementById("toast"),
    toastIcon: document.getElementById("toastIcon"),
    toastMessage: document.getElementById("toastMessage")
};

let toastTimer;

function initializeProfile() {
    loadProfileIntoForm();
    updateProfilePreview();
    setupNavigation();
    setupForm();
}

function loadProfileIntoForm() {
    const profile = profileState.profile;

    profileElements.nameInput.value = profile.name || "";
    profileElements.emailInput.value = profile.email || "";
    profileElements.collegeInput.value = profile.college || "";
    profileElements.courseInput.value = profile.course || "";
}

function updateProfilePreview() {
    const profile = profileState.profile;
    const enteredName = profile.name || "";
    const name = enteredName || "Your profile";
    const course = profile.course || "Complete your profile to personalize Spendly.";
    const avatar = profile.avatar || getAvatarLetter(enteredName);

    profileElements.displayName.textContent = name;
    profileElements.displayCourse.textContent = course;
    profileElements.avatar.textContent = avatar;
    profileElements.largeAvatar.textContent = avatar;
    profileElements.topbarName.textContent = profile.name || "Set up profile";
}

function setupForm() {
    profileElements.form.addEventListener("submit", event => {
        event.preventDefault();

        clearValidation();

        const values = {
            name: profileElements.nameInput.value.trim(),
            email: profileElements.emailInput.value.trim(),
            college: profileElements.collegeInput.value.trim(),
            course: profileElements.courseInput.value.trim()
        };

        if (!validateProfile(values)) {
            showToast("Please fix the highlighted fields.", "error");
            return;
        }

        const updatedProfile = {
            ...profileState.profile,
            ...values,
            avatar: getAvatarLetter(values.name)
        };

        saveProfile(updatedProfile);
        profileState.profile = getProfile();

        updateProfilePreview();

        profileElements.saveStatus.textContent = "Your changes have been saved locally.";
        showToast("Profile saved successfully.", "success");
    });

    profileElements.nameInput.addEventListener("input", () => {
        clearFieldError(profileElements.nameInput, profileElements.nameError);
        updateLivePreview();
    });

    profileElements.courseInput.addEventListener("input", () => {
        clearFieldError(profileElements.courseInput, profileElements.courseError);
        updateLiveCourse();
    });

    profileElements.emailInput.addEventListener("input", () => {
        clearFieldError(profileElements.emailInput, profileElements.emailError);
    });

    profileElements.collegeInput.addEventListener("input", () => {
        clearFieldError(profileElements.collegeInput, profileElements.collegeError);
    });
}

function validateProfile(values) {
    let valid = true;

    if (!values.name) {
        setFieldError(
            profileElements.nameInput,
            profileElements.nameError,
            "Please enter your name."
        );
        valid = false;
    } else if (values.name.length < 2) {
        setFieldError(
            profileElements.nameInput,
            profileElements.nameError,
            "Name must contain at least 2 characters."
        );
        valid = false;
    }

    if (values.email && !isValidEmail(values.email)) {
        setFieldError(
            profileElements.emailInput,
            profileElements.emailError,
            "Enter a valid email address."
        );
        valid = false;
    }

    return valid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldError(input, errorElement, message) {
    input.classList.add("input-error");
    errorElement.textContent = message;
}

function clearFieldError(input, errorElement) {
    input.classList.remove("input-error");
    errorElement.textContent = "";
}

function clearValidation() {
    clearFieldError(profileElements.nameInput, profileElements.nameError);
    clearFieldError(profileElements.emailInput, profileElements.emailError);
    clearFieldError(profileElements.collegeInput, profileElements.collegeError);
    clearFieldError(profileElements.courseInput, profileElements.courseError);
}

function updateLivePreview() {
    const enteredName = profileElements.nameInput.value.trim();
    const name = enteredName || "Your profile";
    const avatar = getAvatarLetter(enteredName);

    profileElements.displayName.textContent = name;
    profileElements.displayCourse.textContent = profileElements.courseInput.value.trim() || "Complete your profile to personalize Spendly.";
    profileElements.avatar.textContent = avatar;
    profileElements.largeAvatar.textContent = avatar;
    profileElements.topbarName.textContent = enteredName || "Set up profile";
}

function updateLiveCourse() {
    const course = profileElements.courseInput.value.trim();

    profileElements.displayCourse.textContent =
        course || "Complete your profile to personalize Spendly.";
}

function getAvatarLetter(name) {
    const cleanName = String(name || "").trim();

    if (!cleanName) {
        return "○";
    }

    const firstLetter = cleanName.charAt(0).toUpperCase();

    return firstLetter;
}

function setupNavigation() {
    if (profileElements.menuToggle) {
        profileElements.menuToggle.addEventListener("click", () => {
            profileElements.sidebar.classList.add("open");
            profileElements.mobileOverlay.classList.add("show");
        });
    }

    if (profileElements.sidebarClose) {
        profileElements.sidebarClose.addEventListener("click", closeSidebar);
    }

    if (profileElements.mobileOverlay) {
        profileElements.mobileOverlay.addEventListener("click", closeSidebar);
    }

    document.querySelectorAll(".main-nav a").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });
}

function closeSidebar() {
    profileElements.sidebar.classList.remove("open");
    profileElements.mobileOverlay.classList.remove("show");
}

function showToast(message, type = "success") {
    clearTimeout(toastTimer);

    profileElements.toastMessage.textContent = message;

    if (type === "error") {
        profileElements.toastIcon.textContent = "!";
        profileElements.toast.classList.add("error");
    } else {
        profileElements.toastIcon.textContent = "✓";
        profileElements.toast.classList.remove("error");
    }

    profileElements.toast.classList.add("show");

    toastTimer = setTimeout(() => {
        profileElements.toast.classList.remove("show");
    }, 3000);
}

document.addEventListener("DOMContentLoaded", initializeProfile);