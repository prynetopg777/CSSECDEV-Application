import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";

type Order = {
  id: string;
  userId: string;
  productName: string;
  quantity: number;
  notes: string;
  createdAt: string;
  user?: { email: string; id: string };
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const isCustomer = user?.role === "CUSTOMER";
  const isPm = user?.role === "PRODUCT_MANAGER";
  const isAdmin = user?.role === "ADMIN";
  const canMutate = isCustomer || isPm;

  async function load() {
    const { ok, data } = await api<{ orders?: Order[]; error?: string }>("/api/orders");
    if (!ok) {
      setError((data as { error?: string }).error ?? "Failed to load orders.");
      return;
    }
    setOrders(data.orders ?? []);
    setError(null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    const { ok, data } = await api<{ error?: string }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ productName, quantity, notes }),
    });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Invalid input.");
      return;
    }
    setProductName("");
    setQuantity(1);
    setNotes("");
    await load();
  }

  async function saveOrder(o: Order) {
    const { ok, data } = await api<{ error?: string }>(`/api/orders/${o.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        productName: o.productName,
        quantity: o.quantity,
        notes: o.notes,
      }),
    });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Update failed.");
      return;
    }
    await load();
  }

  async function delOrder(id: string) {
    if (!confirm("Delete this order?")) return;
    const { ok, data } = await api<{ error?: string }>(`/api/orders/${id}`, { method: "DELETE" });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Delete failed.");
      return;
    }
    await load();
  }

  return (
    <div>
      <h1>Orders</h1>
      {isAdmin && <p className="muted">View only — administrators cannot modify orders.</p>}
      {error && <div className="msg msg-error">{error}</div>}

      {isCustomer && (
        <div className="card">
          <h2>New order</h2>
          <form onSubmit={createOrder}>
            <div className="field">
              <label>Product name</label>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
            </div>
            <button type="submit" className="btn btn-primary">
              Create order
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <h2>{isCustomer ? "Your orders" : "All orders"}</h2>
        <table>
          <thead>
            <tr>
              {!isCustomer && <th>Customer</th>}
              <th>Product</th>
              <th>Qty</th>
              <th>Notes</th>
              {canMutate && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                showCustomer={!isCustomer}
                readOnly={!canMutate}
                onSave={(x) => void saveOrder(x)}
                onDelete={() => void delOrder(o.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  showCustomer,
  readOnly,
  onSave,
  onDelete,
}: {
  order: Order;
  showCustomer: boolean;
  readOnly: boolean;
  onSave: (o: Order) => void;
  onDelete: () => void;
}) {
  const [o, setO] = useState(order);
  useEffect(() => setO(order), [order]);

  if (readOnly) {
    return (
      <tr>
        {showCustomer && <td className="muted">{order.user?.email ?? order.userId}</td>}
        <td>{o.productName}</td>
        <td>{o.quantity}</td>
        <td>{o.notes}</td>
      </tr>
    );
  }

  return (
    <tr>
      {showCustomer && <td className="muted">{order.user?.email ?? order.userId}</td>}
      <td>
        <input value={o.productName} onChange={(e) => setO({ ...o, productName: e.target.value })} />
      </td>
      <td>
        <input
          type="number"
          min={1}
          style={{ maxWidth: 80 }}
          value={o.quantity}
          onChange={(e) => setO({ ...o, quantity: Number(e.target.value) })}
        />
      </td>
      <td>
        <input value={o.notes} onChange={(e) => setO({ ...o, notes: e.target.value })} />
      </td>
      <td>
        <button type="button" className="btn" onClick={() => onSave(o)}>
          Save
        </button>{" "}
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          Delete
        </button>
      </td>
    </tr>
  );
}
