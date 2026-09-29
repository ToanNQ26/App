import { useEffect, useState } from "react";
import { Building2, CreditCard, Save } from "lucide-react";
import { api } from "../../services/http.service";
import { useToast } from "../../contexts/ToastContext";
import { Card } from "../../components/Card";

type BankAccount = { bankAccountNumber: string; bankName: string };

export function BankAccountPage() {
  const { notify } = useToast();
  const [account, setAccount] = useState<BankAccount>({ bankAccountNumber: "", bankName: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<BankAccount>("/users/me/bank-account")
      .then(({ data }) => setAccount(data))
      .catch((error: Error) => notify(error.message))
      .finally(() => setLoading(false));
  }, [notify]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api<BankAccount>("/users/me/bank-account", {
        method: "PUT",
        body: JSON.stringify(account),
      });
      setAccount(data);
      notify("Đã cập nhật tài khoản ngân hàng.", "success");
    } catch (error: any) {
      notify(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">HỒ SƠ CÁ NHÂN</span>
          <h1>Tài khoản ngân hàng</h1>
          <p>Lưu thông tin nhận tiền mặc định cho các đề xuất của bạn.</p>
        </div>
      </div>
      <Card title="Thông tin nhận tiền">
        {loading ? (
          <div className="loading">Đang tải thông tin...</div>
        ) : (
          <form className="bank-account-form" onSubmit={save}>
            <div className="bank-account-intro">
              <div className="bank-account-icon"><CreditCard size={22} /></div>
              <p>Thông tin này sẽ được đề xuất tự động khi bạn nộp chứng từ. Bạn vẫn có thể chọn một tài khoản khác cho từng đề xuất.</p>
            </div>
            <label>
              Số tài khoản
              <input
                required
                minLength={4}
                maxLength={34}
                autoComplete="off"
                value={account.bankAccountNumber}
                onChange={(event) => setAccount({ ...account, bankAccountNumber: event.target.value })}
                placeholder="Nhập số tài khoản"
              />
            </label>
            <label>
              Tên ngân hàng
              <input
                required
                minLength={2}
                maxLength={100}
                value={account.bankName}
                onChange={(event) => setAccount({ ...account, bankName: event.target.value })}
                placeholder="Ví dụ: Vietcombank"
              />
            </label>
            <div className="bank-account-actions">
              <span><Building2 size={15} /> Có thể cập nhật thông tin bất kỳ lúc nào</span>
              <button className="primary" disabled={saving}>
                <Save size={16} /> {saving ? "Đang lưu..." : "Lưu tài khoản"}
              </button>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
