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

  if (review.period_year === '') {
    ReviewErrors.period_year = '授業を受講した年を入力してください';
  }

  if (review.period_term === '') {
    ReviewErrors.period_term = '授業を受講したタームを入力してください';
  }

  if (review.textbook === '') {
    ReviewErrors.textbook = '教科書の有無を入力してください';
  }

  if (review.attendance === '') {
    ReviewErrors.attendance = '出席確認の有無を入力してください';
  }

  if (review.grading_type === '') {
    ReviewErrors.grading_type = '採点方法を入力してください';
  }

  if (review.content_difficulty === '') {
    ReviewErrors.content_difficulty = '単位取得の難易度を入力してください';
  }

  if (review.content_quality === '') {
    ReviewErrors.content_quality = '内容の充実度を入力してください';
  }

  if (review.content === '') {
    ReviewErrors.content = 'コメントを入力してください';
  } else if (review.content.length > 150) {
    ReviewErrors.content = 'コメントは150文字以内で入力してください'
  }


  return ReviewErrors;
};

export const handleAjaxError = (err: string) => {
  error(err);
  console.error(err);
};