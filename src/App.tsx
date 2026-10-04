import { useEffect } from 'react';
import { useHashRoute, type Route } from './router';
import { useApp } from './store/appStore';
import { AppShell } from './components/AppShell';
import { Toaster } from './components/Toaster';
import { Home } from './screens/Home';
import { Study } from './screens/study/Study';
import { ExamSetup } from './screens/exam/ExamSetup';
import { Exam } from './screens/exam/Exam';
import { ExamResultScreen } from './screens/exam/ExamResult';
import { Library } from './screens/Library';
import { Profile } from './screens/Profile';
import { Settings } from './screens/settings/Settings';

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
    case 'profile':
      return <Profile />;
    case 'settings':
      return <Settings />;
    default:
      return <Home />;
  }
}

export function App() {
  const route = useHashRoute();
  const tick = useApp((s) => s.tick);
  const checkExamExpiry = useApp((s) => s.checkExamExpiry);

  useEffect(() => {
    const run = () => {
      tick();
      const r = checkExamExpiry();
      if (r) location.replace(`#/ket-qua/${r.id}`);
    };
    run();
    const t = setInterval(run, 10_000);
    return () => clearInterval(t);
  }, [tick, checkExamExpiry]);

  const full = route.name === 'study' || route.name === 'exam';
  return (
    <>
      {full ? <Screen route={route} /> : <AppShell active={route.name}><Screen route={route} /></AppShell>}
      <Toaster raised={full} />
    </>
  );
}
