/* AUTO-GENERATED copy of python/automation/shared/media/slides/slide-kit.js — do not edit. */
/**
 * slide-kit.js — shared helpers for Bitcoin Data Labs report slides (window.SlideKit).
 * SOURCE OF TRUTH: python/automation/shared/media/slides/slide-kit.js
 * Jobs copy it into each site repo as scripts/slide-kit.generated.js — do not edit the copies.
 */
(function () {
    'use strict';

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /** Strips leftover LLM markdown (**bold**, `code`, trailing colons) from summary text. */
    const clean = (s) => String(s ?? '').replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();

    function head(left, right) {
        return `<div class="slide-head"><span>${left}</span><span class="when">${esc(right)}</span></div>`;
    }

    function foot(left, n, total) {
        return `<div class="slide-foot"><span>${left}</span><span>${n} / ${total}</span></div>`;
    }

    /**
     * Sparkline with the trailing-history p10–p90 band and median line; the last point
     * (current period) is drawn as a dot.
     */
    function sparkline(values, opts = {}) {
        const w = opts.w || 180, h = opts.h || 38, pad = 4;
        const pts = values.map((v, i) => ({ v, i })).filter((p) => p.v !== null && p.v !== undefined);
        if (pts.length < 2) return '';
        const vals = pts.map((p) => p.v);
        const hist = values.slice(0, -1).filter((v) => v !== null && v !== undefined).sort((a, b) => a - b);
        const q = (p) => {
            if (!hist.length) return null;
            const idx = (hist.length - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
            return hist[lo] + (hist[hi] - hist[lo]) * (idx - lo);
        };
        const p10 = q(0.1), p90 = q(0.9), med = q(0.5);
        let min = Math.min(...vals), max = Math.max(...vals);
        if (min === max) { min -= 1; max += 1; }
        const x = (i) => pad + (i / (values.length - 1)) * (w - pad * 2);
        const y = (v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
        const line = pts.map((p) => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
        const last = pts[pts.length - 1];
        const band = (p10 !== null && opts.band !== false)
            ? `<rect class="spark-band" x="${pad}" y="${y(p90).toFixed(1)}" width="${w - pad * 2}" height="${Math.max(1, y(p10) - y(p90)).toFixed(1)}" rx="2"></rect>
               <line class="spark-median" x1="${pad}" x2="${w - pad}" y1="${y(med).toFixed(1)}" y2="${y(med).toFixed(1)}"></line>` : '';
        const title = opts.labels ? `<title>${esc(opts.labels.map((l, i) => `${l}: ${values[i] ?? '—'}`).join('\n'))}</title>` : '';
        return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="trend">${title}${band}
            <polyline class="spark-line" points="${line}"></polyline>
            <circle class="spark-dot" cx="${x(last.i).toFixed(1)}" cy="${y(last.v).toFixed(1)}" r="4"></circle></svg>`;
    }

    /**
     * Column chart of a short series; the last column (current period) is highlighted and an
     * optional dashed reference line marks the typical value.
     */
    function columns(values, opts = {}) {
        const w = opts.w || 360, h = opts.h || 120, pb = 18, pt = 8;
        const vals = values.map((v) => (v === null || v === undefined ? 0 : v));
        // Cap the scale so one outlier week doesn't flatten the rest; capped bars end in a notch
        const focus = Math.max(vals[vals.length - 1], opts.typical || 0, 1);
        const max = Math.min(Math.max(...vals, 1), focus * 2.5);
        const bw = w / vals.length, gap = Math.max(2, bw * 0.22);
        const y = (v) => pt + (1 - v / max) * (h - pt - pb);
        const bars = vals.map((v, i) => {
            const last = i === vals.length - 1;
            const cv = Math.min(v, max);
            const notch = v > max ? `<line class="col-cap" x1="${(i * bw + gap / 2).toFixed(1)}" x2="${(i * bw + bw - gap / 2).toFixed(1)}"
                y1="${(pt + 4).toFixed(1)}" y2="${(pt + 1).toFixed(1)}"></line>` : '';
            return `<rect class="${last ? 'col-current' : 'col'}" x="${(i * bw + gap / 2).toFixed(1)}" y="${y(cv).toFixed(1)}"
                width="${(bw - gap).toFixed(1)}" height="${Math.max(1, h - pb - y(cv)).toFixed(1)}" rx="2"></rect>${notch}`;
        }).join('');
        const ref = opts.typical ? `<line class="col-typical" x1="0" x2="${w}" y1="${y(opts.typical).toFixed(1)}" y2="${y(opts.typical).toFixed(1)}"></line>` : '';
        const lab = (opts.first ? `<text class="axis-label" x="0" y="${h - 4}" text-anchor="start">${esc(opts.first)}</text>` : '')
            + (opts.last ? `<text class="axis-label" x="${w}" y="${h - 4}" text-anchor="end">${esc(opts.last)}</text>` : '');
        return `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="trend">${bars}${ref}${lab}</svg>`;
    }

    /** Polarity class for a change: favourable = pos, unfavourable = neg. */
    function polarity(value, goodDirection) {
        if (value === null || value === undefined || value === 0 || !goodDirection) return 'muted';
        return ((value > 0) === (goodDirection === 'up')) ? 'pos' : 'neg';
    }

    /** Loads `${dir}/${file}` as a <script> that sets window.__SNAPSHOT__ (works over file:// and http). */
    function loadSnapshotScript(src) {
        return new Promise((resolve, reject) => {
            const prev = window.__SNAPSHOT__;
            const el = document.createElement('script');
            el.src = src;
            el.onload = () => {
                const snap = window.__SNAPSHOT__;
                window.__SNAPSHOT__ = prev;
                el.remove();
                snap && snap !== prev ? resolve(snap) : reject(new Error(`No snapshot in ${src}`));
            };
            el.onerror = () => { el.remove(); reject(new Error(`Could not load ${src}`)); };
            document.head.appendChild(el);
        });
    }

    /** Fixed colour per PR area (orange-dev-data scripts/utils/pr_area.py); upkeep areas muted. */
    const AREA_COLORS = {
        'Consensus & Validation': 'var(--series-1)', 'Mempool & Policy': 'var(--series-8)',
        'P2P & Network': 'var(--series-2)', 'Wallet': 'var(--series-3)', 'Mining': 'var(--series-4)',
        'RPC & Interfaces': 'var(--series-5)', 'Node & Storage': 'var(--series-7)',
        'Tests & QA': 'var(--series-upkeep-1)', 'Build & CI': 'var(--series-upkeep-2)',
        'Maintenance': 'var(--series-upkeep-3)', 'Other': 'var(--series-other)',
    };
    const UPKEEP_AREAS = ['Tests & QA', 'Build & CI', 'Maintenance'];
    const areaColor = (name) => AREA_COLORS[name] || 'var(--series-other)';

    /** Marks the page ready ("true") or failed ("error") for headless capture. */
    function signal(ok) {
        document.body.setAttribute('data-loaded', ok ? 'true' : 'error');
    }

    window.SlideKit = { esc, clean, head, foot, sparkline, columns, polarity, loadSnapshotScript, signal,
        AREA_COLORS, UPKEEP_AREAS, areaColor };
})();
