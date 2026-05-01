import { renderLearningLog } from "../lib/learning-log.js";
import { fetchJson } from "../lib/site-data.js";

const mount = document.getElementById("learning-root");

async function boot() {
  try {
    const config = await fetchJson(new URL("../../data/learning-log.json", import.meta.url));
    await renderLearningLog(mount, config);
  } catch (error) {
    console.error(error);
    mount.innerHTML = '<p class="error-state">Unable to load the learning log module.</p>';
  }
}

boot();
