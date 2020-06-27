const fs = require('fs');
const path = require('path');
const tarFs = require('tar-fs');
const gunzip = require('gunzip-maybe');
const glob = require('glob');

module.exports = (api, options) => {
    api.registerCommand(
        'bundle',
        {
            description: 'Bundles your plugin into an installable plugin-package',
            usage: 'vue-cli-service package [options]',
            options: {
                '--plugin': 'If the bundler bundles a Splitterino Plugin. Cannot be used in conjunction with --template',
                '--template': 'If the bundler bundles a Splitterino Template. Cannot be used in conjunction with --plugin',
                '--files': 'Specifies the files to bundle up. Uses the glob-pattern (ie. **/*.js)',
                '--meta': 'Specifies the meta-file to bunlde up, instead of creating one from the package.json',
                '--skip-meta': 'If it should skip the inclusion of the meta-file completely',
                '--output': 'Specifies the output-file of the bundled plugin-package. Defaults to "[package-name].splplg"',
            },
        },
        args => {
            const pkg = JSON.parse(fs.readFileSync(api.resolve('package.json')));
            let outFile = api.resolve(pkg.name + '.splplg');
            let filesGlob = options.outputDir + '/**/*';
            let meta = {
                name: pkg.name,
                version: pkg.version,
                author: pkg.author != null && typeof pkg.author === 'object' ? pkg.author.name : pkg.author,
                compatibleVersion: pkg.splitterino.compatibleVersion,
                repositoryURL: pkg.splitterino.repositoryURL,
            }

            if (typeof args.files === 'string') {
                filesGlob = args.files;
            }

            if (!args['skip-meta'] && typeof args.meta === 'string') {
                try {
                    meta = JSON.parse(fs.readFileSync(path.resolve(args.meta)));
                } catch (err) {
                    console.error(`The file "${args.meta}" could not be found/loaded!`);
                    return false;
                }
            }

            if (typeof ((options.pluginOptions || {}).splitterino || {}).bundleFile === 'string') {
                outFile = api.resolve(options.pluginOptions.splitterino.bundleFile);
            }

            if (typeof args.output == 'string') {
                outFile = path.resolve(args.output);
            }

            const outStream = fs.createWriteStream(outFile);
            
            tarFs
                .pack(api.resolve('./'), {
                    entries: glob.sync(filesGlob, {
                        root: api.resolve('./'),
                    }),
                    finalize: false,
                    finish: (pack) => {
                        if (!args['skip-meta']) {
                            pack.entry({ name: 'meta.json' }, JSON.stringify(meta, null, 4));
                        }
                    },
                })
                .pipe(gunzip())
                .pipe(outStream);
        }
    )
};
