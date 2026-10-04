import { useEffect } from 'react';
import { useHashRoute, type Route } from './router';
import { useApp } from './store/appStore';
import { AppShell } from './components/AppShell';
import { Toaster } from './components/Toaster';
import { Home } from './screens/Home';
import { Study } from './screens/study/Study';

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    // Task 11–14 thêm `case` cho từng màn hình vào đây.
    case 'study':
      return <Study />;
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
