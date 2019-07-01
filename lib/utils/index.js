'use strict';

const logger = require('@janiscommerce/logger');

class Utils {

	static catchRequire(modulePath) {

		let moduleContent;

		try {

			/* eslint-disable global-require, import/no-dynamic-require */
			moduleContent = require(modulePath);
			/* eslint-enable */

		} catch(e) {

			if(e instanceof ReferenceError || e instanceof TypeError || e instanceof SyntaxError || e instanceof RangeError
				|| e.code !== 'MODULE_NOT_FOUND' || !(~e.message.indexOf(modulePath)))
				logger.error('Module', e);

			moduleContent = false;
		}

		return moduleContent;
	}

	/**
	 * Change keys
	 *
	 * @param {array} items The items
	 * @param {string} newKey The new key
	 * @return {object} the new list of items with keys if exist
	 * @example
	 * 	Utils.changeKeys([{ id: 1, foo: 'bar' }, { id: 2, foo: 'bar2' }], 'id'); // { 1: { id: 1, foo: 'bar' }, 2: { id: 2, foo: 'bar2' } }
	 * 	Utils.changeKeys([{ id: 1, foo: 'bar' }, { id: 2, foo: 'bar2' }], 'foo'); // { bar: { id: 1, foo: 'bar' }, bar2: { id: 2, foo: 'bar2' } }
	 * 	Utils.changeKeys([{ id: 1, foo: 'bar' }, { id: 2, foo: 'bar2' }], 'wrongKey'); // {}
	 */
	static changeKeys(items = [], newKey) {

		const newItems = {};

		items.forEach(item => {
			if(newKey in item && item[newKey] !== null)
				newItems[item[newKey]] = item;
		});

		return newItems;

	}

}

module.exports = Utils;
