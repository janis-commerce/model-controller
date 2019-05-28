'use strict';

const ModulesPath = require('@janiscommerce/modules-path');

const ControllerError = require('./controller-error');

const Utils = require('./../utils');

const Model = require('./../model');

class Controller {

	static get folder() {
		return 'controllers';
	}

	static get(controllerName) {

		const modulePath = ModulesPath.get(this.folder, controllerName);

		if(!modulePath)
			throw new ControllerError(`Controller ${controllerName} class not found`, ControllerError.codes.INVALID_CONTROLLER);

		const controllerClass = Utils.catchRequire(modulePath);

		if(!controllerClass)
			throw new ControllerError(`Invalid Controller ${controllerName}`, ControllerError.codes.INVALID_CONTROLLER);

		return controllerClass;
	}

	static getInstance(controllerName) {
		return new (this.get(controllerName))();
	}

	getModel() {

		if(!this._modelInstance)
			this._modelInstance = Model.getInstance(this.constructor.name);

		return this._modelInstance;
	}

}

module.exports = Controller;
