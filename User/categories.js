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

// ================= LIVE SEARCH =================
const desktopInput = document.getElementById("search-input");
const desktopResults = document.getElementById("search-results");

const mobileInput = document.getElementById("mobile-search-input");
const mobileResults = document.getElementById("mobile-search-results");

let searchDebounce;

// Generic function search handle karne ke liye
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

// Outside click par hide karna
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

        // Fade-in khatam hote hi data-reveal poora hata do —
        // taake hover transform is purani reveal-transition se kabhi clash na kare
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
// ================= SCROLL EFFECTS (progress bar + back-to-top + navbar shadow) =================
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

// ================= CATEGORIES GRID (Supabase se) =================
const categoriesGrid = document.getElementById("categories-grid");

async function loadCategories() {
  if (!categoriesGrid) return;

  // Skeleton loading
  categoriesGrid.innerHTML = Array(8)
    .fill(
      `
    <div class="animate-pulse bg-white dark:bg-[#13131a] rounded-3xl overflow-hidden shadow-lg">
      <div class="w-full h-40 bg-gray-200 dark:bg-white/10"></div>
      <div class="p-5"><div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3"></div></div>
    </div>
  `,
    )
    .join("");

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw error;

    if (!data.length) {
      categoriesGrid.innerHTML = `<p class="col-span-full text-center text-gray-500">No categories found</p>`;
      return;
    }

    categoriesGrid.innerHTML = "";
    data.forEach((category, i) => {
      categoriesGrid.innerHTML += `
        <a href="products.html?category=${category.id}" data-reveal="fade-up" style="--delay:${i * 60}ms"
          class="group rounded-3xl overflow-hidden bg-white dark:bg-[#13131a] shadow-lg translate-y-0 scale-100 transform-gpu hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 transition-transform duration-300 ease-out">
          <div class="overflow-hidden h-40">
            <img src="${category.image_url}" alt="${category.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
          </div>
          <div class="p-5 flex items-center justify-between">
            <h3 class="font-heading text-lg font-semibold group-hover:text-primary transition">${category.name}</h3>
            <svg class="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </a>
      `;
    });
    document
      .querySelectorAll("#categories-grid [data-reveal]")
      .forEach((el) => revealObserver.observe(el));
  } catch (err) {
    console.error(err);
    categoriesGrid.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to load categories</p>`;
  }
}
loadCategories();
