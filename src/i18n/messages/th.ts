import type { Messages } from "@/i18n/messages/en";

export const th: Messages = {
  nav: {
    brand: "เรซูเม่",
    experience: "ประสบการณ์",
    projects: "โปรเจกต์",
    skills: "ทักษะ",
    about: "เกี่ยวกับ",
    pdf: "PDF",
    settings: "ตั้งค่า",
  },
  hero: {
    emailMe: "ส่งอีเมล",
    github: "GitHub",
  },
  sections: {
    experience: { eyebrow: "เส้นทางอาชีพ", title: "ประสบการณ์ทำงาน" },
    projects: { eyebrow: "ผลงานเด่น", title: "โปรเจกต์", live: "ออนไลน์" },
    skills: { eyebrow: "เครื่องมือ", title: "ทักษะทางเทคนิค" },
    education: { eyebrow: "พื้นฐาน", title: "การศึกษา", gpax: "GPAX" },
    activities: { eyebrow: "ชีวิตรั้วมหาวิทยาลัย", title: "กิจกรรม" },
    interests: { eyebrow: "นอกเวลางาน", title: "ความสนใจ" },
  },
  footer: {
    blurb: "สแกน QR หรือแชร์หน้านี้ได้ หากต้องการแบบกระดาษ เปิดดู PDF ได้เลย",
    viewPdf: "ดู PDF",
    github: "GitHub",
    editData: "แก้ไขข้อมูล",
    settings: "ตั้งค่า",
    scanToOpen: "สแกนเพื่อเปิด",
    qrAlt: "คิวอาร์โค้ดสำหรับเปิดเว็บเรซูเม่นี้",
  },
  settings: {
    eyebrow: "การตั้งค่า",
    title: "ตั้งค่า",
    blurb:
      "ภาษาจะถูกบันทึกเฉพาะบนอุปกรณ์นี้ เบราว์เซอร์หรือเครื่องอื่นจะมีค่าของตัวเอง",
    backHome: "← กลับไปเรซูเม่",
    language: {
      title: "ภาษา",
      description: "เลือกภาษาสำหรับเว็บไซต์นี้บนอุปกรณ์นี้",
    },
  },
  common: {
    loadingResume: "กำลังโหลดเรซูเม่…",
  },
  edit: {
    eyebrow: "ตัวแก้ไขเนื้อหา",
    title: "แก้ไขข้อมูลเรซูเม่",
    blurbPrefix: "เลย์เอาต์ฟอร์มถูกกำหนดโดย",
    blurbSuffix: " ค่าจะถูกบันทึกผ่าน API และอัปเดตหน้าเว็บกับ PDF",
    persistenceReady:
      "การกดบันทึกจะเก็บร่างไว้ก่อน ยังไม่เผยแพร่จนกว่าจะทำครบหรือเลือกบันทึกเฉพาะภาษานี้",
    persistenceUnavailable:
      "โฮสต์นี้ยังไม่ได้ตั้งค่าที่เก็บถาวร การบันทึกขั้นสุดท้ายจะดาวน์โหลดไฟล์ JSON แทน",
    lockEditor: "ล็อกตัวแก้ไข",
    save: "บันทึก",
    saving: "กำลังบันทึก…",
    downloadJson: "ดาวน์โหลด JSON",
    previewPdf: "ดูตัวอย่าง PDF",
    editingLocale: "กำลังแก้ไข",
    otherLanguagesTitle: "ต้องการแก้ไขภาษาอื่นด้วยหรือไม่?",
    otherLanguagesBlurb:
      "เลือกภาษาอื่นที่ต้องการแก้ไขต่อ ยังไม่มีการบันทึกจริงจนกว่าจะทำครบทั้งกระบวนการ — หรือเลือกบันทึกเฉพาะภาษานี้",
    selectLanguages: "ภาษาที่ต้องการแก้ไข",
    continueToOther: "ดำเนินการต่อ",
    saveThisOnly: "ไม่ บันทึกเฉพาะภาษานี้",
    cancel: "ยกเลิก",
    selectAtLeastOne: "เลือกอย่างน้อยหนึ่งภาษา",
    reviewTitle: "แปล / อัปเดตภาษาอื่น",
    reviewSource: "ต้นทาง (อ่านอย่างเดียว)",
    reviewTarget: "กำลังแก้ไข",
    reviewQueue: "ภาษาที่ยังต้องแก้",
    reviewDone: "เผยแพร่ทุกภาษา",
    reviewNext: "บันทึกแล้วไปภาษาถัดไป",
    reviewAbandon: "ทิ้งการเปลี่ยนแปลงทั้งหมด",
    reviewHint:
      "ด้านซ้ายคือภาษาที่แก้ไปแล้ว ด้านขวาคือภาษาที่เลือกไว้ หากออกกลางคันจะไม่มีการเผยแพร่ใดๆ",
    fieldChanged: "เปลี่ยนในภาษาต้นทางจาก stage เดิมก่อนแก้",
    fieldChangedLegend:
      "กรอบแดง + ! หมายถึงช่องที่ภาษาซ้าย (ต้นทาง) เปลี่ยนจากค่าเดิมก่อนเริ่มแก้",
    itemRemoved: "ลบแล้ว",
    itemAdded: "ใหม่",
    published: "เผยแพร่แล้ว",
    noDraft: "ไม่พบร่างที่กำลังแก้ไข เริ่มจากหน้าแก้ไข",
    backToEditor: "← กลับไปหน้าแก้ไข",
  },
  a11y: {
    language: "ภาษา",
    settings: "เปิดการตั้งค่า",
  },
};
