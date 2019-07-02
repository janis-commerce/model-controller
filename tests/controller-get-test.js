'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const { Controller, Model } = require('..'); // al index
const ControllerError = require('../lib/controller/controller-error');

const Utils = require('../lib/utils');

/* eslint-disable prefer-arrow-callback */

describe('Controller', function() {

	const FooController = class Foo extends Controller {};
	const fooController = new FooController();

	fooController.formatGet = () => {};
	fooController.afterGet = () => {};

	const FooModel = class Foo extends Model {};
	const fooModel = new FooModel();

	let stubModelGet;

	let getPagedCallback;

	let stubFormatGet;

	let stubAfterGet;

	let spyChangeKeys;

	beforeEach(() => {
		stubModelGet = sandbox.stub(FooModel.prototype, 'get');

		sandbox.stub(fooController, 'getModel')
			.returns(fooModel);

		stubFormatGet = sandbox.stub(fooController, 'formatGet')
			.callsFake(({ ...item }) => item);

		stubAfterGet = sandbox.stub(fooController, 'afterGet')
			.callsFake(([...newItems]) => newItems);

		getPagedCallback = sandbox.stub();

		spyChangeKeys = sandbox.spy(Utils, 'changeKeys');
	});

	afterEach(() => {
		sandbox.restore();
	});

	context('when call \'get\' method', function() {

		it('should return null if model returns undefined', async function() {

			stubModelGet.returns();

			const result = await fooController.get({
				fooParam: 1
			});

			sandbox.assert.calledOnce(stubModelGet);
			sandbox.assert.calledWithExactly(stubModelGet, { fooParam: 1 });

			assert.deepEqual(result, null);
		});

		it('shouldn\'t prepare results if model return an empty array', async function() {

			stubModelGet.returns([]);

			const result = await fooController.get();

			sandbox.assert.calledOnce(stubModelGet);
			sandbox.assert.calledWithExactly(stubModelGet, {});

			assert.deepEqual(result, []);
		});

		it('should prepare results if model get passing the params', async function() {

			stubModelGet.returns([{ fooItem: 2 }]);

			const result = await fooController.get({
				fooParam: 1
			});

			sandbox.assert.calledOnce(stubModelGet);
			sandbox.assert.calledWithExactly(stubModelGet, { fooParam: 1 });

			assert.deepEqual(result, [{ fooItem: 2 }]);
		});

		it('should admit object result from model', async function() {

			stubModelGet.returns({ foo: 456 });

			const result = await fooController.get({
				fooParam: 1
			});

			sandbox.assert.calledOnce(stubModelGet);
			sandbox.assert.calledWithExactly(stubModelGet, { fooParam: 1 });

			assert.deepEqual(result, { foo: 456 });
		});

		context('when param \'changeKeys\' received', function() {

			it('should change keys if key found in items', async function() {

				stubModelGet.returns([{ id: 1, foo: 'bar' }, { id: 2, bar: 'foo' }]);

				const result = await fooController.get({
					changeKeys: 'id'
				});

				sandbox.assert.calledOnce(stubModelGet);
				sandbox.assert.calledWithExactly(stubModelGet, { changeKeys: 'id' });

				sandbox.assert.calledOnce(spyChangeKeys);
				sandbox.assert.calledWithExactly(spyChangeKeys, [{ id: 1, foo: 'bar' }, { id: 2, bar: 'foo' }], 'id');

				assert.deepEqual(result, {
					1: { id: 1, foo: 'bar' },
					2: { id: 2, bar: 'foo' }
				});
			});

			it('should ignore items that hasn\'t the key', async function() {

				stubModelGet.returns([{ foo: 'bar' }, { bar: 'foo' }]);

				const result = await fooController.get({
					changeKeys: 'id'
				});

				sandbox.assert.calledOnce(stubModelGet);
				sandbox.assert.calledWithExactly(stubModelGet, { changeKeys: 'id' });

				sandbox.assert.calledOnce(spyChangeKeys);
				sandbox.assert.calledWithExactly(spyChangeKeys, [{ foo: 'bar' }, { bar: 'foo' }], 'id');

				assert.deepEqual(result, {});
			});
		});

		it('should call controller \'formatGet\' with each item if \'formatGet\' method exists', async function() {

			stubFormatGet.callsFake(({ ...item }) => {
				item.added = 123;
				return item;
			});

			stubModelGet.returns([{ fooItem: 2 }, { anotherFooItem: 3 }]);

			const result = await fooController.get();

			sandbox.assert.calledOnce(stubModelGet);
			sandbox.assert.calledWithExactly(stubModelGet, {});

			sandbox.assert.calledTwice(stubFormatGet);
			sandbox.assert.calledWithExactly(stubFormatGet.getCall(0), { fooItem: 2 });
			sandbox.assert.calledWithExactly(stubFormatGet.getCall(1), { anotherFooItem: 3 });

			assert.deepEqual(result, [
				{ fooItem: 2, added: 123 },
				{ anotherFooItem: 3, added: 123 }
			]);
		});

		context('when \'afterGet\' method exists', function() {

			it('should call controller \'afterGet\' with all items', async function() {

				stubModelGet.returns([{ foo: 1 }, { bar: 2 }]);

				const result = await fooController.get();

				sandbox.assert.calledOnce(stubModelGet);
				sandbox.assert.calledWithExactly(stubModelGet, {});

				sandbox.assert.calledOnce(stubAfterGet);
				sandbox.assert.calledWithExactly(stubAfterGet, [{ foo: 1 }, { bar: 2 }], {}, {}, []);

				assert.deepEqual(result, [{ foo: 1 }, { bar: 2 }]);
			});

			it('should call controller \'afterGet\' with all items, params, indexes and ids', async function() {

				stubModelGet.returns([{ id: 33, foo: 45 }, { id: 78, bar: 987 }]);

				const result = await fooController.get({ extraParam: true });

				sandbox.assert.calledOnce(stubModelGet);
				sandbox.assert.calledWithExactly(stubModelGet, { extraParam: true });

				sandbox.assert.calledOnce(stubAfterGet);
				sandbox.assert.calledWithExactly(stubAfterGet, [{ id: 33, foo: 45 }, { id: 78, bar: 987 }], { extraParam: true }, { 33: 0, 78: 1 }, [33, 78]);

				assert.deepEqual(result, [{ id: 33, foo: 45 }, { id: 78, bar: 987 }]);
			});
		});

	});

	context('when call \'getPaged\' method', function() {

		it('should reject if received an invalid callback', async function() {

			const wrongCallbackError = {
				name: 'ControllerError',
				code: ControllerError.codes.WRONG_CALLBACK
			};

			const badCallbacks = [
				1, 'foo', true, { foo: 'bar' }, ['foo', 'bar'], null, undefined
			];

			const promises = badCallbacks.map(badCallback => {
				return assert.rejects(() => fooController.getPaged({}, badCallback), wrongCallbackError);
			});

			promises.push(assert.rejects(() => fooController.getPaged(), wrongCallbackError));

			await Promise.all(promises);
		});

		it('shouldn\'t call the callback if get response empty results', async function() {

			const stubGet = sandbox.stub(fooController, 'get')
				.returns([]);

			await fooController.getPaged({}, getPagedCallback);

			sandbox.assert.calledOnce(stubGet);
			sandbox.assert.calledWithExactly(stubGet, {
				page: 1,
				limit: Controller.defaultPageLimit
			});

			sandbox.assert.notCalled(getPagedCallback);
		});

		it('should call the callback one time if get response an array of items, passing custom limit', async function() {

			const stubGet = sandbox.stub(fooController, 'get')
				.onCall(0)
				.returns([{ foo: 1 }, { bar: 2 }])
				.onCall(1)
				.returns([{ foo: 5 }])
				.returns([]); // for the following calls

			await fooController.getPaged({ limit: 2 }, getPagedCallback);

			sandbox.assert.calledTwice(stubGet);

			sandbox.assert.calledWithExactly(stubGet.getCall(0), {
				page: 1,
				limit: 2
			});

			sandbox.assert.calledWithExactly(stubGet.getCall(1), {
				page: 2,
				limit: 2
			});

			sandbox.assert.calledTwice(getPagedCallback);

			sandbox.assert.calledWithExactly(getPagedCallback.getCall(0), [{ foo: 1 }, { bar: 2 }], 1, 2);

			sandbox.assert.calledWithExactly(getPagedCallback.getCall(1), [{ foo: 5 }], 2, 2);
		});
	});

});
