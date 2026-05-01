import { renderHomePage, renderErrorState, renderLoadingState } from "../lib/portfolio-renderers.js";
import { fetchJson, indexById } from "../lib/site-data.js";

const mount = document.getElementById("home-root");

async function boot() {
  renderLoadingState(mount, "Loading portfolio...");
  try {
    const [profile, researchAreas, skills] = await Promise.all([
      fetchJson(new URL("../../data/profile.json", import.meta.url)),
      fetchJson(new URL("../../data/research-areas.json", import.meta.url)),
      fetchJson(new URL("../../data/skills.json", import.meta.url))
    ]);
    skills.byId = indexById(skills.skills);
    renderHomePage({ mount, profile, researchAreas, skills });
  } catch (error) {
    console.error(error);
    renderErrorState(mount, "Unable to load the homepage content.");
  }
}

boot();
