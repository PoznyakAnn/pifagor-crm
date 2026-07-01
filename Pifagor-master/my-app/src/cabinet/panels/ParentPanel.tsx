import { useEffect, useState } from "react";
import {
  createComment,
  fetchComments,
  fetchParentContracts,
  fetchPayments,
  fetchReports,
  uploadParentSignedContract,
} from "../../api/cabinet";
import { fetchLessons } from "../../api/lessons";
import type { ApiComment, ApiParentContract, ApiPayment, ApiReport, ApiUser } from "../../api/types";
import { useCabinet } from "../context";
import {
  CabinetAlert,
  CabinetBadge,
  CabinetButton,
  CabinetCard,
  CabinetLoading,
  CabinetTabs,
  ReportCard,
  StatGrid,
} from "../components/Ui";
import { ScheduleSection } from "../components/ScheduleSection";

const TABS = [
  { id: "schedule", label: "Расписание" },
  { id: "payments", label: "Оплаты" },
  { id: "reports", label: "Отчёты" },
  { id: "contract", label: "Договор" },
  { id: "comments", label: "Комментарии" },
];

export function ParentPanel({ user }: { user: ApiUser }) {
  const { toast } = useCabinet();
  const [tab, setTab] = useState("schedule");
  const [month, setMonth] = useState(() => new Date());
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [contracts, setContracts] = useState<ApiParentContract[]>([]);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    try {
      setPayments(await fetchPayments());
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      setReports(await fetchReports());
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContract = async () => {
    setLoading(true);
    try {
      setContracts(await fetchParentContracts());
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    setLoading(true);
    try {
      setComments(await fetchComments());
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "payments") loadPayments();
    if (tab === "reports") loadReports();
    if (tab === "contract") loadContract();
    if (tab === "comments") loadComments();
  }, [tab]);

  const paid = payments.filter((p) => p.is_paid).length;
  const unpaid = payments.filter((p) => !p.is_paid).length;
  const debt = payments.filter((p) => !p.is_paid).reduce((s, p) => s + p.amount, 0);

  const sendComment = async () => {
    if (!commentText.trim()) {
      toast("Введите текст комментария", "error");
      return;
    }
    try {
      const lessons = await fetchLessons();
      const lesson = lessons[0];
      if (!lesson) {
        toast("Нет занятий для отправки комментария", "error");
        return;
      }
      await createComment({
        text: commentText.trim(),
        tutor_id: lesson.tutor_id,
        child_id: lesson.child_id,
      });
      setCommentText("");
      toast("Комментарий отправлен");
      await loadComments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    }
  };

  const contract = contracts[0];

  return (
    <>
      <CabinetTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "schedule" && (
        <ScheduleSection
          user={user}
          month={month}
          onMonthChange={(dir) =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() + dir, 1))
          }
          title="Занятия ребёнка"
        />
      )}

      {tab === "payments" && (
        <CabinetCard>
          {loading ? <CabinetLoading /> : (
            <>
              <StatGrid
                items={[
                  { value: paid, label: "Оплачено занятий" },
                  { value: unpaid, label: "Не оплачено" },
                  { value: `${debt.toFixed(2)} BYN`, label: "Задолженность" },
                ]}
              />
              <CabinetAlert>
                Оплата производится лично. Чеки отправляйте на <strong>pay@pifagor.by</strong>.
              </CabinetAlert>
              <h4 className="text-h3">История оплат</h4>
              {payments.length === 0 ? (
                <div className="cabinet-muted">Платежей пока нет</div>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="cabinet-payment-row">
                    <div>
                      <div className="cabinet-person-card__name">{(p.created_at || "").slice(0, 10)}</div>
                      <div className="cabinet-person-card__email">{p.description ?? "—"}</div>
                    </div>
                    <div className="cabinet-inline-actions">
                      <CabinetBadge variant="green">{p.amount} BYN</CabinetBadge>
                      <CabinetBadge variant={p.is_paid ? "green" : "amber"}>
                        {p.is_paid ? "Оплачено" : "Ожидает"}
                      </CabinetBadge>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </CabinetCard>
      )}

      {tab === "reports" && (
        loading ? <CabinetLoading /> : reports.length === 0 ? (
          <div className="cabinet-empty">Отчётов пока нет</div>
        ) : (
          reports.map((r) => (
            <ReportCard
              key={r.id}
              lessonCount={r.lesson_count}
              date={r.created_at}
              student={r.student_name}
              content={r.content}
            />
          ))
        )
      )}

      {tab === "contract" && (
        <CabinetCard title="Договор об оказании услуг">
          {loading ? <CabinetLoading /> : !contract ? (
            <div className="cabinet-muted">Договор не загружен администратором</div>
          ) : (
            <div className="cabinet-inline-actions">
              <div>
                <div className="cabinet-person-card__name">Договор (загружен)</div>
                <div className="cabinet-person-card__email">
                  от {(contract.created_at || "").slice(0, 10)} ·
                  <CabinetBadge variant={contract.is_signed ? "green" : "amber"}>
                    {contract.is_signed ? "Подписан" : "Ожидает подписи"}
                  </CabinetBadge>
                </div>
              </div>
              <div className="cabinet-inline-actions">
                <CabinetButton size="sm" onClick={() => window.open(contract.file_url, "_blank")}>
                  ↓ Скачать
                </CabinetButton>
                {!contract.is_signed && (
                  <label className="cabinet-btn cabinet-btn--success cabinet-btn--sm">
                    ↑ Загрузить подписанный
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.png"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          await uploadParentSignedContract(contract.id, f);
                          toast("Договор загружен");
                          await loadContract();
                        } catch (err) {
                          toast(err instanceof Error ? err.message : "Ошибка", "error");
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </CabinetCard>
      )}

      {tab === "comments" && (
        <>
          <CabinetCard title="Написать комментарий репетитору">
            <textarea
              className="cabinet-input cabinet-input--textarea"
              rows={4}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ваш комментарий репетитору..."
            />
            <CabinetButton variant="primary" onClick={sendComment}>Отправить</CabinetButton>
          </CabinetCard>
          <CabinetCard title="История комментариев">
            {loading ? <CabinetLoading /> : comments.length === 0 ? (
              <div className="cabinet-muted">Комментариев нет</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="cabinet-comment-item">
                  <div className="cabinet-muted">{(c.created_at || "").slice(0, 10)}</div>
                  <div>{c.text}</div>
                </div>
              ))
            )}
          </CabinetCard>
        </>
      )}
    </>
  );
}
