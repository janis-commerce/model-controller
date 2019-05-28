'use strict';

const ModulesPath = require('@janiscommerce/modules-path');

const mockRequire = require('mock-require');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const { Model } = require('./../index');
const ModelError = require('./../model/model-error');

/* eslint-disable prefer-arrow-callback */

describe('Model', function() {

	const fooModel = class FooModel {};

	before(() => {
		mockRequire('path/to/foo-model', fooModel);
	});

	afterEach(() => {
		sandbox.restore();
	});

	after(() => {
		mockRequire.stopAll();
	});

	const testThrows = (modelName, code) => {
		assert.throws(() => {
			Model.get(modelName);
		}, {
			name: 'ModelError',
			code
		});
	};

	it('should throws when ModulesPath not found the file', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns(false);

		testThrows('foo', ModelError.codes.INVALID_MODEL);
	});

	it('should throws when ModulesPath found the file, but require fails', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/bar');

		testThrows('bar', ModelError.codes.INVALID_MODEL);
	});

	it('should return class when found by ModulesPath and require works', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo-model');

		const gettedClass = Model.get('foo');

		assert.deepEqual(fooModel, gettedClass);
	});

	it('should return an instance when found by ModulesPath and require works', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo-model');

		const fooInstance = Model.getInstance('FooModel');

		assert(fooInstance instanceof fooModel);
	});

});
