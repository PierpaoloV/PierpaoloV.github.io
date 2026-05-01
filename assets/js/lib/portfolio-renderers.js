import { escapeHtml, indexById, joinDefined, renderInlineMarkdown } from "./site-data.js";

const profileLinkIcons = {
  github: '<i class="bi bi-github" aria-hidden="true"></i>',
  linkedin: '<i class="bi bi-linkedin" aria-hidden="true"></i>',
  scholar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3L2 8l10 5 8-4v6h2V8L12 3Z" fill="currentColor"></path><path d="M6 11.5v4.1c0 1.1 2.7 2.4 6 2.4s6-1.3 6-2.4v-4.1l-6 3-6-3Z" fill="currentColor" opacity="0.9"></path></svg>',
  orcid: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"></circle><rect x="7.1" y="9" width="1.6" height="6" rx="0.2" fill="#0f172a"></rect><circle cx="7.9" cy="7.1" r="0.95" fill="#0f172a"></circle><path d="M11 9h2.3a3.2 3.2 0 1 1 0 6.4H11V9Zm1.6 1.5v3.4h.6a1.7 1.7 0 1 0 0-3.4h-.6Z" fill="#0f172a"></path></svg>',
  email: '<i class="bi bi-envelope-fill" aria-hidden="true"></i>'
};

const researchAreaIcons = {
  "computational-pathology":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8.5" cy="9" r="4.3"></circle><circle cx="15.5" cy="14.5" r="3.3"></circle><circle cx="9.5" cy="17" r="1.8"></circle></svg>',
  "clinical-ai-systems":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="6" r="1.9"></circle><circle cx="19" cy="6" r="1.9"></circle><circle cx="12" cy="18" r="1.9"></circle><path d="M7 6 L17 6"></path><path d="M6.5 7.5 L10.7 16.3"></path><path d="M17.5 7.5 L13.3 16.3"></path></svg>',
  "llm-agents-automation":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 L13.6 9.2 L20 10.5 L13.6 11.8 L12 18 L10.4 11.8 L4 10.5 L10.4 9.2 Z"></path><circle cx="18.5" cy="17.5" r="1" fill="currentColor" stroke="none"></circle><circle cx="5.5" cy="16" r="0.8" fill="currentColor" stroke="none"></circle></svg>'
};

function isExternalHref(href) {
  return /^(https?:|mailto:)/.test(href);
}

function renderButton(link) {
  const variantClass = link.variant === "primary" ? "btn-primary-custom" : "btn-secondary-custom";
  const sizeClass = link.size === "sm" ? " btn-sm" : "";
  const externalAttrs = isExternalHref(link.href) ? ' target="_blank" rel="noopener"' : "";
  return `<a class="${variantClass}${sizeClass}" href="${escapeHtml(link.href)}"${externalAttrs}>${escapeHtml(link.label)}</a>`;
}

function renderProfileLink(link) {
  const iconMarkup = profileLinkIcons[link.icon] || "";
  return `<a class="hero-icon-link" href="${escapeHtml(link.href)}" target="_blank" rel="noopener" aria-label="${escapeHtml(link.label)}">${iconMarkup}</a>`;
}

function renderTopicBadges(areaIds, areasById) {
  if (!areaIds || areaIds.length === 0) {
    return "";
  }
  return `<div class="record-taxonomy">${areaIds
    .map((areaId) => {
      const area = areasById[areaId];
      if (!area) {
        return "";
      }
      return `<span class="topic-badge">${escapeHtml(area.title)}</span>`;
    })
    .join("")}</div>`;
}

function renderTechLine(skillIds, skillById) {
  if (!skillIds || skillIds.length === 0) {
    return "";
  }
  const labels = skillIds
    .map((skillId) => skillById[skillId]?.label)
    .filter(Boolean)
    .map(escapeHtml)
    .join(" · ");
  return `<p class="record-tech"><strong>Tech:</strong> ${labels}</p>`;
}

function renderProjectLinks(links) {
  if (!links || links.length === 0) {
    return "";
  }
  return `<div class="record-actions">${links
    .map((link) => renderButton({ ...link, variant: link.variant || "secondary", size: "sm" }))
    .join("")}</div>`;
}

function renderPublicationTypeTags(typeTags) {
  if (!typeTags || typeTags.length === 0) {
    return "";
  }
  return typeTags
    .map((tag) => `<span class="pub-type pub-type-${escapeHtml(tag.variant)}">${escapeHtml(tag.label)}</span>`)
    .join("");
}

function renderParagraphs(paragraphs, className) {
  return `<div class="${className}">${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>`;
}

function resolveProjectTitleLink(project) {
  const githubLink = project.links.find((link) => link.label === "GitHub");
  if (!githubLink) {
    return escapeHtml(project.title);
  }
  return `<a href="${escapeHtml(githubLink.href)}" target="_blank" rel="noopener">${escapeHtml(project.title)}</a>`;
}

function injectProfileSchema(profile) {
  const existing = document.getElementById("profile-schema-jsonld");
  if (existing) {
    existing.remove();
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: profile.schema.url,
    image: profile.schema.image,
    jobTitle: profile.schema.jobTitle,
    description: profile.schema.description,
    worksFor: {
      "@type": "Organization",
      name: profile.schema.worksFor.name
    },
    alumniOf: profile.schema.alumniOf.map((entry) => ({
      "@type": "CollegeOrUniversity",
      name: entry.name
    })),
    sameAs: profile.schema.sameAs,
    knowsAbout: profile.schema.knowsAbout
  };

  const script = document.createElement("script");
  script.id = "profile-schema-jsonld";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

export function renderLoadingState(mount, label = "Loading...") {
  mount.innerHTML = `<p class="loading-state">${escapeHtml(label)}</p>`;
}

export function renderErrorState(mount, label) {
  mount.innerHTML = `<p class="error-state">${escapeHtml(label)}</p>`;
}

export function renderHomePage({ mount, profile, researchAreas, skills }) {
  const featuredGroups = skills.groups.filter((group) => group.featured);
  injectProfileSchema(profile);

  mount.innerHTML = `
    <div class="site-shell">
      <section class="hero">
        <div class="container">
          <div class="hero-inner">
            <div class="hero-text">
              <div class="hero-name">${escapeHtml(profile.name)}</div>
              <div class="subtitle">${escapeHtml(profile.title)}</div>
              <div class="location">${escapeHtml(profile.location)}</div>
              ${profile.summary.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
              <p class="hero-open-to"><strong>${escapeHtml(profile.openTo)}</strong> ${escapeHtml(profile.milestone)}</p>
              <div class="cta-buttons">
                ${renderButton(profile.primaryLink)}
                <div class="hero-links" aria-label="External profiles and contact">
                  ${profile.links.map((link) => renderProfileLink(link)).join("")}
                </div>
              </div>
            </div>
            <div class="hero-photo">
              <img class="profile-photo" src="${escapeHtml(profile.photo)}" alt="${escapeHtml(profile.name)}">
            </div>
          </div>
        </div>
      </section>

      <section class="page-section">
        <h2 class="section-heading">Research Interests</h2>
        <div class="row">
          ${researchAreas
            .map(
              (area) => `
                <div class="col-md-4">
                  <div class="section-card">
                    <div class="card-icon">${researchAreaIcons[area.id] || ""}</div>
                    <h3>${escapeHtml(area.title)}</h3>
                    <p>${escapeHtml(area.summary)}</p>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="page-section">
        <h2 class="section-heading">Selected Skills</h2>
        ${featuredGroups
          .map((group) => {
            const labels = group.skills
              .map((skillId) => skills.byId[skillId]?.label)
              .filter(Boolean);
            return `
              <div class="skill-group">
                <div class="skill-group-label">${escapeHtml(group.label)}</div>
                <div class="skill-group-badges">
                  ${labels.map((label) => `<span class="skill-badge">${escapeHtml(label)}</span>`).join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </section>
    </div>
  `;
}

export function renderCvPage({ mount, cv, projects, skills, researchAreas }) {
  const areasById = indexById(researchAreas);
  const projectsById = indexById(projects);

  const skillsRows = cv.skillGroupIds
    .map((groupId) => skills.groups.find((group) => group.id === groupId))
    .filter(Boolean)
    .map(
      (group) => `
        <tr>
          <th scope="row">${escapeHtml(group.label)}</th>
          <td>${group.skills
            .map((skillId) => skills.byId[skillId]?.label)
            .filter(Boolean)
            .map(escapeHtml)
            .join(" · ")}</td>
        </tr>
      `
    )
    .join("");

  const selectedProjects = cv.selectedProjectIds
    .map((projectId) => projectsById[projectId])
    .filter(Boolean)
    .map(
      (project) => `
        <li class="cv-project-item">
          <strong>${resolveProjectTitleLink(project)} (${escapeHtml(project.cvPeriod || project.period || "")})</strong>
          <p>${escapeHtml(project.cvSummary || project.summary[0])}</p>
        </li>
      `
    )
    .join("");

  mount.innerHTML = `
    <div class="site-shell section-stack">
      <div class="resume-links">
        ${cv.resumeLinks.map((link) => renderButton(link)).join("")}
      </div>

      <section class="cv-section">
        <h2>Experience</h2>
        ${cv.experience
          .map(
            (entry) => `
              <div class="cv-entry">
                <div class="cv-date">${escapeHtml(entry.date)}</div>
                <div class="cv-content">
                  <strong>${escapeHtml(entry.role)}</strong>
                  <em>${escapeHtml(joinDefined([entry.organization, entry.location]))}</em>
                  ${renderTopicBadges(entry.focusAreaIds, areasById).replace('record-taxonomy', 'cv-focus-areas')}
                  <ul>
                    ${entry.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
                  </ul>
                </div>
              </div>
            `
          )
          .join("")}
      </section>

      <section class="cv-section">
        <h2>Education</h2>
        ${cv.education
          .map(
            (entry) => `
              <div class="cv-entry">
                <div class="cv-date">${escapeHtml(entry.date)}</div>
                <div class="cv-content">
                  <strong>${escapeHtml(entry.degree)}</strong>
                  <em>${escapeHtml(joinDefined([entry.organization, entry.location]))}</em>
                  ${entry.details ? `<p>${escapeHtml(entry.details)}</p>` : ""}
                </div>
              </div>
            `
          )
          .join("")}
      </section>

      <section class="cv-section">
        <h2>Skills</h2>
        <table class="table table-sm cv-skills-table">
          <thead>
            <tr>
              <th scope="col">Track</th>
              <th scope="col">Technologies</th>
            </tr>
          </thead>
          <tbody>${skillsRows}</tbody>
        </table>
      </section>

      <section class="cv-section">
        <h2>Selected Projects</h2>
        <ul class="cv-project-list">${selectedProjects}</ul>
      </section>

      <section class="cv-section">
        <h2>Publications</h2>
        <p class="cv-note">
          ${escapeHtml(cv.publicationNote.text).replace(
            escapeHtml(cv.publicationNote.label),
            `<a href="${escapeHtml(cv.publicationNote.href)}">${escapeHtml(cv.publicationNote.label)}</a>`
          )}
        </p>
      </section>
    </div>
  `;
}

export function renderPublicationsPage({ mount, publications, researchAreas }) {
  const areasById = indexById(researchAreas);

  mount.innerHTML = `
    <div class="site-shell">
      ${publications
        .map((publication) => {
          const titleMarkup = publication.href
            ? `<a href="${escapeHtml(publication.href)}" target="_blank" rel="noopener">${escapeHtml(publication.title)}</a>`
            : escapeHtml(publication.title);
          const venueLabel = joinDefined([publication.venue, publication.period]);
          return `
            <article class="pub-entry">
              <div class="pub-venue">${renderPublicationTypeTags(publication.typeTags)}${escapeHtml(venueLabel)}</div>
              <div class="pub-title">${titleMarkup}</div>
              <div class="pub-authors">${renderInlineMarkdown(publication.authors)}</div>
              <div class="pub-summary"><p>${escapeHtml(publication.summary)}</p></div>
              ${renderTopicBadges(publication.areaIds, areasById)}
              ${renderProjectLinks(publication.links || [])}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

export function renderProjectsPage({ mount, projects, skills, researchAreas }) {
  const areasById = indexById(researchAreas);

  mount.innerHTML = `
    <div class="site-shell">
      ${projects
        .map((project) => {
          const venueLabel = joinDefined([project.category, project.organization, project.period]);
          return `
            <article class="pub-entry">
              <div class="pub-venue">${escapeHtml(venueLabel)}</div>
              <div class="pub-title">${escapeHtml(project.title)}</div>
              ${renderParagraphs(project.summary, "pub-meta")}
              ${renderTopicBadges(project.areaIds, areasById)}
              ${renderTechLine(project.techSkillIds, skills.byId)}
              ${renderProjectLinks(project.links || [])}
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}
