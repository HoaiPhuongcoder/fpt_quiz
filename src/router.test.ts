import { parseHash } from './router';

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
