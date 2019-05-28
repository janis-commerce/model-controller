'use strict';

const ModulesPath = require('@janiscommerce/modules-path');

const mockRequire = require('mock-require');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const { Controller, Model } = require('./../index');
const ControllerError = require('./../controller/controller-error');

/* eslint-disable prefer-arrow-callback */

describe('Controller', function() {

	const FooController = class FooController extends Controller {};
	const FooModel = class FooModel extends Model {};

	before(() => {
		mockRequire('path/to/foo-controller', FooController);
		mockRequire('path/to/foo-model', FooModel);
	});

	afterEach(() => {
		sandbox.restore();
	});

	after(() => {
		mockRequire.stopAll();
	});

	const testThrows = (controllerName, code) => {
		assert.throws(() => {
			Controller.get(controllerName);
		}, {
			name: 'ControllerError',
			code
		});
	};

	it('should throws when ModulesPath not found the file', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns(false);

		testThrows('foo', ControllerError.codes.INVALID_CONTROLLER);
	});

	it('should throws when ModulesPath found the file, but require fails', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/bar');

		testThrows('bar', ControllerError.codes.INVALID_CONTROLLER);
	});

	it('should return class when found by ModulesPath and require works', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo-controller');

		const gettedClass = Controller.get('foo');

		assert.deepEqual(FooController, gettedClass);
	});

	it('should return an instance when found by ModulesPath and require works', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo-controller');

		const foo = Controller.getInstance('FooController');

		assert(foo instanceof FooController);
	});

	it('should return a model instance from a controller instance', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo-controller');

		const fooController = Controller.getInstance('FooController');

		assert(fooController instanceof FooController);

		sandbox.restore();

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo-model');

		const fooModel = fooController.getModel();

		assert(fooModel instanceof FooModel);
	});

	it('should cache model instance in the controller instance', function() {

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo-controller');

		const fooController = Controller.getInstance('FooController');

		sandbox.restore();

		sandbox.stub(ModulesPath, 'get')
			.returns('path/to/foo-model');

		const spy = sandbox.spy(Model, 'getInstance');

		const fooModel = fooController.getModel();

		sandbox.assert.calledOnce(spy);

		const sameFooModel = fooController.getModel();

		sandbox.assert.calledOnce(spy);

		assert.deepEqual(fooModel, sameFooModel);
	});
});
