// Layout audit: opens every screen and sheet at 260-412 px widths and reports overflow / clipping / overlaps; screenshots go to the temp folder.
// Run: npx vite build && npx vite preview --port 4173 (in another terminal), then: NODE_PATH=$(npm root -g) node tools/layout-audit.cjs  (needs Playwright)
const { chromium } = require("playwright");
const SP = require("os").tmpdir() + "/stayka-shots/"; require("fs").mkdirSync(SP, { recursive: true });
const sizes = [[260, 560], [280, 600], [320, 640], [360, 740], [412, 915]];
const zooms = [1];
const findings = [];
async function check(pg, label) {
  const r = await pg.evaluate(() => {
    const out = [], vw = innerWidth, vh = innerHeight;
    const de = document.documentElement;
    if (de.scrollWidth > vw + 1) out.push("page scrolls horizontally: " + de.scrollWidth + ">" + vw);
    const q = s => document.querySelector(s);
    const name = e => (e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).join(".") : "") + "[" + (e.textContent || "").trim().slice(0, 25).replace(/\s+/g, " ") + "]");
    const root = q(".sheet") || q("#app");
    // beyond viewport horizontally
    document.querySelectorAll("body *").forEach(e => {
      if (e.closest(".groups") || e.closest("svg") && e.tagName !== "svg") return;
      const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") return;
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
      if (e.closest("#toast") && !q("#toast").classList.contains("on")) return;
      if (r.right > vw + 1 || r.left < -1) out.push("outside viewport x: " + name(e) + " " + Math.round(r.left) + ".." + Math.round(r.right));
      // text clipped by own overflow
      if ((cs.overflowX === "hidden" || cs.overflowX === "clip") && e.scrollWidth > e.clientWidth + 2 && !e.classList.contains("fill") && e.tagName !== "BODY") out.push("clipped content: " + name(e) + " " + e.scrollWidth + ">" + e.clientWidth);
      // child escaping its card/sheet/button
      const p = e.parentElement; if (p && p !== document.body && p.id !== "app" && !p.closest(".groups") && p.tagName !== "svg") {
        const pr = p.getBoundingClientRect(), pc = getComputedStyle(p);
        if (pc.position !== "fixed" && !pc.overflowX.match(/auto|scroll/) && (r.right > pr.right + 2 || r.left < pr.left - 2) && cs.position !== "absolute" && !e.classList.contains("fill") && !p.matches(".gcard,.wheelbox")) out.push("child outside parent: " + name(e) + " in " + name(p));
      }
    });
    // wrapping inside single-line things
    document.querySelectorAll(".tab,.gchip,.btn,.chipbtn,.face").forEach(e => { const r = e.getBoundingClientRect(); if (r.width && e.scrollHeight > e.clientHeight + 3 && getComputedStyle(e).overflow !== "visible") out.push("text taller than box: " + name(e)); });
    // fixed UI overlapping
    const nav = q(".nav").getBoundingClientRect(), fab = q(".fab"), head = q(".head").getBoundingClientRect();
    if (fab) { const f = fab.getBoundingClientRect(); if (f.bottom > nav.top + 1) out.push("fab overlaps nav: " + Math.round(f.bottom) + ">" + Math.round(nav.top)); }
    const sh = q(".sheet"); if (sh) { const s = sh.getBoundingClientRect(); if (s.top < head.top - 1 || s.top < 0) out.push("sheet above screen: " + Math.round(s.top)); if (s.bottom > vh + 1) out.push("sheet below screen: " + Math.round(s.bottom)); }
    // last content vs nav (no sheet)
    if (!sh) { const m = q("main"), foot = q("#foot").getBoundingClientRect(); window.scrollTo(0, 1e6); const f2 = q("#foot").getBoundingClientRect(); if (f2.bottom > q(".nav").getBoundingClientRect().top + 1) out.push("foot hidden under nav: " + Math.round(f2.bottom) + ">" + Math.round(q(".nav").getBoundingClientRect().top)); window.scrollTo(0, 0); }
    // header height share of screen
    if (head.height > vh * .28) out.push("header too tall: " + Math.round(head.height) + " of " + vh);
    return out;
  });
  for (const m of [...new Set(r)]) findings.push(label + " :: " + m);
}
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of sizes) for (const z of zooms) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: "ru-RU", hasTouch: true, isMobile: true });
    const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", e => errs.push(String(e)));
    await pg.addInitScript(zz => { if (zz !== 1) document.addEventListener("DOMContentLoaded", () => { document.documentElement.style.zoom = zz; }); }, z);
    await pg.goto("http://localhost:4173/");
    const L = s => `${w}x${h}@${z} ${s}`;
    const snap = async n => { if (w === 320 || w === 360) await pg.screenshot({ path: SP + `${w}_${z}_${n}.png` }); };
    await check(pg, L("consent")); await snap("consent");
    
    await pg.evaluate(() => { const a = document.querySelector("#cAge"), d = document.querySelector("#cData"); if (!a.checked) a.click(); if (!d.checked) d.click(); }); await pg.evaluate(() => document.querySelector("#cGo").click());
    for (const tab of ["today", "lunch", "poll", "events", "games"]) { await pg.click(`[data-act="goto"][data-id="${tab}"]`); await check(pg, L(tab)); await snap(tab); }
    const sheets = [
      ["profile", async () => { await pg.click("#meBtn"); }],
      ["mydata", async () => { await pg.click("#meBtn"); await pg.click('[data-act="myData"]'); }],
      ["policy", async () => { await pg.click("#meBtn"); await pg.click('[data-act="policy"]'); }],
      ["newgroup", async () => { await pg.click("#gAdd"); }],
      ["group", async () => { await pg.click('[data-act="goto"][data-id="today"]'); await pg.click('[data-act="group"]:visible >> nth=0').catch(() => {}); }],
      ["lunch-sheet", async () => { await pg.click('[data-act="goto"][data-id="lunch"]'); await pg.click('[data-act="newLunch"] >> nth=0'); }],
      ["event-sheet", async () => { await pg.click('[data-act="goto"][data-id="events"]'); await pg.click('[data-act="newEvent"]'); }],
      ["wheel", async () => { await pg.click('[data-act="goto"][data-id="poll"]'); await pg.click('[data-act="wheel"]'); }],
      ["age", async () => { await pg.click('[data-act="goto"][data-id="games"]'); await pg.click(".tile >> nth=0"); }],
    ];
    for (const [n, f] of sheets) { try { await f(); await pg.waitForTimeout(120); await check(pg, L("sheet " + n)); await snap("s_" + n); await pg.keyboard.press("Escape"); await pg.waitForTimeout(80); } catch (e) { findings.push(L("sheet " + n) + " :: could not open: " + String(e).slice(0, 80)); await pg.keyboard.press("Escape"); } }
    // unlock adult and games
    await pg.click('[data-act="goto"][data-id="games"]'); await pg.click('[data-act="adultHome"]'); await pg.click('[data-act="ageYes"]'); await pg.waitForTimeout(100);
    if (await pg.locator(".sheet").count()) await pg.keyboard.press("Escape");
    await check(pg, L("games unlocked")); await snap("games_unlocked");
    for (const g of ["Викторина", "Объясняйка", "Я никогда", "Крокодил"]) { try { await pg.click(`.tile:has-text("${g}") >> nth=0`); await pg.waitForTimeout(100); await check(pg, L("game setup " + g)); await snap("g_" + g); if (await pg.locator('[data-act="gStart"]').count()) { await pg.click('[data-act="gStart"]'); await pg.waitForTimeout(150); await check(pg, L("game play " + g)); await snap("gp_" + g); } await pg.keyboard.press("Escape"); await pg.waitForTimeout(80); } catch (e) { findings.push(L("game " + g) + " :: " + String(e).slice(0, 80)); } }
    if (errs.length) findings.push(L("js errors") + " :: " + errs.join("|"));
    await ctx.close();
  }
  await b.close();
  const uniq = [...new Set(findings)].filter(f => !/div\.scrim|avFile/.test(f));
  console.log(uniq.length + " findings"); uniq.forEach(f => console.log(f));
})();
