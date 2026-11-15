(() => {
  "use strict";
  // Fetch metadata only near the viewport, rather than opening all 44 videos.
  const videos = [...document.querySelectorAll("[data-lazy-video]")];
  const prepare = video => {
    if (video.dataset.prepared) return;
    video.dataset.prepared = "true";
    video.preload = "metadata";
    video.load();
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          prepare(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "400px 0px" });
    videos.forEach(video => observer.observe(video));
  } else {
    videos.forEach(prepare);
  }
  const button = document.querySelector("[data-copy-citation]");
  const citation = document.querySelector("#bibtex");
  const status = document.querySelector(".copy-status");
  if (button && citation && status) {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(citation.textContent.trim());
        status.textContent = "Copied";
      } catch {
        const range = document.createRange();
        range.selectNodeContents(citation);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = "Select and copy the citation";
      }
    });
  }
})();
