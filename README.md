# Model Controller

The `model-controller` module allows you to get a controller/model class or instance easily.

## Installation

```
npm install @janiscommerce/model-controller
```

## Usage

```js
const { Controller } = require('@janiscommerce/model-controller');

const productController = Controller.get('product'); // this returns the product class stored in 'path/to/node/process/controllers/product.js'

const productStatuses = productController.getStatuses(); // static method of Product controller

const myNewProduct = Controller.getInstance('product');

myNewProduct.foo();
```