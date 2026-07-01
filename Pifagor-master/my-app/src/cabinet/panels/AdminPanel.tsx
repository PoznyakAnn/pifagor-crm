import { useEffect, useState } from "react";
import {
  createInviteCodes,
  fetchAdminTutors,
  fetchAllUsers,
  fetchFinanceReport,
  fetchInviteCodes,
  fetchReceipts,
  parseEmails,
} from "../../api/admin";
import { fetchSubjects } from "../../api/public";
import type { ApiSubject, ApiTutor, InviteCode, ApiUser } from "../../api/types";
import { filterAllowedSubjects } from "../../utils/subjects";
import { useCabinet } from "../context";
import { fullName, ROLE_LABELS, roleBadgeClass } from "../utils";
import {
  CabinetAlert,
  CabinetBadge,
  CabinetButton,
  CabinetCard,
  CabinetLoading,
  CabinetTable,
  CabinetTabs,
  Field,
  PersonCard,
} from "../components/Ui";
import { AdminTutorEditor } from "../components/AdminTutorEditor";
import { ScheduleSection } from "../components/ScheduleSection";

const TABS = [
  { id: "codes", label: "Коды доступа" },
  { id: "users", label: "Пользователи" },
  { id: "schedule", label: "Расписание" },
  { id: "tutors", label: "Репетиторы" },
  { id: "students", label: "Ученики" },
  { id: "payments", label: "Оплаты" },
];

export function AdminPanel({ user }: { user: ApiUser }) {
  const { toast } = useCabinet();
  const [tab, setTab] = useState("codes");
  const [month, setMonth] = useState(() => new Date());

  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [finance, setFinance] = useState<Awaited<ReturnType<typeof fetchFinanceReport>>>([]);
  const [receipts, setReceipts] = useState<Awaited<ReturnType<typeof fetchReceipts>>>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [adminTutors, setAdminTutors] = useState<ApiTutor[]>([]);
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [loadingTutors, setLoadingTutors] = useState(false);

  const [codeType, setCodeType] = useState("tutor");
  const [codeDesc, setCodeDesc] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<InviteCode[] | null>(null);
  const [parseMessage, setParseMessage] = useState("");

  const loadCodes = async () => {
    setLoadingCodes(true);
    try {
      setCodes(await fetchInviteCodes());
    } catch (err) {
      setCodes([]);
      toast(err instanceof Error ? err.message : "Не удалось загрузить коды", "error");
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      setUsers(await fetchAllUsers());
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const [report, rcpts] = await Promise.all([fetchFinanceReport(), fetchReceipts()]);
      setFinance(report);
      setReceipts(rcpts);
    } catch {
      setFinance([]);
      setReceipts([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadTutors = async () => {
    setLoadingTutors(true);
    try {
      const [tutorList, subjectList] = await Promise.all([
        fetchAdminTutors(),
        fetchSubjects(),
      ]);
      setAdminTutors(tutorList);
      setSubjects(filterAllowedSubjects(subjectList));
    } catch {
      setAdminTutors([]);
      setSubjects([]);
    } finally {
      setLoadingTutors(false);
    }
  };

  useEffect(() => {
    loadCodes();
    loadUsers();
  }, []);

  useEffect(() => {
    if (tab === "payments") loadPayments();
  }, [tab]);

  useEffect(() => {
    if (tab === "tutors") loadTutors();
  }, [tab]);

  const handleGenerate = async () => {
    try {
      const res = await createInviteCodes({ role: codeType, description: codeDesc.trim() });
      setGeneratedCodes(res);
      toast("Коды созданы");
      await loadCodes();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка генерации", "error");
    }
  };

  const handleParseEmails = async () => {
    setParseMessage("Проверяем почту...");
    try {
      const res = await parseEmails();
      setParseMessage(res.message);
      await loadPayments();
    } catch (err) {
      setParseMessage(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const students = users.filter((u) => u.role === "child");

  const handleTutorUpdated = (updated: ApiTutor) => {
    setAdminTutors((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    toast("Профиль репетитора сохранён");
  };

  const handleTutorDeleted = (tutorId: number) => {
    setAdminTutors((prev) => prev.filter((t) => t.id !== tutorId));
    toast("Репетитор удалён");
  };

  return (
    <>
      <CabinetTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "codes" && (
        <>
          <CabinetCard title="Создать коды доступа">
            <CabinetAlert>
              Для репетитора — 1 код. Для ученика — пара кодов: ученик и родитель.
            </CabinetAlert>
            <div className="cabinet-grid-2">
              <Field label="Тип">
                <select className="cabinet-input" value={codeType} onChange={(e) => setCodeType(e.target.value)}>
                  <option value="tutor">Репетитор</option>
                  <option value="student_parent">Ученик + Родитель (пара)</option>
                </select>
              </Field>
              <Field label="Описание (кому)">
                <input
                  className="cabinet-input"
                  value={codeDesc}
                  onChange={(e) => setCodeDesc(e.target.value)}
                  placeholder="Напр: Иван Будько"
                />
              </Field>
            </div>
            <CabinetButton variant="primary" onClick={handleGenerate}>Сгенерировать</CabinetButton>
            {generatedCodes && (
              <div className="cabinet-generated-codes">
                {generatedCodes.map((c) => (
                  <div key={c.id} className="cabinet-code-box">
                    <span>{ROLE_LABELS[c.role]}</span>
                    <code>{c.code}</code>
                    <CabinetButton size="sm" onClick={() => navigator.clipboard.writeText(c.code)}>
                      Копировать
                    </CabinetButton>
                  </div>
                ))}
              </div>
            )}
          </CabinetCard>

          <CabinetCard title="Существующие коды">
            {loadingCodes ? <CabinetLoading /> : (
              <CabinetTable
                headers={["Код", "Роль", "Описание", "Создан", "Статус"]}
                rows={codes.map((c) => [
                  <code>{c.code}</code>,
                  <CabinetBadge variant={roleBadgeClass(c.role).replace("cabinet-badge--", "")}>
                    {ROLE_LABELS[c.role]}
                  </CabinetBadge>,
                  c.description ?? "—",
                  (c.created_at || "").slice(0, 10),
                  <CabinetBadge variant={c.is_used ? "gray" : "green"}>
                    {c.is_used ? "Использован" : "Активен"}
                  </CabinetBadge>,
                ])}
              />
            )}
          </CabinetCard>
        </>
      )}

      {tab === "users" && (
        <CabinetCard title="Все пользователи системы">
          {loadingUsers ? <CabinetLoading /> : (
            <CabinetTable
              headers={["ФИО", "Email", "Роль"]}
              rows={users.map((u) => [
                fullName(u.first_name, u.last_name),
                u.email,
                <CabinetBadge variant={roleBadgeClass(u.role).replace("cabinet-badge--", "")}>
                  {ROLE_LABELS[u.role]}
                </CabinetBadge>,
              ])}
            />
          )}
        </CabinetCard>
      )}

      {tab === "schedule" && (
        <ScheduleSection
          user={user}
          month={month}
          onMonthChange={(dir) =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() + dir, 1))
          }
          showTutorStudent
          canAddLesson
          title="Список занятий"
        />
      )}

      {tab === "tutors" && (
        <>
          <CabinetAlert>
            Чтобы добавить нового репетитора: создайте код доступа → отправьте репетитору →
            после регистрации заполните профиль, назначьте предметы и включите публикацию.
          </CabinetAlert>
          <div className="cabinet-stack">
            {loadingTutors ? (
              <CabinetLoading />
            ) : adminTutors.length === 0 ? (
              <div className="cabinet-empty">Репетиторов пока нет</div>
            ) : (
              adminTutors.map((t) => (
                <AdminTutorEditor
                  key={t.id}
                  tutor={t}
                  subjects={subjects}
                  onUpdated={handleTutorUpdated}
                  onDeleted={handleTutorDeleted}
                />
              ))
            )}
          </div>
        </>
      )}

      {tab === "students" && (
        <div className="cabinet-stack">
          {loadingUsers ? <CabinetLoading /> : students.map((s) => (
            <PersonCard
              key={s.id}
              name={fullName(s.first_name, s.last_name)}
              email={s.email}
              badge={<CabinetBadge variant="green">Ученик</CabinetBadge>}
            />
          ))}
        </div>
      )}

      {tab === "payments" && (
        <>
          <CabinetCard
            title="Финансовый отчёт (из чеков EasyPay)"
            actions={
              <div className="cabinet-inline-actions">
                <CabinetButton size="sm" onClick={handleParseEmails}>Проверить почту</CabinetButton>
                <CabinetButton size="sm" variant="primary" onClick={loadPayments}>Обновить</CabinetButton>
              </div>
            }
          >
            {parseMessage && <CabinetAlert variant="success">{parseMessage}</CabinetAlert>}
            {loadingPayments ? <CabinetLoading /> : (
              <CabinetTable
                headers={["Ученик", "Проведено", "Оплачено", "Сумма"]}
                rows={finance.map((r) => [
                  r.student_name,
                  r.lessons_conducted,
                  <CabinetBadge variant={r.lessons_paid >= r.lessons_conducted ? "green" : "amber"}>
                    {r.lessons_paid}/{r.lessons_conducted}
                  </CabinetBadge>,
                  `${r.amount_paid} BYN`,
                ])}
              />
            )}
          </CabinetCard>
          <CabinetCard title="Все чеки">
            {loadingPayments ? <CabinetLoading /> : (
              <CabinetTable
                headers={["Дата", "Плательщик", "Ученик", "Сумма", "Номер чека"]}
                rows={receipts.map((r) => [
                  (r.payment_date || r.created_at || "").slice(0, 10),
                  r.payer_name,
                  r.student_name ?? "не сопоставлен",
                  `${r.amount} BYN`,
                  r.receipt_number ?? "—",
                ])}
              />
            )}
          </CabinetCard>
        </>
      )}
    </>
  );
}
