const { getDB } = require('../database');

/**
 * Clean and tokenize text into words
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter out short stop-words
}

/**
 * Calculate Term Frequency (TF) for a document
 */
function getTF(tokens) {
  const tf = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  const total = tokens.length || 1;
  for (const token in tf) {
    tf[token] = tf[token] / total;
  }
  return tf;
}

/**
 * Calculate TF-IDF vectors for all products
 */
function calculateTFIDF(products) {
  const docs = products.map(p => {
    const text = `${p.name} ${p.description || ''} ${p.category_name || ''}`;
    return { id: p._id, tokens: tokenize(text) };
  });

  // Calculate Inverse Document Frequency (IDF)
  const idf = {};
  const N = docs.length;
  docs.forEach(doc => {
    const uniqueTokens = new Set(doc.tokens);
    uniqueTokens.forEach(token => {
      idf[token] = (idf[token] || 0) + 1;
    });
  });

  for (const token in idf) {
    idf[token] = Math.log(N / idf[token]) + 1; // Smooth IDF
  }

  // Calculate TF-IDF vectors
  const vectors = {};
  docs.forEach(doc => {
    const tf = getTF(doc.tokens);
    const vector = {};
    for (const token in tf) {
      vector[token] = tf[token] * idf[token];
    }
    vectors[doc.id] = vector;
  });

  return vectors;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(v1, v2) {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  allKeys.forEach(key => {
    const val1 = v1[key] || 0;
    const val2 = v2[key] || 0;
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  });

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Get content-based similar products
 */
async function getSimilarProducts(productId, limit = 5) {
  const { Product } = getDB();
  const products = await Product.find({}).populate('category_id');
  if (products.length === 0) return [];

  const target = products.find(p => p._id === parseInt(productId));
  if (!target) return [];

  const formattedProducts = products.map(p => ({
    ...p.toJSON(),
    category_name: p.category_id ? p.category_id.name : ''
  }));

  const vectors = calculateTFIDF(formattedProducts);
  const targetVector = vectors[productId];
  if (!targetVector) return [];

  const similarities = formattedProducts
    .filter(p => p.id !== parseInt(productId))
    .map(p => {
      const sim = cosineSimilarity(targetVector, vectors[p.id] || {});
      return { product: p, score: sim };
    })
    .filter(item => item.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return similarities.map(item => {
    const p = item.product;
    p.category_name = p.category_id ? p.category_id.name : null;
    p.category_icon = p.category_id ? p.category_id.icon : null;
    p.category_id = p.category_id ? p.category_id._id : null;
    return {
      ...p,
      reason: `Similar style to ${target.name}`
    };
  });
}

/**
 * Calculate co-occurrence / frequently bought together products
 */
async function getFrequentlyBoughtTogether(productId, limit = 4) {
  const { OrderItem, Product } = getDB();
  const targetId = parseInt(productId);

  // Find orders containing the target product
  const ordersWithTarget = await OrderItem.find({ product_id: targetId });
  if (ordersWithTarget.length === 0) {
    // Fallback to content-based similarity
    return getSimilarProducts(productId, limit);
  }

  const orderIds = ordersWithTarget.map(item => item.order_id);

  // Find other items in those orders
  const otherItems = await OrderItem.find({
    order_id: { $in: orderIds },
    product_id: { $ne: targetId }
  });

  const coOccurrence = {};
  otherItems.forEach(item => {
    coOccurrence[item.product_id] = (coOccurrence[item.product_id] || 0) + 1;
  });

  const sortedIds = Object.keys(coOccurrence)
    .sort((a, b) => coOccurrence[b] - coOccurrence[a])
    .slice(0, limit)
    .map(Number);

  if (sortedIds.length === 0) {
    return getSimilarProducts(productId, limit);
  }

  const products = await Product.find({ _id: { $in: sortedIds } }).populate('category_id');
  const targetProduct = await Product.findById(productId);

  return products.map(p => {
    const pJson = p.toJSON();
    pJson.category_name = p.category_id ? p.category_id.name : null;
    pJson.category_icon = p.category_id ? p.category_id.icon : null;
    pJson.category_id = p.category_id ? p.category_id._id : null;
    return {
      ...pJson,
      reason: `Frequently bought with ${targetProduct ? targetProduct.name : 'this item'}`
    };
  });
}

/**
 * Generate personalized recommendations for a user
 */
async function getPersonalizedRecommendations(userId, limit = 6) {
  const { Product, Order, OrderItem, CartItem, Category } = getDB();

  // 1. Fetch user's cart items
  const cartItems = userId ? await CartItem.find({ user_id: userId }) : [];
  const cartProductIds = cartItems.map(item => item.product_id);

  // 2. Fetch user's past orders
  const orders = userId ? await Order.find({ user_id: userId }).sort({ created_at: -1 }) : [];
  const orderIds = orders.map(o => o._id);
  const orderItems = orderIds.length > 0 ? await OrderItem.find({ order_id: { $in: orderIds } }) : [];
  const purchasedProductIds = orderItems.map(item => item.product_id);

  // Combine already interacted ids to avoid recommending them directly
  const ownedProductIds = new Set([...cartProductIds, ...purchasedProductIds]);

  // All products
  const products = await Product.find({}).populate('category_id');
  const categories = await Category.find({});

  const formattedProducts = products.map(p => ({
    ...p.toJSON(),
    category_name: p.category_id ? p.category_id.name : ''
  }));

  // Build category preference map
  const categoryInteractions = {};
  
  // Add weight for cart categories
  for (const pid of cartProductIds) {
    const prod = products.find(p => p._id === pid);
    if (prod && prod.category_id) {
      categoryInteractions[prod.category_id] = (categoryInteractions[prod.category_id] || 0) + 3;
    }
  }

  // Add weight for purchased categories
  for (const pid of purchasedProductIds) {
    const prod = products.find(p => p._id === pid);
    if (prod && prod.category_id) {
      categoryInteractions[prod.category_id] = (categoryInteractions[prod.category_id] || 0) + 2;
    }
  }

  // Calculate TF-IDF similarities to cart/purchase items
  const tfidfVectors = calculateTFIDF(formattedProducts);
  const recommendations = [];

  for (const prod of formattedProducts) {
    // Skip items they already have in cart or bought recently
    if (ownedProductIds.has(prod.id)) continue;

    let score = 0;
    let reasons = [];

    // Category match score
    if (prod.category_id && categoryInteractions[prod.category_id]) {
      const weight = categoryInteractions[prod.category_id];
      score += weight * 1.5;
      const cat = categories.find(c => c._id === prod.category_id);
      reasons.push({ text: `Fits your interest in ${cat ? cat.name : 'similar categories'}`, weight: weight });
    }

    // Semantic text similarity to user's cart & purchases
    let maxSimilarity = 0;
    let similarToName = '';
    const activeInteractedIds = [...cartProductIds, ...purchasedProductIds.slice(0, 3)];

    for (const activeId of activeInteractedIds) {
      const activeVector = tfidfVectors[activeId];
      const prodVector = tfidfVectors[prod.id];
      if (activeVector && prodVector) {
        const sim = cosineSimilarity(activeVector, prodVector);
        if (sim > maxSimilarity) {
          maxSimilarity = sim;
          const matchedItem = products.find(p => p._id === activeId);
          similarToName = matchedItem ? matchedItem.name : '';
        }
      }
    }

    if (maxSimilarity > 0.1) {
      score += maxSimilarity * 10;
      reasons.push({ text: `Similar style to ${similarToName}`, weight: maxSimilarity * 5 });
    }

    // Popularity/Rating boost
    if (prod.rating > 4.2) {
      score += (prod.rating - 4.0) * 1.2;
      reasons.push({ text: `Highly rated at ${prod.rating}★`, weight: prod.rating - 4.0 });
    }

    // Featured boost
    if (prod.featured === 1) {
      score += 1.5;
      reasons.push({ text: 'Featured premium collection', weight: 1.5 });
    }

    // Sort reasons to find the best explanation
    reasons.sort((a, b) => b.weight - a.weight);
    const primaryReason = reasons.length > 0 ? reasons[0].text : 'Recommended for you';

    recommendations.push({
      ...prod,
      category_name: prod.category_id ? prod.category_id.name : null,
      category_icon: prod.category_id ? prod.category_id.icon : null,
      category_id: prod.category_id ? prod.category_id._id : null,
      score,
      reason: primaryReason
    });
  }

  // Sort by final score
  recommendations.sort((a, b) => b.score - a.score);

  // If no personalized recommendations (e.g. guest, or new user with no history), fallback to featured/top rated
  if (recommendations.length === 0 || scoreSum(recommendations) < 1.0) {
    const fallbacks = formattedProducts
      .filter(p => !ownedProductIds.has(p.id))
      .map(p => {
        let reason = 'Trending Choice';
        if (p.featured === 1) reason = 'Featured Favorite';
        else if (p.rating >= 4.7) reason = `Top Rated (${p.rating}★)`;
        return {
          ...p,
          category_name: p.category_id ? p.category_id.name : null,
          category_icon: p.category_id ? p.category_id.icon : null,
          category_id: p.category_id ? p.category_id._id : null,
          reason
        };
      })
      .sort((a, b) => {
        // Sort featured first, then rating
        if (a.featured !== b.featured) return b.featured - a.featured;
        return b.rating - a.rating;
      });
    return fallbacks.slice(0, limit);
  }

  return recommendations.slice(0, limit);
}

function scoreSum(recs) {
  return recs.reduce((sum, r) => sum + (r.score || 0), 0);
}

/**
 * AI Conversational search parsing and query handler
 */
async function parseChatAndRecommend(userMessage, userId) {
  const { Product, Category } = getDB();
  const products = await Product.find({}).populate('category_id');
  const categories = await Category.find({});

  const text = userMessage.toLowerCase();

  // 1. Identify category filters
  let matchedCategory = null;
  for (const cat of categories) {
    if (text.includes(cat.name.toLowerCase()) || 
        (cat.name === 'Electronics' && (text.includes('laptop') || text.includes('phone') || text.includes('tv') || text.includes('headphone') || text.includes('watch') || text.includes('gadget'))) ||
        (cat.name === 'Clothing' && (text.includes('shirt') || text.includes('jeans') || text.includes('wear') || text.includes('shoes') || text.includes('fashion') || text.includes('jacket'))) ||
        (cat.name === 'Home & Garden' && (text.includes('home') || text.includes('kitchen') || text.includes('coffee') || text.includes('vacuum') || text.includes('pot') || text.includes('chair'))) ||
        (cat.name === 'Sports' && (text.includes('sports') || text.includes('fit') || text.includes('yoga') || text.includes('tennis') || text.includes('racket') || text.includes('bottle'))) ||
        (cat.name === 'Books' && (text.includes('book') || text.includes('read') || text.includes('author') || text.includes('habits') || text.includes('programmer'))) ||
        (cat.name === 'Beauty' && (text.includes('beauty') || text.includes('cream') || text.includes('skin') || text.includes('makeup') || text.includes('cleanser') || text.includes('lip')))
    ) {
      matchedCategory = cat;
      break;
    }
  }

  // 2. Identify price constraints
  let priceLimit = null;
  const underMatch = /under\s*₹?\s*(\d+)/i.exec(text) || 
                     /below\s*₹?\s*(\d+)/i.exec(text) || 
                     /less\s*than\s*₹?\s*(\d+)/i.exec(text) ||
                     /budget\s*of\s*₹?\s*(\d+)/i.exec(text) ||
                     /within\s*₹?\s*(\d+)/i.exec(text);
  if (underMatch) {
    priceLimit = parseInt(underMatch[1]);
  }

  // 3. Identify special flags (featured, sale/discount)
  const wantsFeatured = text.includes('featured') || text.includes('premium') || text.includes('best') || text.includes('popular');
  const wantsDiscount = text.includes('discount') || text.includes('sale') || text.includes('off') || text.includes('original');

  // 4. Perform scoring on products
  const scoredProducts = products.map(p => {
    let score = 0;
    const pText = `${p.name} ${p.description || ''}`.toLowerCase();

    // Word matching
    const tokens = tokenize(text);
    tokens.forEach(token => {
      if (pText.includes(token)) {
        score += 2;
      }
      if (p.name.toLowerCase().includes(token)) {
        score += 5; // Higher boost for title match
      }
    });

    // Category boost
    if (matchedCategory && p.category_id && p.category_id._id === matchedCategory._id) {
      score += 10;
    }

    // Price constraint filtering / penalty
    if (priceLimit) {
      if (p.price > priceLimit) {
        score -= 50; // Heavily penalize over-budget items
      } else {
        // Boost items close to the budget but under it
        score += (p.price / priceLimit) * 5;
      }
    }

    // Discount matching
    if (wantsDiscount && p.original_price && p.price < p.original_price) {
      score += 8;
    }

    // Featured matching
    if (wantsFeatured && p.featured === 1) {
      score += 8;
    }

    // Rating boost
    score += (p.rating || 0) * 1.5;

    return { product: p, score };
  });

  // Filter out negative scores (e.g. heavily over budget)
  const filtered = scoredProducts
    .filter(item => item.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => {
      const p = item.product.toJSON();
      p.category_name = item.product.category_id ? item.product.category_id.name : null;
      p.category_icon = item.product.category_id ? item.product.category_id.icon : null;
      p.category_id = item.product.category_id ? item.product.category_id._id : null;
      return p;
    });

  // 5. Generate conversational AI text responses
  let replyText = "";
  if (filtered.length === 0) {
    replyText = "I couldn't find any products matching those exact criteria. However, check out some of our featured collections below! Can I help you find something else?";
    // Fallback to featured items
    const featuredItems = products
      .filter(p => p.featured === 1)
      .slice(0, 3)
      .map(p => {
        const pJson = p.toJSON();
        pJson.category_name = p.category_id ? p.category_id.name : null;
        pJson.category_icon = p.category_id ? p.category_id.icon : null;
        pJson.category_id = p.category_id ? p.category_id._id : null;
        return pJson;
      });
    return { reply: replyText, products: featuredItems };
  }

  // Craft personalized response templates based on tags
  if (matchedCategory && priceLimit) {
    replyText = `Here are the top picks in **${matchedCategory.name}** under **₹${priceLimit.toLocaleString('en-IN')}** that match your budget. I think these would be perfect for you:`;
  } else if (matchedCategory) {
    replyText = `I found some excellent items in **${matchedCategory.name}**! Here are our highly recommended picks:`;
  } else if (priceLimit) {
    replyText = `Sure thing! Here are some great recommendations within your budget of **₹${priceLimit.toLocaleString('en-IN')}**:`;
  } else if (wantsDiscount) {
    replyText = `Here are some of our best deals and discounted items that you might love:`;
  } else if (wantsFeatured) {
    replyText = `Here are some of our premium, top-rated featured items:`;
  } else {
    replyText = `Based on your request, I've analyzed our catalog and found these premium items for you. Let me know if you would like to know more about any of them!`;
  }

  return { reply: replyText, products: filtered };
}

module.exports = {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
  parseChatAndRecommend
};
