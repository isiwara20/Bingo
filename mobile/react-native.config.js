/**
 * React Native CLI config
 * Explicitly sets the project root so Gradle can resolve node_modules
 * correctly on Windows when building from the android/ subdirectory.
 */
module.exports = {
  project: {
    android: {
      sourceDir: './android',
    },
  },
};
