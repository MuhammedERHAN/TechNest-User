const supabase = window.supabase;

// ================= THEME TOGGLE =================
const themeBtn = document.getElementById("theme-toggle");
themeBtn?.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("technest-theme", isDark ? "dark" : "light");
});

// ================= MOBILE MENU =================
const mobileMenu = document.getElementById("mobile-menu");
const hamburgerBtn = document.getElementById("hamburger-btn");
const closeMobileMenuBtn = document.getElementById("close-mobile-menu-btn");

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
hamburgerBtn?.addEventListener("click", openMobileMenu);
closeMobileMenuBtn?.addEventListener("click", closeMobileMenu);
mobileMenu?.addEventListener("click", (e) => {
  if (e.target === mobileMenu) closeMobileMenu();
});
window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) closeMobileMenu();
});

// ================= PROFILE DROPDOWN & LOGOUT =================
const profileDropdown = document.getElementById("profile-dropdown");
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

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.replace("../login.html");
});

// ================= TOAST NOTIFICATION SYSTEM =================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-white shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-4 opacity-0 ${
    type === "error"
      ? "bg-gradient-to-r from-red-500 to-rose-600"
      : "bg-gradient-to-r from-emerald-500 to-teal-600"
  }`;

  toast.innerHTML = `
    <span>${type === "error" ? "⚠️" : "✅"}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-4", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("translate-y-4", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ================= STATE VARIABLES =================
let wishlistItems = [];
let currentUserId = null;

// Elements
const skeletonEl = document.getElementById("wishlist-skeleton");
const emptyWishlistEl = document.getElementById("empty-wishlist");
const wishlistGridEl = document.getElementById("wishlist-grid");
const totalNumEl = document.getElementById("wishlist-total-num");
const cartBadgeEl = document.getElementById("cart-count");

// ================= UPDATE CART BADGE =================
async function updateCartCountBadge(userId) {
  if (!cartBadgeEl) return;
  try {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id")
      .eq("user_id", userId);

    if (error) throw error;
    cartBadgeEl.textContent = data ? data.length : 0;
  } catch (err) {
    console.error("Error fetching cart count:", err);
  }
}

// ================= INITIALIZE WISHLIST =================
async function initWishlist() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.replace("../login.html");
    return;
  }

  currentUserId = session.user.id;

  // Set Profile Avatar & Display Name
  const userName =
    session.user.user_metadata?.full_name || session.user.email.split("@")[0];
  const avatarUrl =
    session.user.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&initialsChars=2`;

  document.querySelectorAll(".profile-avatar-img").forEach((img) => {
    if (img) img.src = avatarUrl;
  });

  // Update Cart Badge
  updateCartCountBadge(currentUserId);

  fetchWishlistItems();
}

// ================= FETCH WISHLIST FROM SUPABASE =================
async function fetchWishlistItems() {
  try {
    // Show Skeletons
    skeletonEl?.classList.remove("hidden");
    wishlistGridEl?.classList.add("hidden");
    emptyWishlistEl?.classList.add("hidden");

    const { data, error } = await supabase
      .from("wishlist")
      .select(
        `
        id,
        created_at,
        products (*)
      `,
      )
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    wishlistItems = data || [];

    if (totalNumEl) totalNumEl.textContent = wishlistItems.length;

    skeletonEl?.classList.add("hidden");

    if (wishlistItems.length === 0) {
      emptyWishlistEl?.classList.remove("hidden");
    } else {
      wishlistGridEl?.classList.remove("hidden");
      renderWishlistGrid();
    }
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    skeletonEl?.classList.add("hidden");
    showToast("Failed to load wishlist items", "error");
  }
}

// ================= RENDER WISHLIST GRID =================
function renderWishlistGrid() {
  if (!wishlistGridEl) return;

  wishlistGridEl.innerHTML = wishlistItems
    .map((item) => {
      const p = item.products || {};
      const productTitle = p.name || p.title || "Product";
      const productPrice = Number(p.price) || 0;
      const imageUrl = p.image_url || "https://via.placeholder.com/300";

      return `
        <div id="wishlist-card-${item.id}" class="group bg-white dark:bg-[#13131a] rounded-3xl p-4 border border-gray-100 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-xl hover:shadow-primary/5 relative">
          
          <button
            onclick="removeFromWishlist('${item.id}')"
            class="absolute top-6 right-6 z-10 p-2.5 rounded-full bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition active:scale-90 cursor-pointer shadow-sm"
            title="Remove from Wishlist"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>

          <div>
            <div class="w-full h-48 rounded-2xl bg-gray-50 dark:bg-white/5 overflow-hidden mb-4 relative flex items-center justify-center">
              <img
                src="${imageUrl}"
                alt="${productTitle}"
                class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div class="space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                ${p.category || "Tech"}
              </span>
              <h3 class="font-heading font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 pt-1">
                ${productTitle}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                ${p.description || "Premium quality electronic item."}
              </p>
            </div>
          </div>

          <div class="pt-4 mt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
            <span class="font-bold text-lg text-gray-900 dark:text-white">
              $${productPrice.toFixed(2)}
            </span>

            <button
              onclick="moveToCart('${item.id}', '${p.id}')"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C5CFC] to-[#34E4EA] text-white text-xs font-bold hover:opacity-90 active:scale-95 transition shadow-md shadow-[#7C5CFC]/20 cursor-pointer flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
              </svg>
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

// ================= REMOVE ITEM FROM WISHLIST =================
window.removeFromWishlist = async function (wishlistId) {
  // 1. INSTANT LOCAL STATE & COUNT UPDATE (No reload needed)/.......
  wishlistItems = wishlistItems.filter((i) => i.id !== wishlistId);

  const totalNumEl = document.getElementById("wishlist-total-num");
  if (totalNumEl) {
    totalNumEl.textContent = wishlistItems.length;
  }

  // 2. Card ko Screen se usi waqt remove karo
  const cardEl = document.getElementById(`wishlist-card-${wishlistId}`);
  if (cardEl) {
    cardEl.remove();
  }

  showToast("Removed from wishlist");

  // 3. Agar items 0 ho gaye to Empty state dikhao
  if (wishlistItems.length === 0) {
    wishlistGridEl?.classList.add("hidden");
    emptyWishlistEl?.classList.remove("hidden");
  }

  // 4. Background me Database delete call
  try {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("id", wishlistId);

    if (error) throw error;
  } catch (err) {
    console.error("Error removing item:", err);
    showToast("Failed to remove item", "error");
  }
};

// ================= MOVE ITEM TO CART =================
window.moveToCart = async function (wishlistId, productId) {
  // 1. INSTANT LOCAL STATE & COUNT UPDATE...
  const wishItem = wishlistItems.find((i) => i.id === wishlistId);
  const stock = wishItem?.products?.stock ?? 99;

  const totalNumEl = document.getElementById("wishlist-total-num");
  if (totalNumEl) {
    totalNumEl.textContent = wishlistItems.length;
  }

  // 2. Card ko Screen se usi waqt remove karo
  const cardEl = document.getElementById(`wishlist-card-${wishlistId}`);
  if (cardEl) {
    cardEl.remove();
  }

  showToast("Moved item to Cart! 🛒");

  if (wishlistItems.length === 0) {
    wishlistGridEl?.classList.add("hidden");
    emptyWishlistEl?.classList.remove("hidden");
  }

  // 3. Bg me Supabase Database sync
  try {
    const { data: existingCart } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", currentUserId)
      .eq("product_id", productId)
      .maybeSingle();

    const newQty = (existingCart?.quantity || 0) + 1;

    if (newQty > stock) {
      showToast(`Only ${stock} in stock — can't add more`, "error");
      return;
    }

    if (existingCart) {
      await supabase
        .from("cart_items")
        .update({ quantity: newQty })
        .eq("id", existingCart.id);
    } else {
      await supabase
        .from("cart_items")
        .insert([
          { user_id: currentUserId, product_id: productId, quantity: 1 },
        ]);
    }

    await supabase.from("wishlist").delete().eq("id", wishlistId);
    updateCartCountBadge(currentUserId);
  } catch (err) {
    console.error("Error moving to cart:", err);
    showToast("Failed to move item to cart", "error");
  }
};

// Start Execution
document.addEventListener("DOMContentLoaded", initWishlist);
