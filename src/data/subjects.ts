import hcm202 from './hcm202.json';
import mln131 from './mln131.json';
import type { Question } from '../domain/types';
import type { Subject } from '../domain/subject';

const chapters = (titles: string[]) => titles.map((title, i) => ({ id: i + 1, title }));

export const SUBJECTS: Subject[] = [
  {
    id: 'hcm202',
    code: 'HCM202',
    name: 'Tư tưởng Hồ Chí Minh',
    storagePrefix: 'hcm.v1',
    questions: hcm202 as unknown as Question[],
    chapters: chapters([
      'Khái niệm, đối tượng, phương pháp nghiên cứu và ý nghĩa học tập',
      'Cơ sở, quá trình hình thành và phát triển tư tưởng Hồ Chí Minh',
      'Độc lập dân tộc và chủ nghĩa xã hội',
      'Đảng Cộng sản Việt Nam và Nhà nước của nhân dân, do nhân dân, vì nhân dân',
      'Đại đoàn kết toàn dân tộc và đoàn kết quốc tế',
      'Văn hóa, đạo đức, con người',
    ]),
  },
  {
    id: 'mln131',
    code: 'MLN131',
    name: 'Chủ nghĩa xã hội khoa học',
    storagePrefix: 'quiz.v1.mln131',
    questions: mln131 as unknown as Question[],
    chapters: chapters([
      'Nhập môn chủ nghĩa xã hội khoa học',
      'Sứ mệnh lịch sử của giai cấp công nhân',
      'Chủ nghĩa xã hội và thời kỳ quá độ lên chủ nghĩa xã hội',
      'Dân chủ xã hội chủ nghĩa và Nhà nước xã hội chủ nghĩa',
      'Cơ cấu xã hội – giai cấp và liên minh giai cấp, tầng lớp trong thời kỳ quá độ',
      'Vấn đề dân tộc và tôn giáo trong thời kỳ quá độ',
      'Vấn đề gia đình trong thời kỳ quá độ',
    ]),
  },
];

export function subjectById(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}
