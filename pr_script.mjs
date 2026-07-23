import { execSync } from 'child_process';

async function pushAndCreatePR() {
  try {
    const gitRemote = execSync('git config --get remote.origin.url', { cwd: 'gigahrush-npc-intake' }).toString().trim();
    // parse the repo owner and name from the git remote url
    let owner = "unknown";
    let repo = "unknown";

    // https://github.com/OWNER/REPO.git
    const match = gitRemote.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (match) {
      owner = match[1];
      repo = match[2];
    }

    console.log(`Repository: ${owner}/${repo}`);

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error("GITHUB_TOKEN is missing!");
        return;
    }

    const title = "🔒 Fix XSS vulnerability in review.html";
    const head = "jules-16244199217762136491-4581396a";
    const base = "main";
    const body = `🎯 What: The render loop in review.html was directly interpolating strings into innerHTML, which creates an XSS vulnerability even with the escapeHtml helper.
⚠️ Risk: If escapeHtml is bypassed or a field is rendered without it in the future, it could lead to arbitrary JavaScript execution in the moderator's browser context (Stored XSS), compromising review actions.
🛡️ Solution: Refactored the render loop to use DOM APIs (document.createElement and textContent) which naturally escape and safely handle text content, eliminating the innerHTML XSS vector entirely. Removed the now-redundant escapeHtml function.`;

    const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls`;

    // First we push the branch via GitHub API using git trees, but that's complex.
    // Is github_create_pull_request MCP tool available? No, we don't have it in memory explicitly unless we call a generic MCP.
    // Wait, the MCP instructions say: "If git push fails in a bash session with a blocking error, check for interactive prompts or use appropriate Git MCP operations rather than running it directly through run_in_bash_session."

  } catch (e) {
    console.error("Error:", e.message);
  }
}
pushAndCreatePR();
