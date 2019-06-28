'use strict';

const path = require('path');
const ModulesPath = require('@janiscommerce/modules-path');

const DatabaseDispatcher = require('@janiscommerce/database-dispatcher');

const ModelError = require('./model-error');

const Utils = require('./../utils');

class Model {

	set client(client) {
		this._client = client;
	}

	get client() {
		return this._client;
	}

	static get clientConfigFilePath() {
		return path.join(process.cwd(), 'config', 'client-fields.json');
	}

	static get clientFields() {

	}

	get clientConfig() {


	}

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
		if(this.databaseKey)
			return DatabaseDispatcher.getDatabaseByKey(this.databaseKey);

		if(this.client)
			return DatabaseDispatcher.getDatabaseByClient(this.clientConfig);

		throw new ModelError(`Invalid Model ${this.constructor.name} - No database config`, ModelError.codes.DATABASE_CONFIG_NOT_FOUND);
	}

	async get(params = {}) {
		return this.db.get(this, params);
	}

	async getTotals() {
		return this.db.getTotals(this);
	}

	async insert(item) {
		return this.db.insert(this, item);
	}

	async save(item) {
		return this.db.save(this, item);
	}

	async update(values, filter) {
		return this.db.update(this, values, filter);
	}

	async remove(item) {
		return this.db.remove(this, item);
	}

	async multiInsert(items) {
		return this.db.multiInsert(this, items);
	}

	async multiSave(items) {
		return this.db.multiSave(this, items);
	}

	async multiRemove(filter) {
		return this.db.multiRemove(this, filter);
	}

}

module.exports = Model;
