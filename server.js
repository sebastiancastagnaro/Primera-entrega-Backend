// server.js

const express = require('express');
const fs = require('fs/promises');

const app = express();
const PORT = 8080;

app.use(express.json());

// Load existing products and calculate the next available ID
let products = [];
let productIdCounter = 1;

// Load existing carts and calculate the next available ID
let carts = [];
let cartIdCounter = 1;

// Middleware para limitar la respuesta de productos
const limitMiddleware = (req, res, next) => {
  const limit = parseInt(req.query.limit);
  if (!isNaN(limit)) {
    products = products.slice(0, limit);
  }
  next();
};

// Rutas para productos
const productsRouter = express.Router();

productsRouter.get('/', limitMiddleware, async (req, res) => {
  // Lógica para obtener y devolver todos los productos desde el archivo "productos.json"
  res.json(products);
});

productsRouter.get('/:pid', async (req, res) => {
  // Lógica para obtener y devolver un producto específico por ID desde "productos.json"
  const productId = parseInt(req.params.pid);
  const product = products.find((p) => p.id === productId);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

productsRouter.post('/', async (req, res) => {
  // Lógica para agregar un nuevo producto a "productos.json"
  const newProduct = req.body;
  // Validar si el código ya existe
  const existingProduct = products.find((p) => p.code === newProduct.code);
  if (existingProduct) {
    return res.status(400).json({ error: 'Ya existe un producto con este código' });
  }
  // Incrementar el contador y asignar un nuevo ID
  newProduct.id = productIdCounter++;
  products.push(newProduct);
  await fs.writeFile('productos.json', JSON.stringify(products, null, 2));
  res.json(newProduct);
});

productsRouter.put('/:pid', async (req, res) => {
  // Lógica para actualizar un producto por ID en "productos.json"
  const productId = parseInt(req.params.pid);
  const updatedProduct = req.body;
  const index = products.findIndex((p) => p.id === productId);
  if (index !== -1) {
    // Mantener el ID original
    updatedProduct.id = productId;
    products[index] = updatedProduct;
    await fs.writeFile('productos.json', JSON.stringify(products, null, 2));
    res.json(updatedProduct);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

productsRouter.delete('/:pid', async (req, res) => {
  // Lógica para eliminar un producto por ID desde "productos.json"
  const productId = parseInt(req.params.pid);
  products = products.filter((p) => p.id !== productId);
  await fs.writeFile('productos.json', JSON.stringify(products, null, 2));
  res.json({ success: true });
});

app.use('/api/products', productsRouter);

// Rutas para carritos
const cartsRouter = express.Router();

cartsRouter.post('/', async (req, res) => {
  // Lógica para crear un nuevo carrito en "carrito.json"
  const newCart = {
    id: cartIdCounter++,
    products: [],
  };
  carts.push(newCart);
  await fs.writeFile('carrito.json', JSON.stringify(carts, null, 2));
  res.json(newCart);
});

cartsRouter.get('/:cid', async (req, res) => {
  // Lógica para obtener y devolver los productos de un carrito por ID desde "carrito.json"
  const cartId = parseInt(req.params.cid);
  const cart = carts.find((c) => c.id === cartId);
  if (cart) {
    res.json(cart.products);
  } else {
    res.status(404).json({ error: 'Carrito no encontrado' });
  }
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
  // Lógica para agregar un producto al carrito en "carrito.json"
  const cartId = parseInt(req.params.cid);
  const productId = parseInt(req.params.pid);
  const quantity = req.body.quantity || 1;

  // Validar si el carrito existe
  const cartIndex = carts.findIndex((c) => c.id === cartId);
  if (cartIndex !== -1) {
    // Validar si el producto ya está en el carrito
    const productIndex = carts[cartIndex].products.findIndex((p) => p.id === productId);
    if (productIndex !== -1) {
      // Incrementar la cantidad del producto existente
      carts[cartIndex].products[productIndex].quantity += quantity;
    } else {
      // Agregar un nuevo producto al carrito
      const productToAdd = { id: productId, quantity };
      carts[cartIndex].products.push(productToAdd);
    }
    // Actualizar el archivo de carritos
    await fs.writeFile('carrito.json', JSON.stringify(carts, null, 2));
    res.json(carts[cartIndex]);
  } else {
    res.status(404).json({ error: 'Carrito no encontrado' });
  }
});

app.use('/api/carts', cartsRouter);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
