import { useEffect, useState } from 'react';
import { api } from '../../services/http.service';
import type { FinancialRequest } from '../../types';
import { Card } from '../../components/Card';
import { RequestTable } from '../../components/RequestTable';
import { requestStatus } from '../../components';
import { useToast } from '../../contexts/ToastContext';
export function RequestsPage({
  approval = false,
  payments = false,
  tracked = false,
}: {
  approval?: boolean;
  payments?: boolean;
  tracked?: boolean;
}) {
  const [rows, setRows] = useState<FinancialRequest[]>([]),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const { notify } = useToast();
  useEffect(() => {
    let active = true;
    const requestList = tracked
      ? api<FinancialRequest[]>("/requests/bookmarked")
      : api<FinancialRequest[]>(approval ? "/approvals/pending" : "/requests?limit=100");
    Promise.all([
      requestList,
      tracked ? Promise.resolve(null) : api<FinancialRequest[]>("/requests/bookmarked"),
    ]).then(([list, bookmarks]) => {
      if (!active) return;
      setRows(list.data);
      const ids = tracked ? list.data.map((request) => request.id) : bookmarks!.data.map((request) => request.id);
      setTrackedIds(new Set(ids));
    }).catch((error: Error) => notify(error.message));
    return () => { active = false; };
  }, [approval, tracked, notify]);
  async function toggleTracked(request: FinancialRequest) {
    const currentlyTracked = trackedIds.has(request.id);
    try {
      await api(`/requests/${request.id}/bookmark`, {
        method: currentlyTracked ? "DELETE" : "POST",
      });
      setTrackedIds((current) => {
        const next = new Set(current);
        if (currentlyTracked) next.delete(request.id);
        else next.add(request.id);
        return next;
      });
      if (tracked && currentlyTracked)
        setRows((current) => current.filter((item) => item.id !== request.id));
      notify(currentlyTracked ? "Đã bỏ theo dõi đề xuất." : "Đã thêm đề xuất vào danh sách theo dõi.", "success");
    } catch (error: any) {
      notify(error.message);
    }
  }
  const shown = rows.filter(
    (r) =>
      (!payments || r.paymentStatus) &&
      (!status || requestStatus(r) === status) &&
      `${r.requestCode} ${r.purpose}`.toLowerCase().includes(q.toLowerCase()),
  );
  const availableStatuses = [...new Set(
    rows
      .filter((r) => !payments || r.paymentStatus)
      .map(requestStatus),
  )].sort();
  const statusNames: Record<string, string> = {
    DRAFT: "Bản nháp",
    PENDING_APPROVAL: "Chờ duyệt",
    WAITING_PAYMENT_DOCUMENTS: "Nộp hồ sơ",
    REJECTED: "Đã từ chối",
    PENDING_ACCOUNTANT_CHECK: "Chờ kế toán duyệt",
    NEED_SUPPLEMENT: "Cần bổ sung",
    PENDING_CHAIRMAN_PAYMENT_APPROVAL: "Chờ Chủ tịch duyệt chi",
    READY_FOR_DISBURSEMENT: "Chờ giải ngân",
    PAYMENT_REJECTED: "Từ chối chi",
    DISBURSED: "Đã giải ngân",
    COMPLETED: "Hoàn tất",
  };
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">
            {approval
              ? "Phê duyệt"
              : tracked
                ? "Theo dõi"
                : payments
                ? "Kiểm soát chi"
                : "Quản lý đề xuất"}
          </span>
          <h1>
            {approval
              ? "Hồ sơ chờ duyệt"
              : tracked
                ? "Các đề xuất được theo dõi"
                : payments
                ? "Thanh toán & giải ngân"
                : "Danh sách đề xuất"}
          </h1>
          <p>{shown.length} hồ sơ được tìm thấy</p>
        </div>
      </div>
      <div className="toolbar">
        <input
          placeholder="Tìm theo mã hoặc nội dung..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select aria-label="Lọc theo trạng thái" value={status}
          onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {availableStatuses.map((value) => (
            <option key={value} value={value}>{statusNames[value] || value}</option>
          ))}
        </select>
      </div>
      <Card title={tracked ? "Danh sách theo dõi" : "Hồ sơ"}>
        <RequestTable rows={shown} trackedIds={trackedIds} onToggleTrack={toggleTracked}
          showExport={!approval && !payments && !tracked} />
      </Card>
    </>
  );
}
