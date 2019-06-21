'use strict';

class ModelError extends Error {

	static get codes() {

		return {
			INVALID_MODEL: 1
		};
	}

	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'ModelError';
	}
}

module.exports = ModelError;
