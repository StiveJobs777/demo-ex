import ProductCard from "../components/ProductCard.jsx";
import { enrichProduct, filterAndSortProducts } from "../utils/catalogLogic.js";

function CatalogPage({
  title,
  user,
  products,
  categories,
  orders,
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  sortBy,
  onSortChange,
  onSelectProduct,
}) {
  const enrichedProducts = products.map((item) =>
    enrichProduct(item, categories, orders),
  );

  // Гость видит весь каталог без фильтров и сортировки
  const visibleProducts = user
    ? filterAndSortProducts(enrichedProducts, search, categoryId, sortBy)
    : enrichedProducts;

  return (
    <div>
      <div className="page-bar">
        <h1>{title}</h1>
      </div>

      {user && (
        <div className="filters-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              className="input search-input"
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <select
            className="select"
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="all">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
          >
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>
        </div>
      )}

      <div className="catalog-list">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={onSelectProduct}
          />
        ))}

        {visibleProducts.length === 0 && (
          <div className="panel">По вашему запросу ничего не найдено.</div>
        )}
      </div>
    </div>
  );
}

export default CatalogPage;
