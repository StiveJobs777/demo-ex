// Чистые функции расчётов: без React, без localStorage

export const PLACEHOLDER_IMAGE = "/picture.png";

// Сегодняшняя дата в формате YYYY-MM-DD по ЛОКАЛЬНОМУ времени
// (toISOString() даёт UTC и ночью может вернуть вчерашний день)
export function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatPrice(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

// Были ли заказы этого товара в предыдущем календарном месяце
export function hasOrdersInPreviousMonth(productId, orders, today = new Date()) {
  // new Date(год, месяц - 1, 1) сам корректно переходит через январь
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const targetYear = prevMonthDate.getFullYear();
  const targetMonth = prevMonthDate.getMonth() + 1; // 1..12

  return orders.some((order) => {
    // Дату разбираем из строки, чтобы не зависеть от часового пояса
    const [year, month] = order.order_date.split("-").map(Number);
    if (year !== targetYear || month !== targetMonth) {
      return false;
    }
    return order.items.some((item) => item.product_id === productId);
  });
}

// Добавляет к товару вычисляемые поля для каталога
export function enrichProduct(product, categories, orders) {
  const totalStock = product.variants.reduce(
    (sum, variant) => sum + variant.quantity,
    0
  );
  const discountPercent = hasOrdersInPreviousMonth(product.id, orders) ? 0 : 25;
  const discountedPrice = Math.round(
    product.base_price * (1 - discountPercent / 100)
  );
  const category = categories.find((item) => item.id === product.category_id);

  return {
    ...product,
    categoryName: category ? category.name : "Без категории",
    totalStock,
    stockLabel: totalStock > 5 ? "много" : "мало",
    isLowStock: totalStock <= 3,
    discountPercent,
    discountedPrice,
  };
}

// Поиск + категория + сортировка применяются последовательно к одному списку
export function filterAndSortProducts(enrichedProducts, search, categoryId, sortBy) {
  const query = search.trim().toLowerCase();

  const filtered = enrichedProducts.filter((item) => {
    if (categoryId !== "all" && String(item.category_id) !== categoryId) {
      return false;
    }
    if (!query) {
      return true;
    }
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  });

  if (sortBy === "price_asc") {
    return [...filtered].sort((a, b) => a.discountedPrice - b.discountedPrice);
  }
  if (sortBy === "price_desc") {
    return [...filtered].sort((a, b) => b.discountedPrice - a.discountedPrice);
  }
  return filtered;
}

// Изменение остатков: direction = -1 (списать) или +1 (вернуть).
// Возвращает НОВЫЙ массив, исходный не мутируется.
export function changeStock(products, items, direction) {
  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => {
      const delta = items
        .filter((item) => item.variant_id === variant.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      if (delta === 0) {
        return variant;
      }
      return { ...variant, quantity: variant.quantity + direction * delta };
    }),
  }));
}

export function getOrderTotal(order) {
  return order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
}

// Проверка количества. Возвращает текст ошибки или пустую строку
export function validateQuantity(rawValue, available) {
  if (rawValue === "") {
    return "Введите количество.";
  }
  if (!/^\d+$/.test(rawValue)) {
    return "Введите целое положительное число.";
  }
  const value = Number(rawValue);
  if (value <= 0) {
    return "Количество должно быть больше нуля.";
  }
  if (value > available) {
    return `Доступно не более ${available} шт.`;
  }
  return "";
}