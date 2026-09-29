import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/http.service';
import type { FinancialRequest } from '../../types';
import { Card } from '../../components/Card';
import { RequestTable } from '../../components/RequestTable';
export function DashboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<FinancialRequest[]>([]);
  useEffect(() => {
    api<FinancialRequest[]>("/requests?limit=5").then((r) => setRows(r.data));
  }, []);
  const pending = rows.filter((r) => r.status === "PENDING_APPROVAL").length;
  return (
    <>
      <div className="welcome">
        <div>
          <span className="eyebrow">Hôm nay</span>
          <h1>Xin chào, {user.name}</h1>
          <p>Đây là tổng quan công việc tài chính cần bạn quan tâm.</p>
        </div>
        <div className="date">
          Tháng {new Date().getMonth() + 1}
          <b>{new Date().getDate()}</b>
        </div>
      </div>
      <div className="stats">
        <div>
          <span>Đề xuất gần đây</span>
          <b>{rows.length}</b>
          <small>Trong danh sách mới nhất</small>
        </div>
        <div>
          <span>Đang chờ duyệt</span>
          <b>{pending}</b>
          <small>Cần được xử lý</small>
        </div>
        <div className="dark">
          <span>Quy trình</span>
          <b>6</b>
          <small>Vai trò được phân quyền</small>
        </div>
      </div>
      <Card
        title="Đề xuất gần đây"
        action={<Link to="/requests">Xem tất cả →</Link>}
      >
        <RequestTable rows={rows} />
      </Card>
    </>
  );
}
