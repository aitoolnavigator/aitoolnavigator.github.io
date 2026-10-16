(function () {
  const slotAnchors = document.querySelectorAll("[data-affiliate-slot]");
  if (!slotAnchors.length) return;

  const approvedAnchors = new WeakSet();
  const track = (anchor) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", approvedAnchors.has(anchor) ? "affiliate_click" : "official_link_click", {
        slot_id: anchor.getAttribute("data-affiliate-slot"),
        program_id: anchor.getAttribute("data-affiliate-program") || "",
        page_path: window.location.pathname
      });
    }
  };

  // Keep click listeners working even when the slot configuration cannot load.
  slotAnchors.forEach((anchor) => {
    if (anchor.getAttribute("data-affiliate-approved") === anchor.getAttribute("data-affiliate-program") &&
        /^https:\/\/px\.a8\.net\/svt\/ejp\?/.test(anchor.href)) approvedAnchors.add(anchor);
    anchor.addEventListener("click", () => track(anchor));
  });

  fetch("/affiliate-slots.json", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (!data || !Array.isArray(data.slots)) return;
      const slots = new Map(data.slots.map((slot) => [slot.id, slot]));

      slotAnchors.forEach((anchor) => {
        const slotId = anchor.getAttribute("data-affiliate-slot");
        const slot = slots.get(slotId);
        if (!slot) return;

        if (!slot.approved_url) return;
        const programId = anchor.getAttribute("data-affiliate-program");
        if (programId && programId !== slot.approved_program_id) return;
        anchor.href = slot.approved_url;
        anchor.textContent = slot.cta_text || anchor.textContent;
        anchor.rel = "nofollow sponsored noopener";
        anchor.target = "_blank";
        approvedAnchors.add(anchor);

        if (slot.tracking_pixel && !document.querySelector(`img[data-affiliate-pixel="${slotId}"]`)) {
          const pixel = document.createElement("img");
          pixel.src = slot.tracking_pixel;
          pixel.width = 1;
          pixel.height = 1;
          pixel.alt = "";
          pixel.loading = "lazy";
          pixel.setAttribute("data-affiliate-pixel", slotId);
          pixel.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;";
          document.body.appendChild(pixel);
        }
      });
    })
    .catch(() => {});
})();
