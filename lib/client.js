// dsh-token-budget-pill — browser half.
//
// Loaded by dsh-client-modules at /plugins/dsh-token-budget-pill/client.js and
// executed through the vendored Loader's lazy-CJS module table:
// window.__ModuleLoader__.load({ id, factory: (require) => module }).
// Only platform seed modules (react / react-dom) are required.
//
// What it does
// ------------
// Adds one `conversation.composer.dock` entry next to the built-in token-usage
// pill. The pill shows the live DeepSeek account credit and the estimated cost
// of the current session; clicking it opens a breakdown panel.
//
// Data sources
// ------------
// - Balance: ctx.remote.account.getBalance(client) — the same Remote the
//   official Account settings page uses. No credential ever reaches the page.
// - Tokens: the `tokenUsage` and `sessionStats` Session projections.
// - Model: the `modelSelection` projection (falls back to deepseek-flash).
// - Prices: DeepSeek's published CNY/USD peak/off-peak table, embedded below.

window.__ModuleLoader__.load({
  id: 'dsh-token-budget-pill',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    const React = require('react');
    const ReactDOM = require('react-dom');
    const h = React.createElement;
    const { useEffect, useLayoutEffect, useRef, useState } = React;

    const NS = 'token-budget';
    const PLUGIN_ID = 'dsh-token-budget-pill';
    const VERSION = '0.1.0';

    // ── styles ────────────────────────────────────────────────────────────
    const CSS = `
.tb-anchor{min-width:0;font-size:calc(var(--dsh-content-font-size-secondary,13px) - 1px);line-height:calc(20px + var(--dsh-content-font-delta-secondary,0px));display:inline-flex}
.tb-pill{box-sizing:border-box;border-radius:var(--dsw-radius-sm);max-width:100%;color:var(--dsw-alias-label-tertiary);font:inherit;font-variant-numeric:tabular-nums;line-height:inherit;white-space:nowrap;background:0 0;border:none;align-items:center;gap:6px;padding:1px 8px;display:inline-flex;cursor:pointer}
.tb-pill:hover,.tb-pill[aria-expanded="true"]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.tb-yen{display:inline-grid;place-items:center;width:14px;height:14px;flex:none;border:1px solid currentColor;border-radius:4px;font-size:9px;font-weight:600;line-height:1;opacity:.9}
.tb-label{text-overflow:ellipsis;min-width:0;overflow:hidden}
.tb-dim{color:var(--dsw-alias-label-tertiary)}
.tb-sep{color:var(--dsw-alias-border-l2);margin:0 6px}
.tb-panel{position:fixed;z-index:1100;box-sizing:border-box;width:352px;max-width:calc(100vw - 24px);overflow:auto;border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-specific-menu);backdrop-filter:var(--dsw-menu-backdrop-filter);box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-secondary);padding:16px;font-size:12px;line-height:18px;text-align:left}
.tb-panel:focus{outline:none}
.tb-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
.tb-title{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:20px}
.tb-refresh{border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;line-height:18px;padding:2px 6px;border-radius:6px;cursor:pointer;white-space:nowrap}
.tb-refresh:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.tb-refresh:disabled{cursor:default;opacity:.55}
.tb-rule{border-top:.5px solid var(--dsw-alias-border-l2);margin:12px 0}
.tb-balance{font-size:26px;line-height:32px;font-weight:600;letter-spacing:-.02em;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.tb-balance.tb-negative{color:var(--dsw-alias-state-error-primary,#e5484d)}
.tb-sub{color:var(--dsw-alias-label-tertiary);margin-top:2px;font-variant-numeric:tabular-nums}
.tb-bar{height:6px;border-radius:3px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;margin:10px 0 6px}
.tb-bar>i{display:block;height:100%;border-radius:inherit;background:var(--dsw-alias-state-business-primary,#4d6bfe);transition:width .25s ease}
.tb-bar>i.tb-warn{background:var(--dsw-alias-state-warning-primary,#d97706)}
.tb-bar>i.tb-danger{background:var(--dsw-alias-state-error-primary,#e5484d)}
.tb-meter{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.tb-meter b{color:var(--dsw-alias-label-secondary);font-weight:500}
.tb-dl{display:grid;grid-template-columns:minmax(96px,auto) minmax(0,1fr);gap:6px 16px;margin:0}
.tb-dl dt{color:var(--dsw-alias-label-tertiary);min-width:0}
.tb-dl dd{color:var(--dsw-alias-label-secondary);text-align:right;font-variant-numeric:tabular-nums;min-width:0;margin:0}
.tb-dl .tb-sum dt,.tb-dl .tb-sum dd{color:var(--dsw-alias-label-primary);font-weight:500}
.tb-note{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:17px;margin-top:10px}
.tb-empty{border:.5px dashed var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);padding:10px 12px;color:var(--dsw-alias-label-tertiary)}
.tb-empty strong{display:block;color:var(--dsw-alias-label-secondary);font-weight:500;margin-bottom:2px}
.tb-tag{display:inline-flex;align-items:center;gap:4px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-tertiary);padding:0 7px;font-size:11px;line-height:18px;white-space:nowrap}
`;

    function ensureStyles() {
      if (typeof document === 'undefined') return;
      if (document.querySelector('style[data-plugin-css="' + PLUGIN_ID + '"]') !== null) return;
      const tag = document.createElement('style');
      tag.dataset.plugin = PLUGIN_ID;
      tag.dataset.pluginCss = PLUGIN_ID;
      tag.textContent = CSS;
      (document.head || document.documentElement).appendChild(tag);
    }

    // ── DeepSeek price table (CNY/USD per 1M tokens) ──────────────────────
    // Source: https://api-docs.deepseek.com/quick_start/pricing
    // Peak: Mon–Fri 09:00–12:00 / 14:00–18:00 Beijing time (holidays excluded
    // from DSH's simple clock — see currentTier below).
    const PRICES = {
      CNY: {
        flash: {
          hit: { idle: 0.02, peak: 0.04 },
          miss: { idle: 1, peak: 2 },
          out: { idle: 4, peak: 8 },
        },
        pro: {
          hit: { idle: 0.15, peak: 0.3 },
          miss: { idle: 4.5, peak: 9 },
          out: { idle: 13.5, peak: 27 },
        },
      },
      USD: {
        flash: {
          hit: { idle: 0.003, peak: 0.006 },
          miss: { idle: 0.15, peak: 0.3 },
          out: { idle: 0.6, peak: 1.2 },
        },
        pro: {
          hit: { idle: 0.022, peak: 0.044 },
          miss: { idle: 0.66, peak: 1.32 },
          out: { idle: 1.98, peak: 3.96 },
        },
      },
    };

    function priceKeyFor(model) {
      const id = String(model || '').toLowerCase();
      return id.includes('pro') ? 'pro' : 'flash';
    }

    function currentTier(now) {
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Shanghai',
          weekday: 'short',
          hour: '2-digit',
          hourCycle: 'h23',
        }).formatToParts(now);
        const weekday = parts.find((part) => part.type === 'weekday');
        const hour = Number(parts.find((part) => part.type === 'hour')?.value);
        if (weekday?.value === 'Sat' || weekday?.value === 'Sun') return 'idle';
        if (!Number.isFinite(hour)) return 'idle';
        return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18) ? 'peak' : 'idle';
      } catch {
        return 'idle';
      }
    }

    // ── formatting ────────────────────────────────────────────────────────
    function symbolOf(currency) {
      return currency === 'USD' ? '$' : '¥';
    }

    function formatBalance(value, currency) {
      const sym = symbolOf(currency);
      const n = Number(value);
      if (!Number.isFinite(n)) return '—';
      const sign = n < 0 ? '-' : '';
      const abs = Math.abs(n);
      if (abs > 0 && abs < 0.01) return sign + sym + '<0.01';
      return sign + sym + abs.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    function formatCost(value, currency, short) {
      const sym = symbolOf(currency);
      const n = Number(value);
      if (!Number.isFinite(n) || n === 0) return sym + '0.00';
      const sign = n < 0 ? '-' : '';
      const abs = Math.abs(n);
      if (abs < 0.0001) return sign + sym + '<0.0001';
      const digits = abs >= 1 ? 2 : abs >= 0.01 ? (short ? 2 : 3) : 4;
      return sign + sym + abs.toFixed(digits);
    }

    function formatTokens(value) {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) return '0';
      if (n >= 1e9) return trimZero(n / 1e9) + 'B';
      if (n >= 1e6) return trimZero(n / 1e6) + 'M';
      if (n >= 1e3) return trimZero(n / 1e3) + 'K';
      return String(Math.round(n));
    }

    function trimZero(n) {
      return n >= 100 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, '');
    }

    function formatPercent(value) {
      if (!Number.isFinite(value)) return '—';
      if (value > 0 && value < 0.1) return '<0.1%';
      if (value >= 100 && value < 100.05) return '100%';
      return (value >= 10 ? value.toFixed(1) : value.toFixed(2)).replace(/\.?0+$/, '') + '%';
    }

    function formatRelative(timestamp) {
      const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
      if (seconds < 10) return '刚刚';
      if (seconds < 60) return seconds + ' 秒前';
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return minutes + ' 分钟前';
      return Math.round(minutes / 60) + ' 小时前';
    }

    function tokenNumber(value) {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : 0;
    }

    // ── cost model ────────────────────────────────────────────────────────
    function computeCost(usage, price, tier) {
      const hitTokens = tokenNumber(usage?.cacheReadTokens);
      const missTokens = tokenNumber(usage?.uncachedInputTokens);
      const cacheWriteTokens = tokenNumber(usage?.cacheWriteTokens);
      const outputTokens = tokenNumber(usage?.outputTokens);
      const billedMiss = missTokens + cacheWriteTokens;
      const hit = (hitTokens / 1e6) * price.hit[tier];
      const miss = (billedMiss / 1e6) * price.miss[tier];
      const out = (outputTokens / 1e6) * price.out[tier];
      const saved = (hitTokens / 1e6) * (price.miss[tier] - price.hit[tier]);
      return {
        hitTokens,
        missTokens,
        cacheWriteTokens,
        outputTokens,
        totalTokens: hitTokens + missTokens + cacheWriteTokens + outputTokens,
        hit,
        miss,
        out,
        saved,
        total: hit + miss + out,
      };
    }

    // ── balance store ─────────────────────────────────────────────────────
    /** @param {any} ctx client plugin context */
    function createBudgetStore(ctx) {
      let state = {
        status: 'idle', // idle | loading | ready | empty | signed-out | error | unsupported
        wallets: [],
        error: null,
        staleError: null,
        updatedAt: 0,
        refreshing: false,
      };
      const listeners = new Set();
      let pollTimer = null;
      let refreshTimer = null;
      let inflight = null;
      let lastAttempt = 0;

      function emit() {
        for (const listener of Array.from(listeners)) {
          try {
            listener();
          } catch {
            /* one broken subscriber must not starve the others */
          }
        }
      }

      function setState(patch) {
        state = Object.assign({}, state, patch);
        emit();
      }

      function clientMeta() {
        let locale = 'zh-CN';
        try {
          const localeService = ctx.get('locale', false);
          const active = localeService?.getSnapshot?.().active;
          if (typeof active === 'string' && active !== '') locale = active;
          else if (typeof navigator !== 'undefined' && navigator.language) locale = navigator.language;
        } catch {
          /* locale is cosmetic for the Platform headers */
        }
        return {
          version: VERSION,
          locale,
          timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
        };
      }

      function accountApi() {
        try {
          return ctx.get('remote.account', false) || ctx.remote?.account || null;
        } catch {
          return null;
        }
      }

      function mergeWallets(value) {
        const byCurrency = new Map();
        const add = (currency, raw, kind) => {
          const cur = currency === 'USD' ? 'USD' : 'CNY';
          const amount = Number(raw);
          if (!Number.isFinite(amount)) return;
          let wallet = byCurrency.get(cur);
          if (wallet === undefined) {
            wallet = { currency: cur, toppedUp: 0, granted: 0, total: 0 };
            byCurrency.set(cur, wallet);
          }
          if (kind === 'granted') wallet.granted += amount;
          else wallet.toppedUp += amount;
          wallet.total = wallet.toppedUp + wallet.granted;
        };
        for (const wallet of Array.isArray(value?.value) ? value.value : []) {
          add(wallet?.currency, wallet?.balance, 'toppedUp');
        }
        for (const wallet of Array.isArray(value?.bonusWallets) ? value.bonusWallets : []) {
          add(wallet?.currency, wallet?.balance, 'granted');
        }
        const wallets = Array.from(byCurrency.values());
        wallets.sort((left, right) => {
          if (left.currency === right.currency) return 0;
          return left.currency === 'CNY' ? -1 : right.currency === 'CNY' ? 1 : 0;
        });
        return wallets;
      }

      async function load() {
        const account = accountApi();
        if (account === null || typeof account.getBalance !== 'function') {
          return { status: 'unsupported', error: '账号服务不可用' };
        }
        let result;
        try {
          result = await account.getBalance(clientMeta());
        } catch (error) {
          return {
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          };
        }
        if (result === null || result === undefined || result.ok !== true) {
          const code = result?.error?.code;
          const message = result?.error?.message;
          return {
            status: 'error',
            error: typeof message === 'string' && message !== '' ? message : code || '账号服务返回失败',
          };
        }
        const value = result.value;
        if (value === null || value === undefined) {
          return { status: 'signed-out', error: null };
        }
        if (value.status === 'failed') {
          return { status: 'error', error: '平台余额查询失败' };
        }
        if (value.status !== 'ready') {
          return { status: 'error', error: '余额数据不可用' };
        }
        const wallets = mergeWallets(value);
        if (wallets.length === 0) {
          return { status: 'empty', error: '账户没有可用的余额钱包' };
        }
        return { status: 'ready', wallets, error: null, updatedAt: Date.now() };
      }

      function refresh(force) {
        const hard = force === true;
        if (inflight !== null) return inflight;
        if (!hard && Date.now() - lastAttempt < 15000) return Promise.resolve();
        lastAttempt = Date.now();
        if (state.status === 'ready' || state.status === 'empty') {
          setState({ refreshing: true, error: null });
        } else {
          setState({ status: 'loading', refreshing: true, error: null });
        }
        inflight = load()
          .then((next) => {
            if (next.status === 'error' && state.updatedAt > 0) {
              // Keep the last good number on screen; a transient refresh failure
              // must not make the remaining credit disappear.
              setState({ refreshing: false, staleError: next.error ?? '刷新失败' });
              return;
            }
            setState(Object.assign({ refreshing: false, staleError: null }, next));
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            if (state.updatedAt > 0) {
              setState({ refreshing: false, staleError: message });
            } else {
              setState({ status: 'error', refreshing: false, error: message });
            }
          })
          .then(() => {
            inflight = null;
          });
        return inflight;
      }

      function scheduleRefresh(delay) {
        if (refreshTimer !== null) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
          refreshTimer = null;
          refresh(true);
        }, Math.max(0, Number(delay) || 0));
      }

      function start() {
        if (pollTimer !== null) return;
        refresh(false);
        pollTimer = setInterval(() => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          refresh(false);
        }, 90000);
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', onVisible);
        }
      }

      function onVisible() {
        if (document.visibilityState === 'visible' && Date.now() - state.updatedAt > 60000) {
          refresh(false);
        }
      }

      function stop() {
        if (pollTimer !== null) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
        if (refreshTimer !== null) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', onVisible);
        }
      }

      const source = {
        getSnapshot: () => state,
        subscribe: (listener) => {
          listeners.add(listener);
          if (listeners.size === 1) start();
          return () => {
            listeners.delete(listener);
            if (listeners.size === 0) stop();
          };
        },
      };

      return {
        source,
        refresh,
        scheduleRefresh,
        dispose: () => {
          stop();
          listeners.clear();
        },
      };
    }

    // ── dialog geometry / dismissal ───────────────────────────────────────
    function useDockPanel(open, setOpen, buttonRef, panelRef) {
      const [pos, setPos] = useState(null);

      useLayoutEffect(() => {
        if (!open) {
          setPos(null);
          return undefined;
        }
        const update = () => {
          const button = buttonRef.current;
          if (button === null) return;
          const rect = button.getBoundingClientRect();
          const width = Math.min(352, Math.max(240, window.innerWidth - 24));
          const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
          const bottom = Math.max(12, window.innerHeight - rect.top + 8);
          const maxHeight = Math.max(220, Math.min(560, rect.top - 16));
          setPos({ left, bottom, width, maxHeight });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
      }, [open, buttonRef]);

      useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
          const target = event.target;
          if (buttonRef.current?.contains(target)) return;
          if (panelRef.current?.contains(target)) return;
          setOpen(false);
        };
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown);
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true);
          document.removeEventListener('keydown', onKeyDown);
        };
      }, [open, setOpen, buttonRef, panelRef]);

      useEffect(() => {
        if (open) panelRef.current?.focus?.();
      }, [open, panelRef]);

      return pos;
    }

    // ── component ─────────────────────────────────────────────────────────
    function TokenBudgetPill(props) {
      ensureStyles();

      const useBudget = typeof props.useTokenBudget === 'function' ? props.useTokenBudget : () => undefined;
      const project = typeof props.useProjection === 'function' ? props.useProjection : () => undefined;
      // The injected hook is a selector hook: it requires a selector function.
      const budget = useBudget((value) => value);
      const usage = project('tokenUsage');
      const stats = project('sessionStats');
      const modelSelection = project('modelSelection');
      const refreshBudget = props.refreshBudget;
      const scheduleBudgetRefresh = props.scheduleBudgetRefresh;

      const [open, setOpen] = useState(false);
      const rootRef = useRef(null);
      const buttonRef = useRef(null);
      const panelRef = useRef(null);
      const pos = useDockPanel(open, setOpen, buttonRef, panelRef);

      const selection = modelSelection?.next ?? modelSelection?.lastUsed;
      const provider = selection?.provider;
      const model = selection?.model || 'deepseek-flash';
      const deepseek = provider === undefined || /deepseek/i.test(String(provider));
      const tier = currentTier(new Date());
      const wallets = budget?.wallets ?? [];
      const primary = wallets.find((wallet) => wallet.currency === 'CNY') ?? wallets[0] ?? null;
      const currency = primary?.currency ?? 'CNY';
      const price = (PRICES[currency] ?? PRICES.CNY)[priceKeyFor(model)];
      const cost = usage !== undefined && deepseek ? computeCost(usage, price, tier) : null;

      const outputTokens = tokenNumber(usage?.outputTokens);
      useEffect(() => {
        if (outputTokens <= 0 || typeof scheduleBudgetRefresh !== 'function') return;
        scheduleBudgetRefresh(4000);
      }, [outputTokens, scheduleBudgetRefresh]);

      const [, setClock] = useState(0);
      useEffect(() => {
        if (!open) return undefined;
        const timer = setInterval(() => setClock((value) => value + 1), 30000);
        return () => clearInterval(timer);
      }, [open]);

      const status = budget?.status ?? 'loading';
      const ready = status === 'ready' && primary !== null;
      const costText = cost !== null && cost.total > 0 ? `本会话 ${formatCost(cost.total, currency, true)}` : null;
      const balanceText = ready
        ? formatBalance(primary.total, primary.currency)
        : status === 'loading' || status === 'idle'
          ? '额度 …'
          : status === 'signed-out'
            ? '未登录账号'
            : status === 'empty'
              ? '无余额钱包'
              : '额度不可用';

      const pillTitle = ready
        ? `可用余额 ${formatBalance(primary.total, primary.currency)}` + (costText ? ` · ${costText}` : '')
        : '点击查看额度与会话费用';

      const pill = h(
        'span',
        { className: 'tb-anchor', ref: rootRef, 'data-composer-stat': 'token-budget' },
        h(
          'button',
          {
            type: 'button',
            ref: buttonRef,
            className: 'tb-pill',
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            'aria-label': '额度与费用',
            title: pillTitle,
            onClick: () => setOpen((value) => !value),
          },
          h('span', { className: 'tb-yen', 'aria-hidden': true }, '¥'),
          h('span', { className: 'tb-label' }, balanceText),
          costText !== null
            ? h(
                React.Fragment,
                null,
                h('span', { className: 'tb-sep', 'aria-hidden': true }, '·'),
                h('span', { className: 'tb-label' }, costText),
              )
            : null,
        ),
      );

      if (!open) return pill;

      const startCredit = ready ? Math.max(0, primary.total) + (cost?.total ?? 0) : 0;
      const percent = startCredit > 0 && cost !== null ? (cost.total / startCredit) * 100 : 0;
      const barClass = percent >= 90 ? 'tb-danger' : percent >= 70 ? 'tb-warn' : '';
      const turns = Number(stats?.turns) || 0;
      const averageTurn = cost !== null && cost.total > 0 && turns > 0 ? cost.total / turns : null;
      const remainingTurns = ready && averageTurn !== null && primary.total > 0 ? Math.floor(primary.total / averageTurn) : null;
      const remainingTokens =
        ready && cost !== null && cost.total > 0 && cost.totalTokens > 0 && primary.total > 0
          ? (primary.total * cost.totalTokens) / cost.total
          : null;
      const priceTier = tier === 'peak' ? '高峰价' : '空闲价';

      function statusBlock() {
        if (status === 'loading' || status === 'idle') {
          return h('div', { className: 'tb-empty' }, h('strong', null, '正在读取余额…'), '首次读取通常只需一两秒。');
        }
        if (status === 'signed-out') {
          return h(
            'div',
            { className: 'tb-empty' },
            h('strong', null, '未登录 DeepSeek 账号'),
            '登录后这里会显示账户余额；使用 API Key 时请在开放平台查看余额。',
          );
        }
        if (status === 'unsupported') {
          return h(
            'div',
            { className: 'tb-empty' },
            h('strong', null, '当前客户端无法读取余额'),
            '账号服务未安装或不可用；本会话的 token 与费用仍会照常估算。',
          );
        }
        if (status === 'empty') {
          return h(
            'div',
            { className: 'tb-empty' },
            h('strong', null, '没有可用的余额钱包'),
            '账户尚未充值或赠送余额为空。',
          );
        }
        if (status === 'error') {
          return h(
            'div',
            { className: 'tb-empty' },
            h('strong', null, '余额读取失败'),
            budget?.error ? String(budget.error) : '请稍后重试。',
            h(
              'div',
              { style: { marginTop: '6px' } },
              h(
                'button',
                {
                  type: 'button',
                  className: 'tb-refresh',
                  onClick: () => typeof refreshBudget === 'function' && refreshBudget(true),
                },
                '重试',
              ),
            ),
          );
        }
        return null;
      }

      const balanceSection = ready
        ? h(
            React.Fragment,
            null,
            h('div', { className: 'tb-sub', style: { marginTop: 0, marginBottom: 2 } }, '可用余额'),
            h('div', { className: 'tb-balance' + (primary.total < 0 ? ' tb-negative' : '') }, formatBalance(primary.total, primary.currency)),
            h(
              'div',
              { className: 'tb-sub' },
              '充值 ',
              formatBalance(primary.toppedUp, primary.currency),
              ' · 赠送 ',
              formatBalance(primary.granted, primary.currency),
              wallets.length > 1
                ? ' · ' +
                  wallets
                    .filter((wallet) => wallet !== primary)
                    .map((wallet) => formatBalance(wallet.total, wallet.currency))
                    .join(' · ')
                : '',
            ),
            cost !== null && cost.total > 0
              ? h(
                  React.Fragment,
                  null,
                  h('div', { className: 'tb-bar' }, h('i', { className: barClass, style: { width: Math.max(0.5, Math.min(100, percent)) + '%' } })),
                  h(
                    'div',
                    { className: 'tb-meter' },
                    '本会话估算 ',
                    h('b', null, formatCost(cost.total, currency, false)),
                    ' · 占起始额度 ',
                    h('b', null, formatPercent(percent)),
                    remainingTurns !== null ? h(React.Fragment, null, ' · 约可再用 ', h('b', null, remainingTurns > 999 ? '999+' : String(remainingTurns)), ' 轮') : null,
                    remainingTokens !== null ? h(React.Fragment, null, ' · ', h('b', null, formatTokens(remainingTokens)), ' tokens') : null,
                  ),
                )
              : h('div', { className: 'tb-meter', style: { marginTop: '10px' } }, '本会话尚未产生可估算的费用。'),
          )
        : statusBlock();

      const usageRows =
        usage !== undefined
          ? [
              cost !== null && cost.hitTokens > 0 ? [ '缓存命中输入', formatTokens(cost.hitTokens) ] : null,
              cost !== null && cost.missTokens > 0 ? [ '缓存未命中输入', formatTokens(cost.missTokens) ] : null,
              cost !== null && cost.cacheWriteTokens > 0 ? [ '缓存写入', formatTokens(cost.cacheWriteTokens) ] : null,
              [ '输出', formatTokens(cost !== null ? cost.outputTokens : tokenNumber(usage?.outputTokens)) ],
              [ '合计', formatTokens(cost !== null ? cost.totalTokens : 0) ],
            ].filter(Boolean)
          : [];

      const costRows =
        cost !== null
          ? [
              cost.hitTokens > 0 ? [ '缓存命中输入', formatCost(cost.hit, currency, false) ] : null,
              cost.missTokens + cost.cacheWriteTokens > 0 ? [ '缓存未命中输入', formatCost(cost.miss, currency, false) ] : null,
              cost.outputTokens > 0 ? [ '输出', formatCost(cost.out, currency, false) ] : null,
              cost.saved > 0.00005 ? [ '缓存命中已节省', formatCost(cost.saved, currency, false) ] : null,
              [ '合计', formatCost(cost.total, currency, false), 'tb-sum' ],
            ].filter(Boolean)
          : [];

      const dialog = h(
        'div',
        {
          ref: panelRef,
          className: 'tb-panel',
          role: 'dialog',
          'aria-label': '额度与费用',
          tabIndex: -1,
          style: pos ?? { left: 12, bottom: 80, width: 352, maxHeight: 520 },
        },
        h(
          'div',
          { className: 'tb-head' },
          h('span', { className: 'tb-title' }, '额度与费用'),
          h(
            'button',
            {
              type: 'button',
              className: 'tb-refresh',
              disabled: budget?.refreshing === true,
              onClick: () => {
                if (typeof refreshBudget === 'function') refreshBudget(true);
              },
            },
            budget?.refreshing === true ? '刷新中…' : '刷新',
          ),
        ),
        balanceSection,
        budget?.staleError
          ? h(
              'div',
              { className: 'tb-note', style: { color: 'var(--dsw-alias-state-warning-primary,#d97706)' } },
              '余额刷新失败：',
              String(budget.staleError),
              '（显示上次结果）',
            )
          : null,
        h('div', { className: 'tb-rule' }),
        h('div', { style: { color: 'var(--dsw-alias-label-primary)', fontWeight: 500, marginBottom: '6px' } }, 'Token 用量（本会话）'),
        usageRows.length > 0
          ? h(
              'dl',
              { className: 'tb-dl' },
              usageRows.map(([ label, value ]) => h(React.Fragment, { key: label }, h('dt', null, label), h('dd', null, value))),
            )
          : h('div', { className: 'tb-empty' }, h('strong', null, '暂无 token 记录'), '完成第一轮对话后会显示用量。'),
        cost !== null
          ? h(
              React.Fragment,
              null,
              h('div', { className: 'tb-rule' }),
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' } },
                h('span', { style: { color: 'var(--dsw-alias-label-primary)', fontWeight: 500 } }, '费用估算'),
                h('span', { className: 'tb-tag' }, model, ' · ', priceTier),
              ),
              costRows.length > 0
                ? h(
                    'dl',
                    { className: 'tb-dl' },
                    costRows.map(([ label, value, className ]) =>
                      h(React.Fragment, { key: label }, h('dt', { className: className ?? '' }, label), h('dd', { className: className ?? '' }, value)),
                    ),
                  )
                : h('div', { className: 'tb-meter' }, '本会话尚未产生费用。'),
            )
          : null,
        h(
          'div',
          { className: 'tb-note' },
          '按 DeepSeek 官方价目表估算，仅供参照，实际扣费以平台账单为准。',
          budget?.updatedAt ? ' 余额更新于 ' + formatRelative(budget.updatedAt) + '。' : '',
        ),
      );

      const panel =
        typeof ReactDOM?.createPortal === 'function' && typeof document !== 'undefined'
          ? ReactDOM.createPortal(dialog, document.body)
          : dialog;

      return h(React.Fragment, null, pill, panel);
    }

    // ── plugin entry ──────────────────────────────────────────────────────
    function apply(ctx) {
      ensureStyles();
      const store = createBudgetStore(ctx);
      ctx.effect(
        () => () => {
          store.dispose();
        },
        'token-budget: balance store lifetime',
      );

      ctx.slots.inject('conversation.composer.dock', function* () {
        yield ctx.slots.register(
          {
            name: 'conversation.composer.dock',
            id: 'token-budget',
            order: 2,
            inject: () => ({
              hooks: { tokenBudget: store.source },
              refreshBudget: (force) => store.refresh(force === true),
              scheduleBudgetRefresh: (delay) => store.scheduleRefresh(delay),
            }),
          },
          TokenBudgetPill,
        );
      });
    }

    module.exports = {
      name: NS,
      inject: [ 'slots', 'remote' ],
      apply,
    };
    return module.exports;
  },
});
