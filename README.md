# Model Controller

The `model-controller` module allows you to get a controller/model class or instance easily.
The module will search recursively the files in your root path inside the folders `controllers/**` and `models/**`.

## Installation

```
npm install @janiscommerce/model-controller
```

## API

### Controller.get(string)
Example: Controller.get('category');
This method returns the controller class to use static methods or instance a controller.

### Controller.getInstance(string)
Example: Controller.getInstance('category');
This method returns the instance of a controller class.

### Controller.getModel(string)
Example: myController.getModel();
This methods returns a Model Instance from a controller using his name. The method will cache the model to simple return it the next time.

### Model.get(string)
Example: Model.get('category');
This method returns the model class to use static methods or instance a model.

### Model.getInstance(string)
Example: Model.getInstance('category');
This method returns the instance of a model class.

## Usage

```js
const { Model, Controller } = require('@janiscommerce/model-controller');

// To get the Product class from e.g. 'path/to/node/process/controllers/product.js'
const ProductController = Controller.get('product'); // this returns the product class stored in

// To get a Product instance
const myProduct = Controller.getInstance('product');

// To get a Product Model instance
const productModel = myProduct.getModel();
const otherProductModel = myProduct.getModel();

console.log(`'productModel' and 'otherProductModel' are ${productModel === otherProductModel ? 'equal' : 'different'}`);
// expected output: 'productModel' and 'otherProductModel' are equal

// To get the Product Model class from e.g. 'path/to/node/process/models/product.js'
const ProductModel = Model.get('product');

// To get a Product Model instance
const myProductModel = Model.getInstance('product');

console.log(`'productModel' and 'myProductModel' are ${productModel === myProductModel ? 'equal' : 'different'}`);
// expected output: 'productModel' and 'myProductModel' are different
```