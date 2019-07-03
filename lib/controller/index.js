'use strict';

const path = require('path');
const ModulesPath = require('@janiscommerce/modules-path');

const ControllerError = require('./controller-error');

const Utils = require('./../utils');

const Model = require('./../model');

const DEFAULT_PAGE_LIMIT = 500;

class Controller {

	set client(client) {
		this._client = client;
	}

	get client() {
		return this._client;
	}

	static get defaultPageLimit() {
		return DEFAULT_PAGE_LIMIT;
	}

	static get folder() {
		return 'controllers';
	}

	static get controllersFilePath() {
		const prefix = typeof process.env.MS_PATH === 'string' ? process.env.MS_PATH : '';
		return path.join(prefix, this.folder);
	}

	static get(controllerName) {

		controllerName = controllerName.toLowerCase();
		const modulePath = ModulesPath.get(this.controllersFilePath, controllerName);

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

		if(!this._modelInstance) {
			this._modelInstance = Model.getInstance(this.constructor.name);

			if(this.client)
				this._modelInstance.client = this.client;
		}

		return this._modelInstance;
	}

	getController(controllerName) {
		const controller = this.constructor.getInstance(controllerName);

		if(this.client)
			controller.client = this.client;

		return controller;
	}

	/**
	 * Get database data
	 *
	 * @param {object} params The parameters
	 * @return {Promise<mixed>} Object if single, array of object if no change keys, object with objects if change keys, null if no results
	 */
	async get(params = {}) {

		const items = await this
			.getModel()
			.get(params);

		if(typeof items === 'undefined')
			return null;

		const results = await this.prepareGetResults(items, params);

		return results;
	}

	async prepareGetResults(items, params) {

		const wasObject = !Array.isArray(items);

		if(wasObject)
			items = [items];
		else if(!items.length)
			return [];

		const indexes = {};
		const ids = [];

		let newItems = items.map((item, index) => {

			const newItem = this.formatGet ? this.formatGet(item) : item;

			if(this.afterGet && newItem.id) {
				indexes[newItem.id] = index;
				ids.push(newItem.id);
			}

			return newItem;
		});

		if(this.afterGet)
			newItems = await this.afterGet([...newItems], params, indexes, ids);

		if(wasObject)
			return newItems[0];

		return params.changeKeys ? Utils.changeKeys(newItems, params.changeKeys) : newItems;
	}

	/**
	 * Get Paged database data
	 *
	 * @param {object} data Data for where
	 * @param {function} callback Function to call for each batch of items
	 */
	async getPaged(data = {}, callback) {

		if(!callback || typeof callback !== 'function')
			throw new ControllerError('Callback should be a function', ControllerError.codes.WRONG_CALLBACK);

		// se copia para que no se alteren las paginas y limites originales
		const params = { ...data };

		if(!params.page)
			params.page = 1;

		if(!params.limit)
			params.limit = this.constructor.defaultPageLimit;

		const items = await this.get(params);

		if(!items || !items.length)
			return;

		await callback.call(null, items, params.page, params.limit);

		const newParams = { ...params };

		newParams.page++;

		if(items.length === newParams.limit)
			this.getPaged(newParams, callback);
	}

	async getTotals() {

		return this
			.getModel()
			.getTotals();
	}

	async insert(item) {

		return this
			.getModel()
			.insert(item);
	}

	async save(item) {

		return this
			.getModel()
			.save(item);
	}

	async update(values, filter) {

		return this
			.getModel()
			.update(values, filter);
	}

	async remove(item) {

		return this
			.getModel()
			.remove(item);
	}

	async multiInsert(items) {

		return this
			.getModel()
			.multiInsert(items);
	}

	async multiSave(items) {

		return this
			.getModel()
			.multiSave(items);
	}

	async multiRemove(filter) {

		return this
			.getModel()
			.multiRemove(filter);
	}
}

module.exports = Controller;
