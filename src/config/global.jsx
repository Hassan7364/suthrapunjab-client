import { message } from "antd";

window.toastify = (msg, type) => message[type](msg);

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

window.isValidEmail = (email) => emailRegex.test(email);

window.getRandomId = () => Math.random().toString(36).slice(2);
