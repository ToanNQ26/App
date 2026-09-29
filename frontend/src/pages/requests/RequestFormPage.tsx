import { useState } from 'react';
import { ArrowLeft, Plus, Send, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/http.service';
import { useToast } from '../../contexts/ToastContext';
import { formatVnd as money } from '../../utils/currency';
import type { FinancialRequest, Item } from '../../types';
import { Card } from '../../components/Card';
const blank: Item = {
  itemType: "SERVICE",
  name: "",
  quantity: 1,
  unitPrice: 0,
};
export function RequestFormPage() {
  const nav = useNavigate();
  const { notify } = useToast();
  const [purpose, setPurpose] = useState(""),
    [items, setItems] = useState<Item[]>([{ ...blank }]),
    [busy, setBusy] = useState(false);
  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  function patch(i: number, k: string, v: any) {
    setItems(items.map((x, n) => (n === i ? { ...x, [k]: v } : x)));
  }
  async function save(submit = false) {
    setBusy(true);
    try {
      const { data } = await api<FinancialRequest>("/requests", {
        method: "POST",
        body: JSON.stringify({ type: "ADVANCE", purpose, items }),
      });
      if (submit) await api(`/requests/${data.id}/submit`, { method: "POST" });
      nav(`/requests/${data.id}`);
    } catch (e: any) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title">
        <div>
          <Link to="/requests" className="back">
            <ArrowLeft size={16} /> Quay lại
          </Link>
          <h1>Tạo đề xuất mới</h1>
          <p>Điền thông tin và các khoản mục cần xét duyệt.</p>
        </div>
      </div>
      <div className="form-grid">
        <div>
          <Card title="Thông tin chung">
            <div className="fields">
              <label>
                Mục đích
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Mô tả mục đích sử dụng..."
                />
              </label>
            </div>
          </Card>
          <Card title="Chi tiết khoản mục">
            <div className="items">
              {items.map((it, i) => (
                <div className="item" key={i}>
                  <div className="item-no">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="item-fields">
                    <label>
                      Tên khoản mục
                      <input
                        value={it.name}
                        onChange={(e) => patch(i, "name", e.target.value)}
                        placeholder="VD: Chi phí lưu trú"
                      />
                    </label>
                    <label>
                      Phân loại
                      <select
                        value={it.itemType}
                        onChange={(e) => patch(i, "itemType", e.target.value)}
                      >
                        <option>SERVICE</option>
                        <option>EQUIPMENT</option>
                        <option>OTHER</option>
                      </select>
                    </label>
                    <label>
                      Số lượng
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          patch(i, "quantity", Number(e.target.value))
                        }
                      />
                    </label>
                    <label>
                      Đơn giá
                      <input
                        type="number"
                        min="0"
                        value={it.unitPrice === 0 ? "" : it.unitPrice}
                        placeholder="0"
                        onChange={(e) =>
                          patch(
                            i,
                            "unitPrice",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                      />
                    </label>
                    <b>{money(it.quantity * it.unitPrice)}</b>
                    {items.length > 1 && (
                      <button
                        className="icon danger"
                        onClick={() =>
                          setItems(items.filter((_, n) => n !== i))
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              className="text-btn"
              onClick={() => setItems([...items, { ...blank }])}
            >
              <Plus size={17} /> Thêm khoản mục
            </button>
          </Card>
        </div>
        <aside className="summary">
          <span>Tổng đề xuất</span>
          <strong>{money(total)}</strong>
          <p>Giá trị chính thức sẽ được máy chủ kiểm tra khi lưu.</p>
          <div className="rule">
            <b>Luồng dự kiến</b>
            <span>
              {total <= 1_000_000
                ? "Trưởng bộ phận duyệt / tự duyệt theo hạn mức"
                : total <= 50_000_000
                  ? "Ban Giám đốc"
                  : "Chủ tịch"}
            </span>
          </div>
          <button
            className="secondary wide"
            disabled={busy || !purpose}
            onClick={() => save(false)}
          >
            Lưu bản nháp
          </button>
          <button
            className="primary wide"
            disabled={busy || !purpose}
            onClick={() => save(true)}
          >
            <Send size={17} /> Gửi đề xuất
          </button>
        </aside>
      </div>
    </>
  );
}

