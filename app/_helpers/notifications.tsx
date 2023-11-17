import { toast, ToastOptions, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// こちらは position を直接 'top-right' として設定しています。
const defaults: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  transition: Flip,
};

export const success = (message: string, options: ToastOptions = {}) => {
  toast.success(message, { ...defaults, ...options });
};

export const info = (message: string, options: ToastOptions = {}) => {
  toast.info(message, { ...defaults, ...options });
};

export const warn = (message: string, options: ToastOptions = {}) => {
  toast.warn(message, { ...defaults, ...options });
};

export const error = (message: string, options: ToastOptions = {}) => {
  toast.error(message, { ...defaults, ...options });
};
