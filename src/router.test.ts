import { parseHash, routePath } from './router';

describe('parseHash', () => {
  it.each([
    ['', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/hoc', { name: 'study' }],
    ['#/thi', { name: 'exam-setup' }],
    ['#/lam-bai', { name: 'exam' }],
    ['#/ket-qua/exam-1', { name: 'result', param: 'exam-1' }],
    ['#/thu-vien', { name: 'library' }],
    ['#/tim-kiem', { name: 'search' }],
    ['#/ho-so', { name: 'profile' }],
    ['#/cai-dat', { name: 'settings' }],
    ['#/khong-co', { name: 'home' }],
  ])('%s', (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });
});

describe('mã môn trong hash', () => {
  const IDS = ['hcm202', 'mln131'];
  it.each([
    ['#/mln131/hoc', { subject: 'mln131', name: 'study' }],
    ['#/mln131', { subject: 'mln131', name: 'home' }],
    ['#/mln131/', { subject: 'mln131', name: 'home' }],
    ['#/hcm202/ket-qua/exam-1', { subject: 'hcm202', name: 'result', param: 'exam-1' }],
    ['#/hoc', { name: 'study' }],
    ['#/xyz/hoc', { name: 'home' }],
  ])('%s', (hash, route) => {
    expect(parseHash(hash, IDS)).toEqual(route);
  });
  it('routePath là chiều ngược', () => {
    expect(routePath({ name: 'home' })).toBe('/');
    expect(routePath({ name: 'study' })).toBe('/hoc');
    expect(routePath({ name: 'result', param: 'exam-1' })).toBe('/ket-qua/exam-1');
  });
});
