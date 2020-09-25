const provideContext = async (req, res, next) => {
  const context = {
    hey: 'hello',
  };

  req.context = context;
  next();
};

module.exports = provideContext;
