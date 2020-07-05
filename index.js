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
                '--plugin':
                    'If the bundler bundles a Splitterino Plugin. Cannot be used in conjunction with --template',
                '--template':
                    'If the bundler bundles a Splitterino Template. Cannot be used in conjunction with --plugin',
                '--files': 'Specifies the files to bundle up. Uses the glob-pattern (ie. **/*.js)',
                '--meta': 'Specifies the meta-file to bunlde up, instead of creating one from the package.json',
                '--skip-meta': 'If it should skip the inclusion of the meta-file completely',
                '--output':
                    'Specifies the output-file of the bundled plugin-package. Defaults to "[package-name].[ext]"',
            },
        },
        args => {
            let ext;

            if (args.plugin !== true && args.template !== true) {
                throw new Error('You need to specify which bundle method to use ("--plugin" or "--template")!');
            } else if (args.plugin === args.template) {
                throw new Error('You may only specify one bundle method!');
            } else if (args.plugin) {
                ext = '.splplg';
            } else if (args.template) {
                ext = '.spltpl';
            }

            const outFile = getOutFile(api, options, args, ext);
            const meta = getMeta(api, options);
            const filesGlob = getFilesGlob(args);
            const outStream = fs.createWriteStream(outFile);

            tarFs
                .pack(api.resolve(`./${options.outputDir}`), {
                    entries: glob.sync(filesGlob, {
                        root: api.resolve(`./${options.outputDir}`),
                    }),
                    ignore: name => path.extname(name) === '.splplg',
                    finalize: false,
                    finish: pack => {
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

function getMeta(args) {
    let meta = {
        name: pkg.name,
        version: pkg.version,
        author: pkg.author != null && typeof pkg.author === 'object' ? pkg.author.name : pkg.author,
        compatibleVersion: pkg.splitterino.compatibleVersion,
        repositoryURL: pkg.splitterino.repositoryURL,
    }

    if (!args['skip-meta'] && typeof args.meta === 'string') {
        try {
            meta = JSON.parse(fs.readFileSync(path.resolve(args.meta)));
        } catch (err) {
            throw new Error(`The file "${args.meta}" could not be found/loaded!`);
        }
    }

    return meta;
}

function getOutFile(api, options, args, ext) {
    const pkg = JSON.parse(fs.readFileSync(api.resolve('package.json')));
    const normalizedName = pkg.name.replace(/[^a-zA-Z0-9_\-@\$]/g, '-');
    let outFile = api.resolve(`./${options.outputDir}/${normalizedName}${ext}`);

    if (typeof ((options.pluginOptions || {}).splitterino || {}).bundleFile === 'string') {
        outFile = api.resolve(options.pluginOptions.splitterino.bundleFile);
    }

    if (typeof args.output == 'string') {
        outFile = path.resolve(args.output);
    }

    return outFile;
}

function getFilesGlob(args) {
    let filesGlob = `**/*`;

    if (typeof args.files === 'string') {
        filesGlob = args.files;
    }

    return filesGlob;
}
