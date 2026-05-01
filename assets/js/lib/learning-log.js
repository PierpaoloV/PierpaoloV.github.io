import { escapeHtml } from "./site-data.js";

function difficultyClass(difficulty) {
  return `learning-difficulty learning-difficulty--${difficulty.toLowerCase()}`;
}

function statusIcon(ok) {
  return ok
    ? '<span class="learning-status-icon learning-status-icon--done" aria-label="Done">&#10003;</span>'
    : '<span class="learning-status-icon learning-status-icon--pending" aria-label="Pending">&#9633;</span>';
}

function renderProgressBar({ pct, label, sublabel }) {
  return `
    <div class="learning-progress-row">
      <div class="learning-progress-copy">
        <span class="learning-progress-label">${escapeHtml(label)}</span>
        <span class="learning-progress-meta">${escapeHtml(sublabel)}</span>
      </div>
      <div class="learning-progress-track">
        <div class="learning-progress-fill" style="width: ${pct}%"></div>
      </div>
    </div>
  `;
}

async function fetchText(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return response.text();
  } catch {
    return null;
  }
}

function isSolved(content) {
  if (!content) {
    return false;
  }

  const lines = content
    .split("\n")
    .filter(
      (line) =>
        line.trim() &&
        !line.trim().startsWith("#") &&
        !line.startsWith("from ") &&
        !line.startsWith("import ") &&
        !line.startsWith("class ") &&
        !line.includes("Optional") &&
        !line.includes("List")
    );
  const body = lines.join("").replace(/\s/g, "");
  return body !== "" && !body.endsWith("pass") && !body.includes("Writeyoursolutionhere");
}

function isWritten(content) {
  if (!content) {
    return false;
  }
  return (
    content.trim().length > 80 &&
    !content.includes("Write your design here") &&
    !content.includes("Write your solution here")
  );
}

function parseGrade(content) {
  if (!content) {
    return null;
  }
  const match = content.match(/^Grade:\s*(\d+(?:\.\d+)?\/10)/im);
  return match ? match[1] : null;
}

function parseTakeHome(content) {
  if (!content) {
    return null;
  }
  const match = content.match(/^Take-home:\s*(.+)/im);
  return match ? match[1].trim() : null;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function fromIsoDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function currentWeekIndex(weekStarts) {
  const today = startOfLocalDay(new Date());
  let activeIndex = 0;
  weekStarts.forEach((weekStart, index) => {
    if (today >= startOfLocalDay(fromIsoDate(weekStart))) {
      activeIndex = index;
    }
  });
  return activeIndex;
}

async function fetchLearningState(config) {
  const rawBase = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/main`;
  const allProblems = config.weeks.flatMap((week) => week.problems);
  const allDesigns = config.weeks.map((week) => week.systemDesign).filter(Boolean);

  const problemStatuses = await Promise.all(
    allProblems.map(async (problem) => {
      const [solutionContent, reviewContent] = await Promise.all([
        fetchText(`${rawBase}/leetcode/${problem.slug}/solution.py`),
        fetchText(`${rawBase}/leetcode/${problem.slug}/review.md`)
      ]);
      return {
        slug: problem.slug,
        solved: isSolved(solutionContent),
        reviewed: Boolean(reviewContent),
        reviewContent
      };
    })
  );

  const designStatuses = await Promise.all(
    allDesigns.map(async (design) => {
      const content = await fetchText(`${rawBase}/system-design/${design.slug}/design.md`);
      return {
        slug: design.slug,
        written: isWritten(content)
      };
    })
  );

  return {
    problemStatusBySlug: Object.fromEntries(problemStatuses.map((status) => [status.slug, status])),
    designStatusBySlug: Object.fromEntries(designStatuses.map((status) => [status.slug, status]))
  };
}

function buildProgress(config, problemStatusBySlug) {
  const activeWeekIndex = currentWeekIndex(config.weekStarts);
  const activeWeek = config.weeks[activeWeekIndex];
  const allProblems = config.weeks.flatMap((week) => week.problems);
  const reviewedCount = allProblems.filter((problem) => problemStatusBySlug[problem.slug]?.reviewed).length;

  const activeSolved = activeWeek.problems.filter((problem) => problemStatusBySlug[problem.slug]?.solved).length;
  const totalSolved = allProblems.filter((problem) => problemStatusBySlug[problem.slug]?.solved).length;

  return {
    activeWeekIndex,
    activeWeekLabel: activeWeek.label,
    activeWeekSolved: activeSolved,
    activeWeekTotal: activeWeek.problems.length,
    activeWeekPct: activeWeek.problems.length > 0 ? Math.round((activeSolved / activeWeek.problems.length) * 100) : 0,
    totalSolved,
    totalProblems: allProblems.length,
    totalPct: allProblems.length > 0 ? Math.round((totalSolved / allProblems.length) * 100) : 0,
    reviewedCount
  };
}

function renderWeek(week, weekIndex, activeWeekIndex, problemStatusBySlug, designStatusBySlug, config) {
  const solvedCount = week.problems.filter((problem) => problemStatusBySlug[problem.slug]?.solved).length;
  const allSolved = solvedCount === week.problems.length && week.problems.length > 0;
  const weekState = allSolved ? "done" : solvedCount > 0 ? "active" : "pending";
  const isOpen = weekIndex === activeWeekIndex ? " open" : "";

  return `
    <details class="learning-week learning-week--${weekState}"${isOpen}>
      <summary class="learning-week-summary">
        <span class="learning-week-title">${escapeHtml(week.label)}</span>
        <span class="learning-week-meta">${solvedCount}/${week.problems.length} solved</span>
      </summary>
      <div class="learning-week-body">
        <div class="learning-section-label">LeetCode</div>
        <div class="learning-table-wrap">
          <table class="learning-table">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Difficulty</th>
                <th>Solved</th>
                <th>Reviewed</th>
              </tr>
            </thead>
            <tbody>
              ${week.problems
                .map((problem) => {
                  const status = problemStatusBySlug[problem.slug] || {};
                  const grade = parseGrade(status.reviewContent);
                  const takeHome = parseTakeHome(status.reviewContent);
                  return `
                    <tr>
                      <td>
                        <a href="https://github.com/${escapeHtml(config.owner)}/${escapeHtml(config.repo)}/tree/main/leetcode/${escapeHtml(problem.slug)}" target="_blank" rel="noopener">${escapeHtml(problem.title)}</a>
                        ${takeHome ? `<div class="learning-takeaway">${escapeHtml(takeHome)}</div>` : ""}
                      </td>
                      <td><span class="${difficultyClass(problem.difficulty)}">${escapeHtml(problem.difficulty)}</span></td>
                      <td class="learning-status-cell">${statusIcon(status.solved)}</td>
                      <td class="learning-status-cell">${statusIcon(status.reviewed)}${grade ? `<span class="learning-grade">${escapeHtml(grade)}</span>` : ""}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="learning-section-label">Flashcards</div>
        <p class="learning-copy"><strong>${week.cards.count} new cards</strong> - ${escapeHtml(week.cards.topics)}</p>

        <div class="learning-section-label">System Design</div>
        ${
          week.systemDesign
            ? `<p class="learning-copy"><a href="https://github.com/${escapeHtml(config.owner)}/${escapeHtml(config.repo)}/tree/main/system-design/${escapeHtml(week.systemDesign.slug)}" target="_blank" rel="noopener">${escapeHtml(week.systemDesign.title)}</a> ${statusIcon(designStatusBySlug[week.systemDesign.slug]?.written)}</p>`
            : '<p class="learning-copy">-</p>'
        }
      </div>
    </details>
  `;
}

function renderLearningMarkup(config, state) {
  const progress = buildProgress(config, state.problemStatusBySlug);

  return `
    <div class="learning-shell">
      <div class="learning-panel">
        <h2 class="learning-panel-title">Progress</h2>
        ${renderProgressBar({
          pct: progress.activeWeekPct,
          label: `This week - ${progress.activeWeekLabel}`,
          sublabel: `${progress.activeWeekSolved} / ${progress.activeWeekTotal} problems`
        })}
        ${renderProgressBar({
          pct: progress.totalPct,
          label: `Month 1 - ${config.monthLabel}`,
          sublabel: `${progress.totalSolved} / ${progress.totalProblems} problems · ${progress.reviewedCount} reviewed`
        })}
      </div>

      <details class="learning-year" open>
        <summary>${config.year}</summary>
        <div class="learning-year-body">
          <details class="learning-month" open>
            <summary>${escapeHtml(config.monthLabel)}</summary>
            <div class="learning-month-body">
              ${config.weeks
                .map((week, weekIndex) =>
                  renderWeek(
                    week,
                    weekIndex,
                    progress.activeWeekIndex,
                    state.problemStatusBySlug,
                    state.designStatusBySlug,
                    config
                  )
                )
                .join("")}
            </div>
          </details>
        </div>
      </details>
    </div>
  `;
}

export async function renderLearningLog(mount, config) {
  mount.innerHTML = '<p class="loading-state">Loading learning log...</p>';
  try {
    const state = await fetchLearningState(config);
    mount.innerHTML = renderLearningMarkup(config, state);
  } catch (error) {
    console.error(error);
    mount.innerHTML =
      '<p class="error-state">Unable to load the live learning log right now. The module depends on the external learning repository being reachable.</p>';
  }
}
