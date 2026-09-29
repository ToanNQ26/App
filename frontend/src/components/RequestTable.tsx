import { BookmarkCheck, BookmarkPlus, Download, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { FinancialRequest } from "../types";
import { formatVnd } from "../utils/currency";
import { api } from "../services/http.service";
import { useToast } from "../contexts/ToastContext";
import { Empty, Status, requestStatus } from "./index";

export function RequestTable({
  rows,
  trackedIds = new Set<string>(),
  onToggleTrack,
  showExport = false,
}: {
  rows: FinancialRequest[];
  trackedIds?: Set<string>;
  onToggleTrack?: (request: FinancialRequest) => void;
  showExport?: boolean;
}) {
  const { notify } = useToast();

  async function exportRequest(request: FinancialRequest) {
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${base}/requests/${request.id}/export.xlsx`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error?.message || "Không thể xuất đề xuất.");
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `de-xuat-${request.requestCode}.xlsx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error: any) {
      notify(error.message);
    }
  }

  if (!rows.length) return <Empty />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mã đề xuất</th><th>Nội dung</th><th>Số tiền</th><th>Trạng thái</th><th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((request) => {
            const isTracked = trackedIds.has(request.id);
            return (
              <tr key={request.id}>
                <td><b>{request.requestCode}</b><small>{new Date(request.createdAt).toLocaleDateString("vi-VN")}</small></td>
                <td>{request.purpose}</td>
                <td className="amount">{formatVnd(request.totalAmount)}</td>
                <td><Status value={requestStatus(request)} /></td>
                <td className="request-row-actions">
                  <button className={`table-action${isTracked ? " is-tracked" : ""}`} title={isTracked ? "Bỏ theo dõi" : "Theo dõi đề xuất"}
                    aria-label={isTracked ? "Bỏ theo dõi đề xuất" : "Theo dõi đề xuất"}
                    onClick={() => onToggleTrack?.(request)}>
                    {isTracked ? <BookmarkCheck size={17} /> : <BookmarkPlus size={17} />}
                  </button>
                  {showExport && <button className="table-action" title="Xuất Excel" aria-label="Xuất đề xuất ra Excel"
                    onClick={() => exportRequest(request)}><Download size={17} /></button>}
                  <Link className="round" aria-label="Xem đề xuất" to={`/requests/${request.id}`}><ChevronRight size={17} /></Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
