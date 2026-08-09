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
  if (mobileMenu?.classList.contains("hidden")) {
    openMobileMenu();
  } else {
    closeMobileMenu();
  }
});

closeMobileMenuBtn?.addEventListener("click", closeMobileMenu);

mobileMenu?.addEventListener("click", (e) => {
  if (e.target === mobileMenu) {
    closeMobileMenu();
  }
});

document.querySelectorAll("#mobile-menu a")?.forEach((link) => {
  link.addEventListener("click", (e) => {
    const targetId = link.getAttribute("href");

    if (targetId?.startsWith("#")) {
      e.preventDefault();
      closeMobileMenu();

      if (targetId === "#") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          const navHeight =
            document.getElementById("navbar")?.offsetHeight || 70;
          const sectionTop = targetSection.offsetTop - navHeight;
          window.scrollTo({ top: sectionTop, behavior: "smooth" });
        }
      }
    } else {
      closeMobileMenu();
    }
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) {
    closeMobileMenu();
  }
});
// ================= PROFILE DROPDOWN =================
const profileDropdown = document.getElementById("profile-dropdown");
document.getElementById("profile-btn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (profileDropdown) {
    profileDropdown.classList.toggle("hidden");
  }
});
document.addEventListener("click", (e) => {
  if (
    !e.target.closest("#profile-dropdown") &&
    !e.target.closest("#profile-btn")
  ) {
    profileDropdown?.classList.add("hidden");
  }
});

async function updateNavbarAuthState(session) {
  const guestLinks = document.getElementById("guest-links");
  const mobileGuestLinks = document.getElementById("mobile-guest-links");

  const profileMenu = document.getElementById("profile-menu");
  const mobileUserLinks = document.getElementById("mobile-user-links");

  const wishlistBtn = document.getElementById("wishlist-btn");
  const cartLink = document.getElementById("cart-link");

  if (session) {
    guestLinks?.classList.add("!hidden");
    mobileGuestLinks?.classList.add("hidden");

    profileMenu?.classList.remove("hidden", "!hidden");
    mobileUserLinks?.classList.remove("hidden");

    wishlistBtn?.classList.remove("hidden");
    cartLink?.classList.remove("hidden");

    const name = session.user.user_metadata?.full_name || session.user.email;
    const avatarImg = document.getElementById("profile-avatar");
    if (avatarImg) {
      avatarImg.src =
        session.user.user_metadata?.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    }

    await loadWishlistCount();
    await loadCartCount(session.user.id);
  } else {
    guestLinks?.classList.remove("!hidden");
    mobileGuestLinks?.classList.remove("hidden");

    profileMenu?.classList.add("hidden", "!hidden");
    mobileUserLinks?.classList.add("hidden");

    wishlistBtn?.classList.add("hidden");
    cartLink?.classList.add("hidden");

    const cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.textContent = "0";

    const wishlistCount = document.getElementById("wishlist-count");
    if (wishlistCount) wishlistCount.textContent = "0";
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

// ================= CART COUNT (Supabase se live) =================
async function loadCartCount(userId) {
  try {
    const { count, error } = await supabase
      .from("cart_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    const cartCount = document.getElementById("cart-count");

    if (!error && cartCount) {
      cartCount.textContent = count || 0;
    }
  } catch (err) {
    console.error("Cart count fetch failed:", err);

    const cartCount = document.getElementById("cart-count");

    if (cartCount) {
      cartCount.textContent = "0";
    }
  }
}

// ================= WISHLIST COUNT =================
const wishlistCount = document.getElementById("wishlist-count");

async function loadWishlistCount() {
  if (!wishlistCount) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    wishlistCount.textContent = "0";
    return;
  }

  const { count, error } = await supabase
    .from("wishlist")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id);

  if (error) {
    console.error(error);
    wishlistCount.textContent = "0";
    return;
  }

  wishlistCount.textContent = count || 0;
}

// ================= SCROLL REVEAL =================
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.01, rootMargin: "0px 0px 150px 0px" },
);
// ================= SCROLL EFFECTS =================
const navbar = document.getElementById("navbar");
const scrollProgress = document.getElementById("scroll-progress");
const backToTopBtn = document.getElementById("back-to-top");

let scrollTick = false;

window.addEventListener(
  "scroll",
  () => {
    if (scrollTick) return;

    scrollTick = true;

    requestAnimationFrame(() => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;

      if (height > 0 && scrollProgress) {
        scrollProgress.style.width = `${(scrolled / height) * 100}%`;
      }

      if (navbar) {
        navbar.classList.toggle("shadow-lg", scrolled > 10);
      }

      if (backToTopBtn) {
        backToTopBtn.classList.toggle("hidden", scrolled < 400);
        backToTopBtn.classList.toggle("flex", scrolled >= 400);
      }

      scrollTick = false;
    });
  },
  { passive: true },
);

backToTopBtn?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);

// ================= LIVE SEARCH=================
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
              </a>
            `,
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

// ================= PRODUCTS STATE =================
const PAGE_SIZE = 8;
let currentPage = 0;
let currentCategory =
  new URLSearchParams(window.location.search).get("category") || "";
let currentSort = "newest";

const productsGrid = document.getElementById("products-grid");
const loadMoreBtn = document.getElementById("load-more-btn");
const resultsSummary = document.getElementById("results-summary");
const categorySelect = document.getElementById("filter-category");
const sortSelect = document.getElementById("filter-sort");
const clearFiltersBtn = document.getElementById("clear-filters");

// ================= LOAD CATEGORY DROPDOWN =================
async function loadCategoryOptions() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error || !data) return;
  data.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    categorySelect.appendChild(opt);
  });
  // URL se aayi category ko dropdown mein bhi select kar do
  if (currentCategory) categorySelect.value = currentCategory;
}
loadCategoryOptions();

// ================= SKELETON =================
function renderSkeletons(count) {
  return Array(count)
    .fill(
      `
    <div class="animate-pulse bg-white dark:bg-[#13131a] rounded-3xl overflow-hidden shadow-lg">
      <div class="w-full h-56 bg-gray-200 dark:bg-white/10"></div>
      <div class="p-5 space-y-3">
        <div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2"></div>
      </div>
    </div>
  `,
    )
    .join("");
}

// ================= BUILD + RUN QUERY =================
async function fetchProducts(page) {
  let query = supabase.from("products").select("*", { count: "exact" });

  if (currentCategory) query = query.eq("category_id", currentCategory);

  if (currentSort === "price-low")
    query = query.order("price", { ascending: true });
  else if (currentSort === "price-high")
    query = query.order("price", { ascending: false });
  else if (currentSort === "rating")
    query = query.order("rating", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  return query;
}

function productCard(product) {
  return `
    <div data-reveal="fade-up">
    <div class="bg-white dark:bg-[#13131a] rounded-3xl shadow-lg transform-gpu transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20" > 
      
    <div class="relative group">
        <div class="overflow-hidden rounded-t-3xl">
          <img src="${product.image_url}" alt="${product.name}" class="w-full h-56 object-cover group-hover:scale-105 transition-transform ease-in-out duration-300">
        </div>
        <button
          class="wishlist-btn active:scale-90 absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-[#13131a]/90 shadow-md text-gray-600 flex items-center justify-center hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
          data-id="${product.id}"
          aria-label="Wishlist"
        >
         <svg
         xmlns="http://www.w3.org/2000/svg"
         class="w-5 h-5 fill-current pointer-events-none transition-colors duration-300"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round">
       <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>
      </svg>
        </button>
        ${(product.discount_percent || 0) > 0 ? `<span class="absolute top-4 left-4 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">-${product.discount_percent}%</span>` : ""}
        <button class="quick-view-btn absolute inset-x-4 bottom-4 hover:bg-primary  py-2 rounded-xl bg-black/70 text-white text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300" data-id="${product.id}">
          Quick View
        </button>
      </div>
      <div class="p-5">
        <h3 class="font-semibold text-lg line-clamp-1">${product.name}</h3>
        <div class="flex items-center justify-between mt-3">
          <span class="text-primary text-xl font-bold">$${Number(product.price).toFixed(2)}</span>
          <span class="text-yellow-500">⭐ ${product.rating ?? 5}</span>
        </div>
        <button class="add-cart-btn mt-4 w-full bg-primary text-white py-2.5 rounded-xl hover:bg-primary-dark transition" data-id="${product.id}">Add To Cart</button>
      </div>
    </div>
    </div>
  `;
}

async function loadProducts({ reset = false } = {}) {
  if (reset) {
    currentPage = 0;
    productsGrid.innerHTML = renderSkeletons(8);
  } else {
    loadMoreBtn.textContent = "Loading...";
    loadMoreBtn.disabled = true;
  }

  try {
    const { data, error, count } = await fetchProducts(currentPage);
    if (error) throw error;

    if (reset) productsGrid.innerHTML = "";

    if (!data.length && reset) {
      productsGrid.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">No products match your filters</p>`;
      loadMoreBtn.classList.add("hidden");
      resultsSummary.textContent = "0 products found";
      return;
    }

    productsGrid.insertAdjacentHTML(
      "beforeend",
      data.map(productCard).join(""),
    );
    document
      .querySelectorAll("#products-grid [data-reveal]:not(.revealed)")
      .forEach((el) => revealObserver.observe(el));

    const loadedSoFar = (currentPage + 1) * PAGE_SIZE;
    resultsSummary.textContent = `${Math.min(loadedSoFar, count)} of ${count} products`;

    if (loadedSoFar < count) {
      loadMoreBtn.classList.remove("hidden");
      loadMoreBtn.textContent = "Load More";
      loadMoreBtn.disabled = false;
    } else {
      loadMoreBtn.classList.add("hidden");
    }
  } catch (err) {
    console.error(err);
    productsGrid.innerHTML = `<p class="col-span-full text-center text-red-500 py-10">Failed to load products</p>`;
    loadMoreBtn.classList.add("hidden");
  }
  await syncWishlistIcons();
}

loadMoreBtn.addEventListener("click", () => {
  currentPage++;
  loadProducts();
});

categorySelect.addEventListener("change", () => {
  currentCategory = categorySelect.value;
  toggleClearFilters();
  loadProducts({ reset: true });
});

sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  loadProducts({ reset: true });
});

function toggleClearFilters() {
  clearFiltersBtn.classList.toggle("hidden", !currentCategory);
}

clearFiltersBtn.addEventListener("click", () => {
  currentCategory = "";
  categorySelect.value = "";
  toggleClearFilters();
  loadProducts({ reset: true });
});

toggleClearFilters();
loadProducts({ reset: true });
// Header jaise standalone [data-reveal] elements jo kisi grid ke andar nahi hain
document
  .querySelectorAll("[data-reveal]:not(#products-grid *):not(#modal-body *)")
  .forEach((el) => revealObserver.observe(el));

// ================= QUICK VIEW MODAL =================
const modal = document.getElementById("quick-view-modal");
const modalCard = document.getElementById("modal-card");
const modalBody = document.getElementById("modal-body");

function openModal() {
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  requestAnimationFrame(() => {
    modalCard?.classList.remove("scale-95", "opacity-0");
  });
}

function closeModal() {
  if (!modal) return;
  modalCard?.classList.add("scale-95", "opacity-0");
  setTimeout(() => {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, 300);

  // URL se ?id= query param remove karein
  const url = new URL(window.location);
  if (url.searchParams.has("id")) {
    url.searchParams.delete("id");
    window.history.replaceState({}, "", url);
  }
}

document.getElementById("modal-close")?.addEventListener("click", closeModal);
document
  .getElementById("modal-backdrop")
  ?.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.classList.contains("hidden"))
    closeModal();
});

async function openQuickView(productId) {
  modalBody.innerHTML = `
    <div class="animate-pulse h-72 md:h-full bg-gray-200 dark:bg-white/10"></div>
    <div class="p-8 space-y-4">
      <div class="h-6 bg-gray-200 dark:bg-white/10 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-full"></div>
      <div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3"></div>
      <div class="h-10 bg-gray-200 dark:bg-white/10 rounded w-full mt-8"></div>
    </div>
  `;
  openModal();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !product) {
    modalBody.innerHTML = `<p class="col-span-2 text-center text-red-500 py-16 font-medium">Couldn't load product details.</p>`;
    return;
  }

  const hasDiscount = (product.discount_percent || 0) > 0;
  const originalPrice = hasDiscount
    ? product.price / (1 - product.discount_percent / 100)
    : null;
  const inStock = (product.stock ?? 0) > 0;

  // Check wishlist status for active user session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let isWished = false;

  if (session) {
    const { data: wishData } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("product_id", productId)
      .maybeSingle();
    if (wishData) isWished = true;
  }

  modalBody.innerHTML = `
    <div class="relative h-64 md:h-full bg-gray-100 dark:bg-white/5">
      <img src="${product.image_url}" alt="${product.name}" class="w-full h-full object-cover">
      ${hasDiscount ? `<span class="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">-${product.discount_percent}% OFF</span>` : ""}
    </div>

    <div class="p-6 md:p-8 flex flex-col justify-between">
      <div>
        <h2 class="font-heading text-2xl font-bold text-gray-900 dark:text-white pr-8">${product.name}</h2>

        <div class="flex items-center gap-2 mt-2">
          <span class="text-yellow-500 font-semibold">⭐ ${product.rating ?? 5.0}</span>
          <span class="text-gray-400 text-sm">•</span>
          <span class="text-sm font-medium ${inStock ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}">
            ${inStock ? `In Stock (${product.stock} available)` : "Out of Stock"}
          </span>
        </div>

        <div class="flex items-end gap-3 mt-4">
          <span class="text-3xl font-bold text-primary dark:text-white">$${Number(product.price).toFixed(2)}</span>
          ${hasDiscount ? `<span class="text-gray-400 line-through text-lg mb-1">$${originalPrice.toFixed(2)}</span>` : ""}
        </div>

        <p class="text-gray-600 dark:text-gray-300 text-sm mt-4 leading-relaxed line-clamp-3">
          ${product.description || "High quality premium tech product available now on TechNest."}
        </p>

        <div class="flex items-center gap-4 mt-6">
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity:</span>
          <div class="flex items-center border border-gray-300 dark:border-white/20 rounded-full bg-gray-50 dark:bg-white/5 overflow-hidden">
            <button id="qty-minus" class="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition font-bold text-lg cursor-pointer">−</button>
            <span id="qty-value" class="w-10 text-center font-bold text-sm text-gray-900 dark:text-white">1</span>
            <button id="qty-plus" class="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition font-bold text-lg cursor-pointer">+</button>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-white/10">
        <button id="modal-wishlist-btn" data-id="${product.id}" aria-label="Wishlist" 
          class="active:scale-90 w-12 h-12 shrink-0 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm ${isWished ? "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200" : "text-gray-600 dark:text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"} flex items-center justify-center transition cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5 fill-current pointer-events-none transition-colors duration-300"
            viewBox="0 0 24 24"
            fill="${isWished ? "currentColor" : "none"}"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>
          </svg>
        </button>

        <button id="modal-add-cart-btn" data-id="${product.id}" ${!inStock ? "disabled" : ""}
          class="flex-1 bg-primary text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer py-3 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <span>${inStock ? "Add To Cart" : "Out of Stock"}</span>
        </button>
      </div>
    </div>
  `;

  // Quantity Counter
  let qty = 1;
  const qtyValue = document.getElementById("qty-value");
  document.getElementById("qty-minus")?.addEventListener("click", () => {
    if (qty > 1) {
      qty--;
      qtyValue.textContent = qty;
    }
  });
  document.getElementById("qty-plus")?.addEventListener("click", () => {
    if (qty < (product.stock ?? 99)) {
      qty++;
      qtyValue.textContent = qty;
    } else {
      if (typeof showToast === "function") {
        showToast(`Only ${product.stock} items available in stock`, "error");
      }
    }
  });

  // ================= MODAL ADD TO CART FUNCTIONALITY =================
  const addCartBtn = document.getElementById("modal-add-cart-btn");

  addCartBtn?.addEventListener("click", async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      if (typeof showToast === "function") {
        showToast("Please login first to add items", "error");
      }
      return;
    }

    const origText = addCartBtn.innerHTML;
    addCartBtn.disabled = true;
    addCartBtn.innerHTML = `<span class="animate-spin text-lg inline-block">⏳</span> Adding...`;

    try {
      const { data: existing, error: fetchErr } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", session.user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing) {
        //Check PEHLE SE CART MEIN HAI
        const newQty = existing.quantity + qty;

        if (product.stock && newQty > product.stock) {
          if (typeof showToast === "function") {
            showToast(
              `Already in Cart (${existing.quantity})! Cannot exceed stock limit (${product.stock})`,
              "error",
            );
          }
          return;
        }

        const { error: updateErr } = await supabase
          .from("cart_items")
          .update({ quantity: newQty })
          .eq("id", existing.id);

        if (updateErr) throw updateErr;

        if (typeof showToast === "function") {
          showToast(
            `⚠️ Already in Cart! Quantity updated to ${newQty}`,
            "info",
          );
        }

        // Clean & Clear Button Text
        addCartBtn.classList.remove("bg-primary");
        addCartBtn.classList.add("bg-amber-600");
        addCartBtn.innerHTML = `⚠️ Already in Cart`;

        setTimeout(() => {
          addCartBtn.classList.remove("bg-amber-600");
          addCartBtn.classList.add("bg-primary");
          addCartBtn.innerHTML = origText;
        }, 2000);
      } else {
        // PEHLI DAFA ADD HO RAHA HAI
        const { error: insertErr } = await supabase.from("cart_items").insert({
          user_id: session.user.id,
          product_id: product.id,
          quantity: qty,
        });

        if (insertErr) throw insertErr;

        if (typeof showToast === "function") {
          showToast(`🎉 Added ${qty} item(s) to Cart!`, "success");
        }

        addCartBtn.classList.remove("bg-primary");
        addCartBtn.classList.add("bg-emerald-600");
        addCartBtn.innerHTML = `✓ Added to Cart`;

        setTimeout(() => {
          addCartBtn.classList.remove("bg-emerald-600");
          addCartBtn.classList.add("bg-primary");
          addCartBtn.innerHTML = origText;
        }, 2000);
      }

      if (typeof loadCartCount === "function") {
        await loadCartCount(session.user.id);
      }
    } catch (err) {
      console.error("Cart error:", err);
      if (typeof showToast === "function") {
        showToast("Failed to update cart. Please try again.", "error");
      }
    } finally {
      addCartBtn.disabled = false;
    }
  });

  // ================= MODAL WISHLIST TOGGLE FUNCTIONALITY =================
  const wishBtn = document.getElementById("modal-wishlist-btn");
  wishBtn?.addEventListener("click", async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      if (typeof showToast === "function")
        showToast("Please login first", "error");
      return;
    }

    const svg = wishBtn?.querySelector("svg");
    wishBtn.style.pointerEvents = "none";

    try {
      const { data: existing } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;

        wishBtn.classList.remove(
          "text-rose-500",
          "bg-rose-50",
          "dark:bg-rose-950/40",
          "border-rose-200",
        );
        wishBtn.classList.add("text-gray-600", "dark:text-gray-300");
        if (svg) svg.setAttribute("fill", "none");

        if (typeof showToast === "function") {
          showToast("Removed from Wishlist", "info");
        }
      } else {
        const { error } = await supabase.from("wishlist").insert({
          user_id: session.user.id,
          product_id: product.id,
        });

        if (error) throw error;

        wishBtn.classList.add(
          "text-rose-500",
          "bg-rose-50",
          "dark:bg-rose-950/40",
          "border-rose-200",
        );
        wishBtn.classList.remove("text-gray-600", "dark:text-gray-300");
        if (svg) svg.setAttribute("fill", "currentColor");

        if (typeof showToast === "function") {
          showToast("❤️ Added to Wishlist!", "success");
        }
      }

      if (typeof loadWishlistCount === "function") await loadWishlistCount();
      if (typeof syncWishlistIcons === "function") await syncWishlistIcons();
    } catch (err) {
      console.error("Wishlist error:", err);
      if (typeof showToast === "function") {
        showToast("Something went wrong with wishlist", "error");
      }
    } finally {
      wishBtn.style.pointerEvents = "auto";
    }
  });
}

// Grid ke andar kisi bhi "quick-view-btn" pe click ho to modal khulay
productsGrid?.addEventListener("click", (e) => {
  const btn = e.target.closest(".quick-view-btn");
  if (btn) openQuickView(btn.dataset.id);
});

// Page load hote hi agar URL mein ?id= hai to modal auto-open ho jaye
const urlProductId = new URLSearchParams(window.location.search).get("id");
if (urlProductId) openQuickView(urlProductId);

// ================= TOAST =================
function showToast(message, type = "success") {
  const toastId = `${type}-${message}`;

  if (document.getElementById(toastId)) return;
  const container = document.getElementById("toast-container");
  if (!container) return;

  const colors = { success: "bg-primary", error: "bg-red-500" };
  const toast = document.createElement("div");
  toast.id = toastId;
  toast.className = `${colors[type] || colors.success} text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl opacity-0 translate-y-3 transition-all duration-300`;
  toast.textContent = message;
  container.appendChild(toast);

  // Thoda delay taake transition trigger ho (class lagane se browser skip kar deta hai)
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-3");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-3");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ================= ADD TO CART =================
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".add-cart-btn");
  if (!btn) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    showToast("Please login first", "error");
    return;
  }

  const productId = btn.dataset.id;

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    showToast("Already Added To Cart", "error");
    return;
  }

  const { error } = await supabase.from("cart_items").insert({
    user_id: session.user.id,
    product_id: productId,
    quantity: 1,
  });

  if (error) {
    showToast("Failed to add cart", "error");
    return;
  }

  await loadCartCount(session.user.id);
  showToast("Added To Cart");
});

// ================= WISHLIST TOGGLE (Product Cards Par Click Feature) =================
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".wishlist-btn");
  if (!btn) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    showToast("Please login first", "error");
    return;
  }

  const productId = btn.dataset.id;
  btn.style.pointerEvents = "none"; // Double click se bachane ke liye

  try {
    // Check karein ke pehle se wishlist me hai ya nahi
    const { data: existing, error: fetchErr } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existing) {
      // Agar pehle se hai to Remove karein
      const { error: delErr } = await supabase
        .from("wishlist")
        .delete()
        .eq("id", existing.id);

      if (delErr) throw delErr;

      showToast("Removed from Wishlist", "error");
    } else {
      // Agar nahi hai to Insert karein
      const { error: insErr } = await supabase.from("wishlist").insert({
        user_id: session.user.id,
        product_id: productId,
      });

      if (insErr) throw insErr;

      showToast("❤️ Added to Wishlist!", "success");
    }

    // Top navbar count update karein aur icons sync karein
    await loadWishlistCount();
    await syncWishlistIcons();
  } catch (err) {
    console.error("Wishlist error:", err);
    showToast("Something went wrong with wishlist", "error");
  } finally {
    btn.style.pointerEvents = "auto";
  }
});

// ================= WISHLIST ICONS KO DB SE SYNC KARNA =================
async function syncWishlistIcons() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return;

  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", session.user.id);

  if (!error && data) {
    const wishedIds = new Set(data.map((w) => String(w.product_id)));

    // DOM par jitne bhi wishlist buttons hain unka color update karein
    document.querySelectorAll(".wishlist-btn").forEach((btn) => {
      const pid = String(btn.dataset.id);
      const svg = btn.querySelector("svg");

      if (wishedIds.has(pid)) {
        btn.classList.add("text-rose-500", "bg-rose-50");
        btn.classList.remove("text-gray-600");
        if (svg) svg.setAttribute("fill", "currentColor");
      } else {
        btn.classList.remove("text-rose-500", "bg-rose-50");
        btn.classList.add("text-gray-600");
        if (svg) svg.setAttribute("fill", "none");
      }
    });
  }
}
