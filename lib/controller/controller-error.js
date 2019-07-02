'use strict';

class ControllerError extends Error {

	static get codes() {

		return {
			INVALID_CONTROLLER: 1,
			WRONG_CALLBACK: 2
		};
	}

	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'ControllerError';
	}
}

module.exports = ControllerError;
