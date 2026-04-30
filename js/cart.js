// cart.js

(function () {
  const STORAGE_KEY = "foodtime_cart_v1";
  let cart = loadCart();

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function getCardData(card) {
    const name = card.dataset.name || card.dataset.baseName || "Товар";
    const baseName = card.dataset.baseName || name;
    const price = Number(card.dataset.price || 0);

    let meta = "";
    const metaEl =
      card.querySelector(".variant-meta") ||
      card.querySelector(".product-card-meta");
    if (metaEl) meta = metaEl.textContent.trim();

    if (card.querySelector(".bbq-bacon-toggle")) {
      const toggle = card.querySelector(".bbq-bacon-toggle");
      if (toggle.checked) {
        meta = meta ? `${meta} · без бекона` : "без бекона";
      }
    }

    return { name, baseName, price, meta };
  }

  function makeItemKey(data) {
    return `${data.name}__${data.meta}`;
  }

  function findCartItemIndex(data) {
    const key = makeItemKey(data);
    return cart.findIndex(item => makeItemKey(item) === key);
  }

  function addToCart(data, qtyDelta) {
    const index = findCartItemIndex(data);

    if (index === -1 && qtyDelta > 0) {
      cart.push({
        name: data.name,
        baseName: data.baseName,
        meta: data.meta,
        price: data.price,
        qty: qtyDelta
      });
    } else if (index !== -1) {
      cart[index].qty += qtyDelta;
      if (cart[index].qty <= 0) {
        cart.splice(index, 1);
      }
    }

    saveCart();
    renderCart();
  }

  function getTotalCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function getTotalPrice() {
    return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  }

  function syncCardCounters() {
    document.querySelectorAll(".product-card").forEach(card => {
      const data = getCardData(card);
      const index = findCartItemIndex(data);
      const qty = index === -1 ? 0 : cart[index].qty;

      const qtyEl = card.querySelector(".qty span");
      if (qtyEl) qtyEl.textContent = String(qty);
    });
  }

  function ensureCartUI() {
    if (document.getElementById("cartFab")) return;

    const fab = document.createElement("button");
    fab.className = "cart-fab hidden";
    fab.id = "cartFab";
    fab.type = "button";
    fab.innerHTML = `Корзина <span class="cart-fab-count" id="cartFabCount">0</span>`;

    const overlay = document.createElement("div");
    overlay.className = "cart-overlay";
    overlay.id = "cartOverlay";
    overlay.innerHTML = `
      <div class="cart-panel" role="dialog" aria-modal="true" aria-label="Корзина">
        <div class="cart-header">
          <div class="cart-title">Корзина</div>
          <button class="cart-close" id="cartClose" type="button">×</button>
        </div>
        <div class="cart-body" id="cartBody"></div>
        <div class="cart-footer">
          <div class="cart-total">
            <span>Итого</span>
            <span id="cartTotal">0 ₽</span>
          </div>
          <div class="cart-actions">
            <button class="cart-btn cart-btn-secondary" id="deliveryBtn" type="button">Рассчитать доставку</button>
            <button class="cart-btn cart-btn-primary" id="checkoutBtn" type="button">Оформить заказ</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(overlay);

    fab.addEventListener("click", () => overlay.classList.add("open"));

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.classList.remove("open");
    });

    overlay.querySelector("#cartClose").addEventListener("click", () => {
      overlay.classList.remove("open");
    });

    overlay.querySelector("#deliveryBtn").addEventListener("click", () => {
      const text = encodeURIComponent(makeOrderText(true));
      window.open(`https://t.me/share/url?url=&text=${text}`, "_blank");
    });

    overlay.querySelector("#checkoutBtn").addEventListener("click", () => {
      const text = encodeURIComponent(makeOrderText(false));
      window.open(`https://t.me/share/url?url=&text=${text}`, "_blank");
    });
  }

  function makeOrderText(isDeliveryCalc) {
    if (!cart.length) {
      return isDeliveryCalc
        ? "Здравствуйте! Хочу рассчитать доставку."
        : "Здравствуйте! Хочу оформить заказ.";
    }

    const header = isDeliveryCalc
      ? "Здравствуйте! Хочу рассчитать доставку.\n\nМой заказ:"
      : "Здравствуйте! Хочу оформить заказ.\n\nМой заказ:";

    const lines = cart.map(item => {
      const meta = item.meta ? ` (${item.meta})` : "";
      return `• ${item.name}${meta} — ${item.qty} шт. × ${item.price} ₽`;
    });

    return `${header}\n${lines.join("\n")}\n\nИтого: ${getTotalPrice()} ₽`;
  }

  function renderCart() {
    ensureCartUI();

    const fab = document.getElementById("cartFab");
    const fabCount = document.getElementById("cartFabCount");
    const body = document.getElementById("cartBody");
    const total = document.getElementById("cartTotal");

    const count = getTotalCount();
    fabCount.textContent = String(count);
    fab.classList.toggle("hidden", count === 0);
    total.textContent = `${getTotalPrice()} ₽`;

    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty">Корзина пока пустая.</div>`;
      syncCardCounters();
      return;
    }

    body.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        ${item.meta ? `<div class="cart-item-meta">${escapeHtml(item.meta)}</div>` : ""}
        <div class="cart-item-row">
          <div class="cart-item-price">${item.price} ₽</div>
          <div class="cart-item-controls">
            <button class="cart-item-btn" type="button" data-index="${index}" data-action="minus">-</button>
            <div class="cart-item-qty">${item.qty}</div>
            <button class="cart-item-btn" type="button" data-index="${index}" data-action="plus">+</button>
          </div>
        </div>
      </div>
    `).join("");

    body.querySelectorAll(".cart-item-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        const action = btn.dataset.action;
        if (!Number.isInteger(index) || !cart[index]) return;

        cart[index].qty += action === "plus" ? 1 : -1;
        if (cart[index].qty <= 0) cart.splice(index, 1);

        saveCart();
        renderCart();
      });
    });

    syncCardCounters();
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  window.changeQty = function changeQty(button, delta) {
    const card = button.closest(".product-card");
    if (!card) return;

    const data = getCardData(card);
    addToCart(data, delta);
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureCartUI();
    renderCart();
  });
})();
