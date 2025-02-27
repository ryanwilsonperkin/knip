import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency, load } from '../../util/plugin.js';
import type { ReleaseItConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/release-it/release-it/blob/master/docs/plugins.md#using-a-plugin

const NAME = 'Release It';

const ENABLERS = ['release-it'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PACKAGE_JSON_PATH = 'release-it';

const CONFIG_FILE_PATTERNS = ['.release-it.json', '.release-it.{js,cjs}', '.release-it.{yml,yaml}', 'package.json'];

const findReleaseItDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: ReleaseItConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest[PACKAGE_JSON_PATH] : await load(configFilePath);

  if (!localConfig) return [];

  const plugins = localConfig.plugins ? Object.keys(localConfig.plugins) : [];
  const scripts = localConfig.hooks ? Object.values(localConfig.hooks).flat() : [];
  if (typeof localConfig.github?.releaseNotes === 'string') {
    scripts.push(localConfig.github.releaseNotes);
  }
  if (typeof localConfig.gitlab?.releaseNotes === 'string') {
    scripts.push(localConfig.gitlab.releaseNotes);
  }
  const dependencies = getDependenciesFromScripts(scripts, options);

  return [...plugins, ...dependencies];
};

const findDependencies = timerify(findReleaseItDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
