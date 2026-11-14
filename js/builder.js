// ===== ข้อมูลพิซซ่าแต่งเอง (ดึงจาก Supabase ราคาแก้ได้จากหลังบ้าน) =====
var SIZES = [
  { c: "S", l: "เล็ก", p: 0 },
  { c: "M", l: "กลาง", p: 0 },
  { c: "L", l: "ใหญ่", p: 0 }
];
var CATS = [];      // รายชื่อหมวดท็อปปิ้ง (โหลดจากฐานข้อมูล)
var T = [];         // รายการท็อปปิ้ง: { id (รหัส), n (ชื่อ), cat (ลำดับหมวด), p (ราคา), k (จำนวนชิ้น), s (รูปทรง) }
var customPid = null; // รหัสสินค้า "พิซซ่าแต่งเอง" ในฐานข้อมูล

// ===== สถานะปัจจุบัน =====
var size = "M";
var sel = [];       // id ท็อปปิ้งที่เลือก (เรียงตามลำดับที่กด)
var sauce = "R";    // R = ซอสแดง, B = ซอสขาว
var pizza = new Pizza(document.getElementById("bSvg"));

function byId(id) { return T.find(function (t) { return t.id === id; }); }
function curSize() { return SIZES.find(function (s) { return s.c === size; }); }
function total() {
  var sum = curSize().p;
  sel.forEach(function (id) { var t = byId(id); if (t) sum += t.p; });
  return sum;
}

// ===== โหลดข้อมูลจากฐานข้อมูล =====
async function loadShop() {
  var m = document.getElementById("menu");
  m.innerHTML = '<p style="text-align:center;color:var(--muted);padding:30px 0">กำลังโหลดท็อปปิ้ง…</p>';

  function fail() {
    m.innerHTML = '<div style="text-align:center;padding:30px 0;color:var(--muted)">โหลดท็อปปิ้งไม่สำเร็จ<br>' +
      '<button class="ghost" onclick="loadShop()">ลองใหม่</button></div>';
  }
  if (!db) { fail(); return; }

  var a, b;
  try {
    a = await db.from("toppings").select("code,name,category,price,pieces,shape,sort_order").order("sort_order");
    b = await db.from("products").select("id,price_s,price_m,price_l").eq("kind", "custom").limit(1);
  } catch (e) { fail(); return; }
  if (a.error || !a.data) { fail(); return; }

  CATS = [];
  T = [];
  a.data.forEach(function (r) {
    if (!SH[r.shape]) return;   // ข้ามท็อปปิ้งที่ยังไม่มีรูปทรง
    var ci = CATS.indexOf(r.category);
    if (ci === -1) { CATS.push(r.category); ci = CATS.length - 1; }
    T.push({ id: r.code, n: r.name, cat: ci, p: Number(r.price), k: r.pieces, s: r.shape });
  });

  if (b.data && b.data[0]) {
    customPid = b.data[0].id;
    SIZES[0].p = Number(b.data[0].price_s);
    SIZES[1].p = Number(b.data[0].price_m);
    SIZES[2].p = Number(b.data[0].price_l);
  } else {
    customPid = null;
    showToast("ขณะนี้ปิดรับพิซซ่าแต่งเอง");
  }

  renderSeg();
  renderMenu();
  update();
}

// ===== ปุ่มขนาด =====
function renderSeg() {
  var seg = document.getElementById("seg");
  seg.innerHTML = "";
  SIZES.forEach(function (s) {
    var b = document.createElement("button");
    b.className = s.c === size ? "on" : "";
    b.textContent = s.c === size ? s.c + " " + s.l : s.c;
    b.onclick = function () {
      size = s.c;
      document.getElementById("pz").className = "pz " + s.c;
      renderSeg();
      update();
    };
    seg.appendChild(b);
  });
}

// ===== รายการท็อปปิ้งแยกหมวด =====
function renderMenu() {
  var m = document.getElementById("menu");
  m.innerHTML = "";
  CATS.forEach(function (c, ci) {
    var h = document.createElement("h4");
    h.textContent = c;
    m.appendChild(h);
    var g = document.createElement("div");
    g.className = "grid";
    T.filter(function (t) { return t.cat === ci; }).forEach(function (t) {
      var b = document.createElement("button");
      b.className = "card" + (sel.indexOf(t.id) > -1 ? " on" : "");
      b.innerHTML = '<svg viewBox="-20 -20 40 40">' + SH[t.s] + "</svg>" + esc(t.n) + "<small>+" + t.p + " บาท</small>";
      b.onclick = function () { toggle(t); };
      g.appendChild(b);
    });
    m.appendChild(g);
  });
}

function toggle(t) {
  pizza.unbake();
  var i = sel.indexOf(t.id);
  if (i === -1) { sel.push(t.id); pizza.add(t); }
  else { sel.splice(i, 1); pizza.remove(t.id); }
  renderMenu();
  update();
}

function update() {
  document.getElementById("addBtn").textContent = "เพิ่มลงตะกร้า · " + total() + " บาท";
  document.getElementById("cap").textContent =
    "ฐานพิซซ่า " + size + " · " + curSize().p + " บาท · ท็อปปิ้ง " + sel.length + " อย่าง";
}

// ===== ปุ่มยกเลิกล่าสุด / ล้าง =====
document.getElementById("undo").onclick = function () {
  pizza.unbake();
  if (sel.length) { pizza.remove(sel.pop()); renderMenu(); update(); }
};
document.getElementById("clear").onclick = function () {
  pizza.unbake();
  pizza.clear();
  sel = [];
  renderMenu();
  update();
};

// ===== สลับซอส =====
document.getElementById("sauceChip").onclick = function () {
  sauce = sauce === "R" ? "B" : "R";
  pizza.setSauce(sauce);
  document.getElementById("sauceName").textContent = sauce === "R" ? "ซอสแดง" : "ซอสขาว";
  document.getElementById("sauceDot").style.background = sauce === "R" ? "#d83a22" : "#f3e2b8";
};

// ===== เพิ่มลงตะกร้า: อบ -> พิซซ่าลอยเข้าตะกร้า -> เหลือพิซซ่าหน้าว่าง =====
document.getElementById("addBtn").onclick = function () {
  if (!customPid) {
    showToast("ยังใช้งานพิซซ่าแต่งเองไม่ได้ ลองรีเฟรชหน้านี้");
    return;
  }
  pizza.bake(addDone);
};

function addDone() {
  var s = curSize();
  var list = sel.map(function (id) {
    var t = byId(id);
    return { id: t.id, name: t.n, price: t.p };
  });
  var cart = readCart();
  cart.push({
    key: "c:" + Date.now(),
    pid: customPid,
    custom: true,
    name: "พิซซ่าแต่งเอง",
    size: s.c,
    sauce: sauce === "R" ? "ซอสแดง" : "ซอสขาว",
    basePrice: s.p,
    toppings: list,
    unitPrice: total(),
    qty: 1,
    look: snapshotLook(pizza, sauce)   // เก็บหน้าตาพิซซ่าไว้โชว์ในตะกร้า
  });
  if (!writeCart(cart)) {
    showToast("บันทึกไม่ได้ พื้นที่เก็บข้อมูลเต็ม ลองลบรายการในตะกร้าบางส่วน");
    return;
  }
  flyToCart();      // ต้องทำก่อนล้างพิซซ่า เพราะจะคัดลอกภาพพิซซ่าไปลอย
  resetPizza();
  showToast("เพิ่มลงตะกร้าแล้ว · แต่งพิซซ่าถาดต่อไปได้เลย");
}

// พิซซ่าลอยเข้าไอคอนตะกร้า
function flyToCart() {
  var pz = document.getElementById("pz");
  var btn = document.getElementById("cartBtn");
  var r = pz.getBoundingClientRect();
  var c = btn.getBoundingClientRect();

  var fly = document.createElement("div");
  fly.className = "fly";
  fly.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px";
  var clone = pizza.svg.cloneNode(true);
  clone.removeAttribute("id");
  clone.querySelectorAll(".pc").forEach(function (e) { e.classList.remove("pc"); });
  fly.appendChild(clone);
  document.body.appendChild(fly);

  var dx = c.left + c.width / 2 - (r.left + r.width / 2);
  var dy = c.top + c.height / 2 - (r.top + r.height / 2);
  var anim = fly.animate([
    { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
    { transform: "translate(" + dx * 0.3 + "px," + (dy * 0.3 - 50) + "px) scale(.6) rotate(120deg)", opacity: 1, offset: 0.4 },
    { transform: "translate(" + dx + "px," + dy + "px) scale(.08) rotate(360deg)", opacity: 0.3 }
  ], { duration: 900, easing: "ease-in" });

  anim.onfinish = function () {
    fly.remove();
    updateCartBadge();
    btn.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.35)" },
      { transform: "scale(1)" }
    ], { duration: 400 });
  };
}

// ทำให้พิซซ่ากลับเป็นหน้าว่าง (ขนาดและซอสคงเดิม)
function resetPizza() {
  var ring = pizza.svg.querySelector(".bakeRing");
  if (ring) ring.remove();
  pizza.clear();
  sel = [];
  renderMenu();
  update();
  pizza.svg.animate([
    { opacity: 0, transform: "scale(.85)" },
    { opacity: 1, transform: "scale(1)" }
  ], { duration: 450, easing: "ease-out" });
}

// ===== เริ่มทำงาน =====
renderSeg();
update();
loadShop();
