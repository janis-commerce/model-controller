'use strict';

const path = require('path');
const ModulesPath = require('@janiscommerce/modules-path');

const DatabaseDispatcher = require('@janiscommerce/database-dispatcher');

const ModelError = require('./model-error');

const Utils = require('./../utils');

class Model {

	static get folder() {
		return 'models';
	}

	static get(modelName) {

		const prefix = typeof process.env.MS_PATH === 'string' ? process.env.MS_PATH : '';
		const modulePath = ModulesPath.get(path.join(prefix, this.folder), modelName);

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

	get db() {
		return DatabaseDispatcher.getDatabase(this.databaseKey);
	}

	async get(params = {}) {
		return this.db.get(params);
	}

}

module.exports = Model;
