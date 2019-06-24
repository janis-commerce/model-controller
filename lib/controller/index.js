'use strict';

const path = require('path');
const ModulesPath = require('@janiscommerce/modules-path');

const ControllerError = require('./controller-error');

const Utils = require('./../utils');

const Model = require('./../model');

class Controller {

	static get folder() {
		return 'controllers';
	}

	static get(controllerName) {

		const prefix = typeof process.env.MS_PATH === 'string' ? process.env.MS_PATH : '';
		const modulePath = ModulesPath.get(path.join(prefix, this.folder), controllerName);

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

		const results = await this.prepareGetResults(items, params);

		return results;
	}

	async prepareGetResults(items, params) {

		if(typeof items === 'undefined')
			return null;

		const wasObject = !Array.isArray(items);

		if(wasObject)
			items = [items];
		else if(!items.length)
			return [];

		const indexes = {};
		const ids = [];

		items.forEach((item, index) => {

			if(this.formatGet)
				this.formatGet(item);

			if(this.afterGet && item.id) {
				indexes[item.id] = index;
				ids.push(item.id);
			}
		});

		if(this.afterGet)
			await this.afterGet(items, indexes, ids, params);

		if(wasObject)
			return items[0];

		return params.changeKeys ? Utils.changeKeys(items, params.changeKeys) : items;
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
