import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2,
  Clock3, GraduationCap, MapPin, Users, UserRound, X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
type Day = (typeof weekdays)[number];
type Availability = { start: string; end: string };
type WeeklySchedule = Record<Day, Availability | null>;
const STORAGE_ADVISOR = 'campusconnect-advisor-availability';
const STORAGE_TUTOR = 'campusconnect-tutor-availability';
const defaultAdvisor: WeeklySchedule = {
  Monday: { start: '09:00', end: '11:00' },
  Tuesday: null,
  Wednesday: { start: '13:00', end: '15:00' },
  Thursday: null,
  Friday: { start: '10:00', end: '12:00' },
};
const defaultTutor: WeeklySchedule = {
  Monday: { start: '14:00', end: '17:00' },
  Tuesday: { start: '10:00', end: '12:30' },
  Wednesday: null,
  Thursday: { start: '15:00', end: '18:00' },
  Friday: null,
};
const appointments: { day: Day; start: string; end: string; student: string; topic: string }[] = [
  { day: 'Tuesday', start: '10:30', end: '11:00', student: 'Maya Chen', topic: 'Course planning' },
  { day: 'Thursday', start: '13:00', end: '13:30', student: 'Jordan Lee', topic: 'Transfer credits' },
];

function loadSchedule(key: string, fallback: WeeklySchedule): WeeklySchedule {
  try {
    const stored = localStorage.getItem(key);
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
  } catch {
    return fallback;
  }
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const items = [
    { href: '/', text: 'Home', active: location === '/' },
    { href: '/advisor', text: 'Advisor', active: location.startsWith('/advisor') },
    { href: '/tutor', text: 'Student tutor', active: location.startsWith('/tutor') },
  ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/" className="brand" data-testid="link-campusconnect-home">
          <span className="brand-mark"><GraduationCap size={20} strokeWidth={2.2} /></span>
          <span>CampusConnect</span>
        </Link>
        <nav className="topnav" aria-label="Main navigation">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link${item.active ? ' active' : ''}`} data-testid={`link-nav-${item.text.toLowerCase().replace(' ', '-')}`}>
              {item.text}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}

function Home() {
  return (
    <AppShell>
      <main className="page-wrap">
        <section className="welcome-band">
          <div className="welcome-kicker">Northfield University · Student support</div>
          <h1>Your campus, in sync.</h1>
          <p>A clear place to share office hours, find tutoring time, and make the week easier to plan.</p>
        </section>
        <div className="section-label">Choose your workspace</div>
        <div className="role-grid">
          <Link href="/advisor" className="role-card" data-testid="link-advisor-dashboard">
            <div>
              <div className="role-icon"><UserRound size={22} /></div>
              <h2>Advisor dashboard</h2>
              <p>Set dependable office hours and keep student appointments in view.</p>
            </div>
            <span className="card-arrow">Open workspace <ArrowRight size={16} /></span>
          </Link>
          <Link href="/tutor" className="role-card" data-testid="link-tutor-dashboard">
            <div>
              <div className="role-icon"><BookOpen size={22} /></div>
              <h2>Student tutor dashboard</h2>
              <p>Share the times you can tutor, one weekday at a time.</p>
            </div>
            <span className="card-arrow">Open workspace <ArrowRight size={16} /></span>
          </Link>
        </div>
        <div className="dashboard-grid">
          <section className="panel panel-pad" aria-labelledby="campus-note-heading">
            <h2 className="panel-title" id="campus-note-heading">A little more room in your week</h2>
            <p className="panel-desc">CampusConnect keeps availability simple, visible, and easy to update.</p>
            <div className="schedule-row">
              <div className="date-block"><CalendarDays size={18} /></div>
              <div className="row-main"><strong>One shared weekly rhythm</strong><span>Choose weekdays and set hours that work for you.</span></div>
            </div>
            <div className="schedule-row">
              <div className="date-block"><Clock3 size={18} /></div>
              <div className="row-main"><strong>Clear time boundaries</strong><span>Appointment conflicts are caught before office hours are saved.</span></div>
            </div>
          </section>
          <aside className="panel action-panel">
            <h2 className="panel-title">Getting started</h2>
            <p className="panel-desc">Choose a role above, then manage your availability from the dashboard.</p>
            <Link href="/advisor" className="btn-primary" data-testid="button-home-advisor">Visit advisor workspace <ArrowRight size={16} /></Link>
            <Link href="/tutor" className="btn-secondary" style={{ width: '100%', marginTop: 9 }} data-testid="button-home-tutor">Visit tutor workspace <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div><div className="eyebrow">{eyebrow}</div><h1 className="page-heading">{title}</h1><p className="subheading">{description}</p></div>;
}

function AdvisorDashboard() {
  const [schedule] = useState(() => loadSchedule(STORAGE_ADVISOR, defaultAdvisor));
  return (
    <AppShell>
      <main className="page-wrap">
        <PageHeading eyebrow="Advisor workspace · Northfield University" title="Good morning, Alex." description="Your office hours and student appointments, all in one clear view." />
        <div className="dashboard-grid">
          <section className="panel panel-pad">
            <h2 className="panel-title">This week at a glance</h2>
            <p className="panel-desc">Your office hours and upcoming student meetings.</p>
            <div className="week-list">
              {weekdays.map((day) => {
                const available = schedule[day];
                const dayAppointments = appointments.filter((item) => item.day === day);
                return (
                  <div className="week-row" key={day} data-testid={`row-advisor-${day.toLowerCase()}`}>
                    <span className="week-day">{day.slice(0, 3)}</span>
                    <span className="week-time">{available ? `${formatTime(available.start)} – ${formatTime(available.end)}` : dayAppointments.length ? 'Appointments only' : 'No office hours'}</span>
                    <span className={`week-tag${available ? '' : ' off'}`}>{available ? 'Office hours' : dayAppointments.length ? `${dayAppointments.length} meeting` : 'Open'}</span>
                  </div>
                );
              })}
            </div>
            {appointments.map((appointment) => (
              <div className="schedule-row" key={`${appointment.day}-${appointment.start}`}>
                <div className="date-block"><span>{appointment.day.slice(0, 3)}</span><strong>{formatTime(appointment.start).split(':')[0]}</strong></div>
                <div className="row-main"><strong>{appointment.student} · {appointment.topic}</strong><span>{appointment.day}, {formatTime(appointment.start)}–{formatTime(appointment.end)}</span></div>
                <span className="status-pill">Confirmed</span>
              </div>
            ))}
          </section>
          <aside className="panel action-panel">
            <div className="role-icon"><CalendarDays size={22} /></div>
            <h2 className="panel-title">Manage your availability</h2>
            <p className="panel-desc">Choose a weekday and set office hours. We’ll flag any time that overlaps a student appointment.</p>
            <Link href="/advisor/availability" className="btn-primary" data-testid="button-manage-advisor-availability">Manage Availability <ArrowRight size={16} /></Link>
            <div className="notice notice-info"><Clock3 size={16} />{appointments.length} student appointments already on your calendar.</div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function AdvisorAvailability() {
  const [schedule, setSchedule] = useState(() => loadSchedule(STORAGE_ADVISOR, defaultAdvisor));
  const [day, setDay] = useState<Day>('Monday');
  const initial = schedule.Monday ?? { start: '09:00', end: '11:00' };
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [conflict, setConflict] = useState('');
  const [saved, setSaved] = useState<Availability | null>(null);
  useEffect(() => { localStorage.setItem(STORAGE_ADVISOR, JSON.stringify(schedule)); }, [schedule]);
  function chooseDay(nextDay: Day) {
    setDay(nextDay);
    setConflict('');
    setSaved(null);
    const current = schedule[nextDay] ?? { start: '09:00', end: '11:00' };
    setStart(current.start);
    setEnd(current.end);
  }
  function save() {
    if (toMinutes(end) <= toMinutes(start)) {
      setConflict('End time must be later than start time.');
      setSaved(null);
      return;
    }
    const overlap = appointments.find((appointment) => appointment.day === day && toMinutes(start) < toMinutes(appointment.end) && toMinutes(end) > toMinutes(appointment.start));
    if (overlap) {
      setConflict(`This range overlaps your appointment with ${overlap.student} on ${overlap.day}, ${formatTime(overlap.start)}–${formatTime(overlap.end)}.`);
      setSaved(null);
      return;
    }
    const updated = { start, end };
    setSchedule((current) => ({ ...current, [day]: updated }));
    setConflict('');
    setSaved(updated);
  }
  if (saved && !conflict) {
    return (
      <AppShell>
        <main className="page-wrap">
          <div className="crumbs"><Link href="/advisor">Advisor dashboard</Link><span>/</span><span>Availability saved</span></div>
          <section className="panel success-card" aria-labelledby="advisor-success-heading">
            <div className="success-symbol"><CheckCircle2 size={25} /></div>
            <div className="eyebrow">Availability updated</div>
            <h1 id="advisor-success-heading">Office hours saved</h1>
            <p>Students can now see your updated office hours. Your existing appointments remain protected.</p>
            <div className="success-detail" data-testid="text-advisor-saved-hours">{day} · {formatTime(saved.start)}–{formatTime(saved.end)}</div>
            <div className="success-actions">
              <button type="button" className="btn-secondary" onClick={() => setSaved(null)} data-testid="button-edit-advisor-availability"><ArrowLeft size={15} />Edit availability</button>
              <Link href="/advisor" className="btn-primary" data-testid="link-advisor-dashboard"><ArrowRight size={15} />Back to dashboard</Link>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <main className="page-wrap">
        <div className="crumbs"><Link href="/advisor">Advisor dashboard</Link><span>/</span><span>Manage availability</span></div>
        <PageHeading eyebrow="Advisor workspace" title="Manage availability" description="Choose the day and hours students can meet with you. Existing appointments stay protected." />
        <div className="form-layout">
          <section className="panel form-card" aria-labelledby="advisor-form-heading">
            <h2 className="panel-title" id="advisor-form-heading">Set office hours</h2>
            <p className="panel-desc">Availability applies to one weekday at a time.</p>
            <label className="field-label" style={{ marginTop: 24 }}>Weekday</label>
            <div className="day-grid" role="group" aria-label="Choose a weekday">
              {weekdays.map((weekday) => <button key={weekday} type="button" className={`day-button${day === weekday ? ' selected' : ''}`} aria-pressed={day === weekday} onClick={() => chooseDay(weekday)} data-testid={`button-advisor-day-${weekday.toLowerCase()}`}>{weekday.slice(0, 3)}</button>)}
            </div>
            <div className="time-grid">
              <div className="field"><label className="field-label" htmlFor="advisor-start">Start time</label><input id="advisor-start" type="time" value={start} onChange={(event) => { setStart(event.target.value); setConflict(''); setSaved(null); }} data-testid="input-advisor-start" /></div>
              <div className="field"><label className="field-label" htmlFor="advisor-end">End time</label><input id="advisor-end" type="time" value={end} onChange={(event) => { setEnd(event.target.value); setConflict(''); setSaved(null); }} data-testid="input-advisor-end" /></div>
            </div>
            <p className="helper-note">Appointments on this weekday are checked automatically before saving.</p>
            {conflict && <div className="notice notice-error" role="alert"><X size={17} />{conflict}</div>}
            {saved && <div className="notice notice-success" role="status"><CheckCircle2 size={17} />Office hours saved for {day}, {formatTime(saved.start)}–{formatTime(saved.end)}.</div>}
            <div className="form-actions">
              <button type="button" onClick={save} className="btn-primary" data-testid="button-save-advisor-availability"><Check size={16} />Save office hours</button>
              <Link href="/advisor" className="btn-secondary" data-testid="link-back-advisor"><ArrowLeft size={15} />Back to dashboard</Link>
            </div>
          </section>
          <aside className="panel side-panel">
            <h2 className="panel-title">Appointments to keep in mind</h2>
            <p className="panel-desc">These confirmed meetings will be checked for overlap.</p>
            {appointments.map((appointment) => <div className="appointment" key={`${appointment.day}${appointment.start}`}><strong>{appointment.day} · {formatTime(appointment.start)}–{formatTime(appointment.end)}</strong><span>{appointment.student} · {appointment.topic}</span></div>)}
            <div className="notice notice-info"><MapPin size={16} />Office hours meet at Hawthorne Hall, Room 214.</div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function TutorDashboard() {
  const [schedule] = useState(() => loadSchedule(STORAGE_TUTOR, defaultTutor));
  const activeDays = weekdays.filter((day) => schedule[day]);
  return (
    <AppShell>
      <main className="page-wrap">
        <PageHeading eyebrow="Student tutor workspace · Northfield University" title="Make time for learning." description="Keep your tutoring hours current so classmates know when they can count on you." />
        <div className="dashboard-grid">
          <section className="panel panel-pad">
            <h2 className="panel-title">Your weekly availability</h2>
            <p className="panel-desc">{activeDays.length} {activeDays.length === 1 ? 'day' : 'days'} available this week</p>
            {weekdays.map((day) => (
              <div className="schedule-row" key={day} data-testid={`row-tutor-${day.toLowerCase()}`}>
                <div className="date-block"><span>{day.slice(0, 3)}</span><CalendarDays size={17} /></div>
                <div className="row-main"><strong>{day}</strong><span>{schedule[day] ? `${formatTime(schedule[day]!.start)} – ${formatTime(schedule[day]!.end)}` : 'No tutoring hours set'}</span></div>
                <span className={`week-tag${schedule[day] ? '' : ' off'}`}>{schedule[day] ? 'Available' : 'Not set'}</span>
              </div>
            ))}
          </section>
          <aside className="panel action-panel">
            <div className="role-icon"><BookOpen size={22} /></div>
            <h2 className="panel-title">Manage tutoring availability</h2>
            <p className="panel-desc">Select weekdays, adjust your hours, and save a schedule that fits around classes.</p>
            <Link href="/tutor/availability" className="btn-primary" data-testid="button-manage-tutor-availability">Manage Tutoring Availability <ArrowRight size={16} /></Link>
            <div className="notice notice-info"><Users size={16} />Your schedule helps classmates plan ahead.</div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function TutorAvailability() {
  const [schedule, setSchedule] = useState(() => loadSchedule(STORAGE_TUTOR, defaultTutor));
  const [day, setDay] = useState<Day>('Monday');
  const [enabled, setEnabled] = useState(Boolean(schedule.Monday));
  const [start, setStart] = useState(schedule.Monday?.start ?? '14:00');
  const [end, setEnd] = useState(schedule.Monday?.end ?? '17:00');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const invalidRange = enabled && toMinutes(end) <= toMinutes(start);
  useEffect(() => { localStorage.setItem(STORAGE_TUTOR, JSON.stringify(schedule)); }, [schedule]);
  function chooseDay(nextDay: Day) {
    setDay(nextDay);
    const availability = schedule[nextDay];
    setEnabled(Boolean(availability));
    setStart(availability?.start ?? '14:00');
    setEnd(availability?.end ?? '17:00');
    setError('');
    setSaved(false);
  }
  function save() {
    if (invalidRange) {
      setError('End time must be later than start time.');
      setSaved(false);
      return;
    }
    setSchedule((current) => ({ ...current, [day]: enabled ? { start, end } : null }));
    setError('');
    setSaved(true);
  }
  if (saved) {
    const updated = schedule[day];
    return (
      <AppShell>
        <main className="page-wrap">
          <div className="crumbs"><Link href="/tutor">Student tutor dashboard</Link><span>/</span><span>Availability saved</span></div>
          <section className="panel success-card" aria-labelledby="tutor-success-heading">
            <div className="success-symbol"><CheckCircle2 size={25} /></div>
            <div className="eyebrow">Weekly schedule updated</div>
            <h1 id="tutor-success-heading">Availability saved</h1>
            <p>Your tutoring schedule has been updated and is ready for classmates to view.</p>
            <div className="success-detail" data-testid="text-tutor-saved-hours">{updated ? `${day} · ${formatTime(updated.start)}–${formatTime(updated.end)}` : `${day} · Not available`}</div>
            <div className="success-actions">
              <button type="button" className="btn-secondary" onClick={() => setSaved(false)} data-testid="button-edit-tutor-availability"><ArrowLeft size={15} />Edit availability</button>
              <Link href="/tutor" className="btn-primary" data-testid="link-tutor-dashboard"><ArrowRight size={15} />Back to dashboard</Link>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <main className="page-wrap">
        <div className="crumbs"><Link href="/tutor">Student tutor dashboard</Link><span>/</span><span>Manage availability</span></div>
        <PageHeading eyebrow="Student tutor workspace" title="Shape your tutoring week." description="Choose which weekdays you’re available and set a time range for each." />
        <div className="form-layout">
          <section className="panel form-card" aria-labelledby="tutor-form-heading">
            <h2 className="panel-title" id="tutor-form-heading">Edit weekday availability</h2>
            <p className="panel-desc">Choose a day to view or update its schedule.</p>
            <label className="field-label" style={{ marginTop: 24 }}>Weekday</label>
            <div className="day-grid" role="group" aria-label="Choose a weekday">
              {weekdays.map((weekday) => <button key={weekday} type="button" className={`day-button${day === weekday ? ' selected' : ''}`} aria-pressed={day === weekday} onClick={() => chooseDay(weekday)} data-testid={`button-tutor-day-${weekday.toLowerCase()}`}>{weekday.slice(0, 3)}</button>)}
            </div>
            <label className="field-label" htmlFor="tutor-available">Availability for {day}</label>
            <select id="tutor-available" value={enabled ? 'available' : 'unavailable'} onChange={(event) => { setEnabled(event.target.value === 'available'); setSaved(false); setError(''); }} data-testid="select-tutor-availability">
              <option value="available">Available for tutoring</option>
              <option value="unavailable">Not available</option>
            </select>
            {enabled && <div className="time-grid" style={{ marginTop: 18 }}>
              <div className="field"><label className="field-label" htmlFor="tutor-start">Start time</label><input id="tutor-start" type="time" value={start} onChange={(event) => { setStart(event.target.value); setSaved(false); setError(''); }} data-testid="input-tutor-start" /></div>
              <div className="field"><label className="field-label" htmlFor="tutor-end">End time</label><input id="tutor-end" type="time" value={end} onChange={(event) => { setEnd(event.target.value); setSaved(false); setError(''); }} data-testid="input-tutor-end" /></div>
            </div>}
            {!enabled && <p className="helper-note">This weekday will be shown as unavailable to classmates.</p>}
            {(invalidRange || error) && <div className="notice notice-error" role="alert">{invalidRange ? 'End time must be later than start time.' : error}</div>}
            {saved && <div className="notice notice-success" role="status"><CheckCircle2 size={17} />{enabled ? `Availability saved for ${day}, ${formatTime(start)}–${formatTime(end)}.` : `${day} marked as unavailable.`}</div>}
            <div className="form-actions">
              <button type="button" onClick={save} disabled={invalidRange} className={`btn-primary${invalidRange ? ' save-disabled' : ''}`} data-testid="button-save-tutor-availability"><Check size={16} />Save Availability</button>
              <Link href="/tutor" className="btn-secondary" data-testid="link-back-tutor"><ArrowLeft size={15} />Back to dashboard</Link>
            </div>
          </section>
          <aside className="panel side-panel">
            <h2 className="panel-title">Your current week</h2>
            <p className="panel-desc">Saved tutoring hours, weekday by weekday.</p>
            <div className="week-list">
              {weekdays.map((weekday) => <div className="week-row" key={weekday} data-testid={`summary-tutor-${weekday.toLowerCase()}`}><span className="week-day">{weekday.slice(0, 3)}</span><span className="week-time">{schedule[weekday] ? `${formatTime(schedule[weekday]!.start)}–${formatTime(schedule[weekday]!.end)}` : 'Not available'}</span><span className={`week-tag${schedule[weekday] ? '' : ' off'}`}>{schedule[weekday] ? 'Set' : 'Off'}</span></div>)}
            </div>
            <div className="notice notice-info"><Clock3 size={16} />Changes are saved on this device and stay after refresh.</div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/advisor" component={AdvisorDashboard} />
      <Route path="/advisor/availability" component={AdvisorAvailability} />
      <Route path="/tutor" component={TutorDashboard} />
      <Route path="/tutor/availability" component={TutorAvailability} />
      <Route component={NotFound} />
    </Switch>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <RoutedErrorBoundary><Router /></RoutedErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
