(function () {
  // ==============================================
  // BURAYA KENDİ FIREBASE DEĞERLERİNİ YAZ
  var API_KEY      = "AIzaSyCRwKe9XdpWfad-cdXs6taAmlJ59zuHXqo";
  var AUTH_DOMAIN  = "rate-e1d98.firebaseapp.com";
  var DATABASE_URL = "https://rate-e1d98-default-rtdb.firebaseio.com";
  var PROJECT_ID   = "rate-e1d98";
  var STORAGE      = "rate-e1d98.firebasestorage.app";
  var SENDER_ID    = "420773156620";
  var APP_ID       = "1:420773156620:web:54c91b19522480352adb29";
  // ==============================================

  var MSGS = { 1: "Paylastigin icin tesekkurler!", 5: "Yorumunu birak!", 10: "Harika secim!" };

  function gc(n) { var m = document.cookie.match("(^|;)\\s*" + n + "\\s*=\\s*([^;]+)"); return m ? m.pop() : null; }
  function sc(n, v) { var d = new Date(); d.setTime(d.getTime() + 365*864e5); document.cookie = n+"="+v+";expires="+d.toUTCString()+";path=/"; }
  function dc(n) { document.cookie = n+"=;expires=Thu, 01 Jan 1970 00:00:01 UTC;path=/"; }

  function init() {
    if (typeof firebase === "undefined") { setTimeout(init, 300); return; }
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: API_KEY, authDomain: AUTH_DOMAIN, databaseURL: DATABASE_URL,
        projectId: PROJECT_ID, storageBucket: STORAGE, messagingSenderId: SENDER_ID, appId: APP_ID
      });
    }
    document.querySelectorAll("[id^='fbBtns-']").forEach(setup);
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
    var ref    = firebase.database().ref("ratings/" + pid);

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
      ldEl.textContent = "Hata: " + err.message;
    });

    vrEl.addEventListener("click", function(e) {
      var b = e.target.closest(".fbBtn");
      if (!b) return;
      var v = parseInt(b.dataset.value);
      var cur = gc(ck);
      if (cur) { if (parseInt(cur) === v) remove(v); return; }
      ref.transaction(function(c) {
        return c ? { total: c.total+v, count: c.count+1 } : { total: v, count: 1 };
      }).then(function() { sc(ck, v); lock(v); });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
