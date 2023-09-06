import { toast, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// デフォルト設定を定義することで、定型文を削減できる
const defaults = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  transition: Flip,
};

// optionsのデフォルトは空であり、関数を呼び出す時にObject.assignでdefaultsとoptionsをマージする
export const success = (message, options = {}) => {
  toast.success(message, Object.assign(defaults, options));
};

export const info = (message, options = {}) => {
  toast.info(message, Object.assign(defaults, options));
};

export const warn = (message, options = {}) => {
  toast.warn(message, Object.assign(defaults, options));
};

export const error = (message, options = {}) => {
  toast.error(message, Object.assign(defaults, options));
};