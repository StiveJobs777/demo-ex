import { PLACEHOLDER_IMAGE, formatPrice } from "../utils/catalogLogic.js";

export function getImageSrc(product) {
  return product.image ? product.image : PLACEHOLDER_IMAGE;
}

// Если файл не загрузился — подставляем заглушку (onerror = null защищает от цикла)
export function handleImageError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = PLACEHOLDER_IMAGE;
}

function ProductCard({ product, onSelect }) {
  const cardClass = product.isLowStock
    ? "product-card low-stock"
    : "product-card";

  return (
    <article className={cardClass} onClick={() => onSelect(product.id)}>
      <img
        className="product-thumb"
        src={getImageSrc(product)}
        alt={product.name}
        onError={handleImageError}
      />

      <div>
        <h3 className="product-title">
          {product.manufacturer_name} | {product.name}
        </h3>
        <div className="product-meta">
          <span>Категория: {product.categoryName}</span>
          <span>Количество: {product.stockLabel}</span>
          <span>Состав: {product.composition}</span>
        </div>
      </div>

      <div className="product-price-col">
        {product.discountPercent > 0 ? (
          <>
            <span className="price-old">{formatPrice(product.base_price)}</span>
            <span className="price-current">
              {formatPrice(product.discountedPrice)}
            </span>
          </>
        ) : (
          <span className="price-current">
            {formatPrice(product.base_price)}
          </span>
        )}
      </div>
    </article>
  );
}

export default ProductCard;