import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
};

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);

  const canEdit = user?.role === "PRODUCT_MANAGER";

  async function load() {
    const { ok, data } = await api<{ products?: Product[]; error?: string }>("/api/products");
    if (!ok) {
      setError((data as { error?: string }).error ?? "Failed to load products.");
      return;
    }
    setProducts(data.products ?? []);
    setError(null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    const { ok, data } = await api<{ error?: string }>("/api/products", {
      method: "POST",
      body: JSON.stringify({ name, description, price: Number(price), stock: Number(stock) }),
    });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Invalid input.");
      return;
    }
    setName("");
    setDescription("");
    setPrice(0);
    setStock(0);
    await load();
  }

  async function updateProduct(p: Product) {
    const { ok, data } = await api<{ error?: string }>(`/api/products/${p.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
      }),
    });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Update failed.");
      return;
    }
    await load();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete product?")) return;
    const { ok, data } = await api<{ error?: string }>(`/api/products/${id}`, { method: "DELETE" });
    if (!ok) {
      setError((data as { error?: string }).error ?? "Delete failed.");
      return;
    }
    await load();
  }

  return (
    <div>
      <h1>Products</h1>
      {user?.role === "ADMIN" && (
        <p className="muted">View only — only product managers may modify the catalog.</p>
      )}
      {error && <div className="msg msg-error">{error}</div>}

      {canEdit && (
        <div className="card">
          <h2>Add product</h2>
          <form onSubmit={createProduct}>
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div className="field">
              <label>Price</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>Stock</label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Catalog</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                readOnly={!canEdit}
                onSave={(x) => void updateProduct(x)}
                onDelete={() => void deleteProduct(p.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  readOnly,
  onSave,
  onDelete,
}: {
  product: Product;
  readOnly: boolean;
  onSave: (p: Product) => void;
  onDelete: () => void;
}) {
  const [p, setP] = useState(product);
  useEffect(() => setP(product), [product]);

  if (readOnly) {
    return (
      <tr>
        <td>{p.name}</td>
        <td>{p.price}</td>
        <td>{p.stock}</td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      </td>
      <td>
        <input
          type="number"
          style={{ maxWidth: 100 }}
          value={p.price}
          onChange={(e) => setP({ ...p, price: Number(e.target.value) })}
        />
      </td>
      <td>
        <input
          type="number"
          style={{ maxWidth: 80 }}
          value={p.stock}
          onChange={(e) => setP({ ...p, stock: Number(e.target.value) })}
        />
      </td>
      <td>
        <button type="button" className="btn" onClick={() => onSave(p)}>
          Save
        </button>{" "}
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          Delete
        </button>
      </td>
    </tr>
  );
}
