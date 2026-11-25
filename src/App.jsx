import { useEffect, useState } from "react";
import rawMockData from "./data/mockData.json";
import { loadFromStorage, saveToStorage } from "./services/storage.js";
import {
  changeStock,
  enrichProduct,
  getTodayString,
} from "./utils/catalogLogic.js";
import Notice from "./components/Notice.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";

// Выберите ваш вариант: "variantA" (обувь) или "variantB" (спортинвентарь)
const ACTIVE_VARIANT = "variantA";
const STORAGE_KEY = `pr_de_state_${ACTIVE_VARIANT}`;

const initialDataset = rawMockData[ACTIVE_VARIANT];
const COMPANY_NAME = initialDataset.companyName;

const PAGE_TITLES = {
  catalog: `${COMPANY_NAME} — ${initialDataset.catalogTitle}`,
  detail: `${COMPANY_NAME} — Карточка товара`,
  login: `${COMPANY_NAME} — Авторизация`,
  orders: `${COMPANY_NAME} — Управление заказами`,
};

function loadInitialState() {
  return loadFromStorage(STORAGE_KEY, {
    products: initialDataset.products,
    orders: initialDataset.orders,
  });
}

export default function App() {
  const [initialState] = useState(loadInitialState);

  // Основные данные приложения (синхронизируются с localStorage)
  const [products, setProducts] = useState(initialState.products);
  const [orders, setOrders] = useState(initialState.orders);
  const users = initialDataset.users;
  const categories = initialDataset.categories;
  const clients = users.filter((item) => item.role_code === "client");

  // Текущий авторизованный пользователь (null = Гость)
  const [user, setUser] = useState(null);
  const [loginInput, setLoginInput] = useState("");

  // Многоэкранная навигация: "catalog" | "detail" | "login" | "orders"
  const [screen, setScreen] = useState("catalog");
  const [prevScreen, setPrevScreen] = useState("catalog");
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Фильтры каталога (доступны авторизованному пользователю)
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [sortBy, setSortBy] = useState("price_asc");

  // Черновик текущего заказа и клиент, на которого он оформляется
  const [draftItems, setDraftItems] = useState([]);
  const [targetClient, setTargetClient] = useState(null);

  // Единое уведомление (type: "info" | "warning" | "error")
  const [notice, setNotice] = useState(null);

  // 1. Динамический заголовок вкладки браузера
  useEffect(() => {
    document.title = PAGE_TITLES[screen] || COMPANY_NAME;
  }, [screen]);

  // 2. Сохранение товаров и заказов в localStorage при любых изменениях
  useEffect(() => {
    saveToStorage(STORAGE_KEY, { products, orders });
  }, [products, orders]);

  // Навигация между экранами с запоминанием предыдущего экрана для кнопки «Назад»
  const navigateTo = (nextScreen) => {
    setNotice(null);
    setPrevScreen(screen);
    setScreen(nextScreen);
  };

  const handleBack = () => {
    setNotice(null);
    if (prevScreen && prevScreen !== screen) {
      setScreen(prevScreen);
    } else {
      setScreen("catalog");
    }
  };

  // Авторизация только по логину (без пароля)
  const handleLogin = (event) => {
    event.preventDefault();
    const cleanedLogin = loginInput.trim();

    if (cleanedLogin === "") {
      setNotice({
        type: "error",
        title: "Ошибка авторизации",
        message: "Поле «Логин» не заполнено. Введите логин пользователя.",
      });
      return;
    }

    const foundUser = users.find((item) => item.login === cleanedLogin);

    if (!foundUser) {
      setNotice({
        type: "error",
        title: "Ошибка авторизации",
        message: `Пользователь с логином «${cleanedLogin}» не найден. Проверьте написание логина.`,
      });
      return;
    }

    setUser(foundUser);
    setTargetClient(foundUser);
    setLoginInput("");
    setScreen("catalog");
    setPrevScreen("catalog");
    setNotice({
      type: "info",
      title: "Вход выполнен",
      message: `Добро пожаловать, ${foundUser.full_name} (${foundUser.role_name}).`,
    });
  };

  // Выход из аккаунта и сброс фильтров
  const handleLogout = () => {
    setUser(null);
    setTargetClient(null);
    setDraftItems([]);
    setSearch("");
    setCategoryId("all");
    setSortBy("price_asc");
    setScreen("catalog");
    setPrevScreen("catalog");
    setNotice(null);
  };

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    navigateTo("detail");
  };

  // ---------- Черновик и оформление заказа ----------

  const handleAddToDraft = (newItem) => {
    setDraftItems((prev) => {
      // Одинаковый вариант суммируем в одну строку
      const existing = prev.find(
        (item) => item.variant_id === newItem.variant_id,
      );
      if (!existing) {
        return [...prev, newItem];
      }
      return prev.map((item) =>
        item.variant_id === newItem.variant_id
          ? { ...item, quantity: item.quantity + newItem.quantity }
          : item,
      );
    });
  };

  const handleRemoveDraftItem = (index) => {
    setDraftItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  // Отказ от заказа: черновик очищается, остатки не затрагиваются
  const handleCancelOrder = () => {
    setDraftItems([]);
    setNotice({
      type: "warning",
      title: "Заказ отменён",
      message: "Черновик заказа очищен, остатки не изменены.",
    });
  };

  const handleConfirmOrder = () => {
    const orderOwner = targetClient || user;
    if (!orderOwner || draftItems.length === 0) {
      return;
    }

    const nextOrderId =
      orders.length > 0 ? Math.max(...orders.map((order) => order.id)) + 1 : 1;

    const newOrder = {
      id: nextOrderId,
      user_id: orderOwner.id,
      client_full_name: orderOwner.full_name,
      order_date: getTodayString(),
      items: draftItems.map((item, index) => ({
        id: Date.now() + index,
        variant_id: item.variant_id,
        product_id: item.product_id,
        product_name: item.product_name,
        manufacturer_name: item.manufacturer_name,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    // Иммутабельное списание остатков
    setProducts((prev) => changeStock(prev, newOrder.items, -1));
    setOrders((prev) => [newOrder, ...prev]);
    setDraftItems([]);
    setTargetClient(user);

    // Менеджер, пришедший со списка заказов, возвращается туда же
    setScreen(prevScreen === "orders" ? "orders" : "catalog");
    setNotice({
      type: "info",
      title: "Заказ оформлен",
      message: `Заказ №${newOrder.id} успешно сохранён.`,
    });
  };

  // ---------- Управление заказами (Менеджер / Администратор) ----------

  const handleStartNewOrder = (clientId, productId) => {
    const client = users.find((item) => item.id === clientId);
    // Если клиент сменился — черновик другого клиента не переносим
    if (!targetClient || targetClient.id !== clientId) {
      setDraftItems([]);
    }
    setTargetClient(client);
    setSelectedProductId(productId);
    navigateTo("detail");
  };

  const handleDeleteOrder = (orderId) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) {
      return;
    }
    setProducts((prev) => changeStock(prev, order.items, +1));
    setOrders((prev) => prev.filter((item) => item.id !== orderId));
    setNotice({
      type: "info",
      title: "Заказ удалён",
      message: `Заказ №${orderId} удалён, остатки возвращены в каталог.`,
    });
  };

  // Только администратор: удаление отдельной позиции с возвратом остатка
  const handleDeleteItem = (orderId, itemId) => {
    if (!user || user.role_code !== "admin") {
      return;
    }
    const order = orders.find((item) => item.id === orderId);
    const removedItem = order
      ? order.items.find((item) => item.id === itemId)
      : null;
    if (!removedItem) {
      return;
    }

    setProducts((prev) => changeStock(prev, [removedItem], +1));
    setOrders((prev) =>
      prev
        .map((item) =>
          item.id === orderId
            ? { ...item, items: item.items.filter((row) => row.id !== itemId) }
            : item,
        )
        // Заказ без позиций смысла не имеет — удаляем его целиком
        .filter((item) => item.items.length > 0),
    );
    setNotice({
      type: "info",
      title: "Позиция удалена",
      message: "Количество возвращено в остаток каталога.",
    });
  };

  // Только администратор: смена даты заказа
  const handleChangeDate = (orderId, newDate) => {
    if (!user || user.role_code !== "admin" || newDate === "") {
      return;
    }
    if (newDate > getTodayString()) {
      setNotice({
        type: "warning",
        title: "Некорректная дата",
        message: "Дата заказа не может быть в будущем.",
      });
      return;
    }
    setOrders((prev) =>
      prev.map((item) =>
        item.id === orderId ? { ...item, order_date: newDate } : item,
      ),
    );
  };

  const canManageOrders =
    user !== null &&
    (user.role_code === "manager" || user.role_code === "admin");

  const selectedProductRaw = products.find(
    (item) => item.id === selectedProductId,
  );
  const selectedProduct = selectedProductRaw
    ? enrichProduct(selectedProductRaw, categories, orders)
    : null;

  return (
    <div>
      {/* Шапка приложения: логотип, название, кнопки ролей и ФИО в правом верхнем углу */}
      <header className="app-header">
        <div className="brand" onClick={() => navigateTo("catalog")}>
          <img src="/logo.png" alt="Логотип" />
          <div>
            <div className="brand-title">{COMPANY_NAME}</div>
          </div>
        </div>

        <div className="header-actions">
          {user && (
            <div className="user-badge">
              <div className="user-fio">{user.full_name}</div>
              <div className="user-role">{user.role_name}</div>
            </div>
          )}

          {canManageOrders && (
            <button
              type="button"
              className="btn"
              onClick={() => navigateTo("orders")}
            >
              Заказы
            </button>
          )}

          {user ? (
            <button type="button" className="btn" onClick={handleLogout}>
              Выйти
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigateTo("login")}
            >
              Войти
            </button>
          )}
        </div>
      </header>

      <main className="container">
        <Notice notice={notice} onClose={() => setNotice(null)} />

        {/* Экран 1: Авторизация */}
        {screen === "login" && (
          <LoginPage
            loginInput={loginInput}
            onLoginInputChange={setLoginInput}
            onSubmit={handleLogin}
            onBack={handleBack}
            users={users}
          />
        )}

        {/* Экран 2: Главный каталог */}
        {screen === "catalog" && (
          <CatalogPage
            title={initialDataset.catalogTitle}
            user={user}
            products={products}
            categories={categories}
            orders={orders}
            search={search}
            onSearchChange={setSearch}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* Экран 3: Карточка товара */}
        {screen === "detail" && selectedProduct && (
          <div>
            <div className="page-bar">
              <h1>Карточка товара</h1>
              <button type="button" className="btn" onClick={handleBack}>
                ← Назад
              </button>
            </div>
            <ProductDetailPage
              key={selectedProduct.id}
              product={selectedProduct}
              user={user}
              targetClient={targetClient}
              draftItems={draftItems}
              onAddToDraft={handleAddToDraft}
              onRemoveDraftItem={handleRemoveDraftItem}
              onCancelOrder={handleCancelOrder}
              onConfirmOrder={handleConfirmOrder}
              onGoToLogin={() => navigateTo("login")}
            />
          </div>
        )}

        {/* Экран 4: Управление заказами (Менеджер / Администратор) */}
        {screen === "orders" && canManageOrders && (
          <div>
            <div className="page-bar">
              <h1>Управление заказами ({user.role_name})</h1>
              <button type="button" className="btn" onClick={handleBack}>
                ← Назад
              </button>
            </div>
            <OrdersPage
              user={user}
              clients={clients}
              orders={orders}
              products={products}
              onStartNewOrder={handleStartNewOrder}
              onDeleteOrder={handleDeleteOrder}
              onDeleteItem={handleDeleteItem}
              onChangeDate={handleChangeDate}
            />
          </div>
        )}
      </main>
    </div>
  );
}
