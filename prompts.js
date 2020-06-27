module.exports = [
    {
        name: 'bundleType',
        type: 'list',
        message: 'What kind of type Splitterino extension is this Project?',
        choices: [
            { value: 'plugin', name: 'Plugin' },
            { value: 'template', name: 'Template' },
        ],
    }
];
