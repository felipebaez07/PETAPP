const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// --- Soporte de monorepo (npm workspaces) ---
// Vigila también la raíz del monorepo para que cambios en packages/shared
// disparen recarga en caliente.
config.watchFolders = [workspaceRoot];

// Resuelve node_modules tanto desde apps/mobile como desde la raíz, ya que
// las dependencias compartidas (react, react-native, etc.) están hoisted
// en el node_modules raíz por npm workspaces.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// `@petapp/shared` vive en packages/shared y npm workspaces lo enlaza dentro
// de node_modules/@petapp/shared como symlink. Metro necesita seguir
// symlinks explícitamente para resolverlo y transpilarlo (no tiene build,
// se consume como fuente TypeScript). No excluimos nada vía blockList, así
// que el paquete nunca queda bloqueado por accidente.
config.resolver.unstable_enableSymlinks = true;

module.exports = withNativeWind(config, { input: './global.css' });
