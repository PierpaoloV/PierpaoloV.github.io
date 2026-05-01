import { renderErrorState, renderLoadingState, renderPublicationsPage } from "../lib/portfolio-renderers.js";
import { fetchJson } from "../lib/site-data.js";

const mount = document.getElementById("publications-root");

async function boot() {
  renderLoadingState(mount, "Loading publications...");
  try {
    const [publications, researchAreas] = await Promise.all([
      fetchJson(new URL("../../data/publications.json", import.meta.url)),
      fetchJson(new URL("../../data/research-areas.json", import.meta.url))
    ]);
    renderPublicationsPage({ mount, publications, researchAreas });
  } catch (error) {
    console.error(error);
    renderErrorState(mount, "Unable to load the publications catalog.");
  }
}

boot();
