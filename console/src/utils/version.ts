import semver from "semver";

const VERSION_REGEX = /^\d+\.\d+\.\d+$/g;

/**
 * Checks if a given version satisfies a required version range.
 *
 * @see https://github.com/halo-dev/halo/blob/a5a69780a37410d2734043d6cae1b718b57c722b/application/src/main/java/run/halo/app/infra/utils/VersionUtils.java#L18
 * @param version - The version to check.
 * @param requires - The required version range.
 * @returns A boolean indicating whether the version satisfies the required range.
 */
export function satisfiesRequires(version?: string, requires?: string): boolean {
  if (!version) {
    version = "0.0.0";
  }

  if (!requires) {
    return true;
  }

  requires = requires.trim();

  if (VERSION_REGEX.test(requires)) {
    requires = `>=${requires}`;
  }

  return semver.satisfies(version, requires, { includePrerelease: true });
}
