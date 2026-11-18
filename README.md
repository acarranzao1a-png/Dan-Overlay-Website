# DanOverlay — Official Website

Source code for the official **[DanOverlay](https://danoverlay.pages.dev/)** website — the real-time Dan estimation overlay for **osu!mania** and **Etterna** (4K/7K), powered by the **ISOR 3.2** engine.

> **Looking for the application itself?**  
> Visit the main repository: **[acarranzao1a-png/Dan-Overlay](https://github.com/acarranzao1a-png/Dan-Overlay)**

---

## Links

- **Live Website:** https://danoverlay.pages.dev/
- **Main Program Repository:** https://github.com/acarranzao1a-png/Dan-Overlay
- **Latest Releases:** https://github.com/acarranzao1a-png/Dan-Overlay/releases

---

## What's Inside

This is a zero-dependency static site (vanilla HTML, CSS, and JavaScript):

- `index.html` — Landing page covering core architecture, interactive **ISOR 3.2** benchmark results, osu!mania & Etterna setup guide, overlay skin gallery, density chart previews, downloads, and changelog.
- `styles.css` — Styling, layout, responsive design, and animations.
- `script.js` — Interactive UI behavior, gallery/lightbox, tabs, and navigation.
- `benchmark-charts.js` — Interactive benchmark chart rendering.
- `benchmark-data.js` & `benchmarks.json` — Benchmark datasets used by the charts and tables.
- `images/` — Overlay skin previews, density graph screenshots, and Dan tier Greek letter insignia.

---

## Local Preview

No build step or package installation is required. You can open `index.html` directly in your browser or serve the directory locally:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

---

## Credits & License

- **Author:** 8DOUL (Discord: `agent_ale`)
- **Dan tier insignia & Greek letter designs:** `icyilc`
- **License:** [MIT](LICENSE)
