/**
 * Host half of dsh-token-budget-pill.
 *
 * Intentionally inert: the balance read, pricing and rendering all live in the
 * browser bundle (`lib/client.js`). A host entry still exists because the
 * client-module scanner only exposes `dsh.client` bundles of enabled Loader
 * entries.
 */
export const name = 'dsh-token-budget-pill';

export const inject = [];

/** @param {unknown} ctx - host Cordis context (unused). */
export function apply(ctx) {
  void ctx;
}
