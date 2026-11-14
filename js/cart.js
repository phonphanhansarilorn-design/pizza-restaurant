// ===== ฟังก์ชันตะกร้า (ใช้ร่วมกันทุกหน้า) =====
var CART_KEY = "cart";

// ----- สไตล์ที่ใช้ร่วมกันหลายหน้า -----
(function () {
  var css =
    ".toast{width:max-content;max-width:90vw;text-align:center}" +
    ".tpill{display:block;margin-top:1px;font-size:11px;font-weight:500;color:var(--gold)}" +
    ".thumb{width:72px;height:72px;flex-shrink:0;border-radius:18px;background:radial-gradient(circle,#3a2a1d,#1b1410);display:flex;align-items:center;justify-content:center;font-size:38px;overflow:hidden}" +
    ".thumb svg{width:92%;height:auto;overflow:visible;filter:drop-shadow(0 4px 4px rgba(0,0,0,.5))}" +
    ".stepper{display:flex;align-items:center;gap:10px}" +
    ".stepper button{width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--text);font-size:18px;cursor:pointer}" +
    ".stepper b{min-width:20px;text-align:center}" +
    ".fly{position:fixed;z-index:300;pointer-events:none;filter:drop-shadow(0 10px 16px rgba(0,0,0,.6))}" +
    ".fly svg{display:block;width:100%;height:auto;overflow:visible}" +
    /* ปุ่มลอยดูสถานะออเดอร์ */
    ".ordfab{position:fixed;right:14px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:70;display:flex;flex-direction:column;align-items:flex-start;padding:10px 16px;border-radius:999px;background:#fff;color:#1a120c;font:600 13px/1.25 'Prompt',sans-serif;text-decoration:none;box-shadow:0 8px 22px rgba(0,0,0,.5)}" +
    ".ordfab small{font-weight:500;color:#8a5a3a;font-size:11px}" +
    ".ordfab small:empty{display:none}" +
    "body.has-bar .ordfab{bottom:calc(100px + env(safe-area-inset-bottom,0px))}";
  var s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);
})();

// ----- อ่าน / เขียนตะกร้า (เก็บในเครื่องลูกค้า) -----
function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
}
function writeCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); return true; } catch (e) { return false; }
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
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
}

// แสดงเลขโต๊ะใต้ชื่อหน้า (ถ้ามี element id="tablePill")
function showTablePill() {
  var el = document.getElementById("tablePill");
  if (!el) return;
  var t = null;
  try { t = localStorage.getItem("table"); } catch (e) {}
  el.textContent = t ? "📍 โต๊ะ " + t : "";
}

// ----- ปุ่มลอย "ดูสถานะออเดอร์" (โผล่หลังจากลูกค้าสั่งอาหารแล้ว) -----
var STATUS_TH = {
  pending: "รอรับออเดอร์",
  preparing: "กำลังเตรียมอาหาร",
  cooking: "กำลังทำอาหาร",
  done: "เสร็จเรียบร้อย",
  cancelled: "ถูกยกเลิก"
};

async function showOrderFab() {
  var last = null;
  try { last = JSON.parse(localStorage.getItem("lastOrder")); } catch (e) {}
  if (!last || !last.id || !last.token) return;
  if (!/^\d+$/.test(String(last.id)) || !/^[0-9a-f-]{36}$/i.test(String(last.token))) return;

  var a = document.getElementById("ordFab");
  if (!a) {
    a = document.createElement("a");
    a.id = "ordFab";
    a.className = "ordfab";
    a.innerHTML = '🧾 ดูสถานะออเดอร์ #' + last.id + '<small id="ordFabSt"></small>';
    document.body.appendChild(a);
  }
  a.href = "order-status.html?id=" + last.id + "&t=" + last.token;

  // ดึงสถานะล่าสุดมาแสดงบนปุ่ม (ถ้าเชื่อมต่อได้)
  if (typeof db === "undefined" || !db) return;
  try {
    var r = await db.rpc("get_order", { p_id: Number(last.id), p_token: last.token });
    var st = document.getElementById("ordFabSt");
    if (r && r.data && st) st.textContent = STATUS_TH[r.data.status] || "";
  } catch (e) {}
}

// ----- เก็บหน้าตาพิซซ่า เพื่อนำไปโชว์ในตะกร้า -----
function snapshotLook(pizza, sauce) {
  var ring = pizza.svg.querySelector(".bakeRing");
  return {
    sauce: sauce,
    baked: !!ring && parseFloat(ring.style.opacity) > 0.1,
    html: pizza.g.innerHTML.replace(/ class="pc"/g, "")
  };
}

// วาดพิซซ่าจากข้อมูลที่เก็บไว้ ลงใน svg
function renderLook(svg, look) {
  svg.innerHTML = baseHTML();
  if (look.sauce === "B") {
    svg.querySelector(".sauce").setAttribute("fill", "url(#sauceB)");
    svg.querySelector(".sb").style.opacity = 0.25;
  }
  var layers = svg.querySelector(".layers");
  layers.innerHTML = look.html || "";
  if (look.baked) {
    var ring = document.createElementNS(NS, "circle");
    ring.setAttribute("r", "134");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "#5a2608");
    ring.setAttribute("stroke-width", "26");
    ring.setAttribute("filter", "url(#blur)");
    ring.setAttribute("opacity", ".32");
    svg.insertBefore(ring, layers);
  }
}

// รูปเล็กของสินค้าในตะกร้า (พิซซ่า = ภาพวาด, เครื่องดื่ม = ไอคอน)
function thumbHTML(it, i) {
  if (it.look) {
    return '<div class="thumb"><svg data-look="' + i + '" viewBox="-160 -160 320 320"></svg></div>';
  }
  return '<div class="thumb">' + esc(it.icon || "🍽️") + "</div>";
}

// ===== หน้าตะกร้า (ทำงานเฉพาะหน้าที่มี #cartList) =====
function renderCart() {
  var list = document.getElementById("cartList");
  var bar = document.getElementById("cartBar");
  var tableBox = document.getElementById("tableBox");
  var payBox = document.getElementById("payBox");
  var cart = readCart();
  updateCartBadge();

  if (!cart.length) {
    list.innerHTML =
      '<div class="empty"><div style="font-size:56px">🛒</div>' +
      "<p>ตะกร้ายังว่างอยู่</p>" +
      '<a class="cta" href="menu.html" style="display:block;margin-top:20px;text-align:center;text-decoration:none">ไปเลือกเมนู</a></div>';
    bar.hidden = true;
    tableBox.hidden = true;
    payBox.hidden = true;
    return;
  }

  bar.hidden = false;
  tableBox.hidden = false;
  payBox.hidden = false;

  var html = "";
  cart.forEach(function (it, i) {
    var qty = it.qty || 1;
    var meta = it.size ? "ขนาด " + esc(it.size) + (it.sauce ? " · " + esc(it.sauce) : "") : "";
    var tops = "";
    if (it.toppings) {
      tops = it.toppings.map(function (t) {
        return esc(t.name) + (t.price > 0 ? " +" + t.price : "");
      }).join(", ") || "ไม่มีท็อปปิ้งเพิ่ม";
    }
    html +=
      '<div class="ci"><div class="ci-row">' + thumbHTML(it, i) +
      '<div class="ci-main">' +
        '<div class="ci-top"><div>' +
          "<h3>" + esc(it.name) + "</h3>" +
          (meta ? '<div class="meta">' + meta + "</div>" : "") +
          (tops ? '<div class="meta">' + tops + "</div>" : "") +
        '</div><div class="price">' + it.unitPrice + " ฿</div></div>" +
        '<div class="ci-bot">' +
          '<div class="stepper">' +
            '<button data-act="minus" data-i="' + i + '">−</button>' +
            "<b>" + qty + "</b>" +
            '<button data-act="plus" data-i="' + i + '">+</button>' +
          "</div>" +
          '<div style="display:flex;align-items:center;gap:12px">' +
            "<b>" + it.unitPrice * qty + " ฿</b>" +
            '<button class="del" data-act="del" data-i="' + i + '">🗑 ลบ</button>' +
          "</div>" +
        "</div>" +
      "</div></div></div>";
  });
  list.innerHTML = html;

  // วาดรูปพิซซ่าที่ลูกค้าแต่งไว้
  list.querySelectorAll("svg[data-look]").forEach(function (svg) {
    var item = cart[parseInt(svg.getAttribute("data-look"), 10)];
    if (item && item.look) renderLook(svg, item.look);
  });

  document.getElementById("checkoutBtn").textContent = "ยืนยันสั่งอาหาร · " + cartTotal() + " บาท";
  drawPay();
}

// ----- วิธีชำระเงิน -----
var payMethod = "cash";
try { payMethod = localStorage.getItem("payMethod") || "cash"; } catch (e) {}

function drawPay() {
  document.querySelectorAll(".pay").forEach(function (label) {
    var input = label.querySelector("input");
    input.checked = input.value === payMethod;
    label.classList.toggle("on", input.checked);
  });
  document.getElementById("qrBox").hidden = payMethod !== "qr";
  document.getElementById("qrAmount").textContent = "ยอดชำระ " + cartTotal() + " บาท";
}

// ----- ส่งออเดอร์ไปที่ Supabase -----
var sending = false;
async function checkout() {
  if (sending) return;
  var tableInput = document.getElementById("tableInput");
  var btn = document.getElementById("checkoutBtn");
  var table = tableInput.value.trim();

  if (!table) {
    showToast("กรุณาระบุหมายเลขโต๊ะ");
    tableInput.focus();
    return;
  }
  if (!db) {
    showToast("เชื่อมต่อระบบไม่ได้ ลองรีเฟรชหน้าอีกครั้ง");
    return;
  }

  // แปลงตะกร้าเป็นข้อมูลที่ส่งให้ฐานข้อมูล (ไม่ส่งราคา ฐานข้อมูลคำนวณเอง)
  var items = [];
  var stale = false;
  readCart().forEach(function (it) {
    if (!it.pid) { stale = true; return; }
    var o = { product_id: it.pid, qty: it.qty || 1 };
    if (it.size) {
      o.size = it.size;
      o.sauce = it.sauce === "ซอสขาว" ? "B" : "R";
    }
    if (it.custom) {
      o.toppings = (it.toppings || []).map(function (t) { return t.id; });
    }
    items.push(o);
  });
  if (stale) {
    showToast("ตะกร้ามีรายการเก่า กรุณาลบแล้วเลือกใหม่");
    return;
  }

  sending = true;
  btn.disabled = true;
  btn.textContent = "กำลังส่งออเดอร์…";

  var res;
  try {
    res = await db.rpc("place_order", {
      p_table: table,
      p_payment: payMethod,
      p_note: "",
      p_items: items
    });
  } catch (e) {
    res = { error: { message: "เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่" } };
  }

  sending = false;
  btn.disabled = false;

  if (res.error || !res.data) {
    showToast((res.error && res.error.message) || "ส่งออเดอร์ไม่สำเร็จ");
    renderCart();
    return;
  }

  var o = res.data;
  try { localStorage.setItem("lastOrder", JSON.stringify({ id: o.id, token: o.token })); } catch (e) {}
  writeCart([]);
  window.location.href = "order-status.html?id=" + o.id + "&t=" + o.token;
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
    if (act === "plus") cart[i].qty = Math.min((cart[i].qty || 1) + 1, 20);
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
    showTablePill();
  };

  // เลือกวิธีชำระเงิน
  document.querySelectorAll(".pay input").forEach(function (inp) {
    inp.onchange = function () {
      payMethod = inp.value;
      try { localStorage.setItem("payMethod", payMethod); } catch (e) {}
      drawPay();
    };
  });

  // รูป QR ชำระเงินของร้าน (อัปโหลดไว้ที่ assets/payment-qr.png)
  var qrImg = document.getElementById("qrImg");
  qrImg.onerror = function () {
    qrImg.hidden = true;
    document.getElementById("qrMissing").hidden = false;
  };

  document.getElementById("checkoutBtn").onclick = checkout;
  renderCart();
}

updateCartBadge();
showTablePill();
showOrderFab();
// กลับมาจากหน้าอื่นด้วยปุ่มย้อนกลับ: อัปเดตปุ่มและตัวเลขตะกร้าอีกครั้ง
window.addEventListener("pageshow", function (e) {
  if (e.persisted) { updateCartBadge(); showOrderFab(); }
});
