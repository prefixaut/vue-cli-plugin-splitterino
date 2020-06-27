module.exports = (api, options) => {
    api.extendPackage({
        scripts: {
            bundle: `vue-cli-service bundle --${options.bundleType || 'plugin'}`,
        },
        splitterino: {
            compatibleVersion: ">=0.3.0",
        },
        devDependencies: {
            splitterino: '^0.3.0',
        }
    })
};
