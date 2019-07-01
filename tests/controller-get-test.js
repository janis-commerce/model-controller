'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const { Controller, Model } = require('..'); // al index

/* eslint-disable prefer-arrow-callback */

describe('Controller', function() {

	const FooController = class Foo extends Controller {};
	const fooController = new FooController();

	const FooModel = class Foo extends Model {};
	const fooModel = new FooModel();

	let stubModelGet;

	beforeEach(() => {
		stubModelGet = sandbox.stub(FooModel.prototype, 'get');

		sandbox.stub(fooController, 'getModel')
			.returns(fooModel);
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should return null when model returns undefined', async function() {

		stubModelGet.returns();

		const result = await fooController.get({
			fooParam: 1
		});

		sandbox.assert.calledOnce(stubModelGet);
		sandbox.assert.calledWithExactly(stubModelGet, { fooParam: 1 });

		assert.deepEqual(result, null);
	});

	it('should prepare results when model get passing the params', async function() {

		stubModelGet.returns([{ fooItem: 2 }]);

		const result = await fooController.get({
			fooParam: 1
		});

		sandbox.assert.calledOnce(stubModelGet);
		sandbox.assert.calledWithExactly(stubModelGet, { fooParam: 1 });

		assert.deepEqual(result, [{ fooItem: 2 }]);
	});

	it('should call controller formatGet with each item', async function() {

		fooController.formatGet = () => {};
		const stubFormatGet = sandbox.stub(fooController, 'formatGet')
			.callsFake(({ ...item }) => {
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

});
