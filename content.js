/* ===========================
   YC VISIT TRACKER (WORKING)
=========================== */

function getCompanyIdFromUrl(url) {
  const match = url.match(/\/companies\/([^/?]+)/);
  return match ? match[1] : null;
}

function isDetailPage() {
  return window.location.pathname.includes("/companies/");
}

function isListPage() {
  return !isDetailPage();
}

/* ===========================
   STORE VISITED (PERSISTENT)
=========================== */

function markVisited() {
  const companyId = getCompanyIdFromUrl(window.location.href);
  if (!companyId) return;

  chrome.storage.local.get(["visited"], (res) => {
    const visited = res.visited || {};
    visited[companyId] = true;
    chrome.storage.local.set({ visited });
  });
}

/* ===========================
   RENDER DOTS ON LIST PAGE
=========================== */

function renderDots() {
  if (!isListPage()) return;

  chrome.storage.local.get(["visited"], (res) => {
    const visited = res.visited || {};

    // SELECT APPLY LINKS (not buttons)
    const applyLinks = Array.from(document.querySelectorAll("a")).filter(
      (a) => a.textContent.trim() === "Apply",
    );

    applyLinks.forEach((applyLink) => {
      // climb up until we find parent containing company link
      let parent = applyLink.parentElement;

      while (parent && !parent.querySelector("a[href^='/companies/']")) {
        parent = parent.parentElement;
      }

      if (!parent) return;

      const companyLink = parent.querySelector("a[href^='/companies/']");
      if (!companyLink) return;

      const companyId = getCompanyIdFromUrl(companyLink.href);
      if (!companyId) return;

      // prevent duplicate
      if (applyLink.parentElement.querySelector(".yc-dot")) return;

      const dot = document.createElement("span");
      dot.className = "yc-dot";

      dot.style.width = "10px";
      dot.style.height = "10px";
      dot.style.borderRadius = "50%";
      dot.style.display = "inline-block";
      dot.style.marginRight = "8px";

      if (visited[companyId]) {
        dot.style.backgroundColor = "#22c55e";
      } else {
        dot.style.backgroundColor = "#ffffff";
        dot.style.border = "1px solid #ccc";
      }

      applyLink.parentElement.insertBefore(dot, applyLink);
    });
  });
}

/* ===========================
   HANDLE NEXT.JS SPA
=========================== */

let lastUrl = location.href;

function handleRoute() {
  if (isDetailPage()) {
    markVisited();
  }

  if (isListPage()) {
    setTimeout(renderDots, 600);
  }
}

new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    handleRoute();
  }
}).observe(document, { childList: true, subtree: true });

// observe dynamic DOM updates
new MutationObserver(() => {
  renderDots();
}).observe(document.body, { childList: true, subtree: true });

// initial run
handleRoute();
