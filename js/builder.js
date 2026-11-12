// ===== ข้อมูลตัวอย่าง (ภายหลังจะดึงจาก Supabase) =====
var SIZES = [
  { code: "S", label: "เล็ก", price: 159 },
  { code: "M", label: "กลาง", price: 219 },
  { code: "L", label: "ใหญ่", price: 279 }
];

var TOPPINGS = [
  { id: "cheese",    name: "ชีส",        emoji: "🧀", price: 20, count: 10 },
  { id: "mushroom",  name: "เห็ด",       emoji: "🍄", price: 15, count: 8 },
  { id: "pineapple", name: "สับปะรด",    emoji: "🍍", price: 15, count: 8 },
  { id: "bacon",     name: "เบคอน",      emoji: "🥓", price: 25, count: 8 },
  { id: "pepperoni", name: "เปปเปอโรนี", emoji: "🔴", price: 30, count: 10 },
  { id: "sausage",   name: "ไส้กรอก",    emoji: "🌭", price: 20, count: 7 }
];

// ===== สถานะปัจจุบัน =====
var selectedSize = "M";
var selectedToppings = []; // เก็บ id ของท็อปปิ้งที่เลือก

var pizzaEl = document.getElementById("pizza");
var sizeRow = document.getElementById("sizeRow");
var toppingGrid = document.getElementById("toppingGrid");
var totalEl = document.getElementById("totalPrice");

// ===== สร้างปุ่มขนาด =====
function renderSizes() {
  sizeRow.innerHTML = "";
  SIZES.forEach(function (s) {
    var b = document.createElement("button");
    b.className = "size-btn" + (s.code === selectedSize ? " active" : "");
    b.innerHTML = s.code + "<small>" + s.label + " " + s.price + "฿</small>";
    b.onclick = function () {
      selectedSize = s.code;
      pizzaEl.className = "pizza size-" + s.code;
      renderSizes();
      updateTotal();
    };
    sizeRow.appendChild(b);
  });
}

// ===== สร้างปุ่มท็อปปิ้ง =====
function renderToppings() {
  toppingGrid.innerHTML = "";
  TOPPINGS.forEach(function (t) {
    var b = document.createElement("button");
    var active = selectedToppings.indexOf(t.id) !== -1;
    b.className = "topping-btn" + (active ? " active" : "");
    b.innerHTML =
      '<span class="emoji">' + t.emoji + "</span>" +
      "<span>" + t.name + "<small>+" + t.price + " บาท</small></span>";
    b.onclick = function () { toggleTopping(t); };
    toppingGrid.appendChild(b);
  });
}

// ===== เลือก / ยกเลิกท็อปปิ้ง =====
function toggleTopping(t) {
  var index = selectedToppings.indexOf(t.id);
  if (index === -1) {
    selectedToppings.push(t.id);
    addLayer(t);
  } else {
    selectedToppings.splice(index, 1);
    removeLayer(t);
  }
  renderToppings();
  updateTotal();
}

// วางท็อปปิ้งลงบนพิซซ่า (ตกลงมาพร้อมเอฟเฟกต์)
function addLayer(t) {
  var layer = document.createElement("div");
  layer.id = "layer-" + t.id;
  layer.style.position = "absolute";
  layer.style.inset = "0";
  var radius = 105; // รัศมีที่ให้วางได้ (px)
  for (var i = 0; i < t.count; i++) {
    var angle = Math.random() * Math.PI * 2;
    var dist = Math.sqrt(Math.random()) * radius;
    var x = 140 + Math.cos(angle) * dist; // 140 = กึ่งกลาง
    var y = 140 + Math.sin(angle) * dist;
    var item = document.createElement("span");
    item.className = "topping-item";
    item.textContent = t.emoji;
    item.style.left = x + "px";
    item.style.top = y + "px";
    item.style.setProperty("--rot", Math.floor(Math.random() * 360) + "deg");
    item.style.animationDelay = i * 0.06 + "s";
    layer.appendChild(item);
  }
  pizzaEl.appendChild(layer);
}

// เอาท็อปปิ้งออกทันที
function removeLayer(t) {
  var layer = document.getElementById("layer-" + t.id);
  if (layer) layer.remove();
}

// ===== คำนวณราคา =====
function calcTotal() {
  var size = SIZES.find(function (s) { return s.code === selectedSize; });
  var total = size.price;
  selectedToppings.forEach(function (id) {
    var t = TOPPINGS.find(function (x) { return x.id === id; });
    total += t.price;
  });
  return total;
}

function updateTotal() {
  totalEl.textContent = calcTotal() + " บาท";
}

// ===== เพิ่มลงตะกร้า =====
document.getElementById("addCartBtn").onclick = function () {
  var size = SIZES.find(function (s) { return s.code === selectedSize; });
  var toppingList = selectedToppings.map(function (id) {
    var t = TOPPINGS.find(function (x) { return x.id === id; });
    return { id: t.id, name: t.name, price: t.price };
  });
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem("cart")) || []; } catch (e) {}
  cart.push({
    name: "พิซซ่าแต่งเอง",
    size: size.code,
    basePrice: size.price,
    toppings: toppingList,
    unitPrice: calcTotal(),
    qty: 1
  });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("เพิ่มลงตะกร้าแล้ว");
  window.location.href = "cart.html";
};

// ===== เริ่มทำงาน =====
renderSizes();
renderToppings();
updateTotal();
