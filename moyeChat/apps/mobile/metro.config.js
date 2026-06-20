const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'common/temp/node_modules')
];
config.resolver.disableHierarchicalLookup = false;

// assistant-ui 的可选云服务依赖，此 scaffold 不使用
config.resolver.extraNodeModules = {
  'assistant-cloud': path.resolve(projectRoot, 'stubs/assistant-cloud'),
};

module.exports = config;
