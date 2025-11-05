const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  metaDescription: {
    type: String,
    required: true
  },
  h1: {
    type: String,
    required: true
  },
  sections: [{
    type: String,
    required: true
  }],
  faq: [{
    q: {
      type: String,
      required: true
    },
    a: {
      type: String,
      required: true
    }
  }],
  faqSchema: {
    type: Object,
    default: {}
  },
  vars: {
    type: Object,
    default: {}
  },
  templateKey: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
pageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index for efficient queries
pageSchema.index({ templateKey: 1, createdAt: -1 });

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;