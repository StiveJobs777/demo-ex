import { useState } from "react";
import { formatPrice, getOrderTotal, getTodayString } from "../utils/catalogLogic.js";

function OrdersPage({
  user,
  clients,
  orders,
  products,
  onStartNewOrder,
  onDeleteOrder,
  onDeleteItem,
  onChangeDate,
}) {
  const isAdmin = user.role_code === "admin";

  // Форма «Новый заказ»
  const [clientId, setClientId] = useState(String(clients[0] ? clients[0].id : ""));
  const [productSearch, setProductSearch] = useState("");

  // Ожидающее подтверждения необратимое действие
  const [pendingAction, setPendingAction] = useState(null);

  const foundProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.trim().toLowerCase())
  );

  const confirmPending = () => {
    if (pendingAction.type === "order") {
      onDeleteOrder(pendingAction.orderId);
    } else {
      onDeleteItem(pendingAction.orderId, pendingAction.itemId);
    }
    setPendingAction(null);
  };

  return (
    <div>
      {pendingAction && (
        <div className="notice notice-warning" role="alert">
          <div className="notice-body">
            <span className="notice-icon">⚠️</span>
            <div>
              <strong>Необратимая операция</strong>
              <div>
                {pendingAction.type === "order"
                  ? "Заказ будет удалён целиком, а товары вернутся в остаток каталога."
                  : "Позиция будет удалена из заказа, а её количество вернётся в остаток каталога."}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-danger" onClick={confirmPending}>
              Удалить
            </button>
            <button type="button" className="btn" onClick={() => setPendingAction(null)}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Новый заказ</h3>
        <div className="filters-bar" style={{ gridTemplateColumns: "260px 1fr" }}>
          <select
            className="select"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
          >
            {clients.map((client) => (
              <option key={client.id} value={String(client.id)}>
                {client.full_name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Поиск товара по наименованию..."
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
        </div>

        <table className="table">
          <tbody>
            {foundProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.manufacturer_name} | {product.name}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onStartNewOrder(Number(clientId), product.id)}
                  >
                    Выбрать параметры
                  </button>
                </td>
              </tr>
            ))}
            {foundProducts.length === 0 && (
              <tr>
                <td>Ничего не найдено.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && <div className="panel">Заказов пока нет.</div>}

      {orders.map((order) => (
        <div className="panel" key={order.id}>
          <div className="page-bar">
            <div>
              <strong>Заказ №{order.id}</strong> — {order.client_full_name}
              <div className="field-hint">
                Дата:{" "}
                {isAdmin ? (
                  <input
                    type="date"
                    value={order.order_date}
                    max={getTodayString()}
                    onChange={(event) => onChangeDate(order.id, event.target.value)}
                  />
                ) : (
                  order.order_date
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="price-current">{formatPrice(getOrderTotal(order))}</div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setPendingAction({ type: "order", orderId: order.id })}
              >
                Удалить заказ
              </button>
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Модель</th>
                <th>Параметр</th>
                <th>Кол-во</th>
                <th>Цена за ед.</th>
                {isAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.manufacturer_name} | {item.product_name}</td>
                  <td>{item.size}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.unit_price)}</td>
                  {isAdmin && (
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() =>
                          setPendingAction({
                            type: "item",
                            orderId: order.id,
                            itemId: item.id,
                          })
                        }
                      >
                        Удалить позицию
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default OrdersPage;