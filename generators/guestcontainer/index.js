'use strict';

var generators = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path   = require('path');

module.exports = generators.Base.extend({

    constructor: function () {

        generators.Base.apply(this, arguments);

        this.option('serviceName', { type: String, required: false });    
        this.option('imageName', { type: String, required: false });
        this.option('commands', { type: String, required: false });
        this.option('instanceCount', { type: Number, required: false }); 
        this.option('isAddNewService', { type: Boolean, required: true });
        this.isAddNewService = this.options.isAddNewService;

        this.generatorConfig = {};

    }, // constructor()

    _isOptionSet: function(name) {
        return this.options[name] !== undefined;
    },

    /**
    * Prompt users for options
    */
    prompting: {

        askForService: function(){

            var done = this.async();
            var prompts = [

                {
                    name: 'serviceName',
                    message: 'Name of the application service:',
                    default: 'MyService',
                    when: !this._isOptionSet('serviceName')
                },

                {
                    name: 'imageName',
                    message: 'Input the Image Name:',
                    when: !this._isOptionSet('imageName')
                },

                {
                    name: 'commands',
                    message: 'Commands:',
                    when: !this._isOptionSet('commands')
                },

                {
                    name: 'instanceCount',
                    message: 'Number of instances of guest container application:',
                    default: '1',
                    when: !this._isOptionSet('instanceCount')
                },

                {
                    name: 'portMap',
                    message: 'Enter the container host mapping in the following format, container_port:host_port or press enter if not needed:',
                    when: !this._isOptionSet('portMap')
                }
            ];

            this.prompt(prompts, function(props) {
                this.props = props;
                done();
            }.bind(this)
            );

        } // askForService()

    }, // prompting()

    /**
    * Save configurations and configure the project
    */
    configuring: {


    }, // configuring()

    initializing: function () {
        this.props = this.config.getAll();
        this.projName = this.props.projName;
    }, // initializing()
    /**
    * Write the generator specific files
    */
    writing: {

        application: function() {

            var appPackagePath = this.isAddNewService ? this.projName : path.join(this.projName, this.projName);
            var servicePkgName = this.props.serviceName + 'Pkg';
            var serviceTypeName = this.props.serviceName + 'Type';
            var serviceName = this.props.serviceName;
            var appTypeName = this.projName + 'Type';
            var instanceCount = this.props.instanceCount;
            if(this.props.portMap != ""){
                var portMap = this.props.portMap.split(":");
                var portMapContainer = portMap[0];
                var portMapHost = portMap[1];
            }
            else{
                var portMapContainer = "";
                var portMapHost = "";
            }
            var serviceEndPointName = this.props.serviceName + 'Endpoint';

            if (this.isAddNewService) {
                var fs = require('fs');
                var xml2js = require('xml2js');
                var parser = new xml2js.Parser();

                fs.readFile(path.join(appPackagePath, 'ApplicationManifest.xml'), function(err, data) {
                    parser.parseString(data, function (err, result) {
                        if (err) {
                            return console.log(err);
                        }
                        if (portMapHost != "" && portMapContainer != ""){
                            result['ApplicationManifest']['ServiceManifestImport'][result['ApplicationManifest']['ServiceManifestImport'].length] =
                            {
                                "ServiceManifestRef":[{"$":{"ServiceManifestName":servicePkgName, "ServiceManifestVersion":"1.0.0"}}],
                                "Policies":[{"ContainerHostPolicies":[{"$":{"CodePackageRef":"Code"},"PortBinding":[{"$":{"ContainerPort": portMapContainer, "EndpointRef": serviceEndPointName}}]}]}]
                            }
                        result['ApplicationManifest']['DefaultServices'][0]['Service'][result['ApplicationManifest']['DefaultServices'][0]['Service'].length] =
                            {"$":{"Name":serviceName},"StatelessService":[{"$":{"ServiceTypeName":serviceTypeName,"InstanceCount":instanceCount},"SingletonPartition":[""]}]};
                        }
                        else{
                            result['ApplicationManifest']['ServiceManifestImport'][result['ApplicationManifest']['ServiceManifestImport'].length] =
                            {"ServiceManifestRef":[{"$":{"ServiceManifestName":servicePkgName, "ServiceManifestVersion":"1.0.0"}}]}
                        result['ApplicationManifest']['DefaultServices'][0]['Service'][result['ApplicationManifest']['DefaultServices'][0]['Service'].length] =
                            {"$":{"Name":serviceName},"StatelessService":[{"$":{"ServiceTypeName":serviceTypeName,"InstanceCount":instanceCount},"SingletonPartition":[""]}]};
                        }
                        var builder = new xml2js.Builder();
                        var xml = builder.buildObject(result);
                        fs.writeFile(path.join(appPackagePath, 'ApplicationManifest.xml'), xml, function(err) {
                            if(err) {
                                return console.log(err);
                            }
                        });
                    });
                });

            } else { 
                if (portMapHost != "" && portMapContainer != "" ){
                    this.fs.copyTpl(this.templatePath('ApplicationManifestWithPorts.xml'),
                    this.destinationPath(path.join(appPackagePath, '/ApplicationManifest.xml')),
                    {
                        appTypeName: appTypeName,
                        serviceName: serviceName,
                        serviceTypeName: serviceTypeName,
                        servicePkgName: servicePkgName,
                        instanceCount: instanceCount,
                        portMapContainer: portMapContainer,
                        serviceEndPointName: serviceEndPointName
                    }
                );
                }
                else{
                    this.fs.copyTpl(this.templatePath('ApplicationManifest.xml'),
                        this.destinationPath(path.join(appPackagePath, '/ApplicationManifest.xml')),
                        {
                            appTypeName: appTypeName,
                            serviceName: serviceName,
                            serviceTypeName: serviceTypeName,
                            servicePkgName: servicePkgName,
                            instanceCount: instanceCount
                        }
                    );       
                }
            }
        }, 

        service: function() {
            var servicePkg = this.props.serviceName + 'Pkg';
            var serviceTypeName = this.props.serviceName + 'Type';
            var appTypeName = this.projName + 'Type';
            var pkgDir = this.isAddNewService == false ? path.join(this.projName, this.projName) : this.projName;
            var portMapContainer = "";
            var portMapHost = "";
            if(this.props.portMap != ""){
                var portMap = this.props.portMap.split(":");
                var portMapContainer = portMap[0];
                var portMapHost = portMap[1];
            }
            var serviceEndPointName = this.props.serviceName + 'Endpoint';

            if (portMapHost != "" && portMapContainer != "" ){
                this.fs.copyTpl(  this.templatePath('Service/ServiceManifestWithPorts.xml'),
                this.destinationPath(path.join(pkgDir, servicePkg, '/ServiceManifest.xml')),
                {
                    serviceTypeName: serviceTypeName,
                    servicePkgName: servicePkg,
                    imageName: this.props.imageName,
                    commands: this.props.commands,
                    portMapHost: portMapHost,
                    serviceEndPointName: serviceEndPointName
                }
            ); 
            }
            else{
                this.fs.copyTpl(  this.templatePath('Service/ServiceManifest.xml'),
                this.destinationPath(path.join(pkgDir, servicePkg, '/ServiceManifest.xml')),
                {
                    serviceTypeName: serviceTypeName,
                    servicePkgName: servicePkg,
                    imageName: this.props.imageName,
                    commands: this.props.commands
                }
            ); 
            }
            this.fs.copyTpl(  this.templatePath('Service/Settings.xml'),
            this.destinationPath(path.join(pkgDir, servicePkg , '/config/Settings.xml')));
            if (!this.isAddNewService) {
                this.fs.copyTpl(
                    this.templatePath('deploy/install.sh'),
                    this.destinationPath(path.join(this.projName, 'install.sh')),
                    {
                        appPackage: this.projName,
                        appName: this.projName,
                        appTypeName: appTypeName
                    } 
                );

                this.fs.copyTpl(
                    this.templatePath('deploy/uninstall.sh'),
                    this.destinationPath(path.join(this.projName, 'uninstall.sh')),
                    {
                        appPackage: this.projName,
                        appName: this.projName,
                        appTypeName: appTypeName
                    }
                );
            }

        }

    } // writing()

});