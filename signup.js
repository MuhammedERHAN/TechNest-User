import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://egnaelwoflqxhgrcyxpf.supabase.co",
  "sb_publishable_FR475rnpTwXtsN0QHfaYdg_IrOe8LWm",
);

// ---------- TOAST NOTIFICATION ----------
function toast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.className =
      "fixed bottom-6 inset-x-0 z-[999] flex flex-col items-center gap-2 px-4 pointer-events-none";
    document.body.appendChild(container);
  }
  const icons = {
    success: { color: "#34D399", path: "M5 13l4 4L19 7" },
    error: { color: "#FB7185", path: "M6 18L18 6M6 6l12 12" },
  };
  const s = icons[type] || icons.success;
  const el = document.createElement("div");
  el.className =
    "w-full max-w-[92vw] sm:max-w-sm bg-[#1F1F23] text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm animate-toast-in pointer-events-auto";
  el.innerHTML = `
    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="${s.color}" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="${s.path}"/></svg>
    <span class="flex-1">${message}</span>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    setTimeout(() => el.remove(), 250);
  }, 2800);
}

// ---------- DARK / LIGHT TOGGLE ----------
const themeBtn = document.getElementById("theme-toggle");
const iconSun = document.getElementById("icon-sun");
const iconMoon = document.getElementById("icon-moon");

function syncThemeIcons() {
  const dark = document.documentElement.classList.contains("dark");
  iconSun.classList.toggle("hidden", dark);
  iconMoon.classList.toggle("hidden", !dark);
}
syncThemeIcons();

themeBtn.addEventListener("click", () => {
  const nowDark = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", nowDark);
  localStorage.setItem("technest-theme", nowDark ? "dark" : "light");
  syncThemeIcons();
});

// ---------- SHOW / HIDE PASSWORD (dono fields ke liye) ----------
function setupPasswordToggle(inputId, btnId, eyeOpenId, eyeClosedId) {
  const input = document.getElementById(inputId);
  const eyeOpen = document.getElementById(eyeOpenId);
  const eyeClosed = document.getElementById(eyeClosedId);
  document.getElementById(btnId).addEventListener("click", () => {
    const willShow = input.type === "password";
    input.type = willShow ? "text" : "password";
    eyeOpen.classList.toggle("hidden", !willShow);
    eyeClosed.classList.toggle("hidden", willShow);
  });
}
setupPasswordToggle("password", "toggle-password", "eye-open", "eye-closed");
setupPasswordToggle(
  "confirm-password",
  "toggle-confirm-password",
  "confirm-eye-open",
  "confirm-eye-closed",
);

// ---------- FIELD REFERENCES ----------
const fullNameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");

const fullNameError = document.getElementById("full-name-error");
const emailError = document.getElementById("email-error");
const phoneError = document.getElementById("phone-error");
const passwordError = document.getElementById("password-error");
const confirmPasswordError = document.getElementById("confirm-password-error");

// ---------- VALIDATION ----------
function setFieldError(input, errorEl, message) {
  if (message) {
    input.classList.remove("border-black/5", "dark:border-white/10");
    input.classList.add("border-[#FB7185]");
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  } else {
    input.classList.remove("border-[#FB7185]");
    input.classList.add("border-black/5", "dark:border-white/10");
    errorEl.classList.add("hidden");
  }
  return !message;
}

function validateFullName() {
  const val = fullNameInput.value.trim();
  if (!val)
    return setFieldError(fullNameInput, fullNameError, "Full name is required");
  if (val.length < 3)
    return setFieldError(fullNameInput, fullNameError, "Enter your full name");
  return setFieldError(fullNameInput, fullNameError, "");
}

function validateEmail() {
  const val = emailInput.value.trim();
  if (!val) return setFieldError(emailInput, emailError, "Email is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
    return setFieldError(emailInput, emailError, "Enter a valid email address");
  return setFieldError(emailInput, emailError, "");
}

function validatePhone() {
  const val = phoneInput.value.trim();
  if (!val)
    return setFieldError(phoneInput, phoneError, "Phone number is required");
  if (val.replace(/\D/g, "").length < 10)
    return setFieldError(phoneInput, phoneError, "Enter a valid phone number");
  return setFieldError(phoneInput, phoneError, "");
}

function validatePassword() {
  const val = passwordInput.value;
  if (!val)
    return setFieldError(passwordInput, passwordError, "Password is required");
  if (val.length < 6)
    return setFieldError(
      passwordInput,
      passwordError,
      "Must be at least 6 characters",
    );
  return setFieldError(passwordInput, passwordError, "");
}

function validateConfirmPassword() {
  const val = confirmPasswordInput.value;
  if (!val)
    return setFieldError(
      confirmPasswordInput,
      confirmPasswordError,
      "Please confirm your password",
    );
  if (val !== passwordInput.value)
    return setFieldError(
      confirmPasswordInput,
      confirmPasswordError,
      "Passwords do not match",
    );
  return setFieldError(confirmPasswordInput, confirmPasswordError, "");
}

fullNameInput.addEventListener("input", validateFullName);
emailInput.addEventListener("input", validateEmail);
phoneInput.addEventListener("input", validatePhone);
passwordInput.addEventListener("input", () => {
  validatePassword();

  if (confirmPasswordInput.value) {
    validateConfirmPassword();
  }
});
confirmPasswordInput.addEventListener("input", validateConfirmPassword);

// ---------- SIGNUP SUBMIT ----------
const form = document.getElementById("signup-form");
const signupBtn = document.getElementById("signup-btn");
const btnText = document.getElementById("btn-text");
const btnSpinner = document.getElementById("btn-spinner");

function setLoading(loading) {
  signupBtn.disabled = loading;
  btnSpinner.classList.toggle("hidden", !loading);
  btnText.textContent = loading ? "Creating account..." : "Create Account";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Sab fields validate karo (values yahan submit ke waqt hi read ho rahe hain)
  const checks = [
    validateFullName(),
    validateEmail(),
    validatePhone(),
    validatePassword(),
    validateConfirmPassword(),
  ];
  if (checks.includes(false)) return;

  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  setLoading(true);

  try {
    // 1) Supabase Auth me account banao
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });

    if (error) {
      console.error(error);

      let message = "Couldn't create your account. Please try again.";

      if (error.message.toLowerCase().includes("already")) {
        message = "An account with this email already exists. Please log in.";
      }

      setLoading(false);
      toast(message, "error");
      return;
    }

    // 2) profiles table me row bhi banao (koi D.B. nahi hai iskeliye, isliye yahan manually)
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, full_name: fullName, phone });

      if (profileError) {
        console.error(profileError);
        toast("Couldn't save your profile. Please try again.", "error");
        return;
      }
    }

    toast("Account created! Redirecting to login...");

    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1000);
  } catch (error) {
    console.error(error);
    toast("Something went wrong. Please try again.", "error");
  } finally {
    setLoading(false);
  }
});
