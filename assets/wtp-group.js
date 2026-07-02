/**
 * Group live-status cards by product.
 *
 * Upptime has no native monitor grouping, so this post-processes the
 * client-rendered card list: monitors named "<Product> — <Variant>"
 * (em dash) are gathered under one product heading and their card titles
 * trimmed to the variant. Products with a single monitor keep their full
 * name and get no heading.
 *
 * Idempotent and re-applied on re-render (Svelte rebuilds the section when
 * the 24h/7d/... range changes) via a debounced MutationObserver; our own
 * DOM writes are guarded so they don't re-trigger grouping.
 */
(function () {
  var SEP = " — "; // em dash separator used in .upptimerc.yml site names
  var applying = false;

  function groupOf(article) {
    var link = article.querySelector("h4 a");
    if (!link) return null;
    var full = (link.getAttribute("data-wtp-full-name") || link.textContent).trim();
    var i = full.indexOf(SEP);
    return {
      link: link,
      full: full,
      product: i > 0 ? full.slice(0, i) : full,
      variant: i > 0 ? full.slice(i + SEP.length) : null,
    };
  }

  function apply() {
    var section = document.querySelector("section.live-status");
    if (!section) return;
    var articles = Array.prototype.slice.call(section.querySelectorAll("article"));
    if (!articles.length) return;

    applying = true;
    try {
      // drop any headings from a previous pass (range switch rebuilds cards)
      Array.prototype.forEach.call(
        section.querySelectorAll(".wtp-group-heading"),
        function (n) { n.remove(); }
      );

      var infos = articles.map(groupOf).filter(Boolean);
      var counts = {};
      infos.forEach(function (x) { counts[x.product] = (counts[x.product] || 0) + 1; });

      // physically regroup: stable order of first appearance per product
      var seen = [];
      infos.forEach(function (x) {
        if (seen.indexOf(x.product) === -1) seen.push(x.product);
      });
      seen.forEach(function (product) {
        infos.forEach(function (x) {
          var el = x.link.closest("article");
          if (x.product === product && el) section.appendChild(el);
        });
      });

      // headings for multi-monitor products; trim card titles to the variant
      var last = null;
      infos
        .slice()
        .sort(function (a, b) { return seen.indexOf(a.product) - seen.indexOf(b.product); })
        .forEach(function (x) {
          var el = x.link.closest("article");
          if (!el) return;
          if (counts[x.product] > 1) {
            if (x.product !== last) {
              var h = document.createElement("h3");
              h.className = "wtp-group-heading";
              h.textContent = x.product;
              section.insertBefore(h, el);
            }
            x.link.setAttribute("data-wtp-full-name", x.full);
            x.link.textContent = x.variant || x.full;
          }
          last = x.product;
        });
    } finally {
      // release the guard after the mutations we just caused are flushed
      requestAnimationFrame(function () { applying = false; });
    }
  }

  var pending = null;
  function schedule() {
    if (applying) return;
    if (pending) cancelAnimationFrame(pending);
    pending = requestAnimationFrame(apply);
  }

  function boot() {
    var main = document.querySelector("main");
    if (!main) return;
    new MutationObserver(schedule).observe(main, { childList: true, subtree: true });
    schedule();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
