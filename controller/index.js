'use strict';

const logger = require('@janiscommerce/logger');
const ModulesPath = require('@janiscommerce/modules-path');

const ControllerError = require('./controller-error');

class Controller {

	static get folder() {
		return 'controllers';
	}

	static get(controllerName) {

		const modulePath = ModulesPath.get(this.folder, controllerName);

		if(!modulePath)
			throw new ControllerError(`Invalid Controller ${controllerName}`, ControllerError.INVALID_CONTROLLER);

		let ControllerClass;

		try {

			/* eslint-disable global-require, import/no-dynamic-require */

			ControllerClass = require(modulePath);

			/* eslint-enable */

		} catch(e) {

			if(e instanceof ReferenceError || e instanceof TypeError || e instanceof SyntaxError || e instanceof RangeError
				|| e.code !== 'MODULE_NOT_FOUND' || !(~e.message.indexOf(modulePath)))
				logger.error('Module', e);

			throw new ControllerError(`Invalid Controller ${controllerName}`, ControllerError.INVALID_CONTROLLER);
		}

		return ControllerClass;
	}

}

module.exports = Controller;
