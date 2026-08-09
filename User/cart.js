const supabase = window.supabase;

// ================= THEME TOGGLE =================
const themeBtn = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("technest-theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}
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

// ================= AUTH STATE =================
async function updateNavbarAuthState(session) {
  const guestLinks = document.getElementById("guest-links");
  const profileMenu = document.getElementById("profile-menu");
  const mobileUserLinks = document.getElementById("mobile-user-links");
  const wishlistBtn = document.getElementById("wishlist-btn");
  const cartLink = document.getElementById("cart-link");

  if (session) {
    guestLinks?.classList.add("!hidden");
    profileMenu?.classList.remove("hidden", "!hidden");
    mobileUserLinks?.classList.remove("hidden");
    wishlistBtn?.classList.remove("hidden");
    wishlistBtn?.classList.add("flex");
    cartLink?.classList.remove("hidden");
    cartLink?.classList.add("flex");

    const name = session.user.user_metadata?.full_name || session.user.email;
    const avatarImg = document.getElementById("profile-avatar");
    if (avatarImg) {
      avatarImg.src =
        session.user.user_metadata?.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    }

    await loadWishlistCount(session.user.id);
    await loadCartCount(session.user.id);
  } else {
    guestLinks?.classList.remove("!hidden");
    profileMenu?.classList.add("hidden", "!hidden");
    mobileUserLinks?.classList.add("hidden");
    wishlistBtn?.classList.add("hidden");
    wishlistBtn?.classList.remove("flex");
    cartLink?.classList.add("hidden");
    cartLink?.classList.remove("flex");
  }
}

async function initAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  await updateNavbarAuthState(session);
  supabase.auth.onAuthStateChange(async (event, session) => {
    await updateNavbarAuthState(session);
  });
}
initAuth();

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  try {
    await supabase.auth.signOut();
    window.location.href = "../index.html";
  } catch (err) {
    console.error(err);
  }
});
document
  .getElementById("mobile-logout-btn")
  ?.addEventListener("click", async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "../index.html";
    } catch (err) {
      console.error(err);
    }
  });

// ================= CART / WISHLIST COUNT (navbar) =================
async function loadCartCount(userId) {
  try {
    const { count, error } = await supabase
      .from("cart_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    const el = document.getElementById("cart-count");
    if (!error && el) el.textContent = count || 0;
  } catch (err) {
    console.error("Cart count fetch failed:", err);
  }
}

async function loadWishlistCount(userId) {
  const el = document.getElementById("wishlist-count");
  if (!el) return;
  if (!userId) {
    el.textContent = "0";
    return;
  }
  const { count, error } = await supabase
    .from("wishlist")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  el.textContent = !error ? count || 0 : 0;
}

// ================= SEARCH =================
const desktopInput = document.getElementById("search-input");
const desktopResults = document.getElementById("search-results");
const mobileInput = document.getElementById("mobile-search-input");
const mobileResults = document.getElementById("mobile-search-results");
let searchDebounce;

function setupSearch(inputEl, resultsEl) {
  if (!inputEl || !resultsEl) return;
  inputEl.addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    const query = e.target.value.trim();
    if (!query) {
      resultsEl.classList.add("hidden");
      return;
    }
    searchDebounce = setTimeout(async () => {
      try {
        const { data: matches, error } = await supabase
          .from("products")
          .select("id, name, price, image_url")
          .ilike("name", `%${query}%`)
          .limit(5);
        if (error) throw error;
        if (matches && matches.length > 0) {
          resultsEl.innerHTML = matches
            .map(
              (item) => `
              <a href="products.html?id=${item.id}" class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-white/10 transition border-b border-gray-100 dark:border-white/5 last:border-0">
                <img src="${item.image_url}" alt="${item.name}" class="w-10 h-10 rounded-lg object-cover">
                <div class="flex-1 overflow-hidden">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${item.name}</p>
                  <p class="text-xs text-primary font-bold">$${Number(item.price).toFixed(2)}</p>
                </div>
              </a>`,
            )
            .join("");
        } else {
          resultsEl.innerHTML = `<p class="px-4 py-3 text-sm text-gray-500 text-center">No products found</p>`;
        }
        resultsEl.classList.remove("hidden");
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300);
  });
}
setupSearch(desktopInput, desktopResults);
setupSearch(mobileInput, mobileResults);
document.addEventListener("click", (e) => {
  if (
    !e.target.closest("#search-input") &&
    !e.target.closest("#search-results") &&
    !e.target.closest("#mobile-search-input") &&
    !e.target.closest("#mobile-search-results")
  ) {
    desktopResults?.classList.add("hidden");
    mobileResults?.classList.add("hidden");
  }
});

// ================= SCROLL REVEAL =================
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add("revealed");
        el.style.transitionDelay = "0s";
        el.addEventListener(
          "transitionend",
          () => {
            el.removeAttribute("data-reveal");
            el.classList.remove("revealed");
            el.style.transitionDelay = "";
          },
          { once: true },
        );
        revealObserver.unobserve(el);
      }
    });
  },
  { threshold: 0.01, rootMargin: "0px 0px 150px 0px" },
);
document
  .querySelectorAll("[data-reveal]:not(#cart-items-list *)")
  .forEach((el) => revealObserver.observe(el));

// ================= SCROLL EFFECTS =================
const navbar = document.getElementById("navbar");
const scrollProgress = document.getElementById("scroll-progress");
const backToTopBtn = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  const scrolled = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;

  if (height > 0 && scrollProgress) {
    scrollProgress.style.width = `${(scrolled / height) * 100}%`;
  }
  navbar?.classList.toggle("shadow-lg", scrolled > 10);
  backToTopBtn?.classList.toggle("hidden", scrolled < 400);
  backToTopBtn?.classList.toggle("flex", scrolled >= 400);
});

backToTopBtn?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);
document
  .querySelectorAll("[data-reveal]:not(#categories-grid *)")
  .forEach((el) => revealObserver.observe(el));

// ================= TOAST =================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const colors = { success: "bg-primary", error: "bg-red-500" };
  const toast = document.createElement("div");
  toast.className = `${colors[type] || colors.success} text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl opacity-0 translate-y-3 transition-all duration-300`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-3");
  });
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-3");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ================= CART LOGIC =================
const cartItemsList = document.getElementById("cart-items-list");
const emptyCartState = document.getElementById("empty-cart-state");
const orderSummaryCard = document.getElementById("order-summary-card");
const cartSummaryText = document.getElementById("cart-summary");

function cartItemCard(item) {
  const product = item.products;
  const lineTotal = product.price * item.quantity;

  return `
    <div class="cart-item flex gap-4 bg-white dark:bg-[#13131a] rounded-2xl border border-gray-100 dark:border-white/10 p-4" data-cart-id="${item.id}" data-product-id="${product.id}" data-price="${product.price}" data-stock="${product.stock ?? 99}">
      <img src="${product.image_url}" alt="${product.name}" class="w-24 h-24 rounded-xl object-cover shrink-0">

      <div class="flex-1 min-w-0 flex flex-col justify-between">
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-semibold line-clamp-1">${product.name}</h3>
          <button class="remove-item-btn shrink-0 text-gray-400 hover:text-red-500 transition cursor-pointer" aria-label="Remove item">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
          </button>
        </div>

        <p class="text-primary font-bold text-lg">$${Number(product.price).toFixed(2)}</p>

        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center border border-gray-200 dark:border-white/10 rounded-full overflow-hidden">
            <button class="qty-minus w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 font-bold cursor-pointer">−</button>
            <span class="qty-value w-8 text-center text-sm font-semibold">${item.quantity}</span>
            <button class="qty-plus w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 font-bold cursor-pointer">+</button>
          </div>
          <span class="line-total font-semibold text-sm">$${lineTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
}

function updateSummary() {
  const cards = document.querySelectorAll(".cart-item");
  let subtotal = 0;
  let itemCount = 0;

  cards.forEach((card) => {
    const price = Number(card.dataset.price);
    const qty = Number(card.querySelector(".qty-value").textContent);
    subtotal += price * qty;
    itemCount += qty;
  });

  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 5;
  const total = subtotal + shipping;

  const summarySubtotal = document.getElementById("summary-subtotal");
  const summaryShipping = document.getElementById("summary-shipping");
  const summaryTotal = document.getElementById("summary-total");

  if (summarySubtotal) summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
  if (summaryShipping)
    summaryShipping.textContent =
      shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`;
  if (summaryTotal) summaryTotal.textContent = `$${total.toFixed(2)}`;

  if (cartSummaryText) {
    cartSummaryText.textContent =
      itemCount > 0
        ? `${itemCount} item${itemCount > 1 ? "s" : ""} in your cart`
        : "Your cart is empty";
  }

  if (cards.length === 0) {
    emptyCartState?.classList.remove("hidden");
    orderSummaryCard?.classList.add("hidden");
  } else {
    emptyCartState?.classList.add("hidden");
    orderSummaryCard?.classList.remove("hidden");
  }
}

async function loadCart() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return; // auth guard already redirects, safety check

  cartItemsList.innerHTML = Array(3)
    .fill(
      `<div class="animate-pulse flex gap-4 bg-white dark:bg-[#13131a] rounded-2xl border border-gray-100 dark:border-white/10 p-4">
        <div class="w-24 h-24 rounded-xl bg-gray-200 dark:bg-white/10 shrink-0"></div>
        <div class="flex-1 space-y-3 py-2">
          <div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3"></div>
          <div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/3"></div>
        </div>
      </div>`,
    )
    .join("");

  try {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, products ( id, name, price, image_url, stock )")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data.length) {
      cartItemsList.innerHTML = "";
      updateSummary();
      return;
    }

    cartItemsList.innerHTML = data.map(cartItemCard).join("");
    updateSummary();
  } catch (err) {
    console.error(err);
    cartItemsList.innerHTML = `<p class="text-center text-red-500 py-10">Failed to load cart. Please refresh.</p>`;
  }
}
loadCart();

// ================= QUANTITY +/- =================
cartItemsList.addEventListener("click", async (e) => {
  const card = e.target.closest(".cart-item");
  if (!card) return;

  const cartId = card.dataset.cartId;
  const qtyEl = card.querySelector(".qty-value");
  const lineTotalEl = card.querySelector(".line-total");
  const price = Number(card.dataset.price);
  const stock = Number(card.dataset.stock);
  let qty = Number(qtyEl.textContent);

  if (e.target.closest(".qty-plus")) {
    if (qty >= stock) {
      showToast(`Only ${stock} in stock`, "error");
      return;
    }
    qty++;
  } else if (e.target.closest(".qty-minus")) {
    if (qty <= 1) return;
    qty--;
  } else {
    return;
  }

  qtyEl.textContent = qty;
  lineTotalEl.textContent = `$${(price * qty).toFixed(2)}`;
  updateSummary();

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: qty })
    .eq("id", cartId);

  if (error) {
    console.error(error);
    showToast("Failed to update quantity", "error");
  }
});

// ================= REMOVE ITEM =================
cartItemsList.addEventListener("click", async (e) => {
  const removeBtn = e.target.closest(".remove-item-btn");
  if (!removeBtn) return;

  const card = removeBtn.closest(".cart-item");
  const cartId = card.dataset.cartId;

  const { error } = await supabase.from("cart_items").delete().eq("id", cartId);

  if (error) {
    showToast("Failed to remove item", "error");
    return;
  }

  card.remove();
  updateSummary();
  showToast("Item removed from cart");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) await loadCartCount(session.user.id);
});

// ================= CHECKOUT =================
document.getElementById("checkout-btn")?.addEventListener("click", () => {
  window.location.href = "checkout.html";
});
