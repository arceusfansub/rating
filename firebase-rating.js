(function () {
  var fbConfig = {
    apiKey:            "BURAYA_API_KEY",
    authDomain:        "BURAYA_AUTH_DOMAIN",
    databaseURL:       "BURAYA_DATABASE_URL",
    projectId:         "BURAYA_PROJECT_ID",
    storageBucket:     "BURAYA_STORAGE_BUCKET",
    messagingSenderId: "BURAYA_MESSAGING_SENDER_ID",
    appId:             "BURAYA_APP_ID"
  };

  var fbMessages = {
    1:  "Paylaştiğin için teşekkürler!",
    5:  "Yorumunu bırak aşağıya!",
    10: "Harika seçim!"
  };

  function fbGetCookie(n) {
    var m = document.cookie.match("(^|;)\\s*" + n + "\\s*=\\s*([^;]+)");
    return m ? m.pop() : null;
  }
  function fbSetCookie(n, v) {
    var x = new Date();
    x.setTime(x.getTime() + 365 * 864e5);
    document.cookie = n + "=" + v + ";expires=" + x.toUTCString() + ";path=/;SameSite=Lax";
  }
  function fbDelCookie(n) {
    document.cookie = n + "=;expires=Thu, 01 Jan 1970 00:00:01 UTC;path=/;SameSite=Lax";
  }

  function fbShowError(msg) {
    document.querySelectorAll("[id^='fbBtns-']").forEach(function (w) {
      w.querySelector(".fbLoad").style.display = "none";
      var el = w.querySelector(".fbErr");
      el.textContent = msg;
      el.classList.remove("hidden");
    });
  }

  function fbConfigValid() {
    var keys = Object.keys(fbConfig);
    for (var i = 0; i < keys.length; i++) {
      if (!fbConfig[keys[i]]) return false;
      if (fbConfig[keys[i]].indexOf("BURAYA_") !== -1) return false;
    }
    return true;
  }

  function fbInitWidget(container) {
    var postId  = container.id.replace("fbBtns-", "");
    var cKey    = "fb_v_" + postId;
    var scoreEl = document.getElementById("fbScore-" + postId);
    var countEl = document.getElementById("fbCount-" + postId);
    var loadEl  = container.querySelector(".fbLoad");
    var voteRow = container.querySelector(".fbVoteRow");
    var msgEl   = container.querySelector(".fbMsg");
    var btns    = container.querySelectorAll(".fbBtn");
    var dbRef   = firebase.database().ref("ratings/" + postId);

    function fbRender(total, count) {
      scoreEl.textContent = count ? (total / count).toFixed(2) : "-";
      countEl.textContent = count ? count.toLocaleString("tr-TR") : "0";
    }

    function fbApplyVoted(voted) {
      btns.forEach(function (b) {
        var isIt = parseInt(b.dataset.value) === voted;
        b.style.opacity = isIt ? "1" : "0.4";
        b.style.cursor  = "default";
        if (isIt) b.querySelector(".fbBadge").classList.remove("hidden");
      });
      msgEl.innerHTML =
        (fbMessages[voted] || "Oyun alindi!") +
        " <span style='text-decoration:underline;cursor:pointer' class='fbUndoBtn'>Geri al</span>";
      msgEl.classList.remove("hidden");
      msgEl.querySelector(".fbUndoBtn").onclick = function () { fbRemove(voted); };
    }

    function fbClearVoted() {
      btns.forEach(function (b) {
        b.style.opacity = "1";
        b.style.cursor  = "pointer";
        b.querySelector(".fbBadge").classList.add("hidden");
      });
      msgEl.classList.add("hidden");
      msgEl.innerHTML = "";
    }

    function fbRemove(old) {
      dbRef.transaction(function (cur) {
        if (!cur) return { total: 0, count: 0 };
        return {
          total: cur.total - old > 0 ? cur.total - old : 0,
          count: cur.count - 1 > 0 ? cur.count - 1 : 0
        };
      }).then(function () {
        fbDelCookie(cKey);
        fbClearVoted();
      });
    }

    dbRef.on("value", function (snap) {
      var d = snap.val() || { total: 0, count: 0 };
      fbRender(d.total, d.count);
      loadEl.style.display = "none";
      voteRow.style.display = "grid";
      var voted = fbGetCookie(cKey);
      if (voted) fbApplyVoted(parseInt(voted));
    }, function (err) {
      loadEl.style.display = "none";
      container.querySelector(".fbErr").textContent = "Hata: " + err.message;
      container.querySelector(".fbErr").classList.remove("hidden");
    });

    voteRow.addEventListener("click", function (e) {
      var tgt = e.target.closest(".fbBtn");
      if (!tgt) return;
      var val     = parseInt(tgt.dataset.value);
      var current = fbGetCookie(cKey);
      if (current) {
        if (parseInt(current) === val) fbRemove(val);
        return;
      }
      dbRef.transaction(function (cur) {
        if (!cur) return { total: val, count: 1 };
        return { total: cur.total + val, count: cur.count + 1 };
      }).then(function () {
        fbSetCookie(cKey, val);
        fbApplyVoted(val);
      });
    });
  }

  function fbStart(tries) {
    if (typeof firebase === "undefined") {
      if (tries > 40) { fbShowError("Firebase SDK yuklenemedi."); return; }
      setTimeout(function () { fbStart(tries + 1); }, 200);
      return;
    }
    if (!fbConfigValid()) {
      fbShowError("Firebase config girilmemis.");
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(fbConfig);
    document.querySelectorAll("[id^='fbBtns-']").forEach(function (c) { fbInitWidget(c); });
  }

  fbStart(0);
}());
