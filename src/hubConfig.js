// Settings for the hub page itself (not any one checklist).
//
// To add a background image: drop the image file in /public/ (e.g.
// /public/hub-background.jpg) and set backgroundImage below to its path.
// Leave it null and the hub just uses the plain dark background it
// already has — nothing breaks either way.
export const HUB_CONFIG = {
  title: "Thodyu's Pokemon Collection",
  // A small personal heading shown above the overall progress bar (not
  // the page's own <h1> above it — this one sits right on the progress
  // card itself). Leave it as '' / null to hide that line entirely.
  collectionLabel: "",
  backgroundImage: 'backgrounds/hub.jpg', // e.g. '/hub-background.jpg'
}