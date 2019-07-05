'use strict';

const ModulesPath = require('@janiscommerce/modules-path');
const DatabaseDispatcher = require('@janiscommerce/database-dispatcher');
const Settings = require('@janiscommerce/settings');

const mockRequire = require('mock-require');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const { Model } = require('..'); // al index
const ModelError = require('./../lib/model/model-error');
const ClientFields = require('./../lib/model/client-fields');

/* eslint-disable prefer-arrow-callback */

describe('Model', function() {

	let stubModulesPathGet;

	const DBDriver = {
		get: () => {},
		getTotals: () => {},
		insert: () => {},
		save: () => {},
		update: () => {},
		remove: () => {},
		multiInsert: () => {},
		multiSave: () => {},
		multiRemove: () => {}
	};

	const client = {
		host: 'the-host',
		database: 'the-database-name',
		username: 'the-username',
		password: 'the-password',
		port: 1,
		dbWriteHost: 'my-host.com',
		dbWriteDatabase: 'foo',
		dbReadHost: 'my-read-host.com',
		dbReadDatabase: 'foo',
		dbReadUser: 'my-username',
		dbReadPassword: 'ultrsecurepassword123456'
	};

	const clientModel = class ClientModel extends Model {};

	const coreModel = class CoreModel extends Model {
		get databaseKey() { return 'core'; }
	};

	before(() => {
		mockRequire('path/to/client-model', clientModel);
		mockRequire('path/to/core-model', coreModel);
	});

	beforeEach(() => {

		delete process.env.MS_PATH;

		// for internal cache clean...
		ClientFields._fields = undefined; // eslint-disable-line

		stubModulesPathGet = sandbox.stub(ModulesPath, 'get');

		sandbox.stub(DBDriver, 'get')
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

	it('should use env var MS_PATH if exists for getting a Model', function() {

		process.env.MS_PATH = 'my-extra-path';

		stubModulesPathGet
			.returns('path/to/client-model');

		Model.get('client-model');

		sandbox.assert.calledOnce(stubModulesPathGet);
		sandbox.assert.calledWithExactly(stubModulesPathGet, 'my-extra-path/models', 'client-model');
	});

	it('should return class when found by ModulesPath and require works', function() {

		stubModulesPathGet
			.returns('path/to/client-model');

		const ClientModel = Model.get('client-model');

		assert.deepEqual(clientModel, ClientModel);
		sandbox.assert.calledOnce(stubModulesPathGet);
		sandbox.assert.calledWithExactly(stubModulesPathGet, 'models', 'client-model');
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

	context('when client fields settings not found', function() {

		it('should call DBDriver get using databaseKey if exists', async function() {

			const myCoreModel = getInstance('core-model');

			await myCoreModel.get();

			sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByKey);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByKey, 'core');

			sandbox.assert.calledOnce(DBDriver.get);
			sandbox.assert.calledWithExactly(DBDriver.get, myCoreModel, {});
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
				password: undefined,
				port: undefined
			});

			// for debug use: DBDriver.get.getCall(0).args
			sandbox.assert.calledOnce(DBDriver.get);
			sandbox.assert.calledWithExactly(DBDriver.get, myClientModel, {});
		});
	});

	context('when client fields settings found but has bad format', function() {

		it('should use default fields for client on read DB', async function() {

			sandbox.stub(Settings, 'get')
				.returns(['bad', 'format']);

			const myClientModel = getInstance('client-model');

			myClientModel.client = client;

			await myClientModel.get({ readonly: true, filters: { foo: 'bar' } });

			// for debug use: DatabaseDispatcher.getDatabaseByConfig.getCall(0).args
			sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByConfig);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByConfig, {
				host: 'my-read-host.com',
				database: 'foo',
				user: 'my-username',
				password: 'ultrsecurepassword123456',
				port: undefined
			});

			// for debug use: DBDriver.get.getCall(0).args
			sandbox.assert.calledOnce(DBDriver.get);
			sandbox.assert.calledWithExactly(DBDriver.get, myClientModel, { readonly: true, filters: { foo: 'bar' } });

			// for debug use: Settings.get.getCall(0).args
			sandbox.assert.calledOnce(Settings.get);
			sandbox.assert.calledWithExactly(Settings.get, 'clients');
		});

		it('should use internal cache for default fields for client', async function() {

			sandbox.stub(Settings, 'get')
				.returns(['bad', 'format']);

			sandbox.spy(ClientFields, 'get');

			const myClientModel = getInstance('client-model');

			myClientModel.client = client;

			await myClientModel.get({ readonly: true, filters: { foo: 'bar' } });
			await myClientModel.get({ readonly: true });
			await myClientModel.get({ filters: { foo: 'bar' } });
			await myClientModel.get();

			sandbox.assert.calledOnce(ClientFields.get);
			sandbox.assert.calledWithExactly(ClientFields.get); // called with undefined!

			// for debug use: Settings.get.getCall(0).args
			sandbox.assert.calledOnce(Settings.get);
			sandbox.assert.calledWithExactly(Settings.get, 'clients');
		});
	});

	context('when client fields settings found', function() {

		it('should use client db config data for write DB', async function() {

			sandbox.stub(Settings, 'get')
				.returns({
					fields: {
						write: {
							host: 'host',
							database: 'database',
							user: 'username',
							password: 'password',
							port: 'port'
						}
					}
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
				password: 'the-password',
				port: 1
			});

			// for debug use: DBDriver.get.getCall(0).args
			sandbox.assert.calledOnce(DBDriver.get);
			sandbox.assert.calledWithExactly(DBDriver.get, myClientModel, {});

			// for debug use: Settings.get.getCall(0).args
			sandbox.assert.calledOnce(Settings.get);
			sandbox.assert.calledWithExactly(Settings.get, 'clients');
		});

		it('should use client db config data for read DB', async function() {

			sandbox.stub(Settings, 'get')
				.returns({
					fields: {
						read: {
							host: 'host',
							database: 'database',
							user: 'username',
							password: 'password',
							port: 'port'
						}
					}
				});

			const myClientModel = getInstance('client-model');

			myClientModel.client = client;

			await myClientModel.get({ readonly: true });

			// for debug use: DatabaseDispatcher.getDatabaseByConfig.getCall(0).args
			sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByConfig);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByConfig, {
				host: 'the-host',
				database: 'the-database-name',
				user: 'the-username',
				password: 'the-password',
				port: 1
			});

			// for debug use: DBDriver.get.getCall(0).args
			sandbox.assert.calledOnce(DBDriver.get);
			sandbox.assert.calledWithExactly(DBDriver.get, myClientModel, { readonly: true });

			// for debug use: Settings.get.getCall(0).args
			sandbox.assert.calledOnce(Settings.get);
			sandbox.assert.calledWithExactly(Settings.get, 'clients');
		});

		it('should use internal cache for settings fields for client', async function() {

			sandbox.stub(Settings, 'get')
				.returns({
					fields: {
						write: {
							host: 'host',
							database: 'database',
							user: 'username',
							password: 'password',
							port: 'port'
						}
					}
				});

			const myClientModel = getInstance('client-model');

			myClientModel.client = client;

			await myClientModel.get({ readonly: true, filters: { foo: 'bar' } });
			await myClientModel.get({ readonly: true });
			await myClientModel.get({ filters: { foo: 'bar' } });
			await myClientModel.get();

			const readConfig = {
				host: 'my-read-host.com',
				database: 'foo',
				user: 'my-username',
				password: 'ultrsecurepassword123456',
				port: undefined
			};

			const writeConfig = {
				host: 'the-host',
				database: 'the-database-name',
				user: 'the-username',
				password: 'the-password',
				port: 1
			};

			// for debug use: DatabaseDispatcher.getDatabaseByConfig.getCall(0).args
			sandbox.assert.callCount(DatabaseDispatcher.getDatabaseByConfig, 4);

			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByConfig.getCall(0), readConfig);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByConfig.getCall(1), readConfig);

			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByConfig.getCall(2), writeConfig);
			sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByConfig.getCall(3), writeConfig);

			// for debug use: Settings.get.getCall(0).args
			sandbox.assert.calledOnce(Settings.get);
			sandbox.assert.calledWithExactly(Settings.get, 'clients');
		});
	});

	it('should call DBDriver getTotals method passing the model', async function() {

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

		const myCoreModel = getInstance('core-model');

		sandbox.stub(DBDriver, 'multiRemove');

		await myCoreModel.multiRemove({ foo: 'bar' });

		sandbox.assert.calledOnce(DatabaseDispatcher.getDatabaseByKey);
		sandbox.assert.calledWithExactly(DatabaseDispatcher.getDatabaseByKey, 'core');

		// for debug use: DBDriver.multiRemove.getCall(0).args
		sandbox.assert.calledOnce(DBDriver.multiRemove);
		sandbox.assert.calledWithExactly(DBDriver.multiRemove, myCoreModel, { foo: 'bar' });
	});

	it('should cache ClientFields when request from different models', async function() {

		sandbox.stub(Settings, 'get');

		const myClientModel = getInstance('client-model');

		myClientModel.client = client;

		await myClientModel.get();

		const otherClientModel = getInstance('client-model');

		otherClientModel.client = client;

		await otherClientModel.get();

		// for debug use: Settings.get.getCall(0).args
		sandbox.assert.calledOnce(Settings.get);
		sandbox.assert.calledWithExactly(Settings.get, 'clients');
	});

});
