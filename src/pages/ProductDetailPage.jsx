import { useState } from "react";
import { getImageSrc, handleImageError } from "../components/ProductCard.jsx";
import { formatPrice, validateQuantity } from "../utils/catalogLogic.js";

function ProductDetailPage({
  product,
  user,
  targetClient,
  draftItems,
  onAddToDraft,
  onRemoveDraftItem,
  onCancelOrder,
  onConfirmOrder,
  onGoToLogin,
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [fieldError, setFieldError] = useState("");

  const selectedVariant = product.variants.find(
    (variant) => variant.id === selectedVariantId
  );

  // Сколько этого варианта уже лежит в черновике
  const getReservedCount = (variantId) =>
    draftItems
      .filter((item) => item.variant_id === variantId)
      .reduce((sum, item) => sum + item.quantity, 0);

  const availableForSelected = selectedVariant
    ? selectedVariant.quantity - getReservedCount(selectedVariant.id)
    : 0;

  const handleSelectVariant = (variant) => {
    setSelectedVariantId(variant.id);
    setQuantity("1");
    setFieldError("");
  };

  // Ввод: запрещаем всё, кроме цифр, и сразу подсказываем про остаток
  const handleQuantityChange = (event) => {
    const raw = event.target.value;
    if (!/^\d*$/.test(raw)) {
      setFieldError("Введите целое положительное число.");
      return;
    }
    setQuantity(raw);
    if (raw === "") {
      setFieldError("");
      return;
    }
    if (selectedVariant && Number(raw) > availableForSelected) {
      setFieldError(`Доступно не более ${availableForSelected} шт.`);
      return;
    }
    setFieldError(Number(raw) === 0 ? "Количество должно быть больше нуля." : "");
  };

  const handleAddClick = () => {
    if (!selectedVariant) {
      setFieldError("Сначала выберите вариант (размер).");
      return;
    }
    const error = validateQuantity(quantity, availableForSelected);
    if (error) {
      setFieldError(error);
      return;
    }
    onAddToDraft({
      variant_id: selectedVariant.id,
      product_id: product.id,
      product_name: product.name,
      manufacturer_name: product.manufacturer_name,
      size: selectedVariant.size,
      quantity: Number(quantity),
      unit_price: product.discountedPrice,
    });
    setQuantity("1");
    setFieldError("");
  };

  const draftTotal = draftItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  return (
    <div>
      <div className="panel">
        <div className="detail-grid">
          <img
            className="detail-image"
            src={getImageSrc(product)}
            alt={product.name}
            onError={handleImageError}
          />

          <div>
            <h2 style={{ marginTop: 0 }}>
              {product.manufacturer_name} | {product.name}
            </h2>
            <div className="product-meta">
              <span>Категория: {product.categoryName}</span>
              <span>Описание: {product.description}</span>
              <span>Состав: {product.composition}</span>
              <span>
                Количество: {product.stockLabel} (всего {product.totalStock})
              </span>
            </div>

            <div className="product-price-col" style={{ alignItems: "flex-start", margin: "12px 0" }}>
              {product.discountPercent > 0 && (
                <>
                  <span className="price-old">{formatPrice(product.base_price)}</span>
                  <span className="discount-badge">Скидка −{product.discountPercent}%</span>
                </>
              )}
              <span className="price-current">{formatPrice(product.discountedPrice)}</span>
            </div>

            {user ? (
              <div>
                {targetClient && user.role_code !== "client" && (
                  <div className="field-hint">
                    Заказ оформляется на клиента: <strong>{targetClient.full_name}</strong>
                  </div>
                )}

                <strong>Варианты (размер):</strong>
                <div className="size-buttons">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      className={
                        variant.id === selectedVariantId
                          ? "size-btn active"
                          : "size-btn"
                      }
                      disabled={variant.quantity <= 0}
                      onClick={() => handleSelectVariant(variant)}
                    >
                      {variant.size} ({variant.quantity})
                    </button>
                  ))}
                </div>

                <label htmlFor="quantity-input">
                  <strong>Количество:</strong>
                </label>
                <input
                  id="quantity-input"
                  className="input"
                  style={{ maxWidth: 160, display: "block", marginTop: 6 }}
                  inputMode="numeric"
                  value={quantity}
                  onChange={handleQuantityChange}
                  disabled={!selectedVariant}
                />
                {selectedVariant && (
                  <div className="field-hint">
                    Доступно для заказа: {availableForSelected} шт.
                  </div>
                )}
                {fieldError && <div className="field-error">{fieldError}</div>}

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={handleAddClick}
                >
                  Добавить в заказ
                </button>
              </div>
            ) : (
              <div className="notice notice-info">
                <div className="notice-body">
                  <span className="notice-icon">ℹ️</span>
                  <div>Для оформления заказа необходимо войти в систему.</div>
                </div>
                <button type="button" className="btn btn-primary" onClick={onGoToLogin}>
                  Войти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {user && draftItems.length > 0 && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Текущий заказ (черновик)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Параметр</th>
                <th>Кол-во</th>
                <th>Цена за ед.</th>
                <th>Сумма</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {draftItems.map((item, index) => (
                <tr key={`${item.variant_id}-${index}`}>
                  <td>{item.manufacturer_name} | {item.product_name}</td>
                  <td>{item.size}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.unit_price)}</td>
                  <td>{formatPrice(item.unit_price * item.quantity)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => onRemoveDraftItem(index)}
                    >
                      Убрать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <strong>Итого: {formatPrice(draftTotal)}</strong>
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={onConfirmOrder}>
              Подтвердить заказ
            </button>
            <button type="button" className="btn btn-danger" onClick={onCancelOrder}>
              Отказаться от заказа
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetailPage;