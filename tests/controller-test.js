'use strict';

const ModulesPath = require('@janiscommerce/modules-path');

const mockRequire = require('mock-require');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const { Controller } = require('./../index');
const ControllerError = require('./../controller/controller-error');

/* eslint-disable prefer-arrow-callback */

describe('Controller', function() {

	afterEach(() => {
		sandbox.restore();
		mockRequire.stopAll();
	});

	it('should throws when ModulesPath not found the file', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns(false);

		assert.throws(() => {
			Controller.get('foo');
		}, ControllerError);
	});

	it('should throws when ModulesPath found the file, buu require not', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo');

		assert.throws(() => {
			Controller.get('foo');
		}, ControllerError);
	});

	it('should return class when found by ModulesPath and require works', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo');

		const mockClass = class foo {
			bar() {}
		};

		mockRequire('path/to/foo', mockClass);

		const gettedClass = Controller.get('foo');

		assert.deepEqual(mockClass, gettedClass);
	});

});
