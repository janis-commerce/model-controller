'use strict';

const ModulesPath = require('@janiscommerce/modules-path');

const ModelError = require('./model-error');

const Utils = require('./../utils');

class Model {

	static get folder() {
		return 'models';
	}

	static get(modelName) {

		const modulePath = ModulesPath.get(this.folder, modelName);

		if(!modulePath)
			throw new ModelError(`Model ${modelName} class not found`, ModelError.codes.INVALID_MODEL);

		const modelClass = Utils.catchRequire(modulePath);

		if(!modelClass)
			throw new ModelError(`Invalid Model ${modelName}`, ModelError.codes.INVALID_MODEL);

		return modelClass;
	}

	static getInstance(modelName) {
		return new (this.get(modelName))();
	}

}

module.exports = Model;