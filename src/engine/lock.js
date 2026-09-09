// The site is locked by default so random clicks don't change your
// checked-off items. Typing this password unlocks editing for the rest of
// the browser tab. The password itself is never written in this file — it
// comes from:
//   - .env.local on your own computer (for `npm run dev`)
//   - the EDIT_PASSWORD secret in GitHub Actions (for the live site)
// One password unlocks every checklist — there's no reason (yet) for each
// one to have its own.
//
// Heads up: since this is a plain static website (no server), someone who
// really wanted to could still dig the password out of the deployed code.
// This is just a "don't touch my stuff by accident" lock, not a vault.
const EDIT_PASSWORD = import.meta.env.VITE_EDIT_PASSWORD

if (!EDIT_PASSWORD) {
  console.warn(
    'VITE_EDIT_PASSWORD is not set — editing will be impossible to unlock. ' +
    'Add it to .env.local for local dev, or as a GitHub Actions secret for deploys.'
  )
}

export function checkPassword(entered) {
  return entered === EDIT_PASSWORD
}
