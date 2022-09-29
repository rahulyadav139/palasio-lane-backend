const Product = require('../models/product');

exports.getProducts = async (req, res, next) => {
  const filterBy = req.query.filterBy;

  try {
    const products = await Product.find({ tags: { $in: filterBy } });
    res.send(products);
  } catch (err) {
    res.send(err);
  }
};

exports.putNewProduct = async (req, res, next) => {
  const newProduct = req.body;

  const product = await new Product(newProduct);

  product.save();

  res.send({ message: 'A new product is added successfully!' });
};

exports.getSingleProduct = async (req, res, next) => {
  const prodId = req.params.prodId;

  Product.findById(prodId, (error, product) => {
    if (error) {
      res.status(404).send({ message: 'Incorrect product-id!' });
      return;
    }

    res.send(product);
  });
};

exports.getSearchedProducts = async (req, res) => {
  // const { searchKeyword } = req.body;
  // console.log(req.body);

  const { searchKeyword } = req.query;

  const searchTerm = searchKeyword.trim().split(' ').join('|');

  const searchTermRegex = new RegExp(searchTerm, 'gi');

  try {
    const productsWithTitle = await Product.find({
      title: searchTermRegex,
    });
    let max = {
      length: 0,
      product: '',
    };

    for (const product of productsWithTitle) {
      if (max.length < product.title.match(searchTermRegex).length) {
        max.length = product.title.match(searchTermRegex).length;
        max.product = product;
      }
    }

    const products = await Product.find({}).select('tags brand');

    const productCollectionData = products.reduce(
      (acc, product) => {
        if (!acc.collections.includes(product.tags[1])) {
          acc.collections.push(product.tags[1]);
        }

        if (!acc.categories.some(el => el.category === product.tags[0])) {
          acc.categories.push({
            category: product.tags[0],
            path: `${product.tags[1]}/${product.tags[0]}`,
          });
        }
        return acc;
      },
      { collections: [], categories: [] }
    );

    const collections = productCollectionData.collections.filter(collection =>
      collection.match(searchTermRegex)
    );
    const categories = productCollectionData.categories.filter(category =>
      category.category.match(searchTermRegex)
    );

    // const productBrandsData = products.reduce((acc, product) => {
    //   if (!acc.includes(product.brand)) {
    //     acc.push(product.brand);
    //   }
    //   return acc;
    // }, []);

    // const productBrands = productBrandsData.filter(brand =>
    //   brand.match(searchTermRegex)
    // );

    const { product } = max;

    searchKeyword
      ? res.send({
          product,
          collections,
          categories,
          // productBrands,
        })
      : res.send({
          product: {},
          collections: [],
          categories: [],
          // productBrands: [],
        });

    max = {
      length: 0,
      product: '',
    };
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};
