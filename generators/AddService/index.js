'use strict';

var path      = require('path')
, Generator    = require('yeoman-generator')
, yosay     = require('yosay');
var GuestGenerator = class extends Generator{
    constructor(args, opts) {
        super(args, opts);

        this.desc('Generate Service Fabric container application template - Add Service');
        var chalk = require('chalk');
        if (this.config.get('projName')) {
        console.log(chalk.green("Setting project name to", this.config.get('projName')));
        } else {
        var err = chalk.red("Project name not found in .yo-rc.json. Exiting ...");
        throw err;
        }
    }

    async prompting() {

        var prompts = [];

        await this.prompt(prompts).then(props => {
            this.props = props;
            this.props.projName = this.config.get('projName');
        });
    }

    writing() {
        var isAddNewService = true;
        this.composeWith('azuresfcontainer:guestcontainer', {
            options: { isAddNewService: isAddNewService }
        });
    }

    end() {
        this.config.save();
    }
};

module.exports = GuestGenerator;

