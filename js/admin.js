// ===== ตัวช่วยหลังบ้าน (ใช้ร่วมทุกหน้าในโฟลเดอร์ admin/) =====
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function baht(n) {
  return "฿" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function store(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    localStorage.setItem(k, v);
  } catch (e) {}
  return null;
}

var Admin = { user: null, profile: null };

Admin.STATUS = {
  pending: "รอรับออเดอร์",
  preparing: "กำลังเตรียมอาหาร",
  cooking: "กำลังทำอาหาร",
  done: "เสร็จเรียบร้อย",
  cancelled: "ยกเลิก"
};
// หน้าแรกของแต่ละตำแหน่ง
Admin.HOME = { admin: "dashboard.html", cashier: "orders.html", kitchen: "kitchen.html" };

// เมนูซ้าย (ready:false = ยังไม่เปิดใช้ จะแสดงป้าย "เร็ว ๆ นี้")
Admin.SIDE = [
  { k: "dashboard", t: "ภาพรวม", href: "dashboard.html", roles: ["admin"], ready: true },
  { k: "products", t: "จัดการเมนู", href: "products.html", roles: ["admin"], ready: true },
  { k: "categories", t: "หมวดหมู่", href: "categories.html", roles: ["admin"], ready: true },
  { k: "orders", t: "ออเดอร์", href: "orders.html", roles: ["admin", "cashier"], ready: true },
  { k: "stock", t: "วัตถุดิบ/สต็อก", href: "stock.html", roles: ["admin"], ready: true },
  { k: "staff", t: "พนักงาน", href: "staff.html", roles: ["admin"], ready: true },
  { k: "finance", t: "รายรับ-รายจ่าย", href: "finance.html", roles: ["admin"], ready: true },
  { k: "reports", t: "รายงานยอดขาย", href: "reports.html", roles: ["admin"], ready: true },
  { k: "tables", t: "โต๊ะ/QR Code", href: "tables.html", roles: ["admin"], ready: true }
];

// ----- เวลา -----
Admin.fmtTime = function (iso) {
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });
};
Admin.fmtDT = function (iso) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok"
  });
};
// เวลาเริ่มต้นวัน (เที่ยงคืนไทย) ย้อนหลัง n วัน เป็น ISO
Admin.dayStart = function (back) {
  var n = new Date(Date.now() + 7 * 3600e3);
  n.setUTCHours(0, 0, 0, 0);
  return new Date(n.getTime() - 7 * 3600e3 - (back || 0) * 86400e3).toISOString();
};

// ----- ข้อความแจ้งเตือน -----
var _tt;
Admin.toast = function (msg) {
  var t = document.getElementById("atoast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(_tt);
  _tt = setTimeout(function () { t.classList.remove("show"); }, 2600);
};

// ----- เสียงแจ้งเตือน -----
Admin.beep = function () {
  if (store("adminSound") !== "1") return;
  try {
    var C = window.AudioContext || window.webkitAudioContext;
    var c = Admin._ac || (Admin._ac = new C());
    if (c.resume) c.resume();
    [880, 1175].forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.frequency.value = f;
      o.connect(g);
      g.connect(c.destination);
      var t = c.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.start(t);
      o.stop(t + 0.17);
    });
  } catch (e) {}
};

// ----- สถานะฐานข้อมูลที่หัวหน้า -----
Admin.setDb = function (ok) {
  var el = document.getElementById("dbState");
  if (el) el.textContent = "ฐานข้อมูล: " + (ok ? "ปกติ" : "ขัดข้อง") + " · ระบบสั่งอาหารผ่าน QR";
};

// ----- อัปเดตแบบเรียลไทม์ (มีสำรองเช็กทุก 30 วินาที) -----
Admin.live = function (fn) {
  var timer = null, pendingNew = false;
  function kick(isNew) {
    if (isNew) pendingNew = true;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var n = pendingNew;
      pendingNew = false;
      fn(n);
    }, 300);
  }
  try {
    db.channel("live-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, function (p) {
        kick(p.eventType === "INSERT");
      })
      .subscribe();
  } catch (e) {}
  setInterval(function () { fn(false); }, 30000);
};

// ----- แก้ไขออเดอร์ -----
Admin.updateOrder = async function (id, patch) {
  var r;
  try {
    r = await db.from("orders").update(patch).eq("id", id).select("id");
  } catch (e) {
    r = { error: { message: "เชื่อมต่อไม่ได้" } };
  }
  if (r.error || !r.data || !r.data.length) {
    Admin.toast((r.error && r.error.message) || "แก้ไขไม่สำเร็จ (อาจไม่มีสิทธิ์)");
    return false;
  }
  return true;
};

// ----- หน้าต่างป๊อปอัป (ปิดด้วย ov.close()) -----
Admin.modal = function (html) {
  var ov = document.createElement("div");
  ov.className = "mdl";
  ov.innerHTML = '<div class="mbox">' + html + "</div>";
  document.body.appendChild(ov);
  document.body.style.overflow = "hidden";
  ov.close = function () {
    ov.remove();
    document.body.style.overflow = "";
  };
  return ov;
};

// ----- รูปภาพ: ย่อรูปก่อนอัปโหลด (ไม่เกิน 800 พิกเซล) -----
Admin.imageToBlob = function (file, max) {
  max = max || 800;
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      var k = Math.min(1, max / Math.max(w, h));
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(w * k));
      cv.height = Math.max(1, Math.round(h * k));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(function (b) {
        if (b && b.type === "image/webp") { resolve(b); return; }
        cv.toBlob(function (j) {
          if (j) resolve(j); else reject(new Error("แปลงรูปไม่สำเร็จ"));
        }, "image/jpeg", 0.85);
      }, "image/webp", 0.85);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("เปิดรูปไม่ได้ (ไฟล์เสียหรือไม่ใช่รูปภาพ)"));
    };
    img.src = url;
  });
};

// อัปโหลดรูปไปที่ Supabase Storage แล้วคืนลิงก์รูป
Admin.uploadImage = async function (file, folder) {
  var blob = await Admin.imageToBlob(file, 800);
  var ext = blob.type === "image/webp" ? "webp" : "jpg";
  var path = folder + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
  var r = await db.storage.from("menu-images").upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
  if (r.error) throw new Error(r.error.message);
  return db.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
};

// ลบรูปเก่าออกจากที่เก็บ (ทำเต็มที่ ไม่แจ้งเตือนถ้าลบไม่ได้)
Admin.removeImage = async function (url) {
  var m = String(url || "").match(/\/menu-images\/(.+)$/);
  if (!m) return;
  try { await db.storage.from("menu-images").remove([decodeURIComponent(m[1])]); } catch (e) {}
};

// ----- สร้างโครงหน้าหลังบ้าน แล้วคืนค่า true เมื่อพร้อม -----
// opt: { section: "admin" | "kitchen" | "pos", side: "dashboard", roles: ["admin"], title: "..." }
Admin.init = async function (opt) {
  opt = opt || {};
  var root = document.getElementById("root");

  if (!db) {
    root.innerHTML = '<p style="padding:50px 20px;text-align:center">เชื่อมต่อระบบไม่ได้ ลองรีเฟรชหน้า</p>';
    return false;
  }

  var s;
  try { s = await db.auth.getSession(); } catch (e) { s = {}; }
  var session = s.data && s.data.session;
  if (!session) { location.replace("login.html"); return false; }

  var p;
  try {
    p = await db.from("profiles").select("full_name,role,active").eq("id", session.user.id).maybeSingle();
  } catch (e) { p = { error: e }; }
  if (p.error) {
    root.innerHTML = '<p style="padding:50px 20px;text-align:center">โหลดข้อมูลผู้ใช้ไม่สำเร็จ ลองรีเฟรชหน้า</p>';
    return false;
  }
  if (!p.data || !p.data.active || !Admin.HOME[p.data.role]) {
    await db.auth.signOut();
    location.replace("login.html?e=noaccess");
    return false;
  }
  var role = p.data.role;
  if (opt.roles && opt.roles.indexOf(role) === -1) {
    location.replace(Admin.HOME[role]);
    return false;
  }
  Admin.user = session.user;
  Admin.profile = p.data;

  // เมนูบนหัว
  var nav = [
    { k: "shop", t: "หน้าร้าน", href: "../index.html", ok: true },
    { k: "kitchen", t: "ครัว", href: "kitchen.html", ok: true },
    { k: "pos", t: "POS", href: "pos.html", ok: true, show: role !== "kitchen" },
    { k: "admin", t: role === "admin" ? "แอดมิน" : "ออเดอร์", href: Admin.HOME[role], ok: true, show: role !== "kitchen" }
  ];
  var navHtml = "";
  nav.forEach(function (n) {
    if (n.show === false) return;
    var on = n.k === opt.section ? " on" : "";
    if (n.ok) navHtml += '<a class="pill' + on + '" href="' + n.href + '">' + n.t + "</a>";
    else navHtml += '<a class="pill" href="#" data-soon="1">' + n.t + "</a>";
  });

  // เมนูซ้าย
  var sideHtml = "";
  if (opt.side) {
    Admin.SIDE.forEach(function (it) {
      if (it.roles.indexOf(role) === -1) return;
      if (it.ready) {
        sideHtml += '<a class="sbtn' + (it.k === opt.side ? " on" : "") + '" href="' + it.href + '">' + it.t + "</a>";
      } else {
        sideHtml += '<a class="sbtn soon" href="#" data-soon="1">' + it.t + "<small>เร็ว ๆ นี้</small></a>";
      }
    });
  }

  var title = opt.title || ("แอดมิน · " + esc(p.data.full_name || "ผู้ใช้"));
  root.innerHTML =
    '<header class="top">' +
      '<div class="brand"><div class="logo">🍕</div><div><b>Pizza House</b><small id="dbState">ฐานข้อมูล: กำลังตรวจสอบ</small></div></div>' +
      '<nav class="nav">' + navHtml +
        '<button class="pill" id="soundBtn"></button>' +
        '<button class="pill" id="logoutBtn">ออกจากระบบ</button>' +
      "</nav>" +
    "</header>" +
    '<main class="wrap">' +
      '<div class="head"><div><h1>' + title + '</h1><div class="sub" id="clock"></div></div></div>' +
      '<div class="layout' + (opt.side ? "" : " full") + '">' +
        (opt.side ? '<aside class="side">' + sideHtml + "</aside>" : "") +
        '<section id="content"></section>' +
      "</div>" +
    "</main>" +
    '<div class="atoast" id="atoast"></div>';

  // นาฬิกา
  function tick() {
    var d = new Date();
    var date = d.toLocaleDateString("th-TH", { dateStyle: "full", timeZone: "Asia/Bangkok" });
    var time = d.toLocaleTimeString("th-TH", { hour12: false, timeZone: "Asia/Bangkok" });
    var el = document.getElementById("clock");
    if (el) el.textContent = date + " เวลา " + time;
  }
  tick();
  setInterval(tick, 1000);

  // ปุ่มเสียง
  var sb = document.getElementById("soundBtn");
  function drawSound() { sb.textContent = "เสียง: " + (store("adminSound") === "1" ? "เปิด" : "ปิด"); }
  drawSound();
  sb.onclick = function () {
    store("adminSound", store("adminSound") === "1" ? "0" : "1");
    drawSound();
    Admin.beep();   // กดแล้วลองเล่นเสียงทันที (ช่วยให้เบราว์เซอร์อนุญาตเสียง)
  };

  // เมนูที่ยังไม่เปิดใช้
  root.addEventListener("click", function (e) {
    var a = e.target.closest("[data-soon]");
    if (a) { e.preventDefault(); Admin.toast("เมนูนี้จะเปิดใช้ในชุดถัดไป"); }
  });

  // ออกจากระบบ
  document.getElementById("logoutBtn").onclick = async function () {
    try { await db.auth.signOut(); } catch (e) {}
    location.replace("login.html");
  };
  db.auth.onAuthStateChange(function (ev) {
    if (ev === "SIGNED_OUT") location.replace("login.html");
  });

  return true;
};
