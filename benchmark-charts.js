/**
 * DanOverlay — Interactive Native Benchmark Visualizations (benchmark-charts.js)
 * 100% Native HTML5 Canvas & SVG — Zero External Dependencies, Zero PNG Images.
 * Lightweight, interactive, high-DPI retina ready.
 */

(function () {
  'use strict';

  const PATTERN_COLORS = {
    jack: '#e8853a',
    speed: '#5b9cf5',
    tech: '#9d7cf5',
    stamina: '#3ec9b4',
    other: '#808da4',
  };

  const BAND_COLORS = {
    exact: '#34d399',    // <= 0.20
    close: '#5b9cf5',    // <= 0.50
    moderate: '#e8853a', // <= 1.00
    miss: '#f87171',     // > 1.00
  };

  /* ─────────────────────────────────────────────────────────────
     1. SCATTER PLOT CONTROLLER (Canvas)
     ───────────────────────────────────────────────────────────── */
  function initScatterPlot() {
    const canvas = document.getElementById('bm-scatter-canvas');
    if (!canvas || !window.BENCHMARK_SCATTER_DATA) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    const tooltip = document.getElementById('bm-scatter-tooltip');
    const filterBtns = document.querySelectorAll('[data-scatter-filter]');

    let activeFilter = 'all';
    let hoveredPoint = null;
    let width = 0, height = 0;
    const padding = { top: 30, right: 30, bottom: 45, left: 55 };

    const minVal = 0.5;
    const maxVal = 18.5;

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = Math.max(380, Math.min(520, width * 0.58));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      draw();
    }

    function toScreenX(val) {
      const plotW = width - padding.left - padding.right;
      return padding.left + ((val - minVal) / (maxVal - minVal)) * plotW;
    }

    function toScreenY(val) {
      const plotH = height - padding.top - padding.bottom;
      return padding.top + (1 - (val - minVal) / (maxVal - minVal)) * plotH;
    }

    function draw() {
      if (!width || !height) return;

      ctx.clearRect(0, 0, width, height);

      const plotL = padding.left;
      const plotR = width - padding.right;
      const plotT = padding.top;
      const plotB = height - padding.bottom;

      // ── Background
      ctx.fillStyle = '#0c0c16';
      ctx.fillRect(plotL, plotT, plotR - plotL, plotB - plotT);

      // ── Shaded Tolerance Corridors (Close ±0.50 & Exact ±0.20)
      ctx.save();
      ctx.beginPath();
      ctx.rect(plotL, plotT, plotR - plotL, plotB - plotT);
      ctx.clip();

      // ±0.50 corridor (Close)
      ctx.beginPath();
      ctx.moveTo(toScreenX(minVal), toScreenY(minVal + 0.5));
      ctx.lineTo(toScreenX(maxVal), toScreenY(maxVal + 0.5));
      ctx.lineTo(toScreenX(maxVal), toScreenY(maxVal - 0.5));
      ctx.lineTo(toScreenX(minVal), toScreenY(minVal - 0.5));
      ctx.closePath();
      ctx.fillStyle = 'rgba(91, 156, 245, 0.07)';
      ctx.fill();

      // ±0.20 corridor (Exact)
      ctx.beginPath();
      ctx.moveTo(toScreenX(minVal), toScreenY(minVal + 0.2));
      ctx.lineTo(toScreenX(maxVal), toScreenY(maxVal + 0.2));
      ctx.lineTo(toScreenX(maxVal), toScreenY(maxVal - 0.2));
      ctx.lineTo(toScreenX(minVal), toScreenY(minVal - 0.2));
      ctx.closePath();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.10)';
      ctx.fill();

      // ── Grid Lines
      ctx.lineWidth = 1;
      ctx.font = '10px "SF Mono", monospace';
      ctx.fillStyle = '#4a5568';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let t = 2; t <= 18; t += 2) {
        const x = toScreenX(t);
        const y = toScreenY(t);

        // Vertical grid line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.moveTo(x, plotT);
        ctx.lineTo(x, plotB);
        ctx.stroke();

        // Horizontal grid line
        ctx.beginPath();
        ctx.moveTo(plotL, y);
        ctx.lineTo(plotR, y);
        ctx.stroke();

        // X Axis labels
        ctx.fillText(t + 'D', x, plotB + 8);

        // Y Axis labels
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(t + 'D', plotL - 8, y);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      }

      // ── Identity Line (y = x)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(toScreenX(minVal), toScreenY(minVal));
      ctx.lineTo(toScreenX(maxVal), toScreenY(maxVal));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      // ── Axis Borders
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(plotL, plotT, plotR - plotL, plotB - plotT);

      // ── Axis Titles
      ctx.fillStyle = '#808da4';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ground Truth Expected Dan (Official Consensus)', (plotL + plotR) / 2, height - 12);

      ctx.save();
      ctx.translate(14, (plotT + plotB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('ISOR Estimated Dan (Calculated)', 0, 0);
      ctx.restore();

      // ── Points Plotting
      const points = window.BENCHMARK_SCATTER_DATA;
      for (let i = 0; i < points.length; i++) {
        const pt = points[i]; // [exp, got, pattern, name]
        const exp = pt[0];
        const got = pt[1];
        const pat = pt[2];

        if (activeFilter !== 'all' && pat !== activeFilter && !(activeFilter === 'other' && !['jack', 'speed', 'tech', 'stamina'].includes(pat))) {
          continue;
        }

        const sx = toScreenX(exp);
        const sy = toScreenY(got);
        const delta = Math.abs(got - exp);

        // Color by accuracy band
        let color = BAND_COLORS.miss;
        if (delta <= 0.20) color = BAND_COLORS.exact;
        else if (delta <= 0.50) color = BAND_COLORS.close;
        else if (delta <= 1.00) color = BAND_COLORS.moderate;

        ctx.beginPath();
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.82;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // ── Hover Highlight & Crosshairs
      if (hoveredPoint) {
        const hx = toScreenX(hoveredPoint[0]);
        const hy = toScreenY(hoveredPoint[1]);

        ctx.save();
        ctx.strokeStyle = 'rgba(91, 156, 245, 0.6)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hx, plotB);
        ctx.lineTo(hx, hy);
        ctx.lineTo(plotL, hy);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(hx, hy, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#5b9cf5';
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── Mouse & Touch Handling
    function handlePointer(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      if (mx < padding.left || mx > width - padding.right || my < padding.top || my > height - padding.bottom) {
        if (hoveredPoint) {
          hoveredPoint = null;
          if (tooltip) tooltip.style.display = 'none';
          draw();
        }
        return;
      }

      let closest = null;
      let minDistance = 18; // px radius
      const points = window.BENCHMARK_SCATTER_DATA;

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const pat = pt[2];
        if (activeFilter !== 'all' && pat !== activeFilter && !(activeFilter === 'other' && !['jack', 'speed', 'tech', 'stamina'].includes(pat))) {
          continue;
        }

        const sx = toScreenX(pt[0]);
        const sy = toScreenY(pt[1]);
        const dist = Math.hypot(mx - sx, my - sy);
        if (dist < minDistance) {
          minDistance = dist;
          closest = pt;
        }
      }

      if (closest !== hoveredPoint) {
        hoveredPoint = closest;
        draw();

        if (closest && tooltip) {
          const exp = closest[0];
          const got = closest[1];
          const pat = closest[2];
          const name = closest[3];
          const delta = got - exp;
          const absDelta = Math.abs(delta);

          let bandLabel = 'Exact ≤0.20';
          let bandClass = 'bm-tag-exact';
          if (absDelta > 1.0) { bandLabel = 'Miss >1.00'; bandClass = 'bm-tag-miss'; }
          else if (absDelta > 0.5) { bandLabel = 'Moderate ≤1.00'; bandClass = 'bm-tag-moderate'; }
          else if (absDelta > 0.2) { bandLabel = 'Close ≤0.50'; bandClass = 'bm-tag-close'; }

          tooltip.innerHTML = `
            <div class="bm-tt-head">
              <span class="bm-tt-title">${escapeHtml(name)}</span>
              <span class="bm-tt-pat" style="background:${PATTERN_COLORS[pat] || '#808da4'}22; color:${PATTERN_COLORS[pat] || '#808da4'}; border-color:${PATTERN_COLORS[pat] || '#808da4'}55;">${pat.toUpperCase()}</span>
            </div>
            <div class="bm-tt-grid">
              <div><span>Expected</span><b>${exp.toFixed(2)} Dan</b></div>
              <div><span>Estimated</span><b>${got.toFixed(2)} Dan</b></div>
              <div><span>Error Delta</span><b style="color:${delta >= 0 ? '#34d399' : '#f87171'}">${delta >= 0 ? '+' : ''}${delta.toFixed(2)}</b></div>
              <div><span>Fit Band</span><span class="bm-tt-band ${bandClass}">${bandLabel}</span></div>
            </div>
          `;

          const sx = toScreenX(exp);
          const sy = toScreenY(got);
          const tooltipWidth = 240;
          let ttLeft = sx + 14;
          let ttTop = sy - 40;

          if (ttLeft + tooltipWidth > width - 10) ttLeft = sx - tooltipWidth - 14;
          if (ttTop < 10) ttTop = 10;
          if (ttTop > height - 120) ttTop = height - 120;

          tooltip.style.left = ttLeft + 'px';
          tooltip.style.top = ttTop + 'px';
          tooltip.style.display = 'block';
        } else if (tooltip) {
          tooltip.style.display = 'none';
        }
      }
    }

    canvas.addEventListener('mousemove', e => handlePointer(e.clientX, e.clientY));
    canvas.addEventListener('mouseleave', () => {
      hoveredPoint = null;
      if (tooltip) tooltip.style.display = 'none';
      draw();
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeFilter = btn.getAttribute('data-scatter-filter') || 'all';
        hoveredPoint = null;
        if (tooltip) tooltip.style.display = 'none';
        draw();
      });
    });

    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(() => resize());
    observer.observe(container);
    resize();
  }

  /* ─────────────────────────────────────────────────────────────
     2. DELTA ERROR DISTRIBUTION CHART CONTROLLER (Canvas)
     ───────────────────────────────────────────────────────────── */
  function initDeltaDistribution() {
    const canvas = document.getElementById('bm-delta-canvas');
    if (!canvas || !window.BENCHMARK_DELTA_DATA) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    const engineBtns = document.querySelectorAll('[data-delta-engine]');
    const statCards = document.getElementById('bm-delta-stats');

    let activeEngine = 'ISOR';
    let width = 0, height = 0;
    const padding = { top: 25, right: 25, bottom: 40, left: 50 };

    const binLabels = ['<-0.8', '-0.7', '-0.5', '-0.3', '-0.1', '+0.1', '+0.3', '+0.5', '+0.7', '>+0.8'];

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = Math.max(280, Math.min(360, width * 0.45));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      draw();
    }

    function updateStats() {
      if (!statCards) return;
      const data = window.BENCHMARK_DELTA_DATA[activeEngine];
      if (!data) return;

      // Valores publicados (snapshot benchmarks.json) para que las stat cards
      // coincidan con las tablas del sitio; los histogramas usan los crudos.
      const pub = data.published || null;
      const n = pub ? pub.n : data.n;
      const mae = pub ? pub.mae : data.mae;
      const exactPct = pub ? pub.exact_pct
        : (((data.counts[4] || 0) + (data.counts[5] || 0)) / (data.n || 1)) * 100;
      const closePct = pub ? pub.close_pct
        : (((data.counts[4] || 0) + (data.counts[5] || 0) + (data.counts[3] || 0) + (data.counts[6] || 0)) / (data.n || 1)) * 100;

      statCards.innerHTML = `
        <div class="bm-dstat"><span>Evaluated Maps</span><b>${n} maps</b></div>
        <div class="bm-dstat"><span>Mean Absolute Error</span><b style="color:#5b9cf5">${mae.toFixed(4)}</b></div>
        <div class="bm-dstat"><span>Mean Bias</span><b>${data.bias >= 0 ? '+' : ''}${data.bias.toFixed(4)}</b></div>
        <div class="bm-dstat"><span>Exact (≤0.20)</span><b style="color:#34d399">${exactPct.toFixed(1)}%</b></div>
        <div class="bm-dstat"><span>Close (≤0.50)</span><b style="color:#5b9cf5">${closePct.toFixed(1)}%</b></div>
      `;
    }

    function draw() {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);

      const plotL = padding.left;
      const plotR = width - padding.right;
      const plotT = padding.top;
      const plotB = height - padding.bottom;
      const plotW = plotR - plotL;
      const plotH = plotB - plotT;

      // ── Background
      ctx.fillStyle = '#0c0c16';
      ctx.fillRect(plotL, plotT, plotW, plotH);

      // Scale the axis to the data instead of a fixed ceiling: with the full 1262-map
// pool a single bin can exceed 400, and a hardcoded 180 clipped the bars.
const allCounts = Object.values(window.BENCHMARK_DELTA_DATA || {})
  .flatMap(d => d.counts || []);
const peak = allCounts.length ? Math.max(...allCounts) : 40;
const maxCount = Math.max(40, Math.ceil((peak * 1.15) / 40) * 40);

      // ── Grid & Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.font = '10px "SF Mono", monospace';
      ctx.fillStyle = '#4a5568';

      for (let c = 0; c <= maxCount; c += 40) {
        const y = plotB - (c / maxCount) * plotH;
        ctx.beginPath();
        ctx.moveTo(plotL, y);
        ctx.lineTo(plotR, y);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(c, plotL - 8, y);
      }

      // Zero Error Center Guide
      const centerX = plotL + (5 / 10) * plotW;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(centerX, plotT);
      ctx.lineTo(centerX, plotB);
      ctx.stroke();
      ctx.setLineDash([]);

      const data = window.BENCHMARK_DELTA_DATA[activeEngine];
      if (!data) return;

      const barGap = 6;
      const barWidth = (plotW / 10) - barGap;

      // Draw Bars
      for (let i = 0; i < 10; i++) {
        const count = data.counts[i] || 0;
        const barH = (count / maxCount) * plotH;
        const x = plotL + i * (plotW / 10) + barGap / 2;
        const y = plotB - barH;

        // Color highlight near 0 (bins 4 and 5 are -0.1 and +0.1 -> within ±0.2)
        let fillColor = 'rgba(91, 156, 245, 0.55)';
        let strokeColor = 'rgba(91, 156, 245, 0.95)';
        if (i === 4 || i === 5) {
          fillColor = 'rgba(52, 211, 153, 0.65)';
          strokeColor = 'rgba(52, 211, 153, 0.95)';
        } else if (i === 0 || i === 9) {
          fillColor = 'rgba(248, 113, 113, 0.45)';
          strokeColor = 'rgba(248, 113, 113, 0.85)';
        }

        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;

        // Rounded top bar
        ctx.beginPath();
        const r = Math.min(4, barH);
        ctx.roundRect ? ctx.roundRect(x, y, barWidth, barH, [r, r, 0, 0]) : ctx.rect(x, y, barWidth, barH);
        ctx.fill();
        ctx.stroke();

        // Bar count number on top
        if (count > 0) {
          ctx.fillStyle = '#e4e8f0';
          ctx.font = '10px "SF Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(count, x + barWidth / 2, y - 3);
        }

        // X axis bin label
        ctx.fillStyle = '#808da4';
        ctx.font = '9px "SF Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(binLabels[i], x + barWidth / 2, plotB + 6);
      }

      // X Axis Title
      ctx.fillStyle = '#808da4';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Residual Delta Error (Δ = Estimated − Expected Dan)', (plotL + plotR) / 2, height - 8);
    }

    engineBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        engineBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeEngine = btn.getAttribute('data-delta-engine') || 'ISOR';
        updateStats();
        draw();
      });
    });

    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(() => resize());
    observer.observe(container);

    updateStats();
    resize();
  }

  /* ─────────────────────────────────────────────────────────────
     3. PATTERN BREAKDOWN COMPARISON BARS (Inline Clean SVGs)
     ───────────────────────────────────────────────────────────── */
  function initPatternMatrix() {
    const container = document.getElementById('bm-pattern-matrix');
    if (!container || !window.BENCHMARK_PATTERN_DATA) return;

    const data = window.BENCHMARK_PATTERN_DATA;
    const patterns = [
      {
        key: 'speed',
        name: 'Speed / Bursts',
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
        color: '#5b9cf5',
        maps: 247,
      },
      {
        key: 'jack',
        name: 'Jack / Chordjack',
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        color: '#e8853a',
        maps: 355,
      },
      {
        key: 'tech',
        name: 'Tech / Poly-Rhythm',
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
        color: '#9d7cf5',
        maps: 207,
      },
      {
        key: 'stamina',
        name: 'Stamina / Dense JS',
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="18" height="12" rx="2"></rect><line x1="23" y1="13" x2="23" y2="11"></line><line x1="6" y1="10" x2="6" y2="14"></line><line x1="10" y1="10" x2="10" y2="14"></line></svg>',
        color: '#3ec9b4',
        maps: 282,
      },
    ];

    const engines = ['ISOR', 'Roxy', 'Mixed', 'Azusa', 'Daniel'];
    const maxMae = 0.40;

    let html = '<div class="bm-pat-matrix-grid">';
    patterns.forEach(p => {
      const pData = data[p.key] || {};
      html += `
        <div class="bm-pat-card">
          <div class="bm-pat-head">
            <div class="bm-pat-title-wrap">
              <span class="bm-pat-icon-badge" style="color: ${p.color}; background: ${p.color}15; border-color: ${p.color}35;">
                ${p.iconSvg}
              </span>
              <span class="bm-pat-title">${p.name}</span>
            </div>
            <span class="bm-pat-count">${p.maps} maps</span>
          </div>
          <div class="bm-pat-bars">
      `;

      engines.forEach(eng => {
        const mae = pData[eng] || 0;
        const pct = Math.min(100, (mae / maxMae) * 100);
        const isIsor = eng === 'ISOR';
        const isLeader = (p.key === 'speed' && eng === 'ISOR') ||
          (p.key === 'jack' && eng === 'ISOR') ||
          (p.key === 'tech' && eng === 'Roxy') ||
          (p.key === 'stamina' && eng === 'Roxy');

        html += `
          <div class="bm-pat-row ${isIsor ? 'is-isor' : ''}">
            <span class="bm-pat-eng">${eng}</span>
            <div class="bm-pat-track">
              <div class="bm-pat-fill ${isLeader ? 'is-leader' : ''}" style="width: ${pct}%;"></div>
            </div>
            <span class="bm-pat-val">${mae.toFixed(4)}</span>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  /* ─────────────────────────────────────────────────────────────
     4. APEX COSINE GATE SVG VISUALIZATION
     ───────────────────────────────────────────────────────────── */
  function initApexGateVisual() {
    const container = document.getElementById('bm-apex-visual');
    if (!container) return;

    const w = 600, h = 180;
    const padL = 45, padR = 25, padT = 20, padB = 35;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    let pathD = '';
    for (let dp = 18.0; dp <= 20.5; dp += 0.05) {
      const u = Math.max(0, Math.min(1, (dp - 18.8) / 0.4));
      const g = 0.5 * (1 - Math.cos(Math.PI * u));
      const lift = Math.min(0.6, Math.max(0, 20.2 - (dp - 0.2)));
      const finalDp = (1 - g) * dp + g * (dp + lift);

      const px = padL + ((dp - 18.0) / 2.5) * plotW;
      const py = padB + (1 - (finalDp - 18.0) / 2.5) * plotH;
      pathD += (pathD === '' ? `M ${px} ${py}` : ` L ${px} ${py}`);
    }

    container.innerHTML = `
      <div class="bm-apex-card">
        <div class="bm-apex-info">
          <div class="bm-apex-badge">Zeta to Kappa Canon Progression</div>
          <h4>Continuous Apex Cosine Transition Gate [18.8, 19.2] DP</h4>
          <p>Restores canonical elite tier difficulty without piecewise discontinuities: <code>g(u) = ½(1 − cos(πu))</code> provides C⁰ continuity across the apex boundary (84.0% exact apex tier accuracy).</p>
        </div>
        <div class="bm-apex-svg-wrap">
          <svg viewBox="0 0 ${w} ${h}" class="bm-apex-svg">
            <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="#0c0c16" stroke="rgba(255,255,255,0.06)" rx="6"/>
            
            <!-- Shaded Gate Region [18.8, 19.2] -->
            <rect x="${padL + ((18.8 - 18.0) / 2.5) * plotW}" y="${padT}" width="${(0.4 / 2.5) * plotW}" height="${plotH}" fill="rgba(157, 124, 245, 0.12)" stroke="rgba(157, 124, 245, 0.3)" stroke-dasharray="2,2"/>
            <text x="${padL + ((19.0 - 18.0) / 2.5) * plotW}" y="${padT + 14}" fill="#9d7cf5" font-size="9" text-anchor="middle" font-family="Space Grotesk">Cosine Gate Window [18.8–19.2]</text>

            <!-- Identity line -->
            <line x1="${padL}" y1="${padB + plotH}" x2="${padL + plotW}" y2="${padT}" stroke="rgba(255,255,255,0.15)" stroke-dasharray="3,3"/>

            <!-- C0 Curve -->
            <path d="${pathD}" fill="none" stroke="#5b9cf5" stroke-width="2.5"/>

            <!-- Axis Ticks -->
            <text x="${padL}" y="${h - 10}" fill="#4a5568" font-size="9" font-family="SF Mono">18.0 (Zeta)</text>
            <text x="${padL + ((19.0 - 18.0) / 2.5) * plotW}" y="${h - 10}" fill="#9d7cf5" font-size="9" font-family="SF Mono" text-anchor="middle">19.0 (Theta)</text>
            <text x="${padL + plotW}" y="${h - 10}" fill="#4a5568" font-size="9" font-family="SF Mono" text-anchor="end">20.5 (Kappa)</text>
          </svg>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Initialize on DOM Load ────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initScatterPlot();
    initDeltaDistribution();
    initPatternMatrix();
    initApexGateVisual();
  });

  window.addEventListener('load', () => {
    initScatterPlot();
    initDeltaDistribution();
    initPatternMatrix();
    initApexGateVisual();
  });
})();
