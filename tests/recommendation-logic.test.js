const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadMasterData() {
  const filePath = path.resolve(__dirname, "../js/fragrance-master-data.js");
  const code = fs.readFileSync(filePath, "utf8");
  const sandbox = { window: {}, console };
  vm.runInNewContext(code, sandbox, { filename: filePath });
  return sandbox.window.FragranceMasterData;
}

test("question signature includes Q1-Q8, branch, and finish", () => {
  const master = loadMasterData();
  const signature = master.buildQuestionSignature({
    step1_answer_keys_json: { Q1: "A", Q2: "B", Q3: "C", Q4: "D", Q5: "ALL" },
    step2_answer_keys_json: { Q6: "A", Q7: "B", Q8: "NONE" },
    branch_key: "fresh",
    selected_finish: "NONE"
  });
  assert.equal(signature, "Q1=A|Q2=B|Q3=C|Q4=D|Q5=ALL|Q6=A|Q7=B|Q8=NONE|branch=fresh|finish=NONE");
});

test("questionnaire axes are calculated from 8 answers", () => {
  const master = loadMasterData();
  const config = master.createDefaultScoringConfig();
  const axes = master.calculateQuestionnaireAxesFromAnswers(config, {
    step1_answer_keys_json: { Q1: "A", Q2: "A", Q3: "A", Q4: "A", Q5: "A" },
    step2_answer_keys_json: { Q6: "A", Q7: "A", Q8: "A" },
    branch_key: "fresh",
    selected_finish: "A"
  });
  assert.deepEqual(Object.keys(axes).join(","), Array.from(master.AXIS_ORDER).join(","));
  assert.ok(axes.fresh > axes.woody);
  assert.ok(axes.fresh > axes.sweet);
});

test("best recipe uses three active materials and 5 percent ratios totaling 100", () => {
  const master = loadMasterData();
  const materials = master.createMaterialTemplates().slice(0, 5);
  const recommendation = master.findBestRecipe({ floral: 58, fresh: 68, woody: 45, spicy: 42, sweet: 52 }, materials);
  const repeated = master.findBestRecipe({ floral: 58, fresh: 68, woody: 45, spicy: 42, sweet: 52 }, materials);
  assert.ok(recommendation);
  assert.equal(recommendation.recipe_items.length, 3);
  assert.deepEqual(JSON.stringify(recommendation.recipe_items), JSON.stringify(repeated.recipe_items));
  assert.equal(recommendation.recipe_items.reduce((sum, item) => sum + item.amount, 0), 100);
  assert.ok(recommendation.recipe_items.every((item) => item.amount >= 5 && item.amount % 5 === 0));
  assert.ok(recommendation.distance_score >= 0);
});

test("inactive materials are excluded from recommendation candidates", () => {
  const master = loadMasterData();
  const materials = master.createMaterialTemplates().slice(0, 5);
  materials[0].is_active = false;
  const recommendation = master.findBestRecipe(materials[0].point_axes, materials);
  assert.ok(recommendation);
  assert.ok(recommendation.recipe_items.every((item) => item.material_code !== materials[0].material_code));
});
