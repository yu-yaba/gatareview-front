import { error } from "./notifications";
import { LectureData } from "../_types/LectureData";
import { ReviewData } from "../_types/ReviewData";
import { ReviewErrors } from "../_types/ReviewError";
import { LectureErrors } from "../_types/LectureErrors";

export const isEmptyObject = (obj: Record<string, any>): boolean => {
  for (let key in obj) {
    if (obj[key] !== "") {
      return false;
    }
  }
  return true;
};

export const validateLecture = (lecture: LectureData) => {
  const LectureErrors: LectureErrors = {
    title: "",
    lecturer: "",
    faculty: ""
  };

  if (lecture.title === '') {
    LectureErrors.title = '授業名を入力してください';
  } else if (lecture.title.length > 25) {
    LectureErrors.title = '授業名は25文字以内で入力してください';
  }

  if (lecture.lecturer === '') {
    LectureErrors.lecturer = '教授/講師名を入力してください';
  } else if (lecture.lecturer.length > 15) {
    LectureErrors.lecturer = '教授/講師名は15文字以内で入力してください';
  }

  if (lecture.faculty === '') {
    LectureErrors.faculty = '開講番号:学部を入力してください';
  }

  return LectureErrors;
};

export const validateReview = (review: ReviewData) => {
  const ReviewErrors: ReviewErrors = {
    period_year: "",
    period_term: "",
    textbook: "",
    attendance: "",
    grading_type: "",
    content_difficulty: "",
    content_quality: "",
    content: ""
  }; // 空のオブジェクトを作成し、エラーがある場合にエラーメッセージを格納する

  // ReactStars（rating）は必須 - デフォルトで3に設定されているので、特別なバリデーションは不要

  // コメントのみ必須
  if (review.content === '') {
    ReviewErrors.content = 'コメントを入力してください';
  } else if (review.content.length < 20) {
    ReviewErrors.content = 'コメントは20文字以上400文字以内で入力してください';
  } else if (review.content.length > 400) {
    ReviewErrors.content = 'コメントは20文字以上400文字以内で入力してください';
  }

  return ReviewErrors;
};

export const handleAjaxError = (err: string) => {
  error(err);
  console.error(err);
};