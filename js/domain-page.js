document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".copy-btn[data-domain]").forEach(button => {
    button.addEventListener("click", async () => {
      const domain = button.getAttribute("data-domain") || "";
      try {
        await navigator.clipboard.writeText(domain);
        const prev = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => { button.textContent = prev; }, 1200);
      } catch (_err) {
        button.textContent = domain;
      }
    });
  });
});
