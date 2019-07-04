'use strict';

const ModulesPath = require('@janiscommerce/modules-path');
const DatabaseDispatcher = require('@janiscommerce/database-dispatcher');

const mockRequire = require('mock-require');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const { Model } = require('..'); // al index
const ModelError = require('./../lib/model/model-error');

/* eslint-disable prefer-arrow-callback */

describe('Model', function() {

	let stubModulesPathGet;

	DatabaseDispatcher.getDatabaseByKey = () => {};
	DatabaseDispatcher.getDatabaseByConfig = () => {};

	const DBDriver = {};
	DBDriver.get = () => {};

	let stubDBDriverGet;

	const clientModel = class ClientModel extends Model {};

	const coreModel = class CoreModel extends Model {
		get databaseKey() { return 'core'; }
	};

	const client = {
		host: 'the-host',
		database: 'the-database-name',
		username: 'the-username',
		password: 'the-password',
		port: 1,
		dbWriteHost: 'my-host.com',
		dbWriteName: 'foo',
		dbReadHost: 'my-read-host.com',
		dbReadName: 'foo',
		dbReadUser: 'my-username',
		dbReadPass: 'ultrsecurepassword123456'
	};

	before(() => {
		mockRequire('path/to/client-model', clientModel);
		mockRequire('path/to/core-model', coreModel);
	});

	beforeEach(() => {

		delete process.env.MS_PATH;

		stubModulesPathGet = sandbox.stub(ModulesPath, 'get');

		// to avoid cache
		clientModel._clientFields = undefined; // eslint-disable-line
		coreModel._clientFields = undefined; // eslint-disable-line

		stubDBDriverGet = sandbox.stub(DBDriver, 'get')
			.returns([{ foo: 'bar' }]);

		sandbox.stub(DatabaseDispatcher, 'getDatabaseByKey')
			.returns(DBDriver);

		sandbox.stub(DatabaseDispatcher, 'getDatabaseByConfig')
			.returns(DBDriver);
	});

	afterEach(() => {
		sandbox.restore();
	});

	after(() => {
		mockRequire.stopAll();
	});

	const testGetThrows = (modelName, code) => {
		assert.throws(() => {
			Model.get(modelName);
		}, {
			name: 'ModelError',
			code
		});

		sandbox.assert.calledOnce(stubModulesPathGet);
		sandbox.assert.calledWithExactly(stubModulesPathGet, 'models', modelName);
	};

	const getInstance = model => {
		stubModulesPathGet
			.returns(`path/to/${model}`);

		return Model.getInstance(model);
	};

	it('should throws when ModulesPath not found the file', function() {

		stubModulesPathGet
			.returns(false);

		testGetThrows('foo', ModelError.codes.INVALID_MODEL);
	});

	it('should throws when ModulesPath found the file, but require fails', function() {

		stubModulesPathGet
			.returns('path/to/unknown-model');

		testGetThrows('unknown-model', ModelError.codes.INVALID_MODEL);
	});

	it('should return class when found by ModulesPath and require works', function() {

		stubModulesPathGet
			.returns('path/to/client-model');

		const ClientModel = Model.get('client-model');

		assert.deepEqual(clientModel, ClientModel);
		sandbox.assert.calledOnce(stubModulesPathGet);
		sandbox.assert.calledWithExactly(stubModulesPathGet, 'models', 'client-model');
	});

	it('should use env var MS_PATH if exists for getting a Model', function() {

		process.env.MS_PATH = 'my-extra-path';

		stubModulesPathGet
			.returns('path/to/client-model');

		Model.get('client-model');

		sandbox.assert.calledOnce(stubModulesPathGet);
		sandbox.assert.calledWithExactly(stubModulesPathGet, 'my-extra-path/models', 'client-model');
	});

	it('should return an instance when found by ModulesPath and require works', function() {

		const myClientModel = getInstance('client-model');

		assert(myClientModel instanceof clientModel);
	});

	it('should reject when client-model haven\'t a client injected', async function() {

		const myClientModel = getInstance('client-model');

		await assert.rejects(() => myClientModel.get(), {
			name: 'ModelError',
			code: ModelError.codes.DATABASE_CONFIG_NOT_FOUND
		});
	});

	context('when client config fields file not found', function() {

		it('should call DBDriver get using databaseKey if exists', async function() {

			const myCoreModel = getInstance('core-model');

			await myCoreModel.get();

			sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByKey);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByKey, 'core');

			sandbox.assert.calledOnce(stubDBDriverGet);
			sandbox.assert.calledWithExactly(stubDBDriverGet, myCoreModel, {});
		});

		it('should call DBDriver get using client config default', async function() {

			const myClientModel = getInstance('client-model');

			myClientModel.client = client;

			await myClientModel.get();

			// for debug use: DatabaseDispatcher.getDatabaseByConfig.getCall(0).args
			sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByConfig);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByConfig, {
				host: 'my-host.com',
				database: 'foo',
				user: undefined,
				pass: undefined,
				port: undefined
			});

			// for debug use: stubDBDriverGet.getCall(0).args
			sandbox.assert.calledOnce(stubDBDriverGet);
			sandbox.assert.calledWithExactly(stubDBDriverGet, myClientModel, {});
		});
	});

	context('when client config fields file found but has bad format', function() {

		it('should use default fields for client', async function() {

			mockRequire(clientModel.clientConfigFilePath, ['bad', 'format']);

			const myClientModel = getInstance('client-model');

			myClientModel.client = client;

			await myClientModel.get({ readonly: true, filters: { foo: 'bar' } });

			// for debug use: DatabaseDispatcher.getDatabaseByConfig.getCall(0).args
			sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByConfig);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByConfig, {
				host: 'my-read-host.com',
				database: 'foo',
				user: 'my-username',
				pass: 'ultrsecurepassword123456',
				port: undefined
			});

			// for debug use: stubDBDriverGet.getCall(0).args
			sandbox.assert.calledOnce(stubDBDriverGet);
			sandbox.assert.calledWithExactly(stubDBDriverGet, myClientModel, { readonly: true, filters: { foo: 'bar' } });
		});

		it('should use internal cache for default fields for client', async function() {

			mockRequire(clientModel.clientConfigFilePath, ['bad', 'format']);

			const spyPrepareFields = sandbox.spy(clientModel, '_prepareClientFields');

			const myClientModel = getInstance('client-model');

			myClientModel.client = client;

			await myClientModel.get({ readonly: true, filters: { foo: 'bar' } });
			await myClientModel.get({ readonly: true });
			await myClientModel.get({ filters: { foo: 'bar' } });
			await myClientModel.get();

			sandbox.assert.calledOnce(spyPrepareFields);
		});
	});

	context('when client config fields file found', function() {

		it('should use client db config data', async function() {

			mockRequire(clientModel.clientConfigFilePath, {
				dbWriteHost: 'host',
				dbWriteName: 'database',
				dbWriteUser: 'username',
				dbWritePass: 'password',
				dbWritePort: 'port'
			});

			const myClientModel = getInstance('client-model');

			myClientModel.client = client;

			await myClientModel.get();

			// for debug use: DatabaseDispatcher.getDatabaseByConfig.getCall(0).args
			sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByConfig);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByConfig, {
				host: 'the-host',
				database: 'the-database-name',
				user: 'the-username',
				pass: 'the-password',
				port: 1
			});

			// for debug use: stubDBDriverGet.getCall(0).args
			sandbox.assert.calledOnce(stubDBDriverGet);
			sandbox.assert.calledWithExactly(stubDBDriverGet, myClientModel, {});
		});

		it('should use internal cache for config field fields for client', async function() {

			mockRequire(clientModel.clientConfigFilePath, {
				dbWriteHost: 'host',
				dbWriteName: 'database',
				dbWriteUser: 'username',
				dbWritePass: 'password',
				dbWritePort: 'port'
			});

			sandbox.spy(clientModel, '_prepareClientFields');

			const myClientModel = getInstance('client-model');

			myClientModel.client = client;

			await myClientModel.get({ readonly: true, filters: { foo: 'bar' } });
			await myClientModel.get({ readonly: true });
			await myClientModel.get({ filters: { foo: 'bar' } });
			await myClientModel.get();

			sandbox.assert.calledOnce(clientModel._prepareClientFields); // eslint-disable-line
		});
	});

	it('should call DBDriver getTotals method passing the model', async function() {

		DBDriver.getTotals = () => {};

		const myCoreModel = getInstance('core-model');

		sandbox.stub(DBDriver, 'getTotals');

		await myCoreModel.getTotals();

		sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByKey);
		sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByKey, 'core');

		// for debug use: DBDriver.getTotals.getCall(0).args
		sandbox.assert.calledOnce(DBDriver.getTotals);
		sandbox.assert.calledWithExactly(DBDriver.getTotals, myCoreModel);
	});

	['insert', 'save', 'remove'].forEach(method => {

		it(`should call DBDriver ${method} method passing the model and the item received`, async function() {

			DBDriver[method] = () => {};

			const myCoreModel = getInstance('core-model');

			sandbox.stub(DBDriver, method);

			await myCoreModel[method]({ foo: 'bar' });

			sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByKey);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByKey, 'core');

			// for debug use: DBDriver[method].getCall(0).args
			sandbox.assert.calledOnce(DBDriver[method]);
			sandbox.assert.calledWithExactly(DBDriver[method], myCoreModel, { foo: 'bar' });
		});

	});

	it('should call DBDriver update method passing the model and the values and filter received', async function() {

		DBDriver.update = () => {};

		const myCoreModel = getInstance('core-model');

		sandbox.stub(DBDriver, 'update');

		await myCoreModel.update({ status: -1 }, { foo: 'bar' });

		sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByKey);
		sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByKey, 'core');

		// for debug use: DBDriver.update.getCall(0).args
		sandbox.assert.calledOnce(DBDriver.update);
		sandbox.assert.calledWithExactly(DBDriver.update, myCoreModel, { status: -1 }, { foo: 'bar' });
	});

	['multiInsert', 'multiSave'].forEach(method => {

		it(`should call DBDriver ${method} method passing the model and the items received`, async function() {

			DBDriver[method] = () => {};

			const myCoreModel = getInstance('core-model');

			sandbox.stub(DBDriver, method);

			await myCoreModel[method]([{ foo: 'bar' }, { foo2: 'bar2' }]);

			sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByKey);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByKey, 'core');

			// for debug use: DBDriver[method].getCall(0).args
			sandbox.assert.calledOnce(DBDriver[method]);
			sandbox.assert.calledWithExactly(DBDriver[method], myCoreModel, [{ foo: 'bar' }, { foo2: 'bar2' }]);
		});

	});

	it('should call DBDriver multiRemove method passing the model and the filter received', async function() {

		DBDriver.multiRemove = () => {};

		const myCoreModel = getInstance('core-model');

		sandbox.stub(DBDriver, 'multiRemove');

		await myCoreModel.multiRemove({ foo: 'bar' });

		sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByKey);
		sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByKey, 'core');

		// for debug use: DBDriver.multiRemove.getCall(0).args
		sandbox.assert.calledOnce(DBDriver.multiRemove);
		sandbox.assert.calledWithExactly(DBDriver.multiRemove, myCoreModel, { foo: 'bar' });
	});

});
