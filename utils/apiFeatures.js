class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    if (!this.queryString.keyword) {
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      const queryObj = { ...this.queryString };
      const excludeFields = ['sort', 'page', 'limit', 'fields'];
      excludeFields.forEach((el) => delete queryObj[el]);
      //1B)ADVANED FILTER
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      );

      this.query = this.query.find(JSON.parse(queryStr));
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBY = this.queryString.sort.split(',').join(' ');

      this.query.sort(sortBY);
      // sorting [price avaragerating]
    } else {
      this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate(countDocuments) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //pagination Information

    const paginationInfo = {};

    paginationInfo.currentPage = page;
    paginationInfo.limit = limit;
    paginationInfo.countDocuments = countDocuments;
    const endOfCurrentPage = page * limit;
    if (endOfCurrentPage < countDocuments) {
      paginationInfo.next = page + 1;
    }
    if (skip > 0) {
      paginationInfo.prev = page - 1;
    }
    this.paginationInfo = paginationInfo;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  search(modelName) {
    if (this.queryString.keyword) {
      if (modelName === 'Product') {
        const searcher = {};
        searcher.$or = [
          { title: { $regex: this.queryString.keyword, $options: 'i' } },
          { description: { $regex: this.queryString.keyword, $options: 'i' } },
        ];
        this.query = this.query.find(searcher);
      } else {
        const searcher = {
          name: { $regex: this.queryString.keyword, $options: 'i' },
        };
        this.query = this.query.find(searcher);
      }
    }
    return this;
  }
}
module.exports = APIFeatures;
