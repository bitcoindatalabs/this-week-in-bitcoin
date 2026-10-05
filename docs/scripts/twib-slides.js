/**
 * twib-slides.js — renders the TWIB weekly (3 slides) and dev meeting (1 slide) social slides
 * from snapshots written by python/automation/jobs/orange_dev/twib_slides.py
 * (schemas "twib-weekly-v1" and "twib-meeting-v1"). Uses the shared SlideKit helpers.
 */
(function () {
    'use strict';

    const K = window.SlideKit;
    const { esc } = K;
    const SITE = 'twib.bitcoindatalabs.org';
    const ACTION = 'github.com/bitcoin/bitcoin/pulls';

    const brand = (section) => `<span class="brand">This Week in Bitcoin Core</span> · ${esc(section)}`;
    const footWeekly = (n, note) => K.foot(`<b>${SITE}</b>${note ? ' · ' + esc(note) : ''}`, n, 3);
    const fmt = (v, unit) => (v === null || v === undefined) ? '—' : `${Number.isInteger(v) ? v : v.toFixed(1)}`;

    // ---------- Weekly slide 1: the week ----------
    function vsTypical(k) {
        if (k.vs_typical === null || k.vs_typical === undefined || k.typical === null) {
            return '<span class="kpi-delta muted">—</span>';
        }
        // Small weekly counts: show the absolute difference, not a misleading percentage
        const small = k.unit !== 'd' && k.typical < 10;
        const diff = k.value - k.typical;
        const txt = small ? `${diff >= 0 ? '+' : ''}${fmt(Math.round(diff * 10) / 10)}` : `${k.vs_typical >= 0 ? '+' : ''}${k.vs_typical}%`;
        // Weekly noise: colour only moves of 2+ on small counts, 10%+ otherwise
        const cls = Math.abs(small ? diff : k.vs_typical) < (small ? 2 : 10) ? 'muted' : K.polarity(diff, k.good);
        return `<span class="kpi-delta ${cls}">${diff >= 0 ? '▲' : '▼'} ${esc(txt)}</span>`;
    }

    function weekly1(s) {
        const kpis = s.kpis.map((k) => `<div class="card kpi">
            <div class="kpi-label">${esc(k.label)}</div>
            <div class="kpi-row"><div class="kpi-value">${fmt(k.value)}${k.unit ? `<span class="unit">${esc(k.unit)}</span>` : ''}</div>${vsTypical(k)}</div>
            ${K.sparkline(k.trend, { w: 240, h: 54, labels: s.trend_labels })}
            <div class="kpi-bench">typical ${fmt(k.typical)}${esc(k.unit)} · 13 weeks</div>
        </div>`).join('');

        const themes = s.themes.map((t) => `<div class="theme">
            <div class="theme-title">${esc(t.title)}</div>
            ${t.text ? `<div class="theme-text">${esc(t.text)}</div>` : ''}</div>`).join('');

        const r = s.release;
        const total = r ? (r.open || 0) + (r.closed || 0) : 0;
        const rel = r && r.version ? `<div class="card strip release">
            <span class="chip accent">Release</span>
            <span><b>Bitcoin Core ${esc(r.version)}</b> · ${esc(r.status || '')}</span>
            <div class="bar"><span style="width:${total ? Math.round(r.closed / total * 100) : 0}%"></span></div>
            <span class="mono">${r.closed}/${total} milestone PRs closed</span></div>` : '';

        const welcome = s.new_contributors.length
            ? `<div class="welcome"><span class="chip accent">Welcome</span> First PR merged: ${s.new_contributors.map(esc).join(', ')}</div>` : '';

        const ik = s.insight.key;
        const ikpi = s.kpis.find((k) => k.key === ik);
        const chart = s.series && s.series[ik] ? K.columns(s.series[ik], {
            w: 400, h: 150, first: s.trend_labels[0], last: 'this week',
            typical: ikpi ? ikpi.typical : null }) : '';

        return `${K.head(brand(`Week ${s.week.number}`), s.week.label)}
            <h1 class="slide-title">${esc(s.title)}</h1>
            <div class="slide-body">
                <div class="grid cols-4">${kpis}</div>
                <div class="grid split-60-40 fill">
                    <div class="card"><div class="card-label">What happened <span class="meta">from the week's PRs, Delving & mailing list</span></div>${themes}${welcome}</div>
                    <div class="card callout"><div class="card-label">Signal of the week</div><div class="big">${esc(s.insight.text)}</div>
                        <div class="signal-chart">${chart}</div>
                        <div class="callout-note">13 weeks · dashed line = typical (median of the previous 8 weeks)</div></div>
                </div>
                ${rel}
            </div>
            ${footWeekly(1, 'bitcoin/bitcoin · bots excluded')}`;
    }

    // ---------- Weekly slide 2: what merged ----------
    function weekly2(s) {
        const m = s.merged;
        const items = m.items.map((it) => `<div class="item">
            <div class="item-title"><span class="pr">#${it.pr}</span>${esc(it.title)}</div>
            ${it.summary ? `<div class="item-sum">${esc(it.summary)}</div>` : ''}
            <div class="item-meta"><span class="area-dot" style="background:${K.areaColor(it.area)}"></span>${esc(it.area)}
                ${it.impact ? `<span class="chip">${esc(it.impact)}</span>` : ''}
                <span><b>${it.reviews}</b> review comments · <b>${it.acks}</b> ACKs · by ${esc(it.author_name)}</span></div>
        </div>`).join('');

        const max = Math.max(1, ...m.area_mix.map((a) => a.count));
        const bars = m.area_mix.map((a) => `<div class="hbar-row ${K.UPKEEP_AREAS.includes(a.name) ? 'upkeep' : ''}">
            <span>${esc(a.name)}</span>
            <div class="hbar"><span style="width:${(a.count / max * 100).toFixed(1)}%;background:${K.areaColor(a.name)}"></span></div>
            <span class="n">${a.count} <small>${a.pct.toFixed(0)}%</small></span></div>`).join('');

        const b = m.behaviour;
        const classified = b.changed + b.maintenance;
        const split = classified ? `<div class="sublabel">Behaviour change vs upkeep</div>
            <div class="split-bar"><span style="width:${(b.changed / classified * 100).toFixed(1)}%;background:var(--accent-fill-resolved)"></span></div>
            <div class="split-legend"><span><i style="background:var(--accent-fill-resolved)"></i>${b.changed} changed behaviour</span>
                <span><i style="background:var(--grid-color)"></i>${b.maintenance} maintenance</span></div>` : '';

        const lead = m.items[0];
        const title = classified
            ? `${b.changed} of ${m.count} merges changed behaviour${lead ? `; ${lead.area} drew the most review` : ''}`
            : `${m.count} PRs merged this week`;
        return `${K.head(brand('What merged'), s.week.label)}
            <h1 class="slide-title">${esc(title)}</h1>
            <div class="slide-body">
                <div class="grid split-60-40 fill">
                    <div class="card"><div class="card-label">Merges that matter <span class="meta">product areas first · by human review</span></div>${items}</div>
                    <div class="card"><div class="card-label">Where the work landed <span class="meta">${m.count} merges</span></div>${bars}${split}
                        ${m.reviewers && m.reviewers.length ? `<div class="sublabel">Most active reviewers</div>
                        <div class="reviewers">${m.reviewers.map((r) => `<span><b>${esc(r.name)}</b> ${r.count}</span>`).join('')}</div>` : ''}</div>
                </div>
            </div>
            ${footWeekly(2, 'area from maintainer GitHub labels · impact from PR summaries')}`;
    }

    // ---------- Weekly slide 3: what needs eyes next ----------
    function weekly3(s) {
        const n = s.needs;
        const near = n.near_merge.length ? n.near_merge.map((p) => `<div class="item">
            <div class="item-title"><span class="pr">#${p.pr}</span>${esc(p.title)}</div>
            <div class="item-meta"><span class="area-dot" style="background:${K.areaColor(p.area)}"></span>${esc(p.area)}
                <span><b>${p.acks}</b> ACKs · <b>${p.week_comments}</b> review comments this week</span></div></div>`).join('')
            : '<div class="muted">No open PRs with 2+ ACKs saw review this week.</div>';

        const ms = n.milestone.length ? `<ul class="list">${n.milestone.map((p) => `<li><span class="pr">#${p.pr}</span>${esc(p.title)}</li>`).join('')}</ul>`
            : '<div class="muted">No open PRs on the milestone.</div>';

        const priority = n.meeting_priority ? `<div class="priority">${esc(n.meeting_priority)}</div>` : '';
        const actions = priority + (n.actions.length ? `<ul class="list">${n.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`
            : (priority ? '' : '<div class="muted">No open calls for help from this week\'s meeting.</div>'));
        const rel = s.release && s.release.rc ? `<div class="ms-status">${esc(s.release.rc)} in testing · ${s.release.open} PR${s.release.open === 1 ? '' : 's'} still open</div>` : '';

        const disc = n.discussions.map((d) => `<div class="item">
            <div class="item-title">${/delving/i.test(d.source || '') ? '<span class="chip delving">Delving</span>' : '<span class="chip ml">Mailing list</span>'} ${esc(d.title)}</div>
            ${d.summary ? `<div class="item-sum">${esc(d.summary)}</div>` : ''}
            <div class="item-meta">${d.messages} messages this week</div></div>`).join('');

        const md = n.meeting_date ? new Date(n.meeting_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';
        return `${K.head(brand('What needs eyes next'), s.week.label)}
            <h1 class="slide-title">Where a careful review helps most this week</h1>
            <div class="slide-body">
                <div class="grid cols-3 fill">
                    <div class="card"><div class="card-label">Nearly there <span class="meta">open · 2+ ACKs</span></div>${near}</div>
                    <div class="card"><div class="card-label">${esc(n.release_version || 'Release')} milestone <span class="meta">needs review</span></div>${rel}${ms}</div>
                    <div class="card"><div class="card-label">From the dev meeting <span class="meta">${esc(md)}</span></div>${actions}</div>
                </div>
                <div class="card"><div class="card-label">Most active protocol discussions <span class="meta">Delving Bitcoin · bitcoindev mailing list</span></div>
                    <div class="grid cols-2 disc">${disc}</div></div>
            </div>
            ${K.foot(`Review: <b>${ACTION}</b> · Full digest: <b>${SITE}</b>`, 3, 3)}`;
    }

    // ---------- Dev meeting slide ----------
    function meeting(s) {
        const topics = s.topics.map((t) => `<div class="item">
            ${t.title ? `<div class="item-title">${esc(t.title)}</div>` : ''}
            <div class="item-sum">${esc(t.text)}</div></div>`).join('');
        const list = (xs, empty) => xs.length ? `<ul class="list">${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<div class="muted">${empty}</div>`;
        const people = s.active.slice(0, 10).map((p) => `<span class="handle">${esc(p)}</span>`).join('')
            + (s.active.length > 10 ? `<span class="handle">+${s.active.length - 10}</span>` : '');
        return `${K.head('<span class="brand">Bitcoin Core Dev Meeting</span> · IRC #bitcoin-core-dev', s.date_label)}
            <h1 class="slide-title">${esc(s.title)}</h1>
            <div class="meeting-stats">
                <span><b>${s.participants}</b> participants</span><span><b>${s.decisions.length}</b> decision${s.decisions.length === 1 ? '' : 's'}</span>
                <span><b>${s.actions.length}</b> next steps</span><span class="people">${people}</span>
            </div>
            <div class="slide-body">
                <div class="grid split-60-40 fill">
                    <div class="card"><div class="card-label">Discussed</div>${topics}</div>
                    <div class="side">
                        <div class="card"><div class="card-label">Decided</div>${list(s.decisions, 'No formal decisions recorded.')}</div>
                        <div class="card"><div class="card-label">Next steps</div>${list(s.actions, 'No action items recorded.')}</div>
                        ${s.spotlight ? `<div class="card callout"><div class="card-label">Spotlight debate</div><div class="spot">${esc(s.spotlight)}</div></div>` : ''}
                    </div>
                </div>
            </div>
            <div class="slide-foot"><span>Full debrief: <b>${esc(s.url)}</b></span><span>Thursdays 19:00 UTC · Bitcoin Data Labs</span></div>`;
    }

    // ---------- bootstrap ----------
    async function init() {
        const name = new URLSearchParams(window.location.search).get('snapshot');
        let ok = false;
        try {
            if (!name || !/^[a-z]+_\d{8}$/.test(name)) throw new Error(`Invalid snapshot name: ${name}`);
            const s = await K.loadSnapshotScript(`data/slides/${name}.js`);
            const slides = [1, 2, 3].map((i) => document.querySelector(`.slide-${i}`));
            if (s.schema === 'twib-weekly-v1') {
                [weekly1, weekly2, weekly3].forEach((fn, i) => { slides[i].innerHTML = fn(s); });
            } else if (s.schema === 'twib-meeting-v1') {
                slides[0].innerHTML = meeting(s);
                slides[1].remove(); slides[2].remove();
            } else {
                throw new Error(`Unsupported schema: ${s.schema}`);
            }
            if (document.fonts && document.fonts.ready) await document.fonts.ready;
            ok = true;
        } catch (err) {
            console.error('[twib-slides]', err);
            const s1 = document.querySelector('.slide-1');
            if (s1) s1.innerHTML = `<div class="slide-title">Slides unavailable: ${esc(err.message)}</div>`;
        } finally {
            K.signal(ok);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
