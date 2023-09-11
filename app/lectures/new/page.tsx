'use client'
import Link from "next/link";
import { LectureData } from "../../types/LectureData";
import { validateLecture, isEmptyObject } from "../../helpers/helpers";
import { useState } from "react";
import { error, success } from "@/app/helpers/notifications";
import { handleAjaxError } from "../../helpers/helpers";
import { useRouter } from "next/navigation";


const LectureForm = ({ onSave }: { onSave: (lecture: LectureData) => void }) => {
  const [lecture, setLecture] = useState({
    title: '',
    lecturer: '',
    faculty: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const router = useRouter()

  const updateLecture = (name: string, value: string) => {
    setLecture((prevLecture) => ({ ...prevLecture, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { target } = e;
    const { name } = target;
    const { value } = target;

    updateLecture(name, value);
  };

  const renderErrors = () => {
    if (isEmptyObject(formErrors)) {
      return null;
    }

    return (
      <div className="errors">
        <h3>空欄があります</h3>
        <ul>
          {Object.values(formErrors).map((formError: string, index: number) => (
            <li key={index}>{formError}</li>
          ))}
        </ul>
      </div>
    );
  };

  const addLecture = async (newLecture: LectureData) => {
    try {
      const res = await fetch('http://localhost:3000/api/v2/lectures', {
        method: 'POST',
        body: JSON.stringify({ lecture: newLecture }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json(); // 常にJSONを解析
      if (!res.ok) {
        const errorMessage = data.error || res.statusText;

        if (errorMessage === 'A similar lecture already exists') {
          error('同じ授業がすでに登録されています'); // ここでreact-toastifyのerror関数を呼び出す
          return; // 以降のエラーハンドリングをスキップ
        }

        throw Error(errorMessage);
      }

      success('授業を登録しました');
      router.push(`/lectures/${data.id}`);
    } catch (error) {
      handleAjaxError('授業の登録に失敗しました'); // 共通のエラーハンドリング
    }
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement | HTMLSelectElement>) => {
    e.preventDefault();
    const errors = validateLecture(lecture);

    if (!isEmptyObject(errors)) {
      setFormErrors(errors);
    } else {
      addLecture(lecture)
      console.log(lecture)
    }
  };



  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">新しく講義を登録</h2>
      {renderErrors()}
      <form onSubmit={handleSubmit} className="flex flex-col p-4">
        <div className="mb-4">
          <label htmlFor="title" className="block text-bold">
            <p className="font-bold">授業名</p>
            <input type='text' id="title" name="title" placeholder='入力してください' onChange={handleInputChange} value={lecture.title} className="mt-2 p-2 w-3/4 border rounded shadow-sm focus:border-green-500" />
          </label>
        </div>
        <div className="mb-4">
          <label htmlFor="lecturer" className="block text-bold">
            <p className="font-bold">教授/講師名</p>
            <input type="text" id="lecturer" name="lecturer" placeholder='入力してください' onChange={handleInputChange} value={lecture.lecturer} className="mt-2 p-2 w-3/4 border rounded shadow-sm focus:border-green-500" />
          </label>
        </div>
        <div className="mb-4">
          <label htmlFor="faculty" className="block text-bold">
            <p className="font-bold">開講番号:学部</p>
            <select id="faculty" name="faculty" onChange={handleInputChange} value={lecture.faculty} className="mt-2 p-2 w-3/5 border rounded shadow-sm focus:border-green-500">
              <option value="">選択してください</option>
              <option value="G: 教養科目">G: 教養科目</option>
              <option value="H: 人文学部">H: 人文学部</option>
              <option value="K: 教育学部">K: 教育学部</option>
              <option value="L: 法学部">L: 法学部</option>
              <option value="E: 経済科学部">E: 経済科学部</option>
              <option value="S: 理学部">S: 理学部</option>
              <option value="M: 医学部">M: 医学部</option>
              <option value="D: 歯学部">D: 歯学部</option>
              <option value="T: 工学部">T: 工学部</option>
              <option value="A: 農学部">A: 農学部</option>
              <option value="X: 創生学部">X: 創生学部</option>
            </select>
          </label>
        </div>
        <div className="flex mb-4">
          <button type="submit" className="p-2 rounded text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50">
            登録
          </button>
          <Link href="/lectures">
            <button type='button' className='ml-2 p-2 rounded bg-white text-green-500'>
              キャンセル
            </button>
          </Link>
        </div>
      </form>
    </section>
  );
};

export default LectureForm;

