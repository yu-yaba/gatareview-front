'use client'
import Link from "next/link";
import { LectureData } from "../../_types/LectureData";
import { validateLecture, isEmptyObject } from "../../_helpers/helpers";
import { useState } from "react";
import { success } from "@/app/_helpers/notifications";
import { handleAjaxError } from "../../_helpers/helpers";
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
          <h3 className=" text-lg font-bold">空欄があります</h3>
          <ul className="ml-4 list-none">
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures`, {
        method: 'POST',
        body: JSON.stringify({ lecture: newLecture }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw Error(res.statusText);
      const data = await res.json();

      success('授業を登録しました');
      console.log(data)
      router.push(`/lectures/${data.id}`);

    } catch (error) {
      handleAjaxError('同じ授業がすでに登録されています。');
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
            <div className="flex relative w-full text-gray-600">
              <select
                id="faculty"
                name="faculty"
                value={lecture.faculty}
                onChange={handleInputChange}
                className="block appearance-none w-full p-3 border rounded-md shadow focus:border-green-500 cursor-pointer bg-white focus:shadow-outline">
                <option value="">学部で検索</option>
                <option value="G:教養科目">G:教養科目</option>
                <option value="H:人文学部">H:人文学部</option>
                <option value="K:教育学部">K:教育学部</option>
                <option value="L:法学部">L:法学部</option>
                <option value="E:経済科学部">E:経済科学部</option>
                <option value="S:理学部">S:理学部</option>
                <option value="M:医学部">M:医学部</option>
                <option value="D:歯学部">D:歯学部</option>
                <option value="T:工学部">T:工学部</option>
                <option value="A:農学部">A:農学部</option>
                <option value="X:創生学部">X:創生学部</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                </svg>
              </div>
            </div>
          </label>
        </div>
        <div className="flex my-6">
          <div className="flex justify-center w-full">
            <button type="submit" className="p-2 rounded-lg font-bold text-white w-3/12 mr-8 bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50">
              登録
            </button>
            <Link href="/lectures">
              <button type='button' className='p-2 px-4 rounded-lg shadow border-2 bg-white text-green-500'>
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



