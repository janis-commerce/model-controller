'use strict';

const path = require('path');
const ModulesPath = require('@janiscommerce/modules-path');

const DatabaseDispatcher = require('@janiscommerce/database-dispatcher');

const logger = require('@janiscommerce/logger');

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

		if(typeof this._clientFields === 'undefined') {
			try {

				/* eslint-disable global-require, import/no-dynamic-require */
				this._clientFields = require(this.clientConfigFilePath);
				/* eslint-enable */

				if(typeof this._clientFields !== 'object' || Array.isArray(this._clientFields)) {
					logger.error('Client config fields bad format', this._clientFields);
					throw new Error('Client config fields bad format');
				}

			} catch(error) {
				this._clientFields = {};
			}

			this._prepareClientFields();
		}

		return this._clientFields;
	}

	static _prepareClientFields() {

		const clientFields = this._clientFields;

		this._clientFields.read = {
			dbHost: clientFields.dbReadHost || 'dbReadHost',
			dbName: clientFields.dbReadName || 'dbReadName',
			dbUser: clientFields.dbReadUser || 'dbReadUser',
			dbPass: clientFields.dbReadPass || 'dbReadPass',
			dbPort: clientFields.dbReadPort || 'dbReadPort'
		};

		this._clientFields.write = {
			dbHost: clientFields.dbWriteHost || 'dbWriteHost',
			dbName: clientFields.dbWriteName || 'dbWriteName',
			dbUser: clientFields.dbWriteUser || 'dbWriteUser',
			dbPass: clientFields.dbWritePass || 'dbWritePass',
			dbPort: clientFields.dbWritePort || 'dbWritePort'
		};
	}

	get clientConfig() {

		const dbType = this.useReadDB ? 'read' : 'write';
		const clientFields = this.constructor.clientFields[dbType];

		return {
			host: this.client[clientFields.dbHost],
			database: this.client[clientFields.dbName],
			user: this.client[clientFields.dbUser],
			pass: this.client[clientFields.dbPass],
			port: this.client[clientFields.dbPort]
		};
	}

	static get folder() {
		return 'models';
	}

	static get modelsFilePath() {
		const prefix = typeof process.env.MS_PATH === 'string' ? process.env.MS_PATH : '';
		return path.join(prefix, this.folder);
	}

	static get(modelName) {

		const modulePath = ModulesPath.get(this.modelsFilePath, modelName);

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
			return DatabaseDispatcher.getDatabaseByConfig(this.clientConfig);

		throw new ModelError(`Invalid Model ${this.constructor.name} - No database config`, ModelError.codes.DATABASE_CONFIG_NOT_FOUND);
	}

	async get(params = {}) {

		if(params.readonly)
			this.useReadDB = true;

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
