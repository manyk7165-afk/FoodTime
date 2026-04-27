const CART_KEY = 'foodtime_cart';
const CART_COMMENT_KEY = 'foodtime_order_comment';

const DELIVERY_MODE_KEY = 'foodtime_delivery_mode';
const DELIVERY_ADDRESS_KEY = 'foodtime_delivery_address';
const DELIVERY_PRICE_KEY = 'foodtime_delivery_price';
const DELIVERY_DISTANCE_KEY = 'foodtime_delivery_distance';

const YANDEX_API_KEY = 'f38bdd35-9ab0-407b-9484-952c1d82b551';
const RESTAURANT_ADDRESS = 'Самара, улица Советской Армии, 125А';

function isHomePage() {
  const path = window.location.pathname.toLowerCase();
  return path.endsWith('/index.html') || path.endsWith('/');
}
function injectCartHtml() {
  if (document.getElementById('cartPanel')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="cart-float">
      <button class="cart-button" onclick="toggleCart()">🛒 <span id="cartCount">0</span></button>

      <div class="cart-panel" id="cartPanel">
        <div class="cart-title">Корзина</div>

        <div class="cart-items" id="cartItems">
          <div class="cart-empty">Пока пусто</div>
        </div>

        <div class="delivery-mode-wrap">
          <div class="cart-comment-label">Способ получения</div>

          <div class="delivery-mode">
            <button type="button" class="delivery-mode-btn active" id="pickupBtn" onclick="setDeliveryMode('pickup')">
              Самовывоз
            </button>
            <button type="button" class="delivery-mode-btn" id="deliveryBtn" onclick="setDeliveryMode('delivery')">
              Доставка
            </button>
          </div>

          <div class="delivery-fields" id="deliveryFields" style="display:none;">
            <div class="cart-comment-label" style="margin-top:12px;">Адрес доставки</div>

            <input
              type="text"
              id="deliveryAddress"
              class="delivery-address-input"
              placeholder="Введите адрес доставки"
            >

            <button type="button" class="cart-action-btn" onclick="calculateDelivery()">
              Рассчитать доставку
            </button>

            <div class="delivery-info">
              <div class="delivery-line">
                <span>Расстояние:</span>
                <strong id="deliveryDistance">—</strong>
              </div>
              <div class="delivery-line">
                <span>Доставка:</span>
                <strong id="deliveryPrice">0 ₽</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="cart-comment-wrap">
          <div class="cart-comment-label">Комментарий к заказу</div>
          <textarea
            id="orderComment"
            class="cart-comment"
            placeholder="Например: без лука, позвонить по приезду, добавить приборы..."
          ></textarea>
        </div>

        <div class="cart-total">Итого: <span id="cartTotal">0 ₽</span></div>
        ${isHomePage() ? '<button class="cart-action-btn" style="margin-top:12px;">Оформить заказ</button>' : ''}
      </div>
    </div>
  `);
}
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getOrderComment() {
  return localStorage.getItem(CART_COMMENT_KEY) || '';
}

function saveOrderComment(value) {
  localStorage.setItem(CART_COMMENT_KEY, value || '');
}

function getDeliveryMode() {
  return localStorage.getItem(DELIVERY_MODE_KEY) || 'pickup';
}

function saveDeliveryMode(mode) {
  localStorage.setItem(DELIVERY_MODE_KEY, mode);
}

function getDeliveryAddress() {
  return localStorage.getItem(DELIVERY_ADDRESS_KEY) || '';
}

function saveDeliveryAddress(address) {
  localStorage.setItem(DELIVERY_ADDRESS_KEY, address || '');
}

function getDeliveryPrice() {
  return Number(localStorage.getItem(DELIVERY_PRICE_KEY) || 0);
}

function saveDeliveryPrice(price) {
  localStorage.setItem(DELIVERY_PRICE_KEY, String(price || 0));
}

function getDeliveryDistance() {
  return localStorage.getItem(DELIVERY_DISTANCE_KEY) || '—';
}

function saveDeliveryDistance(distance) {
  localStorage.setItem(DELIVERY_DISTANCE_KEY, distance || '—');
}

function getEffectiveCardName(card) {
  const checkbox = card.querySelector('.bbq-bacon-toggle');
  const baseName = card.dataset.baseName || card.dataset.name || 'Товар';
  return checkbox && checkbox.checked ? baseName + ' (без бекона)' : baseName;
}

function changeQty(button, delta) {
  const card = button.closest('.product-card');
  if (!card) return;

  const name = getEffectiveCardName(card);
  const price = Number(card.dataset.price || 0);

  const cart = getCart();
  const currentQty = cart[name]?.qty || 0;
  const newQty = Math.max(0, currentQty + delta);

  if (newQty === 0) {
    delete cart[name];
  } else {
    cart[name] = { price, qty: newQty };
  }

  saveCart(cart);
  updateCartUI();
}

function changeCartQty(name, delta) {
  const cart = getCart();
  if (!cart[name]) return;

  const newQty = Math.max(0, (cart[name].qty || 0) + delta);

  if (newQty === 0) {
    delete cart[name];
  } else {
    cart[name].qty = newQty;
  }

  saveCart(cart);
  updateCartUI();
}

function updateCardQtyLabel(card) {
  const cart = getCart();
  const qtyEl = card.querySelector('.qty span');
  if (!qtyEl) return;

  const name = getEffectiveCardName(card);
  qtyEl.textContent = cart[name]?.qty || 0;
}

function updateDeliveryUI() {
  const addressInput = document.getElementById('deliveryAddress');
  const distanceEl = document.getElementById('deliveryDistance');
  const priceEl = document.getElementById('deliveryPrice');

  if (addressInput && document.activeElement !== addressInput) {
    addressInput.value = getDeliveryAddress();
  }

  if (distanceEl) distanceEl.textContent = getDeliveryDistance();
  if (priceEl) priceEl.textContent = getDeliveryPrice() + ' ₽';
}

function setDeliveryMode(mode) {
  const pickupBtn = document.getElementById('pickupBtn');
  const deliveryBtn = document.getElementById('deliveryBtn');
  const deliveryFields = document.getElementById('deliveryFields');

  saveDeliveryMode(mode);

  if (pickupBtn) pickupBtn.classList.toggle('active', mode === 'pickup');
  if (deliveryBtn) deliveryBtn.classList.toggle('active', mode === 'delivery');
  if (deliveryFields) deliveryFields.style.display = mode === 'delivery' ? 'block' : 'none';

  if (mode === 'pickup') {
    saveDeliveryPrice(0);
    saveDeliveryDistance('—');
    updateDeliveryUI();
    updateCartUI();
  } else {
    updateDeliveryUI();
  }
}

function getCartSubtotal() {
  const cart = getCart();
  let total = 0;

  Object.values(cart).forEach(item => {
    total += item.qty * item.price;
  });

  return total;
}

function getDeliveryPriceByRules(orderSum, distanceKm) {
  if (orderSum < 1000) {
    return { ok: false, price: 0 };
  }

  let basePrice = 300;

  if (orderSum >= 3000) {
    basePrice = 100;
  } else if (orderSum >= 2000) {
    basePrice = 200;
  } else if (orderSum >= 1000) {
    basePrice = 300;
  }

  if (distanceKm >= 10) {
    basePrice += 50;
  }

  return { ok: true, price: basePrice };
}

async function calculateDelivery() {
  const addressInput = document.getElementById('deliveryAddress');
  if (!addressInput) return;

  const address = addressInput.value.trim();
  saveDeliveryAddress(address);

  if (!address) {
    saveDeliveryDistance('—');
    saveDeliveryPrice(0);
    updateDeliveryUI();
    updateCartUI();
    return;
  }

  const orderSum = getCartSubtotal();

  try {
    async function geocodeAddress(query) {
      const url = `https://geocode-maps.yandex.ru/v1/?apikey=${encodeURIComponent(YANDEX_API_KEY)}&geocode=${encodeURIComponent(query)}&lang=ru_RU&format=json`;

      const response = await fetch(url);
      const data = await response.json();

      const feature = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
      const pos = feature?.Point?.pos;

      if (!pos) return null;

      const [lon, lat] = pos.split(' ').map(Number);
      return { lat, lon };
    }

    function getDistanceKm(lat1, lon1, lat2, lon2) {
      const toRad = deg => deg * Math.PI / 180;
      const R = 6371;

      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    const restaurant = await geocodeAddress(RESTAURANT_ADDRESS);
    const client = await geocodeAddress(address);

    if (!restaurant || !client) {
      saveDeliveryDistance('—');
      saveDeliveryPrice(0);
      updateDeliveryUI();
      updateCartUI();
      return;
    }

    const directDistanceKm = getDistanceKm(
      restaurant.lat,
      restaurant.lon,
      client.lat,
      client.lon
    );

    const distanceKm = directDistanceKm * 1.3;
    const result = getDeliveryPriceByRules(orderSum, distanceKm);

    saveDeliveryDistance(distanceKm.toFixed(1) + ' км');
    saveDeliveryPrice(result.price);

    updateDeliveryUI();
    updateCartUI();
  } catch (error) {
    saveDeliveryDistance('—');
    saveDeliveryPrice(0);
    updateDeliveryUI();
    updateCartUI();
  }
}

function updateCartUI() {
  const cart = getCart();
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const orderComment = document.getElementById('orderComment');

  let totalCount = 0;
  let totalPrice = 0;

  Object.entries(cart).forEach(([name, item]) => {
    totalCount += item.qty;
    totalPrice += item.qty * item.price;
  });

  const deliveryMode = getDeliveryMode();
  const deliveryPrice = deliveryMode === 'delivery' ? getDeliveryPrice() : 0;
  const finalPrice = totalPrice + deliveryPrice;

  if (cartCount) cartCount.textContent = totalCount;
  if (cartTotal) cartTotal.textContent = finalPrice + ' ₽';

  if (orderComment && document.activeElement !== orderComment) {
    orderComment.value = getOrderComment();
  }

  updateDeliveryUI();

  if (cartItems) {
    const entries = Object.entries(cart);

    if (!entries.length) {
      cartItems.innerHTML = '<div class="cart-empty">Пока пусто</div>';
    } else {
      cartItems.innerHTML = entries.map(([name, item]) => `
        <div class="cart-item">
          <div style="flex:1;">
            <div class="cart-item-name">${name}</div>
            <div class="cart-item-meta">${item.price} ₽ за шт</div>
            <div class="qty" style="margin-top:8px;">
              <button onclick='changeCartQty(${JSON.stringify(name)}, -1)'>-</button>
              <span>${item.qty}</span>
              <button onclick='changeCartQty(${JSON.stringify(name)}, 1)'>+</button>
            </div>
          </div>
          <div class="cart-item-name">${item.qty * item.price} ₽</div>
        </div>
      `).join('');
    }
  }

  document.querySelectorAll('.product-card').forEach(card => updateCardQtyLabel(card));
}

function toggleCart() {
  const panel = document.getElementById('cartPanel');
  if (!panel) return;
  panel.classList.toggle('open');
}

function initCartSystem() {
  injectCartHtml();

  const orderComment = document.getElementById('orderComment');
  if (orderComment) {
    orderComment.value = getOrderComment();
    orderComment.addEventListener('input', (e) => {
      saveOrderComment(e.target.value);
    });
  }

  const deliveryAddress = document.getElementById('deliveryAddress');
  if (deliveryAddress) {
    deliveryAddress.value = getDeliveryAddress();
    deliveryAddress.addEventListener('input', (e) => {
      saveDeliveryAddress(e.target.value);
    });
  }

  setDeliveryMode(getDeliveryMode());
  updateCartUI();
}

document.addEventListener('DOMContentLoaded', initCartSystem);
