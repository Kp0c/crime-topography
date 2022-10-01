/**
 * animations duration
 * @type {number}
 */
export const ANIMATION_DURATION = 1000;

/**
 * ukraine boundaries in long/lat
 * @type {{lonMax: number, latMin: number, latMax: number, lonMin: number}}
 */
export const UKRAINE_BOUNDARIES = {
  latMin: 44.3615,
  latMax: 52.37,
  lonMin: 22.1456,
  lonMax: 40.25,
};

/**
 * ukraine boundaries ranges
 * @type {{latRange: number, lonRange: number}}
 */
export const UKRAINE_BOUNDARIES_RANGES = {
  latRange: UKRAINE_BOUNDARIES.latMax - UKRAINE_BOUNDARIES.latMin,
  lonRange: UKRAINE_BOUNDARIES.lonMax - UKRAINE_BOUNDARIES.lonMin,
};
