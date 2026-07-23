import { execSync } from 'child_process';
import fetch from 'node-fetch'; // if we need fetch, we can use native fetch since we are on node 22

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
    } else {
        console.log("GITHUB_TOKEN is present.");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
pushAndCreatePR();
