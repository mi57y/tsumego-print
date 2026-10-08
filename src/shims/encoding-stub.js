export const detect = () => ({ encoding: "UTF-8" });
export const encodingExists = () => true;
export const decode = (buffer) => buffer.toString();
export const encode = (str) => str;
