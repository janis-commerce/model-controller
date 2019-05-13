'use strict';

class ControllerError extends Error {

	static get codes() {

		return {
			INVALID_CONTROLLER: 1
		};

	}

	constructor(err) {
		super(err);
		this.message = err.message || err;
		this.name = 'ControllerError';
	}
}

module.exports = ControllerError;
