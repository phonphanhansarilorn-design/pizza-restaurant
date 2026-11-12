// ===== ข้อมูลตัวอย่าง (ภายหลังจะดึงจาก Supabase และแก้ไขได้จาก Admin) =====
var SIZES = [
  { c: "S", l: "เล็ก", p: 159 },
  { c: "M", l: "กลาง", p: 219 },
  { c: "L", l: "ใหญ่", p: 279 }
];
var CATS = ["ชีส", "เนื้อสัตว์และอาหารทะเล", "ผักและผลไม้", "สมุนไพร", "ซอสและครีม"];
// cat = ลำดับหมวด (เริ่มที่ 0), p = ราคา, k = จำนวนชิ้นบนพิซซ่า, s = ชื่อรูปทรง
var T = [
  { id: "cheese", n: "มอสซาเรลลา", cat: 0, p: 20, k: 9, s: "moz" },
  { id: "buf", n: "มอสซาเรลลาควาย", cat: 0, p: 40, k: 6, s: "buf" },
  { id: "scam", n: "สกาโมร์ซา", cat: 0, p: 25, k: 7, s: "scam" },
  { id: "gorg", n: "กอร์กอนโซลา", cat: 0, p: 30, k: 8, s: "gorg" },
  { id: "parm", n: "พาร์เมซาน", cat: 0, p: 20, k: 10, s: "parm" },
  { id: "ric", n: "ริคอตต้า", cat: 0, p: 25, k: 7, s: "ric" },
  { id: "pepperoni", n: "เปปเปอโรนี", cat: 1, p: 30, k: 12, s: "pep" },
  { id: "ham", n: "แฮม", cat: 1, p: 25, k: 8, s: "ham" },
  { id: "bacon", n: "เบคอน", cat: 1, p: 25, k: 8, s: "bacon" },
  { id: "sausage", n: "ไส้กรอก", cat: 1, p: 20, k: 9, s: "sau" },
  { id: "tuna", n: "ทูน่า", cat: 1, p: 25, k: 8, s: "tuna" },
  { id: "anch", n: "แอนโชวี่", cat: 1, p: 30, k: 8, s: "anch" },
  { id: "shr", n: "กุ้ง", cat: 1, p: 45, k: 7, s: "shr" },
  { id: "mushroom", n: "เห็ด", cat: 2, p: 15, k: 9, s: "mush" },
  { id: "pineapple", n: "สับปะรด", cat: 2, p: 15, k: 8, s: "pine" },
  { id: "oli", n: "มะกอกดำ", cat: 2, p: 15, k: 12, s: "oli" },
  { id: "bell", n: "พริกหวาน", cat: 2, p: 15, k: 8, s: "bell" },
  { id: "onion", n: "หอมแดง", cat: 2, p: 10, k: 9, s: "onion" },
  { id: "tom", n: "มะเขือเทศ", cat: 2, p: 10, k: 7, s: "tom" },
  { id: "corn", n: "ข้าวโพด", cat: 2, p: 10, k: 14, s: "corn" },
  { id: "jal", n: "ฮาลาปิโน", cat: 2, p: 15, k: 10, s: "jal" },
  { id: "basil", n: "โหระพา", cat: 3, p: 10, k: 7, s: "basil" },
  { id: "oreg", n: "ออริกาโน", cat: 3, p: 5, k: 24, s: "oreg" },
  { id: "garl", n: "กระเทียม", cat: 3, p: 10, k: 9, s: "garl" },
  { id: "pest", n: "เพสโต้", cat: 4, p: 20, k: 4, s: "pest" },
  { id: "chil", n: "น้ำมันพริก", cat: 4, p: 15, k: 4, s: "chil" }
];

// ===== สถานะปัจจุบัน =====
var size = "M";
var sel = [];       // id ท็อปปิ้งที่เลือก (เรียงตามลำดับที่กด)
var sauce = "R";    // R = ซอสแดง, B = ซอสขาว
var pizza = new Pizza(document.getElementById("bSvg"));

function byId(id) { return T.find(function (t) { return t.id === id; }); }
function curSize() { return SIZES.find(function (s) { return s.c === size; }); }
function total() {
  var sum = curSize().p;
  sel.forEach(function (id) { sum += byId(id).p; });
  return sum;
}

// ===== ตะกร้า (เก็บในเครื่อง) =====
function readCart() {
  try { return JSON.parse(localStorage.getItem("cart")) || []; } catch (e) { return []; }
}
function updateCartCount() {
  var n = 0;
  readCart().forEach(function (it) { n += it.qty || 1; });
  document.getElementById("cartN").textContent = n;
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
      b.innerHTML = '<svg viewBox="-20 -20 40 40">' + SH[t.s] + "</svg>" + t.n + "<small>+" + t.p + " บาท</small>";
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

// ===== เพิ่มลงตะกร้า (มีเอฟเฟกต์อบ) =====
document.getElementById("addBtn").onclick = function () {
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
    name: "พิซซ่าแต่งเอง",
    size: s.c,
    sauce: sauce === "R" ? "ซอสแดง" : "ซอสขาว",
    basePrice: s.p,
    toppings: list,
    unitPrice: total(),
    qty: 1
  });
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  var t = document.getElementById("toast");
  t.classList.add("show");
  setTimeout(function () { t.classList.remove("show"); }, 1500);
}

// ===== เริ่มทำงาน =====
renderSeg();
renderMenu();
update();
updateCartCount();
