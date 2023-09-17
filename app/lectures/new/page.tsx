'use client'
import Link from "next/link";
import { LectureData } from "../../types/LectureData";
import { validateLecture, isEmptyObject } from "../../helpers/helpers";
import { useState } from "react";
import { error, success } from "@/app/helpers/notifications";
import { handleAjaxError } from "../../helpers/helpers";
import { useRouter } from "next/navigation";


const LectureForm = () => {
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
      <div className="flex justify-center">
        <div className=" text-red-500 ">
          <h3>空欄があります</h3>
          <ul className=" list-disc">
            {Object.values(formErrors).map((formError: string, index: number) => (
              <li key={index}>{formError}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const addLecture = async (newLecture: LectureData) => {
    try {
      const res = await fetch(`https://gatareview-back-b726b6ea4bcf.herokuapp.com/api/v2/lectures`, {
        method: 'POST',
        body: JSON.stringify({ lecture: newLecture }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMessage = data.error || res.statusText;

        if (errorMessage === 'A similar lecture already exists') {
          error('同じ授業がすでに登録されています');
          return;
        }

        throw Error(errorMessage);
      }

      success('授業を登録しました');
      router.push(`/lectures/${data.id}`);
    } catch (error) {
      handleAjaxError('授業の登録に失敗しました');
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
    <section className="flex flex-col items-center p-8">
      <h2 className="text-2xl font-bold mb-4 2xl:text-4xl">授業を登録</h2>
      {renderErrors()}
      <form onSubmit={handleSubmit} className="flex flex-col w-10/12  md:w-8/12 2xl:w-5/12">
        <div className="mb-8 flex flex-col">
          <label htmlFor="rating" className="block text-bold">
            <div className="flex justify-start">
              <p className="font-bold mb-2">授業名</p>
            </div>
            <input type='text' id="title" name="title" placeholder='入力してください'
              onChange={handleInputChange} value={lecture.title}
              className="w-full p-3 border rounded-md shadow focus:border-green-500" />
          </label>
        </div>
        <div className="mb-12 2xl:mb-14">
          <label htmlFor="rating" className="block text-bold">
            <div className="flex justify-start">
              <p className="font-bold mb-2">教授名</p>
            </div>
            <input type="text" id="lecturer" name="lecturer" placeholder='入力してください'
              onChange={handleInputChange} value={lecture.lecturer}
              className="w-full p-3 border rounded-md shadow focus:border-green-500" />
          </label>
        </div>
        <div className="mb-12 2xl:mb-14">
          <label htmlFor="rating" className="block text-bold">
            <div className="flex">
              <p className="font-bold mb-2">開講番号:学部</p>
            </div>
            <select id="faculty" name="faculty"
              onChange={handleInputChange} value={lecture.faculty}
              className="w-full p-3 border rounded-md shadow focus:border-green-500">
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
        <div className="flex my-6">
          <div className="flex justify-center w-full">
            <button type="submit" className="p-2 rounded-lg font-bold text-white w-3/12 mr-8 bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50">
              登録
            </button>
            <Link href="/lectures">
              <button type='button' className='p-2 rounded-lg shadow border-2 bg-white text-green-500'>
                キャンセル
              </button>
            </Link>
          </div>
        </div>
      </form>
    </section >
  );
};

export default LectureForm;



