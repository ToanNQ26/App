import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, FilePlus2, Send, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/http.service';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Empty, Status, requestStatus } from '../../components';
import { Card } from '../../components/Card';
import { formatVnd as money } from '../../utils/currency';
import type { Action, FinancialRequest } from '../../types';
const BadgeDollarSign = FilePlus2;
export function RequestDetailPage() {
  const { id } = useParams(),
    { user } = useAuth();
  const { notify } = useToast();
  const [r, setR] = useState<FinancialRequest | null>(null),
    [history, setHistory] = useState<Action[]>([]),
    [docs, setDocs] = useState<any[]>([]),
    [paid, setPaid] = useState<any[]>([]),
    [bankProfile, setBankProfile] = useState({ bankAccountNumber: "", bankName: "" }),
    [useSavedBankAccount, setUseSavedBankAccount] = useState(true),
    [customBankAccountNumber, setCustomBankAccountNumber] = useState(""),
    [customBankName, setCustomBankName] = useState(""),
    [showSupplementForm, setShowSupplementForm] = useState(false),
    [supplementComment, setSupplementComment] = useState(""),
    [showRejectForm, setShowRejectForm] = useState(false),
    [rejectReason, setRejectReason] = useState(""),
    [showChairmanRejectForm, setShowChairmanRejectForm] = useState(false),
    [chairmanRejectReason, setChairmanRejectReason] = useState(""),
    [showDisbursementForm, setShowDisbursementForm] = useState(false),
    [exportDisbursementExcel, setExportDisbursementExcel] = useState(false),
    [disbursementAmount, setDisbursementAmount] = useState(""),
    [disbursementMethod, setDisbursementMethod] = useState("BANK_TRANSFER"),
    [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().slice(0, 10));
  const load = () =>
    Promise.all([
      api<FinancialRequest>(`/requests/${id}`).then((x) => setR(x.data)),
      api<Action[]>(`/requests/${id}/history`).then((x) => setHistory(x.data)),
      api<any[]>(`/requests/${id}/payment-documents`).then((x) =>
        setDocs(x.data),
      ),
      api<any[]>(`/requests/${id}/disbursement`).then((x) => setPaid(x.data)),
      api<{ bankAccountNumber: string; bankName: string }>("/users/me/bank-account").then(({ data }) => {
        setBankProfile(data);
        setUseSavedBankAccount(Boolean(data.bankAccountNumber && data.bankName));
      }),
    ]);
  useEffect(() => {
    load();
  }, [id]);
  async function act(path: string, body: any = {}) {
    try {
      await api(`/requests/${id}/${path}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await load();
      return true;
    } catch (e: any) {
      notify(e.message);
      return false;
    }
  }
  async function submitPaymentDocuments() {
    try {
      await api(`/requests/${id}/payment-documents/submit`, {
        method: "POST",
        body: JSON.stringify(selectedBankAccount),
      });
    } catch (error: any) {
      notify(error.message);
      return;
    }
    notify("Hồ sơ đã được nộp thành công.", "success");
    load().catch(() => notify("Hồ sơ đã nộp, nhưng không tải lại được dữ liệu mới nhất."));
  }
  async function downloadDisbursementReport() {
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${base}/requests/${id}/disbursement/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error?.message || "Không thể xuất báo cáo Excel.");
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `xac-nhan-giai-ngan-${r?.requestCode || id}.xlsx`;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      notify(`Đã ghi nhận giải ngân nhưng không xuất được Excel: ${error.message}`);
    }
  }
  async function upload(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", "OTHER");
    try {
      await api(`/requests/${id}/payment-documents`, {
        method: "POST",
        body: form,
      });
      await load();
    } catch (e: any) {
      notify(e.message);
    }
  }
  async function viewDocument(document: any) {
    const preview = window.open("about:blank", "_blank");
    if (!preview) {
      notify("Vui lòng cho phép mở cửa sổ mới để xem tệp.");
      return;
    }
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const response = await fetch(
        `${base}/requests/${id}/payment-documents/${document._id}/file`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error?.message || "Không thể mở tệp hồ sơ");
      }
      const fileUrl = URL.createObjectURL(await response.blob());
      preview.location.href = fileUrl;
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
    } catch (error: any) {
      preview.close();
      notify(error.message);
    }
  }
  if (!r) return <div className="loading">Đang tải hồ sơ...</div>;
  const canApprove =
    r.status === "PENDING_APPROVAL" &&
    ["DEPARTMENT_HEAD", "DIRECTOR", "CHAIRMAN"].includes(user.role);
  const disbursedTotal = paid.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingAmount = Math.max(0, r.totalAmount - disbursedTotal);
  const amountValue = Number(disbursementAmount);
  const hasSavedBankAccount = Boolean(bankProfile.bankAccountNumber && bankProfile.bankName);
  const selectedBankAccount = useSavedBankAccount && hasSavedBankAccount
    ? bankProfile
    : { bankAccountNumber: customBankAccountNumber.trim(), bankName: customBankName.trim() };
  const canSubmitDocuments = selectedBankAccount.bankAccountNumber.length >= 4
    && selectedBankAccount.bankAccountNumber.length <= 34
    && selectedBankAccount.bankName.length >= 2
    && selectedBankAccount.bankName.length <= 100;
  return (
    <>
      <div className="detail-head">
        <div>
          <Link to="/requests" className="back">
            <ArrowLeft size={16} /> Danh sách đề xuất
          </Link>
          <div className="code">{r.requestCode}</div>
          <h1>{r.purpose}</h1>
          <Status value={requestStatus(r)} />
        </div>
        <div className="detail-total">
          <span>Tổng đề xuất</span>
          <strong>{money(r.totalAmount)}</strong>
          <small>{r.approvalLevel && `Cấp duyệt: ${r.approvalLevel}`}</small>
        </div>
      </div>
      {
        <div className="actionbar">
          {r.status === "DRAFT" && r.requesterId.id === user.id && (
            <button className="primary" onClick={() => act("submit")}>
              <Send size={17} />
              Gửi đề xuất
            </button>
          )}
          {canApprove && (
            <>
              <button className="primary" onClick={() => act("approve")}>
                <Check size={17} />
                Phê duyệt
              </button>
              <button
                className="danger-btn"
                onClick={() => setShowRejectForm((open) => !open)}
              >
                <X size={17} />
                Từ chối
              </button>
            </>
          )}
          {r.status === "WAITING_PAYMENT_DOCUMENTS" &&
            r.requesterId.id === user.id && (
              <>
                <label className="secondary upload">
                  <FilePlus2 size={17} />
                  Tải chứng từ
                  <input type="file" accept=".pdf,image/*" onChange={upload} />
                </label>
                <button
                  className="primary"
                  disabled={!canSubmitDocuments}
                  onClick={submitPaymentDocuments}
                >
                  Nộp hồ sơ
                </button>
              </>
            )}
          {r.paymentStatus === "PENDING_ACCOUNTANT_CHECK" &&
            user.role === "ACCOUNTANT" && (
              <>
                <button
                  className="primary"
                  onClick={() => act("accountant-check", { result: "VALID" })}
                >
                  Hồ sơ hợp lệ
                </button>
                <button
                  className="danger-btn"
                  onClick={() => setShowSupplementForm((open) => !open)}
                >
                  Yêu cầu bổ sung
                </button>
              </>
            )}
          {r.paymentStatus === "PENDING_CHAIRMAN_PAYMENT_APPROVAL" &&
            user.role === "CHAIRMAN" &&
            !r.chairmanPaymentApprovedAt && (
              <>
                <button
                  className="primary"
                  onClick={() => act("chairman-approve")}
                >
                  Duyệt chi
                </button>
                <button
                  className="danger-btn"
                  onClick={() => setShowChairmanRejectForm((open) => !open)}
                >
                  Từ chối chi
                </button>
              </>
            )}
          {r.chairmanPaymentApprovedAt &&
            r.paymentStatus !== "COMPLETED" &&
            user.role === "ACCOUNTANT" && (
              <button
                className="primary"
                onClick={() => setShowDisbursementForm((open) => !open)}
              >
                Ghi nhận giải ngân
              </button>
            )}
        </div>
      }
      {r.status === "WAITING_PAYMENT_DOCUMENTS" && r.requesterId.id === user.id && (
        <section className="request-bank-account">
          <div className="request-bank-heading">
            <h2>Tài khoản nhận tiền</h2>
            <p>Chọn tài khoản sẽ nhận khoản giải ngân cho đề xuất này.</p>
          </div>
          {hasSavedBankAccount && (
            <label className="bank-account-option">
              <input type="radio" name="requestBankAccount" checked={useSavedBankAccount}
                onChange={() => setUseSavedBankAccount(true)} />
              <span><b>Dùng tài khoản đã lưu</b><small>{bankProfile.bankAccountNumber} · {bankProfile.bankName}</small></span>
            </label>
          )}
          <label className="bank-account-option">
            <input type="radio" name="requestBankAccount" checked={!useSavedBankAccount || !hasSavedBankAccount}
              onChange={() => setUseSavedBankAccount(false)} />
            <span><b>{hasSavedBankAccount ? "Nhập tài khoản khác cho đề xuất này" : "Nhập tài khoản nhận tiền"}</b>
              {!hasSavedBankAccount && <small>Bạn có thể lưu tài khoản mặc định trong <Link to="/profile/bank-account">Hồ sơ tài khoản ngân hàng</Link>.</small>}
            </span>
          </label>
          {(!useSavedBankAccount || !hasSavedBankAccount) && (
            <div className="request-bank-fields">
              <label>Số tài khoản
                <input required minLength={4} maxLength={34} value={customBankAccountNumber}
                  onChange={(event) => setCustomBankAccountNumber(event.target.value)} placeholder="Nhập số tài khoản" />
              </label>
              <label>Tên ngân hàng
                <input required minLength={2} maxLength={100} value={customBankName}
                  onChange={(event) => setCustomBankName(event.target.value)} placeholder="Ví dụ: Vietcombank" />
              </label>
            </div>
          )}
          {!canSubmitDocuments && (
            <p className="disbursement-error">Cần nhập đủ số tài khoản và tên ngân hàng hợp lệ trước khi nộp hồ sơ.</p>
          )}
        </section>
      )}
      {showRejectForm && (
        <form className="supplement-form rejection-form" onSubmit={async (event) => {
          event.preventDefault();
          const success = await act("reject", { reason: rejectReason.trim() });
          if (success) {
            setShowRejectForm(false);
            setRejectReason("");
          }
        }}>
          <div className="supplement-heading">
            <span className="eyebrow">XÁC NHẬN QUYẾT ĐỊNH</span>
            <h2>Từ chối đề xuất</h2>
            <p>Vui lòng nêu lý do để người đề xuất biết thông tin cần điều chỉnh.</p>
          </div>
          <label>
            Lý do từ chối
            <textarea required autoFocus rows={4} maxLength={1000}
              value={rejectReason} onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Nhập lý do từ chối..." />
          </label>
          <div className="disbursement-actions">
            <button className="secondary" type="button" onClick={() => setShowRejectForm(false)}>Hủy</button>
            <button className="danger-btn" type="submit" disabled={!rejectReason.trim()}>Xác nhận từ chối</button>
          </div>
        </form>
      )}
      {showSupplementForm && (
        <form
          className="supplement-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const success = await act("accountant-check", {
              result: "NEED_SUPPLEMENT",
              comment: supplementComment.trim(),
            });
            if (success) {
              setShowSupplementForm(false);
              setSupplementComment("");
            }
          }}
        >
          <div className="supplement-heading">
            <span className="eyebrow">PHẢN HỒI HỒ SƠ</span>
            <h2>Yêu cầu bổ sung chứng từ</h2>
            <p>Ghi rõ tài liệu hoặc thông tin người đề xuất cần bổ sung.</p>
          </div>
          <label>
            Nội dung cần bổ sung
            <textarea
              required
              autoFocus
              rows={4}
              maxLength={1000}
              value={supplementComment}
              onChange={(event) => setSupplementComment(event.target.value)}
              placeholder="Ví dụ: Vui lòng bổ sung hóa đơn có thông tin nhà cung cấp..."
            />
            <small>{supplementComment.length}/1000 ký tự</small>
          </label>
          <div className="disbursement-actions">
            <button className="secondary" type="button" onClick={() => setShowSupplementForm(false)}>
              Hủy
            </button>
            <button className="primary" type="submit" disabled={!supplementComment.trim()}>
              Gửi yêu cầu bổ sung
            </button>
          </div>
        </form>
      )}
      {showChairmanRejectForm && (
        <form
          className="supplement-form rejection-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const success = await act("chairman-reject", {
              reason: chairmanRejectReason.trim(),
            });
            if (success) {
              setShowChairmanRejectForm(false);
              setChairmanRejectReason("");
            }
          }}
        >
          <div className="supplement-heading">
            <span className="eyebrow">XÁC NHẬN QUYẾT ĐỊNH</span>
            <h2>Từ chối giải ngân</h2>
            <p>Ghi chú lý do từ chối (không bắt buộc).</p>
          </div>
          <label>
            Ghi chú
            <textarea
              rows={4}
              maxLength={1000}
              value={chairmanRejectReason}
              onChange={(event) => setChairmanRejectReason(event.target.value)}
              placeholder="Có thể để trống nếu không cần ghi chú."
            />
            <small>{chairmanRejectReason.length}/1000 ký tự</small>
          </label>
          <div className="disbursement-actions">
            <button className="secondary" type="button" onClick={() => setShowChairmanRejectForm(false)}>
              Hủy
            </button>
            <button className="danger-btn" type="submit">
              Xác nhận từ chối chi
            </button>
          </div>
        </form>
      )}
      {showDisbursementForm && (
        <form
          className="disbursement-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const success = await act("disburse", {
              amount: amountValue,
              method: disbursementMethod,
              disbursedAt: new Date(`${disbursementDate}T00:00:00`).toISOString(),
            });
            if (success) {
              setShowDisbursementForm(false);
              setDisbursementAmount("");
              notify("Đã ghi nhận giải ngân thành công.", "success");
              if (exportDisbursementExcel) await downloadDisbursementReport();
            }
          }}
        >
          <div className="disbursement-heading">
            <div>
              <span className="eyebrow">GIAO DỊCH CHI</span>
              <h2>Ghi nhận giải ngân</h2>
            </div>
            <p>Còn có thể giải ngân <b>{money(remainingAmount)}</b></p>
          </div>
          <div className="disbursement-fields">
            <label>
              Số tiền giải ngân
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                required
                value={disbursementAmount
                  ? new Intl.NumberFormat("vi-VN").format(amountValue)
                  : ""}
                onChange={(event) =>
                  setDisbursementAmount(event.target.value.replace(/\D/g, ""))
                }
                placeholder="Ví dụ: 1.500.000"
              />
              <small className="money-input-preview">
                {amountValue > 0 ? `Số tiền: ${money(amountValue)}` : "Đơn vị tiền: VND"}
              </small>
            </label>
            <label>
              Phương thức
              <select value={disbursementMethod}
                onChange={(event) => setDisbursementMethod(event.target.value)}>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="CASH">Tiền mặt</option>
              </select>
            </label>
            <label>
              Ngày giải ngân
              <input type="date" required value={disbursementDate}
                onChange={(event) => setDisbursementDate(event.target.value)} />
            </label>
          </div>
          <label className="export-excel-option">
            <input type="checkbox" checked={exportDisbursementExcel}
              onChange={(event) => setExportDisbursementExcel(event.target.checked)} />
            Xuất file Excel báo cáo sau khi ghi nhận giải ngân
          </label>
          {amountValue > remainingAmount && (
            <p className="disbursement-error">Số tiền vượt quá số dư còn có thể giải ngân.</p>
          )}
          <div className="disbursement-actions">
            <button className="secondary" type="button"
              onClick={() => setShowDisbursementForm(false)}>Hủy</button>
            <button className="primary" type="submit"
              disabled={!amountValue || amountValue > remainingAmount}>
              Xác nhận giải ngân
            </button>
          </div>
        </form>
      )}
      <div className="detail-grid">
        <div>
          <Card title="Thông tin đề xuất">
            <div className="meta">
              <div>
                <span>Người đề xuất</span>
                <b>{r.requesterId.name}</b>
              </div>
              <div>
                <span>Phòng ban</span>
                <b>{r.departmentId?.name || "—"}</b>
              </div>
              <div>
                <span>Ngày tạo</span>
                <b>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</b>
              </div>
            </div>
          </Card>
          {r.bankAccountNumber && r.bankName && (
            <Card title="Tài khoản nhận tiền">
              <div className="meta bank-transfer-details">
                <div><span>Số tài khoản</span><b>{r.bankAccountNumber}</b></div>
                <div><span>Ngân hàng</span><b>{r.bankName}</b></div>
              </div>
            </Card>
          )}
          <Card title="Các khoản mục">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Khoản mục</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {r.items.map((i, n) => (
                    <tr key={n}>
                      <td>
                        <b>{i.name}</b>
                        <small>{i.itemType}</small>
                      </td>
                      <td>{i.quantity}</td>
                      <td>{money(i.unitPrice)}</td>
                      <td className="amount">
                        {money(i.amount || i.quantity * i.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title={`Chứng từ (${docs.length})`}>
            {docs.length ? (
              docs.map((d) => (
                <div className="document" key={d._id}>
                  <FilePlus2 />
                  <div>
                    <b>{d.originalName}</b>
                    <small>
                      {d.documentType} · {(d.fileSize / 1024).toFixed(0)} KB
                    </small>
                  </div>
                  <button className="secondary document-view" onClick={() => viewDocument(d)}>
                    Xem tệp
                  </button>
                </div>
              ))
            ) : (
              <Empty
                title="Chưa có chứng từ"
                text="Người đề xuất chưa tải lên tài liệu."
              />
            )}
          </Card>
          <Card title="Tình hình giải ngân">
            <div className="disbursement-summary">
              <div>
                <span>Đã giải ngân</span>
                <strong>{money(disbursedTotal)}</strong>
              </div>
              <div>
                <span>Còn thiếu</span>
                <strong>{money(remainingAmount)}</strong>
              </div>
            </div>
          </Card>
          {paid.length > 0 && (
            <Card title="Các đợt giải ngân">
              {paid.map((d, i) => (
                <div className="document" key={d._id}>
                  <BadgeDollarSign />
                  <div>
                    <b>
                      Đợt {i + 1}: {money(d.amount)}
                    </b>
                    <small>
                      {new Date(d.disbursedAt).toLocaleDateString("vi-VN")} ·{" "}
                      {d.method}
                    </small>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
        <Card title="Dòng thời gian">
          <div className="timeline">
            {history.map((h, i) => (
              <div className="event" key={h._id}>
                <div className="dot">
                  {i === history.length - 1 ? (
                    <Check size={13} />
                  ) : (
                    <Clock3 size={13} />
                  )}
                </div>
                <div>
                  <b>{h.action.replaceAll("_", " ")}</b>
                  <p>
                    {h.actorId?.name} ·{" "}
                    {new Date(h.createdAt).toLocaleString("vi-VN")}
                  </p>
                  {h.comment && <blockquote>{h.comment}</blockquote>}
                  <small>
                    {h.fromStatus} → {h.toStatus}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

