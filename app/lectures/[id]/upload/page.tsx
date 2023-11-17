'use client'
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { handleAjaxError } from '../../../_helpers/helpers';
import { success } from '../../../_helpers/notifications';
import type { FileType } from '@/app/_types/FileType';
import { FileWithPath } from 'react-dropzone';
import { useRouter } from 'next/navigation';


const ImageUpload = ({ params }: { params: { id: number } }) => {
  const [uploadStatus] = useState('');
  const [files, setFiles] = useState<FileType[]>([]);
  const maxSize = 1048576; // 1MB bytes
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    acceptedFiles.forEach((file) => {
      if (file.size > maxSize) {
        handleAjaxError("1MB以下のファイルを選択してください");
      } else if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        handleAjaxError("画像ファイルを選択してください");
      } else {
        const newFile = {
          ...file,
          preview: URL.createObjectURL(file),
        };
        console.log(acceptedFiles)
        setFiles((prevFiles) => [...prevFiles, newFile]);
      }
    });
  }, []);


  const handleUpload = () => {
    files.forEach((file) => {
      if (file.size <= maxSize && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        const formData = new FormData();
        if (file instanceof File) {
          formData.append('lecture[image]', file);
          fetch(`${process.env.NEXT_PUBLIC_ENV}/api/v2/lectures/${params.id}/images`, {
            method: 'POST',
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              success('投稿しました');
              router.push(`/lectures/${params.id}`);
            })
            .catch((error) => {
              console.error(error);
              handleAjaxError('投稿に失敗しました');
            });
        } else {
          handleAjaxError('1MB以下の画像ファイルを選択してください');
        }
        console.log(formData)
      }
    });
  };
  useEffect(() => () => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
  }, [files]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: 'image/*, application/pdf' as any });

  return (
    <div className='flex flex-col items-center space-y-4'>
      <div {...getRootProps()} className="flex justify-center items-center w-10/12 md:w-8/12 2xl:w-6/12 h-64  border-2 border-dotted rounded p-4 text-center font-bold text-green-600 hover:bg-green-100 cursor-pointer">
        <input {...getInputProps()} />
        <p>ここにファイルをドラッグ&ドロップ、またはクリックしてファイルを選択してください。</p>
      </div>
      {uploadStatus && <p className='text-center font-bold text-green-600'>{uploadStatus}</p>} {/* アップロードのステータスを表示 */}
      <div className='flex justify-center'>
        <button type='button' onClick={handleUpload} className="bg-green-600 text-white py-2 px-4 rounded shadow-md hover:shadow-none active:translate-y-1 transition-transform duration-200">
          アップロード
        </button>
      </div>
      <div className='flex justify-center'>
        {files.map(file => {
          if (file && file.type && file.type.startsWith('image/')) {
            return <img src={file.preview} alt={file.name} key={file.name} className="w-1/2 h-1/2 object-cover" />;
          } if (file.type === 'application/pdf') {
            return <iframe src={file.preview} title={file.name} key={file.name} className="w-1/2 h-1/2 object-cover" />;
          }
          return null;
        })}
      </div>
    </div>
  );
};
export default ImageUpload;
