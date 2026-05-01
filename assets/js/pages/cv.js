import { renderCvPage, renderErrorState, renderLoadingState } from "../lib/portfolio-renderers.js";
import { fetchJson, indexById } from "../lib/site-data.js";

const mount = document.getElementById("cv-root");

async function boot() {
  renderLoadingState(mount, "Loading CV...");
  try {
    const [cv, projects, skills, researchAreas] = await Promise.all([
      fetchJson(new URL("../../data/cv.json", import.meta.url)),
      fetchJson(new URL("../../data/projects.json", import.meta.url)),
      fetchJson(new URL("../../data/skills.json", import.meta.url)),
      fetchJson(new URL("../../data/research-areas.json", import.meta.url))
    ]);
    skills.byId = indexById(skills.skills);
    renderCvPage({ mount, cv, projects, skills, researchAreas });
  } catch (error) {
    console.error(error);
    renderErrorState(mount, "Unable to load the CV content.");
  }
}

boot();
