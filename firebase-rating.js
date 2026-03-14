(function () {
  var API_KEY      = "DEGISTIR";
  var AUTH_DOMAIN  = "DEGISTIR";
  var DATABASE_URL = "DEGISTIR";
  var PROJECT_ID   = "DEGISTIR";
  var STORAGE      = "DEGISTIR";
  var SENDER_ID    = "DEGISTIR";
  var APP_ID       = "DEGISTIR";

  var MSGS = { 1: "Paylastigin icin tesekkurler!", 5: "Yorumunu birak!", 10: "Harika secim!" };

  function gc(n) { var m = document.cookie.match("(^|;)\\s*" + n + "\\s*=\\s*([^;]+)"); return m ? m.pop() : null; }
  function sc(n, v) { var d = new Date(); d.setTime(d.getTime() + 365*864e5); document.cookie = n+"="+v+";expires="+d.toUTCString()+";path=/"; }
  function dc(n) { document.cookie = n+"=;expires=Thu, 01 Jan 1970 00:00:01 UTC;path=/"; }

  function init() {
    if (typeof firebase === "undefined") {
      setTimeout(init, 300);
      return;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp({
          apiKey: API_KEY, authDomain: AUTH_DOMAIN, databaseURL: DATABASE_URL,
          projectId: PROJECT_ID, storageBucket: STORAGE, messagingSenderId: SENDER_ID, appId: APP_ID
        });
      }
    } catch(e) {
      document.querySelectorAll(".fbLoad").forEach(function(el) { el.textContent = "initializeApp hata: " + e.message; });
      return;
    }

    var widgets = document.querySelectorAll("[id^='fbBtns-']");
    if (widgets.length === 0) {
      // Widget bulunamadı, 500ms bekle tekrar dene
      setTimeout(init, 500);
      return;
    }
    widgets.forEach(setup);
  }

  function setup(wrap) {
    var pid    = wrap.id.replace("fbBtns-", "");
    var ck     = "fb_v_" + pid;
    var sEl    = document.getElementById("fbScore-" + pid);
    var cEl    = document.getElementById("fbCount-" + pid);
    var ldEl   = wrap.querySelector(".fbLoad");
    var vrEl   = wrap.querySelector(".fbVoteRow");
    var msgEl  = wrap.querySelector(".fbMsg");
    var btnEls = wrap.querySelectorAll(".fbBtn");

    ldEl.textContent = "Baglaniliyor...";

    var ref;
    try {
      ref = firebase.database().ref("ratings/" + pid);
    } catch(e) {
      ldEl.textContent = "DB hata: " + e.message;
      return;
    }

    function render(t, c) {
      sEl.textContent = c ? (t/c).toFixed(2) : "-";
      cEl.textContent = c ? c.toLocaleString("tr-TR") : "0";
    }
    function lock(v) {
      btnEls.forEach(function(b) {
        var mine = parseInt(b.dataset.value) === v;
        b.style.opacity = mine ? "1" : "0.4";
        b.style.cursor = "default";
        if (mine) b.querySelector(".fbBadge").classList.remove("hidden");
      });
      msgEl.innerHTML = MSGS[v] + " <u style='cursor:pointer' class='fbUndo'>Geri al</u>";
      msgEl.classList.remove("hidden");
      msgEl.querySelector(".fbUndo").onclick = function() { remove(v); };
    }
    function unlock() {
      btnEls.forEach(function(b) {
        b.style.opacity = "1"; b.style.cursor = "pointer";
        b.querySelector(".fbBadge").classList.add("hidden");
      });
      msgEl.classList.add("hidden"); msgEl.innerHTML = "";
    }
    function remove(old) {
      ref.transaction(function(cur) {
        if (!cur) return { total: 0, count: 0 };
        return { total: cur.total-old > 0 ? cur.total-old : 0, count: cur.count-1 > 0 ? cur.count-1 : 0 };
      }).then(function() { dc(ck); unlock(); });
    }

    ref.on("value", function(snap) {
      var d = snap.val() || { total: 0, count: 0 };
      render(d.total, d.count);
      ldEl.style.display = "none";
      vrEl.style.display = "grid";
      var v = gc(ck);
      if (v) lock(parseInt(v));
    }, function(err) {
      ldEl.textContent = "Firebase hata: " + err.message + " (kod: " + err.code + ")";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
