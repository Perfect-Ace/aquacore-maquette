// Builds the demo for GitHub Pages and publishes it on the gh-pages branch.
// Usage: npm run deploy
import { execSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";

const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });

run("npx vite build", { env: { ...process.env, PAGES_BASE: "/aquacore-maquette/" } });
copyFileSync("dist/index.html", "dist/404.html"); // deep links (e.g. /admin/analyse) work after a reload
writeFileSync("dist/.nojekyll", "");

const remote = execSync("git remote get-url origin").toString().trim();
run("git init -q -b gh-pages", { cwd: "dist" });
run("git add -A", { cwd: "dist" });
run('git -c user.name="Perfect-Ace" -c user.email="noreply@github.com" commit -q -m "Publier la maquette"', { cwd: "dist" });
run(`git push -q -f ${remote} gh-pages`, { cwd: "dist" });
console.log("Publié : https://perfect-ace.github.io/aquacore-maquette/");
