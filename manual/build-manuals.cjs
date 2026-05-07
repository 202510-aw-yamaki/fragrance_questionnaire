const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const Module = require("node:module");

const runtimeNodeModules = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "node",
  "node_modules",
);

if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = runtimeNodeModules;
  Module._initPaths();
}

const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

const manualDir = __dirname;
const imageDir = path.join(manualDir, "assets", "generated-images");
const previewDir = path.join(manualDir, "previews");

const deckSize = { w: 13.333, h: 7.5 };
const previewSize = { w: 1600, h: 900 };

const colors = {
  ink: "3A302A",
  muted: "7C6A5D",
  cream: "FFF9F1",
  paper: "FFFFFF",
  line: "EBD8BE",
  gold: "C48B30",
  coral: "E66F7B",
  blush: "F8D9DA",
  pale: "FFF2E1",
  green: "7E9B78",
};

const roleImages = {
  customer: path.join(imageDir, "customer-ui-illustration.png"),
  staff: path.join(imageDir, "staff-ui-illustration.png"),
  admin: path.join(imageDir, "admin-ui-illustration.png"),
};

const decks = [
  {
    key: "customer",
    file: "customer-operation-manual.pptx",
    title: "顧客操作マニュアル",
    role: "お客様向け",
    image: roleImages.customer,
    accent: colors.coral,
    slides: [
      op("トップページを開く", "最初の入口を確認し、目的に合うボタンを選びます。", [
        "トップページを開き、画面上部と大きなボタンを確認します。",
        "香りの提案まで進める場合は「アンケート」を選びます。",
        "日時だけ先に決めたい場合は「日時だけ予約」を選びます。",
      ], "迷った場合はアンケートから進めると、5軸結果と予約がつながります。", "次の画面へ進めれば完了です。"),
      op("アンケートに回答する", "香り・色・気分・使いたい場面を、直感で選びます。", [
        "質問は順番に表示されます。該当する選択肢を押します。",
        "すべて答えると、香りの傾向が5軸で計算されます。",
        "途中で迷ったら、今の気分に一番近いものを選びます。",
      ], "正解を探す画面ではありません。お客様の好みを知るための入口です。", "結果画面が表示されれば完了です。"),
      op("5軸結果を確認する", "アンケート結果から、香りの方向性をグラフで見ます。", [
        "5軸グラフで、自分の香り傾向を確認します。",
        "調整できる画面では、実感に近い形へ微調整します。",
        "調整後の5軸が、スタッフの原料提案の起点になります。",
      ], "アンケート結果5軸と調整後5軸の両方が、当日の会話に使われます。", "調整後のグラフが確認できれば完了です。"),
      op("来店予約を入れる", "希望日時と必要情報を入力し、ワークショップを予約します。", [
        "予約ページで空いている日時を選びます。",
        "名前・連絡先など、画面に表示された項目を入力します。",
        "内容を確認して予約ボタンを押します。",
      ], "アンケート経由の場合は、結果と予約がつながる流れを意識してください。", "予約完了画面が出れば完了です。"),
      op("会員ログインする", "過去の香りや予約を確認するため、会員ページに入ります。", [
        "会員ログイン画面を開きます。",
        "登録済みのメールアドレスなど、必要な情報を入力します。",
        "ログイン後、マイページが表示されます。",
      ], "共有端末では、確認後にログアウトしてください。", "マイページが表示されれば完了です。"),
      op("マイページを見る", "前回作成した香水、次回予約、制作履歴を確認します。", [
        "前回作成した香水カードを確認します。",
        "アンケート比較や作成依頼へ進むボタンを確認します。",
        "右側の制作履歴から、過去の商品詳細を開けます。",
      ], "作成依頼とワークショップ予約は目的が違います。ボタン名を確認して進みます。", "必要なカードが確認できれば完了です。"),
      op("制作履歴を検索する", "過去に作った香水を一覧で探します。", [
        "制作履歴の「すべて見る」を押します。",
        "商品名・スタッフ名・タグなどで検索します。",
        "新しい順、古い順、名前順で並び替えます。",
      ], "一覧ページはマイページから続く確認用ページです。迷ったら「マイページへ戻る」を押します。", "目的の商品カードが見つかれば完了です。"),
      op("作成依頼をする", "完成済みの香りを、商品として作成依頼します。", [
        "対象の香水カードで「作成依頼」を押します。",
        "10mlまたは30mlの本数とメールアドレスを入力します。",
        "内容を確認し「作成依頼をする」を押します。",
      ], "作成依頼は購入確定ではありません。スタッフが原料確認後に連絡します。", "受付メッセージが出れば完了です。"),
    ],
  },
  {
    key: "staff",
    file: "staff-operation-manual.pptx",
    title: "スタッフ操作マニュアル",
    role: "スタッフ向け",
    image: roleImages.staff,
    accent: colors.green,
    slides: [
      op("ログインする", "スタッフ用画面に入り、当日の予約を確認できる状態にします。", [
        "スタッフ・管理者ログイン画面を開きます。",
        "スタッフ用のログイン情報を入力します。",
        "スタッフダッシュボードが表示されることを確認します。",
      ], "管理者アカウントとスタッフアカウントを混同しないでください。", "本日のワークショップが表示されれば完了です。"),
      op("ダッシュボードを確認する", "当日の予定と対応が必要な項目を先に確認します。", [
        "本日の予約、未対応通知、QR依頼の有無を見ます。",
        "担当予約が表示されているか確認します。",
        "必要に応じて予約一覧や顧客詳細へ移動します。",
      ], "表示されない予約がある場合は、担当スタッフの紐づけを管理者に確認します。", "今日見るべき項目を把握できれば完了です。"),
      op("予約枠を作成する", "受付可能な日時と人数を登録します。", [
        "予約枠作成ページを開きます。",
        "日付、時間、定員、担当者を入力します。",
        "保存後、公開予約に表示される前提で内容を確認します。",
      ], "過去日時や定員の入力間違いは、予約トラブルにつながります。", "予約枠が一覧に追加されれば完了です。"),
      op("予約一覧を見る", "担当する予約を確認し、来店前準備に使います。", [
        "予約一覧ページを開きます。",
        "日付、時間、お客様名、状態を確認します。",
        "必要な予約を選んで顧客詳細へ進みます。",
      ], "予約状態の変更は、実際の来店状況と合わせて行います。", "対象予約の詳細へ進めれば完了です。"),
      op("顧客詳細を確認する", "お客様の回答、予約情報、商品名を確認します。", [
        "顧客詳細ページで基本情報を確認します。",
        "アンケート回答と香り5軸を確認します。",
        "当日使うメモや商品名を必要に応じて保存します。",
      ], "個人情報を扱うため、画面を開いたまま離席しないでください。", "当日の準備情報が確認できれば完了です。"),
      op("5軸から原料を提案する", "アンケート結果5軸と調整後5軸を見て、提案の迷いを減らします。", [
        "アンケート結果の5軸グラフを確認します。",
        "お客様調整後の5軸グラフを確認します。",
        "差分を見ながら、原料候補と説明の方向性を決めます。",
      ], "重要な流れは「結果5軸 → 調整後5軸 → 原料提案」です。", "提案候補を説明できる状態になれば完了です。"),
      op("配合を調整する", "お客様と会話しながら、香りの方向性を最終調整します。", [
        "候補原料をもとに試香します。",
        "お客様の反応を見ながら軸やメモを調整します。",
        "最終的に作る香りの内容を確認します。",
      ], "調整内容は、後から確認できるようにメモへ残します。", "最終案が決まれば完了です。"),
      op("完成品を登録する", "完成した香水を、制作履歴として残します。", [
        "商品名、説明、スタッフ名などを入力します。",
        "必要に応じてタグやQR公開用の情報を確認します。",
        "登録後、会員ページや履歴で見える内容を確認します。",
      ], "登録内容はお客様が後で見る可能性があります。表記を丁寧に確認します。", "制作履歴に反映されれば完了です。"),
      op("QR依頼に対応する", "作成依頼が届いたら、原料確認と返信判断を行います。", [
        "QR依頼一覧を開きます。",
        "依頼数量、メールアドレス、対象商品を確認します。",
        "作成可能または作成不可の判断に必要な情報を確認します。",
      ], "QR依頼は購入ではなく作成依頼です。原料確認後に連絡する流れです。", "対応方針を決められれば完了です。"),
    ],
  },
  {
    key: "admin",
    file: "admin-operation-manual.pptx",
    title: "管理者操作マニュアル",
    role: "管理者向け",
    image: roleImages.admin,
    accent: colors.gold,
    slides: [
      op("ログインする", "管理者用の権限で設定画面に入ります。", [
        "スタッフ・管理者ログイン画面を開きます。",
        "管理者用のログイン情報を入力します。",
        "管理者ダッシュボードが表示されることを確認します。",
      ], "スタッフ用アカウントでは管理設定を変更できません。", "管理者ダッシュボードが表示されれば完了です。"),
      op("ダッシュボードを見る", "全体状況と対応が必要な項目を確認します。", [
        "予約、スタッフ運用、QR依頼の状況を確認します。",
        "通知や期限超過の有無を見ます。",
        "必要な設定ページへ移動します。",
      ], "数字が想定と違う場合は、まず対象期間と担当者条件を確認します。", "対応優先度を決められれば完了です。"),
      op("基本設定を変更する", "店舗運用に関わる表示や受付条件を調整します。", [
        "基本設定ページを開きます。",
        "営業時間、受付条件、表示文言などを確認します。",
        "変更後は保存し、実画面で反映を確認します。",
      ], "運用ルールに関わる設定は、変更前後の内容を記録しておきます。", "設定が保存されれば完了です。"),
      op("配点ロジックを調整する", "アンケート回答から5軸へ変換する重みを管理します。", [
        "配点ロジックページを開きます。",
        "質問ごとの5軸加点を確認します。",
        "変更後、想定した5軸結果になるか確認します。",
      ], "5軸は原料提案に直結します。大きな変更は事前に方針確認が必要です。", "保存後にテスト回答で確認できれば完了です。"),
      op("原料ポイントを管理する", "5軸結果から原料提案しやすいよう、原料の特徴を整えます。", [
        "原料ポイントページを開きます。",
        "各原料がどの軸に寄るか確認します。",
        "スタッフが迷わない説明になるよう調整します。",
      ], "原料テンプレートは、現場の提案品質に直接影響します。", "スタッフが説明できる内容になれば完了です。"),
      op("QR商品設定を確認する", "作成依頼の価格や受付条件を管理します。", [
        "QR商品設定ページを開きます。",
        "10ml、30mlなどの価格と条件を確認します。",
        "変更後はQR商品ページで見え方を確認します。",
      ], "QR導線は会員導線とは別です。第三者向け表示を混ぜないでください。", "価格と受付条件が確認できれば完了です。"),
      op("QR依頼を確認する", "作成依頼の対応状況を管理し、期限超過を防ぎます。", [
        "QR依頼一覧ページを開きます。",
        "未対応、作成可能、作成不可などの状態を確認します。",
        "必要に応じてスタッフへ確認を依頼します。",
      ], "3営業日以内の判断が必要な依頼を優先して確認します。", "未対応依頼の状況が把握できれば完了です。"),
    ],
  },
];

function op(title, lead, steps, caution, done) {
  return { title, lead, steps, caution, done };
}

function ensureDirs() {
  fs.mkdirSync(imageDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });
  for (const deck of decks) {
    fs.mkdirSync(path.join(previewDir, deck.key), { recursive: true });
  }
}

function addText(slide, text, opts) {
  slide.addText(text, {
    fontFace: "Yu Gothic",
    color: colors.ink,
    breakLine: false,
    fit: "shrink",
    margin: 0.08,
    ...opts,
  });
}

function addPill(pptx, slide, text, x, y, w, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.38,
    fill: { color, transparency: 12 },
    line: { color, transparency: 100 },
    radius: 0.16,
  });
  addText(slide, text, {
    x: x + 0.14,
    y: y + 0.08,
    w: w - 0.28,
    h: 0.18,
    fontSize: 9.5,
    bold: true,
    color: colors.paper,
    align: "center",
  });
}

function addHeader(pptx, slide, deck, index, total) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: deckSize.w,
    h: 0.58,
    fill: { color: colors.paper, transparency: 0 },
    line: { color: colors.line, transparency: 10 },
  });
  addText(slide, "Fragrance Workshop", {
    x: 0.62,
    y: 0.18,
    w: 3.2,
    h: 0.22,
    fontSize: 11,
    bold: true,
    color: colors.ink,
  });
  addText(slide, deck.role, {
    x: 10.55,
    y: 0.17,
    w: 1.4,
    h: 0.24,
    fontSize: 8.8,
    bold: true,
    color: deck.accent,
    align: "right",
  });
  addText(slide, `${index}/${total}`, {
    x: 12.25,
    y: 0.17,
    w: 0.48,
    h: 0.24,
    fontSize: 8.2,
    color: colors.muted,
    align: "right",
  });
}

function addCover(pptx, deck) {
  const slide = pptx.addSlide();
  slide.background = { color: colors.cream };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: deckSize.w,
    h: deckSize.h,
    fill: { color: colors.cream },
    line: { color: colors.cream },
  });
  slide.addImage({ path: deck.image, x: 5.55, y: 0.72, w: 7.2, h: 4.05 });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 4.92,
    w: deckSize.w,
    h: 2.58,
    fill: { color: colors.paper, transparency: 0 },
    line: { color: colors.line, transparency: 100 },
  });
  addText(slide, "Fragrance Workshop", {
    x: 0.68,
    y: 0.62,
    w: 3.7,
    h: 0.34,
    fontSize: 15,
    bold: true,
  });
  addPill(pptx, slide, deck.role, 0.72, 1.18, 1.58, deck.accent);
  addText(slide, deck.title, {
    x: 0.72,
    y: 1.82,
    w: 4.55,
    h: 1.0,
    fontSize: 30,
    bold: true,
    color: colors.ink,
  });
  addText(slide, "1スライド1操作で、どこを押す・何を入力する・完了後に何が見えるかを確認できます。", {
    x: 0.75,
    y: 3.05,
    w: 4.8,
    h: 0.74,
    fontSize: 13,
    color: colors.muted,
    valign: "mid",
  });
  addText(slide, "確認順", {
    x: 0.82,
    y: 5.42,
    w: 0.85,
    h: 0.22,
    fontSize: 9.5,
    bold: true,
    color: deck.accent,
  });
  const names = deck.slides.map((s, i) => `${i + 1}. ${s.title}`);
  const columns = [names.slice(0, 4), names.slice(4, 8), names.slice(8)];
  columns.forEach((items, col) => {
    addText(slide, items.join("\n"), {
      x: 0.82 + col * 4.1,
      y: 5.82,
      w: 3.68,
      h: 1.0,
      fontSize: 10.2,
      color: colors.ink,
      breakLine: false,
      valign: "top",
      fit: "shrink",
    });
  });
}

function addOperationSlide(pptx, deck, item, index, total) {
  const slide = pptx.addSlide();
  slide.background = { color: colors.cream };
  addHeader(pptx, slide, deck, index + 1, total);

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 0.86,
    w: 12.25,
    h: 6.05,
    fill: { color: colors.paper },
    line: { color: colors.line, transparency: 5 },
    radius: 0.2,
  });
  addPill(pptx, slide, `操作 ${index}`, 0.92, 1.18, 1.0, deck.accent);
  addText(slide, item.title, {
    x: 0.92,
    y: 1.68,
    w: 5.65,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: colors.ink,
  });
  addText(slide, item.lead, {
    x: 0.94,
    y: 2.25,
    w: 5.5,
    h: 0.43,
    fontSize: 11.5,
    color: colors.muted,
  });

  const stepY = 2.95;
  item.steps.forEach((step, i) => {
    const y = stepY + i * 0.82;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.92,
      y,
      w: 5.75,
      h: 0.62,
      fill: { color: i === 0 ? colors.pale : "FFFFFF" },
      line: { color: colors.line, transparency: 5 },
      radius: 0.13,
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 1.08,
      y: y + 0.14,
      w: 0.34,
      h: 0.34,
      fill: { color: deck.accent },
      line: { color: deck.accent },
    });
    addText(slide, `${i + 1}`, {
      x: 1.17,
      y: y + 0.205,
      w: 0.16,
      h: 0.1,
      fontSize: 7.5,
      bold: true,
      color: colors.paper,
      align: "center",
    });
    addText(slide, step, {
      x: 1.55,
      y: y + 0.13,
      w: 4.8,
      h: 0.34,
      fontSize: 10,
      color: colors.ink,
      valign: "mid",
    });
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.92,
    y: 5.56,
    w: 5.75,
    h: 0.78,
    fill: { color: "FFF5F5" },
    line: { color: "F1C8C8", transparency: 8 },
    radius: 0.13,
  });
  addText(slide, "注意", {
    x: 1.08,
    y: 5.72,
    w: 0.55,
    h: 0.2,
    fontSize: 8.5,
    bold: true,
    color: deck.accent,
  });
  addText(slide, item.caution, {
    x: 1.62,
    y: 5.68,
    w: 4.65,
    h: 0.36,
    fontSize: 8.5,
    color: colors.muted,
  });

  slide.addShape(pptx.ShapeType.rightArrow, {
    x: 6.78,
    y: 3.35,
    w: 0.44,
    h: 0.34,
    fill: { color: deck.accent, transparency: 8 },
    line: { color: deck.accent, transparency: 100 },
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.38,
    y: 1.15,
    w: 4.92,
    h: 3.02,
    fill: { color: "FFFFFF" },
    line: { color: colors.line, transparency: 0 },
    radius: 0.17,
  });
  slide.addImage({ path: deck.image, x: 7.54, y: 1.31, w: 4.6, h: 2.59 });
  addText(slide, "画面イメージ", {
    x: 7.62,
    y: 4.29,
    w: 1.2,
    h: 0.18,
    fontSize: 8,
    bold: true,
    color: deck.accent,
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.38,
    y: 4.72,
    w: 4.92,
    h: 1.15,
    fill: { color: "FFFDF9" },
    line: { color: colors.line, transparency: 12 },
    radius: 0.15,
  });
  addText(slide, "完了の目安", {
    x: 7.72,
    y: 4.98,
    w: 1.2,
    h: 0.22,
    fontSize: 9,
    bold: true,
    color: deck.accent,
  });
  addText(slide, item.done, {
    x: 7.72,
    y: 5.28,
    w: 4.0,
    h: 0.34,
    fontSize: 10,
    color: colors.ink,
  });
}

async function buildDeck(deck) {
  if (!fs.existsSync(deck.image)) {
    throw new Error(`Missing generated image: ${deck.image}`);
  }
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Fragrance Workshop";
  pptx.company = "Fragrance Workshop";
  pptx.subject = deck.title;
  pptx.title = deck.title;
  pptx.lang = "ja-JP";
  pptx.theme = {
    headFontFace: "Yu Gothic",
    bodyFontFace: "Yu Gothic",
    lang: "ja-JP",
  };
  addCover(pptx, deck);
  deck.slides.forEach((item, index) => addOperationSlide(pptx, deck, item, index + 1, deck.slides.length + 1));
  await pptx.writeFile({ fileName: path.join(manualDir, deck.file) });
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text, maxChars) {
  const normalized = String(text).replace(/\s+/g, " ");
  const lines = [];
  let line = "";
  for (const char of normalized) {
    if (line.length >= maxChars && /[、。・\s]/.test(char)) {
      line += char;
      lines.push(line.trim());
      line = "";
      continue;
    }
    if (line.length >= maxChars + 4) {
      lines.push(line.trim());
      line = "";
    }
    line += char;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function svgText(text, x, y, options = {}) {
  const size = options.size || 26;
  const fill = options.fill || `#${colors.ink}`;
  const weight = options.weight || 500;
  const maxChars = options.maxChars || 28;
  const lineHeight = options.lineHeight || Math.round(size * 1.42);
  const lines = String(text).includes("\n")
    ? String(text).split("\n")
    : wrapLines(text, maxChars);
  const tspans = lines
    .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" font-family="'Yu Gothic','Meiryo',sans-serif">${tspans}</text>`;
}

function imageDataUri(filePath) {
  const mime = "image/png";
  const data = fs.readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${data}`;
}

function previewSvg(deck, slide, slideIndex, total) {
  const accent = `#${deck.accent}`;
  const imageUri = imageDataUri(deck.image);
  if (slide.kind === "cover") {
    const names = deck.slides.map((s, i) => `${i + 1}. ${s.title}`);
    const col1 = svgText(names.slice(0, 4).join("\n"), 98, 716, { size: 21, maxChars: 20, lineHeight: 33 });
    const col2 = svgText(names.slice(4, 8).join("\n"), 530, 716, { size: 21, maxChars: 20, lineHeight: 33 });
    const col3 = svgText(names.slice(8).join("\n"), 970, 716, { size: 21, maxChars: 20, lineHeight: 33 });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${previewSize.w}" height="${previewSize.h}" viewBox="0 0 ${previewSize.w} ${previewSize.h}">
<rect width="1600" height="900" fill="#${colors.cream}"/>
<image href="${imageUri}" x="650" y="86" width="820" height="461" preserveAspectRatio="xMidYMid slice"/>
<rect x="0" y="590" width="1600" height="310" fill="#${colors.paper}"/>
<rect x="82" y="142" width="190" height="44" rx="22" fill="${accent}"/>
${svgText(deck.role, 118, 170, { size: 18, fill: "#ffffff", weight: 700, maxChars: 12 })}
${svgText("Fragrance Workshop", 82, 95, { size: 30, weight: 700, maxChars: 24 })}
${svgText(deck.title, 82, 300, { size: 58, weight: 800, maxChars: 12, lineHeight: 66 })}
${svgText("押す場所・入力内容・完了後の見え方を、1操作ずつ確認できます。", 88, 424, { size: 24, fill: "#${colors.muted}", maxChars: 16, lineHeight: 34 })}
${svgText("確認順", 98, 664, { size: 20, fill: accent, weight: 800 })}
${col1}
${col2}
${col3}
</svg>`;
  }
  const steps = slide.steps
    .map((step, i) => {
      const y = 356 + i * 98;
      return `<rect x="112" y="${y}" width="690" height="72" rx="16" fill="${i === 0 ? "#FFF2E1" : "#FFFFFF"}" stroke="#${colors.line}" stroke-width="2"/>
<circle cx="154" cy="${y + 36}" r="20" fill="${accent}"/>
${svgText(String(i + 1), 148, y + 44, { size: 18, fill: "#ffffff", weight: 800 })}
${svgText(step, 188, y + 43, { size: 21, maxChars: 31 })}`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${previewSize.w}" height="${previewSize.h}" viewBox="0 0 ${previewSize.w} ${previewSize.h}">
<rect width="1600" height="900" fill="#${colors.cream}"/>
<rect x="0" y="0" width="1600" height="70" fill="#${colors.paper}" stroke="#${colors.line}"/>
${svgText("Fragrance Workshop", 76, 45, { size: 23, weight: 800 })}
${svgText(`${deck.role}  ${slideIndex}/${total}`, 1250, 44, { size: 17, fill: accent, weight: 800 })}
<rect x="66" y="104" width="1468" height="726" rx="28" fill="#FFFFFF" stroke="#${colors.line}" stroke-width="2"/>
<rect x="110" y="142" width="126" height="44" rx="22" fill="${accent}"/>
${svgText(`操作 ${slideIndex - 1}`, 135, 171, { size: 18, fill: "#ffffff", weight: 800 })}
${svgText(slide.title, 112, 253, { size: 44, weight: 800, maxChars: 16 })}
${svgText(slide.lead, 114, 319, { size: 22, fill: "#${colors.muted}", maxChars: 32 })}
${steps}
<rect x="112" y="668" width="690" height="92" rx="16" fill="#FFF5F5" stroke="#F1C8C8" stroke-width="2"/>
${svgText("注意", 132, 705, { size: 18, fill: accent, weight: 800 })}
${svgText(slide.caution, 194, 706, { size: 18, fill: "#${colors.muted}", maxChars: 33 })}
<polygon points="922,422 872,390 872,409 818,409 818,435 872,435 872,454" fill="${accent}" opacity="0.85"/>
<rect x="900" y="138" width="590" height="362" rx="22" fill="#FFFFFF" stroke="#${colors.line}" stroke-width="2"/>
<image href="${imageUri}" x="922" y="160" width="546" height="307" preserveAspectRatio="xMidYMid slice"/>
${svgText("画面イメージ", 926, 535, { size: 17, fill: accent, weight: 800 })}
<rect x="900" y="578" width="590" height="138" rx="18" fill="#FFFDF9" stroke="#${colors.line}" stroke-width="2"/>
${svgText("完了の目安", 936, 626, { size: 19, fill: accent, weight: 800 })}
${svgText(slide.done, 936, 670, { size: 21, maxChars: 28 })}
</svg>`;
}

async function buildPreviews(deck) {
  const slides = [{ kind: "cover" }, ...deck.slides];
  const outDir = path.join(previewDir, deck.key);
  for (let i = 0; i < slides.length; i += 1) {
    const fileName = `slide-${String(i + 1).padStart(2, "0")}.png`;
    const svg = previewSvg(deck, slides[i], i + 1, slides.length);
    await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, fileName));
  }
}

async function main() {
  ensureDirs();
  for (const deck of decks) {
    await buildDeck(deck);
    await buildPreviews(deck);
  }
  console.log("Manual decks generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
