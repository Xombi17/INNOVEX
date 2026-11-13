import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { analyzeInput } from "../src/lib/analysis.ts";

const base = process.env.BASE_URL ?? "http://localhost:3107";
const output =
  process.env.BROWSER_ARTIFACTS ?? path.join(tmpdir(), "scopebomb-ux-browser");
const profile = await mkdtemp(path.join(tmpdir(), "scopebomb-ux-chrome-"));
const chrome = spawn(
  process.env.CHROME_BIN ?? "/usr/bin/google-chrome",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--remote-debugging-port=0",
    "--user-data-dir=" + profile,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
let chromeDiagnostics = "";
chrome.stderr.setEncoding("utf8");
chrome.stderr.on("data", (chunk) => { chromeDiagnostics = (chromeDiagnostics + chunk).slice(-4096); });
chrome.on("error", (error) => { chromeDiagnostics = String(error); });
const checks = [],
  errors = [],
  posts = [];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      port = (
        await readFile(path.join(profile, "DevToolsActivePort"), "utf8")
      ).split("\n")[0];
      break;
    } catch {
      await pause(100);
    }
  }
  if (!port) throw new Error("Chrome did not open a debugging endpoint. " + chromeDiagnostics);
  const tab = await (
    await fetch(
      `http://127.0.0.1:${port}/json/new?${encodeURIComponent(base)}`,
      { method: "PUT" },
    )
  ).json();
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  const pausedRepoRequests = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Fetch.requestPaused")
      pausedRepoRequests.push(message.params.requestId);
    if (message.id) {
      const entry = pending.get(message.id);
      if (entry) {
        pending.delete(message.id);
        clearTimeout(entry.timer);
        message.error
          ? entry.reject(new Error(JSON.stringify(message.error)))
          : entry.resolve(message.result);
      }
    }
    if (message.method === "Runtime.exceptionThrown")
      errors.push(message.params.exceptionDetails.text);
    if (
      message.method === "Runtime.consoleAPICalled" &&
      message.params.type === "error"
    )
      errors.push(
        message.params.args
          .map((arg) => arg.value ?? arg.description)
          .join(" "),
      );
    if (
      message.method === "Network.requestWillBeSent" &&
      message.params.request.method === "POST"
    )
      posts.push(message.params.request);
  });
  const cdp = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error("CDP timeout: " + method));
      }, 15000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const js = async (expression) => {
    const result = await cdp("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async (expression, label) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await js(expression)) return;
      await pause(100);
    }
    throw new Error("Timed out: " + label);
  };
  const check = (label, condition) => {
    assert.ok(condition, label);
    checks.push(label);
    console.log("PASS " + label);
  };
  const click = async (name) => {
    // Stop in-flight smooth scrolling before measuring pointer coordinates.
    await js('window.scrollTo({ top: scrollY, left: scrollX, behavior: "instant" })');
    const nodes = (await cdp("Accessibility.getFullAXTree")).nodes;
    const node = nodes.find(
      (item) =>
        !item.ignored &&
        item.name?.value === name &&
        ["button", "link", "DisclosureTriangle", "checkbox"].includes(
          item.role?.value,
        ),
    );
    if (!node) throw new Error("Control not found: " + name);
    const viewport = await js("({ width: innerWidth, height: innerHeight })");
    let x, y, previous, stable = 0;
    // Native smooth scrolling and entry motion can outlive a protocol command.
    for (let attempt = 0; attempt < 30; attempt++) {
      await cdp("DOM.scrollIntoViewIfNeeded", { backendNodeId: node.backendDOMNodeId });
      const points = (await cdp("DOM.getBoxModel", { backendNodeId: node.backendDOMNodeId })).model.content;
      x = (points[0] + points[2] + points[4] + points[6]) / 4;
      y = (points[1] + points[3] + points[5] + points[7]) / 4;
      const visible = x >= 0 && y >= 0 && x < viewport.width && y < viewport.height;
      stable = visible && previous && Math.abs(x - previous.x) < 0.25 && Math.abs(y - previous.y) < 0.25 ? stable + 1 : 0;
      if (stable >= 2) break;
      previous = { x, y };
      await pause(50);
    }
    assert.ok(stable >= 2, "Control did not settle before clicking: " + name);
    await cdp("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    await cdp("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    await pause(80);
  };
  const key = async (key, code, modifiers = 0) => {
    const virtualKey = { Escape: 27, Tab: 9, Enter: 13, a: 65 }[key] ?? 0;
    await cdp("Input.dispatchKeyEvent", {
      type: "keyDown",
      key,
      code,
      modifiers,
      windowsVirtualKeyCode: virtualKey,
      ...(key === "Enter" ? { text: "\r" } : {}),
    });
    await cdp("Input.dispatchKeyEvent", {
      type: "keyUp",
      key,
      code,
      modifiers,
      windowsVirtualKeyCode: virtualKey,
    });
    await pause(80);
  };
  const fill = async (value, selector = "#scan-input") => {
    await js(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    await key("a", "KeyA", 2);
    await cdp("Input.insertText", { text: value });
    await pause(80);
  };
  const screenshot = async (name) => {
    const image = await cdp("Page.captureScreenshot", { format: "png" });
    await writeFile(
      path.join(output, name + ".png"),
      Buffer.from(image.data, "base64"),
    );
  };
  const reload = async (suffix) => {
    await cdp("Page.navigate", { url: base + (suffix ?? "") });
    await until(
      'document.readyState === "complete" && !!document.querySelector("main h1")',
      "page ready",
    );
    await pause(250);
  };
  await mkdir(output, { recursive: true });
  await cdp("Runtime.enable");
  await cdp("Network.enable");
  await cdp("Page.enable");
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await reload();
  check(
    "Welcome has two clear starting actions and no account-risk metrics",
    await js(
      'document.body.innerText.includes("Start guided tour") && document.body.innerText.includes("Check my configuration") && !document.body.innerText.includes("95") && !document.body.innerText.includes("Paths still open")',
    ),
  );
  await screenshot("welcome-desktop");
  await key("Tab", "Tab");
  check(
    "Keyboard skip link is visible when focused",
    await js('document.activeElement.classList.contains("skip-link") && document.activeElement.getBoundingClientRect().left >= 0 && document.activeElement.getBoundingClientRect().top >= 0'),
  );
  await click("About this tool");
  check(
    "Dialog receives focus and makes background modal",
    await js(
      'document.querySelector("dialog[open]")?.contains(document.activeElement) && !!document.querySelector("dialog:modal")',
    ),
  );
  check(
    "Dialog is centered within the viewport",
    await js('(() => { const r = document.querySelector("dialog[open]").getBoundingClientRect(); return Math.abs(r.left + r.width / 2 - innerWidth / 2) < 2 && Math.abs(r.top + r.height / 2 - innerHeight / 2) < 2; })()'),
  );
  await key("Tab", "Tab");
  check(
    "Keyboard focus stays in dialog",
    await js(
      'document.querySelector("dialog[open]").contains(document.activeElement)',
    ),
  );
  await key("Escape", "Escape");
  check(
    "Escape closes dialog and restores its trigger",
    await js(
      '!document.querySelector("dialog[open]") && document.activeElement.innerText === "About this tool"',
    ),
  );
  await click("Start guided tour");
  check(
    "Example results are labeled as a sample",
    await js(
      'document.body.innerText.includes("Sample simulation") && document.body.innerText.includes("not your accounts")',
    ),
  );
  await screenshot("input-desktop");
  await click("Explore without guidance");
  await click("Understand possible exposure");
  check(
    "Step navigation focuses the new heading and changes history",
    await js(
      'document.activeElement.textContent === "Understand possible exposure" && location.search === "?step=2"',
    ),
  );
  await js("history.back()");
  await until(
    '!document.querySelectorAll("[data-step]")[0].hidden',
    "browser back",
  );
  check(
    "Browser Back returns to the same analysis",
    await js('document.body.innerText.includes("Sample simulation")'),
  );
  await js("history.forward()");
  await until(
    '!document.querySelectorAll("[data-step]")[1].hidden',
    "browser forward",
  );
  await screenshot("exposure-desktop");
  await click("Review recommended actions");
  check(
    "Remediation is explicitly unverified",
    await js(
      'document.body.innerText.includes("Remediation not verified") && !document.body.innerText.includes("Apply full plan")',
    ),
  );
  await click("Google — 6 review actions").catch(async () => {
    const label = await js(
      '[...document.querySelectorAll("section[data-step]")[2].querySelectorAll("summary")].find(e => e.innerText.startsWith("Google —"))?.innerText',
    );
    if (!label) throw new Error("Google checklist missing");
    await click(label);
  });
  await click("Mark this review action done");
  check(
    "Checklist records self-reported progress without claiming containment",
    await js(
      'document.body.innerText.includes("Marked done by you; verification pending") && document.body.innerText.includes("Remediation not verified")',
    ),
  );
  await click("Technical instructions and verification");
  await click("Record verification evidence");
  check(
    "Verification cannot be recorded without evidence",
    await js(
      'document.body.innerText.includes("Describe the result of the previously authorized operation")',
    ),
  );
  await fill(
    "Synthetic regression note: authentication rejected at previously authorized API, checked today.",
    "[id^=evidence-]",
  );
  await click("Record verification evidence");
  check(
    "Recorded evidence is explicitly self-reported",
    await js(
      'document.body.innerText.includes("Verification evidence recorded by you; not independently verified") && document.body.innerText.includes("Remediation not verified")',
    ),
  );
  await click("Preview the modeled outcome");
  await click("Preview expected outcome");
  check(
    "Full-plan preview is conditional and does not verify remediation",
    await js(
      'document.body.innerText.includes("conditional on successful cleanup") && document.body.innerText.includes("Actual remediation remains unverified")',
    ),
  );
  await screenshot("actions-desktop");
  await click("Prevent future overbroad app access");
  await click("Try consent demonstration");
  check(
    "Sandbox explains protection is not enabled",
    await js(
      'document.querySelector("dialog[open]").innerText.includes("browser protection is not enabled")',
    ),
  );
  await screenshot("consent-sandbox-desktop");
  await click("Review the example permissions");
  check(
    "Sandbox explains read-only mail remains sensitive",
    await js(
      'document.querySelector("dialog[open]").innerText.includes("Read-only email still exposes")',
    ),
  );
  await key("Escape", "Escape");
  check(
    "Sandbox preserves the active analysis",
    await js('document.body.innerText.includes("Sample simulation")'),
  );
  await click("Start over");
  await click("Check my configuration");
  const secret = "syntheticBrowserRegressionValueOnly";
  await fill("GITHUB_TOKEN=" + secret + "\nOPENAI_API_KEY=your_key_here");
  await click("Check configuration");
  check(
    "Custom results distinguish a real candidate from a placeholder",
    await js(
      'document.body.innerText.includes("1 permission or configuration finding") && document.body.innerText.includes("Placeholders and references (1)") && document.body.innerText.includes("Your supplied input")',
    ),
  );
  check(
    "Credential values do not appear in results or network requests",
    (await js(
      '!document.querySelector("[aria-label^=Results]").innerText.includes(' +
        JSON.stringify(secret) +
        ")",
    )) && !posts.some((request) => request.postData?.includes(secret)),
  );
  check(
    "Local analysis makes no automatic AI request",
    !posts.some((request) => request.url.includes("/api/ai-triage")),
  );
  await click("Understand possible exposure");
  await click("Back to input");
  check(
    "Input draft survives step navigation",
    await js(
      'document.querySelector("#scan-input").value.includes(' +
        JSON.stringify(secret) +
        ")",
    ),
  );
  await fill('{"invalid":');
  check(
    "Editing input clears prior findings and disables later steps",
    await js(
      '!document.querySelector("[aria-label^=Results]") && [...document.querySelectorAll("nav button")].slice(1).every(e => e.disabled)',
    ),
  );
  await click("Check configuration");
  check(
    "Invalid input announces an error and keeps results cleared",
    await js(
      '!!document.querySelector("[role=alert]") && document.querySelector("#scan-input").getAttribute("aria-invalid") === "true" && !document.querySelector("[aria-label^=Results]")',
    ),
  );
  const fixture = path.join(output, "example.env");
  await writeFile(fixture, "OPENAI_API_KEY=your_key_here");
  const document = await cdp("DOM.getDocument");
  const fileNode = await cdp("DOM.querySelector", {
    nodeId: document.root.nodeId,
    selector: "#configuration-file",
  });
  await cdp("DOM.setFileInputFiles", {
    nodeId: fileNode.nodeId,
    files: [fixture],
  });
  await until(
    'document.querySelector("#scan-input").value === "OPENAI_API_KEY=your_key_here"',
    "file loaded",
  );
  await click("Check configuration");
  check(
    "File selection works and placeholders do not invent credentials",
    await js(
      'document.body.innerText.includes("No recognized credentials or permissions found") && document.body.innerText.includes("example.env")',
    ),
  );
  await click("Plain-English review summary");
  await click("Optional AI prioritization");
  await click("Ask AI to prioritize this summary");
  await until(
    '!document.body.innerText.includes("Requesting optional")',
    "optional AI fallback",
  );
  const aiPost = posts.find((request) =>
    request.url.includes("/api/ai-triage"),
  );
  check(
    "Optional AI request contains only provider names and counts",
    !!aiPost &&
      Object.keys(JSON.parse(aiPost.postData)).sort().join() ===
        [
          "inputMode",
          "providers",
          "credentialCount",
          "scopeCount",
          "modeledNodes",
        ]
          .sort()
          .join(),
  );
  await click("App permission link");
  await fill(
    "https://accounts.google.com/o/oauth2/v2/auth?client_id=sample&scope=unlisted_permission",
  );
  await click("Check permissions");
  check(
    "Unknown permissions remain reviewable rather than declared safe",
    await js(
      'document.body.innerText.includes("unlisted_permission") && document.body.innerText.includes("not proof of safety")',
    ),
  );
  await cdp("Fetch.enable", {
    patterns: [{ urlPattern: "*/api/scan-repo", requestStage: "Request" }],
  });
  const nextRepoRequest = async () => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (pausedRepoRequests.length) return pausedRepoRequests.shift();
      await pause(50);
    }
    throw new Error("No repository request intercepted");
  };
  const longSource = "nested_configuration/".repeat(12) + ".env";
  const fixtureAnalysis = analyzeInput(
    {
      mode: "mcp_config",
      simulation_mode: "naive_single_revoke",
      raw_payload: "GITHUB_TOKEN=syntheticRepositoryCandidate",
    },
    longSource,
    "repository",
  );
  fixtureAnalysis.context.label = "owner/second";
  fixtureAnalysis.context.coverage = {
    inspected: [longSource],
    skipped: [longSource + ".local (unavailable)"],
    matchingFiles: 2,
    partial: true,
  };
  fixtureAnalysis.context.warnings = [
    "Some matching files were not inspected.",
  ];
  const fulfill = (requestId) =>
    cdp("Fetch.fulfillRequest", {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: "application/json" }],
      body: Buffer.from(
        JSON.stringify({
          ok: true,
          analysis: fixtureAnalysis,
          message: "1 selected file inspected; results are partial.",
        }),
      ).toString("base64"),
    });
  await click("Public repository");
  await fill("owner/first");
  await click("Check public repository");
  const staleRequest = await nextRepoRequest();
  check(
    "Repository check announces progress and offers cancellation",
    await js(
      'document.body.innerText.includes("Inspecting selected public") && document.body.innerText.includes("Cancel check")',
    ),
  );
  await click("Configuration file");
  await fulfill(staleRequest).catch(() => {});
  await pause(150);
  check(
    "Canceled repository responses do not overwrite the selected input",
    await js(
      'document.body.innerText.includes("Paste .env assignments") && !document.querySelector("[aria-label^=Results]")',
    ),
  );
  await click("Public repository");
  await fill("owner/second");
  await click("Check public repository");
  await fulfill(await nextRepoRequest());
  await until(
    '!!document.querySelector("[aria-label^=Results]")',
    "repository result",
  );
  check(
    "Repository results display partial coverage and preserve repository provenance",
    await js(
      'document.body.innerText.includes("Partial repository check") && document.body.innerText.includes("Inspected 1 of 2") && document.body.innerText.includes("owner/second") && document.body.innerText.includes("Source: nested_configuration/")',
    ),
  );
  await cdp("Fetch.disable");
  await screenshot("evidence-desktop");
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 320, height: 844, deviceScaleFactor: 1, mobile: true,
  });
  await click("View inspected and skipped files");
  check(
    "Long source and coverage paths wrap without clipping at 320px",
    await js(`(() => {
      const results = document.querySelector('[aria-label^="Results"]');
      const source = [...results.querySelectorAll('p')].find(e => e.textContent === ${JSON.stringify("Source: " + longSource)});
      const paths = [...results.querySelectorAll('li')].filter(e => /^(Inspected|Skipped):/.test(e.textContent));
      return source && paths.length === 2 && [source, ...paths].every(e => e.scrollWidth <= e.clientWidth + 1);
    })()`),
  );
  await screenshot("long-evidence-320");
  for (const width of [390, 320]) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await reload();
    check(
      "Welcome reflows at " + width + "px",
      await js("document.documentElement.scrollWidth <= innerWidth"),
    );
    await screenshot("welcome-" + width);
    await click("Start guided tour");
    check(
      "Analysis reflows at " + width + "px",
      await js("document.documentElement.scrollWidth <= innerWidth"),
    );
    await screenshot("input-" + width);
    await click("Explore without guidance");
    await click("Understand possible exposure");
    check(
      "Exposure reflows at " + width + "px",
      await js("document.documentElement.scrollWidth <= innerWidth"),
    );
    await screenshot("exposure-" + width);
    await click("Review recommended actions");
    check(
      "Actions reflow at " + width + "px",
      await js("document.documentElement.scrollWidth <= innerWidth"),
    );
    await screenshot("actions-" + width);
  }
  await reload(
    "/?oauth_url=" +
      encodeURIComponent(
        "https://github.com/login/oauth/authorize?client_id=sample&scope=repo&state=private-state",
      ),
  );
  check(
    "Deep-link intake analyzes input and removes OAuth parameters from current URL",
    await js(
      'document.body.innerText.includes("Your supplied input") && !location.search.includes("oauth_url") && document.body.innerText.includes("repo")',
    ),
  );
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await reload();
  await click("Start guided tour");
  check(
    "Example starts contextual guidance with the existing sample provenance",
    await js('!!document.querySelector("[data-walkthrough-step]") && document.body.innerText.includes("Sample simulation")'),
  );
  check(
    "Walkthrough opens as a visible fixed coachmark",
    await js('getComputedStyle(document.querySelector("[data-walkthrough-step]")).position === "fixed" && document.querySelector("[data-walkthrough-step]").getBoundingClientRect().width > 0 && document.querySelector("[role=progressbar]").getAttribute("aria-valuenow") === "1"'),
  );
  await screenshot("walkthrough-1-desktop");
  await click("Show me the evidence");
  check(
    "Guidance opens real supporting evidence and transfers keyboard focus to it",
    await js('document.activeElement.dataset.guideTarget === "evidence" && document.activeElement.getAttribute("aria-describedby") === "walkthrough-guide" && document.activeElement.closest("details").open'),
  );
  await click("Next: follow the exposure");
  check(
    "Guided next action advances the actual workflow and focuses its heading",
    await js('document.activeElement.textContent === "Understand possible exposure" && document.querySelector("[data-walkthrough-step]").dataset.walkthroughStep === "2" && document.querySelector("[role=progressbar]").getAttribute("aria-valuenow") === "2"'),
  );
  await click("Show me the exposure chain");
  check(
    "Guidance reveals the real conditional chain",
    await js('document.activeElement.dataset.guideTarget === "exposure" && document.activeElement.querySelectorAll("li").length > 1'),
  );
  await click("Next: review the actions");
  await click("Show me the first review action");
  check(
    "Guidance opens the applicable provider disclosure without claiming remediation",
    await js('document.activeElement.dataset.guideTarget === "actions" && document.activeElement.closest("details").open && document.body.innerText.includes("Remediation not verified")'),
  );
  await click("Mark this review action done");
  await click("Explore without guidance");
  await until(
    '!document.querySelector("[data-walkthrough-step]") && document.querySelector("[data-guide-target=actions] input[type=checkbox]")?.checked',
    "guidance exit",
  );
  check(
    "Exiting guidance preserves the analysis and self-reported action progress",
    await js('!document.querySelector("[data-walkthrough-step]") && document.querySelector("[data-guide-target=actions] input[type=checkbox]").checked && document.body.innerText.includes("Sample simulation")'),
  );
  await click("Resume walkthrough");
  await click("Next: follow the exposure");
  await click("Next: review the actions");
  check(
    "Resuming guidance does not reset reviewed actions",
    await js('document.querySelector("[data-guide-target=actions] input[type=checkbox]").checked'),
  );
  await click("Finish walkthrough");
  await until(
    '!!document.querySelector("[data-walkthrough-step=complete]")',
    "walkthrough complete",
  );
  check(
    "Walkthrough completion focuses the recap and leaves remediation unverified",
    await js('!!document.querySelector("[data-walkthrough-step=complete]") && document.activeElement.tagName === "H2" && document.body.innerText.includes("No account was changed or verified")'),
  );
  await screenshot("walkthrough-complete-desktop");
  await click("Check my configuration now");
  check(
    "Completion can start real input without carrying sample findings into it",
    await js('!!document.querySelector("#scan-input") && !document.querySelector("[aria-label^=Results]") && !document.querySelector("[data-walkthrough-step]")'),
  );
  await reload();
  await click("Start guided tour");
  await js('[...document.querySelectorAll("button")].find(button => button.textContent.trim() === "Next: follow the exposure").focus()');
  await key("Enter", "Enter");
  check(
    "Keyboard walkthrough navigation avoids movement animations",
    await js('document.activeElement.textContent === "Understand possible exposure" && document.querySelectorAll("[data-step]")[1].getAnimations().length === 0'),
  );
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await click("Show me the exposure chain");
  check(
    "Reduced-motion guidance keeps the chain usable without movement",
    await js('matchMedia("(prefers-reduced-motion: reduce)").matches && document.activeElement.dataset.guideTarget === "exposure" && document.querySelectorAll("[data-step]")[1].getAnimations().length === 0'),
  );
  await cdp("Emulation.setEmulatedMedia", { features: [] });
  for (const width of [390, 320]) {
    await cdp("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await reload();
    await click("Start guided tour");
    for (const next of ["Next: follow the exposure", "Next: review the actions", "Finish walkthrough"]) {
      const current = await js('document.querySelector("[data-walkthrough-step]").dataset.walkthroughStep');
      check(
        `Guidance and its controls reflow at ${width}px, step ${current}`,
        await js('document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll("[data-walkthrough-step] button")].every(button => { const r = button.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })'),
      );
      await screenshot(`walkthrough-${current}-${width}`);
      await click(next);
    }
  }
  check("No runtime or console errors", errors.length === 0);
  await writeFile(
    path.join(output, "results.json"),
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(
    `Verified ${checks.length} browser checks. Screenshots: ${output}`,
  );
} catch (error) {
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "results.json"), JSON.stringify({ checks, errors: [...errors, String(error)] }, null, 2));
  throw error;
} finally {
  socket?.close();
  chrome.kill("SIGTERM");
  await pause(150);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
