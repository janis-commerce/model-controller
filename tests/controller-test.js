'use strict';

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
	const FooModel = class Foo extends Model {};

	before(() => {
		mockRequire('path/to/foo-controller', FooController);
		mockRequire('path/to/foo-model', FooModel);
	});

	const stubModulesPathGetReturns = () => {
		stubModulesPathGet
			.onFirstCall()
			.returns('path/to/foo-controller')
			.onSecondCall()
			.returns('path/to/foo-model');
	};

	beforeEach(() => {
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

		const foo = Controller.getInstance('Foo');

		assert(foo instanceof FooController);
	});

	it('should return a model instance from a controller instance', function() {

		stubModulesPathGetReturns();

		const fooController = Controller.getInstance('Foo');

		assert(fooController instanceof FooController);

		const fooModel = fooController.getModel();

		assert(fooModel instanceof FooModel);
	});

	it('should cache model instance in the controller instance', function() {

		stubModulesPathGetReturns();

		const fooController = Controller.getInstance('FooController');

		const spy = sandbox.spy(Model, 'getInstance');

		const fooModel = fooController.getModel();

		sandbox.assert.calledOnce(spy);
		sandbox.assert.calledWithExactly(spy, 'Foo');

		const sameFooModel = fooController.getModel();

		sandbox.assert.calledOnce(spy);
		sandbox.assert.calledWithExactly(spy, 'Foo');

		assert.deepEqual(fooModel, sameFooModel);
	});

	it('should call model \'getTotals\' method', async function() {

		stubModulesPathGetReturns();

		const fooController = Controller.getInstance('FooController');

		const stubModelMethod = sandbox.stub(FooModel.prototype, 'getTotals');

		await fooController.getTotals();

		sandbox.assert.calledOnce(stubModelMethod);
		sandbox.assert.calledWithExactly(stubModelMethod);
	});

	['insert', 'save', 'remove'].forEach(method => {

		it(`should call model ${method} method passing the item received`, async function() {

			stubModulesPathGetReturns();

			const fooController = Controller.getInstance('FooController');

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

		const fooController = Controller.getInstance('FooController');

		const stubModelMethod = sandbox.stub(FooModel.prototype, 'update');

		await fooController.update({ foo: 2 }, { bar: 9 });

		sandbox.assert.calledOnce(stubModelMethod);
		sandbox.assert.calledWithExactly(stubModelMethod, { foo: 2 }, { bar: 9 });
	});

	['multiInsert', 'multiSave'].forEach(method => {

		it(`should model ${method} method passing the items received`, async function() {

			stubModulesPathGetReturns();

			const fooController = Controller.getInstance('FooController');

			const stubModelMethod = sandbox.stub(FooModel.prototype, method);

			await fooController[method]([{ foo: 46 }, { foo: 30 }]);

			sandbox.assert.calledOnce(stubModelMethod);
			sandbox.assert.calledWithExactly(stubModelMethod, [{ foo: 46 }, { foo: 30 }]);

		});
	});

	it('should call model \'multiRemove\' method passing the filter received', async function() {

		stubModulesPathGetReturns();

		const fooController = Controller.getInstance('FooController');

		const stubModelMethod = sandbox.stub(FooModel.prototype, 'multiRemove');

		await fooController.multiRemove({ foo: 2 });

		sandbox.assert.calledOnce(stubModelMethod);
		sandbox.assert.calledWithExactly(stubModelMethod, { foo: 2 });
	});
});
