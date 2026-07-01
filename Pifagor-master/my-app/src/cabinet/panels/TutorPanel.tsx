import { useEffect, useState } from "react";
import {
  downloadActBlankUrl,
  fetchActs,
  fetchReports,
  fetchTutorContracts,
  fetchTutorFinance,
  uploadTutorAct,
} from "../../api/cabinet";
import type { ApiAct, ApiReport, ApiTutor, ApiTutorContract, ApiUser } from "../../api/types";
import { fetchMyTutorProfile } from "../../api/users";
import { fetchTutorStudents } from "../../api/lessons";
import { useCabinet } from "../context";
import { fullName } from "../utils";
import {
  CabinetBadge,
  CabinetButton,
  CabinetCard,
  CabinetLoading,
  CabinetTabs,
  PersonCard,
  ReportCard,
  StatGrid,
} from "../components/Ui";
import { ReportModal } from "../components/ReportModal";
import { ScheduleSection } from "../components/ScheduleSection";
import { TutorProfileForm } from "../components/TutorProfileForm";

const TABS = [
  { id: "schedule", label: "Расписание" },
  { id: "students", label: "Ученики" },
  { id: "profile", label: "Профиль" },
  { id: "finance", label: "Финансы / Акт" },
];

export function TutorPanel({ user }: { user: ApiUser }) {
  const { toast } = useCabinet();
  const [tab, setTab] = useState("schedule");
  const [month, setMonth] = useState(() => new Date());
  const [students, setStudents] = useState<Awaited<ReturnType<typeof fetchTutorStudents>>>([]);
  const [finance, setFinance] = useState<Awaited<ReturnType<typeof fetchTutorFinance>> | null>(null);
  const [acts, setActs] = useState<ApiAct[]>([]);
  const [contracts, setContracts] = useState<ApiTutorContract[]>([]);
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [profile, setProfile] = useState<ApiTutor | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadFinance = async () => {
    setLoadingFinance(true);
    try {
      const [fin, actList, contractList, reportList] = await Promise.all([
        fetchTutorFinance().catch(() => null),
        fetchActs().catch(() => []),
        fetchTutorContracts().catch(() => []),
        fetchReports().catch(() => []),
      ]);
      setFinance(fin);
      setActs(actList);
      setContracts(contractList);
      setReports(reportList);
    } finally {
      setLoadingFinance(false);
    }
  };

  useEffect(() => {
    if (tab === "students") {
      fetchTutorStudents()
        .then(setStudents)
        .catch(() => setStudents([]));
    }
    if (tab === "finance") loadFinance();
    if (tab === "profile") {
      setLoadingProfile(true);
      fetchMyTutorProfile()
        .then(setProfile)
        .catch(() => setProfile(null))
        .finally(() => setLoadingProfile(false));
    }
  }, [tab]);

  const handleUploadAct = async (file: File) => {
    try {
      await uploadTutorAct(file);
      toast("Акт загружен");
      await loadFinance();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Не удалось загрузить", "error");
    }
  };

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
          canAddLesson
          title="Занятия в этом месяце"
        />
      )}

      {tab === "students" && (
        <div className="cabinet-stack">
          {students.length === 0 ? (
            <div className="cabinet-empty">У вас пока нет учеников</div>
          ) : (
            students.map((s) => (
              <PersonCard
                key={s.child_profile_id}
                name={fullName(s.first_name, s.last_name, s.email)}
                email={s.email}
                badge={<CabinetBadge variant="purple">Ученик</CabinetBadge>}
              />
            ))
          )}
        </div>
      )}

      {tab === "profile" && (
        <CabinetCard title="Профиль на сайте">
          {loadingProfile ? (
            <CabinetLoading />
          ) : profile ? (
            <>
              <div className="cabinet-inline-actions" style={{ marginBottom: 16 }}>
                <CabinetBadge variant={profile.is_published ? "green" : "gray"}>
                  {profile.is_published ? "Опубликован" : "Не опубликован"}
                </CabinetBadge>
                {profile.subjects.length > 0 && profile.subjects.map((s) => (
                  <CabinetBadge key={s.id} variant="blue">{s.name}</CabinetBadge>
                ))}
              </div>
              <TutorProfileForm
                mode="view"
                tutor={profile}
                subjects={[]}
              />
            </>
          ) : (
            <div className="cabinet-empty">Не удалось загрузить профиль</div>
          )}
        </CabinetCard>
      )}

      {tab === "finance" && (
        <>
          {loadingFinance ? <CabinetLoading /> : (
            <>
              <StatGrid
                items={[
                  { value: finance?.lessons_done ?? "—", label: "Занятий проведено" },
                  { value: finance ? `${finance.earnings} BYN` : "—", label: "К получению" },
                  { value: finance?.acts_count ?? "—", label: "Актов загружено" },
                ]}
              />

              <CabinetCard title="Акт выполненных работ">
                <p className="cabinet-muted">Скачайте пустой акт, подпишите и загрузите обратно</p>
                <div className="cabinet-inline-actions">
                  <CabinetButton onClick={() => window.open(downloadActBlankUrl(), "_blank")}>
                    ↓ Скачать пустой акт
                  </CabinetButton>
                  <label className="cabinet-btn cabinet-btn--success cabinet-btn--sm">
                    ↑ Загрузить подписанный
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadAct(f);
                      }}
                    />
                  </label>
                </div>
                <div className="cabinet-stack cabinet-stack--sm">
                  {acts.map((a) => (
                    <div key={a.id} className="cabinet-person-card">
                      <div>
                        <div className="cabinet-person-card__name">
                          Акт {a.period_start?.slice(0, 10)} — {a.period_end?.slice(0, 10)}
                        </div>
                        <div className="cabinet-person-card__email">
                          {a.lessons_count} занятий · {a.total_amount} BYN
                        </div>
                      </div>
                      <CabinetBadge variant={a.signed_url ? "green" : "amber"}>
                        {a.signed_url ? "Загружен" : "Без подписи"}
                      </CabinetBadge>
                    </div>
                  ))}
                </div>
              </CabinetCard>

              <CabinetCard title="Договор подряда">
                {contracts[0] ? (
                  <div className="cabinet-inline-actions">
                    <span>Договор от {(contracts[0].created_at || "").slice(0, 10)}</span>
                    <CabinetButton
                      size="sm"
                      onClick={() => window.open(contracts[0].file_url, "_blank")}
                    >
                      ↓ Скачать
                    </CabinetButton>
                  </div>
                ) : (
                  <div className="cabinet-muted">Договор не загружен администратором</div>
                )}
              </CabinetCard>

              <CabinetCard
                title="Мои отчёты"
                actions={
                  <CabinetButton size="sm" variant="primary" onClick={() => setReportOpen(true)}>
                    + Создать отчёт
                  </CabinetButton>
                }
              >
                {reports.length === 0 ? (
                  <div className="cabinet-muted">Отчётов пока нет</div>
                ) : (
                  reports.map((r) => (
                    <ReportCard
                      key={r.id}
                      lessonCount={r.lesson_count}
                      date={r.created_at}
                      content={r.content}
                    />
                  ))
                )}
              </CabinetCard>
            </>
          )}
        </>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onCreated={loadFinance}
      />
    </>
  );
}
