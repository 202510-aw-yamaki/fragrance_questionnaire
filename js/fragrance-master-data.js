(function () {
  const AXIS_ORDER = ["floral", "fresh", "woody", "spicy", "sweet"];
  const AXIS_LABELS = {
    floral: "フローラル",
    fresh: "フレッシュ",
    woody: "ウッディ",
    spicy: "スパイシー",
    sweet: "スウィート"
  };
  const SCORING_LOGIC_SOURCE = "deep-research-report-ver.1.1.md";
  const SCORING_LOGIC_VERSION = "2026-04-29";
  const RECOMMENDATION_ALGORITHM_VERSION = "recipe-l1-profile-v1";
  const RECOMMENDATION_RECIPE_MATERIAL_COUNT = 3;
  const RECOMMENDATION_RECIPE_STEP = 5;
  const RECOMMENDATION_RECIPE_MIN_RATIO = 5;

  const STEP1_QUESTION_SCHEMA = [
    {
      id: "Q1",
      title: "Q1 惹かれる香り",
      answers: {
        A: "花がふわっと香る",
        B: "みずみずしく爽やか",
        C: "木や森の落ち着き",
        ALL: "全部好き",
        NONE: "この中にはない"
      }
    },
    {
      id: "Q2",
      title: "Q2 好きな色",
      answers: {
        A: "やさしいピンク・ベージュ",
        B: "白・水色・透明感",
        C: "ブラウン・深いグリーン",
        ALL: "全部好き",
        NONE: "この中にはない"
      }
    },
    {
      id: "Q3",
      title: "Q3 なりたい気分",
      answers: {
        A: "やさしく癒やされたい",
        B: "すっきり切り替えたい",
        C: "自分らしさを出したい",
        ALL: "全部好き",
        NONE: "この中にはない"
      }
    },
    {
      id: "Q4",
      title: "Q4 使いたい時",
      answers: {
        A: "休日に気分を上げたい",
        B: "仕事や外出で心地よく整えたい",
        C: "夜や特別な時間を深く楽しみたい",
        ALL: "全部好き",
        NONE: "この中にはない"
      }
    },
    {
      id: "Q5",
      title: "Q5 好きな音楽",
      answers: {
        A: "明るいポップ",
        B: "心にしみるストリングス",
        C: "自然に耳に残るクラシック",
        ALL: "全部好き",
        NONE: "この中にはない"
      }
    }
  ];

  const STEP2_QUESTION_SCHEMA = {
    floral: [
      {
        id: "Q6",
        title: "Q6-A 身につけた時の印象",
        answers: {
          A: "やわらかく華やか",
          B: "親しみやすく甘い",
          C: "上品で落ち着いた印象",
          ALL: "全部好き",
          NONE: "この中にはない"
        }
      },
      {
        id: "Q7",
        title: "Q7-A 甘さの出方",
        answers: {
          A: "最初にふわっと感じたい",
          B: "時間とともにやさしく出てほしい",
          C: "甘さは控えめがいい",
          ALL: "全部好き",
          NONE: "この中にはない"
        }
      }
    ],
    fresh: [
      {
        id: "Q6",
        title: "Q6-B 抜け感の方向",
        answers: {
          A: "みずみずしく軽い",
          B: "清潔感がある",
          C: "少しだけシャープ",
          ALL: "全部好き",
          NONE: "この中にはない"
        }
      },
      {
        id: "Q7",
        title: "Q7-B 香りの印象",
        answers: {
          A: "朝の空気みたいにすっきり",
          B: "雨上がりのようにやわらかい",
          C: "静かに長く心地よい",
          ALL: "全部好き",
          NONE: "この中にはない"
        }
      }
    ],
    woody: [
      {
        id: "Q6",
        title: "Q6-C 深みの方向",
        answers: {
          A: "木のぬくもり",
          B: "静かな落ち着き",
          C: "個性のある刺激",
          ALL: "全部好き",
          NONE: "この中にはない"
        }
      },
      {
        id: "Q7",
        title: "Q7-C 余韻の残り方",
        answers: {
          A: "すっと消えて軽やか",
          B: "じんわり変化してほしい",
          C: "最後に深く残ってほしい",
          ALL: "全部好き",
          NONE: "この中にはない"
        }
      }
    ]
  };

  const Q8_SCHEMA = {
    id: "Q8",
    title: "Q8 今日の仕上がり",
    answers: {
      A: "軽やかにまとめたい",
      B: "やわらかく心地よくしたい",
      C: "少し印象を残したい",
      ALL: "全部好き",
      NONE: "この中にはない"
    }
  };

  const QUESTION_TEXT_OVERRIDES_V11 = {
    step1: {
      Q1: {
        title: "最初の香り立ちとして、いちばん心地よいのはどれですか？",
        answers: {
          A: "せっけんや水のようにみずみずしい",
          B: "白い花がふわっとやわらかい",
          C: "木や葉のように静かで落ち着く",
          D: "紅茶やスパイスのように温かく印象に残る",
          ALL: "全部好き",
          NONE: "この中にない"
        }
      },
      Q2: {
        title: "どんな場面で使いやすいと感じますか？",
        answers: {
          A: "朝の外出や仕事前に、清潔に整う",
          B: "人と近い距離で、やさしく上品に見せたい",
          C: "一人時間や読書のときに、静かに落ち着きたい",
          D: "夜や特別な時間に、少し色気や深みがほしい",
          ALL: "全部好き",
          NONE: "この中にない"
        }
      },
      Q3: {
        title: "香りの甘さや温度感は、どれがちょうどいいですか？",
        answers: {
          A: "甘さは少なく、さらっと涼しい",
          B: "花の蜜のように、やさしくほのか",
          C: "木や樹脂のように、まろやかで落ち着く",
          D: "バニラやスパイスのように、温かくしっかり",
          ALL: "全部好き",
          NONE: "この中にない"
        }
      },
      Q4: {
        title: "香りの残り方は、どれが心地よいですか？",
        answers: {
          A: "つけたてにすっと広がって、軽く引く",
          B: "近づいたときにふんわり感じる",
          C: "静かに落ち着いて、長めに続く",
          D: "後半にぬくもりや深みが出てくる",
          ALL: "全部好き",
          NONE: "この中にない"
        }
      },
      Q5: {
        title: "会った人に、香りでどんな印象が伝わるとしっくりきますか？",
        answers: {
          A: "清潔で軽やか、話しかけやすい",
          B: "やわらかく上品で、親しみやすい",
          C: "落ち着いて知的で、安心感がある",
          D: "印象に残る、あたたかい余韻がある",
          ALL: "全部好き",
          NONE: "この中にない"
        }
      }
    },
    step2: {
      floral: {
        Q6: {
          title: "身につけたとき、どんな印象に近づけたいですか？",
          answers: {
            A: "やわらかく華やか",
            B: "親しみやすく甘い",
            C: "上品で落ち着いた印象",
            ALL: "全部好き",
            NONE: "この中にない"
          }
        },
        Q7: {
          title: "甘さは、どんな出方が好みですか？",
          answers: {
            A: "最初にふわっと感じたい",
            B: "時間とともにやさしく出てほしい",
            C: "甘さは控えめがいい",
            ALL: "全部好き",
            NONE: "この中にない"
          }
        }
      },
      fresh: {
        Q6: {
          title: "爽やかさの中でも、どんな抜け感が好きですか？",
          answers: {
            A: "みずみずしく軽い",
            B: "清潔感がある",
            C: "少しだけシャープ",
            ALL: "全部好き",
            NONE: "この中にない"
          }
        },
        Q7: {
          title: "その爽やかさは、どんな印象で残ってほしいですか？",
          answers: {
            A: "朝の空気みたいにすっきり",
            B: "雨上がりのようにやわらかい",
            C: "静かに長く心地よい",
            ALL: "全部好き",
            NONE: "この中にない"
          }
        }
      },
      woody: {
        Q6: {
          title: "落ち着きや深みは、どんな雰囲気が好きですか？",
          answers: {
            A: "木のぬくもり",
            B: "静かな落ち着き",
            C: "個性のある刺激",
            ALL: "全部好き",
            NONE: "この中にない"
          }
        },
        Q7: {
          title: "香りの余韻は、どんな残り方が心地よいですか？",
          answers: {
            A: "すっと消えて軽やか",
            B: "じんわり変化してほしい",
            C: "最後に深く残ってほしい",
            ALL: "全部好き",
            NONE: "この中にない"
          }
        }
      }
    },
    q8: {
      Q8: {
        title: "最後に、今日の香りはどんな仕上がりにしたいですか？",
        answers: {
          A: "軽やかにまとめたい",
          B: "やわらかく心地よくしたい",
          C: "少し印象を残したい",
          ALL: "全部好き",
          NONE: "この中にない"
        }
      }
    }
  };

  const DEFAULT_SCORING_CONFIG = {
    logicSource: SCORING_LOGIC_SOURCE,
    logicVersion: SCORING_LOGIC_VERSION,
    initialAxisScore: 50,
    axisOrder: [...AXIS_ORDER],
    questionWeights: {
      step1: 1,
      step2: 2,
      finish: 3
    },
    questionTextOverrides: clone(QUESTION_TEXT_OVERRIDES_V11),
    subOptionKeyMap: {
      "全部好き": "ALL",
      "この中にはない": "NONE"
    },
    step1PrimaryAxes: {
      Q1: ["floral", "fresh", "woody"],
      Q2: ["floral", "fresh", "woody"],
      Q3: ["floral", "fresh", "woody"],
      Q4: ["floral", "fresh", "woody"],
      Q5: ["floral", "fresh", "woody"]
    },
    step1ScoreMap: {
      Q1: {
        A: { floral: 8, fresh: 1, woody: -2, spicy: -1, sweet: 2 },
        B: { floral: 1, fresh: 8, woody: -2, spicy: -1, sweet: 0 },
        C: { floral: -2, fresh: -2, woody: 8, spicy: 2, sweet: -1 },
        ALL: { floral: 2, fresh: 2, woody: 1, spicy: 0, sweet: 0 },
        NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
      },
      Q2: {
        A: { floral: 5, fresh: 1, woody: -1, spicy: -1, sweet: 3 },
        B: { floral: 1, fresh: 5, woody: -1, spicy: -1, sweet: -1 },
        C: { floral: -1, fresh: -1, woody: 5, spicy: 1, sweet: 0 },
        ALL: { floral: 2, fresh: 2, woody: 1, spicy: 0, sweet: 1 },
        NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
      },
      Q3: {
        A: { floral: 4, fresh: 1, woody: 0, spicy: -1, sweet: 3 },
        B: { floral: 0, fresh: 5, woody: 0, spicy: 1, sweet: -2 },
        C: { floral: 0, fresh: -1, woody: 4, spicy: 2, sweet: 0 },
        ALL: { floral: 1, fresh: 2, woody: 1, spicy: 1, sweet: 0 },
        NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
      },
      Q4: {
        A: { floral: 2, fresh: 2, woody: -1, spicy: 0, sweet: 3 },
        B: { floral: 1, fresh: 3, woody: 1, spicy: -1, sweet: -1 },
        C: { floral: 0, fresh: -2, woody: 3, spicy: 3, sweet: 2 },
        ALL: { floral: 1, fresh: 1, woody: 1, spicy: 1, sweet: 1 },
        NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
      },
      Q5: {
        A: { floral: 1, fresh: 3, woody: -1, spicy: 0, sweet: 2 },
        B: { floral: 2, fresh: 1, woody: 1, spicy: 0, sweet: 2 },
        C: { floral: 0, fresh: 0, woody: 3, spicy: 1, sweet: -1 },
        ALL: { floral: 1, fresh: 1, woody: 1, spicy: 0, sweet: 1 },
        NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
      }
    },
    branchTemplates: {
      floral: { floral: 62, fresh: 54, woody: 42, spicy: 34, sweet: 58 },
      fresh: { floral: 46, fresh: 64, woody: 44, spicy: 36, sweet: 40 },
      woody: { floral: 44, fresh: 42, woody: 64, spicy: 52, sweet: 44 }
    },
    branchDistanceWeights: {
      floral: 1.3,
      fresh: 1.3,
      woody: 1.3,
      spicy: 0.7,
      sweet: 0.7
    },
    step2PrimaryAxes: {
      floral: {
        Q6: ["floral", "sweet", "fresh"],
        Q7: ["floral", "sweet", "woody"]
      },
      fresh: {
        Q6: ["fresh", "floral", "spicy"],
        Q7: ["fresh", "woody", "floral"]
      },
      woody: {
        Q6: ["woody", "spicy", "sweet"],
        Q7: ["woody", "spicy", "fresh"]
      }
    },
    step2ScoreMap: {
      floral: {
        Q6: {
          A: { floral: 4, fresh: 1, woody: 0, spicy: 0, sweet: 1 },
          B: { floral: 2, fresh: 0, woody: 0, spicy: -1, sweet: 4 },
          C: { floral: 2, fresh: 0, woody: 2, spicy: 1, sweet: -1 },
          ALL: { floral: 3, fresh: 0, woody: 1, spicy: 0, sweet: 1 },
          NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
        },
        Q7: {
          A: { floral: 3, fresh: 2, woody: 0, spicy: 0, sweet: 1 },
          B: { floral: 2, fresh: 0, woody: 1, spicy: 0, sweet: 3 },
          C: { floral: 2, fresh: 2, woody: 0, spicy: 0, sweet: -3 },
          ALL: { floral: 2, fresh: 1, woody: 0, spicy: 0, sweet: 0 },
          NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
        }
      },
      fresh: {
        Q6: {
          A: { floral: 1, fresh: 5, woody: -1, spicy: -1, sweet: 0 },
          B: { floral: 0, fresh: 4, woody: 0, spicy: -1, sweet: 1 },
          C: { floral: -1, fresh: 3, woody: 1, spicy: 2, sweet: -2 },
          ALL: { floral: 0, fresh: 4, woody: 0, spicy: 0, sweet: 0 },
          NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
        },
        Q7: {
          A: { floral: 0, fresh: 5, woody: 0, spicy: 0, sweet: -1 },
          B: { floral: 2, fresh: 3, woody: 0, spicy: 0, sweet: 0 },
          C: { floral: 0, fresh: 3, woody: 2, spicy: 0, sweet: 1 },
          ALL: { floral: 1, fresh: 4, woody: 1, spicy: 0, sweet: 0 },
          NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
        }
      },
      woody: {
        Q6: {
          A: { floral: 0, fresh: 0, woody: 4, spicy: 1, sweet: 1 },
          B: { floral: 0, fresh: 1, woody: 4, spicy: 0, sweet: 0 },
          C: { floral: -1, fresh: -1, woody: 3, spicy: 3, sweet: 0 },
          ALL: { floral: 0, fresh: 0, woody: 4, spicy: 1, sweet: 0 },
          NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
        },
        Q7: {
          A: { floral: 0, fresh: 3, woody: 2, spicy: -1, sweet: -1 },
          B: { floral: 0, fresh: 0, woody: 3, spicy: 0, sweet: 2 },
          C: { floral: 0, fresh: -2, woody: 4, spicy: 2, sweet: 1 },
          ALL: { floral: 0, fresh: 0, woody: 3, spicy: 0, sweet: 1 },
          NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
        }
      }
    },
    q8PrimaryAxes: ["fresh", "floral", "woody"],
    q8ScoreMap: {
      A: { floral: 1, fresh: 4, woody: -2, spicy: -2, sweet: -1 },
      B: { floral: 3, fresh: 1, woody: 0, spicy: -1, sweet: 2 },
      C: { floral: 0, fresh: -2, woody: 3, spicy: 3, sweet: 2 },
      ALL: { floral: 1, fresh: 1, woody: 0, spicy: 0, sweet: 1 },
      NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
    },
    finishKeyByAnswer: {
      A: "A",
      B: "B",
      C: "C",
      ALL: "ALL",
      NONE: "NONE"
    },
    finishTemplates: {
      A: { floral: 45, fresh: 75, woody: 35, spicy: 25, sweet: 30 },
      B: { floral: 65, fresh: 55, woody: 40, spicy: 25, sweet: 60 },
      C: { floral: 55, fresh: 40, woody: 70, spicy: 55, sweet: 65 },
      ALL: { floral: 55, fresh: 57, woody: 48, spicy: 35, sweet: 52 },
      NONE: null
    },
    finishBlendRatio: 0.25,
    graphPresets: {
      A: { floral: 45, fresh: 75, woody: 35, spicy: 25, sweet: 30 },
      B: { floral: 65, fresh: 55, woody: 40, spicy: 25, sweet: 60 },
      C: { floral: 55, fresh: 40, woody: 70, spicy: 55, sweet: 65 }
    },
    summaryProfiles: {
      floral_soft: {
        axes: { floral: 74, fresh: 54, woody: 42, spicy: 26, sweet: 62 },
        headline: "やわらかな華やかさが主役の方向",
        body: "花のやわらかさを中心に、甘さと親しみやすさが自然に残るバランスです。当日は軽さを見ながら、華やかさを少しずつ整えていく進め方が合います。"
      },
      fresh_clear: {
        axes: { floral: 50, fresh: 76, woody: 38, spicy: 24, sweet: 36 },
        headline: "透明感と清潔感を主軸にした方向",
        body: "みずみずしい抜け感と清潔感が中心です。重くしすぎず、必要に応じて花や木のニュアンスをあとから足していくとまとまりやすいです。"
      },
      woody_deep: {
        axes: { floral: 44, fresh: 40, woody: 72, spicy: 54, sweet: 42 },
        headline: "落ち着きと深みを静かに残す方向",
        body: "木の落ち着きや余韻の深さが主役です。当日は重たくなりすぎないよう、透明感ややわらかさを会話しながら重ねていく進め方が向いています。"
      },
      light_airy: {
        axes: { floral: 62, fresh: 72, woody: 34, spicy: 22, sweet: 38 },
        headline: "軽やかさを優先してまとめる方向",
        body: "抜け感と軽さを優先し、主張しすぎないまとまりを作る方向です。最初は軽めに試し、必要であれば後から深みを足す流れが自然です。"
      },
      balanced_comfort: {
        axes: { floral: 68, fresh: 58, woody: 48, spicy: 34, sweet: 50 },
        headline: "やわらかさと心地よさのバランス方向",
        body: "どれか一つを尖らせるよりも、全体を自然につなげるバランス型です。当日はこの土台から、香りの強さや残り方を少しずつ微調整しやすい状態です。"
      },
      strong_presence: {
        axes: { floral: 70, fresh: 42, woody: 58, spicy: 52, sweet: 57 },
        headline: "少し印象を残す存在感のある方向",
        body: "やわらかさを残しつつ、余韻や存在感をしっかり感じる方向です。当日は強さを見ながら、残し方の品の良さを整える進め方が合います。"
      },
      floral_fresh: {
        axes: { floral: 72, fresh: 66, woody: 40, spicy: 24, sweet: 48 },
        headline: "花のやわらかさに透明感を重ねる方向",
        body: "フローラルを軸にしながら、重くしすぎず透明感を保つタイプです。親しみやすさと清潔感の両立がしやすいバランスです。"
      },
      woody_soft: {
        axes: { floral: 54, fresh: 46, woody: 62, spicy: 42, sweet: 52 },
        headline: "深みの中にやわらかさを残す方向",
        body: "木や落ち着きの軸がありつつ、やわらかさや甘さで角を整えるタイプです。深さを活かしながら重さを抑えたいときの起点になります。"
      }
    }
  };

  const STEP1_QUESTION_SCHEMA_V11 = [
    {
      id: "Q1",
      title: "Q1 最初の香り立ち",
      answers: {
        A: "せっけんや水のようにみずみずしい",
        B: "白い花がふわっとやわらかい",
        C: "木や葉のように静かで落ち着く",
        D: "紅茶やスパイスのように温かく印象に残る",
        ALL: "全部好き",
        NONE: "この中にない"
      }
    },
    {
      id: "Q2",
      title: "Q2 使いやすい場面",
      answers: {
        A: "朝の外出や仕事前に、清潔に整う",
        B: "人と近い距離で、やさしく上品に見せたい",
        C: "一人時間や読書のときに、静かに落ち着きたい",
        D: "夜や特別な時間に、少し色気や深みがほしい",
        ALL: "全部好き",
        NONE: "この中にない"
      }
    },
    {
      id: "Q3",
      title: "Q3 甘さや温度感",
      answers: {
        A: "甘さは少なく、さらっと涼しい",
        B: "花の蜜のように、やさしくほのか",
        C: "木や樹脂のように、まろやかで落ち着く",
        D: "バニラやスパイスのように、温かくしっかり",
        ALL: "全部好き",
        NONE: "この中にない"
      }
    },
    {
      id: "Q4",
      title: "Q4 香りの残り方",
      answers: {
        A: "つけたてにすっと広がって、軽く引く",
        B: "近づいたときにふんわり感じる",
        C: "静かに落ち着いて、長めに続く",
        D: "後半にぬくもりや深みが出てくる",
        ALL: "全部好き",
        NONE: "この中にない"
      }
    },
    {
      id: "Q5",
      title: "Q5 人に伝わる印象",
      answers: {
        A: "清潔で軽やか、話しかけやすい",
        B: "やわらかく上品で、親しみやすい",
        C: "落ち着いて知的で、安心感がある",
        D: "印象に残る、あたたかい余韻がある",
        ALL: "全部好き",
        NONE: "この中にない"
      }
    }
  ];

  const STEP1_PRIMARY_AXES_V11 = {
    Q1: ["fresh", "floral", "woody", "spicy", "sweet"],
    Q2: ["fresh", "floral", "woody", "spicy", "sweet"],
    Q3: ["fresh", "floral", "woody", "spicy", "sweet"],
    Q4: ["fresh", "floral", "woody", "spicy", "sweet"],
    Q5: ["fresh", "floral", "woody", "spicy", "sweet"]
  };

  const STEP1_SCORE_MAP_V11 = {
    Q1: {
      A: { floral: 1, fresh: 8, woody: -2, spicy: -2, sweet: 0 },
      B: { floral: 8, fresh: 1, woody: -2, spicy: -1, sweet: 2 },
      C: { floral: -2, fresh: -1, woody: 8, spicy: 2, sweet: -1 },
      D: { floral: 0, fresh: -1, woody: 1, spicy: 4, sweet: 4 },
      ALL: { floral: 2, fresh: 2, woody: 1, spicy: 1, sweet: 1 },
      NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
    },
    Q2: {
      A: { floral: 0, fresh: 5, woody: 0, spicy: -1, sweet: -1 },
      B: { floral: 4, fresh: 1, woody: 0, spicy: -1, sweet: 2 },
      C: { floral: 0, fresh: -1, woody: 4, spicy: 1, sweet: 0 },
      D: { floral: 1, fresh: -2, woody: 1, spicy: 3, sweet: 3 },
      ALL: { floral: 1, fresh: 1, woody: 1, spicy: 1, sweet: 1 },
      NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
    },
    Q3: {
      A: { floral: 0, fresh: 4, woody: -1, spicy: 0, sweet: -3 },
      B: { floral: 4, fresh: 1, woody: 0, spicy: -1, sweet: 2 },
      C: { floral: 0, fresh: -1, woody: 4, spicy: 1, sweet: 1 },
      D: { floral: 0, fresh: -2, woody: 1, spicy: 3, sweet: 4 },
      ALL: { floral: 1, fresh: 1, woody: 1, spicy: 1, sweet: 1 },
      NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
    },
    Q4: {
      A: { floral: 0, fresh: 4, woody: -1, spicy: -1, sweet: -1 },
      B: { floral: 3, fresh: 1, woody: 0, spicy: -1, sweet: 2 },
      C: { floral: 0, fresh: 0, woody: 4, spicy: 1, sweet: 0 },
      D: { floral: 0, fresh: -1, woody: 2, spicy: 3, sweet: 2 },
      ALL: { floral: 1, fresh: 1, woody: 1, spicy: 1, sweet: 1 },
      NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
    },
    Q5: {
      A: { floral: 0, fresh: 4, woody: 0, spicy: 0, sweet: -1 },
      B: { floral: 4, fresh: 1, woody: 0, spicy: -1, sweet: 2 },
      C: { floral: 0, fresh: 0, woody: 4, spicy: 1, sweet: 0 },
      D: { floral: 1, fresh: -1, woody: 1, spicy: 2, sweet: 3 },
      ALL: { floral: 1, fresh: 1, woody: 1, spicy: 1, sweet: 1 },
      NONE: { floral: 0, fresh: 0, woody: 0, spicy: 0, sweet: 0 }
    }
  };

  STEP1_QUESTION_SCHEMA.splice(0, STEP1_QUESTION_SCHEMA.length, ...STEP1_QUESTION_SCHEMA_V11);
  DEFAULT_SCORING_CONFIG.subOptionKeyMap = {
    "全部好き": "ALL",
    "この中にない": "NONE",
    "この中にはない": "NONE"
  };
  DEFAULT_SCORING_CONFIG.step1PrimaryAxes = STEP1_PRIMARY_AXES_V11;
  DEFAULT_SCORING_CONFIG.step1ScoreMap = STEP1_SCORE_MAP_V11;

  const DEFAULT_MATERIAL_TEMPLATES = [
    { material_code: "bergamot", material_name: "ベルガモット", category: "Top", point_axes: { floral: 10, fresh: 60, woody: 15, spicy: 10, sweet: 5 }, note: "シトラスの抜け感と軽いフローラル感を持つ初期テンプレート。", is_active: true, sort_order: 10 },
    { material_code: "lemon", material_name: "レモン", category: "Top", point_axes: { floral: 2, fresh: 78, woody: 5, spicy: 5, sweet: 10 }, note: "もっとも軽く鮮明なフレッシュ寄りテンプレート。", is_active: true, sort_order: 20 },
    { material_code: "grapefruit", material_name: "グレープフルーツ", category: "Top", point_axes: { floral: 5, fresh: 70, woody: 5, spicy: 5, sweet: 15 }, note: "苦みを含む爽快感を想定した初期テンプレート。", is_active: true, sort_order: 30 },
    { material_code: "lavender", material_name: "ラベンダー", category: "Middle", point_axes: { floral: 35, fresh: 25, woody: 15, spicy: 15, sweet: 10 }, note: "ハーバルさとフローラルをつなぐ中間テンプレート。", is_active: true, sort_order: 40 },
    { material_code: "muguet", material_name: "ミュゲ", category: "Middle", point_axes: { floral: 55, fresh: 25, woody: 5, spicy: 5, sweet: 10 }, note: "軽い花感を中心にしたフローラルテンプレート。", is_active: true, sort_order: 50 },
    { material_code: "damaskRose", material_name: "ダマスクローズ", category: "Middle", point_axes: { floral: 60, fresh: 10, woody: 5, spicy: 5, sweet: 20 }, note: "華やかさと甘さを持つ王道フローラルテンプレート。", is_active: true, sort_order: 60 },
    { material_code: "assamTea", material_name: "アッサムティー", category: "Middle", point_axes: { floral: 10, fresh: 25, woody: 35, spicy: 20, sweet: 10 }, note: "深みと温かいスパイス感を補うテンプレート。", is_active: true, sort_order: 70 },
    { material_code: "cassis", material_name: "カシス", category: "Middle", point_axes: { floral: 5, fresh: 25, woody: 5, spicy: 15, sweet: 50 }, note: "果実感と甘さのアクセントを持つテンプレート。", is_active: true, sort_order: 80 },
    { material_code: "magnolia", material_name: "マグノリア", category: "Middle", point_axes: { floral: 55, fresh: 15, woody: 10, spicy: 10, sweet: 10 }, note: "透明感を残しつつ華やかさを出すテンプレート。", is_active: true, sort_order: 90 },
    { material_code: "musk", material_name: "スウィート", category: "Last", point_axes: { floral: 10, fresh: 25, woody: 10, spicy: 5, sweet: 50 }, note: "やわらかな余韻と甘さを支えるラスト寄りテンプレート。", is_active: true, sort_order: 100 },
    { material_code: "amber", material_name: "アンバー", category: "Last", point_axes: { floral: 5, fresh: 15, woody: 35, spicy: 20, sweet: 25 }, note: "温かみのある深さを作るテンプレート。", is_active: true, sort_order: 110 },
    { material_code: "sandalwood", material_name: "サンダルウッド", category: "Last", point_axes: { floral: 5, fresh: 5, woody: 55, spicy: 10, sweet: 25 }, note: "落ち着いた木質感とやわらかな甘さを持つテンプレート。", is_active: true, sort_order: 120 },
    { material_code: "squash", material_name: "スカッシュ", category: "Top", point_axes: { floral: 10, fresh: 65, woody: 3, spicy: 2, sweet: 20 }, note: "限定素材を想定した軽快なフレッシュテンプレート。", is_active: true, sort_order: 130 },
    { material_code: "seaBlue", material_name: "シーブルー", category: "Top", point_axes: { floral: 10, fresh: 75, woody: 5, spicy: 5, sweet: 5 }, note: "マリン寄りの透明感を補うテンプレート。", is_active: true, sort_order: 140 },
    { material_code: "hibiscus", material_name: "ハイビスカス", category: "Middle", point_axes: { floral: 50, fresh: 15, woody: 5, spicy: 5, sweet: 25 }, note: "華やかさと南国的な甘さを持つテンプレート。", is_active: true, sort_order: 150 },
    { material_code: "coconutRum", material_name: "ココナッツラム", category: "Last", point_axes: { floral: 5, fresh: 10, woody: 15, spicy: 10, sweet: 60 }, note: "甘さと余韻を強く残す限定テンプレート。", is_active: true, sort_order: 160 }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createDefaultScoringConfig() {
    return clone(DEFAULT_SCORING_CONFIG);
  }

  function createMaterialTemplates() {
    return clone(DEFAULT_MATERIAL_TEMPLATES);
  }

  function normalizeAxes(axes) {
    const normalized = {};
    AXIS_ORDER.forEach((axis) => {
      normalized[axis] = Number(axes?.[axis] || 0);
    });
    return normalized;
  }

  function normalizeAxesToProfile(axes) {
    const source = normalizeAxes(axes);
    const total = AXIS_ORDER.reduce((sum, axis) => sum + Math.max(0, source[axis]), 0) || 1;
    const normalized = {};
    AXIS_ORDER.forEach((axis) => {
      normalized[axis] = Math.round((Math.max(0, source[axis]) / total) * 100);
    });
    return normalized;
  }

  function normalizeMaterialTags(tags) {
    if (Array.isArray(tags)) {
      return tags.map((tag) => String(tag).trim()).filter(Boolean);
    }
    if (typeof tags === "string") {
      return tags.split(/[,\n、]/).map((tag) => tag.trim()).filter(Boolean);
    }
    return [];
  }

  function normalizeMaterialRow(row) {
    return {
      material_code: row?.material_code || "",
      material_name: row?.material_name || "",
      category: row?.category || "",
      point_axes: normalizeAxes(row?.point_axes),
      tags: normalizeMaterialTags(row?.tags),
      note: row?.note || null,
      is_active: row?.is_active !== false,
      sort_order: Number(row?.sort_order || 0)
    };
  }

  function clampAxisValue(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  }

  function roundAxisValue(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function stableHash(source) {
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function initialAxes(config) {
    const initialScore = Number(config?.initialAxisScore || 50);
    return AXIS_ORDER.reduce((acc, axis) => {
      acc[axis] = initialScore;
      return acc;
    }, {});
  }

  function addAxisScore(base, score, weight) {
    const next = { ...base };
    AXIS_ORDER.forEach((axis) => {
      next[axis] = clampAxisValue(Number(next[axis] || 0) + Number(score?.[axis] || 0) * weight);
    });
    return next;
  }

  function getBranchFromAxes(axes) {
    const normalized = normalizeAxes(axes);
    const candidates = ["floral", "fresh", "woody"];
    return candidates.sort((a, b) => Number(normalized[b] || 0) - Number(normalized[a] || 0))[0] || "floral";
  }

  function normalizeAnswerKey(value, fallback = "A") {
    if (value === undefined || value === null || String(value).trim() === "") return fallback;
    const key = String(value).trim().toUpperCase();
    return key || fallback;
  }

  function getStep1Answers(source) {
    return source?.step1Answers
      || source?.step1_answer_keys_json
      || source?.step1_answers_json
      || {};
  }

  function getStep2Answers(source) {
    return source?.step2Answers
      || source?.step2_answer_keys_json
      || source?.step2_answers_json
      || {};
  }

  function calculateStep1Axes(config, answers = {}) {
    let axes = initialAxes(config);
    ["Q1", "Q2", "Q3", "Q4", "Q5"].forEach((questionId) => {
      const key = normalizeAnswerKey(answers[questionId]);
      const score = config?.step1ScoreMap?.[questionId]?.[key];
      axes = addAxisScore(axes, score, Number(config?.questionWeights?.step1 || 1));
    });
    return axes;
  }

  function calculateStep2Axes(config, state = {}, answers = {}) {
    let axes = normalizeAxes(state.axesAfterStep1 || initialAxes(config));
    const branch = state.branchKey || getBranchFromAxes(axes);
    ["Q6", "Q7"].forEach((questionId) => {
      const key = normalizeAnswerKey(answers[questionId]);
      const score = config?.step2ScoreMap?.[branch]?.[questionId]?.[key];
      axes = addAxisScore(axes, score, Number(config?.questionWeights?.step2 || 2));
    });
    const finishKey = normalizeAnswerKey(answers.Q8 || state.selectedFinish || state.selected_finish);
    axes = addAxisScore(axes, config?.q8ScoreMap?.[finishKey], Number(config?.questionWeights?.finish || 3));
    return axes;
  }

  function calculateQuestionnaireAxesFromAnswers(config, source = {}) {
    const compatibleConfig = getCompatibleScoringConfig(config || createDefaultScoringConfig());
    const step1Answers = getStep1Answers(source);
    const step2Answers = {
      ...getStep2Answers(source),
      Q8: getStep2Answers(source).Q8 || source.selectedFinish || source.selected_finish || source.finish
    };
    const axesAfterStep1 = calculateStep1Axes(compatibleConfig, step1Answers);
    const branchKey = source.branchKey || source.branch_key || getBranchFromAxes(axesAfterStep1);
    return calculateStep2Axes(compatibleConfig, {
      axesAfterStep1,
      branchKey,
      selectedFinish: source.selectedFinish || source.selected_finish || source.finish
    }, step2Answers);
  }

  function buildQuestionSignature(source = {}) {
    const step1Answers = getStep1Answers(source);
    const step2Answers = getStep2Answers(source);
    const branch = String(source.branchKey || source.branch_key || source.branch || "").trim().toLowerCase();
    const finish = normalizeAnswerKey(source.selectedFinish || source.selected_finish || source.finish || step2Answers.Q8, "");
    const parts = ["Q1", "Q2", "Q3", "Q4", "Q5"].map((questionId) => {
      const key = normalizeAnswerKey(step1Answers[questionId], "");
      return key ? `${questionId}=${key}` : "";
    });
    ["Q6", "Q7", "Q8"].forEach((questionId) => {
      const fallback = questionId === "Q8" ? finish : "";
      const key = normalizeAnswerKey(step2Answers[questionId] || fallback, "");
      parts.push(key ? `${questionId}=${key}` : "");
    });
    if (branch) parts.push(`branch=${branch}`);
    if (finish) parts.push(`finish=${finish}`);
    return parts.every(Boolean) && branch && finish ? parts.join("|") : "";
  }

  function buildQuestionSignatureFromQuestionnaire(row = {}) {
    return buildQuestionSignature({
      step1_answer_keys_json: row.step1_answer_keys_json || row.step1_answers_json || {},
      step2_answer_keys_json: row.step2_answer_keys_json || row.step2_answers_json || {},
      branch_key: row.branch_key,
      selected_finish: row.selected_finish
    });
  }

  function createMaterialPointsVersion(materialRows) {
    const payload = (materialRows || [])
      .map(normalizeMaterialRow)
      .filter((row) => row.is_active)
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return String(a.material_code).localeCompare(String(b.material_code));
      })
      .map((row) => ({
        material_code: row.material_code,
        point_axes: normalizeAxes(row.point_axes),
        sort_order: row.sort_order
      }));
    return `mp-${stableHash(JSON.stringify(payload))}`;
  }

  function calculateRecipeRawAxes(items = [], materialRows = []) {
    const materials = new Map((materialRows || []).map(normalizeMaterialRow).map((row) => [row.material_code, row]));
    const totalAmount = (items || []).reduce((sum, item) => sum + Math.max(0, Number(item?.amount || 0)), 0);
    if (!items.length || !totalAmount) return null;
    const axes = AXIS_ORDER.reduce((acc, axis) => {
      acc[axis] = 0;
      return acc;
    }, {});
    items.forEach((item) => {
      const material = materials.get(item?.material_code);
      if (!material || !material.is_active) return;
      const ratio = Math.max(0, Number(item.amount || 0)) / totalAmount;
      AXIS_ORDER.forEach((axis) => {
        axes[axis] += Number(material.point_axes?.[axis] || 0) * ratio;
      });
    });
    return AXIS_ORDER.reduce((acc, axis) => {
      acc[axis] = roundAxisValue(axes[axis]);
      return acc;
    }, {});
  }

  function getRecommendationRatioPatterns() {
    const patterns = [];
    for (let first = RECOMMENDATION_RECIPE_MIN_RATIO; first <= 100; first += RECOMMENDATION_RECIPE_STEP) {
      for (let second = RECOMMENDATION_RECIPE_MIN_RATIO; second <= 100 - first; second += RECOMMENDATION_RECIPE_STEP) {
        const third = 100 - first - second;
        if (third >= RECOMMENDATION_RECIPE_MIN_RATIO && third % RECOMMENDATION_RECIPE_STEP === 0) {
          patterns.push([first, second, third]);
        }
      }
    }
    return patterns;
  }

  function calculateAxisDistance(leftAxes, rightAxes) {
    return AXIS_ORDER.reduce((sum, axis) => sum + Math.abs(Number(leftAxes?.[axis] || 0) - Number(rightAxes?.[axis] || 0)), 0);
  }

  function buildRecipeItems(materials, ratios) {
    return materials.map((material, index) => ({
      role: "ingredient",
      material_code: material.material_code,
      material_name: material.material_name,
      amount: ratios[index]
    }));
  }

  function buildRecipeCandidateSignature(materials, ratios) {
    return materials.map((material, index) => `${material.material_code}:${ratios[index]}`).join("|");
  }

  function findBestRecipe(targetAxes, materialRows, options = {}) {
    const activeRows = (materialRows || [])
      .map(normalizeMaterialRow)
      .filter((row) => row.is_active && row.material_code)
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return String(a.material_code).localeCompare(String(b.material_code));
      });
    if (activeRows.length < RECOMMENDATION_RECIPE_MATERIAL_COUNT) return null;

    const questionnaireAxes = normalizeAxes(targetAxes);
    const questionnaireComparableAxes = normalizeAxesToProfile(questionnaireAxes);
    const ratioPatterns = options.ratioPatterns || getRecommendationRatioPatterns();
    let best = null;

    for (let firstIndex = 0; firstIndex < activeRows.length - 2; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < activeRows.length - 1; secondIndex += 1) {
        for (let thirdIndex = secondIndex + 1; thirdIndex < activeRows.length; thirdIndex += 1) {
          const materials = [activeRows[firstIndex], activeRows[secondIndex], activeRows[thirdIndex]];
          ratioPatterns.forEach((ratios) => {
            const recipeItems = buildRecipeItems(materials, ratios);
            const rawRecipeAxes = calculateRecipeRawAxes(recipeItems, materials);
            const recipeComparableAxes = normalizeAxesToProfile(rawRecipeAxes);
            const distanceScore = calculateAxisDistance(questionnaireComparableAxes, recipeComparableAxes);
            const candidateSignature = buildRecipeCandidateSignature(materials, ratios);
            if (
              !best
              || distanceScore < best.distance_score
              || (distanceScore === best.distance_score && candidateSignature < best.candidate_signature)
            ) {
              best = {
                questionnaire_axes: questionnaireAxes,
                questionnaire_comparable_axes: questionnaireComparableAxes,
                recipe_items: recipeItems,
                raw_recipe_axes: rawRecipeAxes,
                recipe_comparable_axes: recipeComparableAxes,
                distance_score: distanceScore,
                algorithm_version: RECOMMENDATION_ALGORITHM_VERSION,
                candidate_signature: candidateSignature
              };
            }
          });
        }
      }
    }

    if (!best) return null;
    const { candidate_signature, ...recommendation } = best;
    return recommendation;
  }

  function isExpectedScoringConfig(config) {
    return Boolean(
      config &&
      config.logicSource === SCORING_LOGIC_SOURCE &&
      config.logicVersion === SCORING_LOGIC_VERSION &&
      config.step1ScoreMap?.Q1?.D &&
      config.step1ScoreMap?.Q1?.ALL &&
      config.step2ScoreMap?.floral?.Q6?.ALL &&
      config.q8ScoreMap?.ALL &&
      Object.prototype.hasOwnProperty.call(config.finishTemplates || {}, "A")
    );
  }

  function getCompatibleScoringConfig(config) {
    return isExpectedScoringConfig(config) ? clone(config) : createDefaultScoringConfig();
  }

  function rankMaterials(targetAxes, materialRows, limit = 4) {
    const normalizedTarget = normalizeAxesToProfile(targetAxes);
    return (materialRows || [])
      .map(normalizeMaterialRow)
      .filter((row) => row.is_active)
      .map((row) => {
        const distance = AXIS_ORDER.reduce((sum, axis) => sum + Math.abs(normalizedTarget[axis] - row.point_axes[axis]), 0);
        return {
          ...row,
          target_axes: normalizedTarget,
          distance,
          score: Math.max(0, 100 - Math.round(distance / AXIS_ORDER.length))
        };
      })
      .sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return a.sort_order - b.sort_order;
      })
      .slice(0, limit);
  }

  window.FragranceMasterData = {
    AXIS_ORDER,
    AXIS_LABELS,
    SCORING_LOGIC_SOURCE,
    SCORING_LOGIC_VERSION,
    RECOMMENDATION_ALGORITHM_VERSION,
    STEP1_QUESTION_SCHEMA,
    STEP2_QUESTION_SCHEMA,
    Q8_SCHEMA,
    createDefaultScoringConfig,
    createMaterialTemplates,
    normalizeAxes,
    normalizeAxesToProfile,
    normalizeMaterialRow,
    getBranchFromAxes,
    calculateStep1Axes,
    calculateStep2Axes,
    calculateQuestionnaireAxesFromAnswers,
    buildQuestionSignature,
    buildQuestionSignatureFromQuestionnaire,
    createMaterialPointsVersion,
    calculateRecipeRawAxes,
    getRecommendationRatioPatterns,
    calculateAxisDistance,
    findBestRecipe,
    isExpectedScoringConfig,
    getCompatibleScoringConfig,
    rankMaterials
  };
})();
