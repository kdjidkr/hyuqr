// 도메인 엔티티: 한양대 ERICA 공식 인스타그램 계정 목록 및 프로필 정보
export const INSTA_ACCOUNTS = {
  erica: [
    { username: 'hanyang_erica',                   desc: '한양대학교 ERICA 공식 인스타그램' },
    { username: 'hanyang_erica_stu',               desc: 'ERICA 총학생회' },
    { username: 'hanyang_erica_club_association',  desc: '총동아리연합회' },
    { username: 'hyuerica',                        desc: '학술정보관' },
    { username: 'hanyangerica',                    desc: '사랑한대' },
  ],
  college: [
    { username: 'hyu_lions',                    desc: 'LIONS 칼리지 학생회' },
    { username: 'hyu_soongan_',                 desc: '커뮤니케이션&컬쳐대학' },
    { username: 'hyu_erica_eng',                desc: '공학대학' },
    { username: 'hypharmacy',                   desc: '약학대학' },
    { username: 'design_hyu',                   desc: '디자인대학' },
    { username: 'hanyang_gon',                  desc: '글로벌문화통상대학' },
    { username: 'hyu_mood',                     desc: '경상대학' },
    { username: 'hyu_computing',                desc: '소프트웨어융합대학' },
    { username: 'hyu_e_sports_and_arts_vibe',   desc: '예체능대학' },
    { username: 'hyu_erica_atc',                desc: '첨단융합대학' },
  ],
};

export const createInstagramProfile = ({ username, fullName, profilePicUrl, desc = '' }) => ({
  username,
  fullName,
  profilePicUrl,
  desc,
});
