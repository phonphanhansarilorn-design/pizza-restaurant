// ===== โค้ดวาดพิซซ่าและเอฟเฟกต์ (ใช้ร่วมกันหลายหน้า) =====
var NS = "http://www.w3.org/2000/svg";
function rnd(a, b) { return a + Math.random() * (b - a); }

// ตัวช่วยวาด (สี ไล่เฉด ฟิลเตอร์) ใส่ลงหน้าเว็บอัตโนมัติ
var DEFS =
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
  '<radialGradient id="crust"><stop offset="0" stop-color="#d99a4a"/><stop offset=".8" stop-color="#f2c47a"/><stop offset=".92" stop-color="#e4a24f"/><stop offset="1" stop-color="#b46f2b"/></radialGradient>' +
  '<radialGradient id="sauceR"><stop offset="0" stop-color="#e0452b"/><stop offset="1" stop-color="#a8240f"/></radialGradient>' +
  '<radialGradient id="sauceB"><stop offset="0" stop-color="#f8ecd0"/><stop offset="1" stop-color="#e4cc98"/></radialGradient>' +
  '<filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter>' +
  '<filter id="blur"><feGaussianBlur stdDeviation="1.6"/></filter>' +
  '</defs></svg>';
document.body.insertAdjacentHTML("afterbegin", DEFS);

// ===== รูปทรงวัตถุดิบ (ภายหลังเปลี่ยนเป็นรูป PNG ได้) =====
var SH = {
  moz: '<path d="M-15,-3C-14,-13-2,-16 6,-12C16,-10 18,0 12,8C6,16-8,14-14,6C-17,3-16,0-15,-3Z" fill="#fff6e2" stroke="#ecd9aa" stroke-width="1.2"/><path d="M-6,-6C0,-9 6,-6 8,-1" stroke="#fffdf5" stroke-width="2" fill="none"/>',
  bacon: '<path d="M-18,-4Q-9,-9 0,-4T18,-4L18,4Q9,9 0,4T-18,4Z" fill="#bf4636" stroke="#8c2a1f" stroke-width="1"/><path d="M-17,0Q-9,-5 0,0T17,0" stroke="#f3c9b8" stroke-width="2.4" fill="none"/>',
  pep: '<circle r="12" fill="#b22a1c" stroke="#85190f" stroke-width="1.2"/><circle cx="-4" cy="-3" r="1.6" fill="#7a150d"/><circle cx="4" cy="2" r="1.8" fill="#7a150d"/><circle cx="-2" cy="5" r="1.3" fill="#7a150d"/><ellipse cx="-4" cy="-6" rx="4" ry="2" fill="#d4553f" opacity=".7"/>',
  sau: '<circle r="10" fill="#8a4b2e" stroke="#5e2f1a" stroke-width="1.2"/><circle cx="-3" cy="-2" r="1.6" fill="#d9a77a"/><circle cx="4" cy="2" r="1.4" fill="#d9a77a"/><circle cx="-1" cy="5" r="1.2" fill="#d9a77a"/>',
  mush: '<path d="M-12,3C-12,-11 12,-11 12,3Z" fill="#e3cfae" stroke="#b79b72" stroke-width="1.2"/><path d="M-4,3H4L3,12H-3Z" fill="#efe3cc" stroke="#b79b72" stroke-width="1.2"/>',
  pine: '<path d="M-12,-6Q0,-14 12,-6L8,8Q0,12-8,8Z" fill="#f8d34a" stroke="#e2a912" stroke-width="1.2"/><path d="M-6,-2L-3,6M2,-4L4,5" stroke="#f0b929" stroke-width="1.3"/>',
  basil: '<path d="M0,-14C12,-10 14,6 0,14C-14,6-12,-10 0,-14Z" fill="#3f8f3a" stroke="#2a6a29" stroke-width="1"/><path d="M0,-12V12" stroke="#7cc16f" stroke-width="1.3"/>',
  buf: '<path d="M-14,-4C-13,-13 3,-15 11,-9C17,-3 15,8 6,12C-4,15-15,8-14,-4Z" fill="#fffdf6" stroke="#eee3c6" stroke-width="1.2"/><ellipse cx="-3" cy="-5" rx="5" ry="2.5" fill="#fff"/>',
  scam: '<path d="M-13,6C-13,-8-2,-14 8,-9C14,-5 14,3 10,8Z" fill="#fbeec0" stroke="#e3cf8e" stroke-width="1.2"/>',
  gorg: '<path d="M-12,0C-10,-10 2,-13 9,-7C14,-2 12,8 3,10C-6,12-13,7-12,0Z" fill="#f4efdc" stroke="#d8cfae" stroke-width="1"/><circle cx="-3" cy="-2" r="2" fill="#5b7fa8"/><circle cx="4" cy="3" r="1.8" fill="#4d6f96"/><circle cx="0" cy="-6" r="1.3" fill="#6a8db5"/>',
  parm: '<path d="M-14,2Q-6,-12 8,-8Q16,-4 12,4Q2,0 -14,2Z" fill="#f6e3a2" stroke="#d9b862" stroke-width="1"/>',
  ric: '<circle r="10" fill="#fffaf0" stroke="#eadfc4" stroke-width="1.2"/><circle cx="-3" cy="-3" r="2" fill="#fff"/><circle cx="3" cy="3" r="1.5" fill="#f0e6cc"/>',
  ham: '<path d="M-14,-2Q-12,-12 -2,-10Q8,-14 14,-4Q16,6 6,10Q-4,14 -12,8Q-16,4 -14,-2Z" fill="#f2a59a" stroke="#d27b70" stroke-width="1.2"/><path d="M-8,-2Q0,-6 8,0" stroke="#f9cfc6" stroke-width="2" fill="none"/>',
  tuna: '<path d="M-12,-4Q-6,-12 6,-9Q14,-4 11,6Q2,12 -8,8Q-14,4 -12,-4Z" fill="#e8c6a2" stroke="#c49a6e" stroke-width="1.2"/><path d="M-6,-2L2,3M-2,-6L6,0" stroke="#d9ae84" stroke-width="1.3"/>',
  anch: '<path d="M-18,3Q-9,-6 0,0T18,-3L17,2Q9,8 0,4T-17,8Z" fill="#8a5a3a" stroke="#5f3a22" stroke-width="1"/>',
  shr: '<path d="M-10,6Q-14,-6 -2,-10Q10,-12 12,0Q12,8 4,8Q8,2 2,-3Q-6,-2 -4,6Z" fill="#f08a5a" stroke="#c4562a" stroke-width="1.2"/><path d="M-6,-6L-3,-2M0,-9L2,-4M6,-9L7,-4" stroke="#fbc09c" stroke-width="1.3"/>',
  oli: '<circle r="8" fill="#2b2b24" stroke="#14140f" stroke-width="1"/><circle r="3.2" fill="#9c3016"/>',
  bell: '<path d="M-14,-2Q-8,-12 2,-8Q12,-6 14,2" stroke="#2f9a3a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-14,-2Q-8,-12 2,-8Q12,-6 14,2" stroke="#7fd070" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  onion: '<circle r="10" fill="none" stroke="#c9a0d0" stroke-width="3"/><circle r="5.5" fill="none" stroke="#efe0f2" stroke-width="2"/>',
  tom: '<circle r="11" fill="#e0392b" stroke="#a82217" stroke-width="1.2"/><path d="M0,-7V7M-7,0H7" stroke="#f4a08a" stroke-width="1.2"/><circle r="3" fill="#f7c0aa"/>',
  corn: '<circle cx="-3" cy="-2" r="3.4" fill="#f9d548" stroke="#d9a820"/><circle cx="4" cy="2" r="3.4" fill="#f9d548" stroke="#d9a820"/><circle cx="-2" cy="6" r="2.8" fill="#f9d548" stroke="#d9a820"/>',
  jal: '<circle r="8" fill="#6fb04a" stroke="#3f7a2a" stroke-width="1.2"/><circle r="4" fill="#d9e8a0"/><circle cx="-1" cy="1" r=".9" fill="#f6f0c0"/><circle cx="2" cy="-1" r=".9" fill="#f6f0c0"/>',
  oreg: '<circle cx="-4" cy="-3" r="1.3" fill="#5f6b22"/><circle cx="3" cy="-5" r="1.1" fill="#6b7a2a"/><circle cx="5" cy="2" r="1.3" fill="#5f6b22"/><circle cx="-2" cy="5" r="1.1" fill="#6b7a2a"/>',
  garl: '<path d="M-6,-8Q6,-8 6,2Q4,9 -2,9Q-8,4 -6,-8Z" fill="#fffbe8" stroke="#e3d7aa" stroke-width="1.1"/>',
  pest: '<path d="M0,0Q6,-2 5,4Q2,10 -6,6Q-12,-2 -4,-9Q8,-12 13,-2" fill="none" stroke="#4a9a3a" stroke-width="3.5" stroke-linecap="round"/>',
  chil: '<path d="M0,0Q6,-2 5,4Q2,10 -6,6Q-12,-2 -4,-9Q8,-12 13,-2" fill="none" stroke="#e5521a" stroke-width="3.5" stroke-linecap="round"/>'
};

// ===== ฐานพิซซ่า (แป้ง ขอบไหม้ ซอส) =====
function baseHTML() {
  var h = '<circle r="146" fill="url(#crust)" filter="url(#rough)"/>', i, a, r, x, y;
  for (i = 0; i < 16; i++) {
    a = rnd(0, 6.283); r = rnd(130, 141);
    x = Math.cos(a) * r; y = Math.sin(a) * r;
    h += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rnd(4, 10) + '" ry="' + rnd(2, 5) +
      '" fill="#3a1e0e" opacity="' + rnd(.3, .65) + '" transform="rotate(' + (a * 57.3 + 90) + ' ' + x + ' ' + y + ')" filter="url(#blur)"/>';
  }
  h += '<circle r="122" fill="#7a3a12" opacity=".35"/>' +
    '<circle class="sauce" r="119" fill="url(#sauceR)" filter="url(#rough)"/><g class="sb">';
  var cols = ["#f0643a", "#c32d19", "#8f1d0f", "#ff8a4a"];
  for (i = 0; i < 70; i++) {
    a = rnd(0, 6.283); r = Math.sqrt(Math.random()) * 112;
    h += '<circle cx="' + Math.cos(a) * r + '" cy="' + Math.sin(a) * r + '" r="' + rnd(2, 9) +
      '" fill="' + cols[i % 4] + '" opacity="' + rnd(.2, .45) + '"/>';
  }
  for (i = 0; i < 26; i++) {
    a = rnd(0, 6.283); r = Math.sqrt(Math.random()) * 110;
    h += '<circle cx="' + Math.cos(a) * r + '" cy="' + Math.sin(a) * r + '" r="1.1" fill="#6b7a2a"/>';
  }
  return h + '</g><g class="layers"></g>';
}

// ===== ตัวควบคุมพิซซ่า =====
function Pizza(svg) {
  svg.innerHTML = baseHTML();
  this.svg = svg;
  this.g = svg.querySelector(".layers");
  this.els = {};
  this.pts = {};
  this.baking = false;
}

// เช็กว่าจุดนี้ว่างไหม (กันท็อปปิ้งทับกันเกินไป)
Pizza.prototype.free = function (x, y) {
  for (var id in this.pts) {
    var p = this.pts[id];
    for (var i = 0; i < p.length; i++) {
      var dx = p[i][0] - x, dy = p[i][1] - y;
      if (dx * dx + dy * dy < 400) return false;
    }
  }
  return true;
};

// วางท็อปปิ้ง t = { id, s (ชื่อรูปทรง), k (จำนวนชิ้น) }
Pizza.prototype.add = function (t) {
  if (this.els[t.id]) return;
  var list = [], html = "", i, n, x, y, a, d;
  for (i = 0; i < t.k; i++) {
    for (n = 0; n < 25; n++) {
      a = rnd(0, 6.283); d = Math.sqrt(Math.random()) * 100;
      x = Math.cos(a) * d; y = Math.sin(a) * d;
      if (this.free(x, y) && list.every(function (p) {
        return (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y) > 400;
      })) break;
    }
    list.push([x, y]);
    html += '<g class="pc" style="--x:' + x.toFixed(1) + 'px;--y:' + y.toFixed(1) +
      'px;--r:' + Math.floor(rnd(0, 360)) + 'deg;--s:' + rnd(.85, 1.15).toFixed(2) +
      ';transform:translate(var(--x),var(--y)) rotate(var(--r)) scale(var(--s));animation-delay:' +
      (i * 0.06).toFixed(2) + 's">' + SH[t.s] + '</g>';
  }
  var g = document.createElementNS(NS, "g");
  g.innerHTML = html;
  this.g.appendChild(g);
  this.els[t.id] = g;
  this.pts[t.id] = list;
};

Pizza.prototype.remove = function (id) {
  if (this.els[id]) {
    this.els[id].remove();
    delete this.els[id];
    delete this.pts[id];
  }
};

Pizza.prototype.clear = function () {
  for (var id in this.els) this.remove(id);
};

// เปลี่ยนซอส: "R" = ซอสแดง, "B" = ซอสขาว
Pizza.prototype.setSauce = function (code) {
  this.svg.querySelector(".sauce").setAttribute("fill", code === "R" ? "url(#sauceR)" : "url(#sauceB)");
  this.svg.querySelector(".sb").style.opacity = code === "R" ? 1 : 0.25;
};

// เอฟเฟกต์อบ: แสงแดงส้มเรืองรอบพิซซ่า แล้วขอบเข้มขึ้นนิดเดียว
Pizza.prototype.bake = function (done) {
  if (this.baking) return;
  this.baking = true;
  var self = this, pz = this.svg.closest(".pz");
  pz.classList.add("heat");
  var ring = this.svg.querySelector(".bakeRing");
  if (!ring) {
    ring = document.createElementNS(NS, "circle");
    ring.setAttribute("class", "bakeRing");
    ring.setAttribute("r", "134");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "#5a2608");
    ring.setAttribute("stroke-width", "26");
    ring.setAttribute("filter", "url(#blur)");
    this.svg.insertBefore(ring, this.g);
  }
  setTimeout(function () { ring.style.opacity = ".32"; }, 120);
  setTimeout(function () {
    pz.classList.remove("heat");
    self.baking = false;
    if (done) done();
  }, 1900);
};

// ทำให้ขอบกลับเป็นสีดิบ (เมื่อลูกค้าแก้ท็อปปิ้ง)
Pizza.prototype.unbake = function () {
  var r = this.svg.querySelector(".bakeRing");
  if (r) r.style.opacity = 0;
};
