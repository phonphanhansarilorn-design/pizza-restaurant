// ===== เชื่อมต่อ Supabase =====
// anon key ใส่ในเว็บได้ เพราะความปลอดภัยอยู่ที่กฎ RLS ในฐานข้อมูล
// ห้ามนำ service_role / secret key มาใส่ในไฟล์นี้เด็ดขาด
var SUPABASE_URL = "https://wxpyxyokvokaatpjedue.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cHl4eW9rdm9rYWF0cGplZHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0Nzg2ODUsImV4cCI6MjExMDA1NDY4NX0.6iqEHb_iWOnIlIinlHNNhIpRbyW0PL6hMfXe3FVw424";

var db = null;
try {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  console.error("เชื่อมต่อ Supabase ไม่สำเร็จ", e);
}
