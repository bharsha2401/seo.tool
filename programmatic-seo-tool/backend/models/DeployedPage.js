const mongoose = require('mongoose');

const DeployedPageSchema = new mongoose.Schema({
  pageSlug: { type: String, required: true, index: true },
  deploySlug: { type: String, required: true, unique: true },
  title: { type: String },
  url: { type: String, required: true },
  provider: { type: String, default: 'local-static' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeployedPage', DeployedPageSchema);
