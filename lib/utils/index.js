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

}

module.exports = Utils;
