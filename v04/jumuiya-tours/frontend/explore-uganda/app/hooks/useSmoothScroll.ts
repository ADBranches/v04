import { useCallback } from "react";

export const useSmoothScroll = () => {
  return useCallback((id: string, offset = -80) => {
    // Allow delay if section isn't mounted yet
    requestAnimationFrame(() => {
      const section = document.getElementById(id);
      if (!section) {
        console.warn(`⚠️ Section with id="${id}" not found`);
        return;
      }

      const top = section.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  }, []);
};
