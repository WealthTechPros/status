// Executed from src/helpers of the pinned upstream generator by the CI workflow.
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { load } = require("js-yaml");
const { getConfig } = require("./config");
const { getConfiguredSecretReferences } = require("./workflow-secrets");
const { uptimeCiWorkflow, responseTimeCiWorkflow, setupCiWorkflow, updateTemplateCiWorkflow } = require("./workflows");

// Rendering only needs the release label. Keep the test offline and out of the
// update-template command, which also cleans history and pushes a commit.
jest.mock("./github", () => ({
  getOctokit: async () => ({
    repos: { listReleases: async () => ({ data: [{ tag_name: process.env.UPPTIME_RELEASE }] }) },
  }),
}));

test("the public probes need no supplementary secrets", async () => {
  const config = await getConfig();
  expect(config.secrets).toEqual([]);
  expect(getConfiguredSecretReferences(config)).toEqual([]);
});

// Both paths can replace the committed monitors. CI exercises the actual
// renderer at each allowed ref against this configuration, including master.
test.each([
  ["setup.yml", setupCiWorkflow, () => process.env.UPPTIME_RELEASE],
  ["update-template.yml", updateTemplateCiWorkflow, () => "master"],
])("%s selects a tested generator after regeneration", async (file, render, expectedRef) => {
  const current = readFileSync(join(process.env.STATUS_ROOT, ".github", "workflows", file), "utf8");
  const updaterRef = (text) => {
    const steps = load(text).jobs.release.steps.filter((step) => step.with?.command === "update-template");
    expect(steps).toHaveLength(1);
    return steps[0].uses;
  };
  const bootstrap = "74f0683383384927e064d76a5f21f340d6af36fc";
  expect([bootstrap, expectedRef()].map((ref) => `upptime/uptime-monitor@${ref}`)).toContain(updaterRef(current));
  expect(updaterRef(await render())).toBe(`upptime/uptime-monitor@${expectedRef()}`);
});

test.each([
  ["uptime.yml", "update", uptimeCiWorkflow],
  ["response-time.yml", "response-time", responseTimeCiWorkflow],
  ["setup.yml", "response-time", setupCiWorkflow],
])("%s forwards only GitHub authentication before and after regeneration", async (file, command, render) => {
  const checkedIn = readFileSync(join(process.env.STATUS_ROOT, ".github", "workflows", file), "utf8");
  for (const text of [checkedIn, await render()]) {
    const steps = load(text).jobs.release.steps.filter((step) => step.with?.command === command);
    expect(steps).toHaveLength(1);
    expect(steps[0].env).toEqual({
      GH_PAT: expect.stringMatching(/^\$\{\{ (?:steps\.app_token\.outputs\.token \|\| )?secrets\.GH_PAT \|\| github\.token \}\}$/),
      SECRETS_CONTEXT: "{}",
    });
    expect(text).not.toMatch(/tojson\s*\(\s*secrets\s*\)/i);
  }
});
