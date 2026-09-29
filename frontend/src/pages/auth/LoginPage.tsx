import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("requester@demo.vn"),
    [password, setPassword] = useState("Password123!"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <div className="login-art">
        <div className="brand white">
          <div className="brandmark">F</div>
          <div>
            FinFlow<small>Approval workspace</small>
          </div>
        </div>
        <div>
          <span className="eyebrow">Tài chính rõ ràng</span>
          <h1>
            Mọi quyết định.
            <br />
            Một dòng chảy.
          </h1>
          <p>
            Chuẩn hóa quy trình đề xuất, phê duyệt và giải ngân cho đội ngũ của
            bạn.
          </p>
        </div>
        <div className="quote">
          “Minh bạch từ đề xuất đầu tiên đến lần giải ngân cuối cùng.”
        </div>
      </div>
      <form onSubmit={submit} className="login-form">
        <div>
          <span className="eyebrow">Chào mừng trở lại</span>
          <h2>Đăng nhập FinFlow</h2>
          <p>Sử dụng tài khoản nội bộ để tiếp tục.</p>
        </div>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="alert">{error}</div>}
        <button className="primary wide" disabled={busy}>
          {busy ? "Đang đăng nhập..." : "Đăng nhập"}
          <ChevronRight size={18} />
        </button>
        <small className="hint">Demo: requester@demo.vn · Password123!</small>
      </form>
    </div>
  );
}
