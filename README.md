# Model Controller
[![Build Status](https://travis-ci.org/janis-commerce/model-controller.svg?branch=master)](https://travis-ci.org/janis-commerce/model-controller)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/model-controller/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/model-controller?branch=master)

The `model-controller` module allows you to get a controller/model class or instance easily.
The module will search recursively the files in your root path inside the folders `controllers/**` and `models/**`.

## Installation

```bash
npm install @janiscommerce/model-controller
```

## Client injection
The client injection is useful when you have a dedicated database per client.
Using the public setter `client`, the client will be stored in the `controller` instance.
All the controllers and models getted using that controller will have the client injected.

## Database Dispatcher
The `Model` uses [Database Dispatcher](https://www.npmjs.com/package/@janiscommerce/database-dispatcher) for getting the correct **DBDriver** for a `Model`.

### Database connection by databaseKey
If you have the connection settings you should add a `databaseKey` getter in you `Model`.

```js
class MyModel extends Model {

	get databaseKey() {
		return 'core';
	}
}

```

Database Dispatcher will try to use one of the following settings

1. Using [Settings](https://www.npmjs.com/package/@janiscommerce/settings), with settings in file `/path/to/root/.janiscommercerc.json`:

```json
{
	"database": {
		"core": {
			"host": "http://my-host-name.org",
			"type": "mysql",
			// ...
		}
	}
}
```

2. Using ENV variables:
```bash
DB_CORE_HOST = "http://my-host-name.org";
DB_CORE_DATABASE = "db-name";
DB_CORE_USER = "user";
DB_CORE_PASSWORD = "foo123456";
```

### Database connection by client injected
When your `Model` is a Client Model, and the database connection settings are in the client injected, you don't need to configurate the `databaseKey`.
You can add settings for the fields in the connection, the fields are the following.

For settings the package use [Settings](https://www.npmjs.com/package/@janiscommerce/settings).

| Field | Default value | Description |
|--|--|--|
| clients.fields.read.host | dbReadHost | The host for DB Read |
| clients.fields.read.database | dbReadDatabase | The database name for DB Read |
| clients.fields.read.user | dbReadUser | The database username for DB Read |
| clients.fields.read.password | dbReadPassword | The database password for DB Read |
| clients.fields.read.port | dbReadPort | The database port for DB Read |
| clients.fields.write.host | dbWriteHost | The host for DB Write |
| clients.fields.write.database | dbWriteDatabase | The database name for DB Write |
| clients.fields.write.user | dbWriteUser | The database username for DB Write |
| clients.fields.write.password | dbWritePassword | The database password for DB Write |
| clients.fields.write.port | dbWritePort | The database port for DB Write |

**Example of settings:**
```json
// .janiscommercerc.json
{
	"clients": {
		"fields": {
			"read": {
				"host": "dbReadHost",
				"database": "dbReadDatabase",
				"user": "dbReadUser",
				"password": "dbReadPassword",
				"port": "dbReadPort"
			},
			"write": {
				"host": "dbWriteHost",
				"database": "dbWriteDatabase",
				"user": "dbWriteUser",
				"password": "dbWritePassword",
				"port": "dbWritePort"
			}
		}
	}
}
```

## API

### Controller.get(string) **static**
- This method returns the controller class to use static methods or instance a controller.
**Example:** Controller.get('category');

### Controller.getInstance(string) **static**
- This method returns the instance of a controller class.
**Example:** Controller.getInstance('category');

### Controller.getModel(string) **non-static**
- This methods returns a Model Instance from a controller using his name. The method will cache the model to simple return it the next time.
**Example:** myController.getModel();

### Controller.client(any) *setter* **non-static**
- This methods sets the client in the controller instance.
**Example:** myController.client = { id: 1 };
**Example:** myController.client = 1;
**Example:** myController.client = 'my-client-name';

### Controller.client() *getter* **non-static**
- This methods returns the client if any
**Example:** myController.client;

### Controller.getController(string) **non-static**
- This methods returns an Controller instance. It propagates the client if any.
**Example:** myController.getController('brand');

### Model.get(string) **static**
- This method returns the model class to use static methods or instance a model.
**Example:** Model.get('category');

### Model.getInstance(string) **static**
- This method returns the instance of a model class.
**Example:** Model.getInstance('category');

## Usage

### How to get a `Product` class
```js
const { Controller } = require('@janiscommerce/model-controller');

// To get the Product class from e.g. 'path/to/root/controllers/product.js'
const ProductController = Controller.get('product'); // this returns the product class
```

### How to get a `Product` instance
```js
const { Controller } = require('@janiscommerce/model-controller');

// To get the Product instance from e.g. 'path/to/root/controllers/product.js'
const productController = Controller.getInstance('product');
```

### How to get a `Product` model instance from a `Product` instance
```js
const { Controller } = require('@janiscommerce/model-controller');

// To get the Product instance from e.g. 'path/to/root/controllers/product.js'
const productController = Controller.getInstance('product');

// To get the Product Model class from e.g. 'path/to/root/models/product.js'
const myProduct = productController.getModel();
```

### How to get a `Product` model

```js
const { Model } = require('@janiscommerce/model-controller');

// To get the Product Model class from e.g. 'path/to/root/models/product.js'
const ProductModel = Model.get('product');
```

### How to get a `Product` model instance

```js
const { Model } = require('@janiscommerce/model-controller');

// To get the Product Model class from e.g. 'path/to/root/models/product.js'
const productModel = Model.getInstance('product');
```

### How to handle Client and propagation between controllers and models

```js
const { Controller } = require('@janiscommerce/model-controller');

const productController = Controller.getInstance('product');

productController.client = {
	id: 1,
	name: 'my-client-name',
	foo: 'bar'
};

const products = await productController.get(); // get from DB using model + database-dispatcher. see @janiscommerce/database-dispatcher

const categoryController = productController.getController('category');

console.log(categoryController.client);

/** -- Expected output:
	{
		id: 1,
		name: 'my-client-name',
		foo: 'bar'
	}
*/

const categories = await categoryController.get(); // get from DB, should be the same DB than productsController

```