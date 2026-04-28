(function () {
  const app = document.getElementById("app");

  const screens = [
    { group: "Overview", slug: "site-map", title: "全体サイトマップ", reference: "00-1. 全体サイトマップ画像.png" },
    { group: "Customer", slug: "top", title: "トップページ", reference: "01. index.html トップページ.png" },
    { group: "Customer", slug: "customer-login", title: "会員ログイン", reference: "02. customer login.html 会員ログインページ.png" },
    { group: "Customer", slug: "questionnaire", title: "初回アンケート", reference: "04. customer questionnaire.html 初回アンケートページ.png" },
    { group: "Customer", slug: "product-reservation", title: "QR商品作成依頼", reference: "11. customer product-reservation.html QR商品作成依頼ページ.png" },
    { group: "Staff", slug: "staff-dashboard", title: "スタッフダッシュボード", reference: "14. staff staff-dashboard.html スタッフダッシュボード.png" },
    { group: "Admin", slug: "admin-dashboard", title: "管理者ダッシュボード", reference: "21. admin admin-dashboard.html 管理者ダッシュボード.png" }
  ];

  function currentSlug() {
    return location.hash.replace(/^#\/?/, "") || "top";
  }

  function byGroup() {
    return screens.reduce((acc, screen) => {
      if (!acc.has(screen.group)) acc.set(screen.group, []);
      acc.get(screen.group).push(screen);
      return acc;
    }, new Map());
  }

  function renderNavigation(activeSlug) {
    return `
      <aside class="prototype-nav">
        <h1>Fragrance Visual Prototype</h1>
        <p>レイアウト画像を完成目的地として、既存アセットを差し込みながら画面を再構成します。</p>
        ${Array.from(byGroup().entries()).map(([group, items]) => `
          <section class="screen-group">
            <h2>${group}</h2>
            ${items.map((item) => `
              <button class="screen-link ${item.slug === activeSlug ? "is-active" : ""}" data-screen="${item.slug}" type="button">
                ${item.title}
              </button>
            `).join("")}
          </section>
        `).join("")}
      </aside>
    `;
  }

  function renderPlaceholder(screen) {
    return `
      <section class="canvas placeholder-canvas">
        <div>
          <p class="reference-note">Reference: レイアウトimg/${screen.reference}</p>
          <h2>${screen.title}</h2>
          <p>この画面はこれから参照画像に合わせて実装します。</p>
        </div>
      </section>
    `;
  }

  function renderScreen(screen) {
    return `
      <main class="prototype-main">
        <div class="screen-frame">
          <div class="screen-toolbar">
            <strong>${screen.title}</strong>
            <span>参照: レイアウトimg/${screen.reference}</span>
          </div>
          ${renderPlaceholder(screen)}
        </div>
      </main>
    `;
  }

  function render() {
    const slug = currentSlug();
    const screen = screens.find((item) => item.slug === slug) || screens.find((item) => item.slug === "top");
    app.innerHTML = `
      <div class="prototype-shell">
        ${renderNavigation(screen.slug)}
        ${renderScreen(screen)}
      </div>
    `;
    document.querySelectorAll("[data-screen]").forEach((button) => {
      button.addEventListener("click", () => {
        location.hash = button.dataset.screen;
      });
    });
  }

  window.addEventListener("hashchange", render);
  render();
})();
