// The only hand-written client JS the landing ships (the FAQ accordion is a
// separate hydrated island). Handles: theme toggle, scroll-reveal, nav scroll
// shadow, and the mobile menu. Kept framework-free.

function initTheme() {
  const root = document.documentElement
  const apply = (dark: boolean) => {
    root.classList.toggle("dark", dark)
    document.querySelectorAll<HTMLElement>("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(dark))
    })
  }
  document.querySelectorAll<HTMLElement>("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dark = !root.classList.contains("dark")
      try {
        localStorage.setItem("wl_theme", dark ? "dark" : "light")
      } catch {
        /* private mode — ignore */
      }
      apply(dark)
    })
  })
  apply(root.classList.contains("dark"))
}

function initReveal() {
  const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"))
  if (!els.length) return
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"))
    return
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement
          const delay = Number(el.dataset.revealDelay || 0)
          window.setTimeout(() => el.classList.add("in"), delay)
          io.unobserve(el)
        }
      })
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  )
  els.forEach((el) => io.observe(el))
}

function initNav() {
  const header = document.querySelector<HTMLElement>("[data-nav]")
  if (header) {
    const onScroll = () => header.toggleAttribute("data-scrolled", window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
  }
  const toggle = document.querySelector<HTMLElement>("[data-menu-toggle]")
  const menu = document.querySelector<HTMLElement>("[data-mobile-menu]")
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.toggleAttribute("data-open")
      toggle.setAttribute("aria-expanded", String(open))
    })
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        menu.removeAttribute("data-open")
        toggle.setAttribute("aria-expanded", "false")
      })
    )
  }
}

function init() {
  initTheme()
  initReveal()
  initNav()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
