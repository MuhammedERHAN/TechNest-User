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
let cartItems = [];
let appliedDiscountPercent = 0;

// Elements
const previewContainer = document.getElementById("checkout-items-preview");
const subtotalEl = document.getElementById("summary-subtotal");
const shippingEl = document.getElementById("summary-shipping");
const discountRow = document.getElementById("discount-row");
const discountEl = document.getElementById("summary-discount");
const totalEl = document.getElementById("summary-total");
const selectedCountEl = document.getElementById("selected-count");
const selectAllCheckbox = document.getElementById("select-all-items");

// Cart Badges (Desktop Header & Mobile Menu)
const cartBadgeEls = document.querySelectorAll(
  "#cart-count, .cart-count-badge",
);

// ================= UPDATE HEADER & MOBILE CART BADGE =================
function updateCartBadges(uniqueItemCount) {
  cartBadgeEls.forEach((badge) => {
    if (!badge) return;
    badge.textContent = uniqueItemCount;
    if (uniqueItemCount > 0) {
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  });
}

// ================= LOAD USER DATA & CART ITEMS =================
async function initCheckout() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.replace("../login.html");
    return;
  }

  // Pre-fill user details into form
  const emailInput = document.getElementById("email");
  const nameInput = document.getElementById("full-name");

  if (emailInput && session.user.email) {
    emailInput.value = session.user.email;
  }
  if (nameInput && session.user.user_metadata?.full_name) {
    nameInput.value = session.user.user_metadata.full_name;
  }

  // Populate user data in navbar & mobile menu
  const userName =
    session.user.user_metadata?.full_name || session.user.email.split("@")[0];
  const avatarUrl =
    session.user.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&initialsChars=2`;

  // Direct IDs and Classes support
  const navAvatar = document.getElementById("profile-avatar");
  if (navAvatar) navAvatar.src = avatarUrl;

  document.querySelectorAll(".profile-avatar-img").forEach((img) => {
    if (img) img.src = avatarUrl;
  });
  document.querySelectorAll(".user-name-display").forEach((el) => {
    if (el) el.textContent = userName;
  });

  // Fetch Cart Items from Supabase
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      products (*)
    `,
    )
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Error fetching cart:", error);
    showToast("Failed to load checkout items", "error");
    return;
  }

  // UNIQUE ITEMS COUNT (e.g., 3 unique products = count 3)
  const uniqueCount = data ? data.length : 0;
  updateCartBadges(uniqueCount);

  if (!data || data.length === 0) {
    showToast("Your cart is empty!", "error");
    setTimeout(() => {
      window.location.href = "cart.html";
    }, 1500);
    return;
  }

  // Set selection state
  cartItems = data.map((item) => ({ ...item, selected: true }));
  renderOrderSummary();
}

// ================= RENDER ORDER SUMMARY =================
function renderOrderSummary() {
  if (!previewContainer) return;

  previewContainer.innerHTML = "";
  let subtotal = 0;
  let selectedQuantitySum = 0;

  cartItems.forEach((item, index) => {
    const p = item.products || {};
    const productTitle = p.name || p.title || "Product";
    const productPrice = Number(p.price) || 0;
    const itemTotal = productPrice * item.quantity;

    if (item.selected) {
      subtotal += itemTotal;
      selectedQuantitySum += item.quantity;
    }

    const div = document.createElement("div");
    div.className = `flex items-center gap-3 py-2.5 transition-opacity duration-200 ${
      item.selected ? "opacity-100" : "opacity-40"
    }`;

    div.innerHTML = `
      <input
        type="checkbox"
        data-index="${index}"
        class="item-checkbox w-4 h-4 rounded text-primary focus:ring-primary accent-[#7C5CFC] cursor-pointer"
        ${item.selected ? "checked" : ""}
      />
      <img src="${p.image_url || ""}" alt="${productTitle}" class="w-11 h-11 rounded-xl object-cover bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/10 shrink-0" />
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">${productTitle}</h4>
        <p class="text-[11px] text-gray-500">Qty: ${item.quantity} × $${productPrice.toFixed(2)}</p>
      </div>
      <div class="text-xs font-bold text-gray-900 dark:text-white">$${itemTotal.toFixed(2)}</div>
    `;
    previewContainer.appendChild(div);
  });

  const allSelected = cartItems.every((item) => item.selected);
  if (selectAllCheckbox)
    selectAllCheckbox.checked = allSelected && cartItems.length > 0;

  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 10;
  const discountAmount = (subtotal * appliedDiscountPercent) / 100;
  const grandTotal = subtotal - discountAmount + shipping;

  if (selectedCountEl) selectedCountEl.textContent = selectedQuantitySum;
  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (shippingEl) {
    shippingEl.textContent =
      shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`;
  }

  if (appliedDiscountPercent > 0 && subtotal > 0) {
    discountRow?.classList.remove("hidden");
    discountRow?.classList.add("flex");
    if (discountEl) discountEl.textContent = `-$${discountAmount.toFixed(2)}`;
  } else {
    discountRow?.classList.add("hidden");
    discountRow?.classList.remove("flex");
  }

  if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;
}

// ================= CHECKBOX LISTENERS =================
previewContainer?.addEventListener("change", (e) => {
  if (e.target.classList.contains("item-checkbox")) {
    const index = e.target.dataset.index;
    cartItems[index].selected = e.target.checked;
    renderOrderSummary();
  }
});

selectAllCheckbox?.addEventListener("change", (e) => {
  const isChecked = e.target.checked;
  cartItems.forEach((item) => (item.selected = isChecked));
  renderOrderSummary();
});

// ================= PAYMENT METHOD TOGGLE =================
const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
const cardFields = document.getElementById("card-fields");

paymentRadios.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "card") {
      cardFields?.classList.remove("hidden");
    } else {
      cardFields?.classList.add("hidden");
    }
  });
});

// ================= PROMO CODE SYSTEM =================
const applyPromoBtn = document.getElementById("apply-promo-btn");
const promoInput = document.getElementById("promo-input");
const promoMessage = document.getElementById("promo-message");

applyPromoBtn?.addEventListener("click", () => {
  const code = promoInput.value.trim().toUpperCase();

  if (code === "TECH10") {
    if (appliedDiscountPercent > 0) {
      showToast("Promo code already applied!");
      return;
    }
    appliedDiscountPercent = 10;
    renderOrderSummary();
    if (promoMessage) {
      promoMessage.textContent = "10% Discount applied successfully!";
      promoMessage.className =
        "text-xs mt-1.5 text-emerald-500 font-medium block";
    }
    showToast("Promo code TECH10 applied!");
  } else if (code === "") {
    showToast("Please enter a promo code", "error");
  } else {
    if (promoMessage) {
      promoMessage.textContent = "Invalid promo code. Try 'TECH10'";
      promoMessage.className = "text-xs mt-1.5 text-red-500 font-medium block";
    }
  }
});

// ================= PLACE ORDER FORM SUBMISSION =================
const checkoutForm = document.getElementById("checkout-form");
const placeOrderBtn = document.getElementById("place-order-btn");

checkoutForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    showToast("Session expired, please login again", "error");
    return;
  }

  const selectedItems = cartItems.filter((item) => item.selected);

  if (selectedItems.length === 0) {
    showToast("Please select at least 1 item to order!", "error");
    return;
  }

  const fullName = document.getElementById("full-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("street-address").value.trim();
  const city = document.getElementById("city").value.trim();
  const postalCode = document.getElementById("postal-code")?.value.trim() || "";
  const paymentMethod = document.querySelector(
    'input[name="payment_method"]:checked',
  )?.value;

  if (!fullName || !email || !phone || !address || !city) {
    showToast("Please fill all required fields", "error");
    return;
  }

  if (paymentMethod === "card") {
    const cardNumber = document.getElementById("card-number")?.value.trim();
    const cardExpiry = document.getElementById("card-expiry")?.value.trim();
    const cardCvc = document.getElementById("card-cvc")?.value.trim();

    if (!cardNumber || !cardExpiry || !cardCvc) {
      showToast("Please complete card details", "error");
      return;
    }
  }

  let subtotal = selectedItems.reduce((acc, item) => {
    const price = Number(item.products?.price) || 0;
    return acc + price * item.quantity;
  }, 0);

  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 10;
  const discountAmount = (subtotal * appliedDiscountPercent) / 100;
  const finalTotal = subtotal - discountAmount + shipping;

  placeOrderBtn.disabled = true;
  placeOrderBtn.innerHTML = `
    <svg class="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Processing Order...</span>
  `;

  try {
    // 1. Insert into 'orders' table
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: session.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          address: address,
          city: city,
          postal_code: postalCode,
          payment_method: paymentMethod,
          shipping_cost: shipping,
          discount_amount: discountAmount,
          total_amount: finalTotal,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Insert into 'order_items' table
    const orderItemsToInsert = selectedItems.map((item) => ({
      order_id: orderData.id,
      product_id: item.products.id,
      product_name: item.products.name || item.products.title || "Product",
      price: Number(item.products.price) || 0,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsError) throw itemsError;

    // 3. Clear ONLY ordered items from Cart...
    const selectedCartIds = selectedItems.map((item) => item.id);
    await supabase.from("cart_items").delete().in("id", selectedCartIds);

    // Update Header Badge (remaining unique products)
    const remainingUniqueCount = cartItems.filter((i) => !i.selected).length;
    updateCartBadges(remainingUniqueCount);

    showToast("Order placed successfully! 🎉");

    // Success Screen
    setTimeout(() => {
      document.querySelector("main").innerHTML = `
        <div class="max-w-xl mx-auto text-center py-16 px-4">
          <div class="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="font-heading text-3xl font-bold mb-2">Thank You for Your Order!</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">Your order <span class="font-bold text-primary">#${orderData.id}</span> has been placed successfully.</p>
          <div class="flex justify-center gap-4">
            <a href="products.html" class="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition">Continue Shopping</a>
          </div>
        </div>
      `;
    }, 1000);
  } catch (err) {
    console.error("Order error:", err);
    showToast("Failed to place order. Please try again.", "error");

    placeOrderBtn.disabled = false;
    placeOrderBtn.innerHTML = `
      <span>Place Order</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
    `;
  }
});

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", initCheckout);
