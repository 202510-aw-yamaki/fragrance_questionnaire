(function () {
  const app = document.getElementById("app");

  const screens = window.VisualPrototypeScreens || [];

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
          <img class="reference-preview" src="../レイアウトimg/${screen.reference}" alt="${screen.title} の参照画像">
        </div>
      </section>
    `;
  }

  function renderCustomerTop() {
    return `
      <section class="canvas customer-home">
        <header class="site-head">
          <div class="brand-mark">Fragrance Workshop</div>
          <nav>
            <a>アンケート</a>
            <a>体験の流れ</a>
            <a>よくある質問</a>
            <a>会員ログイン</a>
            <a class="pill-gold">予約する</a>
          </nav>
        </header>
        <section class="home-hero">
          <div class="home-hero-copy">
            <h1>あなたに合う<br>香りを知る</h1>
            <p>8問・約1分で、今のあなたに合う香りバランスのベースをつくります。</p>
            <div class="hero-actions">
              <button class="rose-button">アンケートをはじめる</button>
              <button class="outline-button">会員ログイン</button>
              <button class="outline-button">ワークショップ予約</button>
            </div>
          </div>
        </section>
        <section class="section-block">
          <h2>3ステップで、来店前の準備が完了</h2>
          <div class="step-cards">
            ${[
              ["香りのアンケート", "前半は香り・色・気分・使いたいシーンを、答えやすい質問だけで進みます。", "../img/questionnaire/花香る.png"],
              ["ベースができる", "5問目までは共通、後半は回答傾向に応じて分岐します。", "../img/TOP/香水の瓶が並ぶ.png"],
              ["店頭で完成", "診断結果は確定ではなく、当日スタッフと一緒に仕上げます。", "../img/TOP/香水対比.png"]
            ].map(([title, body, image]) => `
              <article class="soft-card step-card">
                <img src="${image}" alt="">
                <h3>${title}</h3>
                <p>${body}</p>
              </article>
            `).join("")}
          </div>
        </section>
        <section class="home-lower-grid">
          <article class="soft-card flow-card">
            <h2>体験の流れ</h2>
            ${["アンケート回答", "香り5軸を確認", "来店予約", "ワークショップで調香", "完成品を受け取る"].map((item, index) => `
              <div class="flow-row"><strong>${index + 1}</strong><span>${item}</span></div>
            `).join("")}
          </article>
          <article class="soft-card support-card">
            <h2>安心して楽しめるワークショップ</h2>
            <div class="support-row"><strong>初めてでもスタッフがサポート</strong><span>丁寧にサポートするので、香りが苦手な方でも安心です。</span></div>
            <div class="support-row"><strong>アンケート結果をもとに提案</strong><span>あなたの傾向に合わせた香りの方向性をご提案します。</span></div>
            <div class="cta-strip">
              <button class="rose-button">アンケートへ</button>
              <button class="outline-button">予約ページへ</button>
            </div>
          </article>
        </section>
      </section>
    `;
  }

  function renderCustomerLogin() {
    return `
      <section class="canvas login-canvas">
        <header class="site-head transparent">
          <div class="brand-mark">Fragrance Workshop</div>
          <a class="home-link">トップページへ戻る</a>
        </header>
        <div class="login-layout">
          <form class="ornament-panel login-panel">
            <p class="mini-ornament">✣</p>
            <h1>会員ログイン</h1>
            <p>過去に作った香水や、次回のご予約を確認できます。</p>
            <label>会員ID または メールアドレス<input placeholder="例）member@example.com"></label>
            <label>パスワード<input type="password" placeholder="パスワードを入力"></label>
            <button class="rose-button full">ログイン</button>
            <a>初回ログイン・パスワード設定</a>
            <a>パスワードをお忘れの方</a>
          </form>
          <section class="login-benefits">
            <h2>会員ページでできること</h2>
            <div class="benefit-grid">
              ${["制作履歴を見る", "過去の香水を再予約", "再度アンケートから予約", "前回の香りと比較"].map((item) => `
                <article class="benefit-card"><span></span><strong>${item}</strong></article>
              `).join("")}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderQuestionnaire() {
    return `
      <section class="canvas questionnaire-canvas">
        <header class="site-head transparent">
          <div class="brand-mark">Fragrance Workshop</div>
        </header>
        <main class="question-layout">
          <section class="question-main">
            <div class="question-title">
              <h1>香りのアンケート</h1>
              <p>今の気分や好きな雰囲気から、あなたの香りの方向性を見つけます。</p>
            </div>
            <article class="question-card">
              <h2>今日はどんな雰囲気の香りに惹かれますか？</h2>
              <div class="answer-grid">
                ${[
                  ["華やかで明るい", "../img/questionnaire/花香る.png"],
                  ["やわらかく甘い", "../img/questionnaire/優しいピンク.png", "is-selected"],
                  ["爽やかで軽やか", "../img/questionnaire/みずみずしい.png"],
                  ["深みがあり落ち着く", "../img/questionnaire/深いグリーン.png"]
                ].map(([label, image, state = ""]) => `
                  <button class="answer-card ${state}">
                    <img src="${image}" alt="">
                    <strong>${label}</strong>
                  </button>
                `).join("")}
              </div>
              <div class="question-actions">
                <button class="rose-button">次へ</button>
                <div class="info-pill">香り5軸に反映されます</div>
              </div>
            </article>
          </section>
          <aside class="question-side">
            <div class="progress-card"><span>✣</span><strong>1 / 5</strong><i></i></div>
            <img class="side-bottle" src="../img/TOP/香水対比.png" alt="">
            <div class="axis-card">
              <h3>香り5軸とは？</h3>
              <div class="radar-mock"><span></span></div>
            </div>
          </aside>
        </main>
      </section>
    `;
  }

  function renderProductRequest() {
    return `
      <section class="canvas product-request-canvas">
        <div class="product-phone-card">
          <p class="mini-ornament">QR商品ページ</p>
          <h1>月夜の余韻</h1>
          <p class="section-heading">容量を選択してください</p>
          <div class="price-row"><span>10ml</span><strong>1,000円（税込）</strong></div>
          <div class="price-row"><span>30ml</span><strong>2,860円（税込）</strong></div>
          <div class="qty-row"><span>10ml 数量</span><div><button>−</button><strong>2</strong><button>＋</button></div></div>
          <div class="qty-row"><span>30ml 数量</span><div><button>−</button><strong>1</strong><button>＋</button></div></div>
          <section class="summary-box">
            <h2>ご依頼内容</h2>
            <p>10ml × 2本 = 2,000円<br>30ml × 1本 = 2,860円</p>
            <strong>商品合計：4,860円（税込）</strong>
            <small>合計容量：50ml / 最大100ml</small>
          </section>
          <label class="mail-field">メールアドレス<input placeholder="yourname@example.com"></label>
          <button class="rose-button full">この香水を作成依頼する</button>
          <p class="button-note">※このボタンを押すと、原材料在庫の確認後、メールをさせていただきます。</p>
          <div class="notice-box">送料・着払い手数料は別途かかります。正式な送料等は、作成可能のご案内後に確認させていただきます。</div>
          <div class="phone-box">店舗電話番号：03-1234-5678<br>受付時間：11:00〜19:00</div>
        </div>
      </section>
    `;
  }

  function renderScreenContent(screen) {
    if (screen.kind === "customer-top") return renderCustomerTop();
    if (screen.kind === "customer-login") return renderCustomerLogin();
    if (screen.kind === "questionnaire") return renderQuestionnaire();
    if (screen.kind === "product-request") return renderProductRequest();
    return renderPlaceholder(screen);
  }

  function renderScreen(screen) {
    return `
      <main class="prototype-main">
        <div class="screen-frame">
          <div class="screen-toolbar">
            <strong>${screen.title}</strong>
            <span>参照: レイアウトimg/${screen.reference}</span>
          </div>
          ${renderScreenContent(screen)}
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
