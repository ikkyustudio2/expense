/* Service worker — เก็บเปลือกแอปไว้ให้เปิดได้เร็วและเปิดได้แม้เน็ตหลุด
   ตัวข้อมูลจริงยังต้องต่อเน็ตเพราะอยู่บน Google Sheet */

var CACHE = 'expense-shell-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;

  // ปล่อยผ่านทุกอย่างที่ไม่ใช่การโหลดไฟล์ของแอปเอง
  if (req.method !== 'GET') return;                       // POST ที่ยิงไป Apps Script
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;        // ฟอนต์จาก Google

  // เอาของใหม่ก่อนเสมอ ถ้าเน็ตล่มค่อยใช้ของที่เก็บไว้ — แก้โค้ดแล้วผู้ใช้ได้ของใหม่ทันที
  e.respondWith(
    fetch(req)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () { });
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
  );
});
