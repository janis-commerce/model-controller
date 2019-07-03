'use strict';

const path = require('path');
const ModulesPath = require('@janiscommerce/modules-path');

const mockRequire = require('mock-require');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const { Controller, Model } = require('..'); // al index
const ControllerError = require('../lib/controller/controller-error');

/* eslint-disable prefer-arrow-callback */

describe('Controller', function() {

	let stubModulesPathGet;

	const FooController = class Foo extends Controller {};
	const BarController = class Bar extends Controller {};
	const FooModel = class Foo extends Model {};

	before(() => {
		mockRequire(path.join(Controller.controllersFilePath, 'foo'), FooController);
		mockRequire(path.join(Controller.controllersFilePath, 'bar'), BarController);
		mockRequire(path.join(Model.modelsFilePath, 'foo'), FooModel);
	});

	const stubModulesPathGetReturns = () => {
		stubModulesPathGet
			.callsFake((filePath, name) => path.join(filePath, name));
	};

	beforeEach(() => {
		delete process.env.MS_PATH;
		stubModulesPathGet = sandbox.stub(ModulesPath, 'get');
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

		stubModulesPathGet
			.returns(false);

		testThrows('foo', ControllerError.codes.INVALID_CONTROLLER);
	});

	it('should throws when ModulesPath found the file, but require fails', function() {

		stubModulesPathGet
			.returns('path/to/bar');

		testThrows('bar', ControllerError.codes.INVALID_CONTROLLER);
	});

	it('should return class when found by ModulesPath and require works', function() {

		stubModulesPathGetReturns();

		const gettedClass = Controller.get('foo');

		assert.deepEqual(FooController, gettedClass);
	});

	it('should return an instance when found by ModulesPath and require works', function() {

		stubModulesPathGetReturns();

		const foo = Controller.getInstance('foo');

		assert(foo instanceof FooController);
	});

	it('should cache model instance in the controller instance', function() {

		stubModulesPathGetReturns();

		const fooController = Controller.getInstance('foo');

		const spy = sandbox.spy(Model, 'getInstance');

		const fooModel = fooController.getModel();

		sandbox.assert.calledOnce(spy);
		sandbox.assert.calledWithExactly(spy, 'Foo');

		const sameFooModel = fooController.getModel();

		sandbox.assert.calledOnce(spy);
		sandbox.assert.calledWithExactly(spy, 'Foo');

		assert.deepEqual(fooModel, sameFooModel);
	});

	context('when controller has the client injected', function() {

		it('should propagate client when controller ask for another controller', function() {

			stubModulesPathGetReturns();

			const fooController = Controller.getInstance('foo');

			fooController.client = {
				id: 1,
				name: 'foo-client'
			};

			const barController = fooController.getController('bar');

			assert.deepEqual(barController.client, {
				id: 1,
				name: 'foo-client'
			});
		});

		it('should return a model instance from a controller instance and propagate the client', function() {

			stubModulesPathGetReturns();

			const fooController = Controller.getInstance('foo');

			fooController.client = {
				id: 1,
				name: 'foo-client'
			};

			assert(fooController instanceof FooController);

			const fooModel = fooController.getModel();

			assert(fooModel instanceof FooModel);

			assert.deepEqual(fooModel.client, {
				id: 1,
				name: 'foo-client'
			});
		});
	});

	context('when controller hasn\'t the client injected', function() {

		it('shouldn\'t propagate client when controller ask for another controller', function() {

			stubModulesPathGetReturns();

			const fooController = Controller.getInstance('foo');

			assert.deepEqual(fooController.client, undefined);

			const barController = fooController.getController('bar');

			assert.deepEqual(barController.client, undefined);
		});

		it('should return a model instance from a controller instance', function() {

			stubModulesPathGetReturns();

			const fooController = Controller.getInstance('foo');

			assert(fooController instanceof FooController);

			const fooModel = fooController.getModel();

			assert(fooModel instanceof FooModel);
		});

	});

	it('should call model \'getTotals\' method', async function() {

		stubModulesPathGetReturns();

		const fooController = Controller.getInstance('foo');

		const stubModelMethod = sandbox.stub(FooModel.prototype, 'getTotals');

		await fooController.getTotals();

		sandbox.assert.calledOnce(stubModelMethod);
		sandbox.assert.calledWithExactly(stubModelMethod);
	});

	['insert', 'save', 'remove'].forEach(method => {

		it(`should call model ${method} method passing the item received`, async function() {

			stubModulesPathGetReturns();

			const fooController = Controller.getInstance('foo');

			const stubModelMethod = sandbox.stub(FooModel.prototype, method);

			await fooController[method]({
				foo: 'bar'
			});

			sandbox.assert.calledOnce(stubModelMethod);
			sandbox.assert.calledWithExactly(stubModelMethod, {
				foo: 'bar'
			});
		});
	});

	it('should call model \'update\' method passing the values and filter received', async function() {

		stubModulesPathGetReturns();

		const fooController = Controller.getInstance('foo');

		const stubModelMethod = sandbox.stub(FooModel.prototype, 'update');

		await fooController.update({ foo: 2 }, { bar: 9 });

		sandbox.assert.calledOnce(stubModelMethod);
		sandbox.assert.calledWithExactly(stubModelMethod, { foo: 2 }, { bar: 9 });
	});

	['multiInsert', 'multiSave'].forEach(method => {

		it(`should model ${method} method passing the items received`, async function() {

			stubModulesPathGetReturns();

			const fooController = Controller.getInstance('foo');

			const stubModelMethod = sandbox.stub(FooModel.prototype, method);

			await fooController[method]([{ foo: 46 }, { foo: 30 }]);

			sandbox.assert.calledOnce(stubModelMethod);
			sandbox.assert.calledWithExactly(stubModelMethod, [{ foo: 46 }, { foo: 30 }]);

		});
	});

	it('should call model \'multiRemove\' method passing the filter received', async function() {

		stubModulesPathGetReturns();

		const fooController = Controller.getInstance('foo');

		const stubModelMethod = sandbox.stub(FooModel.prototype, 'multiRemove');

		await fooController.multiRemove({ foo: 2 });

		sandbox.assert.calledOnce(stubModelMethod);
		sandbox.assert.calledWithExactly(stubModelMethod, { foo: 2 });
	});

	it('should use env var MS_PATH if exists for getting a Controller', function() {

		stubModulesPathGetReturns();

		process.env.MS_PATH = 'my-extra-path';

		assert.throws(() => Controller.get('foo'));

		sandbox.assert.calledOnce(stubModulesPathGet);
		sandbox.assert.calledWithExactly(stubModulesPathGet, 'my-extra-path/controllers', 'foo');
	});
});
