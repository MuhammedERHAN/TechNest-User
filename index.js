import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://egnaelwoflqxhgrcyxpf.supabase.co",
  "sb_publishable_FR475rnpTwXtsN0QHfaYdg_IrOe8LWm",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

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

// ================= ANNOUNCEMENT BAR (Per-Account Basis) =================
const announcementBar = document.getElementById("announcement-bar");
const closeAnnouncement = document.getElementById("close-announcement");

async function setupAnnouncementBar() {
  if (!announcementBar) return;

  // 1. Current logged-in user fetch karein
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Account ke mutabiq unique storage key banaye
  const storageKey = user
    ? `announcementClosed_${user.id}`
    : "announcementClosed_guest";

  // 3. Agar is specific account ne close kiya hua hai toh hide rakh
  if (localStorage.getItem(storageKey) === "true") {
    announcementBar.style.display = "none";
  } else {
    announcementBar.style.display = "flex";
  }

  // 4. Close button par sirf is active account ke liye save karein
  closeAnnouncement?.addEventListener("click", () => {
    announcementBar.style.display = "none";
    localStorage.setItem(storageKey, "true");
  });
}

setupAnnouncementBar();

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

// ================= GLOBAL SMOOTH SCROLL (Header, Footer & All Links) =================
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const targetId = link.getAttribute("href");

    // Agar href sirf '#' hai ya external link hai toh skip karein
    if (!targetId || targetId === "#" || !targetId.startsWith("#")) return;

    const targetSection = document.querySelector(targetId);
    if (targetSection) {
      e.preventDefault();

      // Dynamic Header Height Calculate karein (taaki section header ke neeche na chhupe)
      const navHeight = document.getElementById("navbar")?.offsetHeight || 70;
      const sectionTop = targetSection.offsetTop - navHeight;

      // Smooth Scroll
      window.scrollTo({
        top: sectionTop,
        behavior: "smooth",
      });
    }
  });
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

// ================= AUTH STATE — navbar login/logout ke hisaab se badalta... =================
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

    window.location.href = "index.html";
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

// ================= SCROLL EFFECTS =================
// Premium Glassmorphism Navbar Effect on Scroll.......
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
              <a href="User/products.html?id=${item.id}" class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-white/10 transition border-b border-gray-100 dark:border-white/5 last:border-0">
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

// ================= TYPEWRITER =================
const typewriterEl = document.getElementById("typewriter");

const words = ["Perfect Style", "Best Deals", "Dream Products"];

let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeLoop() {
  if (!typewriterEl) return;
  const currentWord = words[wordIndex];

  charIndex += isDeleting ? -1 : 1;

  typewriterEl.textContent = currentWord.slice(0, charIndex);

  let delay = isDeleting ? 50 : 100;

  if (!isDeleting && charIndex === currentWord.length) {
    delay = 1500;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    wordIndex = (wordIndex + 1) % words.length;
    delay = 300;
  }

  setTimeout(typeLoop, delay);
}

if (typewriterEl) {
  typeLoop();
}

// ================= MOUSE PARALLAX (hero image) =================
const heroParallax = document.getElementById("hero-parallax");
const heroImageWrap = document.getElementById("hero-image-wrap");
let heroRAF = null;
heroParallax?.addEventListener("mousemove", (e) => {
  if (!heroImageWrap) return;

  if (heroRAF) cancelAnimationFrame(heroRAF);

  heroRAF = requestAnimationFrame(() => {
    const x = (e.clientX - window.innerWidth / 2) / window.innerWidth;
    const y = (e.clientY - window.innerHeight / 2) / window.innerHeight;

    heroImageWrap.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
  });
});
heroParallax?.addEventListener("mouseleave", () => {
  if (heroImageWrap) {
    heroImageWrap.style.transform = "translate(0,0)";
  }
});

// ================= COUNT UP =================
function countUp(el, target, duration = 1500) {
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);

    el.textContent = Math.floor(progress * target).toLocaleString() + "+";
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const counter = document.getElementById("happy-customers-count");

if (counter) {
  countUp(counter, 25000);
}

// ================= SCROLL REVEAL =================
const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              el.classList.add("revealed");
              el.style.transitionDelay = "0s"; // reveal ho gaya - ab hover kabhi delayed na ho

              // Reveal hone ke bad khtm effect
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
      )
    : null;
document.querySelectorAll("[data-reveal]").forEach((el) => {
  if (revealObserver) {
    revealObserver.observe(el);
  } else {
    el.classList.add("revealed");
  }
});
// ================= SKELETON HELPER =================
function skeletonCards(count = 4, imgHeight = "h-56") {
  return new Array(count)
    .fill(
      `
    <div class="animate-pulse bg-white dark:bg-[#13131a] rounded-3xl overflow-hidden shadow-lg">
      <div class="w-full ${imgHeight} bg-gray-200 dark:bg-white/10"></div>
      <div class="p-5 space-y-3">
        <div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2"></div>
      </div>
    </div>
  `,
    )
    .join("");
}

// ================= FEATURED CATEGORIES (Supabase se live, homepage pe 8 tak preview) =================
const categoriesGrid = document.getElementById("categories-grid");

async function loadCategories() {
  if (!categoriesGrid) return;

  categoriesGrid.innerHTML = Array(8)
    .fill(
      `
    <div class="animate-pulse bg-white dark:bg-[#13131a] rounded-3xl overflow-hidden shadow-lg">
      <div class="w-full h-56 bg-gray-200 dark:bg-white/10"></div>
      <div class="p-5"><div class="h-4 bg-gray-200 dark:bg-white/10 rounded w-2/3"></div></div>
    </div>
  `,
    )
    .join("");

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name")
      .limit(8);
    if (error) throw error;

    if (!data.length) {
      categoriesGrid.innerHTML = `<p class="col-span-full text-center text-gray-500">No categories found</p>`;
      return;
    }

    const categoryHTML = data
      .map(
        (category, index) => `
        <a href="User/products.html?category=${category.id}" data-reveal="fade-up" 
          class="group rounded-3xl overflow-hidden bg-white dark:bg-[#13131a] shadow-lg transform-gpu transition-transform duration-200 ease-out hover:-translate-y-1.5  hover:shadow-2xl hover:shadow-primary/20">
          <div class="overflow-hidden">
            <img src="${category.image_url}" alt="${category.name}" loading="lazy"
              class="w-full h-56 object-cover transform-gpu will-change-transform scale-100 transition-transform duration-300 ease-in-out group-hover:scale-110">
          </div>
          <div class="p-5">
            <h3 class="font-heading text-xl font-semibold group-hover:text-primary transition">${category.name}</h3>
          </div>
        </a>
     `,
      )
      .join("");

    categoriesGrid.innerHTML = categoryHTML;
    document
      .querySelectorAll("#categories-grid [data-reveal]")
      .forEach((el) => revealObserver.observe(el));
  } catch (err) {
    console.error(err);
    categoriesGrid.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to load categories</p>`;
  }
}
loadCategories();

// ================= TRENDING PRODUCTS =================
const trendingProducts = document.getElementById("trending-products");
async function loadTrendingProducts() {
  if (!trendingProducts) return;

  trendingProducts.innerHTML = skeletonCards(8, "h-60");

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) throw error;

    if (!data.length) {
      trendingProducts.innerHTML = `
        <p class="col-span-full text-center">
          No Products Found
        </p>
      `;

      return;
    }

    trendingProducts.innerHTML = "";

    const productCards = data.map(
      (product) => `
    <div
      class="h-full flex flex-col bg-white dark:bg-[#13131a] rounded-3xl shadow-lg translate-y-0 scale-100 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10 transform-gpu transition-transform duration-300 ease-out"
      data-reveal="fade-up"
    >
      <div class="relative">
            <div class="overflow-hidden rounded-t-3xl">

        <img
          src="${product.image_url}"
          alt="${product.name}"
          class="w-full h-60 object-cover"
          loading="lazy"
        >
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
      </div>

     <div class="p-5 flex flex-col flex-1">
        <h3 class="font-semibold text-lg line-clamp-1">
          ${product.name}
        </h3>

        <div class="flex items-center justify-between mt-3">
          <span class="text-primary text-xl font-bold">
            $${Number(product.price).toFixed(2)}
          </span>

          <span class="flex items-center gap-1 text-yellow-500 font-semibold">
            <svg class="w-4 h-4 fill-yellow-500" viewBox="0 0 24 24"><path d="M12 2l2.9 6.26L21 9.27l-4.5 4.38L17.8 21 12 17.77 6.2 21l1.3-7.35L3 9.27l6.1-1.01L12 2z"/></svg>
            ${product.rating ?? 5}
          </span>
        </div>

        ${
          (product.discount_percent || 0) > 0
            ? `<p class="text-green-500 text-sm mt-2">${product.discount_percent}% OFF</p>`
            : ""
        }

        <button
          class="add-cart-btn mt-auto w-full bg-primary text-white py-3 rounded-xl hover:bg-primary-dark transition cursor-pointer"
          data-id="${product.id}"
        >
          Add To Cart
        </button>
      </div>
    </div>
    `,
    );
    trendingProducts.innerHTML = productCards.join("");
  } catch (err) {
    console.error(err);

    trendingProducts.innerHTML = `

    <p class="col-span-full text-center text-red-500">

      Failed To Load Products

    </p>

    `;
  }
  document
    .querySelectorAll("#trending-products [data-reveal]")
    .forEach((el) => revealObserver.observe(el));

  await syncWishlistIcons();
}

loadTrendingProducts();

// ================= FLASH SALE COUNTDOWN =================
function getFlashSaleEndTime() {
  const saved = localStorage.getItem("flashSaleEnd");
  if (saved && Number(saved) > Date.now()) return Number(saved);
  const newEnd = Date.now() + 8 * 60 * 60 * 1000;
  localStorage.setItem("flashSaleEnd", newEnd);
  return newEnd;
}
const flashSaleEnd = getFlashSaleEndTime();

function updateCountdown() {
  const diff = flashSaleEnd - Date.now();
  if (diff <= 0) {
    localStorage.removeItem("flashSaleEnd");
    location.reload();
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const fcHours = document.getElementById("fc-hours");
  const fcMinutes = document.getElementById("fc-minutes");
  const fcSeconds = document.getElementById("fc-seconds");
  if (fcHours) fcHours.textContent = String(h).padStart(2, "0");
  if (fcMinutes) fcMinutes.textContent = String(m).padStart(2, "0");
  if (fcSeconds) fcSeconds.textContent = String(s).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ================= FLASH SALE PRODUCTS =================
const flashSaleGrid = document.getElementById("flash-sale-products");
async function loadFlashSaleProducts() {
  if (!flashSaleGrid) return;
  flashSaleGrid.innerHTML = skeletonCards(4, "h-52");
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .gt("discount_percent", 0)
      .order("discount_percent", { ascending: false })
      .limit(4);
    if (error) throw error;

    if (!data.length) {
      flashSaleGrid.innerHTML = `<p class="col-span-full text-center text-gray-500">No flash deals right now</p>`;
      return;
    }

    const flashHTML = data
      .map(
        (product) => `
        <div class="h-full flex flex-col bg-white dark:bg-[#13131a] rounded-3xl overflow-hidden shadow-lg translate-y-0 scale-100
hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 ease-out" data-reveal="fade-up">
          <div class="relative">
            <img loading="lazy" src="${product.image_url}" alt="${product.name}" class="w-full h-52 object-cover">
            <span class="absolute top-3 left-3 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">-${product.discount_percent}%</span>
          </div>
          <div class="p-5 flex flex-col flex-1">
            <h3 class="font-semibold text-lg line-clamp-1">${product.name}</h3>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-primary text-xl font-bold">$${Number(product.price).toFixed(2)}</span>
              <span class="text-gray-400 text-sm line-through">$${(product.price / (1 - product.discount_percent / 100)).toFixed(2)}</span>
            </div>
            <button class="add-cart-btn mt-auto w-full bg-primary text-white py-2.5 rounded-xl hover:bg-primary-dark transition" data-id="${product.id}">Add To Cart</button>
          </div>
        </div>
     `,
      )
      .join("");

    flashSaleGrid.innerHTML = flashHTML;

    document
      .querySelectorAll("#flash-sale-products [data-reveal]")
      .forEach((el) => revealObserver.observe(el));
  } catch (err) {
    console.error(err);
    flashSaleGrid.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to load deals</p>`;
  }
}
loadFlashSaleProducts();

// ================= BEST SELLING PRODUCTS (rating ke hisaab se) =================
const bestSellingGrid = document.getElementById("best-selling-products");
async function loadBestSellingProducts() {
  if (!bestSellingGrid) return;
  bestSellingGrid.innerHTML = skeletonCards(8, "h-60");

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("rating", { ascending: false })
      .limit(8);

    if (error) throw error;

    if (!data.length) {
      bestSellingGrid.innerHTML = `<p class="col-span-full text-center">No Products Found</p>`;
      return;
    }

    const bestHTML = data
      .map(
        (product) => `
        <div class="h-full flex flex-col bg-white dark:bg-[#13131a] rounded-3xl overflow-hidden shadow-lg translate-y-0 scale-100
hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 ease-out" data-reveal="fade-up">
          <img loading="lazy" src="${product.image_url}" alt="${product.name}" class="w-full h-60 object-cover">
          <div class="p-5 flex flex-col flex-1">
            <h3 class="font-semibold text-lg line-clamp-1">${product.name}</h3>
            <div class="flex items-center justify-between mt-3">
              <span class="text-primary text-xl font-bold">$${Number(product.price).toFixed(2)}</span>
              <span class="flex items-center gap-1 text-yellow-500 font-semibold">
              <svg class="w-4 h-4 fill-yellow-500" viewBox="0 0 24 24"><path d="M12 2l2.9 6.26L21 9.27l-4.5 4.38L17.8 21 12 17.77 6.2 21l1.3-7.35L3 9.27l6.1-1.01L12 2z"/></svg>
              ${product.rating ?? 5}
            </span>
            </div>
            ${
              (product.discount_percent || 0) > 0
                ? `<p class="text-green-500 text-sm mt-2">${product.discount_percent}% OFF</p>`
                : ""
            }
           <button class="add-cart-btn mt-auto w-full bg-primary text-white py-3 rounded-xl hover:bg-primary-dark transition" data-id="${product.id}">Add To Cart</button>
          </div>
        </div>
      `,
      )
      .join("");

    bestSellingGrid.innerHTML = bestHTML;

    document
      .querySelectorAll("#best-selling-products [data-reveal]")
      .forEach((el) => revealObserver.observe(el));
  } catch (err) {
    console.error(err);
    showToast(
      "Something went wrong",

      "error",
    );
    bestSellingGrid.innerHTML = `<p class="col-span-full text-center text-red-500">Failed To Load Products</p>`;
  }
}
loadBestSellingProducts();

// ================= TESTIMONIALS =================
const testimonials = [
  {
    name: "Malka Khan",
    role: "Software Engineer",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300",
    text: "Amazing quality products! Delivery in Karachi was super fast and customer support was extremely helpful.",
  },
  {
    name: "Muhammad Irfan",
    role: "Frontend Developer",
    image: "./irfan.jpg",
    text: "TechNest is my go-to place for buying developer gadgets. 100% original quality and smooth experience.",
  },
  {
    name: "Kiran Fatima",
    role: "UI/UX Designer",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
    text: "Beautiful website aesthetic, fast checkout, and top-tier tech items. Highly recommended for devs in Pakistan!",
  },
];

const slider = document.getElementById("testimonial-slider");
const dots = document.getElementById("testimonial-dots");

let currentSlide = 0;

function renderTestimonials() {
  if (!slider) return;

  slider.innerHTML = "";
  if (dots) dots.innerHTML = "";

  testimonials.forEach((item, index) => {
    slider.innerHTML += `
      <div class="min-w-full px-4 sm:px-6">
        <div class="max-w-2xl mx-auto bg-white dark:bg-[#13131a] border border-gray-100 dark:border-white/10 rounded-3xl shadow-xl p-6 sm:p-10 text-center">
          <img
            loading="lazy"
            src="${item.image}"
            class="w-20 h-20 rounded-full mx-auto mb-5 border-4 border-primary object-cover shadow-md"
            alt="${item.name}"
          >
          <p class="text-gray-600 dark:text-gray-300 italic text-sm sm:text-base leading-relaxed">
            "${item.text}"
          </p>
          <h3 class="font-heading text-xl font-semibold mt-6 text-gray-900 dark:text-white">
            ${item.name}
          </h3>
          <p class="text-primary text-sm font-medium mt-1">
            ${item.role}
          </p>
        </div>
      </div>
    `;

    if (dots) {
      dots.innerHTML += `
        <button
          data-index="${index}"
          class="w-3 h-3 rounded-full bg-gray-300 dark:bg-white/20 transition-all duration-300"
        ></button>
      `;
    }
  });

  updateSlider();
}

function updateSlider() {
  if (!slider || !dots) return;

  slider.style.transform = `translateX(-${currentSlide * 100}%)`;

  const allDots = dots.querySelectorAll("button");

  allDots.forEach((dot, index) => {
    if (index === currentSlide) {
      dot.classList.remove("bg-gray-300", "dark:bg-white/20");
      dot.classList.add("bg-primary", "scale-125");
    } else {
      dot.classList.remove("bg-primary", "scale-125");
      dot.classList.add("bg-gray-300", "dark:bg-white/20");
    }
  });
}

if (dots) {
  dots.addEventListener("click", (e) => {
    if (!e.target.dataset.index) return;

    currentSlide = Number(e.target.dataset.index);

    updateSlider();
  });
}

let sliderInterval;

function startSlider() {
  sliderInterval = setInterval(() => {
    currentSlide++;

    if (currentSlide >= testimonials.length) {
      currentSlide = 0;
    }

    updateSlider();
  }, 3000);
}

function stopSlider() {
  clearInterval(sliderInterval);
}

renderTestimonials();

if (slider) {
  startSlider();

  slider.addEventListener("mouseenter", stopSlider);
  slider.addEventListener("mouseleave", startSlider);
}
// ================= BRAND PARTNERS (infinite marquee) =================
const brands = [
  { name: "Apple", class: "font-body font-light tracking-wide" },
  { name: "Google", class: "font-body font-bold tracking-tight" },
  { name: "Microsoft", class: "font-body font-semibold tracking-normal" },
  { name: "SAMSUNG", class: "font-body font-black tracking-[0.25em]" },
  { name: "SONY", class: "font-body font-light tracking-[0.35em]" },
  { name: "Intel", class: "font-body italic font-semibold tracking-tight" },
  { name: "AMD", class: "font-heading font-black tracking-wide" },
  { name: "NVIDIA", class: "font-heading font-bold tracking-[0.18em]" },
  { name: "ASUS", class: "font-heading font-black italic tracking-tight" },
  { name: "Lenovo", class: "font-body font-bold tracking-tight" },
  { name: "Dell", class: "font-body font-semibold italic" },
  { name: "HP", class: "font-heading font-black" },
  { name: "Logitech", class: "font-body font-semibold italic" },
  {
    name: "Razer",
    class: "font-heading font-black tracking-[0.15em] uppercase",
  },
  { name: "HyperX", class: "font-heading font-black italic tracking-tight" },
  { name: "SteelSeries", class: "font-body font-semibold tracking-wide" },
  { name: "adidas", class: "font-heading font-black lowercase tracking-tight" },
  { name: "NIKE", class: "font-heading font-black italic tracking-tight" },
  { name: "Canon", class: "font-heading font-black italic" },
  { name: "DJI", class: "font-body font-extrabold tracking-[0.15em]" },
];

const marquee = document.getElementById("brand-marquee");

function renderMarquee() {
  if (!marquee) return;
  const doubledBrands = [...brands, ...brands];
  marquee.innerHTML = doubledBrands
    .map(
      (brand) => `
        <div class="inline-block px-3 py-1 shrink-0 cursor-default transition-transform duration-300 hover:scale-105">
          <span class="inline-block px-1.5 py-0.5 ${brand.class} text-2xl md:text-3xl text-gray-400/60 dark:text-white/20 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#7C5CFC] hover:to-[#34E4EA] transition-all duration-300">
            ${brand.name}
          </span>
        </div>
      `,
    )
    .join("");
}

renderMarquee();

// ================= TOAST — reusable=================
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

  // Thoda delay taake transition trigger ho ( class lagane se browser skip kar deta hai)
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
    .select("id, quantity")
    .eq("user_id", session.user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity: existing.quantity + 1,
      })
      .eq("id", existing.id);

    if (error) {
      showToast("Failed to update cart", "error");
      return;
    }
  } else {
    const { error } = await supabase.from("cart_items").insert({
      user_id: session.user.id,
      product_id: productId,
      quantity: 1,
    });

    if (error) {
      showToast("Failed to add cart", "error");
      return;
    }
  }

  await loadCartCount(session.user.id);

  showToast("Added To Cart");
});

// ================= WISHLIST TOGGLE (With Active Red/Pink Heart State) =================
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
  const svg = btn.querySelector("svg");

  // Check if already in wishlist
  const { data: existing } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    // Remove from wishlist
    await supabase.from("wishlist").delete().eq("id", existing.id);
    btn.classList.remove("text-pink-500", "bg-pink-50");
    btn.classList.add("text-gray-600");
    if (svg) svg.setAttribute("fill", "none");
    showToast("Removed From Wishlist");
  } else {
    // Add to wishlist
    const { error } = await supabase.from("wishlist").insert({
      user_id: session.user.id,
      product_id: productId,
    });

    if (error) {
      showToast("Failed to add wishlist", "error");
      return;
    }

    btn.classList.add("text-pink-500", "bg-pink-50");
    btn.classList.remove("text-gray-600");
    if (svg) svg.setAttribute("fill", "currentColor");
    showToast("Added To Wishlist");
  }

  await loadWishlistCount();
});

// ================= WISHLIST ICONS KO DB SE SYNC KARNA (refresh pe bhi red rahe) =================
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
        btn.classList.add("text-pink-500", "bg-pink-50");
        btn.classList.remove("text-gray-600");
        if (svg) svg.setAttribute("fill", "currentColor");
      } else {
        btn.classList.remove("text-pink-500", "bg-pink-50");
        btn.classList.add("text-gray-600");
        if (svg) svg.setAttribute("fill", "none");
      }
    });
  }
}

// ================= NEWSLETTER =================
const newsletterForm = document.getElementById("newsletter-form");
newsletterForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const emailInput = document.getElementById("newsletter-email");
  const email = emailInput.value.trim();

  if (!email) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    showToast("Enter a valid email address", "error");
    return;
  }

  showToast("Subscribed successfully!!🎉We'll keep you updated.");
  emailInput.value = "";
});

// ================= FOOTER COPYRIGHT YEAR =================
const copyrightYear = document.getElementById("copyright-year");
if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

//// RESULTS HIDE AFTER PRESSING ESCAPE KEY
document.querySelectorAll("img").forEach((img) => {
  if (!img.hasAttribute("loading")) {
    img.loading = "lazy";
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchResults?.classList.add("hidden");
  }
});

// ================= CONTACT FORM SUBMISSION =================
const contactForm = document.getElementById("contact-form");

contactForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const messageInput = document.getElementById("contact-message");

  const name = nameInput?.value.trim();
  const email = emailInput?.value.trim();
  const message = messageInput?.value.trim();

  // Array to collect missing field labels
  const missingFields = [];

  if (!name) missingFields.push("Name");
  if (!email) missingFields.push("Email");
  if (!message) missingFields.push("Message");

  // 1. Agar teeno (3) fields khali hain
  if (missingFields.length === 3) {
    showToast("Please fill in all fields", "error");
    nameInput?.focus();
    return;
  }

  // 2. Agar 2 fields missing hain (e.g. "Name and Message")
  if (missingFields.length === 2) {
    showToast(`Please fill ${missingFields.join(" and ")}`, "error");

    // Auto focus first missing input
    if (!name) nameInput?.focus();
    else if (!email) emailInput?.focus();
    return;
  }

  // 3. Agar sirf 1 single field missing hai (e.g. "Please enter your Name")
  if (missingFields.length === 1) {
    const singleField = missingFields[0];
    if (singleField === "Email") {
      showToast("Please enter your Email address", "error");
      emailInput?.focus();
    } else {
      showToast(`Please enter your ${singleField}`, "error");
      if (singleField === "Name") nameInput?.focus();
      if (singleField === "Message") messageInput?.focus();
    }
    return;
  }

  // 4. Email format check (jab email entered ho)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid Email address", "error");
    emailInput?.focus();
    return;
  }

  // All inputs valid -> Success Notification....
  showToast("Message sent successfully! 🚀 We'll reach out soon.");

  // Clear Form
  contactForm.reset();
});
