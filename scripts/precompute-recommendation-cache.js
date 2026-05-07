#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function parseArgs(argv) {
  const args = {
    out: "",
    scoringConfig: "",
    materials: "",
    scoringVersion: "",
    materialVersion: "",
    limit: 0,
    batchSize: 500,
    supabase: false
  };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === "--out") {
      args.out = next || "";
      index += 1;
    } else if (token === "--scoring-config") {
      args.scoringConfig = next || "";
      index += 1;
    } else if (token === "--materials") {
      args.materials = next || "";
      index += 1;
    } else if (token === "--scoring-version") {
      args.scoringVersion = next || "";
      index += 1;
    } else if (token === "--material-version") {
      args.materialVersion = next || "";
      index += 1;
    } else if (token === "--limit") {
      args.limit = Math.max(0, Number(next || 0));
      index += 1;
    } else if (token === "--batch-size") {
      args.batchSize = Math.max(1, Number(next || 500));
      index += 1;
    } else if (token === "--supabase") {
      args.supabase = true;
    }
  }
  return args;
}

function readJsonFile(filePath) {
  if (!filePath) return null;
  const resolved = path.resolve(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

function loadMasterData() {
  const filePath = path.resolve(__dirname, "../assets/js/fragrance-master-data.js");
  const code = fs.readFileSync(filePath, "utf8");
  const sandbox = { window: {}, console };
  vm.runInNewContext(code, sandbox, { filename: filePath });
  return sandbox.window.FragranceMasterData;
}

function getChoiceKeys(map, fallback) {
  const keys = Object.keys(map || {});
  return keys.length ? keys.sort() : fallback;
}

function* cartesian(items, prefix = []) {
  if (!items.length) {
    yield prefix;
    return;
  }
  const [head, ...tail] = items;
  for (const value of head) {
    yield* cartesian(tail, prefix.concat(value));
  }
}

function* enumerateAnswerPatterns(master, config) {
  const step1Questions = ["Q1", "Q2", "Q3", "Q4", "Q5"];
  const step1Keys = step1Questions.map((questionId) => (
    getChoiceKeys(config.step1ScoreMap?.[questionId], ["A", "B", "C", "D", "ALL", "NONE"])
  ));
  const q8Keys = getChoiceKeys(config.q8ScoreMap, ["A", "B", "C", "ALL", "NONE"]);

  for (const step1Values of cartesian(step1Keys)) {
    const step1Answers = step1Questions.reduce((acc, questionId, index) => {
      acc[questionId] = step1Values[index];
      return acc;
    }, {});
    const axesAfterStep1 = master.calculateStep1Axes(config, step1Answers);
    const branchKey = master.getBranchFromAxes(axesAfterStep1);
    const branchConfig = config.step2ScoreMap?.[branchKey] || {};
    const q6Keys = getChoiceKeys(branchConfig.Q6, ["A", "B", "C", "ALL", "NONE"]);
    const q7Keys = getChoiceKeys(branchConfig.Q7, ["A", "B", "C", "ALL", "NONE"]);

    for (const q6 of q6Keys) {
      for (const q7 of q7Keys) {
        for (const q8 of q8Keys) {
          yield {
            step1_answer_keys_json: step1Answers,
            step2_answer_keys_json: { Q6: q6, Q7: q7, Q8: q8 },
            branch_key: branchKey,
            selected_finish: q8
          };
        }
      }
    }
  }
}

function createRecommendationRecord(master, config, materials, versions, pattern, bestByAxesKey) {
  const questionnaireAxes = master.calculateQuestionnaireAxesFromAnswers(config, pattern);
  const axesKey = master.AXIS_ORDER.map((axis) => `${axis}:${questionnaireAxes[axis]}`).join("|");
  let recommendation = bestByAxesKey.get(axesKey);
  if (!recommendation) {
    recommendation = master.findBestRecipe(questionnaireAxes, materials);
    if (!recommendation) return null;
    bestByAxesKey.set(axesKey, recommendation);
  }
  const signature = master.buildQuestionSignature(pattern);
  if (!signature) return null;
  return {
    question_signature: signature,
    questionnaire_axes: questionnaireAxes,
    questionnaire_comparable_axes: recommendation.questionnaire_comparable_axes,
    recipe_items: recommendation.recipe_items,
    raw_recipe_axes: recommendation.raw_recipe_axes,
    recipe_comparable_axes: recommendation.recipe_comparable_axes,
    distance_score: recommendation.distance_score,
    scoring_config_version: versions.scoringConfigVersion,
    material_points_version: versions.materialPointsVersion,
    algorithm_version: master.RECOMMENDATION_ALGORITHM_VERSION,
    is_active: true,
    updated_at: new Date().toISOString()
  };
}

async function upsertSupabaseRows(rows) {
  if (!rows.length) return;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --supabase.");
  }
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/recommendation_recipe_cache?on_conflict=question_signature,scoring_config_version,material_points_version,algorithm_version`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify(rows)
  });
  if (!response.ok) {
    throw new Error(`Supabase upsert failed: ${response.status} ${await response.text()}`);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.out && !args.supabase && !args.limit) args.limit = 10;
  const master = loadMasterData();
  const scoringConfigSource = readJsonFile(args.scoringConfig);
  const materialSource = readJsonFile(args.materials);
  const config = master.getCompatibleScoringConfig(scoringConfigSource?.config_json || scoringConfigSource || master.createDefaultScoringConfig());
  const materials = (Array.isArray(materialSource) ? materialSource : materialSource?.data) || master.createMaterialTemplates();
  const versions = {
    scoringConfigVersion: args.scoringVersion || "default",
    materialPointsVersion: args.materialVersion || master.createMaterialPointsVersion(materials)
  };
  const output = args.out ? fs.createWriteStream(path.resolve(process.cwd(), args.out), { encoding: "utf8" }) : null;
  const bestByAxesKey = new Map();
  let batch = [];
  let count = 0;

  for (const pattern of enumerateAnswerPatterns(master, config)) {
    const record = createRecommendationRecord(master, config, materials, versions, pattern, bestByAxesKey);
    if (!record) continue;
    count += 1;
    if (output) output.write(`${JSON.stringify(record)}\n`);
    if (args.supabase) {
      batch.push(record);
      if (batch.length >= args.batchSize) {
        await upsertSupabaseRows(batch);
        batch = [];
      }
    }
    if (args.limit && count >= args.limit) break;
  }

  if (args.supabase && batch.length) await upsertSupabaseRows(batch);
  if (output) output.end();
  console.log(JSON.stringify({
    records: count,
    uniqueAxes: bestByAxesKey.size,
    scoringConfigVersion: versions.scoringConfigVersion,
    materialPointsVersion: versions.materialPointsVersion,
    algorithmVersion: master.RECOMMENDATION_ALGORITHM_VERSION,
    output: args.out || null,
    supabase: args.supabase
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
