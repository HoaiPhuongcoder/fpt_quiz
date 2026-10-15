import { migrateHashUrl, parsePath, routePath } from './router';

describe('parsePath', () => {
  it.each([
    ['', { name: 'home' }],
    ['/', { name: 'home' }],
    ['#/hoc', { name: 'study' }],
    ['/hoc', { name: 'study' }],
    ['/thi', { name: 'exam-setup' }],
    ['/lam-bai', { name: 'exam' }],
    ['/ket-qua/exam-1', { name: 'result', param: 'exam-1' }],
    ['/thu-vien', { name: 'library' }],
    ['/tim-kiem', { name: 'search' }],
    ['/ho-so', { name: 'profile' }],
    ['/cai-dat', { name: 'settings' }],
    ['/khong-co', { name: 'home' }],
  ])('%s', (path, route) => {
    expect(parsePath(path)).toEqual(route);
  });
});

describe('mã môn trong đường dẫn', () => {
  const IDS = ['hcm202', 'mln131'];
  it.each([
    ['/mln131/hoc', { subject: 'mln131', name: 'study' }],
    ['/mln131', { subject: 'mln131', name: 'home' }],
    ['/mln131/', { subject: 'mln131', name: 'home' }],
    ['/hcm202/ket-qua/exam-1', { subject: 'hcm202', name: 'result', param: 'exam-1' }],
    ['/hoc', { name: 'study' }],
    ['/xyz/hoc', { name: 'home' }],
  ])('%s', (path, route) => {
    expect(parsePath(path, IDS)).toEqual(route);
  });
  it('routePath là chiều ngược', () => {
    expect(routePath({ name: 'home' })).toBe('/');
    expect(routePath({ name: 'study' })).toBe('/hoc');
    expect(routePath({ name: 'result', param: 'exam-1' })).toBe('/ket-qua/exam-1');
  });
});

describe('migrateHashUrl', () => {
  it('link cũ có dấu # đổi sang đường dẫn sạch', () => {
    history.replaceState(null, '', '/#/mln131/thu-vien');
    migrateHashUrl();
    expect(location.pathname).toBe('/mln131/thu-vien');
    expect(location.hash).toBe('');
  });
  it('không đụng vào đường dẫn đã sạch', () => {
    history.replaceState(null, '', '/hcm202/hoc');
    migrateHashUrl();
    expect(location.pathname).toBe('/hcm202/hoc');
  });
});
