// ===== ฟังก์ชันตะกร้า (ใช้ร่วมกันหลายหน้า) =====
var CART_KEY = "cart";

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
}
function writeCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
}
function cartCount() {
  var n = 0;
  readCart().forEach(function (it) { n += it.qty || 1; });
  return n;
}
function cartTotal() {
  var sum = 0;
  readCart().forEach(function (it) { sum += (it.unitPrice || 0) * (it.qty || 1); });
  return sum;
}
function updateCartBadge() {
  var el = document.getElementById("cartN");
  if (el) el.textContent = cartCount();
}
// กันตัวอักษรพิเศษก่อนแสดงบนหน้าเว็บ
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
var toastTimer;
function showToast(msg) {
  var t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
}

// ===== หน้าตะกร้า (ทำงานเฉพาะหน้าที่มี #cartList) =====
function renderCart() {
  var list = document.getElementById("cartList");
  var bar = document.getElementById("cartBar");
  var tableBox = document.getElementById("tableBox");
  var cart = readCart();
  updateCartBadge();

  if (!cart.length) {
    list.innerHTML =
      '<div class="empty"><div style="font-size:56px">🛒</div>' +
      "<p>ตะกร้ายังว่างอยู่</p>" +
      '<a class="cta" href="menu.html" style="display:block;margin-top:20px;text-align:center;text-decoration:none">ไปเลือกพิซซ่า</a></div>';
    bar.hidden = true;
    tableBox.hidden = true;
    return;
  }

  bar.hidden = false;
  tableBox.hidden = false;
  var html = "";
  cart.forEach(function (it, i) {
    var tops = (it.toppings || []).map(function (t) {
      return esc(t.name) + (t.price > 0 ? " +" + t.price : "");
    }).join(", ");
    var qty = it.qty || 1;
    html +=
      '<div class="ci">' +
        '<div class="ci-top"><div>' +
          "<h3>" + esc(it.name) + "</h3>" +
          '<div class="meta">ขนาด ' + esc(it.size) + (it.sauce ? " · " + esc(it.sauce) : "") + "</div>" +
          '<div class="meta">' + (tops || "ไม่มีท็อปปิ้งเพิ่ม") + "</div>" +
        "</div>" +
        '<div class="price">' + it.unitPrice + " ฿</div></div>" +
        '<div class="ci-bot">' +
          '<div class="qty">' +
            '<button data-act="minus" data-i="' + i + '">−</button>' +
            "<b>" + qty + "</b>" +
            '<button data-act="plus" data-i="' + i + '">+</button>' +
          "</div>" +
          '<div style="display:flex;align-items:center;gap:14px">' +
            "<b>" + it.unitPrice * qty + " ฿</b>" +
            '<button class="del" data-act="del" data-i="' + i + '">🗑 ลบ</button>' +
          "</div>" +
        "</div>" +
      "</div>";
  });
  list.innerHTML = html;
  document.getElementById("checkoutBtn").textContent = "ยืนยันสั่งอาหาร · " + cartTotal() + " บาท";
}

if (document.getElementById("cartList")) {
  // กดปุ่ม + − ลบ
  document.getElementById("cartList").onclick = function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var i = parseInt(b.getAttribute("data-i"), 10);
    var act = b.getAttribute("data-act");
    var cart = readCart();
    if (!cart[i]) return;
    if (act === "plus") cart[i].qty = (cart[i].qty || 1) + 1;
    if (act === "minus" && (cart[i].qty || 1) > 1) cart[i].qty -= 1;
    if (act === "del") cart.splice(i, 1);
    writeCart(cart);
    renderCart();
  };

  // หมายเลขโต๊ะ
  var tableInput = document.getElementById("tableInput");
  try { tableInput.value = localStorage.getItem("table") || ""; } catch (e) {}
  tableInput.oninput = function () {
    tableInput.value = tableInput.value.replace(/[^0-9A-Za-z_-]/g, "").slice(0, 10);
    try { localStorage.setItem("table", tableInput.value); } catch (e) {}
  };

  // ปุ่มยืนยัน (ส่งออเดอร์จริงจะทำในขั้นตอนเชื่อม Supabase)
  document.getElementById("checkoutBtn").onclick = function () {
    if (!tableInput.value.trim()) {
      showToast("กรุณาระบุหมายเลขโต๊ะ");
      tableInput.focus();
      return;
    }
    showToast("ระบบส่งออเดอร์จะเปิดใช้ในขั้นตอนเชื่อม Supabase");
  };

  renderCart();
}
