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

// ---------- SHOW / HIDE PASSWORD ----------
const passwordInput = document.getElementById("password");
const eyeOpen = document.getElementById("eye-open");
const eyeClosed = document.getElementById("eye-closed");

document.getElementById("toggle-password").addEventListener("click", () => {
  const willShow = passwordInput.type === "password";
  passwordInput.type = willShow ? "text" : "password";
  eyeOpen.classList.toggle("hidden", !willShow);
  eyeClosed.classList.toggle("hidden", willShow);
});

// ---------- REMEMBER ME (email pre-fill) ----------
const emailInput = document.getElementById("email");
const rememberCheckbox = document.getElementById("remember-me");
const savedEmail = localStorage.getItem("technest-remember-email");
if (savedEmail) {
  emailInput.value = savedEmail;
  rememberCheckbox.checked = true;
}

// ---------- VALIDATION ----------
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");

function setFieldError(input, errorEl, message) {
  if (message) {
    input.classList.remove("border-black/5", "dark:border-white/10");
    input.classList.add("border-red-500");
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  } else {
    input.classList.remove("border-red-500");
    input.classList.add("border-black/5", "dark:border-white/10");
    errorEl.classList.add("hidden");
  }
  return !message;
}

function validateEmail() {
  const val = emailInput.value.trim();
  if (!val) return setFieldError(emailInput, emailError, "Email is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
    return setFieldError(emailInput, emailError, "Enter a valid email address");
  return setFieldError(emailInput, emailError, "");
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

emailInput.addEventListener("blur", validateEmail);
passwordInput.addEventListener("blur", validatePassword);

// ---------- FORGOT PASSWORD ----------
document
  .getElementById("forgot-password")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
      toast("Please enter your email first", "error");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast(error.message, "error");
    else toast("Password reset link sent to your email");
  });

// ---------- LOGIN SUBMIT ----------
const form = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const btnText = document.getElementById("btn-text");
const btnSpinner = document.getElementById("btn-spinner");

function setLoading(loading) {
  loginBtn.disabled = loading;
  btnSpinner.classList.toggle("hidden", !loading);
  btnText.textContent = loading ? "Logging in..." : "Login";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Values yahan submit ke waqt read ho rahe hain, page load ke waqt nahi
  const emailOk = validateEmail();
  const passwordOk = validatePassword();
  if (!emailOk || !passwordOk) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(false);

  if (error) {
    toast(error.message, "error");
    return;
  }

  if (rememberCheckbox.checked) {
    localStorage.setItem("technest-remember-email", email);
  } else {
    localStorage.removeItem("technest-remember-email");
  }

  toast("Login successful! Redirecting...");
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 800);
});
