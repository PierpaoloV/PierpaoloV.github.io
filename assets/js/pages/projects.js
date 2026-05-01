import { renderErrorState, renderLoadingState, renderProjectsPage } from "../lib/portfolio-renderers.js";
import { fetchJson, indexById } from "../lib/site-data.js";

const mount = document.getElementById("projects-root");

async function boot() {
  renderLoadingState(mount, "Loading projects...");
  try {
    const [projects, skills, researchAreas] = await Promise.all([
      fetchJson(new URL("../../data/projects.json", import.meta.url)),
      fetchJson(new URL("../../data/skills.json", import.meta.url)),
      fetchJson(new URL("../../data/research-areas.json", import.meta.url))
    ]);
    skills.byId = indexById(skills.skills);
    renderProjectsPage({ mount, projects, skills, researchAreas });
  } catch (error) {
    console.error(error);
    renderErrorState(mount, "Unable to load the project catalog.");
  }
}

boot();
