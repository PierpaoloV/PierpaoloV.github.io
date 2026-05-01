(function () {
  var root = document.documentElement;

  function syncThemeAttribute() {
    var body = document.body;
    if (body) {
      root.setAttribute("data-bs-theme", body.classList.contains("quarto-dark") ? "dark" : "light");
      return;
    }

    try {
      var stored = localStorage.getItem("quarto-color-scheme");
      if (!stored) {
        localStorage.setItem("quarto-color-scheme", "alternate");
        stored = "alternate";
      }
      root.setAttribute("data-bs-theme", stored === "alternate" ? "dark" : "light");
    } catch {
      root.setAttribute("data-bs-theme", "light");
    }
  }

  syncThemeAttribute();

  document.addEventListener("DOMContentLoaded", function () {
    syncThemeAttribute();
    if (!document.body) {
      return;
    }
    var observer = new MutationObserver(syncThemeAttribute);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  });
})();
