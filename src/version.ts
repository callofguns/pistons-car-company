import pkg from '../package.json'

/** Single source of truth: package.json's "version" field, shown on the Main Menu as e.g. "V1.0.0". Bump package.json directly to release a new version. */
export const APP_VERSION = `V${pkg.version}`
