/**
 * Build search query for text search across multiple fields
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search
 * @returns {Object} MongoDB query object
 */
const buildTextSearchQuery = (searchTerm, fields) => {
  if (!searchTerm || !searchTerm.trim()) {
    return {};
  }

  const regex = new RegExp(searchTerm.trim(), "i");

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

/**
 * Build date range query
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {string} field - Date field name
 * @returns {Object} MongoDB query object
 */
const buildDateRangeQuery = (startDate, endDate, field = "createdAt") => {
  const query = {};

  if (startDate || endDate) {
    query[field] = {};

    if (startDate) {
      query[field].$gte = new Date(startDate);
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // Set to end of day
      query[field].$lte = endDateTime;
    }
  }

  return query;
};

/**
 * Build price range query
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @param {string} field - Price field name
 * @returns {Object} MongoDB query object
 */
const buildPriceRangeQuery = (minPrice, maxPrice, field = "price") => {
  const query = {};

  if (minPrice !== undefined || maxPrice !== undefined) {
    query[field] = {};

    if (minPrice !== undefined) {
      query[field].$gte = parseFloat(minPrice);
    }

    if (maxPrice !== undefined) {
      query[field].$lte = parseFloat(maxPrice);
    }
  }

  return query;
};

/**
 * Build sort options
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {Object} MongoDB sort object
 */
const buildSortQuery = (sortBy = "createdAt", sortOrder = "desc") => {
  const validSortOrders = ["asc", "desc", 1, -1];
  const order = validSortOrders.includes(sortOrder) ? sortOrder : "desc";

  return {
    [sortBy]: order === "asc" || order === 1 ? 1 : -1,
  };
};

/**
 * Build pagination options
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination options
 */
const buildPaginationOptions = (page = 1, limit = 20) => {
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.min(Math.max(1, parseInt(limit)), 100); // Max 100 items per page
  const skip = (currentPage - 1) * itemsPerPage;

  return {
    page: currentPage,
    limit: itemsPerPage,
    skip,
  };
};

/**
 * Build pagination metadata
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
};

/**
 * Sanitize and validate search parameters
 * @param {Object} params - Search parameters
 * @returns {Object} Sanitized parameters
 */
const sanitizeSearchParams = (params) => {
  const sanitized = {};

  // Text search
  if (params.q || params.query || params.search) {
    sanitized.query = (params.q || params.query || params.search)
      .toString()
      .trim();
  }

  // Pagination
  sanitized.page = Math.max(1, parseInt(params.page) || 1);
  sanitized.limit = Math.min(Math.max(1, parseInt(params.limit) || 20), 100);

  // Sorting
  if (params.sortBy) {
    sanitized.sortBy = params.sortBy.toString();
  }

  if (params.sortOrder) {
    sanitized.sortOrder = ["asc", "desc"].includes(
      params.sortOrder.toLowerCase()
    )
      ? params.sortOrder.toLowerCase()
      : "desc";
  }

  // Price range
  if (params.minPrice !== undefined) {
    const minPrice = parseFloat(params.minPrice);
    if (!isNaN(minPrice) && minPrice >= 0) {
      sanitized.minPrice = minPrice;
    }
  }

  if (params.maxPrice !== undefined) {
    const maxPrice = parseFloat(params.maxPrice);
    if (!isNaN(maxPrice) && maxPrice >= 0) {
      sanitized.maxPrice = maxPrice;
    }
  }

  // Date range
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    if (!isNaN(startDate.getTime())) {
      sanitized.startDate = startDate;
    }
  }

  if (params.endDate) {
    const endDate = new Date(params.endDate);
    if (!isNaN(endDate.getTime())) {
      sanitized.endDate = endDate;
    }
  }

  // Boolean flags
  if (params.isActive !== undefined) {
    sanitized.isActive = params.isActive === "true" || params.isActive === true;
  }

  if (params.inStock !== undefined) {
    sanitized.inStock = params.inStock === "true" || params.inStock === true;
  }

  if (params.includeExpired !== undefined) {
    sanitized.includeExpired =
      params.includeExpired === "true" || params.includeExpired === true;
  }

  // Category and manufacturer
  if (params.category) {
    sanitized.category = params.category.toString().trim();
  }

  if (params.manufacturer) {
    sanitized.manufacturer = params.manufacturer.toString().trim();
  }

  return sanitized;
};

/**
 * Build aggregation pipeline for complex queries
 * @param {Object} matchQuery - Match stage query
 * @param {Object} sortQuery - Sort stage query
 * @param {number} skip - Number of documents to skip
 * @param {number} limit - Number of documents to limit
 * @returns {Array} Aggregation pipeline
 */
const buildAggregationPipeline = (
  matchQuery = {},
  sortQuery = {},
  skip = 0,
  limit = 20
) => {
  const pipeline = [];

  // Match stage
  if (Object.keys(matchQuery).length > 0) {
    pipeline.push({ $match: matchQuery });
  }

  // Sort stage
  if (Object.keys(sortQuery).length > 0) {
    pipeline.push({ $sort: sortQuery });
  }

  // Skip stage
  if (skip > 0) {
    pipeline.push({ $skip: skip });
  }

  // Limit stage
  if (limit > 0) {
    pipeline.push({ $limit: limit });
  }

  return pipeline;
};

/**
 * Build search query with multiple filters
 * @param {Object} filters - Filter object
 * @returns {Object} MongoDB query object
 */
const buildSearchQuery = (filters) => {
  const query = {};

  // Text search
  if (filters.query) {
    const searchFields = filters.searchFields || ["name", "description"];
    Object.assign(query, buildTextSearchQuery(filters.query, searchFields));
  }

  // Date range
  if (filters.startDate || filters.endDate) {
    Object.assign(
      query,
      buildDateRangeQuery(filters.startDate, filters.endDate, filters.dateField)
    );
  }

  // Price range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    Object.assign(
      query,
      buildPriceRangeQuery(
        filters.minPrice,
        filters.maxPrice,
        filters.priceField
      )
    );
  }

  // Boolean filters
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  // Category filter
  if (filters.category) {
    query.category = new RegExp(filters.category, "i");
  }

  // Manufacturer filter
  if (filters.manufacturer) {
    query.manufacturer = new RegExp(filters.manufacturer, "i");
  }

  // Stock filter
  if (filters.inStock) {
    query.quantity = { $gt: 0 };
  }

  // Expiry filter
  if (filters.includeExpired === false) {
    query.expiryDate = { $gt: new Date() };
  }

  return query;
};

module.exports = {
  buildTextSearchQuery,
  buildDateRangeQuery,
  buildPriceRangeQuery,
  buildSortQuery,
  buildPaginationOptions,
  buildPaginationMeta,
  sanitizeSearchParams,
  buildAggregationPipeline,
  buildSearchQuery,
};
