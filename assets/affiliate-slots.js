(function () {
  const slotAnchors = document.querySelectorAll("[data-affiliate-slot]");
  if (!slotAnchors.length) return;

  const track = (slotId, label) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "affiliate_click", {
        event_category: "affiliate",
        event_label: label || slotId,
        slot_id: slotId
      });
    }
  };

  fetch("/affiliate-slots.json", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (!data || !Array.isArray(data.slots)) return;
      const slots = new Map(data.slots.map((slot) => [slot.id, slot]));

      slotAnchors.forEach((anchor) => {
        const slotId = anchor.getAttribute("data-affiliate-slot");
        const slot = slots.get(slotId);
        if (!slot) return;

        anchor.addEventListener("click", () => track(slotId, anchor.textContent.trim()));

        if (!slot.approved_url) return;
        anchor.href = slot.approved_url;
        anchor.textContent = slot.cta_text || anchor.textContent;
        anchor.rel = "nofollow sponsored noopener";
        anchor.target = "_blank";

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
    .catch(() => {
      slotAnchors.forEach((anchor) => {
        anchor.addEventListener("click", () => track(anchor.getAttribute("data-affiliate-slot"), anchor.textContent.trim()));
      });
    });
})();
