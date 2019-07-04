'use strict';

const Settings = require('@janiscommerce/settings');

class ClientFields {

	static get() {

		if(typeof this._fields === 'undefined') {

			const settings = Settings.get('clients');

			this._fields = settings ? settings.fields : {};

			if(typeof this._fields !== 'object' || Array.isArray(this._fields))
				this._fields = {};

			this._prepareFields();
		}

		return this._fields;
	}

	static _prepareFields() {

		if(!this._fields.read)
			this._fields.read = {};

		if(!this._fields.read.host)
			this._fields.read.host = 'dbReadHost';

		if(!this._fields.read.name)
			this._fields.read.name = 'dbReadName';

		if(!this._fields.read.user)
			this._fields.read.user = 'dbReadUser';

		if(!this._fields.read.password)
			this._fields.read.password = 'dbReadPassword';

		if(!this._fields.read.port)
			this._fields.read.port = 'dbReadPort';

		if(!this._fields.write)
			this._fields.write = {};

		if(!this._fields.write.host)
			this._fields.write.host = 'dbReadHost';

		if(!this._fields.write.name)
			this._fields.write.name = 'dbReadName';

		if(!this._fields.write.user)
			this._fields.write.user = 'dbReadUser';

		if(!this._fields.write.password)
			this._fields.write.password = 'dbReadPassword';

		if(!this._fields.write.port)
			this._fields.write.port = 'dbReadPort';
	}


}

module.exports = ClientFields;
