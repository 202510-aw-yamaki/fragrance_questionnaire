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
          <p class="reference-note">未実装</p>
          <h2>${screen.title}</h2>
          <p>完成イメージ画像は参照用にのみ扱い、画面内には差し込みません。</p>
        </div>
      </section>
    `;
  }

  function renderOverview(screen) {
    const isDb = screen.slug === "db-map";
    const customerNodes = ["TOP", "会員ログイン", "アンケート", "結果", "予約", "QR商品依頼"];
    const staffNodes = ["スタッフログイン", "予約一覧", "予約枠", "顧客詳細", "接客記録"];
    const adminNodes = ["管理者ログイン", "基本設定", "配点調整", "原料管理", "QR通知"];
    const dbNodes = ["customers", "questionnaire_results", "reservations", "staff_users", "product_qr_codes", "qr_product_requests", "admin_settings"];
    return `
      <section class="canvas overview-canvas">
        <main class="overview-board">
          <section class="overview-title">
            <p class="mini-ornament">${isDb ? "DATABASE MAP" : "SITE MAP"}</p>
            <h1>${screen.title}</h1>
            <p>完成イメージ画像を見ながら、HTML/CSSで再構成するためのプロトタイプ図です。</p>
          </section>
          ${isDb ? `
            <section class="db-diagram">
              <article class="db-cluster public"><h2>Public</h2>${dbNodes.slice(1, 3).map((item) => `<span>${item}</span>`).join("")}</article>
              <article class="db-cluster identity"><h2>Identity</h2>${["Supabase Auth", "profiles", "roles"].map((item) => `<span>${item}</span>`).join("")}</article>
              <article class="db-cluster qr"><h2>QR Product</h2>${dbNodes.slice(4, 6).map((item) => `<span>${item}</span>`).join("")}</article>
              <article class="db-cluster admin"><h2>Admin</h2>${["staff_users", "admin_settings", "email_events"].map((item) => `<span>${item}</span>`).join("")}</article>
            </section>
          ` : `
            <section class="site-map-grid">
              <article><h2>Customer</h2>${customerNodes.map((item) => `<span>${item}</span>`).join("")}</article>
              <article><h2>Staff</h2>${staffNodes.map((item) => `<span>${item}</span>`).join("")}</article>
              <article><h2>Admin</h2>${adminNodes.map((item) => `<span>${item}</span>`).join("")}</article>
            </section>
          `}
        </main>
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

  function renderCustomerDashboard() {
    return `
      <section class="canvas customer-dashboard">
        <header class="site-head"><div class="brand-mark">Fragrance Workshop</div><nav><a>制作履歴</a><a>予約確認</a><a>ログアウト</a></nav></header>
        <section class="member-hero">
          <div>
            <p class="mini-ornament">MEMBER PAGE</p>
            <h1>前回の香りと、今日の気分を見比べる</h1>
            <p>制作履歴・予約・QR共有をひとつの場所で確認できる会員ページの試作です。</p>
          </div>
          <img src="../img/TOP/香水ハンドクリーム.png" alt="">
        </section>
        <main class="member-grid">
          <article class="member-card featured">
            <span>前回の完成品</span>
            <h2>月夜の余韻</h2>
            <p>フローラル 32% / ウッディ 28% / ムスク 24%</p>
            <button class="outline-button">比較して見る</button>
          </article>
          <article class="member-card">
            <span>次回予約</span>
            <h2>2026.05.12 14:00</h2>
            <p>上野教室 / 2名</p>
          </article>
          <article class="member-card">
            <span>QR公開</span>
            <h2>第三者作成依頼を許可済み</h2>
            <p>商品名と公開状態をスタッフ詳細で管理します。</p>
          </article>
          <section class="history-list">
            <h2>制作履歴</h2>
            ${["2026.04.14 / 月夜の余韻", "2025.12.22 / 白檀の朝", "2025.09.03 / 雨上がりの庭"].map((item) => `<article><span>${item}</span><strong>詳細</strong></article>`).join("")}
          </section>
        </main>
      </section>
    `;
  }

  function renderResult(screen) {
    const compare = screen.slug === "fragrance-graph-compare";
    return `
      <section class="canvas result-canvas">
        <header class="site-head transparent"><div class="brand-mark">Fragrance Workshop</div><nav><a>結果</a><a>予約へ進む</a><a>会員保存</a></nav></header>
        <main class="result-hero">
          <section class="result-title">
            <p class="mini-ornament">FRAGRANCE RESULT</p>
            <h1>${compare ? "前回の香りとの変化" : "あなたの香りタイプ"}</h1>
            <p>${compare ? "会員の制作履歴と今回のアンケート結果を並べて表示します。" : "アンケート回答から導いた香りの方向性と配合候補です。"}</p>
          </section>
          <section class="result-grid">
            <article class="radar-panel">
              <h2>香りバランス</h2>
              <div class="radar-mock large"></div>
              <div class="score-list">
                <span>Floral <strong>82</strong></span>
                <span>Woody <strong>68</strong></span>
                <span>Citrus <strong>46</strong></span>
                <span>Musk <strong>73</strong></span>
              </div>
            </article>
            <article class="recipe-stack">
              <img src="../img/TOP/香水対比.png" alt="">
              <h2>月夜の余韻</h2>
              <p>静かな甘さと深い余韻を中心にした、夜のワークショップ向けの香り。</p>
              ${renderAdminRows([["Top", "ベルガモット", "24%"], ["Middle", "ローズ", "32%"], ["Base", "サンダルウッド", "44%"]])}
              <button class="rose-button full">この内容で来店予約へ</button>
            </article>
          </section>
          ${compare ? `
            <section class="compare-strip">
              <article><span>前回</span><strong>白檀の朝</strong><i>落ち着きが強い</i></article>
              <article><span>今回</span><strong>月夜の余韻</strong><i>華やかさが増加</i></article>
              <article><span>差分</span><strong>+18%</strong><i>Floral / Sweet</i></article>
            </section>
          ` : ""}
        </main>
      </section>
    `;
  }

  function renderCompareModal() {
    return `
      <section class="canvas modal-canvas result-canvas">
        <div class="modal-backdrop"></div>
        <article class="modal-sheet">
          <button class="modal-close">×</button>
          <p class="mini-ornament">COMPARE DETAIL</p>
          <h1>香りの比較詳細</h1>
          <div class="modal-compare-grid">
            <div><h2>前回</h2><div class="radar-mock large"></div><strong>白檀の朝</strong></div>
            <div><h2>今回</h2><div class="radar-mock large"></div><strong>月夜の余韻</strong></div>
          </div>
          ${renderAdminRows([["Floral", "+18", "華やか"], ["Woody", "-6", "軽やか"], ["Musk", "+9", "余韻"]])}
        </article>
      </section>
    `;
  }

  function renderReservation() {
    const slots = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];
    return `
      <section class="canvas reservation-canvas">
        <header class="site-head"><div class="brand-mark">Fragrance Workshop</div><nav><a>結果へ戻る</a><a>会員ページ</a></nav></header>
        <main class="reservation-layout">
          <section>
            <p class="mini-ornament">RESERVATION</p>
            <h1>香りワークショップを予約する</h1>
            <p>アンケート結果を保持したまま、来店日時と人数を選択します。</p>
            <img src="../img/TOP/Workshop体験.png" alt="">
          </section>
          <aside class="reservation-panel">
            <label>来店日<input value="2026-05-12"></label>
            <label>人数<select><option>2名</option><option>1名</option><option>3名</option></select></label>
            <div class="slot-grid">${slots.map((slot, index) => `<button class="${index === 3 ? "selected" : ""}">${slot}</button>`).join("")}</div>
            <div class="reservation-summary"><span>選択中</span><strong>2026.05.12 / 14:30 / 2名</strong></div>
            <button class="rose-button full">予約内容を確認する</button>
          </aside>
        </main>
      </section>
    `;
  }

  function renderReservationComplete() {
    return `
      <section class="canvas complete-canvas">
        <article class="complete-card">
          <p class="mini-ornament">RESERVATION COMPLETE</p>
          <h1>ご予約を受け付けました</h1>
          <p>予約コードを来店時にスタッフへお伝えください。</p>
          <div class="complete-code">FR-0428-1430</div>
          ${renderAdminRows([["日時", "2026.05.12", "14:30"], ["人数", "2名", "上野教室"], ["アンケート", "月夜の余韻", "保存済み"]])}
          <button class="outline-button">会員ページで確認する</button>
        </article>
      </section>
    `;
  }

  function renderShippingInfo() {
    return `
      <section class="canvas shipping-canvas">
        <main class="shipping-card">
          <section class="shipping-summary">
            <p class="mini-ornament">SHIPPING</p>
            <h1>発送先情報</h1>
            <p>作成可能メールの案内後に入力する発送先フォームの試作です。</p>
            <img src="../img/TOP/Final_Call_hope.png" alt="">
          </section>
          <form class="shipping-form">
            <label>お名前<input value="山田 花子"></label>
            <label>郵便番号<input value="110-0005"></label>
            <label>住所<input value="東京都台東区上野..."></label>
            <label>電話番号<input value="03-1234-5678"></label>
            <label class="wide">配送メモ<textarea>午前中希望</textarea></label>
            <button class="rose-button full" type="button">発送先を送信する</button>
          </form>
        </main>
      </section>
    `;
  }

  function renderAdminLogin() {
    return `
      <section class="canvas admin-login-canvas">
        <article class="admin-login-card">
          <p class="mini-ornament">STAFF / ADMIN</p>
          <h1>共通ログイン</h1>
          <div class="role-switch"><button class="selected">スタッフ</button><button>管理者</button></div>
          <label>メールアドレス<input value="staff@example.com"></label>
          <label>パスワード<input type="password" value="password"></label>
          <button class="rose-button full">ログイン</button>
          <p>Supabase Auth の role 判定で、スタッフ画面と管理者画面を分離します。</p>
        </article>
      </section>
    `;
  }

  function renderStaffModal(screen) {
    const content = {
      "staff-balance-modal": `
        <p class="mini-ornament">BALANCE ADJUST</p>
        <h1>香りのバランス調整</h1>
        <div class="slider-list">
          ${[["フローラル", 82], ["ウッディ", 68], ["シトラス", 46], ["ムスク", 73]].map(([label, value]) => `
            <label class="slider-row"><span>${label}</span><input type="range" value="${value}" min="0" max="100"><strong>${value}</strong></label>
          `).join("")}
        </div>
      `,
      "staff-product-modal": `
        <p class="mini-ornament">PRODUCT NAME</p>
        <h1>商品名を登録</h1>
        <label class="modal-field">商品名<input value="月夜の余韻"></label>
        <label class="modal-field">スタッフメモ<textarea>第三者作成依頼に表示する公開商品名です。</textarea></label>
      `,
      "staff-consent-modal": `
        <p class="mini-ornament">CONSENT</p>
        <h1>同意確認</h1>
        <div class="consent-list">
          <label><input type="checkbox" checked> 個人情報の取り扱いに同意済み</label>
          <label><input type="checkbox" checked> 完成品を第三者が作成依頼できることに同意済み</label>
          <label><input type="checkbox"> QR公開前にお客様へ最終確認する</label>
        </div>
      `
    };
    return `
      <section class="canvas modal-canvas admin-canvas staff-theme">
        <div class="modal-backdrop"></div>
        <article class="modal-sheet staff-modal-sheet">
          <button class="modal-close">×</button>
          ${content[screen.slug] || content["staff-balance-modal"]}
          <div class="modal-action-row"><button class="outline-button">キャンセル</button><button class="rose-button">保存する</button></div>
        </article>
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

  function renderAdminRows(rows) {
    return rows.map((row) => `
      <article class="admin-row">
        <span>${row[0]}</span>
        <span>${row[1]}</span>
        <strong>${row[2]}</strong>
      </article>
    `).join("");
  }

  function renderStaffDashboard() {
    const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
    return `
      <section class="canvas admin-canvas staff-theme">
        <header class="admin-head"><strong>Fragrance STAFF</strong><nav><a>予定確認</a><a>予約枠作成</a><a>予約一覧</a></nav></header>
        <main class="staff-grid">
          <section class="admin-hero-card">
            <p>DASHBOARD</p>
            <h1>本日【04/28（火）】の予定確認ページ</h1>
            <div class="metric-pill"><span>本日の予約件数</span><strong>4</strong></div>
          </section>
          <article class="admin-panel-large">
            <div class="panel-head"><h2>本日の予定</h2><div><button>前日</button><button>翌日</button></div></div>
            <div class="timeline">
              ${hours.map((hour, index) => `
                <div class="timeline-row">
                  <time>${hour}</time>
                  ${index === 1 || index === 3 || index === 5 ? `<article class="event-card"><strong>香り診断ワークショップ</strong><span>${hour}-${String(Number(hour.slice(0, 2)) + 1).padStart(2, "0")}:00 / 2名</span></article>` : "<span></span>"}
                </div>
              `).join("")}
            </div>
          </article>
          <aside class="admin-side-stack">
            <article><span>向こう1週間の予約件数 / 枠数</span><strong>11/18</strong></article>
            <article><span>未対応QR商品依頼</span><strong>3</strong><i>月夜の余韻 / 50ml</i><i>朝の白檀 / 30ml</i></article>
            <article class="link-card"><strong>予約枠作成ページへ</strong></article>
            <article class="link-card"><strong>予約情報一覧ページへ</strong></article>
          </aside>
        </main>
      </section>
    `;
  }

  function renderStaffTable() {
    return `
      <section class="canvas admin-canvas staff-theme">
        <header class="admin-head"><strong>予約情報一覧</strong><nav><a>今日</a><a>今週</a><a>すべて</a></nav></header>
        <main class="admin-page-stack">
          <section class="admin-hero-card compact"><p>RESERVATIONS</p><h1>予約確認と接客準備</h1></section>
          <section class="admin-table-card">
            <div class="filter-bar"><input value="2026-04-28"><select><option>すべての状態</option></select><button>検索</button></div>
            ${renderAdminRows([
              ["10:00", "香り診断 / 2名", "詳細"],
              ["11:30", "会員再予約 / 1名", "詳細"],
              ["14:00", "アンケート未保存 / 2名", "確認"],
              ["16:00", "QR依頼対応 / 1件", "対応"]
            ])}
          </section>
        </main>
      </section>
    `;
  }

  function renderStaffSlots() {
    return `
      <section class="canvas admin-canvas staff-theme">
        <header class="admin-head"><strong>予約枠作成</strong><nav><a>単日作成</a><a>一括作成</a></nav></header>
        <main class="admin-two-col">
          <section class="admin-panel-large">
            <div class="panel-head"><h1>予約枠を作成</h1><button>保存</button></div>
            <div class="form-grid">
              <label>日付<input value="2026-04-28"></label>
              <label>開始時刻<input value="10:00"></label>
              <label>担当スタッフ<select><option>スタッフA</option></select></label>
              <label>状態<select><option>公開</option></select></label>
            </div>
            <div class="calendar-strip">${["10:00", "11:30", "13:00", "14:30", "16:00"].map((time) => `<button>${time}</button>`).join("")}</div>
          </section>
          <aside class="admin-panel-large muted-panel"><h2>プレビュー</h2>${renderAdminRows([["4/28", "10:00", "公開"], ["4/28", "11:30", "公開"], ["4/28", "14:30", "準備"]])}</aside>
        </main>
      </section>
    `;
  }

  function renderStaffDetail() {
    return `
      <section class="canvas admin-canvas staff-theme">
        <header class="admin-head"><strong>スタッフ専用詳細</strong><nav><a>予約一覧へ</a><a>保存</a></nav></header>
        <main class="admin-two-col wide-left">
          <section class="admin-panel-large">
            <div class="customer-summary"><h1>お客様詳細</h1><div><span>商品名</span><strong>月夜の余韻</strong></div><div><span>同意</span><strong>取得済み</strong></div></div>
            <div class="axis-compare"><div class="radar-mock"></div><div class="radar-mock"></div></div>
            <h2>最終レシピ</h2>
            ${renderAdminRows([["トップ", "ベルガモット", "24%"], ["ミドル", "ローズ", "32%"], ["ベース", "サンダルウッド", "44%"]])}
          </section>
          <aside class="admin-panel-large"><h2>QR表示</h2><div class="qr-box">QR</div><button class="rose-button full">接客完了として保存</button></aside>
        </main>
      </section>
    `;
  }

  function renderAdminDashboard() {
    return `
      <section class="canvas admin-canvas manager-theme">
        <header class="admin-head"><strong>Fragrance ADMIN</strong><nav><a>設定</a><a>配点</a><a>原料</a></nav></header>
        <main class="admin-page-stack">
          <section class="admin-hero-card compact"><p>DASHBOARD</p><h1>運用状況の確認</h1></section>
          <section class="manager-grid">
            <article><h2>本日の出勤者 予約数</h2>${renderAdminRows([["スタッフA", "出勤", "3"], ["スタッフB", "出勤", "1"], ["スタッフC", "休日", "/"]])}</article>
            <article><h2>翌週の予約数/枠数</h2>${renderAdminRows([["スタッフA", "5/8", "OK"], ["スタッフB", "3/6", "OK"], ["スタッフC", "0/0", "NG"]])}</article>
            <article><h2>QR関連通知</h2>${renderAdminRows([["月夜の余韻", "50ml", "4/30"], ["朝の白檀", "30ml", "5/1"]])}</article>
            <article><h2>配点ロジック重み</h2>${renderAdminRows([["共通質問", "1〜5", "12"], ["分岐質問", "6〜7", "8"], ["仕上げ補正", "finish", "0.35"]])}</article>
          </section>
        </main>
      </section>
    `;
  }

  function renderAdminConfig(screen) {
    const titleMap = {
      "admin-settings": "基本設定・店舗情報",
      "admin-scoring": "配点ロジック調整",
      "admin-materials": "原料ポイント編集",
      "admin-qr-settings": "QR商品設定"
    };
    const title = titleMap[screen.slug] || screen.title;
    return `
      <section class="canvas admin-canvas manager-theme">
        <header class="admin-head"><strong>${title}</strong><nav><a>保存</a><a>プレビュー</a></nav></header>
        <main class="admin-two-col">
          <section class="admin-panel-large">
            <div class="panel-head"><h1>${title}</h1><button>保存</button></div>
            <div class="form-grid">
              <label>表示名<input value="${title}"></label>
              <label>公開状態<select><option>公開</option></select></label>
              <label>数値設定<input value="100"></label>
              <label>メモ<textarea>参照画像に合わせた管理項目です。</textarea></label>
            </div>
            ${renderAdminRows([["10ml価格", "税込", "1,000円"], ["30ml価格", "税込", "2,860円"], ["最大容量", "QR依頼", "100ml"]])}
          </section>
          <aside class="admin-panel-large muted-panel"><h2>現在の公開値</h2><div class="setting-preview">QR商品ページ<br><strong>月夜の余韻</strong><span>最大100mlまで作成依頼できます</span></div></aside>
        </main>
      </section>
    `;
  }

  function renderAdminQrModal() {
    return `
      <section class="canvas modal-canvas admin-canvas manager-theme">
        <div class="modal-backdrop"></div>
        <article class="modal-sheet qr-notice-sheet">
          <button class="modal-close">×</button>
          <p class="mini-ornament">QR REQUEST NOTICE</p>
          <h1>QR関連通知詳細</h1>
          <div class="qr-detail-list">
            ${renderAdminRows([["商品名", "月夜の余韻", "公開中"], ["依頼量", "10ml x2 / 30ml x1", "50ml"], ["期限", "2026.05.01", "未対応"], ["通知", "スタッフ未判定", "要確認"]])}
          </div>
          <div class="modal-action-row"><button class="outline-button">スタッフへ確認</button><button class="rose-button">対応済みにする</button></div>
        </article>
      </section>
    `;
  }

  function renderScreenContent(screen) {
    if (screen.kind === "overview") return renderOverview(screen);
    if (screen.kind === "customer-top") return renderCustomerTop();
    if (screen.kind === "customer-login") return renderCustomerLogin();
    if (screen.kind === "customer-dashboard") return renderCustomerDashboard();
    if (screen.kind === "questionnaire") return renderQuestionnaire();
    if (screen.kind === "result") return renderResult(screen);
    if (screen.kind === "modal") return renderCompareModal();
    if (screen.kind === "reservation") return renderReservation();
    if (screen.kind === "complete") return renderReservationComplete();
    if (screen.kind === "product-request") return renderProductRequest();
    if (screen.kind === "shipping") return renderShippingInfo();
    if (screen.kind === "admin-login") return renderAdminLogin();
    if (screen.kind === "staff-dashboard") return renderStaffDashboard();
    if (screen.kind === "staff-table") return renderStaffTable();
    if (screen.kind === "staff-slots") return renderStaffSlots();
    if (screen.kind === "staff-detail") return renderStaffDetail();
    if (screen.kind === "staff-modal") return renderStaffModal(screen);
    if (screen.kind === "admin-dashboard") return renderAdminDashboard();
    if (screen.kind === "admin-modal") return renderAdminQrModal();
    if (screen.kind && screen.kind.startsWith("admin")) return renderAdminConfig(screen);
    return renderPlaceholder(screen);
  }

  function renderScreen(screen) {
    return `
      <main class="prototype-main">
        <div class="screen-frame">
          <div class="screen-toolbar">
            <strong>${screen.title}</strong>
            <span>${screen.group} visual prototype</span>
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
