import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency, load } from '../../util/plugin.js';
import type { LintStagedConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/okonet/lint-staged

const NAME = 'lint-staged';

const ENABLERS = ['lint-staged'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PACKAGE_JSON_PATH = 'lint-staged';

const CONFIG_FILE_PATTERNS = [
  '.lintstagedrc',
  '.lintstagedrc.json',
  '.lintstagedrc.{yml,yaml}',
  '.lintstagedrc.{js,mjs,cjs}',
  'lint-staged.config.{js,mjs,cjs}',
  'package.json',
];

const findLintStagedDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  let localConfig: LintStagedConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest['lint-staged'] : await load(configFilePath);

  if (typeof localConfig === 'function') localConfig = localConfig();

  if (!localConfig) return [];

  const dependencies = new Set<string>();

  for (const entry of Object.values(localConfig).flat()) {
    const scripts = [typeof entry === 'function' ? await entry([]) : entry].flat();
    getDependenciesFromScripts(scripts, options).forEach(identifier => dependencies.add(identifier));
  }

  return Array.from(dependencies);
};

const findDependencies = timerify(findLintStagedDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
