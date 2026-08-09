const supabase = window.supabase;

// --- UI Elements ---
const themeToggleBtn = document.getElementById("theme-toggle");
const profileBtn = document.getElementById("profile-btn");
const profileDropdown = document.getElementById("profile-dropdown");
const logoutBtn = document.getElementById("logout-btn");
const pageLogoutBtn = document.getElementById("page-logout-btn");
const hamburgerBtn = document.getElementById("hamburger-btn");
const closeMobileMenuBtn = document.getElementById("close-mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

const cartCountBadge = document.getElementById("cart-count");
const userAvatarNav = document.getElementById("profile-avatar");
const mainUserAvatar = document.getElementById("main-user-avatar");
const userDisplayName = document.getElementById("user-display-name");
const userDisplayEmail = document.getElementById("user-display-email");
const orderHistoryList = document.getElementById("order-history-list");

// Section A & B Elements
const profileForm = document.getElementById("profile-form");
const inputFullName = document.getElementById("input-full-name");
const inputPhone = document.getElementById("input-phone");
const inputEmailReadonly = document.getElementById("input-email-readonly");

const toggleAddressFormBtn = document.getElementById("toggle-address-form-btn");
const addressForm = document.getElementById("address-form");
const cancelAddressBtn = document.getElementById("cancel-address-btn");
const addressList = document.getElementById("address-list");

// --- Helper: Avatar Generator ---
function getAvatarUrl(name) {
  const seed = encodeURIComponent(name || "User");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&initialsChars=2`;
}

// --- 1. Theme Toggle ---
themeToggleBtn?.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("technest-theme", isDark ? "dark" : "light");
});

// ================= MOBILE MENU =================

function openMobileMenu() {
  mobileMenu?.classList.remove("hidden");
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}
function closeMobileMenu() {
  mobileMenu?.classList.add("hidden");
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}
hamburgerBtn?.addEventListener("click", () => {
  if (mobileMenu?.classList.contains("hidden")) openMobileMenu();
  else closeMobileMenu();
});
closeMobileMenuBtn?.addEventListener("click", closeMobileMenu);
mobileMenu?.addEventListener("click", (e) => {
  if (e.target === mobileMenu) closeMobileMenu();
});
document.querySelectorAll("#mobile-menu a")?.forEach((link) => {
  link.addEventListener("click", () => closeMobileMenu());
});
window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) closeMobileMenu();
});

// ================= PROFILE DROPDOWN =================
document.getElementById("profile-btn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  profileDropdown?.classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  if (
    !e.target.closest("#profile-dropdown") &&
    !e.target.closest("#profile-btn")
  ) {
    profileDropdown?.classList.add("hidden");
  }
});

// --- 3. Logout Logic ---
async function handleLogout() {
  await supabase.auth.signOut();
  window.location.replace("../login.html");
}

logoutBtn?.addEventListener("click", handleLogout);
pageLogoutBtn?.addEventListener("click", handleLogout);

// --- 4. Section A: Save Personal Details (with Instant Avatar & Display Name Update) ---
profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const newName = inputFullName.value.trim();
  const newPhone = inputPhone.value.trim();

  try {
    const { error: authError } = await supabase.auth.updateUser({
  data: {
    full_name: newName,
    phone: newPhone,
  },
});

if (authError) throw authError;

// Update profiles table
const { error: profileError } = await supabase
  .from("profiles")
  .update({
    email: session.user.email,
    full_name: newName,
    phone: newPhone,
  })
  .eq("id", session.user.id);

if (profileError) throw profileError;
    alert("Profile updated successfully!");

    const updatedName = newName || session.user.email.split("@")[0];
    if (userDisplayName) userDisplayName.textContent = updatedName;

    // Instant Avatar Refresh on Form Save
    const updatedAvatarUrl = getAvatarUrl(updatedName);
    if (userAvatarNav) userAvatarNav.src = updatedAvatarUrl;
    if (mainUserAvatar) mainUserAvatar.src = updatedAvatarUrl;
  } catch (err) {
    console.error("Profile update error:", err);
    alert("Failed to update profile.");
  }
});

function loadUserFormData(user) {
  if (inputEmailReadonly) inputEmailReadonly.value = user.email || "";
  if (inputFullName) inputFullName.value = user.user_metadata?.full_name || "";
  if (inputPhone) inputPhone.value = user.user_metadata?.phone || "";
}

// --- 5. Cart Count Function (Unique Items Count = 13) ---
async function updateCartCount(userId) {
  if (!cartCountBadge) return;

  // Initial reset to 0
  cartCountBadge.textContent = "0";

  try {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id") // Quantity select karne ki bhi zaroorat nahi hai
      .eq("user_id", userId);

    if (error) throw error;

    // Sirf unique rows/products ki length set karo
    const uniqueItemsCount = data ? data.length : 0;
    cartCountBadge.textContent = uniqueItemsCount;
  } catch (err) {
    console.error("Error fetching cart count:", err);
    cartCountBadge.textContent = "0";
  }
}

// --- Wishlist Count Function ---
async function updateWishlistCount(userId) {
  const wishlistCountBadge = document.getElementById("wishlist-count");
  if (!wishlistCountBadge) return;

  wishlistCountBadge.textContent = "0";

  try {
    const { data, error } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", userId);

    if (error) throw error;

    wishlistCountBadge.textContent = data ? data.length : 0;
  } catch (err) {
    console.error("Error fetching wishlist count:", err);
    wishlistCountBadge.textContent = "0";
  }
}

// --- 6. Section B: Saved Addresses ---
toggleAddressFormBtn?.addEventListener("click", () => {
  addressForm?.classList.toggle("hidden");
});

cancelAddressBtn?.addEventListener("click", () => {
  addressForm?.classList.add("hidden");
});

addressForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const street = document.getElementById("input-street").value.trim();
  const city = document.getElementById("input-city").value.trim();
  const zip = document.getElementById("input-zip").value.trim();

  try {
    const { error } = await supabase
      .from("addresses")
      .insert([{ user_id: session.user.id, street, city, zip }]);

    if (error) throw error;

    addressForm.reset();
    addressForm.classList.add("hidden");
    fetchUserAddresses(session.user.id);
  } catch (err) {
    console.error("Error saving address:", err);
    alert("Failed to save address.");
  }
});

// --- Address List Render with Delete Action ---
async function fetchUserAddresses(userId) {
  try {
    const { data: addresses, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: false });

    if (error || !addresses || addresses.length === 0) {
      addressList.innerHTML = `<p class="text-xs text-gray-400">No saved addresses found.</p>`;
      return;
    }

    addressList.innerHTML = addresses
      .map(
        (addr) => `
      <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 flex items-center justify-between text-xs transition hover:border-gray-300 dark:hover:border-white/20">
        <div>
          <p class="font-semibold text-gray-800 dark:text-gray-200">${addr.street}</p>
          <p class="text-gray-500 dark:text-gray-400">${addr.city}, ${addr.zip}</p>
        </div>
        
        <button 
          onclick="deleteAddress(${addr.id})" 
          class="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer"
          title="Delete Address"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    addressList.innerHTML = `<p class="text-xs text-gray-400">No saved addresses found.</p>`;
  }
}

// --- Delete Address Function ---
window.deleteAddress = async function (addressId) {
  if (!confirm("Are you sure you want to delete this address?")) return;

  try {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId);

    if (error) throw error;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) fetchUserAddresses(session.user.id);
  } catch (err) {
    console.error("Error deleting address:", err);
    alert("Failed to delete address.");
  }
};

// --- 7. Order History Fetch ---
async function fetchOrderHistory(userId) {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      orderHistoryList.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400">No orders placed yet.</p>`;
      return;
    }

    orderHistoryList.innerHTML = orders
      .map((order) => {
        const date = new Date(order.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return `
        <div class="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div class="font-semibold text-sm">Order #${order.id}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Placed on ${date} • ${order.payment_method?.toUpperCase() || "COD"}</div>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-500">
              ${order.status || "Completed"}
            </span>
            <span class="font-bold text-sm text-primary">$${Number(order.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (err) {
    console.error("Error fetching orders:", err);
    orderHistoryList.innerHTML = `<p class="text-sm text-red-500">Failed to load order history.</p>`;
  }
}

// --- 8. Initialize Profile Page ---
async function initProfile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return;

  const user = session.user;

  const fullName = user.user_metadata?.full_name || user.email.split("@")[0];

  // Exact Initials Avatar Generator
  const avatarUrl = getAvatarUrl(fullName);

  // Update Nav Avatar & Profile Card
  if (userAvatarNav) userAvatarNav.src = avatarUrl;
  if (mainUserAvatar) mainUserAvatar.src = avatarUrl;
  if (userDisplayEmail) userDisplayEmail.textContent = user.email;
  if (userDisplayName) userDisplayName.textContent = fullName;

  // Load Form, Cart & Data Tables
  loadUserFormData(user);
  updateCartCount(user.id);
  updateWishlistCount(user.id);
  fetchUserAddresses(user.id);
  fetchOrderHistory(user.id);
}

// Start Execution
initProfile();
