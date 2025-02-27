const functions = require('@google-cloud/functions-framework');

functions.http('helloHttp', (req, res) => {
  res.send(`Kathryn Grayson Nanz says ${req.query.keyword}!`);
});
