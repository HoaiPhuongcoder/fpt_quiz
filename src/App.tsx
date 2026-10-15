import { useEffect } from 'react';
import { interceptAppLinks, routePath, useRoute, type Route } from './router';
import { useApp } from './store/appStore';
import { AppShell } from './components/AppShell';
import { Toaster } from './components/Toaster';
import { Home } from './screens/Home';
import { Study } from './screens/study/Study';
import { ExamSetup } from './screens/exam/ExamSetup';
import { Exam } from './screens/exam/Exam';
import { ExamResultScreen } from './screens/exam/ExamResult';
import { Library } from './screens/Library';
import { Search } from './screens/Search';
import { Profile } from './screens/Profile';
import { Settings } from './screens/settings/Settings';
import { replaceTo } from './store/nav';

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    // Task 11–14 thêm `case` cho từng màn hình vào đây.
    case 'study':
      return <Study />;
    case 'exam-setup':
      return <ExamSetup />;
    case 'exam':
      return <Exam />;
    case 'result':
      return <ExamResultScreen id={route.param} />;
    case 'library':
      return <Library />;
    case 'search':
      return <Search />;
    case 'profile':
      return <Profile />;
    case 'settings':
      return <Settings />;
    default:
      return <Home />;
  }
}

export function App() {
  const subjects = useApp((s) => s.subjects);
  const subject = useApp((s) => s.subject);
  const switchSubject = useApp((s) => s.switchSubject);
  const subjectIds = subjects.map((x) => x.id);
  const route = useRoute(subjectIds);
  const tick = useApp((s) => s.tick);
  const checkExamExpiry = useApp((s) => s.checkExamExpiry);

  useEffect(() => {
    const run = () => {
      tick();
      const r = checkExamExpiry();
      if (r) replaceTo(`/ket-qua/${r.id}`);
    };
    run();
    const t = setInterval(run, 10_000);
    return () => clearInterval(t);
  }, [tick, checkExamExpiry]);

  const idsKey = subjectIds.join(',');
  useEffect(() => interceptAppLinks(idsKey.split(',')), [idsKey]);

  // URL quyết định môn; link cũ không có mã môn được đổi sang dạng có mã môn hiện tại.
  useEffect(() => {
    if (!route.subject) replaceTo(routePath(route));
    else if (route.subject !== subject.id) switchSubject(route.subject);
  }, [route, subject.id, switchSubject]);

  useEffect(() => {
    document.title = `Ôn ${subject.code}`;
  }, [subject.code]);

  const full = route.name === 'study' || route.name === 'exam';
  return (
    <>
      {full ? <Screen key={subject.id} route={route} /> : <AppShell active={route.name}><Screen key={subject.id} route={route} /></AppShell>}
      <Toaster raised={full} />
    </>
  );
}
